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
        <nav className="mb-5">
          <div className="nav nav-pills justify-content-center gap-2">
            <Link className="nav-link" to="/">
              Home
            </Link>
            <Link className="nav-link" to="/account">
              Account
            </Link>
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
      </div>
    </main>
  )
}

export default App
