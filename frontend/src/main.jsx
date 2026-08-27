import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import './index.css'
import App from './App.jsx'
import { PasswordGate } from './components/PasswordGate.jsx'
import { PrivacyGate } from './components/PrivacyGate.jsx'

createRoot(document.getElementById('root')).render(
  <StrictMode>
    <PasswordGate>
      <PrivacyGate>
        <App />
      </PrivacyGate>
    </PasswordGate>
  </StrictMode>,
)
