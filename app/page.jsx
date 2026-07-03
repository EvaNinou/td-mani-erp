'use client';

import { useEffect, useMemo, useState } from 'react';
import { supabase } from './supabaseClient.js';
import './styles.css';

const INITIAL_CUSTOMER = { name: '', phone: '', area: '', notes: '' };
const INITIAL_PROJECT = { title: '', address: '', area: '', agreed_amount: '', status: 'active' };
const INITIAL_PAYMENT = { project_id: '', amount: '', method: 'Μετρητά', notes: '' };
const INITIAL_EXPENSE = { project_id: '', title: '', amount: '', category: 'Υλικά', notes: '' };
const INITIAL_INVENTORY = { item_name: '', quantity: '', min_quantity: '', purchase_price: '' };
const INITIAL_QUOTE = { project_id: '', work_type: '', description: '', subtotal: '', job_type: 'invoice' };

export default function Home() {
  const [selectedUser, setSelectedUser] = useState('Mani Taulant');

  const [crews, setCrews] = useState([]);
  const [customers, setCustomers] = useState([]);
  const [projects, setProjects] = useState([]);
  const [payments, setPayments] = useState([]);
  const [expenses, setExpenses] = useState([]);
  const [inventory, setInventory] = useState([]);
  const [quotes, setQuotes] = useState([]);

  const [selectedProject, setSelectedProject] = useState(null);
  const [selectedQuote, setSelectedQuote] = useState(null);

  const [newCustomer, setNewCustomer] = useState(INITIAL_CUSTOMER);
  const [newProject, setNewProject] = useState(INITIAL_PROJECT);
  const [newPayment, setNewPayment] = useState(INITIAL_PAYMENT);
  const [newExpense, setNewExpense] = useState(INITIAL_EXPENSE);
  const [newInventory, setNewInventory] = useState(INITIAL_INVENTORY);
  const [newQuote, setNewQuote] = useState(INITIAL_QUOTE);

  useEffect(() => {
    refreshAll();
  }, []);

  async function refreshAll() {
    await Promise.all([
      loadCrews(),
      loadCustomers(),
      loadProjects(),
      loadPayments(),
      loadExpenses(),
      loadInventory(),
      loadQuotes()
    ]);
  }

  async function loadCrews() {
    const { data } = await supabase.from('crews').select('*').order('created_at', { ascending: false });
    setCrews(data || []);
  }

  async function loadCustomers() {
    const { data } = await supabase.from('customers').select('*').order('created_at', { ascending: false });
    setCustomers(data || []);
  }

  async function loadProjects() {
    const { data } = await supabase.from('projects').select('*').order('created_at', { ascending: false });
    setProjects(data || []);
  }

  async function loadPayments() {
    const { data } = await supabase.from('payments').select('*').order('created_at', { ascending: false });
    setPayments(data || []);
  }

  async function loadExpenses() {
    const { data } = await supabase.from('expenses').select('*').order('created_at', { ascending: false });
    setExpenses(data || []);
  }

  async function loadInventory() {
    const { data } = await supabase.from('inventory').select('*').order('created_at', { ascending: false });
    setInventory(data || []);
  }

  async function loadQuotes() {
    const { data } = await supabase.from('quotes').select('*').order('created_at', { ascending: false });
    setQuotes(data || []);
  }

  function getProjectTitle(projectId) {
    return projects.find((project) => project.id === projectId)?.title || 'Χωρίς έργο';
  }

  function getProjectPaid(projectId) {
    return payments
      .filter((payment) => payment.project_id === projectId)
      .reduce((sum, payment) => sum + Number(payment.amount || 0), 0);
  }

  function getProjectExpenses(projectId) {
    return expenses
      .filter((expense) => expense.project_id === projectId)
      .reduce((sum, expense) => sum + Number(expense.amount || 0), 0);
  }

  function getProjectQuotes(projectId) {
    return quotes.filter((quote) => quote.project_id === projectId);
  }

  const totals = useMemo(() => {
    const totalProjects = projects.length;
    const totalAgreed = projects.reduce((sum, project) => sum + Number(project.agreed_amount || 0), 0);
    const totalPaid = payments.reduce((sum, payment) => sum + Number(payment.amount || 0), 0);
    const totalExpenses = expenses.reduce((sum, expense) => sum + Number(expense.amount || 0), 0);
    const totalBalance = totalAgreed - totalPaid - totalExpenses;
    const lowStockCount = inventory.filter((item) => Number(item.quantity || 0) <= Number(item.min_quantity || 0)).length;
    const totalQuotes = quotes.reduce((sum, quote) => sum + Number(quote.payable || 0), 0);

    return { totalProjects, totalAgreed, totalPaid, totalExpenses, totalBalance, lowStockCount, totalQuotes };
  }, [projects, payments, expenses, inventory, quotes]);

  async function addCustomer() {
    if (!newCustomer.name.trim()) {
      alert('Βάλε όνομα πελάτη');
      return;
    }

    const { error } = await supabase.from('customers').insert([newCustomer]);
    if (error) {
      alert(error.message);
      return;
    }

    setNewCustomer(INITIAL_CUSTOMER);
    loadCustomers();
  }

  async function addProject() {
    if (!newProject.title.trim()) {
      alert('Βάλε τίτλο έργου');
      return;
    }

    const { error } = await supabase.from('projects').insert([{
      code: 'PRJ-' + Date.now(),
      title: newProject.title,
      address: newProject.address,
      area: newProject.area,
      agreed_amount: Number(newProject.agreed_amount || 0),
      status: newProject.status,
      job_type: 'invoice'
    }]);

    if (error) {
      alert(error.message);
      return;
    }

    setNewProject(INITIAL_PROJECT);
    loadProjects();
  }

  async function addPayment() {
    if (!newPayment.project_id || !newPayment.amount) {
      alert('Διάλεξε έργο και βάλε ποσό πληρωμής');
      return;
    }

    const { error } = await supabase.from('payments').insert([{
      project_id: newPayment.project_id,
      amount: Number(newPayment.amount || 0),
      method: newPayment.method,
      payment_type: 'income',
      notes: newPayment.notes
    }]);

    if (error) {
      alert(error.message);
      return;
    }

    setNewPayment(INITIAL_PAYMENT);
    loadPayments();
  }

  async function addExpense() {
    if (!newExpense.project_id || !newExpense.title.trim() || !newExpense.amount) {
      alert('Διάλεξε έργο, βάλε τίτλο και ποσό εξόδου');
      return;
    }

    const { error } = await supabase.from('expenses').insert([{
      project_id: newExpense.project_id,
      title: newExpense.title,
      amount: Number(newExpense.amount || 0),
      category: newExpense.category,
      notes: newExpense.notes
    }]);

    if (error) {
      alert(error.message);
      return;
    }

    setNewExpense(INITIAL_EXPENSE);
    loadExpenses();
  }

  async function addInventory() {
    if (!newInventory.item_name.trim()) {
      alert('Βάλε όνομα υλικού');
      return;
    }

    const { error } = await supabase.from('inventory').insert([{
      item_name: newInventory.item_name,
      quantity: Number(newInventory.quantity || 0),
      min_quantity: Number(newInventory.min_quantity || 0),
      purchase_price: Number(newInventory.purchase_price || 0)
    }]);

    if (error) {
      alert(error.message);
      return;
    }

    setNewInventory(INITIAL_INVENTORY);
    loadInventory();
  }

  async function addQuote() {
    if (!newQuote.project_id || !newQuote.work_type.trim() || !newQuote.description.trim() || !newQuote.subtotal) {
      alert('Διάλεξε έργο, βάλε είδος εργασίας, περιγραφή και ποσό προσφοράς');
      return;
    }

    const subtotal = Number(newQuote.subtotal || 0);
    const vat = newQuote.job_type === 'invoice' ? subtotal * 0.24 : 0;
    const withholding = newQuote.job_type === 'invoice' ? subtotal * 0.03 : 0;
    const payable = subtotal + vat - withholding;

    const { error } = await supabase.from('quotes').insert([{
      quote_number: 'Q-' + Date.now(),
      project_id: newQuote.project_id,
      work_type: newQuote.work_type,
      description: newQuote.description,
      subtotal,
      vat,
      withholding,
      payable,
      job_type: newQuote.job_type,
      status: 'pending'
    }]);

    if (error) {
      alert(error.message);
      return;
    }

    setNewQuote(INITIAL_QUOTE);
    loadQuotes();
  }

  async function deleteItem(table, id) {
    const confirmDelete = confirm('Σίγουρα θέλεις να το διαγράψεις;');
    if (!confirmDelete) return;

    if (table === 'projects') {
      await supabase.from('payments').delete().eq('project_id', id);
      await supabase.from('expenses').delete().eq('project_id', id);
      await supabase.from('quotes').delete().eq('project_id', id);
    }

    const { error } = await supabase.from(table).delete().eq('id', id);

    if (error) {
      alert(error.message);
      return;
    }

    if (selectedProject?.id === id) setSelectedProject(null);
    if (selectedQuote?.id === id) setSelectedQuote(null);

    refreshAll();
  }

  return (
    <main className="app">
      <header className="top">
        <div className="brand">
          <div className="logo">TD</div>
          <div>
            <h1>T D MANI</h1>
            <p>ΟΙΚΟΔΟΜΙΚΕΣ ΕΡΓΑΣΙΕΣ</p>
          </div>
        </div>
      </header>

      <section className="card">
        <h2>Dashboard</h2>
        <div className="grid">
          <div className="line"><p><b>{totals.totalProjects}</b></p><small>Έργα</small></div>
          <div className="line"><p><b>{totals.totalAgreed}€</b></p><small>Συμφωνημένα</small></div>
          <div className="line"><p><b>{totals.totalPaid}€</b></p><small>Πληρωμένα</small></div>
          <div className="line"><p><b>{totals.totalExpenses}€</b></p><small>Έξοδα</small></div>
          <div className="line"><p><b>{totals.totalBalance}€</b></p><small>Καθαρό υπόλοιπο</small></div>
          <div className="line"><p><b>{totals.totalQuotes}€</b></p><small>Προσφορές</small></div>
          <div className={totals.lowStockCount > 0 ? 'line alert' : 'line'}>
            <p><b>{totals.lowStockCount}</b></p>
            <small>Low stock alerts</small>
          </div>
        </div>
      </section>

      <section className="card">
        <h2>Επιλογή χρήστη</h2>
        <button onClick={() => setSelectedUser('Mani Taulant')}>👷 Mani Taulant</button>
        <button onClick={() => setSelectedUser('Εύα Νίνου')}>👩 Εύα Νίνου</button>
        <p>Επιλεγμένος χρήστης: <b>{selectedUser}</b></p>
      </section>

      <section className="card">
        <h2>Συνεργεία</h2>
        {crews.map((crew) => (
          <p key={crew.id}><b>{crew.name}</b> — {crew.specialty}</p>
        ))}
      </section>

      <section className="card">
        <h2>Νέος Πελάτης</h2>
        <input placeholder="Όνομα πελάτη" value={newCustomer.name} onChange={(e) => setNewCustomer({ ...newCustomer, name: e.target.value })} />
        <input placeholder="Τηλέφωνο" value={newCustomer.phone} onChange={(e) => setNewCustomer({ ...newCustomer, phone: e.target.value })} />
        <input placeholder="Περιοχή" value={newCustomer.area} onChange={(e) => setNewCustomer({ ...newCustomer, area: e.target.value })} />
        <textarea placeholder="Σημειώσεις" value={newCustomer.notes} onChange={(e) => setNewCustomer({ ...newCustomer, notes: e.target.value })} />
        <button onClick={addCustomer}>Αποθήκευση πελάτη</button>
      </section>

      <section className="card">
        <h2>Νέο Έργο</h2>
        <input placeholder="Τίτλος έργου" value={newProject.title} onChange={(e) => setNewProject({ ...newProject, title: e.target.value })} />
        <input placeholder="Διεύθυνση" value={newProject.address} onChange={(e) => setNewProject({ ...newProject, address: e.target.value })} />
        <input placeholder="Περιοχή" value={newProject.area} onChange={(e) => setNewProject({ ...newProject, area: e.target.value })} />
        <input placeholder="Συμφωνηθέν ποσό" value={newProject.agreed_amount} onChange={(e) => setNewProject({ ...newProject, agreed_amount: e.target.value })} />
        <select value={newProject.status} onChange={(e) => setNewProject({ ...newProject, status: e.target.value })}>
          <option value="active">Ενεργό</option>
          <option value="pending">Σε αναμονή</option>
          <option value="completed">Ολοκληρωμένο</option>
        </select>
        <button onClick={addProject}>Αποθήκευση έργου</button>
      </section>

      <section className="card">
        <h2>Νέα Πληρωμή</h2>
        <select value={newPayment.project_id} onChange={(e) => setNewPayment({ ...newPayment, project_id: e.target.value })}>
          <option value="">Διάλεξε έργο</option>
          {projects.map((project) => <option key={project.id} value={project.id}>{project.title}</option>)}
        </select>
        <input placeholder="Ποσό πληρωμής" value={newPayment.amount} onChange={(e) => setNewPayment({ ...newPayment, amount: e.target.value })} />
        <select value={newPayment.method} onChange={(e) => setNewPayment({ ...newPayment, method: e.target.value })}>
          <option value="Μετρητά">Μετρητά</option>
          <option value="Τράπεζα">Τράπεζα</option>
          <option value="IRIS">IRIS</option>
          <option value="POS">POS</option>
          <option value="Επιταγή">Επιταγή</option>
        </select>
        <textarea placeholder="Σημειώσεις" value={newPayment.notes} onChange={(e) => setNewPayment({ ...newPayment, notes: e.target.value })} />
        <button onClick={addPayment}>Αποθήκευση πληρωμής</button>
      </section>

      <section className="card">
        <h2>Νέα Προσφορά</h2>
        <select value={newQuote.project_id} onChange={(e) => setNewQuote({ ...newQuote, project_id: e.target.value })}>
          <option value="">Διάλεξε έργο</option>
          {projects.map((project) => <option key={project.id} value={project.id}>{project.title}</option>)}
        </select>
        <input placeholder="Είδος εργασίας" value={newQuote.work_type} onChange={(e) => setNewQuote({ ...newQuote, work_type: e.target.value })} />
        <textarea placeholder="Περιγραφή προσφοράς" value={newQuote.description} onChange={(e) => setNewQuote({ ...newQuote, description: e.target.value })} />
        <input placeholder="Καθαρή αξία" value={newQuote.subtotal} onChange={(e) => setNewQuote({ ...newQuote, subtotal: e.target.value })} />
        <select value={newQuote.job_type} onChange={(e) => setNewQuote({ ...newQuote, job_type: e.target.value })}>
          <option value="invoice">Τιμολόγιο με ΦΠΑ / Παρακράτηση</option>
          <option value="cash">Μετρητά χωρίς ΦΠΑ</option>
        </select>
        <button onClick={addQuote}>Αποθήκευση προσφοράς</button>
      </section>

      <section className="card">
        <h2>Προσφορές</h2>
        {quotes.length === 0 ? <p>Δεν υπάρχουν προσφορές ακόμα.</p> : quotes.map((quote) => (
          <div key={quote.id} className="line" onClick={() => setSelectedQuote(quote)}>
            <p><b>{quote.description}</b></p>
            <p>Έργο: {getProjectTitle(quote.project_id)}</p>
            <p>Είδος εργασίας: {quote.work_type}</p>
            <p>Καθαρή αξία: {quote.subtotal}€</p>
            <p>ΦΠΑ: {quote.vat}€</p>
            <p>Παρακράτηση: {quote.withholding}€</p>
            <p><b>Πληρωτέο: {quote.payable}€</b></p>
            <small>{quote.quote_number} — {quote.job_type} — {quote.status}</small>
            <button onClick={(e) => { e.stopPropagation(); deleteItem('quotes', quote.id); }}>
              🗑 Διαγραφή
            </button>
          </div>
        ))}
      </section>

      {selectedQuote && (
        <section className="card print-area">
          <div className="pdf-header">
            <div className="logo pdf-logo">TD</div>
            <div>
              <h2>TD MANI</h2>
              <p><b>ΟΙΚΟΔΟΜΙΚΕΣ ΕΡΓΑΣΙΕΣ</b></p>
              <small>Πλάκες, Μήλος 84800 | 6944705508 | Manitaulant@yahoo.com</small>
            </div>
          </div>
          <hr />
          <h2>Προσφορά</h2>
          <p><b>Αριθμός:</b> {selectedQuote.quote_number}</p>
          <p><b>Έργο:</b> {getProjectTitle(selectedQuote.project_id)}</p>
          <p><b>Είδος εργασίας:</b> {selectedQuote.work_type}</p>
          <p><b>Περιγραφή:</b> {selectedQuote.description}</p>
          <hr />
          <p>Καθαρή αξία: {selectedQuote.subtotal}€</p>
          <p>ΦΠΑ 24%: {selectedQuote.vat}€</p>
          <p>Παρακράτηση 3%: {selectedQuote.withholding}€</p>
          <p><b>Πληρωτέο: {selectedQuote.payable}€</b></p>
          <hr />
          <p><b>Υπογραφή / Σφραγίδα</b></p>
          <p className="signature-line">T D MANI</p>
          <button onClick={() => window.print()}>Export / Print PDF</button>
          <button onClick={() => setSelectedQuote(null)}>Κλείσιμο preview</button>
        </section>
      )}

      <section className="card">
        <h2>Νέο Έξοδο</h2>
        <select value={newExpense.project_id} onChange={(e) => setNewExpense({ ...newExpense, project_id: e.target.value })}>
          <option value="">Διάλεξε έργο</option>
          {projects.map((project) => <option key={project.id} value={project.id}>{project.title}</option>)}
        </select>
        <input placeholder="Τίτλος εξόδου" value={newExpense.title} onChange={(e) => setNewExpense({ ...newExpense, title: e.target.value })} />
        <input placeholder="Ποσό εξόδου" value={newExpense.amount} onChange={(e) => setNewExpense({ ...newExpense, amount: e.target.value })} />
        <select value={newExpense.category} onChange={(e) => setNewExpense({ ...newExpense, category: e.target.value })}>
          <option value="Υλικά">Υλικά</option>
          <option value="Συνεργείο">Συνεργείο</option>
          <option value="Μεταφορικά">Μεταφορικά</option>
          <option value="Άλλο">Άλλο</option>
        </select>
        <textarea placeholder="Σημειώσεις" value={newExpense.notes} onChange={(e) => setNewExpense({ ...newExpense, notes: e.target.value })} />
        <button onClick={addExpense}>Αποθήκευση εξόδου</button>
      </section>

      <section className="card">
        <h2>Νέο Υλικό</h2>
        <input placeholder="Υλικό" value={newInventory.item_name} onChange={(e) => setNewInventory({ ...newInventory, item_name: e.target.value })} />
        <input placeholder="Ποσότητα" value={newInventory.quantity} onChange={(e) => setNewInventory({ ...newInventory, quantity: e.target.value })} />
        <input placeholder="Ελάχιστο απόθεμα" value={newInventory.min_quantity} onChange={(e) => setNewInventory({ ...newInventory, min_quantity: e.target.value })} />
        <input placeholder="Τιμή αγοράς" value={newInventory.purchase_price} onChange={(e) => setNewInventory({ ...newInventory, purchase_price: e.target.value })} />
        <button onClick={addInventory}>Αποθήκευση υλικού</button>
      </section>

      <section className="card">
        <h2>Πελάτες</h2>
        {customers.length === 0 ? <p>Δεν υπάρχουν πελάτες ακόμα.</p> : customers.map((customer) => (
          <div key={customer.id} className="line">
            <p><b>{customer.name}</b></p>
            <p>{customer.phone}</p>
            <p>{customer.area}</p>
            <small>{customer.notes}</small>
            <button onClick={() => deleteItem('customers', customer.id)}>🗑 Διαγραφή πελάτη</button>
          </div>
        ))}
      </section>

      <section className="card">
        <h2>Έργα</h2>
        {projects.length === 0 ? <p>Δεν υπάρχουν έργα ακόμα.</p> : projects.map((project) => {
          const paid = getProjectPaid(project.id);
          const agreed = Number(project.agreed_amount || 0);
          const projectExpenses = getProjectExpenses(project.id);
          const balance = agreed - paid - projectExpenses;

          return (
            <div key={project.id} className="line" onClick={() => setSelectedProject(project)}>
              <p><b>{project.title}</b></p>
              <p>{project.area}</p>
              <p>Status: {project.status}</p>
              <p>Συμφωνία: {agreed}€</p>
              <p>Πληρώθηκε: {paid}€</p>
              <p>Έξοδα: {projectExpenses}€</p>
              <p><b>Καθαρό υπόλοιπο: {balance}€</b></p>
              <button onClick={(e) => { e.stopPropagation(); deleteItem('projects', project.id); }}>
                🗑 Διαγραφή έργου
              </button>
            </div>
          );
        })}
      </section>

      {selectedProject && (
        <section className="card">
          <h2>Ανάλυση Έργου</h2>
          <p><b>{selectedProject.title}</b></p>
          <p>Περιοχή: {selectedProject.area}</p>
          <p>Status: {selectedProject.status}</p>
          <hr />
          <p>Συμφωνία: {Number(selectedProject.agreed_amount || 0)}€</p>
          <p>Πληρωμές: {getProjectPaid(selectedProject.id)}€</p>
          <p>Έξοδα: {getProjectExpenses(selectedProject.id)}€</p>
          <p><b>Καθαρό υπόλοιπο: {
            Number(selectedProject.agreed_amount || 0)
            - getProjectPaid(selectedProject.id)
            - getProjectExpenses(selectedProject.id)
          }€</b></p>

          <h3>Αναλυτικά έξοδα</h3>
          {expenses.filter((expense) => expense.project_id === selectedProject.id).map((expense) => (
            <div key={expense.id} className="line">
              <p><b>{expense.title}</b> — {expense.amount}€</p>
              <small>{expense.category}</small>
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

          <button onClick={() => setSelectedProject(null)}>Κλείσιμο ανάλυσης</button>
        </section>
      )}

      <section className="card">
        <h2>Αποθήκη</h2>
        {inventory.length === 0 ? <p>Δεν υπάρχουν υλικά ακόμα.</p> : inventory.map((item) => {
          const lowStock = Number(item.quantity || 0) <= Number(item.min_quantity || 0);

          return (
            <div key={item.id} className={lowStock ? 'line alert' : 'line'}>
              <p><b>{item.item_name}</b></p>
              <p>Ποσότητα: {item.quantity}</p>
              <p>Ελάχιστο: {item.min_quantity}</p>
              <p>Τιμή αγοράς: {item.purchase_price}€</p>
              {lowStock && <p><b>⚠️ Χαμηλό απόθεμα</b></p>}
              <button onClick={() => deleteItem('inventory', item.id)}>🗑 Διαγραφή υλικού</button>
            </div>
          );
        })}
      </section>

      <section className="card">
        <h2>Πληρωμές</h2>
        {payments.length === 0 ? <p>Δεν υπάρχουν πληρωμές ακόμα.</p> : payments.map((payment) => (
          <div key={payment.id} className="line">
            <p><b>{payment.amount}€</b> — {payment.method}</p>
            <p>Έργο: {getProjectTitle(payment.project_id)}</p>
            <small>{payment.notes}</small>
            <button onClick={() => deleteItem('payments', payment.id)}>🗑 Διαγραφή πληρωμής</button>
          </div>
        ))}
      </section>
    </main>
  );
}

