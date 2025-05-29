import { BrowserRouter as Router, Routes, Route, Link } from 'react-router-dom'
import Game from './components/Game'
import TermsOfService from './components/TermsOfService'
import PrivacyPolicy from './components/PrivacyPolicy'
import './App.css'

function App() {
  return (
    <Router>
      <div className="app">
        <header className="app-header">
          <div className="header-content">
            <Link to="/" className="header-title-link">
              <h1>Grizip</h1>
            </Link>
            <p>A Zip Game - Daily Puzzle Game</p>
          </div>
        </header>
        
        <Routes>
          <Route path="/" element={<Game />} />
          <Route path="/conditions-generales" element={<TermsOfService />} />
          <Route path="/politique-confidentialite" element={<PrivacyPolicy />} />
        </Routes>

        <footer className="app-footer">
          <div className="footer-content">
            <div className="footer-disclaimer">
              <p>This site is not affiliated with LinkedIn®</p>
            </div>
            <div className="footer-links">
              <Link to="/conditions-generales" className="footer-link">
                Conditions Générales
              </Link>
              <Link to="/politique-confidentialite" className="footer-link">
                Politique de Confidentialité
              </Link>
            </div>
            <div className="footer-credits">
              <p>Developed by <a href="https://on-dev.fr" target="_blank" rel="noopener noreferrer">ON'Dev</a></p>
            </div>
          </div>
        </footer>
      </div>
    </Router>
  );
}

export default App
