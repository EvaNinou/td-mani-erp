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
  return (
    <>
<section className="card page-section customers-section">
  <h2>{editingCustomerId ? 'Επεξεργασία Πελάτη' : 'Νέος Πελάτης'}</h2>
  <input placeholder="Όνομα πελάτη" value={newCustomer.name} onChange={(e) => setNewCustomer({ ...newCustomer, name: e.target.value })} />
  <input placeholder="ΑΦΜ" value={newCustomer.afm} onChange={(e) => setNewCustomer({ ...newCustomer, afm: e.target.value })} />
  <input placeholder="Τηλέφωνο" value={newCustomer.phone} onChange={(e) => setNewCustomer({ ...newCustomer, phone: e.target.value })} />
  <input placeholder="Περιοχή" value={newCustomer.area} onChange={(e) => setNewCustomer({ ...newCustomer, area: e.target.value })} />
  <textarea placeholder="Σημειώσεις" value={newCustomer.notes} onChange={(e) => setNewCustomer({ ...newCustomer, notes: e.target.value })} />
  <button onClick={saveCustomer}>{editingCustomerId ? 'Αποθήκευση αλλαγών πελάτη' : 'Αποθήκευση πελάτη'}</button>
</section>

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

<section className="card page-section customers-section">
  <h2>Πελάτες & Έργα</h2>

  <input
    placeholder="Αναζήτηση πελάτη..."
    value={customerSearch}
    onChange={(e) => setCustomerSearch(e.target.value)}
  />

  <input
    placeholder="Αναζήτηση έργου / περιοχής / διεύθυνσης..."
    value={projectSearch}
    onChange={(e) => setProjectSearch(e.target.value)}
  />

  {customers.filter(isActiveItem).length === 0 ? (
    <p>Δεν υπάρχουν πελάτες ακόμα.</p>
  ) : customers.filter(isActiveItem).filter(customerMatchesSearch).length === 0 ? (
    <p>Δεν βρέθηκαν πελάτες ή έργα με αυτή την αναζήτηση.</p>
  ) : (
    customers.filter(isActiveItem).filter(customerMatchesSearch).map((customer) => {
      const customerProjects = getVisibleCustomerProjects(customer.id);
      const customerTotals = getCustomerTotals(customer.id);
      const isOpen = openCustomerId === customer.id;

      return (
        <div key={customer.id} className="line">
          <div onClick={() => setOpenCustomerId(isOpen ? null : customer.id)}>
            <p><b>{isOpen ? '▼' : '▶'} {customer.name}</b></p>
            <p>ΑΦΜ: {customer.afm || '-'}</p>
            <p>{customer.phone}</p>
            <p>{customer.area}</p>
            <small>{customer.notes}</small>
            <p>Έργα: {getCustomerProjects(customer.id).length}</p>
            <p>Συμφωνημένα: {customerTotals.agreed}€</p>
            <p>Πληρωμένα: {customerTotals.paid}€</p>
            <p>Έξοδα: {customerTotals.expenses}€</p>
            <p><b>Εκτιμώμενο κέρδος: {customerTotals.balance}€</b></p>
          </div>

          <button onClick={() => setSelectedCustomerReport(customer)}>📄 Export PDF Αναφορά</button>
          <button onClick={() => editCustomer(customer)}>✏️ Επεξεργασία πελάτη</button>
          <button onClick={() => deleteItem('customers', customer.id)}>🗑 Διαγραφή πελάτη</button>

          {isOpen && (
            <div>
              <h3>Έργα πελάτη</h3>

              {customerProjects.length === 0 ? (
                <p>Δεν υπάρχουν έργα για αυτόν τον πελάτη με αυτή την αναζήτηση.</p>
              ) : (
                customerProjects.map((project) => {
                  const paid = getProjectPaid(project.id);
                  const agreed = Number(project.agreed_amount || 0);
                  const projectExpenses = getProjectExpenses(project.id);
                  const balance = agreed - projectExpenses;

                  return (
                    <div key={project.id} className="line" style={getProjectStatusStyle(project.status)}>
                      <p><b>{project.title}</b></p>
                      <p>Πελάτης: {getCustomerName(project.customer_id)}</p>
                      <p>Περιοχή: {project.area || '-'}</p>
                      <p>Status: <b>{getProjectStatusLabel(project.status)}</b></p>
                      <p>Συμφωνία: {agreed}€</p>
                      <p>Πληρώθηκε: {paid}€</p>
                      <p>Έξοδα: {projectExpenses}€</p>
                      <p><b>Εκτιμώμενο κέρδος: {balance}€</b></p>

                      <div className="line">
                        <p>Progress πληρωμών: <b>{getProjectProgress(project.id)}%</b></p>
                        <div style={{ width: '100%', height: '10px', background: 'rgba(255,255,255,0.10)', borderRadius: '999px', overflow: 'hidden' }}>
                          <div style={{ width: `${getProjectProgress(project.id)}%`, height: '100%', background: 'linear-gradient(135deg, #d6a84f, #7a551d)' }} />
                        </div>
                      </div>

                      <button onClick={() => { setSelectedProject(project); setActiveProjectTab('overview'); }}>👁 Άνοιγμα έργου</button>
                      <button onClick={() => editProject(project)}>✏️ Επεξεργασία έργου</button>
                      <button onClick={() => deleteItem('projects', project.id)}>🗑 Διαγραφή έργου</button>
                    </div>
                  );
                })
              )}
            </div>
          )}
        </div>
      );
    })
  )}
</section>

{selectedProject && (
  <section className="card print-area page-section customers-section">
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
    <button onClick={() => setSelectedProject(null)}>Κλείσιμο ανάλυσης</button>
  </section>
)}
    </>
  );
}

