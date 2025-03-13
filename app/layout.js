import './globals.css';
import { AuthProvider } from '../context/AuthContext';

export const metadata = {
  title: 'CagE - Cybersecurity Game',
  description:
    'Learn cybersecurity concepts through an engaging game experience',
};

export default function RootLayout({ children }) {
  return (
    <html lang='en'>
      <body>
        <AuthProvider>{children}</AuthProvider>
      </body>
    </html>
  );
}
