import './App.css';
import GameScreen from './Components/GameScreen';
import Chessboard from 'chessboardjsx';
import Stockfish from './Components/Stockfish';
import { BrowserRouter as Router, Route, Routes, Link, useLocation } from 'react-router-dom';
import Register from './Components/Register';
import Login from './Components/Login';
import UserProfile from './Components/UserProfile';
import GameWithAI from './Components/GameWithAI';
import Scoreboard from './Components/scoreboard';

// NavLink component
function NavLink({ to, children }) {
  const location = useLocation();
  const isActive = location.pathname === to;
  
  return (
    <Link 
      to={to} 
      className={`nav-link ${isActive ? 'active' : ''}`}
    >
      {children}
    </Link>
  );
}

// Main App component
function App() {
  const location = useLocation();
  const isAuthPage = location.pathname === '/login' || 
                    location.pathname === '/register' || 
                    location.pathname === '/';
  
  return (
    <div className='app-container'>
      {!isAuthPage && (
        <nav className='navigation'>
          <div className='nav-content'>
            <h1 className='nav-title'>Chess</h1>
            <ul className='nav-links'>
              <li>
                <NavLink to='/gameAI'>Play with AI</NavLink>
              </li>
              <li>
                <NavLink to='/gameHuman'>Play with Human</NavLink>
              </li>
              <li>
                <NavLink to='/user'>Profile</NavLink>
              </li>
              <li>
                <NavLink to='/scoreboard'>Leaderboard</NavLink>
              </li>
            </ul>
          </div>
        </nav>
      )}

      <main className={isAuthPage ? '' : 'main-content'}>
        <Routes>
          <Route path='/' element={<Login />} />
          <Route path='/register' element={<Register />} />
          <Route path='/login' element={<Login />} />
          <Route path='/gameAI' element={<GameWithAI />} />
          <Route path='/gameHuman' element={<GameWithHuman />} />
          <Route path='/user' element={<UserProfile />} />
          <Route path='/scoreboard' element={<Scoreboard />} />
        </Routes>
      </main>
    </div>
  );
}

// GameWithHuman component
const GameWithHuman = () => {
  return (
    <div className='game-container'>
      
      <GameScreen />
      <div className='boards-container'>
        
      </div>
    </div>
  );
};

// Wrap the App with Router
function AppWrapper() {
  return (
    <Router>
      <App />
    </Router>
  );
}

export default AppWrapper;