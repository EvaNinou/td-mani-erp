import { useEffect, useMemo, useState } from 'react';

export default function Customers({
    editingCustomerId,
    newCustomer,
    setNewCustomer,
    saveCustomer,
    editingProjectId,
    newProject,
    setNewProject,
    customers,
    isActiveItem,
    saveProject,
    customerSearch,
    setCustomerSearch,
    projectSearch,
    setProjectSearch,
    customerMatchesSearch,
    getVisibleCustomerProjects,
    getCustomerTotals,
    openCustomerId,
    setOpenCustomerId,
    getCustomerProjects,
    setSelectedCustomerReport,
    editCustomer,
    deleteItem,
    getProjectPaid,
    getProjectExpenses,
    getCustomerName,
    getProjectStatusStyle,
    getProjectStatusLabel,
    getProjectProgress,
    setSelectedProject,
    setActiveProjectTab,
    editProject,
    selectedProject,
    getCustomerAfm,
    getProjectCustomerInvoices,
    getCustomerInvoicePaid,
    getCustomerInvoiceStatus,
    getProjectPayments,
    editPayment,
    expenses,
    editExpense,
    getProjectQuotes,
    setSelectedQuote,
    getProjectTasks,
    getProjectDocuments,
    editDocument
}) {
  const [view, setView] = useState('list');
  const [focusedCustomerId, setFocusedCustomerId] = useState(null);
  const [localSearch, setLocalSearch] = useState('');
  const activeCustomers = useMemo(() => customers.filter(isActiveItem).sort((a,b) =>
    String(a.name || '').localeCompare(String(b.name || ''), 'el', { sensitivity: 'base' })
  ), [customers, isActiveItem]);
  const visibleCustomers = activeCustomers.filter(c =>
    String(c.name || '').toLocaleLowerCase('el').includes(localSearch.toLocaleLowerCase('el')) ||
    String(c.afm || '').includes(localSearch)
  );
  const focusedCustomer = customers.find(c => c.id === focusedCustomerId);
  useEffect(() => { if (editingCustomerId) setView('new-customer'); }, [editingCustomerId]);
  useEffect(() => { if (editingProjectId) setView('new-project'); }, [editingProjectId]);
  const openCustomer = (customer) => { setFocusedCustomerId(customer.id); setView('customer'); };
  const startProject = (customerId) => {
    if (customerId && !editingProjectId) setNewProject(prev => ({ ...prev, customer_id: customerId }));
    setView('new-project');
  };
  const backToList = () => { setView('list'); setSelectedProject(null); };
  const openProject = (project) => { setFocusedCustomerId(project.customer_id); setSelectedProject(project); setActiveProjectTab('overview'); setView('project'); };
  const panel = { background: 'rgba(255,255,255,.035)', border: '1px solid rgba(255,255,255,.12)', borderRadius: 12, padding: 16 };
  const flexRow = { display:'flex', alignItems:'center', justifyContent:'space-between', gap:12, flexWrap:'wrap' };
  return (
    <>
<section className="card page-section customers-section" style={{marginBottom:16}}>
  <div style={flexRow}>
    <div><h2 style={{margin:'0 0 5px'}}>👥 Πελάτες & Έργα</h2><small>Οργάνωση πελατών, έργων και οικονομικών στοιχείων</small></div>
    <div style={{display:'flex',gap:8,flexWrap:'wrap'}}>
      <button onClick={backToList}>👥 Πελάτες</button>
      <button onClick={() => setView('new-customer')}>＋ Νέος πελάτης</button>
      <button onClick={() => startProject()}>＋ Νέο έργο</button>
    </div>
  </div>
</section>
{view === 'list' && <section className="card page-section customers-section">
  <div style={flexRow}><h2>Κατάλογος πελατών</h2><span>{activeCustomers.length} πελάτες</span></div>
  <input placeholder="🔎 Αναζήτηση ονόματος ή ΑΦΜ..." value={localSearch} onChange={e => setLocalSearch(e.target.value)}/>
  <div style={{display:'grid',gap:10,marginTop:16}}>
    {visibleCustomers.length === 0 && <p>Δεν βρέθηκαν πελάτες.</p>}
    {visibleCustomers.map(customer => (
      <div key={customer.id} style={panel}>
        <div style={flexRow}>
          <div><strong>{customer.name}</strong><div style={{opacity:.7,fontSize:12,marginTop:6}}>ΑΦΜ: {customer.afm || '—'} · {getCustomerProjects(customer.id).length} έργα</div></div>
          <button onClick={() => openCustomer(customer)}>Άνοιγμα καρτέλας →</button>
        </div>
      </div>
    ))}
  </div>
</section>}
{view === 'customer' && focusedCustomer && <section className="card page-section customers-section">
  <button onClick={backToList}>← Όλοι οι πελάτες</button>
  <div style={{...flexRow,marginTop:16}}>
    <div><h2>{focusedCustomer.name}</h2><p>ΑΦΜ: {focusedCustomer.afm || '—'} · Τηλέφωνο: {focusedCustomer.phone || '—'}</p><p>Περιοχή: {focusedCustomer.area || '—'}</p><p>{focusedCustomer.notes || ''}</p></div>
    <div style={{display:'flex',gap:8,flexWrap:'wrap'}}>
      <button onClick={() => setSelectedCustomerReport(focusedCustomer)}>📄 PDF Αναφορά</button>
      <button onClick={() => { editCustomer(focusedCustomer); setView('new-customer'); }}>✏️ Επεξεργασία</button>
      <button onClick={() => { if(window.confirm('Να διαγραφεί ο πελάτης;')) {deleteItem('customers', focusedCustomer.id); backToList();} }}>🗑 Διαγραφή</button>
    </div>
  </div>
  <div style={{display:'grid',gridTemplateColumns:'repeat(auto-fit,minmax(150px,1fr))',gap:10,margin:'16px 0'}}>
    {[
      ['Συμφωνημένα',getCustomerTotals(focusedCustomer.id).agreed],
      ['Πληρωμένα',getCustomerTotals(focusedCustomer.id).paid],
      ['Έξοδα',getCustomerTotals(focusedCustomer.id).expenses],
      ['Εκτιμώμενο κέρδος',getCustomerTotals(focusedCustomer.id).balance]
    ].map(([label,value]) => <div key={label} style={panel}><small>{label}</small><h3 style={{marginBottom:0}}>{Number(value || 0).toLocaleString('el-GR')} €</h3></div>)}
  </div>
  <div style={flexRow}><h3>Έργα πελάτη</h3><button onClick={() => startProject(focusedCustomer.id)}>＋ Νέο έργο για τον πελάτη</button></div>
  <div style={{display:'grid',gap:10}}>
    {getCustomerProjects(focusedCustomer.id).filter(isActiveItem).length === 0 && <p>Δεν υπάρχουν έργα για αυτόν τον πελάτη.</p>}
    {getCustomerProjects(focusedCustomer.id).filter(isActiveItem).map(project => (
      <div key={project.id} style={panel}>
        <div style={flexRow}>
          <div><strong>{project.title}</strong><p style={{margin:'6px 0'}}>📍 {project.area || project.address || '—'} · {getProjectStatusLabel(project.status)}</p>
          <small>Συμφωνία: {Number(project.agreed_amount || 0).toLocaleString('el-GR')} € · Πληρωμές: {Number(getProjectPaid(project.id) || 0).toLocaleString('el-GR')} €</small></div>
          <div style={{display:'flex',gap:8,flexWrap:'wrap'}}>
            <button onClick={() => openProject(project)}>👁 Άνοιγμα έργου</button>
            <button onClick={() => { editProject(project); setView('new-project'); }}>✏️</button>
            <button onClick={() => { if(window.confirm('Να διαγραφεί το έργο;')) deleteItem('projects',project.id); }}>🗑</button>
          </div>
        </div>
      </div>
    ))}
  </div>
</section>}
{view === 'new-customer' && <>
  <button onClick={() => setView(focusedCustomer ? 'customer' : 'list')}>← Επιστροφή</button>
<section className="card page-section customers-section">
  <h2>{editingCustomerId ? 'Επεξεργασία Πελάτη' : 'Νέος Πελάτης'}</h2>
  <input placeholder="Όνομα πελάτη" value={newCustomer.name} onChange={(e) => setNewCustomer({ ...newCustomer, name: e.target.value })} />
  <input placeholder="ΑΦΜ" value={newCustomer.afm} onChange={(e) => setNewCustomer({ ...newCustomer, afm: e.target.value })} />
  <input placeholder="Τηλέφωνο" value={newCustomer.phone} onChange={(e) => setNewCustomer({ ...newCustomer, phone: e.target.value })} />
  <input placeholder="Περιοχή" value={newCustomer.area} onChange={(e) => setNewCustomer({ ...newCustomer, area: e.target.value })} />
  <textarea placeholder="Σημειώσεις" value={newCustomer.notes} onChange={(e) => setNewCustomer({ ...newCustomer, notes: e.target.value })} />
  <button onClick={saveCustomer}>{editingCustomerId ? 'Αποθήκευση αλλαγών πελάτη' : 'Αποθήκευση πελάτη'}</button>
</section>

</>}
{view === 'new-project' && <>
  <button onClick={() => setView(focusedCustomer ? 'customer' : 'list')}>← Επιστροφή</button>
<section className="card page-section customers-section">
  <h2>{editingProjectId ? 'Επεξεργασία Έργου' : 'Νέο Έργο'}</h2>
  <select value={newProject.customer_id} onChange={(e) => setNewProject({ ...newProject, customer_id: e.target.value })}>
    <option value="">Διάλεξε πελάτη</option>
    {customers.filter(isActiveItem).map((customer) => <option key={customer.id} value={customer.id}>{customer.name}</option>)}
  </select>
  <input placeholder="Τίτλος έργου" value={newProject.title} onChange={(e) => setNewProject({ ...newProject, title: e.target.value })} />
  <input placeholder="Διεύθυνση" value={newProject.address} onChange={(e) => setNewProject({ ...newProject, address: e.target.value })} />
  <input placeholder="Περιοχή" value={newProject.area} onChange={(e) => setNewProject({ ...newProject, area: e.target.value })} />
  <input placeholder="Συμφωνηθέν ποσό" value={newProject.agreed_amount} onChange={(e) => setNewProject({ ...newProject, agreed_amount: e.target.value })} />
  <select value={newProject.status} onChange={(e) => setNewProject({ ...newProject, status: e.target.value })}>
    <option value="active">Ενεργό</option>
    <option value="pending">Σε αναμονή</option>
    <option value="completed">Ολοκληρωμένο</option>
    <option value="problem">Πρόβλημα / Overdue</option>
  </select>
  <button onClick={saveProject}>{editingProjectId ? 'Αποθήκευση αλλαγών έργου' : 'Αποθήκευση έργου'}</button>
</section>

</>}
{view === 'project' && selectedProject && (
  <section className="card print-area page-section customers-section">
    <button onClick={() => { setSelectedProject(null); setView('customer'); }}>← Πίσω στον πελάτη</button>
    <div className="pdf-header">
      <div className="logo pdf-logo">TD</div>
      <div>
        <h2>TD MANI</h2>
        <p><b>ΑΝΑΛΥΣΗ ΕΡΓΟΥ</b></p>
        <small>Πλάκες, Μήλος 84800 | 6944705508 | Manitaulant@yahoo.com</small>
      </div>
    </div>

    <hr />

    <h2>Ανάλυση Έργου</h2>
    <p><b>{selectedProject.title}</b></p>
    <p>Πελάτης: {getCustomerName(selectedProject.customer_id)}</p>
    <p>Περιοχή: {selectedProject.area}</p>
    <p>Status: {selectedProject.status}</p>
    <hr />
    <p>Συμφωνία: {Number(selectedProject.agreed_amount || 0)}€</p>
    <p>Πληρωμές: {getProjectPaid(selectedProject.id)}€</p>
    <p>Έξοδα: {getProjectExpenses(selectedProject.id)}€</p>
    <p><b>Υπόλοιπο πελάτη: {Number(selectedProject.agreed_amount || 0) - getProjectPaid(selectedProject.id)}€</b></p>
    <p><b>Κέρδος μέχρι τώρα: {getProjectPaid(selectedProject.id) - getProjectExpenses(selectedProject.id)}€</b></p>
    <p><b>Εκτιμώμενο τελικό κέρδος: {Number(selectedProject.agreed_amount || 0) - getProjectExpenses(selectedProject.id)}€</b></p>

    <h3>Τιμολόγια Εσόδων έργου</h3>
    {getProjectCustomerInvoices(selectedProject.id).length === 0 ? (
      <p>Δεν υπάρχουν τιμολόγια εσόδων για αυτό το έργο.</p>
    ) : (
      getProjectCustomerInvoices(selectedProject.id).map((invoice) => (
        <div key={invoice.id} className="line">
          <p><b>{invoice.invoice_number || 'Χωρίς αριθμό'} — {invoice.receivable_amount}€ εισπρακτέο</b></p>
          <p>Καθαρή: {invoice.net_amount || 0}€ | ΦΠΑ: {invoice.vat_amount || 0}€ | Παρακράτηση: {invoice.withholding_amount || 0}€</p>
          <p>Πληρωμένα: {getCustomerInvoicePaid(invoice.id)}€</p>
          <p>Status: <b>{getCustomerInvoiceStatus(invoice)}</b></p>
        </div>
      ))
    )}

    <h3>Πληρωμές έργου</h3>
    {getProjectPayments(selectedProject.id).map((payment) => (
      <div key={payment.id} className="line">
        <p><b>{payment.amount}€</b> — {payment.method}</p>
        <p>Ημερομηνία: {payment.payment_date || '-'}</p>
        <small>{payment.notes}</small>
        <button onClick={() => editPayment(payment)}>✏️ Επεξεργασία</button>
        <button onClick={() => deleteItem('payments', payment.id)}>🗑 Διαγραφή πληρωμής</button>
      </div>
    ))}

    <h3>Αναλυτικά έξοδα</h3>
    {expenses.filter((expense) => expense.project_id === selectedProject.id).map((expense) => (
      <div key={expense.id} className="line">
        <p><b>{expense.title}</b> — {expense.amount}€</p>
        <small>{expense.category}</small>
        <button onClick={() => editExpense(expense)}>✏️ Επεξεργασία</button>
        <button onClick={() => deleteItem('expenses', expense.id)}>🗑 Διαγραφή εξόδου</button>
      </div>
    ))}

    <h3>Προσφορές έργου</h3>
    {getProjectQuotes(selectedProject.id).map((quote) => (
      <div key={quote.id} className="line" onClick={() => setSelectedQuote(quote)}>
        <p><b>{quote.work_type}</b></p>
        <p>{quote.description}</p>
        <p>{quote.payable}€</p>
      </div>
    ))}

    <h3>Εργασίες έργου</h3>
    {getProjectTasks(selectedProject.id).map((task) => (
      <div key={task.id} className={task.status === 'completed' ? 'line' : 'line alert'}>
        <p><b>{task.title}</b></p>
        <p>{task.task_date} {task.task_time || ''}</p>
        <small>{task.status}</small>
      </div>
    ))}

    <h3>Αρχεία / Παραστατικά έργου</h3>
    {getProjectDocuments(selectedProject.id).length === 0 ? (
      <p>Δεν υπάρχουν αρχεία για αυτό το έργο.</p>
    ) : (
      getProjectDocuments(selectedProject.id).map((document) => (
        <div key={document.id} className="line">
          <p><b>{document.title}</b></p>
          <p>{document.document_type}</p>
          {document.file_url && (
            <p><a href={document.file_url} target="_blank">Άνοιγμα αρχείου</a></p>
          )}
          <small>{document.notes}</small>
          <button onClick={() => editDocument(document)}>✏️ Επεξεργασία</button>
          <button onClick={() => deleteItem('documents', document.id)}>🗑 Διαγραφή αρχείου</button>
        </div>
      ))
    )}

    <button onClick={() => window.print()}>📄 Export / Print PDF Ανάλυσης</button>
    <button onClick={() => { setSelectedProject(null); setView('customer'); }}>← Πίσω στον πελάτη</button>
  </section>
)}
    </>
  );
}
