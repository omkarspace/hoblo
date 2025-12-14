import React from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../../contexts/AuthContext';
import { useTheme } from '../../contexts/ThemeContext';
import { Moon, Sun, User, LogOut, Settings } from 'lucide-react';
import './Header.css';

const Header: React.FC = () => {
  const { user, isAuthenticated, logout } = useAuth();
  const { theme, toggleTheme } = useTheme();
  const navigate = useNavigate();

  const handleLogout = () => {
    logout();
    navigate('/');
  };

  return (
    <header className="header">
      <div className="header-container">
        <div className="header-left">
          <Link to="/" className="logo">
            <h1>HobbyHub</h1>
          </Link>
        </div>

        <nav className="header-nav">
          <Link to="/categories" className="nav-link">Categories</Link>
          <Link to="/craft-circles" className="nav-link">Craft Circles</Link>
          <Link to="/skill-trees" className="nav-link">Skill Trees</Link>
          {isAuthenticated && (
            <>
              <Link to="/groups" className="nav-link">Groups</Link>
              <Link to="/achievements" className="nav-link">Achievements</Link>
            </>
          )}
        </nav>

        <div className="header-right">
          <button
            onClick={toggleTheme}
            className="theme-toggle"
            aria-label="Toggle theme"
          >
            {theme === 'light' ? <Moon size={20} /> : <Sun size={20} />}
          </button>

          {isAuthenticated ? (
            <div className="user-menu">
              <div className="user-info">
                {user?.profilePicture ? (
                  <img
                    src={`/uploads/profile-pictures/${user.profilePicture}`}
                    alt="Profile"
                    className="profile-picture"
                  />
                ) : (
                  <div className="profile-placeholder">
                    <User size={20} />
                  </div>
                )}
                <span className="user-name">
                  {user?.firstName} {user?.lastName}
                </span>
              </div>
              <div className="dropdown-menu">
                <Link to="/profile" className="dropdown-item">
                  <User size={16} />
                  Profile
                </Link>
                <Link to="/subscription" className="dropdown-item">
                  <Settings size={16} />
                  Subscription
                </Link>
                <button onClick={handleLogout} className="dropdown-item">
                  <LogOut size={16} />
                  Logout
                </button>
              </div>
            </div>
          ) : (
            <div className="auth-buttons">
              <Link to="/login" className="btn btn-secondary">
                Login
              </Link>
              <Link to="/register" className="btn btn-primary">
                Sign Up
              </Link>
            </div>
          )}
        </div>
      </div>
    </header>
  );
};

export default Header;
