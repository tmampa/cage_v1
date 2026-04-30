import './globals.css';
import { AuthProvider } from '../context/AuthContext';
import { ChatbotProvider } from '../context/ChatbotContext';
import ChatbotWidget from '../components/ChatbotWidget';
import ChatUserSync from '../components/ChatUserSync';
import LegacyFirebaseCleanup from '../components/LegacyFirebaseCleanup';

export const metadata = {
  title: 'CagE - Cybersecurity Game',
  description:
    'Learn cybersecurity concepts through an engaging game experience',
};

export default function RootLayout({ children }) {
  return (
    <html lang='en' suppressHydrationWarning>
      <body>
        <AuthProvider>
          <ChatbotProvider>
            <LegacyFirebaseCleanup />
            <ChatUserSync />
            {children}
            <ChatbotWidget />
          </ChatbotProvider>
        </AuthProvider>
      </body>
    </html>
  );
}
