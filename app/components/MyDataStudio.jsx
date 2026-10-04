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

export default function MyDataStudio({ supabase, suppliers = [], inventory = [] }) {
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

  useEffect(() => {
    setLocalInventory(inventory);
  }, [inventory]);

  async function loadSupplierMappings(supplierVat, parsedMaterials) {
    if (!supabase || !supplierVat || !Array.isArray(parsedMaterials)) return;

    try {
      setMappingLoading(true);
      setMappingError('');

      const supplier = suppliers.find(
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

  async function loadExpenses() {
    try {
      setLoading(true);
      setError('');
      setSelectedDocument(null);

      const from = toApiDate(dateFrom);
      const to = toApiDate(dateTo);

      const response = await fetch(
        `/api/mydata/expenses?dateFrom=${encodeURIComponent(from)}&dateTo=${encodeURIComponent(to)}`,
        { method: 'GET', cache: 'no-store' }
      );

      const body = await response.text();

      if (!response.ok) {
        let message = 'Αποτυχία λήψης δεδομένων από το myDATA.';
        try {
          const json = JSON.parse(body);
          if (json?.error) message = json.error;
        } catch {}
        throw new Error(message);
      }

      const xml = parseXmlBody(body);
      const bookInfos = Array.from(xml.getElementsByTagNameNS('*', 'bookInfo'));

      const parsedDocuments = bookInfos.map((bookInfo, index) => {
        const counterVatNumber = getText(bookInfo, 'counterVatNumber');
        const issueDate = getText(bookInfo, 'issueDate');
        const invType = getText(bookInfo, 'invType');
        const netValue = Number(getText(bookInfo, 'netValue') || 0);
        const vatAmount = Number(getText(bookInfo, 'vatAmount') || 0);
        const grossValue = Number(getText(bookInfo, 'grossValue') || 0);
        const count = getText(bookInfo, 'count');
        const minMark = getText(bookInfo, 'minMark');
        const maxMark = getText(bookInfo, 'maxMark');

        return {
          id: `${minMark || maxMark || index}-${counterVatNumber}-${issueDate}`,
          counterVatNumber,
          issueDate,
          invType,
          netValue,
          vatAmount,
          grossValue,
          count,
          minMark,
          maxMark,
        };
      });

      parsedDocuments.sort((a, b) =>
        String(b.issueDate).localeCompare(String(a.issueDate))
      );

      setDocuments(parsedDocuments);
      setLastUpdate(new Date());
    } catch (err) {
      console.error('myDATA:', err);
      setDocuments([]);
      setError(err?.message || 'Παρουσιάστηκε άγνωστο σφάλμα.');
    } finally {
      setLoading(false);
    }
  }

  async function loadDocumentDetails(doc) {
    const mark = doc.minMark || doc.maxMark;

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
      [doc.counterVatNumber, doc.issueDate, doc.invType, doc.minMark, doc.maxMark]
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
          <h2>🔄 myDATA — Έξοδα</h2>
          <p>Παραστατικά εξόδων που λαμβάνονται απευθείας από την ΑΑΔΕ.</p>
        </div>
        <small>
          {lastUpdate
            ? `Τελευταία ενημέρωση: ${lastUpdate.toLocaleString('el-GR')}`
            : 'Δεν έχει γίνει ενημέρωση ακόμη'}
        </small>
      </div>

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
            placeholder="Αναζήτηση με ΑΦΜ, ημερομηνία, τύπο ή MARK..."
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
    </section>
  );
}
