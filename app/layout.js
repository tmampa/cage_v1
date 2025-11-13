import './globals.css';
import { AuthProvider } from '../context/AuthContext';
import { ChatbotProvider } from '../context/ChatbotContext';

export const metadata = {
  title: 'CagE - Cybersecurity Game',
  description:
    'Learn cybersecurity concepts through an engaging game experience',
};

export default function RootLayout({ children }) {
  return (
    <html lang='en'>
      <body>
        <AuthProvider>
          <ChatbotProvider>{children}</ChatbotProvider>
        </AuthProvider>
      </body>
    </html>
  );
}
