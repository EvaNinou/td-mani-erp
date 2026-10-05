'use client';

import { useEffect, useMemo, useState } from 'react';

const EMPTY_NOTE = {
  series: 'ΔΔ',
  document_number: '',
  issue_date: new Date().toISOString().slice(0, 10),
  issue_time: new Date().toTimeString().slice(0, 5),
  customer_id: '',
  project_id: '',
  recipient_name: '',
  recipient_afm: '',
  recipient_address: '',
  loading_address: 'Πλάκες, Μήλος 84800',
  delivery_address: '',
  movement_purpose: 'Διακίνηση υλικών σε έργο',
  vehicle_number: '',
  carrier_name: '',
  notes: ''
};

function stockFor(itemId, movements) {
  return (movements || [])
    .filter((m) => m.item_id === itemId)
    .reduce((sum, m) => {
      const q = Number(m.quantity || 0);
      return m.movement_type === 'USE' ? sum - q : sum + q;
    }, 0);
}

export default function DeliveryNotesStudio({
  supabase,
  inventory = [],
  customers = [],
  projects = [],
  inventoryMovements = [],
  onInventoryChanged,
  onBack
}) {
  const [note, setNote] = useState(EMPTY_NOTE);
  const [lines, setLines] = useState([]);
  const [savedNotes, setSavedNotes] = useState([]);
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState('');
  const [editingId, setEditingId] = useState(null);

  useEffect(() => { loadNotes(); }, []);

  async function loadNotes() {
    const { data } = await supabase
      .from('delivery_notes')
      .select('*, delivery_note_lines(*)')
      .eq('is_deleted', false)
      .order('created_at', { ascending: false });
    setSavedNotes(data || []);
  }

  const activeInventory = useMemo(
    () => inventory.filter((x) => !x.is_deleted),
    [inventory]
  );

  function chooseCustomer(customerId) {
    const customer = customers.find((x) => x.id === customerId);
    setNote((prev) => ({
      ...prev,
      customer_id: customerId,
      project_id: '',
      recipient_name: customer?.name || prev.recipient_name,
      recipient_afm: customer?.afm || prev.recipient_afm,
      recipient_address: customer?.address || prev.recipient_address
    }));
  }

  function chooseProject(projectId) {
    const project = projects.find((x) => x.id === projectId);
    setNote((prev) => ({
      ...prev,
      project_id: projectId,
      delivery_address: project?.address || prev.delivery_address
    }));
  }

  function addWarehouseLine() {
    setLines((prev) => [...prev, {
      key: crypto.randomUUID(),
      inventory_item_id: '',
      item_name: '',
      quantity: '',
      unit: 'τεμ.',
      notes: ''
    }]);
  }

  async function addNewMaterial() {
    const itemName = window.prompt('Όνομα νέου υλικού:');
    if (!itemName?.trim()) return;

    const unit = window.prompt('Μονάδα μέτρησης:', 'τεμ.') || 'τεμ.';
    const { data, error } = await supabase
      .from('inventory')
      .insert([{
        item_name: itemName.trim(),
        unit: unit.trim(),
        quantity: 0,
        min_quantity: 0,
        purchase_price: 0,
        category: '',
        notes: 'Δημιουργήθηκε από Δελτίο Διακίνησης'
      }])
      .select()
      .single();

    if (error || !data) {
      alert(error?.message || 'Δεν δημιουργήθηκε το υλικό.');
      return;
    }

    if (typeof onInventoryChanged === 'function') await onInventoryChanged();

    setLines((prev) => [...prev, {
      key: crypto.randomUUID(),
      inventory_item_id: data.id,
      item_name: data.item_name,
      quantity: '',
      unit: data.unit || 'τεμ.',
      notes: ''
    }]);
  }

  function updateLine(key, patch) {
    setLines((prev) => prev.map((line) => line.key === key ? { ...line, ...patch } : line));
  }

  function selectMaterial(key, itemId) {
    const item = inventory.find((x) => x.id === itemId);
    updateLine(key, {
      inventory_item_id: itemId,
      item_name: item?.item_name || '',
      unit: item?.unit || 'τεμ.'
    });
  }

  function removeLine(key) {
    setLines((prev) => prev.filter((line) => line.key !== key));
  }

  async function saveDraft() {
    const validLines = lines.filter((x) => x.item_name && Number(x.quantity) > 0);
    if (validLines.length === 0) {
      alert('Πρόσθεσε τουλάχιστον ένα υλικό με ποσότητα.');
      return;
    }

    setSaving(true);
    setMessage('');

    try {
      const payload = {
        ...note,
        customer_id: note.customer_id || null,
        project_id: note.project_id || null,
        issue_time: note.issue_time || null,
        status: 'DRAFT',
        updated_at: new Date().toISOString()
      };

      let savedId = editingId;

      if (editingId) {
        const { error } = await supabase
          .from('delivery_notes')
          .update(payload)
          .eq('id', editingId)
          .eq('status', 'DRAFT');

        if (error) throw error;

        const { error: deleteLinesError } = await supabase
          .from('delivery_note_lines')
          .delete()
          .eq('delivery_note_id', editingId);

        if (deleteLinesError) throw deleteLinesError;
      } else {
        const { data: saved, error } = await supabase
          .from('delivery_notes')
          .insert([payload])
          .select()
          .single();

        if (error) throw error;
        savedId = saved.id;
      }

      const { error: linesError } = await supabase
        .from('delivery_note_lines')
        .insert(validLines.map((line) => ({
          delivery_note_id: savedId,
          inventory_item_id: line.inventory_item_id || null,
          item_name: line.item_name,
          quantity: Number(line.quantity),
          unit: line.unit || 'τεμ.',
          notes: line.notes || ''
        })));

      if (linesError) throw linesError;

      setMessage(editingId
        ? '✅ Οι αλλαγές στο πρόχειρο Δελτίο Διακίνησης αποθηκεύτηκαν.'
        : '✅ Το Δελτίο Διακίνησης αποθηκεύτηκε ως ΠΡΟΧΕΙΡΟ. Δεν έχει αφαιρεθεί απόθεμα και δεν έχει διαβιβαστεί στην ΑΑΔΕ.'
      );
      resetForm();
      await loadNotes();
    } catch (e) {
      setMessage(`❌ ${e.message}`);
    } finally {
      setSaving(false);
    }
  }

  function resetForm() {
    setEditingId(null);
    setNote({
      ...EMPTY_NOTE,
      issue_date: new Date().toISOString().slice(0, 10),
      issue_time: new Date().toTimeString().slice(0, 5)
    });
    setLines([]);
  }

  function editDraft(draft) {
    if (draft.status !== 'DRAFT') {
      alert('Μόνο τα πρόχειρα δελτία μπορούν να επεξεργαστούν.');
      return;
    }

    setEditingId(draft.id);
    setNote({
      series: draft.series || 'ΔΔ',
      document_number: draft.document_number || '',
      issue_date: draft.issue_date || new Date().toISOString().slice(0, 10),
      issue_time: draft.issue_time ? String(draft.issue_time).slice(0, 5) : '',
      customer_id: draft.customer_id || '',
      project_id: draft.project_id || '',
      recipient_name: draft.recipient_name || '',
      recipient_afm: draft.recipient_afm || '',
      recipient_address: draft.recipient_address || '',
      loading_address: draft.loading_address || '',
      delivery_address: draft.delivery_address || '',
      movement_purpose: draft.movement_purpose || '',
      vehicle_number: draft.vehicle_number || '',
      carrier_name: draft.carrier_name || '',
      notes: draft.notes || ''
    });

    setLines((draft.delivery_note_lines || [])
      .filter((line) => !line.is_deleted)
      .map((line) => ({
        key: line.id || crypto.randomUUID(),
        inventory_item_id: line.inventory_item_id || '',
        item_name: line.item_name || '',
        quantity: line.quantity ?? '',
        unit: line.unit || 'τεμ.',
        notes: line.notes || ''
      })));

    setMessage('✏️ Επεξεργάζεσαι πρόχειρο Δελτίο Διακίνησης.');
    window.scrollTo({ top: 0, behavior: 'smooth' });
  }

  async function deleteDraft(draft) {
    if (draft.status !== 'DRAFT') {
      alert('Μόνο τα πρόχειρα δελτία μπορούν να διαγραφούν από εδώ.');
      return;
    }

    const ok = window.confirm('Να διαγραφεί αυτό το πρόχειρο Δελτίο Διακίνησης;');
    if (!ok) return;

    const { error } = await supabase
      .from('delivery_notes')
      .update({
        is_deleted: true,
        updated_at: new Date().toISOString()
      })
      .eq('id', draft.id)
      .eq('status', 'DRAFT');

    if (error) {
      alert(error.message);
      return;
    }

    if (editingId === draft.id) resetForm();
    setMessage('🗑️ Το πρόχειρο Δελτίο Διακίνησης διαγράφηκε.');
    await loadNotes();
  }



  async function finalizeDraft(draft) {
    if (draft.status !== 'DRAFT') {
      alert('Το δελτίο έχει ήδη οριστικοποιηθεί.');
      return;
    }

    const draftLines = (draft.delivery_note_lines || []).filter((x) => !x.is_deleted);
    if (draftLines.length === 0) {
      alert('Το δελτίο δεν έχει υλικά.');
      return;
    }

    for (const line of draftLines) {
      if (!line.inventory_item_id) {
        alert(`Το υλικό "${line.item_name}" δεν είναι συνδεδεμένο με την αποθήκη.`);
        return;
      }
      const available = stockFor(line.inventory_item_id, inventoryMovements);
      if (Number(line.quantity || 0) > available) {
        alert(`Δεν υπάρχει αρκετό απόθεμα για "${line.item_name}". Διαθέσιμα: ${available} ${line.unit || 'τεμ.'}`);
        return;
      }
    }

    const ok = window.confirm(
      'Να οριστικοποιηθεί το Δελτίο Διακίνησης; Μετά την οριστικοποίηση δεν θα μπορεί να επεξεργαστεί ή να διαγραφεί και τα υλικά θα αφαιρεθούν από την αποθήκη.'
    );
    if (!ok) return;

    setSaving(true);
    setMessage('');

    try {
      const movementRows = draftLines.map((line) => ({
        item_id: line.inventory_item_id,
        movement_date: draft.issue_date,
        movement_type: 'USE',
        quantity: Number(line.quantity || 0),
        unit_price: 0,
        project_id: draft.project_id || null,
        notes: `Δελτίο Διακίνησης ${draft.series || 'ΔΔ'} ${draft.document_number || ''}`.trim()
      }));

      const { error: movementError } = await supabase
        .from('inventory_movements')
        .insert(movementRows);

      if (movementError) throw movementError;

      const { error: noteError } = await supabase
        .from('delivery_notes')
        .update({
          status: 'FINALIZED',
          updated_at: new Date().toISOString()
        })
        .eq('id', draft.id)
        .eq('status', 'DRAFT');

      if (noteError) throw noteError;

      setMessage('✅ Το Δελτίο Διακίνησης οριστικοποιήθηκε και τα υλικά αφαιρέθηκαν από την αποθήκη.');
      if (typeof onInventoryChanged === 'function') await onInventoryChanged();
      await loadNotes();
    } catch (e) {
      setMessage(`❌ ${e.message}`);
    } finally {
      setSaving(false);
    }
  }

  function escapeHtml(value) {
    return String(value ?? '')
      .replaceAll('&', '&amp;')
      .replaceAll('<', '&lt;')
      .replaceAll('>', '&gt;')
      .replaceAll('"', '&quot;')
      .replaceAll("'", '&#039;');
  }

  function formatDateGr(value) {
    if (!value) return '—';
    const [y, m, d] = String(value).slice(0, 10).split('-');
    return y && m && d ? `${d}/${m}/${y}` : value;
  }

  function printDeliveryNote(draft) {
    const project = projects.find((x) => x.id === draft.project_id);
    const projectName = project?.title || project?.project_name || project?.name || '';
    const draftLines = (draft.delivery_note_lines || []).filter((x) => !x.is_deleted);
    const rows = draftLines.length
      ? draftLines.map((line, index) => `
          <tr>
            <td class="center">${index + 1}</td>
            <td>${escapeHtml(line.item_name || '')}${line.notes ? `<div class="line-note">${escapeHtml(line.notes)}</div>` : ''}</td>
            <td class="center">${escapeHtml(line.quantity)}</td>
            <td class="center">${escapeHtml(line.unit || 'τεμ.')}</td>
          </tr>`).join('')
      : '<tr><td colspan="4" class="center">Δεν υπάρχουν υλικά.</td></tr>';

    const popup = window.open('', '_blank', 'width=950,height=900');
    if (!popup) {
      alert('Ο browser μπλόκαρε το παράθυρο PDF. Επίτρεψε τα pop-ups για το ERP.');
      return;
    }

    popup.document.write(`<!doctype html>
<html lang="el">
<head>
<meta charset="utf-8"/>
<title>Δελτίο Διακίνησης ${escapeHtml(draft.series || 'ΔΔ')} ${escapeHtml(draft.document_number || 'ΠΡΟΣΧΕΔΙΟ')}</title>
<style>
  @page { size: A4; margin: 10mm 13mm; }
  * { box-sizing: border-box; }
  body { font-family: Arial, Helvetica, sans-serif; color:#111; margin:0; font-size:11px; }
  .page { width:100%; }
  .header { display:grid; grid-template-columns:150px 1fr; align-items:center; gap:16px; padding-bottom:8px; border-bottom:2px solid #b99045; }
  .logo-box { background:#050505; padding:9px; text-align:center; min-height:72px; display:flex; align-items:center; justify-content:center; }
  .logo-box img { width:128px; max-height:64px; object-fit:contain; }
  .company { line-height:1.45; }
  .company strong { font-size:13px; }
  h1 { text-align:center; font-size:22px; margin:18px 0 12px; }
  .doc-info { display:grid; grid-template-columns:repeat(4,1fr); background:#f6f1e7; border:1px solid #d8d1c4; margin-bottom:12px; }
  .doc-info div { padding:8px; border-right:1px solid #d8d1c4; }
  .doc-info div:last-child { border-right:0; }
  .label { font-weight:700; display:block; margin-bottom:3px; }
  .section { border:1px solid #d8d1c4; margin:10px 0; }
  .section-title { background:#111; color:#fff; font-weight:700; padding:6px 8px; }
  .field { display:grid; grid-template-columns:165px 1fr; border-top:1px solid #e4dfd6; }
  .field:first-of-type { border-top:0; }
  .field div { padding:5px 8px; }
  .field div:first-child { font-weight:700; border-right:1px solid #e4dfd6; }
  .materials-title { font-weight:700; margin:12px 0 5px; }
  table { width:100%; border-collapse:collapse; }
  th { background:#b99045; color:#fff; padding:7px 6px; font-size:10px; }
  td { border:1px solid #d8d1c4; padding:7px 6px; vertical-align:top; }
  .center { text-align:center; }
  .line-note { color:#666; font-size:9px; margin-top:3px; }
  .notes { border:1px solid #d8d1c4; margin-top:11px; }
  .notes-title { background:#f6f1e7; font-weight:700; padding:6px 8px; }
  .notes-body { min-height:36px; padding:7px 8px; white-space:pre-wrap; }
  .mydata { display:grid; grid-template-columns:1fr 150px; border:1px solid #b99045; margin-top:11px; }
  .mydata > div { padding:7px 8px; }
  .mydata > div + div { border-left:1px solid #d8d1c4; text-align:center; }
  .signatures { display:grid; grid-template-columns:1fr 1fr; gap:28px; margin-top:18px; text-align:center; }
  .signature { border-top:1px solid #d8d1c4; padding-top:6px; min-height:54px; }
  .tagline {
    position: fixed;
    left: 0;
    right: 0;
    bottom: 4mm;
    color:#b99045;
    font-weight:700;
    text-align:center;
    letter-spacing:.4px;
  }
  @media print { .no-print { display:none !important; } body { print-color-adjust:exact; -webkit-print-color-adjust:exact; } }
</style>
</head>
<body>
<div class="page">
  <div class="header">
    <div class="logo-box"><img src="/tdmani-logo-gold.png" alt="TD MANI"/></div>
    <div class="company"><strong>TD MANI E.E.</strong><br/>
      ΚΑΤΑΣΚΕΥΗ ΚΤΙΡΙΩΝ ΓΙΑ ΚΑΤΟΙΚΙΕΣ ΚΑΙ ΜΗ<br/>
      ΑΦΜ: 801853358<br/>Πλάκες, Μήλος 84800<br/>
      Τηλ.: 697 814 1512 &nbsp; | &nbsp; taulant.m@yahoo.com
    </div>
  </div>

  <h1>ΔΕΛΤΙΟ ΔΙΑΚΙΝΗΣΗΣ</h1>

  <div class="doc-info">
    <div><span class="label">Σειρά</span>${escapeHtml(draft.series || 'ΔΔ')}</div>
    <div><span class="label">Αριθμός</span>${escapeHtml(draft.document_number || 'ΠΡΟΣΧΕΔΙΟ')}</div>
    <div><span class="label">Ημερομηνία</span>${escapeHtml(formatDateGr(draft.issue_date))}</div>
    <div><span class="label">Ώρα</span>${escapeHtml(draft.issue_time ? String(draft.issue_time).slice(0,5) : '—')}</div>
  </div>

  <div class="section">
    <div class="section-title">ΣΤΟΙΧΕΙΑ ΠΑΡΑΛΗΠΤΗ</div>
    <div class="field"><div>Επωνυμία / Ονοματεπώνυμο</div><div>${escapeHtml(draft.recipient_name || '—')}</div></div>
    <div class="field"><div>ΑΦΜ</div><div>${escapeHtml(draft.recipient_afm || '—')}</div></div>
    <div class="field"><div>Διεύθυνση</div><div>${escapeHtml(draft.recipient_address || '—')}</div></div>
    <div class="field"><div>Έργο</div><div>${escapeHtml(projectName || '—')}</div></div>
  </div>

  <div class="section">
    <div class="section-title">ΣΤΟΙΧΕΙΑ ΔΙΑΚΙΝΗΣΗΣ</div>
    <div class="field"><div>Τόπος φόρτωσης</div><div>${escapeHtml(draft.loading_address || '—')}</div></div>
    <div class="field"><div>Τόπος παράδοσης</div><div>${escapeHtml(draft.delivery_address || '—')}</div></div>
    <div class="field"><div>Σκοπός διακίνησης</div><div>${escapeHtml(draft.movement_purpose || '—')}</div></div>
    <div class="field"><div>Αρ. κυκλοφορίας</div><div>${escapeHtml(draft.vehicle_number || '—')}</div></div>
    <div class="field"><div>Μεταφορέας</div><div>${escapeHtml(draft.carrier_name || '—')}</div></div>
  </div>

  <div class="materials-title">ΥΛΙΚΑ ΔΙΑΚΙΝΗΣΗΣ</div>
  <table>
    <thead><tr><th style="width:45px">Α/Α</th><th>ΠΕΡΙΓΡΑΦΗ ΥΛΙΚΟΥ</th><th style="width:90px">ΠΟΣΟΤΗΤΑ</th><th style="width:75px">Μ.Μ.</th></tr></thead>
    <tbody>${rows}</tbody>
  </table>

  <div class="notes">
    <div class="notes-title">ΠΑΡΑΤΗΡΗΣΕΙΣ</div>
    <div class="notes-body">${escapeHtml(draft.notes || '')}</div>
  </div>

  <div class="mydata">
    <div><b>myDATA / ΑΑΔΕ</b><br/>MARK: ${escapeHtml(draft.mydata_mark || 'Θα συμπληρώνεται μετά την επιτυχή διαβίβαση.')}</div>
    <div><b>QR CODE</b><br/>${draft.mydata_qr_url ? 'Διαθέσιμο μετά τη διαβίβαση' : 'Θέση QR μετά τη διαβίβαση'}</div>
  </div>

  <div class="signatures">
    <div class="signature"><b>ΠΑΡΑΔΟΣΗ</b><br/><small>Ονοματεπώνυμο / Υπογραφή</small></div>
    <div class="signature"><b>ΠΑΡΑΛΑΒΗ</b><br/><small>Ονοματεπώνυμο / Υπογραφή</small></div>
  </div>

  <div class="tagline">TD MANI • FROM VISION TO REALITY</div>
</div>
<script>
  window.onload = () => setTimeout(() => window.print(), 350);
</script>
</body>
</html>`);
    popup.document.close();
  }

  return (
    <section className="card">
      <button onClick={onBack}>← Πίσω στα Έσοδα / Έξοδα</button>
      <h2>🚚 Δελτίο Διακίνησης</h2>
      <p>Πρώτη έκδοση για μορφοποίηση. Προς το παρόν αποθηκεύουμε μόνο <b>ΠΡΟΧΕΙΡΑ</b> — χωρίς διαβίβαση στην ΑΑΔΕ και χωρίς αφαίρεση stock.</p>

      <div className="grid">
        <div>
          <label>Σειρά</label>
          <input value={note.series} onChange={(e) => setNote({ ...note, series: e.target.value })} />
        </div>
        <div>
          <label>Αριθμός</label>
          <input placeholder="Θα οριστικοποιήσουμε την αρίθμηση μετά" value={note.document_number} onChange={(e) => setNote({ ...note, document_number: e.target.value })} />
        </div>
        <div>
          <label>Ημερομηνία</label>
          <input type="date" value={note.issue_date} onChange={(e) => setNote({ ...note, issue_date: e.target.value })} />
        </div>
        <div>
          <label>Ώρα</label>
          <input type="time" value={note.issue_time} onChange={(e) => setNote({ ...note, issue_time: e.target.value })} />
        </div>
      </div>

      <h3>Παραλήπτης / Έργο</h3>
      <div className="grid">
        <select value={note.customer_id} onChange={(e) => chooseCustomer(e.target.value)}>
          <option value="">— Επιλογή πελάτη —</option>
          {customers.filter((x) => !x.is_deleted).map((x) => <option key={x.id} value={x.id}>{x.name}</option>)}
        </select>
        <select
          value={note.project_id}
          onChange={(e) => chooseProject(e.target.value)}
          disabled={!note.customer_id}
        >
          <option value="">
            {note.customer_id ? '— Χωρίς έργο / Προαιρετικό —' : '— Πρώτα επίλεξε πελάτη —'}
          </option>
          {projects
            .filter((x) => !x.is_deleted && x.customer_id === note.customer_id)
            .map((x) => (
              <option key={x.id} value={x.id}>
                {x.title || x.project_name || x.name || 'Έργο'}
              </option>
            ))}
        </select>
        <input placeholder="Επωνυμία / Ονοματεπώνυμο παραλήπτη" value={note.recipient_name} onChange={(e) => setNote({ ...note, recipient_name: e.target.value })} />
        <input placeholder="ΑΦΜ παραλήπτη" value={note.recipient_afm} onChange={(e) => setNote({ ...note, recipient_afm: e.target.value })} />
        <input placeholder="Διεύθυνση παραλήπτη" value={note.recipient_address} onChange={(e) => setNote({ ...note, recipient_address: e.target.value })} />
        <input placeholder="Διεύθυνση παράδοσης" value={note.delivery_address} onChange={(e) => setNote({ ...note, delivery_address: e.target.value })} />
      </div>

      <h3>Στοιχεία Διακίνησης</h3>
      <div className="grid">
        <input placeholder="Τόπος φόρτωσης" value={note.loading_address} onChange={(e) => setNote({ ...note, loading_address: e.target.value })} />
        <input placeholder="Σκοπός διακίνησης" value={note.movement_purpose} onChange={(e) => setNote({ ...note, movement_purpose: e.target.value })} />
        <input placeholder="Αρ. κυκλοφορίας οχήματος" value={note.vehicle_number} onChange={(e) => setNote({ ...note, vehicle_number: e.target.value.toUpperCase() })} />
        <input placeholder="Μεταφορέας" value={note.carrier_name} onChange={(e) => setNote({ ...note, carrier_name: e.target.value })} />
      </div>

      <h3>📦 Υλικά</h3>
      <div style={{display:'flex', gap:8, flexWrap:'wrap', marginBottom:12}}>
        <button onClick={addWarehouseLine}>+ Υλικό από Αποθήκη</button>
        <button onClick={addNewMaterial}>+ Νέο Υλικό</button>
      </div>

      {lines.length === 0 ? <p>Δεν έχουν προστεθεί υλικά.</p> : lines.map((line, index) => {
        const available = line.inventory_item_id ? stockFor(line.inventory_item_id, inventoryMovements) : 0;
        return (
          <div className="line" key={line.key}>
            <p><b>Υλικό {index + 1}</b></p>
            <select value={line.inventory_item_id} onChange={(e) => selectMaterial(line.key, e.target.value)}>
              <option value="">— Επιλογή υλικού —</option>
              {activeInventory.map((item) => (
                <option key={item.id} value={item.id}>
                  {item.item_name} — διαθέσιμα {stockFor(item.id, inventoryMovements)} {item.unit || 'τεμ.'}
                </option>
              ))}
            </select>
            <div className="grid">
              <input placeholder="Περιγραφή υλικού" value={line.item_name} onChange={(e) => updateLine(line.key, { item_name: e.target.value })} />
              <input type="number" min="0" step="any" placeholder="Ποσότητα" value={line.quantity} onChange={(e) => updateLine(line.key, { quantity: e.target.value })} />
              <input placeholder="Μονάδα" value={line.unit} onChange={(e) => updateLine(line.key, { unit: e.target.value })} />
            </div>
            {line.inventory_item_id && <small>Διαθέσιμο υπόλοιπο: <b>{available} {line.unit}</b></small>}
            <textarea placeholder="Παρατήρηση γραμμής" value={line.notes} onChange={(e) => updateLine(line.key, { notes: e.target.value })} />
            <button onClick={() => removeLine(line.key)}>🗑 Αφαίρεση υλικού</button>
          </div>
        );
      })}

      <textarea placeholder="Γενικές παρατηρήσεις" value={note.notes} onChange={(e) => setNote({ ...note, notes: e.target.value })} />

      <div style={{display:'flex', gap:8, flexWrap:'wrap'}}>
        <button onClick={saveDraft} disabled={saving}>
          {saving ? 'Αποθήκευση...' : editingId ? '💾 Αποθήκευση αλλαγών' : '💾 Αποθήκευση ως Πρόχειρο'}
        </button>
        {editingId && (
          <button onClick={resetForm} disabled={saving}>✖ Ακύρωση επεξεργασίας</button>
        )}
      </div>

      {message && <p><b>{message}</b></p>}

      <hr />
      <h3>Αποθηκευμένα Δελτία</h3>
      {savedNotes.length === 0 ? <p>Δεν υπάρχουν δελτία ακόμα.</p> : savedNotes.map((d) => (
        <div className="line" key={d.id}>
          <p><b>{d.series || 'ΔΔ'} {d.document_number || 'Χωρίς αριθμό'}</b> — {d.issue_date}</p>
          <p>{d.recipient_name || 'Χωρίς παραλήπτη'} • {d.delivery_note_lines?.length || 0} υλικά</p>
          <small>Κατάσταση: {d.status === 'DRAFT' ? 'ΠΡΟΧΕΙΡΟ' : d.status}</small>
          <div style={{display:'flex', gap:8, flexWrap:'wrap', marginTop:10}}>
            <button onClick={() => printDeliveryNote(d)}>📄 PDF</button>
            {d.status === 'DRAFT' && (
              <>
                <button onClick={() => editDraft(d)}>✏️ Επεξεργασία</button>
                <button onClick={() => deleteDraft(d)}>🗑️ Διαγραφή</button>
                <button onClick={() => finalizeDraft(d)} disabled={saving}>✅ Οριστικοποίηση</button>
              </>
            )}
          </div>
        </div>
      ))}
    </section>
  );
}
