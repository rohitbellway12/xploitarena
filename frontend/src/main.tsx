import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import { GoogleOAuthProvider } from '@react-oauth/google';
import './index.css'
import App from './App.tsx'
import { ThemeProvider } from './context/ThemeContext';
import { AuthProvider } from './context/AuthContext';

const GOOGLE_CLIENT_ID = "548125973308-hipdjdvhgmqgcpbe3t07q6af54hm9adl.apps.googleusercontent.com";

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <AuthProvider>
      <ThemeProvider>
        <GoogleOAuthProvider clientId={GOOGLE_CLIENT_ID}>
          <App />
        </GoogleOAuthProvider>
      </ThemeProvider>
    </AuthProvider>
  </StrictMode>,
);
