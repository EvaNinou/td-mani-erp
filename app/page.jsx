'use client';

import { useEffect, useMemo, useState } from 'react';
import { supabase } from './supabaseClient.js';
import './styles.css';

const INITIAL_CUSTOMER = { name: '', phone: '', area: '', notes: '' };
const INITIAL_PROJECT = { customer_id: '', title: '', address: '', area: '', agreed_amount: '', status: 'active' };
const INITIAL_PAYMENT = { customer_id: '', project_id: '', amount: '', payment_date: '', method: 'Μετρητά', notes: '' };
const INITIAL_EXPENSE = { customer_id: '', project_id: '', title: '', amount: '', category: 'Υλικά', notes: '' };
const INITIAL_INVENTORY = { item_name: '', quantity: '', min_quantity: '', purchase_price: '' };
const INITIAL_QUOTE = { project_id: '', work_type: '', description: '', subtotal: '', job_type: 'invoice', status: 'pending' };
const INITIAL_TASK = { project_id: '', title: '', task_date: '', task_time: '', status: 'pending', notes: '' };
const INITIAL_DOCUMENT = { customer_id: '', project_id: '', title: '', document_type: 'Τιμολόγιο', file_url: '', notes: '' };

const DEMO_USERS = [
  { email: 'eva@tdmani.gr', password: '1234', name: 'Εύα Νίνου', role: 'Admin' },
  { email: 'mani@tdmani.gr', password: '1234', name: 'Mani Taulant', role: 'Admin' }
];


const ERP_STYLES = `:root {
  --gold: #d6a84f;
  --dark: #0d0d0f;
  --card: rgba(29, 29, 34, 0.94);
  --text: #f5f1e8;
  --muted: #a8a29a;
  --danger: #ff6b5f;
  --border: rgba(255, 255, 255, 0.10);
}

* { box-sizing: border-box; }

html { scroll-behavior: smooth; }

body {
  margin: 0 !important;
  background:
    radial-gradient(circle at top left, rgba(214, 168, 79, 0.14), transparent 32%),
    linear-gradient(135deg, #070708 0%, #101014 48%, #0a0a0c 100%) !important;
  color: var(--text) !important;
  font-family: Arial, Helvetica, sans-serif;
}

.app {
  width: min(1280px, 100%);
  margin: 0 auto;
  min-height: 100vh;
  padding: 16px;
}

.top {
  position: sticky;
  top: 0;
  z-index: 30;
  display: flex;
  justify-content: space-between;
  align-items: center;
  gap: 14px;
  margin-bottom: 14px;
  padding: 14px 16px;
  background: rgba(13, 13, 15, 0.94) !important;
  backdrop-filter: blur(14px);
  border: 1px solid var(--border);
  border-radius: 22px;
  box-shadow: 0 18px 36px rgba(0, 0, 0, 0.26);
}

.brand {
  display: flex;
  gap: 14px;
  align-items: center;
}

.logo {
  width: 64px;
  height: 54px;
  flex: 0 0 64px;
  display: flex;
  align-items: center;
  justify-content: center;
  background: linear-gradient(135deg, #d6a84f, #7a551d) !important;
  color: #101014 !important;
  border: 1px solid rgba(214, 168, 79, 0.4);
  border-radius: 16px;
  font-size: 24px;
  font-weight: 950;
  letter-spacing: -1px;
}

.pdf-logo {
  width: 76px;
  height: 62px;
}

h1, h2, h3, h4, p { margin-top: 0; }

h1 {
  margin-bottom: 4px;
  color: var(--text);
  font-size: 24px;
  letter-spacing: 0.08em;
}

h2 {
  margin-bottom: 14px;
  color: var(--text);
  font-size: 21px;
}

h3 {
  margin-top: 18px;
  margin-bottom: 10px;
  color: var(--gold);
  font-size: 17px;
}

h4 {
  margin-top: 14px;
  margin-bottom: 8px;
  color: var(--text);
  font-size: 15px;
}

p { color: var(--text); }
small { color: var(--muted); }

.card {
  margin: 14px 0;
  padding: 18px;
  background: var(--card) !important;
  border: 1px solid var(--border);
  border-radius: 22px;
  box-shadow: 0 18px 42px rgba(0, 0, 0, 0.24);
}

.login-card {
  width: min(460px, 100%);
  margin: 8vh auto;
  text-align: center;
}

.grid {
  display: grid;
  grid-template-columns: repeat(4, minmax(0, 1fr));
  gap: 12px;
}

.line {
  margin: 10px 0;
  padding: 16px;
  background: linear-gradient(180deg, rgba(255,255,255,0.055), rgba(255,255,255,0.028)) !important;
  border: 1px solid var(--border);
  border-radius: 18px;
  box-shadow: inset 0 1px 0 rgba(255,255,255,0.05), 0 10px 24px rgba(0,0,0,0.18);
  text-align: left;
}

.line p {
  margin: 0 0 7px;
  color: var(--text);
  font-size: 15px;
  line-height: 1.35;
}

.line p:last-child { margin-bottom: 0; }

.line b {
  color: var(--gold);
  font-size: 17px;
}

.alert {
  border-color: rgba(255, 107, 95, 0.55);
  background: linear-gradient(180deg, rgba(255,107,95,0.13), rgba(255,107,95,0.06)) !important;
}

input, select, textarea {
  width: 100%;
  margin: 7px 0;
  padding: 13px 14px;
  background: rgba(255,255,255,0.055) !important;
  color: var(--text) !important;
  border: 1px solid var(--border);
  border-radius: 14px;
  font-size: 15px;
  outline: none;
}

select option {
  background: #16161a;
  color: var(--text);
}

input::placeholder, textarea::placeholder { color: #8f8a82; }

input:focus, select:focus, textarea:focus {
  border-color: var(--gold);
  box-shadow: 0 0 0 3px rgba(214,168,79,0.13);
}

textarea {
  min-height: 92px;
  resize: vertical;
}

button {
  display: inline-block;
  width: auto;
  min-width: 120px;
  margin: 7px 7px 7px 0;
  padding: 12px 15px;
  border: 1px solid rgba(214,168,79,0.28);
  border-radius: 14px;
  background: linear-gradient(135deg, #d6a84f, #7a551d) !important;
  color: #101014 !important;
  font-size: 14px;
  font-weight: 900;
  cursor: pointer;
}

button + button {
  background: rgba(255,255,255,0.07) !important;
  color: var(--text) !important;
  border-color: var(--border);
}

a {
  color: var(--gold);
  font-weight: 800;
  text-decoration: none;
}

hr {
  margin: 18px 0;
  border: none;
  border-top: 1px solid var(--border);
}

.pdf-header {
  display: flex;
  align-items: center;
  gap: 14px;
}

.signature-line {
  margin-top: 26px;
  padding-top: 16px;
  border-top: 1px solid rgba(214,168,79,0.55);
  width: 220px;
}

.report-block {
  break-inside: avoid;
  padding: 12px 0;
}

/* Navigation tabs */
.erp-nav {
  position: sticky;
  top: 92px;
  z-index: 24;
  display: flex !important;
  gap: 8px;
  margin: 0 0 16px;
  padding: 10px;
  overflow-x: auto;
  background: rgba(13,13,15,0.90) !important;
  backdrop-filter: blur(14px);
  border: 1px solid var(--border);
  border-radius: 18px;
  box-shadow: 0 14px 30px rgba(0,0,0,0.24);
}

.erp-nav button {
  width: auto;
  min-width: max-content;
  margin: 0;
  padding: 10px 13px;
  background: rgba(255,255,255,0.055) !important;
  color: var(--text) !important;
  border: 1px solid var(--border);
  box-shadow: none;
}

.erp-nav button.active {
  background: linear-gradient(135deg, #d6a84f, #7a551d) !important;
  color: #101014 !important;
}

/* IMPORTANT: tab system */
.page-section {
  display: none !important;
}

.page-dashboard .dashboard-section,
.page-customers .customers-section,
.page-finance .finance-section,
.page-tasks .tasks-section,
.page-documents .documents-section,
.page-inventory .inventory-section,
.page-settings .settings-section {
  display: block !important;
}

@media (max-width: 900px) {
  .app { padding: 12px; }
  .top { align-items: flex-start; flex-direction: column; }
  .grid { grid-template-columns: repeat(2, minmax(0, 1fr)); }
  .card { padding: 16px; border-radius: 20px; }
  h1 { font-size: 21px; }
  h2 { font-size: 19px; }
}

@media (max-width: 560px) {
  .app { padding: 10px; }

  .top {
    position: static !important;
    padding: 13px;
    border-radius: 18px;
  }

  .erp-nav {
    top: 0;
    border-radius: 16px;
    padding: 8px;
  }

  .erp-nav button {
    width: auto;
    min-width: max-content;
    padding: 9px 11px;
    font-size: 14px;
  }

  .grid { grid-template-columns: 1fr; }
  .brand { width: 100%; }

  .logo {
    width: 58px;
    height: 48px;
    flex-basis: 58px;
    font-size: 22px;
  }

  .card {
    margin: 12px 0;
    padding: 14px;
    border-radius: 18px;
  }

  .line {
    padding: 13px;
    border-radius: 16px;
  }

  input, select, textarea, button { font-size: 16px; }

  button {
    width: 100%;
    margin-right: 0;
  }
}

@media print {
  body {
    background: white !important;
    color: #111 !important;
  }

  body * { visibility: hidden; }

  .print-area,
  .print-area * {
    visibility: visible;
    color: #111 !important;
  }

  .print-area {
    position: absolute;
    left: 0;
    top: 0;
    width: 100%;
    margin: 0;
    background: white !important;
    box-shadow: none;
    border: none;
  }

  .print-area button,
  .erp-nav { display: none !important; }

  .page-section { display: block !important; }
}
`;


