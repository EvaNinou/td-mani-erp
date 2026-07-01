'use client';

import { useState, useEffect } from 'react';
import { supabase } from './supabaseClient.js';
import './styles.css';

export default function Home() {
  const [selectedUser, setSelectedUser] = useState('Mani Taulant');
  const [crews, setCrews] = useState([]);
  const [customers, setCustomers] = useState([]);

  const [newCustomer, setNewCustomer] = useState({
    name: '',
    phone: '',
    area: '',
    notes: ''
  });

  useEffect(() => {
    loadCrews();
    loadCustomers();
  }, []);

  async function loadCrews() {
    const { data } = await supabase.from('crews').select('*');
    setCrews(data || []);
  }

  async function loadCustomers() {
    const { data } = await supabase
      .from('customers')
      .select('*')
      .order('created_at', { ascending: false });

    setCustomers(data || []);
  }

  async function addCustomer() {
    if (!newCustomer.name) {
      alert('Βάλε όνομα πελάτη');
      return;
    }

    await supabase.from('customers').insert([newCustomer]);

    setNewCustomer({
      name: '',
      phone: '',
      area: '',
      notes: ''
    });

    loadCustomers();
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
        <h2>Συνεργεία από Supabase</h2>
        {crews.map((crew) => (
          <p key={crew.id}><b>{crew.name}</b> — {crew.specialty}</p>
        ))}
      </section>

      <section className="card">
        <h2>Νέος Πελάτης</h2>

        <input
          placeholder="Όνομα πελάτη"
          value={newCustomer.name}
          onChange={(e) => setNewCustomer({ ...newCustomer, name: e.target.value })}
        />

        <input
          placeholder="Τηλέφωνο"
          value={newCustomer.phone}
          onChange={(e) => setNewCustomer({ ...newCustomer, phone: e.target.value })}
        />

        <input
          placeholder="Περιοχή"
          value={newCustomer.area}
          onChange={(e) => setNewCustomer({ ...newCustomer, area: e.target.value })}
        />

        <textarea
          placeholder="Σημειώσεις"
          value={newCustomer.notes}
          onChange={(e) => setNewCustomer({ ...newCustomer, notes: e.target.value })}
        />

        <button onClick={addCustomer}>Αποθήκευση πελάτη</button>
      </section>

      <section className="card">
        <h2>Πελάτες</h2>

        {customers.length === 0 ? (
          <p>Δεν υπάρχουν πελάτες ακόμα.</p>
        ) : (
          customers.map((customer) => (
            <div key={customer.id} className="line">
              <p><b>{customer.name}</b></p>
              <p>{customer.phone}</p>
              <p>{customer.area}</p>
              <small>{customer.notes}</small>
            </div>
          ))
        )}
      </section>
    </main>
  );
}
