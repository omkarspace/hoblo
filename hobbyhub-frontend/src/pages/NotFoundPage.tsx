import React from 'react';
import { Link } from 'react-router-dom';
import { Home, ArrowLeft } from 'lucide-react';
import './NotFoundPage.css';

const NotFoundPage: React.FC = () => {
  return (
    <div className="not-found-page">
      <div className="not-found-container">
        <div className="not-found-content">
          <div className="error-code">404</div>
          <h1>Page Not Found</h1>
          <p>
            The page you're looking for doesn't exist or has been moved.
            Let's get you back on track!
          </p>
          <div className="not-found-actions">
            <Link to="/" className="btn btn-primary">
              <Home size={20} />
              Go Home
            </Link>
            <button
              onClick={() => window.history.back()}
              className="btn btn-secondary"
            >
              <ArrowLeft size={20} />
              Go Back
            </button>
          </div>
        </div>
        <div className="not-found-image">
          <div className="illustration">
            <svg viewBox="0 0 400 300" xmlns="http://www.w3.org/2000/svg">
              <circle cx="200" cy="150" r="80" fill="#f3f4f6" opacity="0.5"/>
              <circle cx="180" cy="130" r="8" fill="#6b7280"/>
              <circle cx="220" cy="130" r="8" fill="#6b7280"/>
              <path d="M170 170 Q200 190 230 170" stroke="#6b7280" strokeWidth="3" fill="none"/>
              <circle cx="200" cy="250" r="30" fill="#e5e7eb"/>
              <rect x="185" y="220" width="30" height="40" fill="#d1d5db" rx="15"/>
              <circle cx="200" cy="240" r="15" fill="#9ca3af"/>
            </svg>
          </div>
        </div>
      </div>
    </div>
  );
};

export default NotFoundPage;
