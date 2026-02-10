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

        <footer className="mt-5 py-4 text-center text-muted small border-top">
          <a
            href="https://github.com/DE0CH/tickets"
            target="_blank"
            rel="noopener noreferrer"
            className="text-decoration-none text-muted"
          >
            View source on GitHub
          </a>
        </footer>
      </div>
    </main>
  )
}

export default App
