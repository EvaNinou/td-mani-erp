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
          {d.status === 'DRAFT' && (
            <div style={{display:'flex', gap:8, flexWrap:'wrap', marginTop:10}}>
              <button onClick={() => editDraft(d)}>✏️ Επεξεργασία</button>
              <button onClick={() => deleteDraft(d)}>🗑️ Διαγραφή</button>
            </div>
          )}
        </div>
      ))}
    </section>
  );
}
