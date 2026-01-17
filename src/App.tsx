import React from 'react';
import { BrowserRouter as Router, Routes, Route, Link } from 'react-router-dom';
import RunsList from './components/RunsList';
import RunTimeline from './components/RunTimeline';
import UserStats from './components/UserStats';

function App() {
  return (
    <Router>
      <div className="app">
        <nav className="navbar">
          <Link to="/" style={{ textDecoration: 'none', color: 'white' }}>
            <h1>⚡ Grimlock2 Dashboard</h1>
          </Link>
        </nav>
        <Routes>
          <Route path="/" element={<RunsList />} />
          <Route path="/runs/:runId" element={<RunTimeline />} />
          <Route path="/users/:userTokenHash" element={<UserStats />} />
        </Routes>
      </div>
    </Router>
  );
}

export default App;
