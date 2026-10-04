'use client';

import { useEffect, useMemo, useState } from 'react';

function toApiDate(value) {
  if (!value) return '';
  const [year, month, day] = value.split('-');
  return `${day}/${month}/${year}`;
}

function todayInput() {
  const d = new Date();
  const year = d.getFullYear();
  const month = String(d.getMonth() + 1).padStart(2, '0');
  const day = String(d.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
}

function firstDayOfMonthInput() {
  const d = new Date();
  const year = d.getFullYear();
  const month = String(d.getMonth() + 1).padStart(2, '0');
  return `${year}-${month}-01`;
}

function money(value) {
  const number = Number(value || 0);

  return new Intl.NumberFormat('el-GR', {
    style: 'currency',
    currency: 'EUR',
  }).format(number);
}

function getText(parent, tagName) {
  if (!parent) return '';
  const element = parent.getElementsByTagName(tagName)[0];
  return element?.textContent?.trim() || '';
}

export default function MyDataStudio() {
  const [dateFrom, setDateFrom] = useState(firstDayOfMonthInput());
  const [dateTo, setDateTo] = useState(todayInput());

  const [documents, setDocuments] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [lastUpdate, setLastUpdate] = useState(null);
  const [search, setSearch] = useState('');

  async function loadExpenses() {
    try {
      setLoading(true);
      setError('');

      const from = toApiDate(dateFrom);
      const to = toApiDate(dateTo);

      const response = await fetch(
        `/api/mydata/expenses?dateFrom=${encodeURIComponent(from)}&dateTo=${encodeURIComponent(to)}`,
        {
          method: 'GET',
          cache: 'no-store',
        }
      );

      const body = await response.text();

      if (!response.ok) {
        let message = 'Αποτυχία λήψης δεδομένων από το myDATA.';

        try {
          const json = JSON.parse(body);
          if (json?.error) message = json.error;
        } catch {
          // Η απάντηση δεν ήταν JSON.
        }

        throw new Error(message);
      }

      const parser = new DOMParser();
      const xml = parser.parseFromString(body, 'application/xml');

      if (xml.querySelector('parsererror')) {
        throw new Error('Η απάντηση της ΑΑΔΕ δεν μπόρεσε να διαβαστεί.');
      }

      const bookInfos = Array.from(xml.getElementsByTagName('bookInfo'));

      const parsedDocuments = bookInfos.map((bookInfo, index) => {
        const counterVatNumber = getText(bookInfo, 'counterVatNumber');
        const issueDate = getText(bookInfo, 'issueDate');
        const invType = getText(bookInfo, 'invType');
        const netValue = Number(getText(bookInfo, 'netValue') || 0);
        const vatAmount = Number(getText(bookInfo, 'vatAmount') || 0);
        const withheldAmount = Number(
          getText(bookInfo, 'withheldAmount') || 0
        );
        const otherTaxesAmount = Number(
          getText(bookInfo, 'otherTaxesAmount') || 0
        );
        const stampDutyAmount = Number(
          getText(bookInfo, 'stampDutyAmount') || 0
        );
        const feesAmount = Number(getText(bookInfo, 'feesAmount') || 0);
        const deductionsAmount = Number(
          getText(bookInfo, 'deductionsAmount') || 0
        );
        const thirdPartyAmount = Number(
          getText(bookInfo, 'thirdPartyAmount') || 0
        );
        const grossValue = Number(getText(bookInfo, 'grossValue') || 0);
        const count = getText(bookInfo, 'count');
        const minMark = getText(bookInfo, 'minMark');
        const maxMark = getText(bookInfo, 'maxMark');

        return {
          id: `${minMark || maxMark || index}-${counterVatNumber}-${issueDate}`,
          counterVatNumber,
          issueDate,
          invType,
          netValue,
          vatAmount,
          withheldAmount,
          otherTaxesAmount,
          stampDutyAmount,
          feesAmount,
          deductionsAmount,
          thirdPartyAmount,
          grossValue,
          count,
          minMark,
          maxMark,
        };
      });

      parsedDocuments.sort((a, b) =>
        String(b.issueDate).localeCompare(String(a.issueDate))
      );

      setDocuments(parsedDocuments);
      setLastUpdate(new Date());
    } catch (err) {
      console.error('myDATA:', err);
      setDocuments([]);
      setError(err?.message || 'Παρουσιάστηκε άγνωστο σφάλμα.');
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    loadExpenses();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const visibleDocuments = useMemo(() => {
    const q = search.trim().toLowerCase();

    if (!q) return documents;

    return documents.filter((doc) => {
      return [
        doc.counterVatNumber,
        doc.issueDate,
        doc.invType,
        doc.minMark,
        doc.maxMark,
      ]
        .join(' ')
        .toLowerCase()
        .includes(q);
    });
  }, [documents, search]);

  const totals = useMemo(() => {
    return visibleDocuments.reduce(
      (sum, doc) => {
        sum.net += Number(doc.netValue || 0);
        sum.vat += Number(doc.vatAmount || 0);
        sum.gross += Number(doc.grossValue || 0);
        return sum;
      },
      {
        net: 0,
        vat: 0,
        gross: 0,
      }
    );
  }, [visibleDocuments]);

  return (
    <section className="card page-section">
      <div
        style={{
          display: 'flex',
          justifyContent: 'space-between',
          gap: '16px',
          alignItems: 'flex-start',
          flexWrap: 'wrap',
        }}
      >
        <div>
          <h2>🔄 myDATA — Έξοδα</h2>
          <p>
            Παραστατικά εξόδων που λαμβάνονται απευθείας από την ΑΑΔΕ.
          </p>
        </div>

        <div>
          <small>
            {lastUpdate
              ? `Τελευταία ενημέρωση: ${lastUpdate.toLocaleString('el-GR')}`
              : 'Δεν έχει γίνει ενημέρωση ακόμη'}
          </small>
        </div>
      </div>

      <div className="grid">
        <label>
          Από
          <input
            type="date"
            value={dateFrom}
            onChange={(e) => setDateFrom(e.target.value)}
          />
        </label>

        <label>
          Έως
          <input
            type="date"
            value={dateTo}
            onChange={(e) => setDateTo(e.target.value)}
          />
        </label>

        <div>
          <button onClick={loadExpenses} disabled={loading}>
            {loading ? 'Γίνεται σύνδεση...' : '🔄 Λήψη από myDATA'}
          </button>
        </div>
      </div>

      {error && (
        <div className="line alert">
          <p>
            <b>⚠️ {error}</b>
          </p>
        </div>
      )}

      {!error && (
        <>
          <div className="grid">
            <div className="line">
              <p>
                <b>{visibleDocuments.length}</b>
              </p>
              <small>Παραστατικά</small>
            </div>

            <div className="line">
              <p>
                <b>{money(totals.net)}</b>
              </p>
              <small>Καθαρή αξία</small>
            </div>

            <div className="line">
              <p>
                <b>{money(totals.vat)}</b>
              </p>
              <small>ΦΠΑ</small>
            </div>

            <div className="line">
              <p>
                <b>{money(totals.gross)}</b>
              </p>
              <small>Συνολική αξία</small>
            </div>
          </div>

          <input
            placeholder="Αναζήτηση με ΑΦΜ, ημερομηνία, τύπο ή MARK..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />

          {loading ? (
            <p>Γίνεται λήψη των παραστατικών από την ΑΑΔΕ...</p>
          ) : visibleDocuments.length === 0 ? (
            <p>Δεν βρέθηκαν παραστατικά για αυτή την περίοδο.</p>
          ) : (
            <div style={{ overflowX: 'auto', marginTop: '16px' }}>
              <table
                style={{
                  width: '100%',
                  borderCollapse: 'collapse',
                  minWidth: '900px',
                }}
              >
                <thead>
                  <tr>
                    <th>Ημερομηνία</th>
                    <th>ΑΦΜ Προμηθευτή</th>
                    <th>Τύπος</th>
                    <th>Πλήθος</th>
                    <th>Καθαρή Αξία</th>
                    <th>ΦΠΑ</th>
                    <th>Σύνολο</th>
                    <th>MARK</th>
                  </tr>
                </thead>

                <tbody>
                  {visibleDocuments.map((doc) => (
                    <tr key={doc.id}>
                      <td>{doc.issueDate || '-'}</td>
                      <td>
                        <b>{doc.counterVatNumber || '-'}</b>
                      </td>
                      <td>{doc.invType || '-'}</td>
                      <td>{doc.count || '1'}</td>
                      <td>{money(doc.netValue)}</td>
                      <td>{money(doc.vatAmount)}</td>
                      <td>
                        <b>{money(doc.grossValue)}</b>
                      </td>
                      <td>
                        <small>{doc.minMark || doc.maxMark || '-'}</small>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </>
      )}
    </section>
  );
}
