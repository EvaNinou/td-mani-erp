'use client';

import { useMemo, useState } from 'react';

const emptyLine = () => ({ description: '', quantity: '1', unitPrice: '' });
const today = () => new Date().toISOString().slice(0, 10);
const plusDays = (date, days) => {
  const d = new Date(`${date || today()}T12:00:00`);
  d.setDate(d.getDate() + days);
  return d.toISOString().slice(0, 10);
};
const euro = (value) => new Intl.NumberFormat('el-GR', { style: 'currency', currency: 'EUR' }).format(Number(value || 0));
const greekDate = (value) => value ? new Date(`${value}T12:00:00`).toLocaleDateString('el-GR') : '-';

export default function QuotesStudio({ customers = [], projects = [], quotes = [], supabase, onSaved }) {
  const [customerId, setCustomerId] = useState('');
  const [projectId, setProjectId] = useState('');
  const [title, setTitle] = useState('Οικοδομικές εργασίες');
  const [description, setDescription] = useState('');
  const [quoteDate, setQuoteDate] = useState(today());
  const [validUntil, setValidUntil] = useState(plusDays(today(), 30));
  const [lines, setLines] = useState([emptyLine()]);
  const [vatEnabled, setVatEnabled] = useState(true);
  const [withholdingEnabled, setWithholdingEnabled] = useState(true);
  const [notes, setNotes] = useState('Η προσφορά ισχύει για 30 ημέρες.\nΠεριλαμβάνονται υλικά και εργασία.\nΟποιαδήποτε επιπλέον εργασία θα κοστολογείται ξεχωριστά.');
  const [preview, setPreview] = useState(false);
  const [saving, setSaving] = useState(false);

  const customer = customers.find((x) => String(x.id) === String(customerId));
  const project = projects.find((x) => String(x.id) === String(projectId));
  const customerProjects = projects.filter((x) => !x.is_deleted && (!customerId || String(x.customer_id) === String(customerId)));
  const quoteNumber = useMemo(() => `ΠΡ-${new Date().getFullYear()}-${String((quotes?.length || 0) + 1).padStart(3, '0')}`, [quotes]);
  const subtotal = lines.reduce((sum, line) => sum + Number(line.quantity || 0) * Number(line.unitPrice || 0), 0);
  const vat = vatEnabled ? subtotal * 0.24 : 0;
  const withholding = withholdingEnabled ? subtotal * 0.03 : 0;
  const total = subtotal + vat - withholding;

  const updateLine = (index, key, value) => setLines(lines.map((line, i) => i === index ? { ...line, [key]: value } : line));
  const removeLine = (index) => setLines(lines.filter((_, i) => i !== index));

  function exportQuotePdf() {
    const quote = document.querySelector('.td-quote-pdf');
    if (!quote) return;

    const printWindow = window.open('', '_blank', 'width=900,height=1200');
    if (!printWindow) {
      alert('Επίτρεψε τα αναδυόμενα παράθυρα για να γίνει η εξαγωγή PDF.');
      return;
    }

    const styles = Array.from(document.querySelectorAll('style, link[rel="stylesheet"]'))
      .map((node) => node.outerHTML)
      .join('\n');

    printWindow.document.open();
    printWindow.document.write(`<!doctype html>
<html lang="el">
<head>
<meta charset="utf-8" />
<title>${quoteNumber}</title>
${styles}
<style>
  @page { size: A4 portrait; margin: 8mm; }
  html, body {
    margin: 0 !important;
    padding: 0 !important;
    background: #fff !important;
  }
  body { -webkit-print-color-adjust: exact !important; print-color-adjust: exact !important; }
  .td-quote-pdf {
    display: block !important;
    box-sizing: border-box !important;
    width: 194mm !important;
    max-width: 194mm !important;
    min-height: 0 !important;
    margin: 0 auto !important;
    box-shadow: none !important;
    border-radius: 0 !important;
    overflow: visible !important;
    page-break-inside: avoid !important;
    break-inside: avoid-page !important;
  }
  .td-quote-pdf-header,
  .td-quote-parties,
  .td-quote-description,
  .td-quote-summary,
  .td-quote-notes,
  .td-quote-footer,
  .td-quote-table tr {
    break-inside: avoid !important;
    page-break-inside: avoid !important;
  }
  .no-print, .quote-preview-actions { display: none !important; }
</style>
</head>
<body>${quote.outerHTML}</body>
</html>`);
    printWindow.document.close();

    const doPrint = () => {
      printWindow.focus();
      printWindow.print();
      printWindow.onafterprint = () => printWindow.close();
    };

    if (printWindow.document.readyState === 'complete') {
      setTimeout(doPrint, 350);
    } else {
      printWindow.onload = () => setTimeout(doPrint, 350);
    }
  }

  async function saveQuote() {
    if (!projectId || !title.trim() || !lines.some((line) => line.description.trim())) {
      alert('Διάλεξε έργο και συμπλήρωσε τουλάχιστον μία εργασία.');
      return;
    }
    setSaving(true);
    const itemText = lines.filter((x) => x.description.trim()).map((x) => `${x.description} | ${x.quantity} x ${euro(x.unitPrice)}`).join('\n');
    const payload = {
      project_id: projectId,
      work_type: title.trim(),
      description: [description.trim(), itemText, `Ισχύει έως: ${validUntil}`, notes.trim()].filter(Boolean).join('\n\n'),
      subtotal,
      vat,
      withholding,
      payable: total,
      job_type: vatEnabled ? 'invoice' : 'cash',
      status: 'pending'
    };
    const { error } = await supabase.from('quotes').insert([{ quote_number: quoteNumber, ...payload }]);
    setSaving(false);
    if (error) return alert(error.message);
    await onSaved?.();
    alert('Η προσφορά αποθηκεύτηκε.');
  }

  return (
    <>
      <section className="card page-section quotes-section quote-studio no-print">
        <div className="quote-studio-head">
          <div><h2>📄 Νέα Προσφορά</h2><p>Δημιούργησε επαγγελματική προσφορά TD MANI και εξήγαγέ την σε PDF.</p></div>
          <span className="quote-number-chip">{quoteNumber}</span>
        </div>

        <div className="quote-form-grid">
          <div>
            <label>Πελάτης</label>
            <select value={customerId} onChange={(e) => { setCustomerId(e.target.value); setProjectId(''); }}>
              <option value="">Διάλεξε πελάτη</option>
              {customers.filter((x) => !x.is_deleted).map((x) => <option key={x.id} value={x.id}>{x.name}</option>)}
            </select>
          </div>
          <div>
            <label>Έργο</label>
            <select value={projectId} onChange={(e) => { const id = e.target.value; setProjectId(id); const p = projects.find((x) => String(x.id) === String(id)); if (p && !customerId) setCustomerId(String(p.customer_id || '')); }}>
              <option value="">Διάλεξε έργο</option>
              {customerProjects.map((x) => <option key={x.id} value={x.id}>{x.title}</option>)}
            </select>
          </div>
          <div><label>Ημερομηνία</label><input type="date" value={quoteDate} onChange={(e) => setQuoteDate(e.target.value)} /></div>
          <div><label>Ισχύει έως</label><input type="date" value={validUntil} onChange={(e) => setValidUntil(e.target.value)} /></div>
        </div>

        <label>Τίτλος προσφοράς</label>
        <input value={title} onChange={(e) => setTitle(e.target.value)} placeholder="π.χ. Ανακαίνιση κατοικίας" />
        <label>Γενική περιγραφή</label>
        <textarea value={description} onChange={(e) => setDescription(e.target.value)} placeholder="Σύντομη περιγραφή του αντικειμένου της προσφοράς" />

        <h3>Είδη / Εργασίες</h3>
        <div className="quote-lines">
          <div className="quote-line quote-line-head"><span>#</span><span>Περιγραφή</span><span>Ποσότητα</span><span>Τιμή μονάδας</span><span>Σύνολο</span><span></span></div>
          {lines.map((line, index) => (
            <div className="quote-line" key={index}>
              <span>{index + 1}</span>
              <input value={line.description} onChange={(e) => updateLine(index, 'description', e.target.value)} placeholder="Εργασία / υλικό" />
              <input type="number" min="0" step="0.01" value={line.quantity} onChange={(e) => updateLine(index, 'quantity', e.target.value)} />
              <input type="number" min="0" step="0.01" value={line.unitPrice} onChange={(e) => updateLine(index, 'unitPrice', e.target.value)} placeholder="0,00" />
              <b>{euro(Number(line.quantity || 0) * Number(line.unitPrice || 0))}</b>
              <button className="quote-remove" onClick={() => removeLine(index)} disabled={lines.length === 1}>×</button>
            </div>
          ))}
        </div>
        <button onClick={() => setLines([...lines, emptyLine()])}>＋ Προσθήκη είδους</button>

        <div className="quote-bottom-grid">
          <div>
            <label>Σημειώσεις / Όροι</label>
            <textarea value={notes} onChange={(e) => setNotes(e.target.value)} />
            <label className="quote-check"><input type="checkbox" checked={vatEnabled} onChange={(e) => setVatEnabled(e.target.checked)} /> ΦΠΑ 24%</label>
            <label className="quote-check"><input type="checkbox" checked={withholdingEnabled} onChange={(e) => setWithholdingEnabled(e.target.checked)} /> Παρακράτηση 3%</label>
          </div>
          <div className="quote-totals">
            <p><span>Καθαρή αξία</span><b>{euro(subtotal)}</b></p>
            <p><span>ΦΠΑ 24%</span><b>{euro(vat)}</b></p>
            <p><span>Παρακράτηση 3%</span><b>-{euro(withholding)}</b></p>
            <p className="quote-grand"><span>Τελικό ποσό</span><b>{euro(total)}</b></p>
          </div>
        </div>

        <div className="quote-actions">
          <button onClick={() => setPreview(true)}>👁 Προεπισκόπηση PDF</button>
          <button onClick={saveQuote} disabled={saving}>{saving ? 'Αποθήκευση...' : '💾 Αποθήκευση Προσφοράς'}</button>
        </div>
      </section>

      {preview && (
        <section className="card page-section quotes-section quote-preview-shell">
          <div className="no-print quote-preview-actions"><button onClick={exportQuotePdf}>📄 Εξαγωγή PDF</button><button onClick={() => setPreview(false)}>Κλείσιμο</button></div>
          <article className="print-area td-quote-pdf">
            <header className="td-quote-pdf-header">
              <div className="td-quote-logo"><img src="/tdmani-logo-gold.png" alt="TD MANI" /></div>
              <div className="td-quote-contact"><b>TD MANI E.E.</b><span>ΟΙΚΟΔΟΜΙΚΕΣ ΕΡΓΑΣΙΕΣ</span><small>Πλάκες, Μήλος 84800</small><small>6944705508 • Manitaulant@yahoo.com</small></div>
              <div className="td-quote-meta"><h2>ΠΡΟΣΦΟΡΑ</h2><p><b>Αρ. Προσφοράς:</b> {quoteNumber}</p><p><b>Ημερομηνία:</b> {greekDate(quoteDate)}</p><p><b>Ισχύει έως:</b> {greekDate(validUntil)}</p></div>
            </header>
            <div className="td-quote-gold-rule" />
            <div className="td-quote-parties">
              <div><small>ΠΡΟΣ</small><h3>{customer?.name || 'Πελάτης'}</h3><p>ΑΦΜ: {customer?.afm || '-'}</p><p>Τηλέφωνο: {customer?.phone || '-'}</p></div>
              <div><small>ΕΡΓΟ</small><h3>{project?.title || '-'}</h3><p>{project?.address || project?.area || '-'}</p></div>
            </div>
            <div className="td-quote-description"><h3>{title || 'Προσφορά'}</h3>{description && <p>{description}</p>}</div>
            <table className="td-quote-table"><thead><tr><th>#</th><th>Περιγραφή</th><th>Ποσότητα</th><th>Τιμή Μονάδας</th><th>Σύνολο</th></tr></thead><tbody>
              {lines.filter((x) => x.description.trim()).map((line, index) => <tr key={index}><td>{index + 1}</td><td>{line.description}</td><td>{line.quantity}</td><td>{euro(line.unitPrice)}</td><td>{euro(Number(line.quantity || 0) * Number(line.unitPrice || 0))}</td></tr>)}
            </tbody></table>
            <div className="td-quote-summary"><div></div><div><p><span>Σύνολο</span><b>{euro(subtotal)}</b></p>{vatEnabled && <p><span>ΦΠΑ 24%</span><b>{euro(vat)}</b></p>}{withholdingEnabled && <p><span>Παρακράτηση 3%</span><b>-{euro(withholding)}</b></p>}<p className="final"><span>Τελικό Ποσό</span><b>{euro(total)}</b></p></div></div>
            <div className="td-quote-notes"><h3>Σημειώσεις</h3>{notes.split('\n').filter(Boolean).map((x, i) => <p key={i}>• {x}</p>)}</div>
            <footer className="td-quote-footer"><div><p>Με εκτίμηση,</p><b>TD MANI E.E.</b><span>Οικοδομικές Εργασίες</span></div><div className="td-quote-footer-slogan">Ποιότητα • Εμπιστοσύνη • Αποτέλεσμα</div></footer>
          </article>
        </section>
      )}
    </>
  );
}
