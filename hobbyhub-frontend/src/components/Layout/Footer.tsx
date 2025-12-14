import React from 'react';
import { Link } from 'react-router-dom';
import './Footer.css';

const Footer: React.FC = () => {
  const currentYear = new Date().getFullYear();

  return (
    <footer className="footer">
      <div className="footer-container">
        <div className="footer-content">
          <div className="footer-section">
            <h3>HobbyHub</h3>
            <p>Connect with fellow hobby enthusiasts and discover new passions in our vibrant community platform.</p>
          </div>

          <div className="footer-section">
            <h4>Explore</h4>
            <ul>
              <li><Link to="/categories">Categories</Link></li>
              <li><Link to="/craft-circles">Craft Circles</Link></li>
              <li><Link to="/skill-trees">Skill Trees</Link></li>
              <li><Link to="/groups">Groups</Link></li>
            </ul>
          </div>

          <div className="footer-section">
            <h4>Community</h4>
            <ul>
              <li><Link to="/achievements">Achievements</Link></li>
              <li><Link to="/subscription">Premium</Link></li>
              <li><a href="#guidelines">Community Guidelines</a></li>
              <li><a href="#help">Help Center</a></li>
            </ul>
          </div>

          <div className="footer-section">
            <h4>Company</h4>
            <ul>
              <li><a href="#about">About Us</a></li>
              <li><a href="#careers">Careers</a></li>
              <li><a href="#blog">Blog</a></li>
              <li><a href="#contact">Contact</a></li>
            </ul>
          </div>
        </div>

        <div className="footer-bottom">
          <div className="footer-legal">
            <p>&copy; {currentYear} HobbyHub. All rights reserved.</p>
            <div className="footer-links">
              <a href="#privacy">Privacy Policy</a>
              <a href="#terms">Terms of Service</a>
              <a href="#cookies">Cookie Policy</a>
            </div>
          </div>
        </div>
      </div>
    </footer>
  );
};

export default Footer;
