'use client';

import { useEffect, useMemo, useState } from 'react';

function toApiDate(value) {
  if (!value) return '';
  const [year, month, day] = value.split('-');
  return `${day}/${month}/${year}`;
}

function todayInput() {
  const d = new Date();
  const year = d.getFullYear();
  const month = String(d.getMonth() + 1).padStart(2, '0');
  const day = String(d.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
}

function firstDayOfMonthInput() {
  const d = new Date();
  const year = d.getFullYear();
  const month = String(d.getMonth() + 1).padStart(2, '0');
  return `${year}-${month}-01`;
}

function money(value) {
  return new Intl.NumberFormat('el-GR', {
    style: 'currency',
    currency: 'EUR',
  }).format(Number(value || 0));
}

function parseXmlBody(body) {
  const parser = new DOMParser();
  let xml = parser.parseFromString(body, 'application/xml');

  if (xml.querySelector('parsererror')) {
    throw new Error('Η απάντηση της ΑΑΔΕ δεν μπόρεσε να διαβαστεί.');
  }

  if (xml.documentElement?.localName === 'string') {
    const innerXml = xml.documentElement.textContent?.trim();
    if (innerXml) {
      xml = parser.parseFromString(innerXml, 'application/xml');
      if (xml.querySelector('parsererror')) {
        throw new Error('Το αναλυτικό XML της ΑΑΔΕ δεν μπόρεσε να διαβαστεί.');
      }
    }
  }

  return xml;
}

function getText(parent, tagName) {
  if (!parent) return '';
  const byNs = parent.getElementsByTagNameNS('*', tagName);
  if (byNs?.length) return byNs[0]?.textContent?.trim() || '';
  const normal = parent.getElementsByTagName(tagName);
  return normal[0]?.textContent?.trim() || '';
}

function firstNode(parent, tagName) {
  if (!parent) return null;
  const byNs = parent.getElementsByTagNameNS('*', tagName);
  if (byNs?.length) return byNs[0];
  const normal = parent.getElementsByTagName(tagName);
  return normal[0] || null;
}

function parseDetailedInvoiceForList(invoice, fallback = {}) {
  const issuer = firstNode(invoice, 'issuer');
  const header = firstNode(invoice, 'invoiceHeader');
  const summary = firstNode(invoice, 'invoiceSummary');
  const mark = getText(invoice, 'mark');
  const issuerVat = getText(issuer, 'vatNumber') || fallback.counterVatNumber || '';
  const issueDate = getText(header, 'issueDate') || fallback.issueDate || '';
  const invType = getText(header, 'invoiceType') || fallback.invType || '';
  return {
    id: mark || `${issuerVat}-${issueDate}-${getText(header, 'series')}-${getText(header, 'aa')}`,
    counterVatNumber: issuerVat,
    issuerName: getText(issuer, 'name') || getText(issuer, 'companyName') || '',
    issueDate, invType,
    series: getText(header, 'series'),
    aa: getText(header, 'aa'),
    netValue: Number(getText(summary, 'totalNetValue') || 0),
    vatAmount: Number(getText(summary, 'totalVatAmount') || 0),
    grossValue: Number(getText(summary, 'totalGrossValue') || 0),
    count: '1', minMark: mark, maxMark: mark, mark, isDetailed: true,
  };
}

export default function MyDataStudio({ supabase, suppliers = [], inventory = [], onInventoryChanged }) {
  const [activeCategory, setActiveCategory] = useState('expenses');
  const [incomeDocuments, setIncomeDocuments] = useState([]);
  const [incomeLoading, setIncomeLoading] = useState(false);
  const [incomeError, setIncomeError] = useState('');
  const [incomeSearch, setIncomeSearch] = useState('');
  const [incomeLoaded, setIncomeLoaded] = useState(false);
  const [incomeSelected, setIncomeSelected] = useState(null);
  const [dateFrom, setDateFrom] = useState(firstDayOfMonthInput());
  const [dateTo, setDateTo] = useState(todayInput());
  const [documents, setDocuments] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [lastUpdate, setLastUpdate] = useState(null);
  const [search, setSearch] = useState('');

  const [selectedDocument, setSelectedDocument] = useState(null);
  const [detailsLoading, setDetailsLoading] = useState(false);
  const [detailsError, setDetailsError] = useState('');
  const [materialsLoading, setMaterialsLoading] = useState(false);
  const [materialsError, setMaterialsError] = useState('');
  const [materialsRaw, setMaterialsRaw] = useState('');
  const [materials, setMaterials] = useState([]);
  const [supplierMappings, setSupplierMappings] = useState([]);
  const [mappingLoading, setMappingLoading] = useState(false);
  const [mappingError, setMappingError] = useState('');
  const [localInventory, setLocalInventory] = useState(inventory);
  const [savingLine, setSavingLine] = useState('');
  const [purchaseSaving, setPurchaseSaving] = useState(false);
  const [purchaseMessage, setPurchaseMessage] = useState('');
  const [localSuppliers, setLocalSuppliers] = useState(suppliers);
  const [supplierSaving, setSupplierSaving] = useState(false);
  const [supplierMessage, setSupplierMessage] = useState('');

  useEffect(() => { setLocalSuppliers(suppliers); }, [suppliers]);

  function supplierByVat(vat) {
    return localSuppliers.find((item) => String(item.afm || '').trim() === String(vat || '').trim());
  }

  function supplierNameByVat(vat) {
    return supplierByVat(vat)?.name || '';
  }

  useEffect(() => {
    setLocalInventory(inventory);
  }, [inventory]);

  async function loadSupplierMappings(supplierVat, parsedMaterials, supplierOverride = null) {
    if (!supabase || !supplierVat || !Array.isArray(parsedMaterials)) return;

    try {
      setMappingLoading(true);
      setMappingError('');

      const supplier = supplierOverride || localSuppliers.find(
        (item) => String(item.afm || '').trim() === String(supplierVat).trim()
      );

      if (!supplier) {
        setSupplierMappings([]);
        setMappingError(`Ο προμηθευτής με ΑΦΜ ${supplierVat} δεν βρέθηκε στους Προμηθευτές.`);
        return;
      }

      const { data, error: mappingsError } = await supabase
        .from('inventory_supplier_mappings')
        .select('*')
        .eq('supplier_id', supplier.id)
        .eq('is_deleted', false);

      if (mappingsError) throw mappingsError;

      const mappings = data || [];

      setSupplierMappings(
        parsedMaterials.map((line) => {
          const mapping = mappings.find(
            (item) =>
              String(item.supplier_item_code || '').trim() ===
              String(line.itemCode || '').trim()
          );

          return {
            lineNumber: line.lineNumber,
            supplierId: supplier.id,
            mappingId: mapping?.id || null,
            inventoryItemId: mapping?.inventory_item_id || '',
          };
        })
      );
    } catch (err) {
      console.error('supplier mappings:', err);
      setSupplierMappings([]);
      setMappingError('Δεν ήταν δυνατή η ανάγνωση των αντιστοιχίσεων αποθήκης.');
    } finally {
      setMappingLoading(false);
    }
  }

  async function saveMaterialMapping(line, inventoryItemId) {
    if (!supabase || !inventoryItemId) return;

    const row = supplierMappings.find(
      (item) => item.lineNumber === line.lineNumber
    );

    if (!row?.supplierId) {
      setMappingError('Δεν βρέθηκε ο προμηθευτής για να αποθηκευτεί η αντιστοίχιση.');
      return;
    }

    try {
      setSavingLine(line.lineNumber);
      setMappingError('');

      let savedMapping;

      if (row.mappingId) {
        const { data, error: updateError } = await supabase
          .from('inventory_supplier_mappings')
          .update({
            inventory_item_id: inventoryItemId,
            supplier_item_code: line.itemCode || null,
            supplier_item_description: line.itemDescr || null,
            updated_at: new Date().toISOString(),
            is_deleted: false,
          })
          .eq('id', row.mappingId)
          .select()
          .single();

        if (updateError) throw updateError;
        savedMapping = data;
      } else {
        const { data, error: insertError } = await supabase
          .from('inventory_supplier_mappings')
          .insert({
            inventory_item_id: inventoryItemId,
            supplier_id: row.supplierId,
            supplier_item_code: line.itemCode || null,
            supplier_item_description: line.itemDescr || null,
            is_deleted: false,
          })
          .select()
          .single();

        if (insertError) throw insertError;
        savedMapping = data;
      }

      setSupplierMappings((current) =>
        current.map((item) =>
          item.lineNumber === line.lineNumber
            ? {
                ...item,
                mappingId: savedMapping?.id || item.mappingId,
                inventoryItemId,
              }
            : item
        )
      );
    } catch (err) {
      console.error('save material mapping:', err);
      setMappingError('Δεν αποθηκεύτηκε η αντιστοίχιση του υλικού.');
    } finally {
      setSavingLine('');
    }
  }

  async function createInventoryMaterial(line) {
    if (!supabase) return;

    const row = supplierMappings.find(
      (item) => item.lineNumber === line.lineNumber
    );

    if (!row?.supplierId) {
      setMappingError('Δεν βρέθηκε ο προμηθευτής για να δημιουργηθεί το υλικό.');
      return;
    }

    const itemName = window.prompt(
      'Όνομα υλικού στην Αποθήκη:',
      line.itemDescr || ''
    );

    if (!itemName?.trim()) return;

    const unit = window.prompt(
      'Μονάδα μέτρησης (π.χ. τεμ., κουτί, m, m²):',
      'τεμ.'
    );

    if (unit === null) return;

    try {
      setSavingLine(line.lineNumber);
      setMappingError('');

      const { data: createdItem, error: itemError } = await supabase
        .from('inventory')
        .insert({
          item_name: itemName.trim(),
          category: '',
          unit: unit.trim() || 'τεμ.',
          min_quantity: 0,
          purchase_price: Number(line.unitPrice || 0),
          notes: `Δημιουργήθηκε από myDATA. Κωδικός προμηθευτή: ${line.itemCode || '-'}`,
        })
        .select()
        .single();

      if (itemError) throw itemError;

      const { data: createdMapping, error: mappingInsertError } = await supabase
        .from('inventory_supplier_mappings')
        .insert({
          inventory_item_id: createdItem.id,
          supplier_id: row.supplierId,
          supplier_item_code: line.itemCode || null,
          supplier_item_description: line.itemDescr || null,
          is_deleted: false,
        })
        .select()
        .single();

      if (mappingInsertError) {
        await supabase.from('inventory').delete().eq('id', createdItem.id);
        throw mappingInsertError;
      }

      setLocalInventory((current) => [...current, createdItem]);

      setSupplierMappings((current) =>
        current.map((item) =>
          item.lineNumber === line.lineNumber
            ? {
                ...item,
                mappingId: createdMapping.id,
                inventoryItemId: createdItem.id,
              }
            : item
        )
      );
    } catch (err) {
      console.error('create inventory material:', err);
      setMappingError('Δεν δημιουργήθηκε το νέο υλικό στην Αποθήκη.');
    } finally {
      setSavingLine('');
    }
  }

  async function registerPurchaseInInventory() {
    if (!supabase || !selectedDocument || materials.length === 0) return;

    const mappedLines = materials
      .map((line) => {
        const mapping = supplierMappings.find(
          (item) => item.lineNumber === line.lineNumber
        );

        return {
          ...line,
          inventoryItemId: mapping?.inventoryItemId || '',
          supplierId: mapping?.supplierId || null,
        };
      })
      .filter((line) => line.inventoryItemId && Number(line.quantity || 0) > 0);

    if (mappedLines.length === 0) {
      setPurchaseMessage('⚠️ Δεν υπάρχει ακόμη κανένα αντιστοιχισμένο υλικό.');
      return;
    }

    const unmappedCount = materials.filter((line) => {
      const mapping = supplierMappings.find(
        (item) => item.lineNumber === line.lineNumber
      );
      return !mapping?.inventoryItemId;
    }).length;

    if (unmappedCount > 0) {
      const proceed = window.confirm(
        `Υπάρχουν ${unmappedCount} γραμμές χωρίς αντιστοίχιση. ` +
        `Θα καταχωρηθούν μόνο οι ${mappedLines.length} αντιστοιχισμένες γραμμές. Συνέχεια;`
      );
      if (!proceed) return;
    }

    try {
      setPurchaseSaving(true);
      setPurchaseMessage('');

      const mark = String(selectedDocument.mark || '');
      if (!mark) {
        throw new Error('Δεν βρέθηκε MARK παραστατικού.');
      }

      const lineNumbers = mappedLines
        .map((line) => Number(line.lineNumber))
        .filter((value) => Number.isInteger(value));

      const { data: existingRows, error: existingError } = await supabase
        .from('inventory_movements')
        .select('mydata_line_number')
        .eq('mydata_mark', mark)
        .in('mydata_line_number', lineNumbers);

      if (existingError) throw existingError;

      const alreadySaved = new Set(
        (existingRows || []).map((row) => Number(row.mydata_line_number))
      );

      const newLines = mappedLines.filter(
        (line) => !alreadySaved.has(Number(line.lineNumber))
      );

      if (newLines.length === 0) {
        setPurchaseMessage('✅ Οι συγκεκριμένες γραμμές έχουν ήδη καταχωρηθεί στην Αποθήκη.');
        return;
      }

      const movements = newLines.map((line) => ({
        item_id: line.inventoryItemId,
        movement_date: selectedDocument.issueDate,
        movement_type: 'PURCHASE',
        quantity: Number(line.quantity || 0),
        unit_price: Number(Number(line.unitPrice || 0).toFixed(4)),
        supplier_id: line.supplierId,
        notes: `Αγορά από myDATA • MARK ${mark} • γραμμή ${line.lineNumber}`,
        mydata_mark: mark,
        mydata_line_number: Number(line.lineNumber),
      }));

      const { error: insertError } = await supabase
        .from('inventory_movements')
        .insert(movements);

      if (insertError) throw insertError;

      // Keep the material master purchase price tidy and current.
      for (const line of newLines) {
        await supabase
          .from('inventory')
          .update({
            purchase_price: Number(Number(line.unitPrice || 0).toFixed(2)),
          })
          .eq('id', line.inventoryItemId);
      }

      setLocalInventory((current) =>
        current.map((item) => {
          const line = newLines.find(
            (entry) => entry.inventoryItemId === item.id
          );
          return line
            ? {
                ...item,
                purchase_price: Number(Number(line.unitPrice || 0).toFixed(2)),
              }
            : item;
        })
      );

      if (typeof onInventoryChanged === 'function') {
        await onInventoryChanged();
      }

      setPurchaseMessage(
        `✅ Καταχωρήθηκαν ${newLines.length} γραμμές αγοράς στην Αποθήκη.` +
        (alreadySaved.size > 0
          ? ` ${alreadySaved.size} υπήρχαν ήδη και δεν ξαναπεράστηκαν.`
          : '')
      );
    } catch (err) {
      console.error('register myDATA purchase:', err);
      setPurchaseMessage(
        `❌ Δεν ολοκληρώθηκε η καταχώρηση αγοράς${err?.message ? `: ${err.message}` : '.'}`
      );
    } finally {
      setPurchaseSaving(false);
    }
  }

  function parseIncomeInvoice(invoice) {
    const counterpart = firstNode(invoice, 'counterpart');
    const header = firstNode(invoice, 'invoiceHeader');
    const summary = firstNode(invoice, 'invoiceSummary');
    const mark = getText(invoice, 'mark');
    const uid = getText(invoice, 'uid');
    return {
      id: mark || uid || `${getText(header, 'issueDate')}-${getText(header, 'series')}-${getText(header, 'aa')}`,
      mark,
      minMark: mark,
      maxMark: mark,
      counterVatNumber: getText(counterpart, 'vatNumber'),
      customerName: getText(counterpart, 'name') || getText(counterpart, 'companyName'),
      issueDate: getText(header, 'issueDate'),
      invType: getText(header, 'invoiceType'),
      series: getText(header, 'series'),
      aa: getText(header, 'aa'),
      netValue: Number(getText(summary, 'totalNetValue') || 0),
      vatAmount: Number(getText(summary, 'totalVatAmount') || 0),
      grossValue: Number(getText(summary, 'totalGrossValue') || 0),
      count: '1',
    };
  }

  async function loadIncome() {
    try {
      setIncomeLoading(true);
      setIncomeError('');
      setIncomeLoaded(false);
      setIncomeSelected(null);
      if (dateFrom > dateTo) throw new Error('Η αρχική ημερομηνία πρέπει να είναι πριν από την τελική.');

      const all = [];
      let nextPartitionKey = '';
      let nextRowKey = '';
      const visited = new Set();

      for (let page = 0; page < 100; page++) {
        const params = new URLSearchParams({
          dateFrom: toApiDate(dateFrom),
          dateTo: toApiDate(dateTo),
        });
        if (nextPartitionKey && nextRowKey) {
          params.set('nextPartitionKey', nextPartitionKey);
          params.set('nextRowKey', nextRowKey);
        }
        const response = await fetch(`/api/mydata/income?${params.toString()}`, { cache: 'no-store' });
        const body = await response.text();
        if (!response.ok) {
          let message = 'Αποτυχία ανάκτησης εσόδων.';
          try { message = JSON.parse(body)?.error || message; } catch {}
          throw new Error(message);
        }
        const xml = parseXmlBody(body);
        const invoices = Array.from(xml.getElementsByTagNameNS('*', 'invoice'));
        all.push(...invoices.map(parseIncomeInvoice));

        const continuation = firstNode(xml, 'continuationToken');
        const nextP = getText(continuation, 'nextPartitionKey') || getText(xml, 'nextPartitionKey');
        const nextR = getText(continuation, 'nextRowKey') || getText(xml, 'nextRowKey');
        if (!nextP || !nextR) break;
        const token = `${nextP}:${nextR}`;
        if (visited.has(token)) throw new Error('Η ΑΑΔΕ επέστρεψε επαναλαμβανόμενη σελίδα.');
        visited.add(token);
        nextPartitionKey = nextP;
        nextRowKey = nextR;
        if (page === 99) throw new Error('Η ανάκτηση ξεπέρασε τις 100 σελίδες. Δοκίμασε μικρότερη περίοδο.');
      }

      const unique = Array.from(new Map(all.map((doc) => [doc.id, doc])).values());
      unique.sort((a, b) => String(b.issueDate).localeCompare(String(a.issueDate)));
      setIncomeDocuments(unique);
      setIncomeLoaded(true);
    } catch (err) {
      setIncomeError(err?.message || 'Άγνωστο σφάλμα εσόδων.');
      setIncomeDocuments([]);
    } finally {
      setIncomeLoading(false);
    }
  }

  function showIncomeDocument(doc) {
    // The transmitted-documents response already includes invoice details.
    // RequestDocs is for received documents, so do not use it for income.
    setIncomeError('');
    setIncomeSelected({
      mark: doc.mark || '-',
      customerVat: doc.counterVatNumber,
      customerName: doc.customerName,
      date: doc.issueDate,
      series: doc.series,
      aa: doc.aa,
      type: doc.invType,
      net: doc.netValue,
      vat: doc.vatAmount,
      gross: doc.grossValue,
    });
  }

  const visibleIncome = incomeDocuments.filter((doc) =>
    [doc.counterVatNumber, doc.customerName, doc.issueDate, doc.invType, doc.minMark, doc.maxMark, doc.series, doc.aa]
      .join(' ').toLocaleLowerCase('el-GR').includes(incomeSearch.trim().toLocaleLowerCase('el-GR'))
  );

  async function loadExpenses() {
    try {
      setLoading(true); setError(''); setSelectedDocument(null);
      const from = toApiDate(dateFrom);
      const to = toApiDate(dateTo);
      const response = await fetch(`/api/mydata/expenses?dateFrom=${encodeURIComponent(from)}&dateTo=${encodeURIComponent(to)}`, { method: 'GET', cache: 'no-store' });
      const body = await response.text();
      if (!response.ok) {
        let message = 'Αποτυχία λήψης δεδομένων από το myDATA.';
        try { const json = JSON.parse(body); if (json?.error) message = json.error; } catch {}
        throw new Error(message);
      }
      const xml = parseXmlBody(body);
      const bookInfos = Array.from(xml.getElementsByTagNameNS('*', 'bookInfo'));
      const groups = bookInfos.map((bookInfo, index) => ({
        id: `${getText(bookInfo,'minMark') || getText(bookInfo,'maxMark') || index}-${getText(bookInfo,'counterVatNumber')}-${getText(bookInfo,'issueDate')}`,
        counterVatNumber: getText(bookInfo,'counterVatNumber'),
        issueDate: getText(bookInfo,'issueDate'),
        invType: getText(bookInfo,'invType'),
        netValue: Number(getText(bookInfo,'netValue') || 0),
        vatAmount: Number(getText(bookInfo,'vatAmount') || 0),
        grossValue: Number(getText(bookInfo,'grossValue') || 0),
        count: getText(bookInfo,'count') || '1',
        minMark: getText(bookInfo,'minMark'),
        maxMark: getText(bookInfo,'maxMark'),
      }));

      const expanded = await Promise.all(groups.map(async (group) => {
        const expected = Number(group.count || 1);
        if (expected <= 1 || !group.minMark || !group.maxMark || group.minMark === group.maxMark) return [group];
        try {
          const r = await fetch(`/api/mydata/document?minMark=${encodeURIComponent(group.minMark)}&maxMark=${encodeURIComponent(group.maxMark)}`, { method:'GET', cache:'no-store' });
          const body2 = await r.text();
          if (!r.ok) throw new Error('Αποτυχία ανάλυσης συγκεντρωτικής εγγραφής.');
          const x = parseXmlBody(body2);
          const invoices = Array.from(x.getElementsByTagNameNS('*','invoice'));
          const docs = invoices.map(i => parseDetailedInvoiceForList(i, group)).filter(doc =>
            (!group.counterVatNumber || String(doc.counterVatNumber) === String(group.counterVatNumber)) &&
            (!group.issueDate || String(doc.issueDate) === String(group.issueDate)) &&
            (!group.invType || String(doc.invType) === String(group.invType))
          );
          if (docs.length !== expected) {
            console.warn('myDATA aggregate was not fully expanded:', group, docs.length);
            return [group];
          }
          return docs;
        } catch (e) {
          console.error('myDATA expand group:', e);
          return [group];
        }
      }));

      const parsedDocuments = expanded.flat();
      parsedDocuments.sort((x,y) => {
        const d=String(y.issueDate).localeCompare(String(x.issueDate));
        if(d) return d;
        try {
          const A=BigInt(x.mark||x.minMark||0), B=BigInt(y.mark||y.minMark||0);
          return A===B?0:(A>B?-1:1);
        } catch { return 0; }
      });
      setDocuments(parsedDocuments);
      setLastUpdate(new Date());
    } catch (err) {
      console.error('myDATA:', err); setDocuments([]); setError(err?.message || 'Παρουσιάστηκε άγνωστο σφάλμα.');
    } finally { setLoading(false); }
  }

  async function loadDocumentDetails(doc) {
    const mark = doc.mark || doc.minMark || doc.maxMark;

    if (!mark) {
      setDetailsError('Δεν υπάρχει MARK για αυτό το παραστατικό.');
      return;
    }

    try {
      setDetailsLoading(true);
      setDetailsError('');
      setMaterialsError('');
      setMaterialsRaw('');
      setMaterials([]);
      setSupplierMappings([]);
      setMappingError('');
      setPurchaseMessage('');
      setSelectedDocument(null);

      const response = await fetch(
        `/api/mydata/document?mark=${encodeURIComponent(mark)}`,
        { method: 'GET', cache: 'no-store' }
      );

      const body = await response.text();

      if (!response.ok) {
        let message = 'Αποτυχία λήψης αναλυτικών στοιχείων.';
        try {
          const json = JSON.parse(body);
          if (json?.error) message = json.error;
        } catch {}
        throw new Error(message);
      }

      const xml = parseXmlBody(body);
      const invoice = firstNode(xml, 'invoice');

      if (!invoice) {
        throw new Error('Δεν βρέθηκε αναλυτικό παραστατικό για αυτό το MARK.');
      }

      const issuer = firstNode(invoice, 'issuer');
      const counterpart = firstNode(invoice, 'counterpart');
      const header = firstNode(invoice, 'invoiceHeader');
      const summary = firstNode(invoice, 'invoiceSummary');

      const details = Array.from(
        invoice.getElementsByTagNameNS('*', 'invoiceDetails')
      ).map((line, index) => ({
        lineNumber: getText(line, 'lineNumber') || String(index + 1),
        netValue: Number(getText(line, 'netValue') || 0),
        vatCategory: getText(line, 'vatCategory'),
        vatAmount: Number(getText(line, 'vatAmount') || 0),
        incomeClassification: getText(line, 'incomeClassification'),
        expensesClassification: getText(line, 'expensesClassification'),
      }));

      setSelectedDocument({
        requestedMark: mark,
        mark: getText(invoice, 'mark') || mark,
        uid: getText(invoice, 'uid'),
        issuerVat: getText(issuer, 'vatNumber'),
        issuerName: getText(issuer, 'name') || getText(issuer, 'companyName') || supplierNameByVat(getText(issuer, 'vatNumber')),
        issuerCountry: getText(issuer, 'country'),
        issuerBranch: getText(issuer, 'branch'),
        counterpartVat: getText(counterpart, 'vatNumber'),
        issueDate: getText(header, 'issueDate'),
        invoiceType: getText(header, 'invoiceType'),
        series: getText(header, 'series'),
        aa: getText(header, 'aa'),
        currency: getText(header, 'currency'),
        netValue: Number(getText(summary, 'totalNetValue') || 0),
        vatAmount: Number(getText(summary, 'totalVatAmount') || 0),
        grossValue: Number(getText(summary, 'totalGrossValue') || 0),
        downloadingInvoiceUrl: getText(invoice, 'downloadingInvoiceUrl'),
        details,
      });
    } catch (err) {
      console.error('myDATA document:', err);
      setDetailsError(err?.message || 'Παρουσιάστηκε άγνωστο σφάλμα.');
    } finally {
      setDetailsLoading(false);
    }
  }

  async function saveCurrentSupplier() {
    if (!supabase || !selectedDocument?.issuerVat) return;
    const vat = String(selectedDocument.issuerVat || '').trim();

    if (supplierByVat(vat)) {
      setSupplierMessage('✅ Ο προμηθευτής υπάρχει ήδη στους Προμηθευτές.');
      return;
    }

    const suggestedName = String(selectedDocument.issuerName || '').trim() || `Προμηθευτής ${vat}`;
    const supplierName = window.prompt('Επωνυμία προμηθευτή:', suggestedName);
    if (!supplierName?.trim()) return;

    try {
      setSupplierSaving(true);
      setSupplierMessage('');

      const { data, error: insertError } = await supabase
        .from('suppliers')
        .insert({ name: supplierName.trim(), afm: vat })
        .select()
        .single();

      if (insertError) throw insertError;

      setLocalSuppliers((current) => [...current, data]);
      setSelectedDocument((current) => current ? { ...current, issuerName: data.name || supplierName.trim() } : current);
      setSupplierMessage(`✅ Ο προμηθευτής ${data.name || supplierName.trim()} αποθηκεύτηκε.`);

      if (materials.length > 0) {
        await loadSupplierMappings(vat, materials, data);
      }
    } catch (err) {
      console.error('save supplier:', err);
      setSupplierMessage(`❌ Δεν αποθηκεύτηκε ο προμηθευτής${err?.message ? `: ${err.message}` : '.'}`);
    } finally {
      setSupplierSaving(false);
    }
  }

  async function loadInvoiceMaterials() {
    if (!selectedDocument?.downloadingInvoiceUrl) {
      setMaterialsError('Δεν υπάρχει σύνδεσμος αναλυτικού παραστατικού.');
      return;
    }

    try {
      setMaterialsLoading(true);
      setMaterialsError('');
      setMaterialsRaw('');

      const response = await fetch('/api/mydata/invoice-lines', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          downloadingInvoiceUrl: selectedDocument.downloadingInvoiceUrl,
        }),
      });

      const body = await response.text();

      if (!response.ok) {
        let message = 'Δεν ήταν δυνατή η ανάγνωση των υλικών.';
        try {
          const json = JSON.parse(body);
          if (json?.error) message = json.error;
        } catch {}
        throw new Error(message);
      }

      const xml = parseXmlBody(body);
      const materialNodes = Array.from(
        xml.getElementsByTagNameNS('*', 'invoiceDetails')
      );

      const parsedMaterials = materialNodes.map((line, index) => {
        const quantity = Number(getText(line, 'quantity') || 0);
        const netValue = Number(getText(line, 'netValue') || 0);

        return {
          lineNumber: getText(line, 'lineNumber') || String(index + 1),
          itemCode: getText(line, 'itemCode'),
          itemDescr: getText(line, 'itemDescr'),
          quantity,
          measurementUnit: getText(line, 'measurementUnit'),
          netValue,
          vatCategory: getText(line, 'vatCategory'),
          vatAmount: Number(getText(line, 'vatAmount') || 0),
          lineComments: getText(line, 'lineComments'),
          unitPrice: quantity > 0 ? netValue / quantity : 0,
        };
      });

      setMaterialsRaw(body);
      setMaterials(parsedMaterials);

      const providerInvoice = firstNode(xml, 'invoice');
      const providerIssuer = firstNode(providerInvoice, 'issuer');
      const providerSupplierVat =
        getText(providerIssuer, 'vatNumber') || selectedDocument.issuerVat;

      await loadSupplierMappings(providerSupplierVat, parsedMaterials);

      if (parsedMaterials.length === 0) {
        setMaterialsError('Το αναλυτικό παραστατικό δεν περιέχει γραμμές υλικών.');
      }
    } catch (err) {
      console.error('invoice materials:', err);
      setMaterialsError(err?.message || 'Αποτυχία ανάγνωσης υλικών.');
    } finally {
      setMaterialsLoading(false);
    }
  }

  useEffect(() => {
    loadExpenses();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const visibleDocuments = useMemo(() => {
    const q = search.trim().toLowerCase();
    if (!q) return documents;

    return documents.filter((doc) =>
      [doc.counterVatNumber, doc.issuerName, supplierNameByVat(doc.counterVatNumber), doc.issueDate, doc.invType, doc.series, doc.aa, doc.mark, doc.minMark, doc.maxMark]
        .join(' ')
        .toLowerCase()
        .includes(q)
    );
  }, [documents, search]);

  const totals = useMemo(() => {
    return visibleDocuments.reduce(
      (sum, doc) => {
        sum.net += Number(doc.netValue || 0);
        sum.vat += Number(doc.vatAmount || 0);
        sum.gross += Number(doc.grossValue || 0);
        return sum;
      },
      { net: 0, vat: 0, gross: 0 }
    );
  }, [visibleDocuments]);

  return (
    <section className="card mydata-section">
      <div style={{ display: 'flex', justifyContent: 'space-between', gap: 16, alignItems: 'flex-start', flexWrap: 'wrap' }}>
        <div>
          <h2>🔄 myDATA</h2>
          <p>Επίλεξε Έσοδα ή Έξοδα για να δεις τα αντίστοιχα παραστατικά.</p>
        </div>
        <small>
          {lastUpdate
            ? `Τελευταία ενημέρωση: ${lastUpdate.toLocaleString('el-GR')}`
            : 'Δεν έχει γίνει ενημέρωση ακόμη'}
        </small>
      </div>

      <div style={{ display: 'flex', gap: 12, margin: '18px 0', flexWrap: 'wrap' }}>
        <button type="button" onClick={() => { setActiveCategory('income'); setSelectedDocument(null); setDetailsError(''); }}
          style={{ flex: '1 1 180px', padding: '16px', border: activeCategory === 'income' ? '2px solid #c59a43' : '1px solid #555', background: activeCategory === 'income' ? '#3b3120' : '#26262b', borderRadius: 12 }}>
          💰 ΕΣΟΔΑ
        </button>
        <button type="button" onClick={() => { setActiveCategory('expenses'); setSelectedDocument(null); setDetailsError(''); }}
          style={{ flex: '1 1 180px', padding: '16px', border: activeCategory === 'expenses' ? '2px solid #c59a43' : '1px solid #555', background: activeCategory === 'expenses' ? '#3b3120' : '#26262b', borderRadius: 12 }}>
          🧾 ΕΞΟΔΑ
        </button>
      </div>
      {activeCategory === 'income' ? (
        <div className="line" style={{ padding: 20 }}>
          <h3>💰 Τιμολόγια Εσόδων</h3>
          <div className="grid">
            <label>Από<input type="date" value={dateFrom} onChange={(e) => setDateFrom(e.target.value)} /></label>
            <label>Έως<input type="date" value={dateTo} onChange={(e) => setDateTo(e.target.value)} /></label>
            <div><button type="button" onClick={loadIncome} disabled={incomeLoading}>{incomeLoading ? 'Γίνεται λήψη...' : '🔄 Λήψη εσόδων από myDATA'}</button></div>
          </div>
          {incomeError && <p style={{ color: '#ff9999' }}>⚠️ {incomeError}</p>}
          {incomeLoaded && !incomeError && <>
            <div className="grid">
              <div className="line"><b>{visibleIncome.length}</b><br /><small>Εγγραφές</small></div>
              <div className="line"><b>{money(visibleIncome.reduce((s, d) => s + d.netValue, 0))}</b><br /><small>Καθαρή αξία</small></div>
              <div className="line"><b>{money(visibleIncome.reduce((s, d) => s + d.vatAmount, 0))}</b><br /><small>ΦΠΑ</small></div>
              <div className="line"><b>{money(visibleIncome.reduce((s, d) => s + d.grossValue, 0))}</b><br /><small>Σύνολο</small></div>
            </div>
            <input placeholder="Αναζήτηση με ΑΦΜ, ημερομηνία, τύπο ή MARK..." value={incomeSearch} onChange={(e) => setIncomeSearch(e.target.value)} />
            {visibleIncome.length === 0 ? <p>Δεν βρέθηκαν έσοδα για αυτή την περίοδο.</p> :
              <div style={{ overflowX: 'auto', marginTop: 14 }}>
                <table style={{ width: '100%', minWidth: 850 }}>
                  <thead><tr><th>Ημερομηνία</th><th>Πελάτης</th><th>ΑΦΜ</th><th>Τύπος</th><th>Πλήθος</th><th>Καθαρή</th><th>ΦΠΑ</th><th>Σύνολο</th><th>MARK</th><th></th></tr></thead>
                  <tbody>{visibleIncome.map((doc) => <tr key={doc.id}>
                    <td>{doc.issueDate || '-'}</td><td>{doc.customerName || '—'}</td><td>{doc.counterVatNumber || '-'}</td>
                    <td>{doc.invType || '-'}</td><td>{doc.count || '1'}</td><td>{money(doc.netValue)}</td>
                    <td>{money(doc.vatAmount)}</td><td><b>{money(doc.grossValue)}</b></td>
                    <td>{doc.minMark || doc.maxMark || '-'}</td>
                    <td><button type="button" onClick={() => showIncomeDocument(doc)}>🔍 Προβολή</button></td>
                  </tr>)}</tbody>
                </table>
              </div>}
          </>}
          {incomeSelected && <div className="line" style={{ marginTop: 18 }}>
            <h3>📄 Αναλυτικά στοιχεία εσόδου</h3>
            <p>Πελάτης: <b>{incomeSelected.customerName || '—'}</b> • ΑΦΜ: {incomeSelected.customerVat || '-'}</p>
            <p>Ημερομηνία: {incomeSelected.date || '-'} • Παραστατικό: {incomeSelected.series || '-'} {incomeSelected.aa || ''} • Τύπος: {incomeSelected.type || '-'}</p>
            <p>MARK: {incomeSelected.mark}</p>
            <p>Καθαρή: {money(incomeSelected.net)} • ΦΠΑ: {money(incomeSelected.vat)} • <b>Σύνολο: {money(incomeSelected.gross)}</b></p>
            <button type="button" onClick={() => setIncomeSelected(null)}>✕ Κλείσιμο</button>
          </div>}
          <p><small>Η ανάκτηση είναι μόνο για προβολή. Η σύνδεση με έργα και οι εισπράξεις θα προστεθούν σε επόμενο βήμα.</small></p>
        </div>
      ) : (
      <>
      <div className="grid">
        <label>
          Από
          <input type="date" value={dateFrom} onChange={(e) => setDateFrom(e.target.value)} />
        </label>
        <label>
          Έως
          <input type="date" value={dateTo} onChange={(e) => setDateTo(e.target.value)} />
        </label>
        <div>
          <button onClick={loadExpenses} disabled={loading}>
            {loading ? 'Γίνεται σύνδεση...' : '🔄 Λήψη από myDATA'}
          </button>
        </div>
      </div>

      {error && <div className="line alert"><p><b>⚠️ {error}</b></p></div>}

      {!error && (
        <>
          <div className="grid">
            <div className="line"><p><b>{visibleDocuments.length}</b></p><small>Παραστατικά</small></div>
            <div className="line"><p><b>{money(totals.net)}</b></p><small>Καθαρή αξία</small></div>
            <div className="line"><p><b>{money(totals.vat)}</b></p><small>ΦΠΑ</small></div>
            <div className="line"><p><b>{money(totals.gross)}</b></p><small>Συνολική αξία</small></div>
          </div>

          <input
            placeholder="Αναζήτηση με επωνυμία, ΑΦΜ, ημερομηνία, τύπο ή MARK..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />

          {loading ? (
            <p>Γίνεται λήψη των παραστατικών από την ΑΑΔΕ...</p>
          ) : visibleDocuments.length === 0 ? (
            <p>Δεν βρέθηκαν παραστατικά για αυτή την περίοδο.</p>
          ) : (
            <div style={{ overflowX: 'auto', marginTop: 16 }}>
              <table style={{ width: '100%', borderCollapse: 'collapse', minWidth: 1050 }}>
                <thead>
                  <tr>
                    <th>Ημερομηνία</th>
                    <th>Επωνυμία Προμηθευτή</th>
                    <th>ΑΦΜ Προμηθευτή</th>
                    <th>Τύπος</th>
                    <th>Πλήθος</th>
                    <th>Καθαρή Αξία</th>
                    <th>ΦΠΑ</th>
                    <th>Σύνολο</th>
                    <th>MARK</th>
                    <th></th>
                  </tr>
                </thead>
                <tbody>
                  {visibleDocuments.map((doc) => (
                    <tr key={doc.id}>
                      <td>{doc.issueDate || '-'}</td>
                      <td><b>{supplierNameByVat(doc.counterVatNumber) || doc.issuerName || '—'}</b></td>
                      <td><b>{doc.counterVatNumber || '-'}</b></td>
                      <td>{doc.invType || '-'}</td>
                      <td>{doc.count || '1'}</td>
                      <td>{money(doc.netValue)}</td>
                      <td>{money(doc.vatAmount)}</td>
                      <td><b>{money(doc.grossValue)}</b></td>
                      <td><small>{doc.minMark || doc.maxMark || '-'}</small></td>
                      <td>
                        <button onClick={() => loadDocumentDetails(doc)} disabled={detailsLoading}>
                          🔍 Προβολή
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </>
      )}

      {detailsError && (
        <div className="line alert" style={{ marginTop: 16 }}>
          <p><b>⚠️ {detailsError}</b></p>
        </div>
      )}

      {detailsLoading && <p style={{ marginTop: 16 }}>Γίνεται λήψη του παραστατικού...</p>}

      {selectedDocument && (
        <div className="line" style={{ marginTop: 20 }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', gap: 12, flexWrap: 'wrap' }}>
            <div>
              <h3>📄 Αναλυτικά στοιχεία παραστατικού</h3>
              <p><b>{selectedDocument.series || '-'} {selectedDocument.aa || ''}</b></p>
            </div>
            <button onClick={() => setSelectedDocument(null)}>✕ Κλείσιμο</button>
          </div>

          <div className="line" style={{ marginBottom: 12 }}>
            <small>Προμηθευτής</small>
            <p><b>{supplierNameByVat(selectedDocument.issuerVat) || selectedDocument.issuerName || 'Δεν είναι αποθηκευμένος'}</b></p>
            <p>ΑΦΜ: <b>{selectedDocument.issuerVat || '-'}</b></p>
            {!supplierByVat(selectedDocument.issuerVat) && (
              <button type="button" onClick={saveCurrentSupplier} disabled={supplierSaving}>
                {supplierSaving ? 'Αποθήκευση...' : '➕ Αποθήκευση Προμηθευτή'}
              </button>
            )}
            {supplierMessage && <p style={{ marginTop: 8 }}><b>{supplierMessage}</b></p>}
          </div>

          <div className="grid">
            <div className="line"><small>ΑΦΜ Εκδότη</small><p><b>{selectedDocument.issuerVat || '-'}</b></p></div>
            <div className="line"><small>Ημερομηνία</small><p><b>{selectedDocument.issueDate || '-'}</b></p></div>
            <div className="line"><small>Τύπος</small><p><b>{selectedDocument.invoiceType || '-'}</b></p></div>
            <div className="line"><small>MARK</small><p><b>{selectedDocument.mark || '-'}</b></p></div>
          </div>

          <div className="grid">
            <div className="line"><small>Καθαρή αξία</small><p><b>{money(selectedDocument.netValue)}</b></p></div>
            <div className="line"><small>ΦΠΑ</small><p><b>{money(selectedDocument.vatAmount)}</b></p></div>
            <div className="line"><small>Σύνολο</small><p><b>{money(selectedDocument.grossValue)}</b></p></div>
          </div>

          {selectedDocument.details.length > 0 && (
            <>
              <h3>Γραμμές myDATA</h3>
              <div style={{ overflowX: 'auto' }}>
                <table style={{ width: '100%', borderCollapse: 'collapse', minWidth: 650 }}>
                  <thead>
                    <tr>
                      <th>Γραμμή</th>
                      <th>Καθαρή αξία</th>
                      <th>Κατηγορία ΦΠΑ</th>
                      <th>ΦΠΑ</th>
                    </tr>
                  </thead>
                  <tbody>
                    {selectedDocument.details.map((line) => (
                      <tr key={line.lineNumber}>
                        <td>{line.lineNumber}</td>
                        <td>{money(line.netValue)}</td>
                        <td>{line.vatCategory || '-'}</td>
                        <td>{money(line.vatAmount)}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </>
          )}

          {selectedDocument.downloadingInvoiceUrl && (
            <div style={{ marginTop: 18 }}>
              <button onClick={loadInvoiceMaterials} disabled={materialsLoading}>
                {materialsLoading ? '📦 Ανάγνωση υλικών...' : '📦 Ανάγνωση Υλικών'}
              </button>

              {materialsError && (
                <div className="line alert" style={{ marginTop: 12 }}>
                  <p><b>⚠️ {materialsError}</b></p>
                </div>
              )}

              {materials.length > 0 && (
                <div className="line" style={{ marginTop: 12 }}>
                  <h3>📦 Υλικά παραστατικού</h3>
                  <p style={{ marginBottom: 10 }}>
                    Βρέθηκαν <b>{materials.length}</b> γραμμές υλικών.
                  </p>

                  {mappingError && (
                    <div className="line alert" style={{ marginBottom: 10 }}>
                      <p><b>⚠️ {mappingError}</b></p>
                    </div>
                  )}

                  <div style={{ overflowX: 'auto' }}>
                    <table style={{ width: '100%', borderCollapse: 'collapse', minWidth: 900 }}>
                      <thead>
                        <tr>
                          <th>Γραμμή</th>
                          <th>Κωδικός προμηθευτή</th>
                          <th>Περιγραφή</th>
                          <th>Ποσότητα</th>
                          <th>Μ.Μ.</th>
                          <th>Τιμή μονάδας*</th>
                          <th>Καθαρή αξία</th>
                          <th>ΦΠΑ</th>
                          <th>Αντιστοίχιση Αποθήκης</th>
                        </tr>
                      </thead>
                      <tbody>
                        {materials.map((line) => (
                          <tr key={`${line.lineNumber}-${line.itemCode}`}>
                            <td>{line.lineNumber}</td>
                            <td><b>{line.itemCode || '-'}</b></td>
                            <td>
                              <b>{line.itemDescr || '-'}</b>
                              {line.lineComments && (
                                <div><small>{line.lineComments}</small></div>
                              )}
                            </td>
                            <td>{line.quantity || 0}</td>
                            <td>{line.measurementUnit || '-'}</td>
                            <td>{money(line.unitPrice)}</td>
                            <td>{money(line.netValue)}</td>
                            <td>{money(line.vatAmount)}</td>
                            <td style={{ minWidth: 300 }}>
                              {mappingLoading ? (
                                <small>Έλεγχος...</small>
                              ) : (
                                <div style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
                                  <select
                                    value={
                                      supplierMappings.find(
                                        (item) => item.lineNumber === line.lineNumber
                                      )?.inventoryItemId || ''
                                    }
                                    disabled={savingLine === line.lineNumber}
                                    onChange={(e) => {
                                      const value = e.target.value;
                                      if (value) saveMaterialMapping(line, value);
                                    }}
                                    style={{ flex: 1 }}
                                  >
                                    <option value="">Χωρίς αντιστοίχιση</option>
                                    {localInventory
                                      .filter((item) => item?.is_deleted !== true)
                                      .map((item) => (
                                        <option key={item.id} value={item.id}>
                                          {item.item_name}
                                        </option>
                                      ))}
                                  </select>

                                  {!supplierMappings.find(
                                    (item) => item.lineNumber === line.lineNumber
                                  )?.inventoryItemId && (
                                    <button
                                      type="button"
                                      disabled={savingLine === line.lineNumber}
                                      onClick={() => createInventoryMaterial(line)}
                                      style={{ whiteSpace: 'nowrap' }}
                                    >
                                      {savingLine === line.lineNumber ? '...' : '➕ Νέο'}
                                    </button>
                                  )}
                                </div>
                              )}
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>

                  <small style={{ display: 'block', marginTop: 10 }}>
                    * Η τιμή μονάδας υπολογίζεται από Καθαρή Αξία ÷ Ποσότητα.
                    Η μονάδα μέτρησης εμφανίζεται όπως ακριβώς επιστρέφεται από το αναλυτικό παραστατικό.
                  </small>

                  <div style={{ marginTop: 16 }}>
                    <button
                      type="button"
                      onClick={registerPurchaseInInventory}
                      disabled={purchaseSaving}
                    >
                      {purchaseSaving
                        ? 'Καταχώρηση...'
                        : '📦 Καταχώρηση αγοράς στην Αποθήκη'}
                    </button>

                    {purchaseMessage && (
                      <p style={{ marginTop: 10 }}>
                        <b>{purchaseMessage}</b>
                      </p>
                    )}
                  </div>
                </div>
              )}
            </div>
          )}

          {selectedDocument.downloadingInvoiceUrl && (
            <div style={{ marginTop: 16 }}>
              <a
                href={selectedDocument.downloadingInvoiceUrl}
                target="_blank"
                rel="noopener noreferrer"
                style={{ display: 'inline-block' }}
              >
                📄 Άνοιγμα αρχικού παραστατικού
              </a>
            </div>
          )}
        </div>
      )}
      </>
      )}
    </section>
  );
}
