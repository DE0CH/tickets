import { Link, Route, Routes } from 'react-router-dom'
import Account from './pages/Account.jsx'
import AskDetail from './pages/AskDetail.jsx'
import Bid from './pages/Bid.jsx'
import BidDetail from './pages/BidDetail.jsx'
import Event from './pages/Event.jsx'
import Home from './pages/Home.jsx'
import Sell from './pages/Sell.jsx'
import './App.css'

function App() {
  return (
    <main className="min-vh-100 bg-light">
      <div className="container py-5">
        <nav className="navbar navbar-expand-sm navbar-light bg-white rounded-3 shadow-sm mb-5 px-3">
          <div className="container-fluid px-0">
            <Link className="navbar-brand fw-semibold text-dark" to="/">
              Tickets
            </Link>
            <div className="ms-auto d-flex align-items-center gap-2">
              <Link className="btn btn-outline-dark btn-sm" to="/account">
                Account
              </Link>
            </div>
          </div>
        </nav>

        <Routes>
          <Route path="/" element={<Home />} />
          <Route path="/asks/:askId" element={<AskDetail />} />
          <Route path="/bids/:bidId" element={<BidDetail />} />
          <Route path="/events/:eventId" element={<Event />} />
          <Route path="/events/:eventId/sell" element={<Sell />} />
          <Route path="/events/:eventId/bid" element={<Bid />} />
          <Route path="/account" element={<Account />} />
        </Routes>

        <footer className="mt-5 py-3 border-top">
          <div className="row align-items-center">
            <div className="col" />
            <div className="col text-center">
              <span className="text-muted small">by Deyao Chen</span>
            </div>
            <div className="col text-end">
              <a
                href="https://github.com/DE0CH/tickets"
                target="_blank"
                rel="noopener noreferrer"
                className="text-dark opacity-75 d-inline-block p-2"
                aria-label="View source on GitHub"
              >
                <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="currentColor">
                  <path d="M12 0c-6.626 0-12 5.373-12 12 0 5.302 3.438 9.8 8.207 11.387.599.111.793-.261.793-.577v-2.234c-3.338.726-4.033-1.416-4.033-1.416-.546-1.387-1.333-1.756-1.333-1.756-1.089-.745.083-.729.083-.729 1.205.084 1.839 1.237 1.839 1.237 1.07 1.834 2.807 1.304 3.492.997.107-.775.418-1.305.762-1.604-2.665-.305-5.467-1.334-5.467-5.931 0-1.311.469-2.381 1.236-3.221-.124-.303-.535-1.524.117-3.176 0 0 1.008-.322 3.301 1.23.957-.266 1.983-.399 3.003-.404 1.02.005 2.047.138 3.006.404 2.291-1.552 3.297-1.23 3.297-1.23.653 1.653.242 2.874.118 3.176.77.84 1.235 1.911 1.235 3.221 0 4.609-2.807 5.624-5.479 5.921.43.372.823 1.102.823 2.222v3.293c0 .319.192.694.801.576 4.765-1.589 8.199-6.086 8.199-11.386 0-6.627-5.373-12-12-12z"/>
                </svg>
              </a>
            </div>
          </div>
        </footer>
      </div>
    </main>
  )
}

export default App
