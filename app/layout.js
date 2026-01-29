import './globals.css';

export const metadata = {
  title: 'Smart School Management System',
  description: 'Complete school management solution',
};

export default function RootLayout({ children }) {
  return (
    <html lang="en">
      <body>{children}</body>
    </html>
  );
}