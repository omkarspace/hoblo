import React from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { Palette, Users, Trophy, Zap } from 'lucide-react';
import './HomePage.css';

const HomePage: React.FC = () => {
  const { isAuthenticated, user } = useAuth();

  return (
    <div className="home-page">
      {/* Hero Section */}
      <section className="hero-section">
        <div className="container">
          <div className="hero-content">
            <h1>Discover Your Next Passion</h1>
            <p>
              Connect with fellow hobby enthusiasts, explore new interests,
              and build a community around what you love.
            </p>
            <div className="hero-actions">
              {!isAuthenticated ? (
                <>
                  <Link to="/register" className="btn btn-primary btn-lg">
                    Join HobbyHub
                  </Link>
                  <Link to="/login" className="btn btn-secondary btn-lg">
                    Sign In
                  </Link>
                </>
              ) : (
                <>
                  <Link to="/categories" className="btn btn-primary btn-lg">
                    Explore Categories
                  </Link>
                  <Link to="/profile" className="btn btn-secondary btn-lg">
                    View Profile
                  </Link>
                </>
              )}
            </div>
          </div>
          <div className="hero-image">
            <div className="hero-placeholder">
              <Palette size={64} />
            </div>
          </div>
        </div>
      </section>

      {/* Features Section */}
      <section className="features-section">
        <div className="container">
          <h2>Why Choose HobbyHub?</h2>
          <div className="features-grid">
            <div className="feature-card">
              <div className="feature-icon">
                <Palette size={32} />
              </div>
              <h3>Discover Hobbies</h3>
              <p>
                Explore thousands of hobbies and find your next passion
                with our intuitive craft circles and skill trees.
              </p>
            </div>

            <div className="feature-card">
              <div className="feature-icon">
                <Users size={32} />
              </div>
              <h3>Connect & Share</h3>
              <p>
                Join communities of like-minded enthusiasts, share your work,
                and learn from fellow hobbyists.
              </p>
            </div>

            <div className="feature-card">
              <div className="feature-icon">
                <Trophy size={32} />
              </div>
              <h3>Earn Achievements</h3>
              <p>
                Track your progress, earn badges, and showcase your accomplishments
                to the community.
              </p>
            </div>

            <div className="feature-card">
              <div className="feature-icon">
                <Zap size={32} />
              </div>
              <h3>AI Recommendations</h3>
              <p>
                Get personalized hobby suggestions based on your interests
                and activity patterns.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="cta-section">
        <div className="container">
          <div className="cta-content">
            <h2>Ready to Start Your Hobby Journey?</h2>
            <p>Join thousands of hobby enthusiasts already exploring new passions.</p>
            {!isAuthenticated ? (
              <Link to="/register" className="btn btn-primary btn-lg">
                Get Started Today
              </Link>
            ) : (
              <Link to="/categories" className="btn btn-primary btn-lg">
                Start Exploring
              </Link>
            )}
          </div>
        </div>
      </section>

      {/* Welcome Message for Authenticated Users */}
      {isAuthenticated && user && (
        <section className="welcome-section">
          <div className="container">
            <div className="welcome-card">
              <h3>Welcome back, {user.firstName}!</h3>
              <p>Continue your hobby journey or discover something new today.</p>
              <div className="welcome-actions">
                <Link to="/categories" className="btn btn-primary">
                  Browse Categories
                </Link>
                <Link to="/groups" className="btn btn-secondary">
                  Join Groups
                </Link>
                <Link to="/achievements" className="btn btn-secondary">
                  View Achievements
                </Link>
              </div>
            </div>
          </div>
        </section>
      )}
    </div>
  );
};

export default HomePage;
