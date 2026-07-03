'use client';

import { useEffect, useMemo, useState } from 'react';
import { supabase } from './supabaseClient.js';
import './styles.css';

const INITIAL_CUSTOMER = { name: '', phone: '', area: '', notes: '' };
const INITIAL_PROJECT = { customer_id: '', title: '', address: '', area: '', agreed_amount: '', status: 'active' };
const INITIAL_PAYMENT = { project_id: '', amount: '', method: 'Μετρητά', notes: '' };
const INITIAL_EXPENSE = { project_id: '', title: '', amount: '', category: 'Υλικά', notes: '' };
const INITIAL_INVENTORY = { item_name: '', quantity: '', min_quantity: '', purchase_price: '' };
const INITIAL_QUOTE = { project_id: '', work_type: '', description: '', subtotal: '', job_type: 'invoice', status: 'pending' };
const INITIAL_TASK = { project_id: '', title: '', task_date: '', task_time: '', status: 'pending', notes: '' };

export default function Home() {
  const [selectedUser, setSelectedUser] = useState('Mani Taulant');

  const [crews, setCrews] = useState([]);
  const [customers, setCustomers] = useState([]);
  const [projects, setProjects] = useState([]);
  const [payments, setPayments] = useState([]);
  const [expenses, setExpenses] = useState([]);
  const [inventory, setInventory] = useState([]);
  const [quotes, setQuotes] = useState([]);
  const [tasks, setTasks] = useState([]);

  const [selectedProject, setSelectedProject] = useState(null);
  const [selectedQuote, setSelectedQuote] = useState(null);

  const [editingCustomerId, setEditingCustomerId] = useState(null);
  const [editingProjectId, setEditingProjectId] = useState(null);
  const [editingPaymentId, setEditingPaymentId] = useState(null);
  const [editingExpenseId, setEditingExpenseId] = useState(null);
  const [editingInventoryId, setEditingInventoryId] = useState(null);
  const [editingQuoteId, setEditingQuoteId] = useState(null);
  const [editingTaskId, setEditingTaskId] = useState(null);

  const [newCustomer, setNewCustomer] = useState(INITIAL_CUSTOMER);
  const [newProject, setNewProject] = useState(INITIAL_PROJECT);
  const [newPayment, setNewPayment] = useState(INITIAL_PAYMENT);
  const [newExpense, setNewExpense] = useState(INITIAL_EXPENSE);
  const [newInventory, setNewInventory] = useState(INITIAL_INVENTORY);
  const [newQuote, setNewQuote] = useState(INITIAL_QUOTE);
  const [newTask, setNewTask] = useState(INITIAL_TASK);

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
      loadQuotes(),
      loadTasks()
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

  async function loadTasks() {
    const { data } = await supabase.from('tasks').select('*').order('task_date', { ascending: true });
    setTasks(data || []);
  }

  function getCustomerName(customerId) {
    return customers.find((customer) => customer.id === customerId)?.name || 'Χωρίς πελάτη';
  }

  function getCustomerProjects(customerId) {
    return projects.filter((project) => project.customer_id === customerId);
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

  function getProjectTasks(projectId) {
    return tasks.filter((task) => task.project_id === projectId);
  }

  function getCustomerTotals(customerId) {
    const customerProjects = getCustomerProjects(customerId);
    const projectIds = customerProjects.map((project) => project.id);

    const agreed = customerProjects.reduce((sum, project) => sum + Number(project.agreed_amount || 0), 0);
    const paid = payments
      .filter((payment) => projectIds.includes(payment.project_id))
      .reduce((sum, payment) => sum + Number(payment.amount || 0), 0);
    const projectExpenses = expenses
      .filter((expense) => projectIds.includes(expense.project_id))
      .reduce((sum, expense) => sum + Number(expense.amount || 0), 0);

    return {
      agreed,
      paid,
      expenses: projectExpenses,
      balance: agreed - paid - projectExpenses
    };
  }

  const totals = useMemo(() => {
    const totalProjects = projects.length;
    const totalAgreed = projects.reduce((sum, project) => sum + Number(project.agreed_amount || 0), 0);
    const totalPaid = payments.reduce((sum, payment) => sum + Number(payment.amount || 0), 0);
    const totalExpenses = expenses.reduce((sum, expense) => sum + Number(expense.amount || 0), 0);
    const totalBalance = totalAgreed - totalPaid - totalExpenses;
    const lowStockCount = inventory.filter((item) => Number(item.quantity || 0) <= Number(item.min_quantity || 0)).length;
    const totalQuotes = quotes.reduce((sum, quote) => sum + Number(quote.payable || 0), 0);
    const pendingTasks = tasks.filter((task) => task.status !== 'completed').length;

    return { totalProjects, totalAgreed, totalPaid, totalExpenses, totalBalance, lowStockCount, totalQuotes, pendingTasks };
  }, [projects, payments, expenses, inventory, quotes, tasks]);

  function calculateQuoteValues(quoteForm) {
    const subtotal = Number(quoteForm.subtotal || 0);
    const vat = quoteForm.job_type === 'invoice' ? subtotal * 0.24 : 0;
    const withholding = quoteForm.job_type === 'invoice' ? subtotal * 0.03 : 0;
    const payable = subtotal + vat - withholding;

    return { subtotal, vat, withholding, payable };
  }

  async function saveCustomer() {
    if (!newCustomer.name.trim()) {
      alert('Βάλε όνομα πελάτη');
      return;
    }

    const query = editingCustomerId
      ? supabase.from('customers').update(newCustomer).eq('id', editingCustomerId)
      : supabase.from('customers').insert([newCustomer]);

    const { error } = await query;

    if (error) {
      alert(error.message);
      return;
    }

    setNewCustomer(INITIAL_CUSTOMER);
    setEditingCustomerId(null);
    loadCustomers();
  }

  async function saveProject() {
    if (!newProject.customer_id) {
      alert('Διάλεξε πελάτη για το έργο');
      return;
    }

    if (!newProject.title.trim()) {
      alert('Βάλε τίτλο έργου');
      return;
    }

    const payload = {
      customer_id: newProject.customer_id,
      title: newProject.title,
      address: newProject.address,
      area: newProject.area,
      agreed_amount: Number(newProject.agreed_amount || 0),
      status: newProject.status,
      job_type: 'invoice'
    };

    const query = editingProjectId
      ? supabase.from('projects').update(payload).eq('id', editingProjectId)
      : supabase.from('projects').insert([{ code: 'PRJ-' + Date.now(), ...payload }]);

    const { error } = await query;

    if (error) {
      alert(error.message);
      return;
    }

    setNewProject(INITIAL_PROJECT);
    setEditingProjectId(null);
    loadProjects();
  }

  async function savePayment() {
    if (!newPayment.project_id || !newPayment.amount) {
      alert('Διάλεξε έργο και βάλε ποσό πληρωμής');
      return;
    }

    const payload = {
      project_id: newPayment.project_id,
      amount: Number(newPayment.amount || 0),
      method: newPayment.method,
      payment_type: 'income',
      notes: newPayment.notes
    };

    const query = editingPaymentId
      ? supabase.from('payments').update(payload).eq('id', editingPaymentId)
      : supabase.from('payments').insert([payload]);

    const { error } = await query;

    if (error) {
      alert(error.message);
      return;
    }

    setNewPayment(INITIAL_PAYMENT);
    setEditingPaymentId(null);
    loadPayments();
  }

  async function saveExpense() {
    if (!newExpense.project_id || !newExpense.title.trim() || !newExpense.amount) {
      alert('Διάλεξε έργο, βάλε τίτλο και ποσό εξόδου');
      return;
    }

    const payload = {
      project_id: newExpense.project_id,
      title: newExpense.title,
      amount: Number(newExpense.amount || 0),
      category: newExpense.category,
      notes: newExpense.notes
    };

    const query = editingExpenseId
      ? supabase.from('expenses').update(payload).eq('id', editingExpenseId)
      : supabase.from('expenses').insert([payload]);

    const { error } = await query;

    if (error) {
      alert(error.message);
      return;
    }

    setNewExpense(INITIAL_EXPENSE);
    setEditingExpenseId(null);
    loadExpenses();
  }

  async function saveInventory() {
    if (!newInventory.item_name.trim()) {
      alert('Βάλε όνομα υλικού');
      return;
    }

    const payload = {
      item_name: newInventory.item_name,
      quantity: Number(newInventory.quantity || 0),
      min_quantity: Number(newInventory.min_quantity || 0),
      purchase_price: Number(newInventory.purchase_price || 0)
    };

    const query = editingInventoryId
      ? supabase.from('inventory').update(payload).eq('id', editingInventoryId)
      : supabase.from('inventory').insert([payload]);

    const { error } = await query;

    if (error) {
      alert(error.message);
      return;
    }

    setNewInventory(INITIAL_INVENTORY);
    setEditingInventoryId(null);
    loadInventory();
  }

  async function saveQuote() {
    if (!newQuote.project_id || !newQuote.work_type.trim() || !newQuote.description.trim() || !newQuote.subtotal) {
      alert('Διάλεξε έργο, βάλε είδος εργασίας, περιγραφή και ποσό προσφοράς');
      return;
    }

    const { subtotal, vat, withholding, payable } = calculateQuoteValues(newQuote);

    const payload = {
      project_id: newQuote.project_id,
      work_type: newQuote.work_type,
      description: newQuote.description,
      subtotal,
      vat,
      withholding,
      payable,
      job_type: newQuote.job_type,
      status: newQuote.status || 'pending'
    };

    const query = editingQuoteId
      ? supabase.from('quotes').update(payload).eq('id', editingQuoteId)
      : supabase.from('quotes').insert([{ quote_number: 'Q-' + Date.now(), ...payload }]);

    const { error } = await query;

    if (error) {
      alert(error.message);
      return;
    }

    setNewQuote(INITIAL_QUOTE);
    setEditingQuoteId(null);
    loadQuotes();
  }

  async function saveTask() {
    if (!newTask.project_id || !newTask.title.trim() || !newTask.task_date) {
      alert('Διάλεξε έργο, βάλε τίτλο και ημερομηνία');
      return;
    }

    const payload = {
      project_id: newTask.project_id,
      title: newTask.title,
      task_date: newTask.task_date,
      task_time: newTask.task_time || null,
      status: newTask.status,
      notes: newTask.notes
    };

    const query = editingTaskId
      ? supabase.from('tasks').update(payload).eq('id', editingTaskId)
      : supabase.from('tasks').insert([payload]);

    const { error } = await query;

    if (error) {
      alert(error.message);
      return;
    }

    setNewTask(INITIAL_TASK);
    setEditingTaskId(null);
    loadTasks();
  }

  function editCustomer(customer) {
    setNewCustomer({
      name: customer.name || '',
      phone: customer.phone || '',
      area: customer.area || '',
      notes: customer.notes || ''
    });
    setEditingCustomerId(customer.id);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  }

  function editProject(project) {
    setNewProject({
      customer_id: project.customer_id || '',
      title: project.title || '',
      address: project.address || '',
      area: project.area || '',
      agreed_amount: String(project.agreed_amount || ''),
      status: project.status || 'active'
    });
    setEditingProjectId(project.id);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  }

  function editPayment(payment) {
    setNewPayment({
      project_id: payment.project_id || '',
      amount: String(payment.amount || ''),
      method: payment.method || 'Μετρητά',
      notes: payment.notes || ''
    });
    setEditingPaymentId(payment.id);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  }

  function editExpense(expense) {
    setNewExpense({
      project_id: expense.project_id || '',
      title: expense.title || '',
      amount: String(expense.amount || ''),
      category: expense.category || 'Υλικά',
      notes: expense.notes || ''
    });
    setEditingExpenseId(expense.id);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  }

  function editInventory(item) {
    setNewInventory({
      item_name: item.item_name || '',
      quantity: String(item.quantity || ''),
      min_quantity: String(item.min_quantity || ''),
      purchase_price: String(item.purchase_price || '')
    });
    setEditingInventoryId(item.id);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  }

  function editQuote(quote) {
    setNewQuote({
      project_id: quote.project_id || '',
      work_type: quote.work_type || '',
      description: quote.description || '',
      subtotal: String(quote.subtotal || ''),
      job_type: quote.job_type || 'invoice',
      status: quote.status || 'pending'
    });
    setEditingQuoteId(quote.id);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  }

  function editTask(task) {
    setNewTask({
      project_id: task.project_id || '',
      title: task.title || '',
      task_date: task.task_date || '',
      task_time: task.task_time || '',
      status: task.status || 'pending',
      notes: task.notes || ''
    });
    setEditingTaskId(task.id);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  }

  function cancelEdits() {
    setEditingCustomerId(null);
    setEditingProjectId(null);
    setEditingPaymentId(null);
    setEditingExpenseId(null);
    setEditingInventoryId(null);
    setEditingQuoteId(null);
    setEditingTaskId(null);

    setNewCustomer(INITIAL_CUSTOMER);
    setNewProject(INITIAL_PROJECT);
    setNewPayment(INITIAL_PAYMENT);
    setNewExpense(INITIAL_EXPENSE);
    setNewInventory(INITIAL_INVENTORY);
    setNewQuote(INITIAL_QUOTE);
    setNewTask(INITIAL_TASK);
  }

  async function deleteItem(table, id) {
    const confirmDelete = confirm('Σίγουρα θέλεις να το διαγράψεις;');
    if (!confirmDelete) return;

    if (table === 'customers') {
      const customerProjects = getCustomerProjects(id);
      const projectIds = customerProjects.map((project) => project.id);

      for (const projectId of projectIds) {
        await supabase.from('payments').delete().eq('project_id', projectId);
        await supabase.from('expenses').delete().eq('project_id', projectId);
        await supabase.from('quotes').delete().eq('project_id', projectId);
        await supabase.from('tasks').delete().eq('project_id', projectId);
      }

      await supabase.from('projects').delete().eq('customer_id', id);
    }

    if (table === 'projects') {
      await supabase.from('payments').delete().eq('project_id', id);
      await supabase.from('expenses').delete().eq('project_id', id);
      await supabase.from('quotes').delete().eq('project_id', id);
      await supabase.from('tasks').delete().eq('project_id', id);
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

      {(editingCustomerId || editingProjectId || editingPaymentId || editingExpenseId || editingInventoryId || editingQuoteId || editingTaskId) && (
        <section className="card">
          <h2>✏️ Λειτουργία επεξεργασίας</h2>
          <p>Έχεις ανοίξει μια εγγραφή για αλλαγές. Κάνε τις αλλαγές στη φόρμα και πάτα αποθήκευση.</p>
          <button onClick={cancelEdits}>Ακύρωση επεξεργασίας</button>
        </section>
      )}

      <section className="card">
        <h2>Dashboard</h2>
        <div className="grid">
          <div className="line"><p><b>{totals.totalProjects}</b></p><small>Έργα</small></div>
          <div className="line"><p><b>{totals.totalAgreed}€</b></p><small>Συμφωνημένα</small></div>
          <div className="line"><p><b>{totals.totalPaid}€</b></p><small>Πληρωμένα</small></div>
          <div className="line"><p><b>{totals.totalExpenses}€</b></p><small>Έξοδα</small></div>
          <div className="line"><p><b>{totals.totalBalance}€</b></p><small>Καθαρό υπόλοιπο</small></div>
          <div className="line"><p><b>{totals.totalQuotes}€</b></p><small>Προσφορές</small></div>
          <div className={totals.pendingTasks > 0 ? 'line alert' : 'line'}><p><b>{totals.pendingTasks}</b></p><small>Tasks pending</small></div>
          <div className={totals.lowStockCount > 0 ? 'line alert' : 'line'}><p><b>{totals.lowStockCount}</b></p><small>Low stock alerts</small></div>
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
        {crews.map((crew) => <p key={crew.id}><b>{crew.name}</b> — {crew.specialty}</p>)}
      </section>

      <section className="card">
        <h2>{editingTaskId ? 'Επεξεργασία Task / Ραντεβού' : 'Νέο Task / Ραντεβού'}</h2>
        <select value={newTask.project_id} onChange={(e) => setNewTask({ ...newTask, project_id: e.target.value })}>
          <option value="">Διάλεξε έργο</option>
          {projects.map((project) => <option key={project.id} value={project.id}>{project.title}</option>)}
        </select>
        <input placeholder="Τίτλος task / ραντεβού" value={newTask.title} onChange={(e) => setNewTask({ ...newTask, title: e.target.value })} />
        <input type="date" value={newTask.task_date} onChange={(e) => setNewTask({ ...newTask, task_date: e.target.value })} />
        <input type="time" value={newTask.task_time} onChange={(e) => setNewTask({ ...newTask, task_time: e.target.value })} />
        <select value={newTask.status} onChange={(e) => setNewTask({ ...newTask, status: e.target.value })}>
          <option value="pending">Pending</option>
          <option value="in_progress">Σε εξέλιξη</option>
          <option value="completed">Ολοκληρώθηκε</option>
        </select>
        <textarea placeholder="Σημειώσεις" value={newTask.notes} onChange={(e) => setNewTask({ ...newTask, notes: e.target.value })} />
        <button onClick={saveTask}>{editingTaskId ? 'Αποθήκευση αλλαγών task' : 'Αποθήκευση task'}</button>
      </section>

      <section className="card">
        <h2>Calendar / Tasks</h2>
        {tasks.length === 0 ? <p>Δεν υπάρχουν tasks ακόμα.</p> : tasks.map((task) => (
          <div key={task.id} className={task.status === 'completed' ? 'line' : 'line alert'}>
            <p><b>{task.title}</b></p>
            <p>Έργο: {getProjectTitle(task.project_id)}</p>
            <p>Ημερομηνία: {task.task_date} {task.task_time || ''}</p>
            <p>Status: {task.status}</p>
            <small>{task.notes}</small>
            <button onClick={() => editTask(task)}>✏️ Επεξεργασία</button>
            <button onClick={() => deleteItem('tasks', task.id)}>🗑 Διαγραφή task</button>
          </div>
        ))}
      </section>

      <section className="card">
        <h2>{editingCustomerId ? 'Επεξεργασία Πελάτη' : 'Νέος Πελάτης'}</h2>
        <input placeholder="Όνομα πελάτη" value={newCustomer.name} onChange={(e) => setNewCustomer({ ...newCustomer, name: e.target.value })} />
        <input placeholder="Τηλέφωνο" value={newCustomer.phone} onChange={(e) => setNewCustomer({ ...newCustomer, phone: e.target.value })} />
        <input placeholder="Περιοχή" value={newCustomer.area} onChange={(e) => setNewCustomer({ ...newCustomer, area: e.target.value })} />
        <textarea placeholder="Σημειώσεις" value={newCustomer.notes} onChange={(e) => setNewCustomer({ ...newCustomer, notes: e.target.value })} />
        <button onClick={saveCustomer}>{editingCustomerId ? 'Αποθήκευση αλλαγών πελάτη' : 'Αποθήκευση πελάτη'}</button>
      </section>

      <section className="card">
        <h2>{editingProjectId ? 'Επεξεργασία Έργου' : 'Νέο Έργο'}</h2>
        <select value={newProject.customer_id} onChange={(e) => setNewProject({ ...newProject, customer_id: e.target.value })}>
          <option value="">Διάλεξε πελάτη</option>
          {customers.map((customer) => <option key={customer.id} value={customer.id}>{customer.name}</option>)}
        </select>
        <input placeholder="Τίτλος έργου" value={newProject.title} onChange={(e) => setNewProject({ ...newProject, title: e.target.value })} />
        <input placeholder="Διεύθυνση" value={newProject.address} onChange={(e) => setNewProject({ ...newProject, address: e.target.value })} />
        <input placeholder="Περιοχή" value={newProject.area} onChange={(e) => setNewProject({ ...newProject, area: e.target.value })} />
        <input placeholder="Συμφωνηθέν ποσό" value={newProject.agreed_amount} onChange={(e) => setNewProject({ ...newProject, agreed_amount: e.target.value })} />
        <select value={newProject.status} onChange={(e) => setNewProject({ ...newProject, status: e.target.value })}>
          <option value="active">Ενεργό</option>
          <option value="pending">Σε αναμονή</option>
          <option value="completed">Ολοκληρωμένο</option>
        </select>
        <button onClick={saveProject}>{editingProjectId ? 'Αποθήκευση αλλαγών έργου' : 'Αποθήκευση έργου'}</button>
      </section>

      <section className="card">
        <h2>{editingPaymentId ? 'Επεξεργασία Πληρωμής' : 'Νέα Πληρωμή'}</h2>
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
        <button onClick={savePayment}>{editingPaymentId ? 'Αποθήκευση αλλαγών πληρωμής' : 'Αποθήκευση πληρωμής'}</button>
      </section>

      <section className="card">
        <h2>{editingQuoteId ? 'Επεξεργασία Προσφοράς' : 'Νέα Προσφορά'}</h2>
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
        <select value={newQuote.status} onChange={(e) => setNewQuote({ ...newQuote, status: e.target.value })}>
          <option value="pending">Pending</option>
          <option value="accepted">Accepted</option>
          <option value="rejected">Rejected</option>
        </select>
        <button onClick={saveQuote}>{editingQuoteId ? 'Αποθήκευση αλλαγών προσφοράς' : 'Αποθήκευση προσφοράς'}</button>
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
            <button onClick={(e) => { e.stopPropagation(); editQuote(quote); }}>✏️ Επεξεργασία</button>
            <button onClick={(e) => { e.stopPropagation(); deleteItem('quotes', quote.id); }}>🗑 Διαγραφή</button>
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
        <h2>{editingExpenseId ? 'Επεξεργασία Εξόδου' : 'Νέο Έξοδο'}</h2>
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
        <button onClick={saveExpense}>{editingExpenseId ? 'Αποθήκευση αλλαγών εξόδου' : 'Αποθήκευση εξόδου'}</button>
      </section>

      <section className="card">
        <h2>{editingInventoryId ? 'Επεξεργασία Υλικού' : 'Νέο Υλικό'}</h2>
        <input placeholder="Υλικό" value={newInventory.item_name} onChange={(e) => setNewInventory({ ...newInventory, item_name: e.target.value })} />
        <input placeholder="Ποσότητα" value={newInventory.quantity} onChange={(e) => setNewInventory({ ...newInventory, quantity: e.target.value })} />
        <input placeholder="Ελάχιστο απόθεμα" value={newInventory.min_quantity} onChange={(e) => setNewInventory({ ...newInventory, min_quantity: e.target.value })} />
        <input placeholder="Τιμή αγοράς" value={newInventory.purchase_price} onChange={(e) => setNewInventory({ ...newInventory, purchase_price: e.target.value })} />
        <button onClick={saveInventory}>{editingInventoryId ? 'Αποθήκευση αλλαγών υλικού' : 'Αποθήκευση υλικού'}</button>
      </section>

      <section className="card">
        <h2>Πελάτες</h2>
        {customers.length === 0 ? <p>Δεν υπάρχουν πελάτες ακόμα.</p> : customers.map((customer) => {
          const customerProjects = getCustomerProjects(customer.id);
          const customerTotals = getCustomerTotals(customer.id);

          return (
            <div key={customer.id} className="line">
              <p><b>{customer.name}</b></p>
              <p>{customer.phone}</p>
              <p>{customer.area}</p>
              <small>{customer.notes}</small>
              <p>Έργα: {customerProjects.length}</p>
              <p>Συμφωνημένα: {customerTotals.agreed}€</p>
              <p>Πληρωμένα: {customerTotals.paid}€</p>
              <p>Έξοδα: {customerTotals.expenses}€</p>
              <p><b>Καθαρό υπόλοιπο: {customerTotals.balance}€</b></p>

              {customerProjects.length > 0 && (
                <div>
                  <h3>Έργα πελάτη</h3>
                  {customerProjects.map((project) => (
                    <p key={project.id}>• {project.title} — {project.status}</p>
                  ))}
                </div>
              )}

              <button onClick={() => editCustomer(customer)}>✏️ Επεξεργασία</button>
              <button onClick={() => deleteItem('customers', customer.id)}>🗑 Διαγραφή πελάτη</button>
            </div>
          );
        })}
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
              <p>Πελάτης: {getCustomerName(project.customer_id)}</p>
              <p>{project.area}</p>
              <p>Status: {project.status}</p>
              <p>Συμφωνία: {agreed}€</p>
              <p>Πληρώθηκε: {paid}€</p>
              <p>Έξοδα: {projectExpenses}€</p>
              <p><b>Καθαρό υπόλοιπο: {balance}€</b></p>
              <button onClick={(e) => { e.stopPropagation(); editProject(project); }}>✏️ Επεξεργασία</button>
              <button onClick={(e) => { e.stopPropagation(); deleteItem('projects', project.id); }}>🗑 Διαγραφή έργου</button>
            </div>
          );
        })}
      </section>

      {selectedProject && (
        <section className="card">
          <h2>Ανάλυση Έργου</h2>
          <p><b>{selectedProject.title}</b></p>
          <p>Πελάτης: {getCustomerName(selectedProject.customer_id)}</p>
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

          <h3>Tasks έργου</h3>
          {getProjectTasks(selectedProject.id).map((task) => (
            <div key={task.id} className={task.status === 'completed' ? 'line' : 'line alert'}>
              <p><b>{task.title}</b></p>
              <p>{task.task_date} {task.task_time || ''}</p>
              <small>{task.status}</small>
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
              <button onClick={() => editInventory(item)}>✏️ Επεξεργασία</button>
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
            <button onClick={() => editPayment(payment)}>✏️ Επεξεργασία</button>
            <button onClick={() => deleteItem('payments', payment.id)}>🗑 Διαγραφή πληρωμής</button>
          </div>
        ))}
      </section>
    </main>
  );
}
