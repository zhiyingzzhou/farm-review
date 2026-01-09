import React from 'react'
import ReactDOM from 'react-dom/client'
import { BrowserRouter, HashRouter } from 'react-router-dom'
import App from './App'
import './styles/index.css'
import { routerBasename, routerMode } from './env'

const Router = routerMode === 'hash' ? HashRouter : BrowserRouter

ReactDOM.createRoot(document.getElementById('root')!).render(
  <React.StrictMode>
    <Router basename={routerBasename}>
      <App />
    </Router>
  </React.StrictMode>,
)
