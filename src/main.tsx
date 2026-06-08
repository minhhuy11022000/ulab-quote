import './index.css'
import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import App from './App'
import SharePage from './SharePage'

const shareId = new URLSearchParams(window.location.search).get('share')

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    {shareId ? <SharePage quoteId={shareId} /> : <App />}
  </StrictMode>,
)
