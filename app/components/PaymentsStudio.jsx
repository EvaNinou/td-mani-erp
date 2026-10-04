'use client';

import { useEffect, useMemo, useState } from 'react';

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
  const [employees, setEmployees] = useState([]);
  const [payrollMonth, setPayrollMonth] = useState(new Date().toISOString().slice(0, 7));
  const [employeeForm, setEmployeeForm] = useState({ id: null, full_name: '', iban: '', bank_amount: '', cash_amount: '', notes: '', is_active: true });
  const [editingPayroll, setEditingPayroll] = useState(null);
  const [supplierForm, setSupplierForm] = useState({ supplier_id: '', supplier_invoice_id: '', payment_date: today(), amount: '', method: 'Τράπεζα', notes: '' });
  const [payrollForm, setPayrollForm] = useState({ employee_name: '', period: '', due_date: today(), bank_amount: '', cash_amount: '', bank_paid: false, cash_paid: false, notes: '' });
  const [publicForm, setPublicForm] = useState({ authority: 'e-ΕΦΚΑ', obligation_type: '', period: '', due_date: today(), amount: '', paid_amount: '0', notes: '' });

  useEffect(() => { loadEmployees(); }, []);

  async function loadEmployees() {
    const { data, error } = await supabase.from('employees').select('*').order('full_name');
    if (!error) setEmployees(data || []);
  }

  const periodLabel = (ym) => {
    if (!ym) return '';
    const [y,m] = ym.split('-');
    return `${m}/${y}`;
  };

  const monthRows = payrollObligations.filter((x) => !x.is_deleted && x.period === periodLabel(payrollMonth));

  const supplierPaid = (invoiceId) => supplierPayments
    .filter((p) => !p.is_deleted && String(p.supplier_invoice_id || '') === String(invoiceId))
    .reduce((s, p) => s + num(p.amount), 0);

  const openSupplierInvoices = useMemo(() => supplierInvoices
    .filter((x) => !x.is_deleted)
    .map((invoice) => ({ ...invoice, paid: supplierPaid(invoice.id) }))
    .map((invoice) => ({ ...invoice, balance: Math.max(num(invoice.total_amount) - invoice.paid, 0) }))
    .filter((invoice) => invoice.balance > 0.009), [supplierInvoices, supplierPayments]);

  const payrollTotal = (x) => num(x.bank_amount) + num(x.cash_amount);
  const payrollPaid = (x) => (x.bank_paid ? num(x.bank_amount) : 0) + (x.cash_paid ? num(x.cash_amount) : 0);
  const payrollOpen = monthRows.reduce((s, x) => s + Math.max(payrollTotal(x) - payrollPaid(x), 0), 0);
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

  async function saveEmployee() {
    if (!employeeForm.full_name.trim()) return alert('Συμπλήρωσε ονοματεπώνυμο εργαζομένου.');
    setSaving(true);
    const payload = {
      full_name: employeeForm.full_name.trim(),
      iban: employeeForm.iban.trim().replace(/\s+/g, '').toUpperCase(),
      bank_amount: num(employeeForm.bank_amount),
      cash_amount: num(employeeForm.cash_amount),
      notes: employeeForm.notes,
      is_active: employeeForm.is_active
    };
    const result = employeeForm.id
      ? await supabase.from('employees').update(payload).eq('id', employeeForm.id)
      : await supabase.from('employees').insert([payload]);
    setSaving(false);
    if (result.error) return alert(result.error.message);
    setEmployeeForm({ id: null, full_name: '', iban: '', bank_amount: '', cash_amount: '', notes: '', is_active: true });
    await loadEmployees();
  }

  function editEmployee(emp) {
    setEmployeeForm({
      id: emp.id, full_name: emp.full_name || '', iban: emp.iban || '',
      bank_amount: String(emp.bank_amount ?? ''), cash_amount: String(emp.cash_amount ?? ''),
      notes: emp.notes || '', is_active: emp.is_active !== false
    });
  }

  async function createMonthPayroll() {
    const period = periodLabel(payrollMonth);
    const active = employees.filter(e => e.is_active !== false);
    if (!active.length) return alert('Δεν υπάρχουν ενεργοί εργαζόμενοι.');
    const existingIds = new Set(payrollObligations.filter(x => !x.is_deleted && x.period === period).map(x => String(x.employee_id || '')));
    const rows = active.filter(e => !existingIds.has(String(e.id))).map(e => ({
      employee_id: e.id,
      employee_name: e.full_name,
      period,
      due_date: `${payrollMonth}-28`,
      bank_amount: num(e.bank_amount),
      cash_amount: num(e.cash_amount),
      bank_paid: false,
      cash_paid: false,
      notes: e.notes || ''
    }));
    if (!rows.length) return alert('Η μισθοδοσία αυτού του μήνα έχει ήδη δημιουργηθεί.');
    setSaving(true);
    const { error } = await supabase.from('payroll_obligations').insert(rows);
    setSaving(false);
    if (error) return alert(error.message);
    await onRefresh?.();
  }

  async function togglePayroll(row, field) {
    const { error } = await supabase.from('payroll_obligations').update({ [field]: !row[field] }).eq('id', row.id);
    if (error) return alert(error.message);
    await onRefresh?.();
  }

  async function savePayrollEdit() {
    if (!editingPayroll) return;
    const { error } = await supabase.from('payroll_obligations').update({
      bank_amount: num(editingPayroll.bank_amount),
      cash_amount: num(editingPayroll.cash_amount),
      notes: editingPayroll.notes || ''
    }).eq('id', editingPayroll.id);
    if (error) return alert(error.message);
    setEditingPayroll(null);
    await onRefresh?.();
  }

  async function deletePayroll(row) {
    if (!confirm(`Να διαγραφεί η εγγραφή μισθοδοσίας του ${row.employee_name};`)) return;
    const { error } = await supabase.from('payroll_obligations').update({ is_deleted: true }).eq('id', row.id);
    if (error) return alert(error.message);
    await onRefresh?.();
  }

  function printPayrollReport() {
    const period = periodLabel(payrollMonth);
    const rows = monthRows.map((x, i) => {
      const emp = employees.find(e => String(e.id) === String(x.employee_id));
      const bank = num(x.bank_amount), cash = num(x.cash_amount);
      const paidBank = x.bank_paid ? bank : 0, paidCash = x.cash_paid ? cash : 0;
      return { ...x, no:i+1, iban:emp?.iban||'-', bank, cash, paidBank, paidCash,
        bankBalance:x.bank_paid?0:bank, cashBalance:x.cash_paid?0:cash };
    });
    const totalBank=rows.reduce((a,x)=>a+x.bank,0), totalCash=rows.reduce((a,x)=>a+x.cash,0);
    const paidBank=rows.reduce((a,x)=>a+x.paidBank,0), paidCash=rows.reduce((a,x)=>a+x.paidCash,0);
    const openBank=rows.reduce((a,x)=>a+x.bankBalance,0), openCash=rows.reduce((a,x)=>a+x.cashBalance,0);
    const total=totalBank+totalCash, paid=paidBank+paidCash, open=openBank+openCash;
    const esc=(v='')=>String(v).replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
    const printDate=new Date().toLocaleDateString('el-GR');
    const html=`<!doctype html><html><head><meta charset="utf-8"><title>TD MANI - Μισθοδοτική Κατάσταση ${esc(period)}</title><style>
      @page{size:A4 landscape;margin:10mm}*{box-sizing:border-box}body{font-family:Arial,sans-serif;color:#24211d;margin:0;background:#fff;font-size:10px}
      .header{display:flex;justify-content:space-between;align-items:center;padding-bottom:10px;border-bottom:2px solid #d7bd8a}.brand{display:flex;align-items:center;gap:12px}.logo{width:64px;height:64px;object-fit:contain;background:#171717;border-radius:8px;padding:5px}.brandname{font-size:21px;font-weight:900;letter-spacing:1px}.subtitle{font-size:10px;color:#8a8175;margin-top:2px}.company{text-align:right;line-height:1.55;color:#5f584f;font-size:9px}
      h1{text-align:center;font-size:23px;margin:14px 0 8px;letter-spacing:.5px}.meta{display:flex;justify-content:space-between;color:#625b52;margin-bottom:10px}.summary{display:grid;grid-template-columns:repeat(3,1fr);gap:10px;margin-bottom:12px}.card{background:#f3ead9;border:1px solid #dfc99f;border-radius:9px;padding:9px 12px}.card span{display:block;color:#756a5c;font-size:9px}.card b{font-size:17px;display:block;margin-top:3px;color:#1e1b17}
      table{width:100%;border-collapse:collapse;border:1px solid #d8d0c4}th{background:#efe3cc;color:#302a23;border:1px solid #d8c7a7;padding:6px 4px;font-size:8.5px}td{border:1px solid #e2ddd4;padding:6px 4px;vertical-align:middle}tbody tr:nth-child(even){background:#fbf8f3}.center{text-align:center}.money{text-align:right;white-space:nowrap}.iban{font-family:monospace;font-size:8px;white-space:nowrap}.ok{color:#1e7a4d;font-weight:900;font-size:13px}.no{color:#a33a31;font-weight:900;font-size:13px}.notes{max-width:130px;white-space:normal}.totals td{background:#f3ead9;font-weight:900;border-top:2px solid #caa55d}
      .bottom{display:grid;grid-template-columns:1.15fr .85fr;gap:12px;margin-top:12px}.box{border:1px solid #dfc99f;border-radius:9px;overflow:hidden}.boxtitle{background:#f3ead9;padding:7px 10px;font-weight:900}.boxbody{padding:8px 10px}.sumrow{display:flex;justify-content:space-between;border-bottom:1px solid #eee6d8;padding:4px 0}.sumrow:last-child{border:0}.sumrow.strong{font-weight:900;background:#faf5eb;margin:2px -5px;padding:5px}.observations{min-height:86px;white-space:pre-wrap;color:#5e574e}.footer{margin-top:10px;padding-top:7px;border-top:1px solid #e2d7c4;display:flex;justify-content:space-between;color:#8b8277;font-size:8px}
      @media print{body{-webkit-print-color-adjust:exact;print-color-adjust:exact}.noprint{display:none}}
    </style></head><body>
      <div class="header"><div class="brand"><img class="logo" src="/tdmani-logo-gold.png" onerror="this.style.display='none'"><div><div class="brandname">TD MANI</div><div class="subtitle">ΟΙΚΟΔΟΜΙΚΕΣ ΕΡΓΑΣΙΕΣ</div></div></div><div class="company"><b>TD MANI E.E.</b><br>Πλάκες, Μήλος 84800<br>ΑΦΜ: 801853358<br>Τηλ.: 697 814 1512<br>taulant.m@yahoo.com</div></div>
      <h1>ΜΙΣΘΟΔΟΤΙΚΗ ΚΑΤΑΣΤΑΣΗ</h1><div class="meta"><div><b>Περίοδος:</b> ${esc(period)}</div><div><b>Ημερομηνία εκτύπωσης:</b> ${printDate}</div></div>
      <div class="summary"><div class="card"><span>Σύνολο μισθοδοσίας</span><b>${euro(total)}</b></div><div class="card"><span>Πληρωμένο</span><b>${euro(paid)}</b></div><div class="card"><span>Υπόλοιπο</span><b>${euro(open)}</b></div></div>
      <table><thead><tr><th>#</th><th>Εργαζόμενος</th><th>IBAN</th><th colspan="3">Τράπεζα</th><th colspan="3">Μετρητά</th><th>Σύνολο</th><th>Σημειώσεις</th></tr><tr><th></th><th></th><th></th><th>Ποσό</th><th>Πληρωμή</th><th>Υπόλ.</th><th>Ποσό</th><th>Πληρωμή</th><th>Υπόλ.</th><th></th><th></th></tr></thead><tbody>
      ${rows.map(x=>`<tr><td class="center">${x.no}</td><td><b>${esc(x.employee_name)}</b></td><td class="iban">${esc(x.iban)}</td><td class="money">${euro(x.bank)}</td><td class="center ${x.bank_paid?'ok':'no'}">${x.bank_paid?'✓':'✕'}</td><td class="money">${euro(x.bankBalance)}</td><td class="money">${euro(x.cash)}</td><td class="center ${x.cash_paid?'ok':'no'}">${x.cash_paid?'✓':'✕'}</td><td class="money">${euro(x.cashBalance)}</td><td class="money"><b>${euro(x.bank+x.cash)}</b></td><td class="notes">${esc(x.notes||'-')}</td></tr>`).join('')}
      <tr class="totals"><td colspan="3">ΣΥΝΟΛΑ</td><td class="money">${euro(totalBank)}</td><td></td><td class="money">${euro(openBank)}</td><td class="money">${euro(totalCash)}</td><td></td><td class="money">${euro(openCash)}</td><td class="money">${euro(total)}</td><td></td></tr></tbody></table>
      <div class="bottom"><div class="box"><div class="boxtitle">ΣΥΝΟΨΗ ΠΛΗΡΩΜΩΝ</div><div class="boxbody"><div class="sumrow"><span>Σύνολο μισθοδοσίας</span><b>${euro(total)}</b></div><div class="sumrow"><span>Πληρωμένο μέσω Τράπεζας</span><b>${euro(paidBank)}</b></div><div class="sumrow"><span>Πληρωμένο με Μετρητά</span><b>${euro(paidCash)}</b></div><div class="sumrow strong"><span>Συνολικά πληρωμένο</span><b>${euro(paid)}</b></div><div class="sumrow"><span>Υπόλοιπο</span><b>${euro(open)}</b></div></div></div>
      <div class="box"><div class="boxtitle">ΠΑΡΑΤΗΡΗΣΕΙΣ</div><div class="boxbody observations">${esc(rows.filter(x=>x.notes).map(x=>`${x.employee_name}: ${x.notes}`).join('\n')||'-')}</div></div></div>
      <div class="footer"><span>TD MANI E.E. · Οικοδομικές Εργασίες</span><span>Μισθοδοτική Κατάσταση ${esc(period)}</span></div>
      <script>window.onload=()=>setTimeout(()=>window.print(),350)<\/script></body></html>`;
    const w=window.open('','_blank','width=1300,height=900'); if(!w)return alert('Επίτρεψε τα αναδυόμενα παράθυρα για να ανοίξει η αναφορά.'); w.document.open();w.document.write(html);w.document.close();
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
        .payments-studio{max-width:1280px;margin:0 auto;padding:18px 16px 40px;color:#eee6da}
        .pay-head{display:flex;justify-content:space-between;gap:20px;align-items:end;margin-bottom:18px}
        .pay-head h1{margin:0;font-size:28px;color:#f6efe5}.pay-head p{margin:5px 0 0;color:#9f9991}
        .pay-total{background:linear-gradient(145deg,#242426,#151516);color:#fff;border:1px solid #39352f;border-radius:16px;padding:14px 20px;min-width:210px;box-shadow:0 10px 25px #0004}
        .pay-total small{display:block;color:#d7b46c}.pay-total b{font-size:25px}
        .pay-cards{display:grid;grid-template-columns:repeat(3,1fr);gap:12px;margin-bottom:16px}
        .pay-card{background:linear-gradient(145deg,#222224,#181819);border:1px solid #34312c;border-radius:16px;padding:16px;box-shadow:0 8px 22px #0004}
        .pay-card span{color:#bcb4a8;font-size:13px}.pay-card b{display:block;color:#fff;font-size:22px;margin-top:5px}
        .pay-tabs{display:flex;gap:8px;flex-wrap:wrap;margin:14px 0}.pay-tabs button{border:1px solid #514b42;background:#1b1b1d;color:#eee6da;border-radius:12px;padding:11px 16px;font-weight:700;cursor:pointer}
        .pay-tabs button.active{background:linear-gradient(135deg,#d2a650,#9d7228);color:#111;border-color:#d2a650}
        .pay-panel{background:linear-gradient(145deg,#1d1d1f,#151516);border:1px solid #322f2a;border-radius:18px;padding:18px;box-shadow:0 10px 28px #0005}
        .pay-panel h2{margin-top:0;color:#f2eadf}.pay-form{display:grid;grid-template-columns:repeat(3,1fr);gap:10px;margin-bottom:20px}
        .pay-form input,.pay-form select,.pay-form textarea{width:100%;box-sizing:border-box;border:1px solid #48423a;border-radius:10px;padding:11px;background:#222224;color:#eee6da;outline:none}
        .pay-form input:focus,.pay-form select:focus,.pay-form textarea:focus{border-color:#cda24e}.pay-form textarea{grid-column:span 2;min-height:44px}.pay-form ::placeholder{color:#817b73}
        .pay-primary{border:0;border-radius:10px;background:linear-gradient(135deg,#d2a650,#956a23);color:#111;font-weight:900;padding:11px 16px;cursor:pointer}
        .pay-table-wrap{overflow:auto;border:1px solid #302d29;border-radius:12px}.pay-table{width:100%;border-collapse:collapse;min-width:800px}.pay-table th{background:#29251f;color:#e0c48b;text-align:left;font-size:12px;padding:10px;border-bottom:1px solid #3a352e}.pay-table td{padding:11px 10px;border-bottom:1px solid #2d2a27;color:#e9e1d6;font-size:14px}
        .pay-status{display:inline-block;padding:5px 9px;border-radius:999px;font-size:11px;font-weight:800}.pay-status.paid{background:#173a2a;color:#8fe0b1}.pay-status.partial{background:#49360e;color:#ffd66f}.pay-status.unpaid{background:#3b2924;color:#ffad9f}.pay-status.overdue{background:#54201e;color:#ffaaa4}
        .pay-small-btn{border:1px solid #514b42;background:#222224;color:#eee6da;border-radius:8px;padding:6px 9px;cursor:pointer}.pay-small-btn.done{background:#20382c;color:#8fe0b1;border-color:#315744}
        .payroll-toolbar{display:flex;justify-content:space-between;gap:12px;align-items:center;margin-bottom:16px;flex-wrap:wrap}.payroll-toolbar-left{display:flex;gap:10px;align-items:center;flex-wrap:wrap}.payroll-toolbar input{width:auto;min-width:165px}
        .employee-box{border:1px solid #39342d;background:#171719;border-radius:14px;padding:14px;margin-bottom:18px}.employee-box h3{margin:0 0 12px;color:#e4c783}.employee-grid{display:grid;grid-template-columns:1.4fr 1.7fr 1fr 1fr auto;gap:9px}.employee-list{display:flex;gap:8px;flex-wrap:wrap;margin-top:12px}.employee-chip{background:#242426;border:1px solid #454038;color:#eee5d8;border-radius:10px;padding:8px 10px;cursor:pointer}.iban{font-family:monospace;font-size:12px;color:#c8bfae;white-space:nowrap}
        .edit-row{background:#211f1b}.edit-input{min-width:100px!important;padding:7px!important}

        @media(max-width:800px){.employee-grid{grid-template-columns:1fr}.payroll-toolbar{align-items:stretch}.payroll-toolbar-left{display:grid;grid-template-columns:1fr}.payroll-toolbar input{width:100%}.pay-head{display:block}.pay-total{margin-top:12px}.pay-cards,.pay-form{grid-template-columns:1fr}.pay-form textarea{grid-column:auto}.payments-studio{padding:12px 10px}.pay-head h1{font-size:24px}}
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

        <div className="employee-box">
          <h3>👷 Καρτέλες εργαζομένων</h3>
          <div className="employee-grid">
            <input placeholder="Ονοματεπώνυμο" value={employeeForm.full_name} onChange={e=>setEmployeeForm({...employeeForm,full_name:e.target.value})}/>
            <input placeholder="IBAN" value={employeeForm.iban} onChange={e=>setEmployeeForm({...employeeForm,iban:e.target.value})}/>
            <input type="number" step="0.01" placeholder="Τράπεζα (€)" value={employeeForm.bank_amount} onChange={e=>setEmployeeForm({...employeeForm,bank_amount:e.target.value})}/>
            <input type="number" step="0.01" placeholder="Μετρητά (€)" value={employeeForm.cash_amount} onChange={e=>setEmployeeForm({...employeeForm,cash_amount:e.target.value})}/>
            <button className="pay-primary" disabled={saving} onClick={saveEmployee}>{employeeForm.id?'Αποθήκευση':'Νέος εργαζόμενος'}</button>
          </div>
          <div className="employee-list">
            {employees.map(emp=><button key={emp.id} className="employee-chip" onClick={()=>editEmployee(emp)}>✏️ {emp.full_name} {emp.iban && <span className="iban"> · {emp.iban}</span>}</button>)}
            {!employees.length && <span style={{color:'#8f8981'}}>Δεν υπάρχουν ακόμη εργαζόμενοι.</span>}
          </div>
        </div>

        <div className="payroll-toolbar">
          <div className="payroll-toolbar-left">
            <strong>📅 Μήνας μισθοδοσίας</strong>
            <input type="month" value={payrollMonth} onChange={e=>setPayrollMonth(e.target.value)}/>
          </div>
          <div style={{display:'flex',gap:8,flexWrap:'wrap'}}><button className="pay-primary" disabled={saving} onClick={createMonthPayroll}>＋ Δημιουργία μισθοδοσίας μήνα</button><button className="pay-small-btn" onClick={printPayrollReport}>🖨️ PDF Μισθοδοτικής Κατάστασης</button></div>
        </div>

        <div className="pay-table-wrap"><table className="pay-table"><thead><tr><th>Εργαζόμενος</th><th>IBAN</th><th>Τράπεζα</th><th>Μετρητά</th><th>Σύνολο</th><th>Πληρωμένο</th><th>Υπόλοιπο</th><th>Κατάσταση</th><th>Σημειώσεις</th><th>Ενέργειες</th></tr></thead><tbody>
          {monthRows.map(x=>{const total=payrollTotal(x),paid=payrollPaid(x),emp=employees.find(e=>String(e.id)===String(x.employee_id));return editingPayroll?.id===x.id ?
            <tr key={x.id} className="edit-row"><td>{x.employee_name}</td><td className="iban">{emp?.iban||'-'}</td><td><input className="edit-input" type="number" value={editingPayroll.bank_amount} onChange={e=>setEditingPayroll({...editingPayroll,bank_amount:e.target.value})}/></td><td><input className="edit-input" type="number" value={editingPayroll.cash_amount} onChange={e=>setEditingPayroll({...editingPayroll,cash_amount:e.target.value})}/></td><td>{euro(num(editingPayroll.bank_amount)+num(editingPayroll.cash_amount))}</td><td colSpan="3"></td><td><input className="edit-input" placeholder="Σημειώσεις" value={editingPayroll.notes||''} onChange={e=>setEditingPayroll({...editingPayroll,notes:e.target.value})}/></td><td><button className="pay-small-btn done" onClick={savePayrollEdit}>✓</button> <button className="pay-small-btn" onClick={()=>setEditingPayroll(null)}>✕</button></td></tr>
            : <tr key={x.id}><td>{x.employee_name}</td><td className="iban">{emp?.iban||'-'}</td><td>{euro(x.bank_amount)}</td><td>{euro(x.cash_amount)}</td><td>{euro(total)}</td><td>{euro(paid)}</td><td>{euro(Math.max(total-paid,0))}</td><td><Status total={total} paid={paid} dueDate={x.due_date}/></td><td style={{maxWidth:180,whiteSpace:'normal'}}>{x.notes||'-'}</td><td><button title="Πληρωμή τράπεζας" className={`pay-small-btn ${x.bank_paid?'done':''}`} onClick={()=>togglePayroll(x,'bank_paid')}>🏦 {x.bank_paid?'✓':'○'}</button> <button title="Πληρωμή μετρητών" className={`pay-small-btn ${x.cash_paid?'done':''}`} onClick={()=>togglePayroll(x,'cash_paid')}>💶 {x.cash_paid?'✓':'○'}</button> <button title="Επεξεργασία" className="pay-small-btn" onClick={()=>setEditingPayroll({...x})}>✏️</button> <button title="Διαγραφή" className="pay-small-btn" onClick={()=>deletePayroll(x)}>🗑️</button></td></tr>})}
          {!monthRows.length && <tr><td colSpan="10">Δεν υπάρχει μισθοδοσία για {periodLabel(payrollMonth)}. Πάτησε «Δημιουργία μισθοδοσίας μήνα».</td></tr>}
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
