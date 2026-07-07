export function calculateQuoteValues(quoteForm) {
  const subtotal = Number(quoteForm?.subtotal || 0);
  const vat = quoteForm?.job_type === 'invoice' ? subtotal * 0.24 : 0;
  const withholding = quoteForm?.job_type === 'invoice' ? subtotal * 0.03 : 0;
  const payable = subtotal + vat - withholding;

  return { subtotal, vat, withholding, payable };
}

export function calculateCustomerInvoiceValues(invoiceForm) {
  const net = Number(invoiceForm?.net_amount || 0);
  const vat = net * 0.24;
  const withholding = net * 0.03;
  const total = net + vat;
  const receivable = total - withholding;

  return { net, vat, withholding, total, receivable };
}

export function calculateSupplierInvoiceValues(invoiceForm) {
  const net = Number(invoiceForm?.net_amount || 0);
  const vat = net * 0.24;
  const total = net + vat;

  return { net, vat, total };
}

export function getQuarterDates(yearValue, quarterValue) {
  const year = Number(yearValue || new Date().getFullYear());
  const quarter = Number(quarterValue || 1);
  const startMonth = (quarter - 1) * 3;
  const start = new Date(year, startMonth, 1);
  const end = new Date(year, startMonth + 3, 0);

  const formatLocalDate = (date) => {
    const dateYear = date.getFullYear();
    const month = String(date.getMonth() + 1).padStart(2, '0');
    const day = String(date.getDate()).padStart(2, '0');

    return `${dateYear}-${month}-${day}`;
  };

  return {
    startDate: formatLocalDate(start),
    endDate: formatLocalDate(end)
  };
}

export function isDateInRange(dateString, startDate, endDate) {
  if (!dateString) return false;
  return dateString >= startDate && dateString <= endDate;
}
