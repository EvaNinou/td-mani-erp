export function normalizeText(value) {
  return String(value || '').toLowerCase().trim();
}

export function formatCurrency(value) {
  return `${Number(value || 0).toLocaleString('el-GR', {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2
  })}€`;
}

export function formatDate(value) {
  if (!value) return '-';
  return String(value).split('T')[0];
}

export function formatGreekLongDate(date) {
  return date.toLocaleDateString('el-GR', {
    weekday: 'long',
    day: 'numeric',
    month: 'long',
    year: 'numeric'
  });
}

export function formatGreekTime(date) {
  return date.toLocaleTimeString('el-GR', {
    hour: '2-digit',
    minute: '2-digit'
  });
}

export function formatLocalDate(date) {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const day = String(date.getDate()).padStart(2, '0');

  return `${year}-${month}-${day}`;
}

export function getGreeting(date) {
  const hour = date.getHours();

  if (hour < 12) return '☀️ Καλημέρα';
  if (hour < 17) return '🌤️ Καλό μεσημέρι';
  if (hour < 20) return '🌇 Καλό απόγευμα';

  return '🌙 Καλησπέρα';
}

export function getFirstName(name) {
  return String(name || '').trim().split(' ')[0] || 'χρήστη';
}
