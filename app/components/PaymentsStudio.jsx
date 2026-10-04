'use client';

import { useMemo, useState } from 'react';

const today = () => new Date().toISOString().slice(0, 10);
const euro = (value) => new Intl.NumberFormat('el-GR', { style: 'currency', currency: 'EUR' }).format(Number(value || 0));
const greekDate = (value) => value ? new Date(`${value}T12:00:00`).toLocaleDateString('el-GR') : '-';
const num = (value) => Number(value || 0);

function Status({ total, paid, dueDate }) {
  const balance = Math.max(num(total) - num(paid), 0);
  let label = 'Απλήρωτο';
  let cls = 'unpaid';
  if (balance <= 0 && num(total) > 0) { label = 'Εξοφλημένο'; cls = 'paid'; }
  else if (num(paid) > 0) { label = 'Μερικώς'; cls = 'partial'; }
  else if (dueDate && dueDate < today()) { label = 'Ληξιπρόθεσμο'; cls = 'overdue'; }
  return <span className={`pay-status ${cls}`}>{label}</span>;
}

export default function PaymentsStudio({
  suppliers = [],
  supplierInvoices = [],
  supplierPayments = [],
  payrollObligations = [],
  publicObligations = [],
  supabase,
  onRefresh
}) {
  const [tab, setTab] = useState('payroll');
  const [saving, setSaving] = useState(false);
  const [supplierForm, setSupplierForm] = useState({ supplier_id: '', supplier_invoice_id: '', payment_date: today(), amount: '', method: 'Τράπεζα', notes: '' });
  const [payrollForm, setPayrollForm] = useState({ employee_name: '', period: '', due_date: today(), amount: '', paid_amount: '0', notes: '' });
  const [publicForm, setPublicForm] = useState({ authority: 'e-ΕΦΚΑ', obligation_type: '', period: '', due_date: today(), amount: '', paid_amount: '0', notes: '' });

  const supplierPaid = (invoiceId) => supplierPayments
    .filter((p) => !p.is_deleted && String(p.supplier_invoice_id || '') === String(invoiceId))
    .reduce((s, p) => s + num(p.amount), 0);

  const openSupplierInvoices = useMemo(() => supplierInvoices
    .filter((x) => !x.is_deleted)
    .map((invoice) => ({ ...invoice, paid: supplierPaid(invoice.id) }))
    .map((invoice) => ({ ...invoice, balance: Math.max(num(invoice.total_amount) - invoice.paid, 0) }))
    .filter((invoice) => invoice.balance > 0.009), [supplierInvoices, supplierPayments]);

  const payrollOpen = payrollObligations.filter((x) => !x.is_deleted).reduce((s, x) => s + Math.max(num(x.amount) - num(x.paid_amount), 0), 0);
  const supplierOpen = openSupplierInvoices.reduce((s, x) => s + x.balance, 0);
  const publicOpen = publicObligations.filter((x) => !x.is_deleted).reduce((s, x) => s + Math.max(num(x.amount) - num(x.paid_amount), 0), 0);
  const grandTotal = payrollOpen + supplierOpen + publicOpen;

  const supplierName = (id) => suppliers.find((x) => String(x.id) === String(id))?.name || 'Προμηθευτής';

  async function saveSupplierPayment() {
    if (!supplierForm.supplier_id || !supplierForm.amount || !supplierForm.payment_date) return alert('Συμπλήρωσε προμηθευτή, ημερομηνία και ποσό.');
    setSaving(true);
    const { error } = await supabase.from('supplier_payments').insert([{
      supplier_id: supplierForm.supplier_id,
      supplier_invoice_id: supplierForm.supplier_invoice_id || null,
      payment_date: supplierForm.payment_date,
      amount: num(supplierForm.amount),
      method: supplierForm.method,
      notes: supplierForm.notes
    }]);
    setSaving(false);
    if (error) return alert(error.message);
    setSupplierForm({ supplier_id: '', supplier_invoice_id: '', payment_date: today(), amount: '', method: 'Τράπεζα', notes: '' });
    await onRefresh?.();
  }

  async function savePayroll() {
    if (!payrollForm.employee_name || !payrollForm.amount || !payrollForm.due_date) return alert('Συμπλήρωσε εργαζόμενο/περιγραφή, ποσό και λήξη.');
    setSaving(true);
    const { error } = await supabase.from('payroll_obligations').insert([{
      ...payrollForm, amount: num(payrollForm.amount), paid_amount: num(payrollForm.paid_amount)
    }]);
    setSaving(false);
    if (error) return alert(error.message);
    setPayrollForm({ employee_name: '', period: '', due_date: today(), amount: '', paid_amount: '0', notes: '' });
    await onRefresh?.();
  }

  async function savePublic() {
    if (!publicForm.authority || !publicForm.obligation_type || !publicForm.amount || !publicForm.due_date) return alert('Συμπλήρωσε φορέα, υποχρέωση, ποσό και λήξη.');
    setSaving(true);
    const { error } = await supabase.from('public_obligations').insert([{
      ...publicForm, amount: num(publicForm.amount), paid_amount: num(publicForm.paid_amount)
    }]);
    setSaving(false);
    if (error) return alert(error.message);
    setPublicForm({ authority: 'e-ΕΦΚΑ', obligation_type: '', period: '', due_date: today(), amount: '', paid_amount: '0', notes: '' });
    await onRefresh?.();
  }

  async function markPaid(table, row) {
    const { error } = await supabase.from(table).update({ paid_amount: num(row.amount), paid_date: today() }).eq('id', row.id);
    if (error) return alert(error.message);
    await onRefresh?.();
  }

  return (
    <section className="payments-studio">
      <style>{`
        .payments-studio{max-width:1280px;margin:0 auto;padding:18px 16px 40px;color:#202124}
        .pay-head{display:flex;justify-content:space-between;gap:20px;align-items:end;margin-bottom:18px}
        .pay-head h1{margin:0;font-size:28px}.pay-head p{margin:5px 0 0;color:#6b7280}
        .pay-total{background:#151515;color:#fff;border-radius:16px;padding:14px 20px;min-width:210px}
        .pay-total small{display:block;color:#d5b36a}.pay-total b{font-size:25px}
        .pay-cards{display:grid;grid-template-columns:repeat(3,1fr);gap:12px;margin-bottom:16px}
        .pay-card{background:#fff;border:1px solid #e8e1d4;border-radius:16px;padding:16px;box-shadow:0 5px 18px #0000000b}
        .pay-card span{color:#6b7280;font-size:13px}.pay-card b{display:block;font-size:22px;margin-top:5px}
        .pay-tabs{display:flex;gap:8px;flex-wrap:wrap;margin:14px 0}.pay-tabs button{border:1px solid #d9d2c5;background:#fff;border-radius:12px;padding:11px 16px;font-weight:700;cursor:pointer}
        .pay-tabs button.active{background:#151515;color:#d8b66b;border-color:#151515}
        .pay-panel{background:#fff;border:1px solid #e8e1d4;border-radius:18px;padding:18px;box-shadow:0 5px 18px #0000000b}
        .pay-panel h2{margin-top:0}.pay-form{display:grid;grid-template-columns:repeat(3,1fr);gap:10px;margin-bottom:20px}
        .pay-form input,.pay-form select,.pay-form textarea{width:100%;box-sizing:border-box;border:1px solid #ddd4c5;border-radius:10px;padding:11px;background:#fff}
        .pay-form textarea{grid-column:span 2;min-height:44px}.pay-primary{border:0;border-radius:10px;background:#b9954e;color:#fff;font-weight:800;padding:11px 16px;cursor:pointer}
        .pay-table-wrap{overflow:auto}.pay-table{width:100%;border-collapse:collapse;min-width:760px}.pay-table th{background:#f3ead9;text-align:left;font-size:12px;padding:10px;border-bottom:1px solid #ddcfb6}.pay-table td{padding:11px 10px;border-bottom:1px solid #eee;font-size:14px}
        .pay-status{display:inline-block;padding:5px 9px;border-radius:999px;font-size:11px;font-weight:800}.pay-status.paid{background:#e5f5ea;color:#18733a}.pay-status.partial{background:#fff2cc;color:#8a6500}.pay-status.unpaid{background:#f3f4f6;color:#4b5563}.pay-status.overdue{background:#fde7e7;color:#b42318}
        .pay-small-btn{border:1px solid #cdb783;background:#fff;border-radius:8px;padding:6px 9px;cursor:pointer}
        @media(max-width:800px){.pay-head{display:block}.pay-total{margin-top:12px}.pay-cards,.pay-form{grid-template-columns:1fr}.pay-form textarea{grid-column:auto}.payments-studio{padding:12px 10px}.pay-head h1{font-size:24px}}
      `}</style>

      <div className="pay-head">
        <div><h1>💳 Πληρωμές</h1><p>Κεντρική εικόνα υποχρεώσεων και πληρωμών της TD MANI.</p></div>
        <div className="pay-total"><small>Συνολικό ανοιχτό υπόλοιπο</small><b>{euro(grandTotal)}</b></div>
      </div>

      <div className="pay-cards">
        <div className="pay-card"><span>👷 Μισθοδοσία</span><b>{euro(payrollOpen)}</b></div>
        <div className="pay-card"><span>🧱 Προμηθευτές</span><b>{euro(supplierOpen)}</b></div>
        <div className="pay-card"><span>🏛️ Δημόσιο</span><b>{euro(publicOpen)}</b></div>
      </div>

      <div className="pay-tabs">
        <button className={tab==='payroll'?'active':''} onClick={()=>setTab('payroll')}>👷 Μισθοδοσία</button>
        <button className={tab==='suppliers'?'active':''} onClick={()=>setTab('suppliers')}>🧱 Προμηθευτές</button>
        <button className={tab==='public'?'active':''} onClick={()=>setTab('public')}>🏛️ Δημόσιο</button>
      </div>

      {tab === 'payroll' && <div className="pay-panel">
        <h2>Μισθοδοσία</h2>
        <div className="pay-form">
          <input placeholder="Εργαζόμενος / περιγραφή" value={payrollForm.employee_name} onChange={e=>setPayrollForm({...payrollForm,employee_name:e.target.value})}/>
          <input placeholder="Περίοδος π.χ. 10/2026" value={payrollForm.period} onChange={e=>setPayrollForm({...payrollForm,period:e.target.value})}/>
          <input type="date" value={payrollForm.due_date} onChange={e=>setPayrollForm({...payrollForm,due_date:e.target.value})}/>
          <input type="number" step="0.01" placeholder="Ποσό" value={payrollForm.amount} onChange={e=>setPayrollForm({...payrollForm,amount:e.target.value})}/>
          <input type="number" step="0.01" placeholder="Ήδη πληρωμένο" value={payrollForm.paid_amount} onChange={e=>setPayrollForm({...payrollForm,paid_amount:e.target.value})}/>
          <button className="pay-primary" disabled={saving} onClick={savePayroll}>Αποθήκευση</button>
          <textarea placeholder="Σημειώσεις" value={payrollForm.notes} onChange={e=>setPayrollForm({...payrollForm,notes:e.target.value})}/>
        </div>
        <div className="pay-table-wrap"><table className="pay-table"><thead><tr><th>Εργαζόμενος</th><th>Περίοδος</th><th>Λήξη</th><th>Ποσό</th><th>Πληρωμένο</th><th>Υπόλοιπο</th><th>Κατάσταση</th><th></th></tr></thead><tbody>
          {payrollObligations.filter(x=>!x.is_deleted).map(x=><tr key={x.id}><td>{x.employee_name}</td><td>{x.period||'-'}</td><td>{greekDate(x.due_date)}</td><td>{euro(x.amount)}</td><td>{euro(x.paid_amount)}</td><td>{euro(Math.max(num(x.amount)-num(x.paid_amount),0))}</td><td><Status total={x.amount} paid={x.paid_amount} dueDate={x.due_date}/></td><td>{num(x.paid_amount)<num(x.amount)&&<button className="pay-small-btn" onClick={()=>markPaid('payroll_obligations',x)}>✓ Εξόφληση</button>}</td></tr>)}
          {!payrollObligations.filter(x=>!x.is_deleted).length && <tr><td colSpan="8">Δεν υπάρχουν εγγραφές.</td></tr>}
        </tbody></table></div>
      </div>}

      {tab === 'suppliers' && <div className="pay-panel">
        <h2>Προμηθευτές</h2>
        <div className="pay-form">
          <select value={supplierForm.supplier_id} onChange={e=>setSupplierForm({...supplierForm,supplier_id:e.target.value,supplier_invoice_id:''})}><option value="">Διάλεξε προμηθευτή</option>{suppliers.filter(x=>!x.is_deleted).map(x=><option key={x.id} value={x.id}>{x.name}</option>)}</select>
          <select value={supplierForm.supplier_invoice_id} onChange={e=>{const id=e.target.value;const inv=openSupplierInvoices.find(x=>String(x.id)===String(id));setSupplierForm({...supplierForm,supplier_invoice_id:id,amount:inv?String(inv.balance):supplierForm.amount})}}><option value="">Χωρίς τιμολόγιο / προκαταβολή</option>{openSupplierInvoices.filter(x=>!supplierForm.supplier_id||String(x.supplier_id)===String(supplierForm.supplier_id)).map(x=><option key={x.id} value={x.id}>{x.invoice_number||'Χωρίς αριθμό'} — {euro(x.balance)}</option>)}</select>
          <input type="date" value={supplierForm.payment_date} onChange={e=>setSupplierForm({...supplierForm,payment_date:e.target.value})}/>
          <input type="number" step="0.01" placeholder="Ποσό πληρωμής" value={supplierForm.amount} onChange={e=>setSupplierForm({...supplierForm,amount:e.target.value})}/>
          <select value={supplierForm.method} onChange={e=>setSupplierForm({...supplierForm,method:e.target.value})}><option>Τράπεζα</option><option>Μετρητά</option><option>IRIS</option><option>POS</option><option>Επιταγή</option></select>
          <button className="pay-primary" disabled={saving} onClick={saveSupplierPayment}>Καταχώρηση πληρωμής</button>
          <textarea placeholder="Σημειώσεις" value={supplierForm.notes} onChange={e=>setSupplierForm({...supplierForm,notes:e.target.value})}/>
        </div>
        <div className="pay-table-wrap"><table className="pay-table"><thead><tr><th>Προμηθευτής</th><th>Τιμολόγιο</th><th>Ημερομηνία</th><th>Σύνολο</th><th>Πληρωμένο</th><th>Υπόλοιπο</th><th>Κατάσταση</th></tr></thead><tbody>
          {openSupplierInvoices.map(x=><tr key={x.id}><td>{supplierName(x.supplier_id)}</td><td>{x.invoice_number||'-'}</td><td>{greekDate(x.invoice_date)}</td><td>{euro(x.total_amount)}</td><td>{euro(x.paid)}</td><td>{euro(x.balance)}</td><td><Status total={x.total_amount} paid={x.paid}/></td></tr>)}
          {!openSupplierInvoices.length && <tr><td colSpan="7">Δεν υπάρχουν ανοιχτά υπόλοιπα προμηθευτών.</td></tr>}
        </tbody></table></div>
      </div>}

      {tab === 'public' && <div className="pay-panel">
        <h2>Δημόσιο</h2>
        <div className="pay-form">
          <select value={publicForm.authority} onChange={e=>setPublicForm({...publicForm,authority:e.target.value})}><option>e-ΕΦΚΑ</option><option>ΑΑΔΕ</option><option>ΤΕΚΑ</option><option>Δήμος</option><option>Άλλο</option></select>
          <input placeholder="Υποχρέωση π.χ. ΦΠΑ / ΦΜΥ / ΕΦΚΑ" value={publicForm.obligation_type} onChange={e=>setPublicForm({...publicForm,obligation_type:e.target.value})}/>
          <input placeholder="Περίοδος" value={publicForm.period} onChange={e=>setPublicForm({...publicForm,period:e.target.value})}/>
          <input type="date" value={publicForm.due_date} onChange={e=>setPublicForm({...publicForm,due_date:e.target.value})}/>
          <input type="number" step="0.01" placeholder="Ποσό" value={publicForm.amount} onChange={e=>setPublicForm({...publicForm,amount:e.target.value})}/>
          <input type="number" step="0.01" placeholder="Ήδη πληρωμένο" value={publicForm.paid_amount} onChange={e=>setPublicForm({...publicForm,paid_amount:e.target.value})}/>
          <button className="pay-primary" disabled={saving} onClick={savePublic}>Αποθήκευση</button>
          <textarea placeholder="Σημειώσεις / Ταυτότητα οφειλής" value={publicForm.notes} onChange={e=>setPublicForm({...publicForm,notes:e.target.value})}/>
        </div>
        <div className="pay-table-wrap"><table className="pay-table"><thead><tr><th>Φορέας</th><th>Υποχρέωση</th><th>Περίοδος</th><th>Λήξη</th><th>Ποσό</th><th>Υπόλοιπο</th><th>Κατάσταση</th><th></th></tr></thead><tbody>
          {publicObligations.filter(x=>!x.is_deleted).map(x=><tr key={x.id}><td>{x.authority}</td><td>{x.obligation_type}</td><td>{x.period||'-'}</td><td>{greekDate(x.due_date)}</td><td>{euro(x.amount)}</td><td>{euro(Math.max(num(x.amount)-num(x.paid_amount),0))}</td><td><Status total={x.amount} paid={x.paid_amount} dueDate={x.due_date}/></td><td>{num(x.paid_amount)<num(x.amount)&&<button className="pay-small-btn" onClick={()=>markPaid('public_obligations',x)}>✓ Εξόφληση</button>}</td></tr>)}
          {!publicObligations.filter(x=>!x.is_deleted).length && <tr><td colSpan="8">Δεν υπάρχουν εγγραφές.</td></tr>}
        </tbody></table></div>
      </div>}
    </section>
  );
}

