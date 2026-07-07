export const INITIAL_CUSTOMER = {
  name: '',
  afm: '',
  phone: '',
  area: '',
  notes: ''
};

export const INITIAL_PROJECT = {
  customer_id: '',
  title: '',
  address: '',
  area: '',
  agreed_amount: '',
  status: 'active'
};

export const INITIAL_PAYMENT = {
  customer_id: '',
  project_id: '',
  customer_invoice_id: '',
  amount: '',
  payment_date: '',
  method: 'Μετρητά',
  notes: ''
};

export const INITIAL_EXPENSE = {
  customer_id: '',
  project_id: '',
  title: '',
  amount: '',
  category: 'Υλικά',
  notes: ''
};

export const INITIAL_INVENTORY = {
  item_name: '',
  quantity: '',
  min_quantity: '',
  purchase_price: ''
};

export const INITIAL_QUOTE = {
  project_id: '',
  work_type: '',
  description: '',
  subtotal: '',
  job_type: 'invoice',
  status: 'pending'
};

export const INITIAL_TASK = {
  project_id: '',
  title: '',
  task_date: '',
  task_time: '',
  status: 'pending',
  notes: ''
};

export const INITIAL_DOCUMENT = {
  customer_id: '',
  project_id: '',
  title: '',
  document_type: 'Τιμολόγιο',
  file_url: '',
  notes: ''
};

export const INITIAL_CUSTOMER_INVOICE = {
  customer_id: '',
  project_id: '',
  invoice_date: '',
  invoice_number: '',
  description: '',
  net_amount: '',
  is_paid_on_issue: 'no',
  payment_date: '',
  payment_method: 'Τράπεζα',
  notes: ''
};

export const INITIAL_SUPPLIER = {
  name: '',
  afm: '',
  phone: '',
  email: '',
  address: '',
  notes: ''
};

export const INITIAL_SUPPLIER_INVOICE = {
  supplier_id: '',
  project_id: '',
  expense_category: '',
  invoice_date: '',
  invoice_number: '',
  description: '',
  net_amount: '',
  vat_amount: '',
  total_amount: '',
  notes: ''
};

export const INITIAL_SUPPLIER_PAYMENT = {
  supplier_id: '',
  supplier_invoice_id: '',
  payment_date: '',
  amount: '',
  method: 'Τράπεζα',
  notes: ''
};

export const DEMO_USERS = [
  {
    email: 'eva@tdmani.gr',
    password: '1234',
    name: 'Εύα Νίνου',
    role: 'Admin'
  },
  {
    email: 'mani@tdmani.gr',
    password: '1234',
    name: 'Mani Taulant',
    role: 'Admin'
  }
];
