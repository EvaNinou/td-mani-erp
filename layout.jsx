export const metadata = {
  title: 'TD MANI ERP',
  description: 'TD MANI ERP - Οικοδομικές Εργασίες',
  manifest: '/manifest.json',
  icons: {
    icon: '/favicon.ico',
    apple: '/apple-touch-icon.png',
  },
  themeColor: '#111111',
};

export default function RootLayout({ children }) {
  return (
    <html lang="el">
      <body>{children}</body>
    </html>
  );
}
