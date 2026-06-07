import React from 'react'
import ReactDOM from 'react-dom/client'
import App from './App.jsx'
import './index.css'
import { CHWProvider } from './context/CHWContext.jsx'

ReactDOM.createRoot(document.getElementById('root')).render(
  <React.StrictMode>
    <CHWProvider>
      <App />
    </CHWProvider>
  </React.StrictMode>,
)
