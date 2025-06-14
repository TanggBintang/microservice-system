import React, { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import axios from 'axios';

const Login = ({ onLogin }) => {
  const [formData, setFormData] = useState({
    username: '',
    password: ''
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [showRegister, setShowRegister] = useState(false);
  const [registerData, setRegisterData] = useState({
    username: '',
    email: '',
    password: '',
    confirmPassword: ''
  });

  const navigate = useNavigate();

  const handleInputChange = (e) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value
    });
    setError('');
  };

  const handleRegisterChange = (e) => {
    setRegisterData({
      ...registerData,
      [e.target.name]: e.target.value
    });
    setError('');
  };

  const handleLogin = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError('');

    try {
      const response = await axios.post('http://localhost:8000/api/auth/login', {
        username: formData.username,
        password: formData.password
      });

      if (response.data.success) {
        onLogin(response.data.user, response.data.token);
        navigate('/');
      } else {
        setError(response.data.message || 'Login failed');
      }
    } catch (error) {
      setError('Login failed. Please check your credentials.');
      console.error('Login error:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleRegister = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError('');

    if (registerData.password !== registerData.confirmPassword) {
      setError('Passwords do not match');
      setLoading(false);
      return;
    }

    try {
      const response = await axios.post('http://localhost:8000/api/auth/register', {
        username: registerData.username,
        email: registerData.email,
        password: registerData.password
      });

      if (response.data.success) {
        setShowRegister(false);
        setError('');
        setFormData({
          username: registerData.username,
          password: registerData.password
        });
        // Auto login after successful registration
        setTimeout(() => {
          handleLogin(e);
        }, 500);
      } else {
        setError(response.data.message || 'Registration failed');
      }
    } catch (error) {
      setError('Registration failed. Username or email might already exist.');
      console.error('Registration error:', error);
    } finally {
      setLoading(false);
    }
  };

  const demoLogin = (username, password) => {
    setFormData({ username, password });
    setError('');
  };

  return (
    <div className="login-container d-flex align-items-center justify-content-center">
      <div className="container">
        <div className="row justify-content-center">
          <div className="col-lg-5 col-md-7">
            <div className="card login-card shadow-lg">
              <div className="card-body p-5">
                <div className="text-center mb-4">
                  <i className="fas fa-shopping-cart text-primary mb-3" style={{ fontSize: '3rem' }}></i>
                  <h2 className="fw-bold text-primary">MicroStore</h2>
                  <p className="text-muted">
                    {showRegister ? 'Create your account' : 'Sign in to your account'}
                  </p>
                </div>

                {error && (
                  <div className="alert alert-danger" role="alert">
                    <i className="fas fa-exclamation-triangle me-2"></i>
                    {error}
                  </div>
                )}

                {!showRegister ? (
                  // Login Form
                  <form onSubmit={handleLogin}>
                    <div className="mb-3">
                      <label htmlFor="username" className="form-label">
                        <i className="fas fa-user me-2"></i>Username
                      </label>
                      <input
                        type="text"
                        className="form-control"
                        id="username"
                        name="username"
                        value={formData.username}
                        onChange={handleInputChange}
                        required
                        placeholder="Enter your username"
                      />
                    </div>
                    
                    <div className="mb-4">
                      <label htmlFor="password" className="form-label">
                        <i className="fas fa-lock me-2"></i>Password
                      </label>
                      <input
                        type="password"
                        className="form-control"
                        id="password"
                        name="password"
                        value={formData.password}
                        onChange={handleInputChange}
                        required
                        placeholder="Enter your password"
                      />
                    </div>
                    
                    <button
                      type="submit"
                      className="btn btn-primary w-100 mb-3"
                      disabled={loading}
                    >
                      {loading ? (
                        <>
                          <span className="spinner-border spinner-border-sm me-2" role="status"></span>
                          Signing in...
                        </>
                      ) : (
                        <>
                          <i className="fas fa-sign-in-alt me-2"></i>
                          Sign In
                        </>
                      )}
                    </button>
                  </form>
                ) : (
                  // Register Form
                  <form onSubmit={handleRegister}>
                    <div className="mb-3">
                      <label htmlFor="reg-username" className="form-label">
                        <i className="fas fa-user me-2"></i>Username
                      </label>
                      <input
                        type="text"
                        className="form-control"
                        id="reg-username"
                        name="username"
                        value={registerData.username}
                        onChange={handleRegisterChange}
                        required
                        placeholder="Choose a username"
                      />
                    </div>
                    
                    <div className="mb-3">
                      <label htmlFor="email" className="form-label">
                        <i className="fas fa-envelope me-2"></i>Email
                      </label>
                      <input
                        type="email"
                        className="form-control"
                        id="email"
                        name="email"
                        value={registerData.email}
                        onChange={handleRegisterChange}
                        required
                        placeholder="Enter your email"
                      />
                    </div>
                    
                    <div className="mb-3">
                      <label htmlFor="reg-password" className="form-label">
                        <i className="fas fa-lock me-2"></i>Password
                      </label>
                      <input
                        type="password"
                        className="form-control"
                        id="reg-password"
                        name="password"
                        value={registerData.password}
                        onChange={handleRegisterChange}
                        required
                        placeholder="Choose a password"
                      />
                    </div>
                    
                    <div className="mb-4">
                      <label htmlFor="confirmPassword" className="form-label">
                        <i className="fas fa-lock me-2"></i>Confirm Password
                      </label>
                      <input
                        type="password"
                        className="form-control"
                        id="confirmPassword"
                        name="confirmPassword"
                        value={registerData.confirmPassword}
                        onChange={handleRegisterChange}
                        required
                        placeholder="Confirm your password"
                      />
                    </div>
                    
                    <button
                      type="submit"
                      className="btn btn-success w-100 mb-3"
                      disabled={loading}
                    >
                      {loading ? (
                        <>
                          <span className="spinner-border spinner-border-sm me-2" role="status"></span>
                          Creating account...
                        </>
                      ) : (
                        <>
                          <i className="fas fa-user-plus me-2"></i>
                          Create Account
                        </>
                      )}
                    </button>
                  </form>
                )}

                <div className="text-center">
                  <button
                    type="button"
                    className="btn btn-link text-decoration-none"
                    onClick={() => {
                      setShowRegister(!showRegister);
                      setError('');
                      setFormData({ username: '', password: '' });
                      setRegisterData({ username: '', email: '', password: '', confirmPassword: '' });
                    }}
                  >
                    {showRegister 
                      ? 'Already have an account? Sign in' 
                      : "Don't have an account? Register"
                    }
                  </button>
                </div>

                {/* Demo Accounts */}
                {!showRegister && (
                  <div className="mt-4 pt-4 border-top">
                    <p className="text-center text-muted small mb-3">Demo Accounts:</p>
                    <div className="d-grid gap-2">
                      <button
                        type="button"
                        className="btn btn-outline-secondary btn-sm"
                        onClick={() => demoLogin('admin', 'admin123')}
                      >
                        <i className="fas fa-crown me-2"></i>Admin Demo
                      </button>
                      <button
                        type="button"
                        className="btn btn-outline-secondary btn-sm"
                        onClick={() => demoLogin('john', 'john123')}
                      >
                        <i className="fas fa-user me-2"></i>User Demo
                      </button>
                    </div>
                  </div>
                )}

                <div className="text-center mt-4">
                  <Link to="/" className="btn btn-link text-decoration-none">
                    <i className="fas fa-arrow-left me-2"></i>
                    Back to Home
                  </Link>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Login;