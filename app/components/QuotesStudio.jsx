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
  const [savedQuotePreview, setSavedQuotePreview] = useState(null);

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

  const getProject = (id) => projects.find((x) => String(x.id) === String(id));
  const getCustomerForProject = (projectIdValue) => {
    const p = getProject(projectIdValue);
    return customers.find((x) => String(x.id) === String(p?.customer_id));
  };

  function parseSavedQuote(quote) {
    const raw = quote?.description || '';
    const blocks = raw.split(/\n\s*\n/).map((x) => x.trim()).filter(Boolean);
    const itemPattern = /^(.*?)\s*\|\s*([\d.,]+)\s*x\s*(.*)$/;
    const itemBlockIndex = blocks.findIndex((b) => b.split('\n').some((line) => itemPattern.test(line.trim())));
    const itemBlock = itemBlockIndex >= 0 ? blocks[itemBlockIndex] : '';
    const savedLines = itemBlock.split('\n').map((line) => {
      const m = line.trim().match(itemPattern);
      if (!m) return null;
      const unitText = m[3].replace(/[^\d,.-]/g, '').replace(/\./g, '').replace(',', '.');
      return { description: m[1].trim(), quantity: m[2].replace(',', '.'), unitPrice: Number(unitText || 0) };
    }).filter(Boolean);

    const validBlock = blocks.find((b) => b.startsWith('Ισχύει έως:'));
    const savedValidUntil = validBlock ? validBlock.replace('Ισχύει έως:', '').trim() : '';
    const generalDescription = itemBlockIndex > 0 ? blocks.slice(0, itemBlockIndex).join('\n\n') : '';
    const noteBlocks = blocks.filter((b, i) => i !== itemBlockIndex && !b.startsWith('Ισχύει έως:') && !(i < itemBlockIndex));
    const savedNotes = noteBlocks.join('\n');
    const savedDate = quote?.created_at ? new Date(quote.created_at).toLocaleDateString('el-GR') : '-';

    return { savedLines, savedValidUntil, generalDescription, savedNotes, savedDate };
  }

  async function deleteSavedQuote(id) {
    if (!confirm('Να διαγραφεί η προσφορά;')) return;
    const { error } = await supabase.from('quotes').delete().eq('id', id);
    if (error) return alert(error.message);
    await onSaved?.();
  }

  function exportQuotePdf(selector = '.td-quote-pdf') {
    const quote = document.querySelector(selector);
    if (!quote) return;

    const printWindow = window.open('', '_blank', 'width=900,height=1200');
    if (!printWindow) {
      alert('Επίτρεψε τα αναδυόμενα παράθυρα για να γίνει η εξαγωγή PDF.');
      return;
    }

    printWindow.document.open();
    printWindow.document.write(`<!doctype html>
<html lang="el">
<head>
<meta charset="utf-8" />
<title>${quoteNumber}</title>
<style>
  @page { size: A4 portrait; margin: 0; }
  * { box-sizing: border-box; }
  html, body { margin: 0; padding: 0; background: #fff; }
  body { font-family: Arial, Helvetica, sans-serif; color: #171717; -webkit-print-color-adjust: exact; print-color-adjust: exact; }
  .td-quote-pdf { width: 210mm; min-height: 297mm; margin: 0 auto; padding: 10mm 10mm 0; background: #fff; display: flex; flex-direction: column; }
  .td-quote-pdf-header { display: grid; grid-template-columns: 31mm 1fr 55mm; gap: 7mm; align-items: start; }
  .td-quote-logo img { width: 29mm; height: 20mm; object-fit: contain; display: block; }
  .td-quote-contact b { display:block; font-size: 17pt; letter-spacing: .6px; margin: 1mm 0; }
  .td-quote-contact span { display:block; font-size: 8pt; font-weight: 700; margin-bottom: 4mm; }
  .td-quote-contact small { display:block; font-size: 7.4pt; line-height: 1.55; }
  .td-quote-hand { text-align:right; font-family: cursive; font-style: italic; font-size: 12pt; transform: rotate(-7deg); margin-bottom: 4mm; line-height: 1.05; }
  .td-quote-meta { background:#f4e6c6; border-radius: 3mm; padding: 4mm; }
  .td-quote-meta h2 { margin:0 0 2mm; font-size: 10pt; }
  .td-quote-meta p { margin: .7mm 0; font-size: 7.5pt; }
  .td-quote-gold-rule { height: .55mm; background:#c89b35; margin: 5mm 0 4mm; }
  .td-quote-parties { display:grid; grid-template-columns:1fr 1fr; gap: 7mm; margin-bottom:4mm; }
  .td-quote-parties > div { border-left: .7mm solid #c89b35; padding-left: 3mm; min-height: 24mm; }
  .td-quote-parties small { font-size:7pt; font-weight:800; }
  .td-quote-parties h3 { font-size:9pt; margin:1mm 0; }
  .td-quote-parties p { font-size:7.2pt; margin:.6mm 0; }
  .td-quote-description { margin: 1mm 0 3mm; }
  .td-quote-description h3 { font-size:9pt; margin:0 0 1mm; }
  .td-quote-description p { font-size:7.5pt; line-height:1.35; margin:0; }
  .td-quote-table { width:100%; border-collapse:collapse; font-size:7.2pt; }
  .td-quote-table th { background:#e7c985; padding:2.2mm 1.5mm; text-align:left; font-size:6.8pt; }
  .td-quote-table th:nth-child(n+3), .td-quote-table td:nth-child(n+3) { text-align:right; }
  .td-quote-table td { padding:2mm 1.5mm; border-bottom:.25mm solid #ddd; }
  .td-quote-summary { display:grid; grid-template-columns:1fr 70mm; margin-top:2mm; }
  .td-quote-summary p { display:flex; justify-content:space-between; gap:5mm; margin:0; padding:1.6mm 2mm; font-size:7.5pt; border-bottom:.25mm solid #ddd; }
  .td-quote-summary .final { background:#f1dfb3; font-size:10pt; font-weight:800; border:0; }
  .td-quote-notes { margin-top:5mm; }
  .td-quote-notes h3 { font-size:8pt; margin:0 0 1mm; }
  .td-quote-notes p { font-size:6.9pt; margin:.6mm 0; }
  .td-quote-footer { margin-top:auto; position:relative; min-height:48mm; background:#171717; color:#fff; padding:8mm 8mm 6mm; overflow:hidden; display:flex; align-items:flex-start; justify-content:space-between; border-top:.8mm solid #c89b35; }
  .td-quote-footer:before { content:""; position:absolute; inset:0 42% 0 0; background:linear-gradient(135deg,#6d6d6d,#c9c9c9); opacity:.38; clip-path:polygon(0 0,100% 0,72% 100%,0 100%); }
  .td-quote-footer:after { content:""; position:absolute; top:0; right:33%; width:1mm; height:65mm; background:#c89b35; transform:rotate(36deg); transform-origin:top; }
  .td-quote-footer > * { position:relative; z-index:2; }
  .td-quote-footer p { margin:0 0 1mm; font-size:7pt; }
  .td-quote-footer b { display:block; color:#d7ad4d; font-size:9pt; }
  .td-quote-footer span { display:block; font-size:7pt; }
  .td-quote-footer-slogan { align-self:center; color:#d7ad4d; font-size:9pt; text-align:right; max-width:55mm; }
  .no-print, .quote-preview-actions { display:none !important; }
  .td-quote-pdf-header, .td-quote-parties, .td-quote-description, .td-quote-summary, .td-quote-notes, .td-quote-footer, tr { break-inside:avoid; page-break-inside:avoid; }
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
    if (printWindow.document.readyState === 'complete') setTimeout(doPrint, 450);
    else printWindow.onload = () => setTimeout(doPrint, 450);
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

      <section className="card page-section quotes-section no-print" style={{ marginTop: '18px' }}>
        <div className="quote-studio-head">
          <div>
            <h2>📚 Αποθηκευμένες Προσφορές</h2>
            <p>Όλες οι προσφορές που έχεις αποθηκεύσει.</p>
          </div>
          <span className="quote-number-chip">{quotes.filter((x) => !x.is_deleted).length}</span>
        </div>

        {quotes.filter((x) => !x.is_deleted).length === 0 ? (
          <p style={{ opacity: .7 }}>Δεν υπάρχουν ακόμη αποθηκευμένες προσφορές.</p>
        ) : (
          <div style={{ overflowX: 'auto' }}>
            <table className="td-quote-table" style={{ width: '100%', minWidth: '760px' }}>
              <thead>
                <tr>
                  <th>Αρ. Προσφοράς</th>
                  <th>Πελάτης</th>
                  <th>Έργο</th>
                  <th>Περιγραφή</th>
                  <th>Ποσό</th>
                  <th>Ενέργειες</th>
                </tr>
              </thead>
              <tbody>
                {quotes.filter((x) => !x.is_deleted).map((quote) => {
                  const savedProject = getProject(quote.project_id);
                  const savedCustomer = getCustomerForProject(quote.project_id);
                  return (
                    <tr key={quote.id}>
                      <td><b>{quote.quote_number || '-'}</b></td>
                      <td>{savedCustomer?.name || '-'}</td>
                      <td>{savedProject?.title || '-'}</td>
                      <td>{quote.work_type || '-'}</td>
                      <td><b>{euro(quote.payable)}</b></td>
                      <td>
                        <div style={{ display: 'flex', gap: '6px', flexWrap: 'wrap' }}>
                          <button onClick={() => setSavedQuotePreview(quote)}>👁 Προβολή</button>
                          <button className="quote-remove" onClick={() => deleteSavedQuote(quote.id)}>🗑 Διαγραφή</button>
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </section>

      {savedQuotePreview && (() => {
        const savedProject = getProject(savedQuotePreview.project_id);
        const savedCustomer = getCustomerForProject(savedQuotePreview.project_id);
        const parsed = parseSavedQuote(savedQuotePreview);
        return (
          <section className="card page-section quotes-section quote-preview-shell">
            <div className="no-print quote-preview-actions">
              <button onClick={() => exportQuotePdf("#saved-quote-pdf")}>📄 Εξαγωγή PDF</button>
              <button onClick={() => setSavedQuotePreview(null)}>Κλείσιμο</button>
            </div>
            <article id="saved-quote-pdf" className="print-area td-quote-pdf">
              <header className="td-quote-pdf-header">
                <div className="td-quote-logo"><img src="/tdmani-logo-gold.png" alt="TD MANI" /></div>
                <div className="td-quote-contact">
                  <b>TD MANI E.E.</b>
                  <span>ΟΙΚΟΔΟΜΙΚΕΣ ΕΡΓΑΣΙΕΣ</span>
                  <small>📍 Πλάκες, Μήλος 84800</small>
                  <small>☎ 6944705508</small>
                  <small>✉ Manitaulant@yahoo.com</small>
                </div>
                <div>
                  <div className="td-quote-hand">Χτίζουμε<br />το μέλλον σας!</div>
                  <div className="td-quote-meta">
                    <h2>ΠΡΟΣΦΟΡΑ</h2>
                    <p><b>Αρ. Προσφοράς:</b> {savedQuotePreview.quote_number || '-'}</p>
                    <p><b>Ημερομηνία:</b> {parsed.savedDate}</p>
                    <p><b>Ισχύει έως:</b> {parsed.savedValidUntil ? greekDate(parsed.savedValidUntil) : '-'}</p>
                  </div>
                </div>
              </header>
              <div className="td-quote-gold-rule" />
              <div className="td-quote-parties">
                <div>
                  <small>ΠΡΟΣ</small>
                  <h3>{savedCustomer?.name || 'Πελάτης'}</h3>
                  <p>ΑΦΜ: {savedCustomer?.afm || '-'}</p>
                  <p>Τηλέφωνο: {savedCustomer?.phone || '-'}</p>
                </div>
                <div>
                  <small>ΕΡΓΟ</small>
                  <h3>{savedProject?.title || '-'}</h3>
                  <p>{savedProject?.address || savedProject?.area || '-'}</p>
                </div>
              </div>

              <div className="td-quote-description">
                <h3>{savedQuotePreview.work_type || 'ΠΕΡΙΓΡΑΦΗ'}</h3>
                {parsed.generalDescription && <p>{parsed.generalDescription}</p>}
              </div>

              {parsed.savedLines.length > 0 && (
                <table className="td-quote-table">
                  <thead><tr><th>#</th><th>Περιγραφή</th><th>Ποσότητα</th><th>Τιμή Μονάδας</th><th>Σύνολο</th></tr></thead>
                  <tbody>
                    {parsed.savedLines.map((line, index) => (
                      <tr key={index}>
                        <td>{index + 1}</td>
                        <td>{line.description}</td>
                        <td>{line.quantity}</td>
                        <td>{euro(line.unitPrice)}</td>
                        <td>{euro(Number(line.quantity || 0) * Number(line.unitPrice || 0))}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              )}

              <div className="td-quote-summary">
                <div></div>
                <div>
                  <p><span>Σύνολο</span><b>{euro(savedQuotePreview.subtotal)}</b></p>
                  {Number(savedQuotePreview.vat || 0) !== 0 && <p><span>ΦΠΑ 24%</span><b>{euro(savedQuotePreview.vat)}</b></p>}
                  {Number(savedQuotePreview.withholding || 0) !== 0 && <p><span>Παρακράτηση 3%</span><b>-{euro(savedQuotePreview.withholding)}</b></p>}
                  <p className="final"><span>Τελικό Ποσό</span><b>{euro(savedQuotePreview.payable)}</b></p>
                </div>
              </div>

              {parsed.savedNotes && (
                <div className="td-quote-notes">
                  <h3>Σημειώσεις</h3>
                  {parsed.savedNotes.split('\n').filter(Boolean).map((x, i) => <p key={i}>• {x.replace(/^•\s*/, '')}</p>)}
                </div>
              )}

              <footer className="td-quote-footer">
                <div><p>Με εκτίμηση,</p><b>TD MANI E.E.</b><span>Οικοδομικές Εργασίες</span></div>
                <div className="td-quote-footer-slogan">Ποιότητα<br />Εμπιστοσύνη<br />Αποτέλεσμα</div>
              </footer>
            </article>
          </section>
        );
      })()}

      {preview && (
        <section className="card page-section quotes-section quote-preview-shell">
          <div className="no-print quote-preview-actions"><button onClick={() => exportQuotePdf("#current-quote-pdf")}>📄 Εξαγωγή PDF</button><button onClick={() => setPreview(false)}>Κλείσιμο</button></div>
          <article id="current-quote-pdf" className="print-area td-quote-pdf">
            <header className="td-quote-pdf-header">
              <div className="td-quote-logo"><img src="/tdmani-logo-gold.png" alt="TD MANI" /></div>
              <div className="td-quote-contact">
                <b>TD MANI E.E.</b>
                <span>ΟΙΚΟΔΟΜΙΚΕΣ ΕΡΓΑΣΙΕΣ</span>
                <small>📍 Πλάκες, Μήλος 84800</small>
                <small>☎ 6944705508</small>
                <small>✉ Manitaulant@yahoo.com</small>
              </div>
              <div>
                <div className="td-quote-hand">Χτίζουμε<br />το μέλλον σας!</div>
                <div className="td-quote-meta">
                  <h2>ΠΡΟΣΦΟΡΑ</h2>
                  <p><b>Αρ. Προσφοράς:</b> {quoteNumber}</p>
                  <p><b>Ημερομηνία:</b> {greekDate(quoteDate)}</p>
                  <p><b>Ισχύει έως:</b> {greekDate(validUntil)}</p>
                </div>
              </div>
            </header>
            <div className="td-quote-gold-rule" />
            <div className="td-quote-parties">
              <div>
                <small>ΠΡΟΣ</small>
                <h3>{customer?.name || 'Πελάτης'}</h3>
                <p>ΑΦΜ: {customer?.afm || '-'}</p>
                <p>Τηλέφωνο: {customer?.phone || '-'}</p>
              </div>
              <div>
                <small>ΕΡΓΟ</small>
                <h3>{project?.title || '-'}</h3>
                <p>{project?.address || project?.area || '-'}</p>
              </div>
            </div>
            <div className="td-quote-description">
              <h3>{title || 'ΠΕΡΙΓΡΑΦΗ'}</h3>
              {description && <p>{description}</p>}
            </div>
            <table className="td-quote-table">
              <thead><tr><th>#</th><th>Περιγραφή</th><th>Ποσότητα</th><th>Τιμή Μονάδας</th><th>Σύνολο</th></tr></thead>
              <tbody>
                {lines.filter((x) => x.description.trim()).map((line, index) => (
                  <tr key={index}><td>{index + 1}</td><td>{line.description}</td><td>{line.quantity}</td><td>{euro(line.unitPrice)}</td><td>{euro(Number(line.quantity || 0) * Number(line.unitPrice || 0))}</td></tr>
                ))}
              </tbody>
            </table>
            <div className="td-quote-summary">
              <div></div>
              <div>
                <p><span>Σύνολο</span><b>{euro(subtotal)}</b></p>
                {vatEnabled && <p><span>ΦΠΑ 24%</span><b>{euro(vat)}</b></p>}
                {withholdingEnabled && <p><span>Παρακράτηση 3%</span><b>-{euro(withholding)}</b></p>}
                <p className="final"><span>Τελικό Ποσό</span><b>{euro(total)}</b></p>
              </div>
            </div>
            <div className="td-quote-notes">
              <h3>Σημειώσεις</h3>
              {notes.split('\n').filter(Boolean).map((x, i) => <p key={i}>• {x}</p>)}
            </div>
            <footer className="td-quote-footer">
              <div><p>Με εκτίμηση,</p><b>TD MANI E.E.</b><span>Οικοδομικές Εργασίες</span></div>
              <div className="td-quote-footer-slogan">Ποιότητα<br />Εμπιστοσύνη<br />Αποτέλεσμα</div>
            </footer>
          </article>
        </section>
      )}
    </>
  );
}
