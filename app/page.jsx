'use client';

import { useState, useEffect } from 'react';
import { supabase } from './supabaseClient';
import './styles.css';

export default function Home() {
  const [selectedUser, setSelectedUser] = useState('Mani Taulant');
  const [crews, setCrews] = useState([]);

  useEffect(() => {
    loadCrews();
  }, []);

  async function loadCrews() {
    const { data, error } = await supabase
      .from('crews')
      .select('*');

    if (error) {
      console.log(error);
      return;
    }

    setCrews(data || []);
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
        <button onClick={() => setSelectedUser('Mani Taulant')}>
          👷 Mani Taulant
        </button>
        <button onClick={() => setSelectedUser('Εύα Νίνου')}>
          👩 Εύα Νίνου
        </button>

        <p>
          Επιλεγμένος χρήστης: <b>{selectedUser}</b>
        </p>
      </section>

      <section className="card">
        <h2>Συνεργεία από Supabase</h2>

        {crews.length === 0 ? (
          <p>Loading crews...</p>
        ) : (
          crews.map((crew) => (
            <div key={crew.id}>
              <p>
                <b>{crew.name}</b> — {crew.specialty}
              </p>
            </div>
          ))
        )}
      </section>
    </main>
  );
}
