'use client';

import { useState, useEffect } from 'react';
import { supabase } from './supabaseClient.js';
import './styles.css';

export default function Home() {
  const [selectedUser, setSelectedUser] = useState('Mani Taulant');
  const [crews, setCrews] = useState([]);
  const [customers, setCustomers] = useState([]);
  const [projects, setProjects] = useState([]);
  const [payments, setPayments] = useState([]);
  const [inventory, setInventory] = useState([]);

  const [newCustomer, setNewCustomer] = useState({
    name: '',
    phone: '',
    area: '',
    notes: ''
  });

  const [newProject, setNewProject] = useState({
    title: '',
    address: '',
    area: '',
    agreed_amount: '',
    status: 'active'
  });

  const [newPayment, setNewPayment] = useState({
    project_id: '',
    amount: '',
    method: 'Μετρητά',
    notes: ''
  });

  const [newInventory, setNewInventory] = useState({
    item_name: '',
    quantity: '',
    min_quantity: '',
    purchase_price: ''
  });

  useEffect(() => {
    loadCrews();
    loadCustomers();
    loadProjects();
    loadPayments();
    loadInventory();
  }, []);

  async function loadCrews() {
    const { data } = await supabase.from('crews').select('*');
    setCrews(data || []);
  }

  async function loadCustomers() {
    const { data } = await supabase.from('customers').select('*');
    setCustomers(data || []);
  }

  async function loadProjects() {
    const { data } = await supabase.from('projects').select('*');
    setProjects(data || []);
  }

  async function loadPayments() {
    const { data } = await supabase.from('payments').select('*');
    setPayments(data || []);
  }

  async function loadInventory() {
    const { data } = await supabase.from('inventory').select('*');
    setInventory(data || []);
  }

  async function addCustomer() {
    await supabase.from('customers').insert([newCustomer]);
    setNewCustomer({ name: '', phone: '', area: '', notes: '' });
    loadCustomers();
  }

  async function addProject() {
    await supabase.from('projects').insert([{
      code: 'PRJ-' + Date.now(),
      title: newProject.title,
      address: newProject.address,
      area: newProject.area,
      agreed_amount: Number(newProject.agreed_amount || 0),
      status: newProject.status,
      job_type: 'invoice'
    }]);

    setNewProject({
      title: '',
      address: '',
      area: '',
      agreed_amount: '',
      status: 'active'
    });

    loadProjects();
  }
async function addPayment() {
    await supabase.from('payments').insert([{
      project_id: newPayment.project_id,
      amount: Number(newPayment.amount),
      method: newPayment.method,
      payment_type: 'income',
      notes: newPayment.notes
    }]);

    setNewPayment({
      project_id: '',
      amount: '',
      method: 'Μετρητά',
      notes: ''
    });

    loadPayments();
  }

  async function addInventory() {
    await supabase.from('inventory').insert([{
      item_name: newInventory.item_name,
      quantity: Number(newInventory.quantity || 0),
      min_quantity: Number(newInventory.min_quantity || 0),
      purchase_price: Number(newInventory.purchase_price || 0)
    }]);

    setNewInventory({
      item_name: '',
      quantity: '',
      min_quantity: '',
      purchase_price: ''
    });

    loadInventory();
  }

  function getProjectPaid(projectId) {
    return payments
      .filter((p) => p.project_id === projectId)
      .reduce((sum, p) => sum + Number(p.amount || 0), 0);
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
        <button onClick={addProject}>Αποθήκευση έργου</button>
      </section>

      <section className="card">
        <h2>Νέα Πληρωμή</h2>
        <select value={newPayment.project_id} onChange={(e) => setNewPayment({ ...newPayment, project_id: e.target.value })}>
          <option value="">Διάλεξε έργο</option>
          {projects.map((project) => (
            <option key={project.id} value={project.id}>{project.title}</option>
          ))}
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
        <h2>Νέο Υλικό</h2>
        <input placeholder="Υλικό" value={newInventory.item_name} onChange={(e) => setNewInventory({ ...newInventory, item_name: e.target.value })} />
        <input placeholder="Ποσότητα" value={newInventory.quantity} onChange={(e) => setNewInventory({ ...newInventory, quantity: e.target.value })} />
        <input placeholder="Ελάχιστο απόθεμα" value={newInventory.min_quantity} onChange={(e) => setNewInventory({ ...newInventory, min_quantity: e.target.value })} />
        <input placeholder="Τιμή αγοράς" value={newInventory.purchase_price} onChange={(e) => setNewInventory({ ...newInventory, purchase_price: e.target.value })} />
        <button onClick={addInventory}>Αποθήκευση υλικού</button>
      </section>

      <section className="card">
        <h2>Πελάτες</h2>
        {customers.map((customer) => (
          <div key={customer.id} className="line">
            <p><b>{customer.name}</b></p>
            <p>{customer.phone}</p>
            <p>{customer.area}</p>
            <small>{customer.notes}</small>
          </div>
        ))}
      </section>

      <section className="card">
        <h2>Έργα</h2>
        {projects.map((project) => {
          const paid = getProjectPaid(project.id);
          const agreed = Number(project.agreed_amount || 0);
          const balance = agreed - paid;

          return (
            <div key={project.id} className="line">
              <p><b>{project.title}</b></p>
              <p>{project.area}</p>
              <p>Status: {project.status}</p>
              <p>Συμφωνία: {agreed}€</p>
              <p>Πληρώθηκε: {paid}€</p>
              <p><b>Υπόλοιπο: {balance}€</b></p>
            </div>
          );
        })}
      </section>

      <section className="card">
        <h2>Αποθήκη</h2>
        {inventory.map((item) => {
          const lowStock = Number(item.quantity  0) <= Number(item.min_quantity  0);

          return (
            <div key={item.id} className="line">
              <p><b>{item.item_name}</b></p>
              <p>Ποσότητα: {item.quantity}</p>
              <p>Ελάχιστο: {item.min_quantity}</p>
              <p>Τιμή αγοράς: {item.purchase_price}€</p>
              {lowStock && <p><b>⚠️ Χαμηλό απόθεμα</b></p>}
            </div>
          );
        })}
      </section>

      <section className="card">
        <h2>Πληρωμές</h2>
        {payments.map((payment) => (
          <div key={payment.id} className="line">
            <p><b>{payment.amount}€</b> — {payment.method}</p>
            <small>{payment.notes}</small>
          </div>
        ))}
      </section>
    </main>
  );
}
