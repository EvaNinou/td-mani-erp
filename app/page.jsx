'use client';

import { useState } from 'react';
import './styles.css';

export default function Home() {
  const [selectedUser, setSelectedUser] = useState('Mani Taulant');

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

      <section className="grid">
        <div className="card"><b>42.500€</b><span>Έσοδα</span></div>
        <div className="card"><b>18.200€</b><span>Κέρδος</span></div>
        <div className="card"><b>8</b><span>Alerts</span></div>
        <div className="card"><b>14</b><span>Έργα</span></div>
      </section>

      <section className="card">
        <h2>Production Starter</h2>
        <p>Το UI είναι έτοιμο να συνδεθεί με Supabase database.</p>
      </section>
    </main>
  );
}