export default function Home() {
  const [selectedUser, setSelectedUser] = useState('Mani Taulant');
  const [activePage, setActivePage] = useState('dashboard');
  const [currentUser, setCurrentUser] = useState(null);
  const [loginForm, setLoginForm] = useState({ email: '', password: '' });

  const [crews, setCrews] = useState([]);
  const [customers, setCustomers] = useState([]);
  const [projects, setProjects] = useState([]);
  const [payments, setPayments] = useState([]);
  const [expenses, setExpenses] = useState([]);
  const [inventory, setInventory] = useState([]);
  const [quotes, setQuotes] = useState([]);
  const [tasks, setTasks] = useState([]);
  const [documents, setDocuments] = useState([]);

  const [selectedProject, setSelectedProject] = useState(null);
  const [selectedQuote, setSelectedQuote] = useState(null);
  const [selectedCustomerReport, setSelectedCustomerReport] = useState(null);
  const [openCustomerId, setOpenCustomerId] = useState(null);
  const [showPayments, setShowPayments] = useState(false);
  
const [customerSearch, setCustomerSearch] = useState('');
const [projectSearch, setProjectSearch] = useState('');
const [taskSearch, setTaskSearch] = useState('');
  
  const [editingCustomerId, setEditingCustomerId] = useState(null);
  const [editingProjectId, setEditingProjectId] = useState(null);
  const [editingPaymentId, setEditingPaymentId] = useState(null);
  const [editingExpenseId, setEditingExpenseId] = useState(null);
  const [editingInventoryId, setEditingInventoryId] = useState(null);
  const [editingQuoteId, setEditingQuoteId] = useState(null);
  const [editingTaskId, setEditingTaskId] = useState(null);
  const [editingDocumentId, setEditingDocumentId] = useState(null);

  const [newCustomer, setNewCustomer] = useState(INITIAL_CUSTOMER);
  const [newProject, setNewProject] = useState(INITIAL_PROJECT);
  const [newPayment, setNewPayment] = useState(INITIAL_PAYMENT);
  const [newExpense, setNewExpense] = useState(INITIAL_EXPENSE);
  const [newInventory, setNewInventory] = useState(INITIAL_INVENTORY);
  const [newQuote, setNewQuote] = useState(INITIAL_QUOTE);
  const [newTask, setNewTask] = useState(INITIAL_TASK);
  const [newDocument, setNewDocument] = useState(INITIAL_DOCUMENT);
  const [documentFile, setDocumentFile] = useState(null);

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
      loadTasks(),
      loadDocuments()
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

  async function loadDocuments() {
    const { data } = await supabase.from('documents').select('*').order('created_at', { ascending: false });
    setDocuments(data || []);
  }

  function getCustomerName(customerId) {
    return customers.find((customer) => customer.id === customerId)?.name || 'Χωρίς πελάτη';
  }

  function getCustomerProjects(customerId) {
    return projects.filter((project) => project.customer_id === customerId);
  }

  function getFilteredProjectsByCustomer(customerId) {
    if (!customerId) return [];
    return projects.filter((project) => project.customer_id === customerId);
  }

  function getUnassignedProjects() {
    return projects.filter((project) => !project.customer_id);
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

  function getProjectDocuments(projectId) {
    return documents.filter((document) => document.project_id === projectId);
  }

  function getProjectPayments(projectId) {
    return payments.filter((payment) => payment.project_id === projectId);
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

    return { agreed, paid, expenses: projectExpenses, balance: agreed - paid - projectExpenses };
  }

  function getCustomerReportRows(customerId) {
    return getCustomerProjects(customerId).map((project) => {
      const agreed = Number(project.agreed_amount || 0);
      const paid = getProjectPaid(project.id);
      const projectExpenses = getProjectExpenses(project.id);

      return {
        project,
        agreed,
        paid,
        expenses: projectExpenses,
        balance: agreed - paid - projectExpenses,
        payments: getProjectPayments(project.id),
        projectExpensesList: expenses.filter((expense) => expense.project_id === project.id),
        projectQuotes: getProjectQuotes(project.id),
        projectTasks: getProjectTasks(project.id),
        projectDocuments: getProjectDocuments(project.id)
      };
    });
  }


  function normalizeText(value) {
    return String(value || '').toLowerCase().trim();
  }

  function projectMatchesSearch(project, searchValue) {
    const search = normalizeText(searchValue);
    if (!search) return true;

    return [
      project.title,
      project.area,
      project.address,
      project.status,
      getCustomerName(project.customer_id)
    ].some((value) => normalizeText(value).includes(search));
  }

  function customerMatchesSearch(customer) {
    const search = normalizeText(customerSearch);
    const customerTextMatches = !search || [
      customer.name,
      customer.phone,
      customer.area,
      customer.notes
    ].some((value) => normalizeText(value).includes(search));

    const projectTextMatches = !projectSearch || getCustomerProjects(customer.id)
      .some((project) => projectMatchesSearch(project, projectSearch));

    return customerTextMatches && projectTextMatches;
  }

  function getVisibleCustomerProjects(customerId) {
    return getCustomerProjects(customerId).filter((project) => projectMatchesSearch(project, projectSearch));
  }

  function taskMatchesSearch(task) {
    const search = normalizeText(taskSearch);
    if (!search) return true;

    return [
      task.title,
      task.status,
      task.notes,
      task.task_date,
      task.task_time,
      getProjectTitle(task.project_id)
    ].some((value) => normalizeText(value).includes(search));
  }

  function getVisibleTasks() {
    return tasks.filter(taskMatchesSearch);
  }


  function isCurrentMonth(dateString) {
    if (!dateString) return false;
    const date = new Date(dateString);
    const now = new Date();
    return date.getMonth() === now.getMonth() && date.getFullYear() === now.getFullYear();
  }

  const dashboardStats = useMemo(() => {
    const monthlyIncome = payments.filter((payment) => isCurrentMonth(payment.created_at))
      .reduce((sum, payment) => sum + Number(payment.amount || 0), 0);

    const monthlyExpenses = expenses.filter((expense) => isCurrentMonth(expense.created_at))
      .reduce((sum, expense) => sum + Number(expense.amount || 0), 0);

    const monthlyProfit = monthlyIncome - monthlyExpenses;
    const activeProjects = projects.filter((project) => project.status === 'active').length;
    const completedProjects = projects.filter((project) => project.status === 'completed').length;
    const today = new Date().toISOString().split('T')[0];
    const overdueTasks = tasks.filter((task) =>
      task.status !== 'completed' && task.task_date && task.task_date < today
    ).length;

    return { monthlyIncome, monthlyExpenses, monthlyProfit, activeProjects, completedProjects, overdueTasks };
  }, [payments, expenses, projects, tasks]);


  const riskStats = useMemo(() => {
    const riskyProjects = projects
      .map((project) => {
        const agreed = Number(project.agreed_amount || 0);
        const paid = getProjectPaid(project.id);
        const projectExpenses = getProjectExpenses(project.id);
        const balance = agreed - paid - projectExpenses;

        return {
          ...project,
          balance
        };
      })
      .filter((project) => project.balance < 0);

    const highBalanceProjects = projects
      .map((project) => {
        const agreed = Number(project.agreed_amount || 0);
        const paid = getProjectPaid(project.id);
        const projectExpenses = getProjectExpenses(project.id);
        const balance = agreed - paid - projectExpenses;

        return {
          ...project,
          balance
        };
      })
      .filter((project) => project.balance > 5000);

    return {
      riskyProjects,
      highBalanceProjects
    };
  }, [projects, payments, expenses]);

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
    if (error) return alert(error.message);

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
    if (error) return alert(error.message);

    setNewProject(INITIAL_PROJECT);
    setEditingProjectId(null);
    loadProjects();
  }

  async function savePayment() {
    if (!newPayment.customer_id || !newPayment.project_id || !newPayment.amount) {
      alert('Διάλεξε πελάτη, έργο και βάλε ποσό πληρωμής');
      return;
    }

    const payload = {
      project_id: newPayment.project_id,
      amount: Number(newPayment.amount || 0),
      payment_date: newPayment.payment_date || null,
      method: newPayment.method,
      payment_type: 'income',
      notes: newPayment.notes
    };

    const query = editingPaymentId
      ? supabase.from('payments').update(payload).eq('id', editingPaymentId)
      : supabase.from('payments').insert([payload]);

    const { error } = await query;
    if (error) return alert(error.message);

    setNewPayment(INITIAL_PAYMENT);
    setEditingPaymentId(null);
    loadPayments();
  }

  async function saveExpense() {
    if (!newExpense.customer_id || !newExpense.project_id || !newExpense.title.trim() || !newExpense.amount) {
      alert('Διάλεξε πελάτη, έργο, τίτλο και ποσό εξόδου');
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
    if (error) return alert(error.message);

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
    if (error) return alert(error.message);

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
    if (error) return alert(error.message);

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
    if (error) return alert(error.message);

    setNewTask(INITIAL_TASK);
    setNewDocument(INITIAL_DOCUMENT);
    setDocumentFile(null);
    setEditingTaskId(null);
    setEditingDocumentId(null);
    loadTasks();
  }

  async function saveDocument() {
    if (!newDocument.customer_id || !newDocument.project_id || !newDocument.title.trim()) {
      alert('Διάλεξε πελάτη, έργο και βάλε τίτλο αρχείου');
      return;
    }

    let fileUrl = newDocument.file_url;

    if (documentFile) {
      const fileExt = documentFile.name.split('.').pop();
      const fileName = `${Date.now()}-${Math.random().toString(36).slice(2)}.${fileExt}`;
      const filePath = `${newDocument.project_id}/${fileName}`;

      const { error: uploadError } = await supabase.storage
        .from('documents')
        .upload(filePath, documentFile);

      if (uploadError) {
        alert(uploadError.message);
        return;
      }

      const { data } = supabase.storage
        .from('documents')
        .getPublicUrl(filePath);

      fileUrl = data.publicUrl;
    }

    const payload = {
      project_id: newDocument.project_id,
      title: newDocument.title,
      document_type: newDocument.document_type,
      file_url: fileUrl,
      notes: newDocument.notes
    };

    const query = editingDocumentId
      ? supabase.from('documents').update(payload).eq('id', editingDocumentId)
      : supabase.from('documents').insert([payload]);

    const { error } = await query;
    if (error) return alert(error.message);

    setNewDocument(INITIAL_DOCUMENT);
    setDocumentFile(null);
    setDocumentFile(null);
    setEditingDocumentId(null);
    loadDocuments();
  }

  function editCustomer(customer) {
    setNewCustomer({ name: customer.name || '', phone: customer.phone || '', area: customer.area || '', notes: customer.notes || '' });
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
    const project = projects.find((item) => item.id === payment.project_id);

    setNewPayment({
      customer_id: project?.customer_id || '',
      project_id: payment.project_id || '',
      amount: String(payment.amount || ''),
      payment_date: payment.payment_date || '',
      method: payment.method || 'Μετρητά',
      notes: payment.notes || ''
    });
    setEditingPaymentId(payment.id);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  }

  function editExpense(expense) {
    const project = projects.find((item) => item.id === expense.project_id);

    setNewExpense({
      customer_id: project?.customer_id || '',
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

  function editDocument(document) {
    const project = projects.find((item) => item.id === document.project_id);

    setNewDocument({
      customer_id: project?.customer_id || '',
      project_id: document.project_id || '',
      title: document.title || '',
      document_type: document.document_type || 'Τιμολόγιο',
      file_url: document.file_url || '',
      notes: document.notes || ''
    });
    setDocumentFile(null);
    setEditingDocumentId(document.id);
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
    setEditingDocumentId(null);
    setNewCustomer(INITIAL_CUSTOMER);
    setNewProject(INITIAL_PROJECT);
    setNewPayment(INITIAL_PAYMENT);
    setNewExpense(INITIAL_EXPENSE);
    setNewInventory(INITIAL_INVENTORY);
    setNewQuote(INITIAL_QUOTE);
    setNewTask(INITIAL_TASK);
    setNewDocument(INITIAL_DOCUMENT);
    setDocumentFile(null);
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
        await supabase.from('documents').delete().eq('project_id', projectId);
      }

      await supabase.from('projects').delete().eq('customer_id', id);
    }

    if (table === 'projects') {
      await supabase.from('payments').delete().eq('project_id', id);
      await supabase.from('expenses').delete().eq('project_id', id);
      await supabase.from('quotes').delete().eq('project_id', id);
      await supabase.from('tasks').delete().eq('project_id', id);
      await supabase.from('documents').delete().eq('project_id', id);
    }

    const { error } = await supabase.from(table).delete().eq('id', id);
    if (error) return alert(error.message);

    if (selectedProject?.id === id) setSelectedProject(null);
    if (selectedQuote?.id === id) setSelectedQuote(null);
    if (selectedCustomerReport?.id === id) setSelectedCustomerReport(null);
    refreshAll();
  }


  function loginUser() {
    const user = DEMO_USERS.find(
      (item) => item.email === loginForm.email && item.password === loginForm.password
    );

    if (!user) {
      alert('Λάθος email ή password');
      return;
    }

    setCurrentUser(user);
    setSelectedUser(user.name);
    setLoginForm({ email: '', password: '' });
  }

  function logoutUser() {
    setCurrentUser(null);
    setSelectedUser('Mani Taulant');
  }

  if (!currentUser) {
    return (
      <main className={`app page-${activePage}`}>
        <style>{ERP_STYLES}</style>
        <section className="card login-card">
          <div className="brand">
            <div className="logo">TD</div>
            <div>
              <h1>T D MANI</h1>
              <p>ΟΙΚΟΔΟΜΙΚΕΣ ΕΡΓΑΣΙΕΣ</p>
            </div>
          </div>

          <h2>Σύνδεση ERP</h2>

          <input
            placeholder="Email"
            value={loginForm.email}
            onChange={(e) => setLoginForm({ ...loginForm, email: e.target.value })}
          />

          <input
            placeholder="Password"
            type="password"
            value={loginForm.password}
            onChange={(e) => setLoginForm({ ...loginForm, password: e.target.value })}
          />

          <button onClick={loginUser}>Σύνδεση</button>

          <hr />

          <p><b>Demo χρήστες:</b></p>
          <button onClick={() => setLoginForm({ email: 'eva@tdmani.gr', password: '1234' })}>
            👩 Εύα / Admin
          </button>
          <button onClick={() => setLoginForm({ email: 'mani@tdmani.gr', password: '1234' })}>
            👷 Mani / Admin
          </button>

          <small>Demo login για δοκιμή. Στο τελικό ERP θα το αλλάξουμε σε Supabase Auth.</small>
        </section>
      </main>
    );
  }

  return (
    <main className={`app page-${activePage}`}>
      <style>{ERP_STYLES}</style>
      <header className="top">
        <div className="brand">
          <div className="logo">TD</div>
          <div>
            <h1>T D MANI</h1>
            <p>ΟΙΚΟΔΟΜΙΚΕΣ ΕΡΓΑΣΙΕΣ</p>
          </div>
        </div>

        <div>
          <p><b>{currentUser.name}</b></p>
          <small>{currentUser.role}</small>
          <br />
          <button onClick={logoutUser}>Αποσύνδεση</button>
        </div>
      </header>

      <nav className="erp-nav">
        <button className={activePage === 'dashboard' ? 'active' : ''} onClick={() => setActivePage('dashboard')}>🏠 Dashboard</button>
        <button className={activePage === 'customers' ? 'active' : ''} onClick={() => setActivePage('customers')}>👥 Πελάτες & Έργα</button>
        <button className={activePage === 'finance' ? 'active' : ''} onClick={() => setActivePage('finance')}>💰 Finance</button>
        <button className={activePage === 'tasks' ? 'active' : ''} onClick={() => setActivePage('tasks')}>📅 Tasks</button>
        <button className={activePage === 'documents' ? 'active' : ''} onClick={() => setActivePage('documents')}>📁 Documents</button>
        <button className={activePage === 'inventory' ? 'active' : ''} onClick={() => setActivePage('inventory')}>📦 Inventory</button>
        <button className={activePage === 'settings' ? 'active' : ''} onClick={() => setActivePage('settings')}>⚙️ Settings</button>
      </nav>

      {(editingCustomerId || editingProjectId || editingPaymentId || editingExpenseId || editingInventoryId || editingQuoteId || editingTaskId || editingDocumentId) && (
        <section className="card">
          <h2>✏️ Λειτουργία επεξεργασίας</h2>
          <p>Έχεις ανοίξει μια εγγραφή για αλλαγές. Κάνε τις αλλαγές στη φόρμα και πάτα αποθήκευση.</p>
          <button onClick={cancelEdits}>Ακύρωση επεξεργασίας</button>
        </section>
      )}

      <section className="card page-section dashboard-section">
        <h2>Dashboard Analytics</h2>
        <div className="grid">
          <div className="line"><p><b>{totals.totalProjects}</b></p><small>Συνολικά Έργα</small></div>
          <div className="line"><p><b>{totals.totalBalance}€</b></p><small>Συνολικό Υπόλοιπο</small></div>
          <div className="line"><p><b>{dashboardStats.monthlyIncome}€</b></p><small>Έσοδα Μήνα</small></div>
          <div className="line"><p><b>{dashboardStats.monthlyExpenses}€</b></p><small>Έξοδα Μήνα</small></div>
          <div className={dashboardStats.monthlyProfit >= 0 ? 'line' : 'line alert'}>
            <p><b>{dashboardStats.monthlyProfit}€</b></p><small>Κέρδος Μήνα</small>
          </div>
          <div className="line"><p><b>{dashboardStats.activeProjects}</b></p><small>Active Projects</small></div>
          <div className="line"><p><b>{dashboardStats.completedProjects}</b></p><small>Completed Projects</small></div>
          <div className={dashboardStats.overdueTasks > 0 ? 'line alert' : 'line'}>
            <p><b>{dashboardStats.overdueTasks}</b></p><small>Overdue Tasks</small>
          </div>
        </div>
      </section>

      <section className="card page-section dashboard-section">
        <h2>🔔 Smart Alerts</h2>

        {riskStats.riskyProjects.length === 0 && riskStats.highBalanceProjects.length === 0 ? (
          <p>Δεν υπάρχουν alerts αυτή τη στιγμή.</p>
        ) : (
          <>
            {riskStats.riskyProjects.length > 0 && (
              <>
                <h3>⚠️ Έργα με αρνητικό υπόλοιπο</h3>
                {riskStats.riskyProjects.map((project) => (
                  <div key={project.id} className="line alert">
                    <p><b>{project.title}</b></p>
                    <p>Πελάτης: {getCustomerName(project.customer_id)}</p>
                    <p>Υπόλοιπο: {project.balance}€</p>
                  </div>
                ))}
              </>
            )}

            {riskStats.highBalanceProjects.length > 0 && (
              <>
                <h3>💰 Έργα με μεγάλο ανοιχτό υπόλοιπο</h3>
                {riskStats.highBalanceProjects.map((project) => (
                  <div key={project.id} className="line">
                    <p><b>{project.title}</b></p>
                    <p>Πελάτης: {getCustomerName(project.customer_id)}</p>
                    <p>Υπόλοιπο: {project.balance}€</p>
                  </div>
                ))}
              </>
            )}
          </>
        )}
      </section>

      <section className="card page-section settings-section">
        <h2>Συνεργεία</h2>
        {crews.map((crew) => <p key={crew.id}><b>{crew.name}</b> — {crew.specialty}</p>)}
      </section>

      <section className="card page-section tasks-section">
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

      <section className="card page-section tasks-section">
        <h2>Calendar / Tasks</h2>

        <input
          placeholder="Αναζήτηση task / έργου / status..."
          value={taskSearch}
          onChange={(e) => setTaskSearch(e.target.value)}
        />

        {tasks.length === 0 ? (
          <p>Δεν υπάρχουν tasks ακόμα.</p>
        ) : getVisibleTasks().length === 0 ? (
          <p>Δεν βρέθηκαν tasks με αυτή την αναζήτηση.</p>
        ) : (
          getVisibleTasks().map((task) => (
            <div key={task.id} className={task.status === 'completed' ? 'line' : 'line alert'}>
              <p><b>{task.title}</b></p>
              <p>Έργο: {getProjectTitle(task.project_id)}</p>
              <p>Ημερομηνία: {task.task_date} {task.task_time || ''}</p>
              <p>Status: {task.status}</p>
              <small>{task.notes}</small>
              <button onClick={() => editTask(task)}>✏️ Επεξεργασία</button>
              <button onClick={() => deleteItem('tasks', task.id)}>🗑 Διαγραφή task</button>
            </div>
          ))
        )}
      </section>

      <section className="card page-section documents-section">
        <h2>{editingDocumentId ? 'Επεξεργασία Αρχείου / Παραστατικού' : 'Νέο Αρχείο / Παραστατικό'}</h2>

        <select
          value={newDocument.customer_id}
          onChange={(e) => setNewDocument({ ...newDocument, customer_id: e.target.value, project_id: '' })}
        >
          <option value="">Διάλεξε πελάτη</option>
          {customers.map((customer) => (
            <option key={customer.id} value={customer.id}>{customer.name}</option>
          ))}
        </select>

        <select value={newDocument.project_id} onChange={(e) => setNewDocument({ ...newDocument, project_id: e.target.value })}>
          <option value="">Διάλεξε έργο πελάτη</option>
          {getFilteredProjectsByCustomer(newDocument.customer_id).map((project) => (
            <option key={project.id} value={project.id}>{project.title}</option>
          ))}
        </select>

        <input placeholder="Τίτλος αρχείου" value={newDocument.title} onChange={(e) => setNewDocument({ ...newDocument, title: e.target.value })} />

        <select value={newDocument.document_type} onChange={(e) => setNewDocument({ ...newDocument, document_type: e.target.value })}>
          <option value="Τιμολόγιο">Τιμολόγιο</option>
          <option value="Απόδειξη">Απόδειξη</option>
          <option value="Σύμβαση">Σύμβαση</option>
          <option value="Φωτογραφία έργου">Φωτογραφία έργου</option>
          <option value="Άλλο">Άλλο</option>
        </select>

        <input
          type="file"
          accept=".pdf,.jpg,.jpeg,.png,.webp"
          onChange={(e) => setDocumentFile(e.target.files?.[0] || null)}
        />

        <input
          placeholder="Ή βάλε link αρχείου / φωτογραφίας"
          value={newDocument.file_url}
          onChange={(e) => setNewDocument({ ...newDocument, file_url: e.target.value })}
        />

        <textarea placeholder="Σημειώσεις" value={newDocument.notes} onChange={(e) => setNewDocument({ ...newDocument, notes: e.target.value })} />

        <button onClick={saveDocument}>{editingDocumentId ? 'Αποθήκευση αλλαγών αρχείου' : 'Αποθήκευση αρχείου'}</button>
      </section>

      <section className="card page-section customers-section">
        <h2>{editingCustomerId ? 'Επεξεργασία Πελάτη' : 'Νέος Πελάτης'}</h2>
        <input placeholder="Όνομα πελάτη" value={newCustomer.name} onChange={(e) => setNewCustomer({ ...newCustomer, name: e.target.value })} />
        <input placeholder="Τηλέφωνο" value={newCustomer.phone} onChange={(e) => setNewCustomer({ ...newCustomer, phone: e.target.value })} />
        <input placeholder="Περιοχή" value={newCustomer.area} onChange={(e) => setNewCustomer({ ...newCustomer, area: e.target.value })} />
        <textarea placeholder="Σημειώσεις" value={newCustomer.notes} onChange={(e) => setNewCustomer({ ...newCustomer, notes: e.target.value })} />
        <button onClick={saveCustomer}>{editingCustomerId ? 'Αποθήκευση αλλαγών πελάτη' : 'Αποθήκευση πελάτη'}</button>
      </section>

      <section className="card page-section customers-section">
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

      <section className="card page-section finance-section">
        <h2>{editingPaymentId ? 'Επεξεργασία Πληρωμής' : 'Νέα Πληρωμή'}</h2>
        <select
          value={newPayment.customer_id}
          onChange={(e) => setNewPayment({ ...newPayment, customer_id: e.target.value, project_id: '' })}
        >
          <option value="">Διάλεξε πελάτη</option>
          {customers.map((customer) => (
            <option key={customer.id} value={customer.id}>{customer.name}</option>
          ))}
        </select>

        <select value={newPayment.project_id} onChange={(e) => setNewPayment({ ...newPayment, project_id: e.target.value })}>
          <option value="">Διάλεξε έργο πελάτη</option>
          {getFilteredProjectsByCustomer(newPayment.customer_id).map((project) => (
            <option key={project.id} value={project.id}>{project.title}</option>
          ))}
        </select>

        <input placeholder="Ποσό πληρωμής" value={newPayment.amount} onChange={(e) => setNewPayment({ ...newPayment, amount: e.target.value })} />

        <input
          type="date"
          value={newPayment.payment_date}
          onChange={(e) => setNewPayment({ ...newPayment, payment_date: e.target.value })}
        />

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

      <section className="card page-section finance-section">
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

      <section className="card page-section finance-section">
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
        <section className="card print-area page-section finance-section">
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

      {selectedCustomerReport && (
        <section className="card print-area page-section customers-section">
          <div className="pdf-header">
            <div className="logo pdf-logo">TD</div>
            <div>
              <h2>TD MANI</h2>
              <p><b>ΑΝΑΦΟΡΑ ΠΕΛΑΤΗ</b></p>
              <small>Πλάκες, Μήλος 84800 | 6944705508 | Manitaulant@yahoo.com</small>
            </div>
          </div>

          <hr />

          <h2>{selectedCustomerReport.name}</h2>
          <p><b>Τηλέφωνο:</b> {selectedCustomerReport.phone || '-'}</p>
          <p><b>Περιοχή:</b> {selectedCustomerReport.area || '-'}</p>
          <p><b>Σημειώσεις:</b> {selectedCustomerReport.notes || '-'}</p>

          <hr />

          <h3>Σύνολα πελάτη</h3>
          <p>Συμφωνημένα: {getCustomerTotals(selectedCustomerReport.id).agreed}€</p>
          <p>Πληρωμένα: {getCustomerTotals(selectedCustomerReport.id).paid}€</p>
          <p>Έξοδα: {getCustomerTotals(selectedCustomerReport.id).expenses}€</p>
          <p><b>Καθαρό υπόλοιπο: {getCustomerTotals(selectedCustomerReport.id).balance}€</b></p>

          <hr />

          <h3>Έργα πελάτη</h3>
          {getCustomerReportRows(selectedCustomerReport.id).length === 0 ? (
            <p>Δεν υπάρχουν έργα για αυτόν τον πελάτη.</p>
          ) : (
            getCustomerReportRows(selectedCustomerReport.id).map((row) => (
              <div key={row.project.id} className="report-block">
                <h3>{row.project.title}</h3>
                <p><b>Περιοχή:</b> {row.project.area || '-'}</p>
                <p><b>Διεύθυνση:</b> {row.project.address || '-'}</p>
                <p><b>Status:</b> {row.project.status}</p>
                <p>Συμφωνία: {row.agreed}€</p>
                <p>Πληρωμές: {row.paid}€</p>
                <p>Έξοδα: {row.expenses}€</p>
                <p><b>Καθαρό υπόλοιπο έργου: {row.balance}€</b></p>

                <h4>Πληρωμές</h4>
                {row.payments.length === 0 ? (
                  <p>Δεν υπάρχουν πληρωμές.</p>
                ) : (
                  row.payments.map((payment) => (
                    <p key={payment.id}>• {payment.payment_date || '-'} — {payment.amount}€ — {payment.method} {payment.notes ? `(${payment.notes})` : ''}</p>
                  ))
                )}

                <h4>Έξοδα</h4>
                {row.projectExpensesList.length === 0 ? (
                  <p>Δεν υπάρχουν έξοδα.</p>
                ) : (
                  row.projectExpensesList.map((expense) => (
                    <p key={expense.id}>• {expense.title} — {expense.amount}€ — {expense.category}</p>
                  ))
                )}

                <h4>Προσφορές</h4>
                {row.projectQuotes.length === 0 ? (
                  <p>Δεν υπάρχουν προσφορές.</p>
                ) : (
                  row.projectQuotes.map((quote) => (
                    <p key={quote.id}>• {quote.quote_number} — {quote.work_type} — {quote.payable}€ — {quote.status}</p>
                  ))
                )}

                <h4>Tasks</h4>
                {row.projectTasks.length === 0 ? (
                  <p>Δεν υπάρχουν tasks.</p>
                ) : (
                  row.projectTasks.map((task) => (
                    <p key={task.id}>• {task.task_date} {task.task_time || ''} — {task.title} — {task.status}</p>
                  ))
                )}

                <h4>Αρχεία / Παραστατικά</h4>
                {row.projectDocuments.length === 0 ? (
                  <p>Δεν υπάρχουν αρχεία.</p>
                ) : (
                  row.projectDocuments.map((document) => (
                    <p key={document.id}>• {document.document_type} — {document.title}</p>
                  ))
                )}

                <hr />
              </div>
            ))
          )}

          <p><b>Υπογραφή / Σφραγίδα</b></p>
          <p className="signature-line">T D MANI</p>

          <button onClick={() => window.print()}>Export / Print PDF</button>
          <button onClick={() => setSelectedCustomerReport(null)}>Κλείσιμο αναφοράς</button>
        </section>
      )}

      <section className="card page-section finance-section">
        <h2>{editingExpenseId ? 'Επεξεργασία Εξόδου' : 'Νέο Έξοδο'}</h2>
        <select
          value={newExpense.customer_id}
          onChange={(e) => setNewExpense({ ...newExpense, customer_id: e.target.value, project_id: '' })}
        >
          <option value="">Διάλεξε πελάτη</option>
          {customers.map((customer) => (
            <option key={customer.id} value={customer.id}>{customer.name}</option>
          ))}
        </select>

        <select value={newExpense.project_id} onChange={(e) => setNewExpense({ ...newExpense, project_id: e.target.value })}>
          <option value="">Διάλεξε έργο πελάτη</option>
          {getFilteredProjectsByCustomer(newExpense.customer_id).map((project) => (
            <option key={project.id} value={project.id}>{project.title}</option>
          ))}
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

      <section className="card page-section inventory-section">
        <h2>{editingInventoryId ? 'Επεξεργασία Υλικού' : 'Νέο Υλικό'}</h2>
        <input placeholder="Υλικό" value={newInventory.item_name} onChange={(e) => setNewInventory({ ...newInventory, item_name: e.target.value })} />
        <input placeholder="Ποσότητα" value={newInventory.quantity} onChange={(e) => setNewInventory({ ...newInventory, quantity: e.target.value })} />
        <input placeholder="Ελάχιστο απόθεμα" value={newInventory.min_quantity} onChange={(e) => setNewInventory({ ...newInventory, min_quantity: e.target.value })} />
        <input placeholder="Τιμή αγοράς" value={newInventory.purchase_price} onChange={(e) => setNewInventory({ ...newInventory, purchase_price: e.target.value })} />
        <button onClick={saveInventory}>{editingInventoryId ? 'Αποθήκευση αλλαγών υλικού' : 'Αποθήκευση υλικού'}</button>
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

        {customers.length === 0 ? (
          <p>Δεν υπάρχουν πελάτες ακόμα.</p>
        ) : customers.filter(customerMatchesSearch).length === 0 ? (
          <p>Δεν βρέθηκαν πελάτες ή έργα με αυτή την αναζήτηση.</p>
        ) : (
          customers.filter(customerMatchesSearch).map((customer) => {
            const customerProjects = getVisibleCustomerProjects(customer.id);
            const customerTotals = getCustomerTotals(customer.id);
            const isOpen = openCustomerId === customer.id;

            return (
              <div key={customer.id} className="line">
                <div onClick={() => setOpenCustomerId(isOpen ? null : customer.id)}>
                  <p><b>{isOpen ? '▼' : '▶'} {customer.name}</b></p>
                  <p>{customer.phone}</p>
                  <p>{customer.area}</p>
                  <small>{customer.notes}</small>
                  <p>Έργα: {getCustomerProjects(customer.id).length}</p>
                  <p>Συμφωνημένα: {customerTotals.agreed}€</p>
                  <p>Πληρωμένα: {customerTotals.paid}€</p>
                  <p>Έξοδα: {customerTotals.expenses}€</p>
                  <p><b>Καθαρό υπόλοιπο: {customerTotals.balance}€</b></p>
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
                        const balance = agreed - paid - projectExpenses;

                        return (
                          <div key={project.id} className="line">
                            <p><b>{project.title}</b></p>
                            <p>{project.area}</p>
                            <p>Status: {project.status}</p>
                            <p>Συμφωνία: {agreed}€</p>
                            <p>Πληρώθηκε: {paid}€</p>
                            <p>Έξοδα: {projectExpenses}€</p>
                            <p><b>Καθαρό υπόλοιπο: {balance}€</b></p>

                            <button onClick={() => setSelectedProject(project)}>👁 Προβολή ανάλυσης</button>
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
          <p><b>Καθαρό υπόλοιπο: {
            Number(selectedProject.agreed_amount || 0)
            - getProjectPaid(selectedProject.id)
            - getProjectExpenses(selectedProject.id)
          }€</b></p>

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

          <h3>Tasks έργου</h3>
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

      <section className="card page-section documents-section">
        <h2>Αρχεία / Παραστατικά</h2>
        {documents.length === 0 ? (
          <p>Δεν υπάρχουν αρχεία ακόμα.</p>
        ) : (
          documents.map((document) => (
            <div key={document.id} className="line">
              <p><b>{document.title}</b></p>
              <p>Έργο: {getProjectTitle(document.project_id)}</p>
              <p>Τύπος: {document.document_type}</p>
              {document.file_url && (
                <p><a href={document.file_url} target="_blank">Άνοιγμα αρχείου</a></p>
              )}
              <small>{document.notes}</small>
              <button onClick={() => editDocument(document)}>✏️ Επεξεργασία</button>
              <button onClick={() => deleteItem('documents', document.id)}>🗑 Διαγραφή αρχείου</button>
            </div>
          ))
        )}
      </section>

      <section className="card page-section inventory-section">
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

      <section className="card page-section finance-section">
        <h2 onClick={() => setShowPayments(!showPayments)}>
          💰 Πληρωμές {showPayments ? '▲' : '▼'}
        </h2>

        {showPayments && (
          <>
            {payments.length === 0 ? (
              <p>Δεν υπάρχουν πληρωμές ακόμα.</p>
            ) : (
              payments.map((payment) => (
                <div key={payment.id} className="line">
                  <p><b>{payment.amount}€</b> — {payment.method}</p>
                  <p>Έργο: {getProjectTitle(payment.project_id)}</p>
                  <p>Ημερομηνία: {payment.payment_date || '-'}</p>
                  <small>{payment.notes}</small>
                  <button onClick={() => editPayment(payment)}>✏️ Επεξεργασία</button>
                  <button onClick={() => deleteItem('payments', payment.id)}>🗑 Διαγραφή πληρωμής</button>
                </div>
              ))
            )}
          </>
        )}
      </section>
    </main>
  );
}
