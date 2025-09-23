/* eslint-disable no-undef */
/* eslint-disable no-unused-vars */
import React, { useState } from 'react';
import { GoogleOAuthProvider, GoogleLogin, googleLogout } from '@react-oauth/google';
import { jwtDecode } from 'jwt-decode';

// Your Google Client ID (replace with your actual client ID)
const GOOGLE_CLIENT_ID = process.env.REACT_APP_GOOGLE_CLIENT_ID || "your-google-client-id.apps.googleusercontent.com";

// Google OAuth Integration Component
const GoogleAuthButton = ({ isLogin = true, onSuccess, onError }) => {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const handleGoogleSuccess = async (credentialResponse) => {
    try {
      setLoading(true);
      setError("");

      // Decode the JWT token from Google
      const decoded = jwtDecode(credentialResponse.credential);
      
      // Extract user information
      const googleUser = {
        email: decoded.email,
        name: decoded.name,
        picture: decoded.picture,
        sub: decoded.sub, // Google ID
      };

      // Send to your backend for verification and user creation/login
      const response = await fetch(`${process.env.REACT_APP_API_URL || 'http://localhost:5000'}/api/auth/google`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          credential: credentialResponse.credential,
          clientId: credentialResponse.clientId,
          userInfo: googleUser
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.message || 'Erro na autenticação Google');
      }

      // Call the success callback
      if (onSuccess) {
        onSuccess(data);
      }

    } catch (error) {
      console.error('Google OAuth Error:', error);
      const errorMessage = error.message || 'Erro na autenticação com Google';
      setError(errorMessage);
      if (onError) {
        onError(errorMessage);
      }
    } finally {
      setLoading(false);
    }
  };

  const handleGoogleError = () => {
    const errorMessage = 'Falha na autenticação Google. Tente novamente.';
    setError(errorMessage);
    if (onError) {
      onError(errorMessage);
    }
  };

  return (
    <div className="google-auth-container">
      {error && (
        <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded mb-4">
          {error}
        </div>
      )}
      
      <GoogleLogin
        onSuccess={handleGoogleSuccess}
        onError={handleGoogleError}
        size="large"
        theme="outline"
        text={isLogin ? "signin_with" : "signup_with"}
        shape="rectangular"
        logo_alignment="left"
        width="300"
        disabled={loading}
      />
      
      {loading && (
        <div className="text-center mt-2">
          <span className="text-sm text-gray-500">Autenticando...</span>
        </div>
      )}
    </div>
  );
};

// Enhanced Auth Form Component with Google Integration
const AuthFormWithGoogle = ({ 
  showForm, 
  onClose, 
  isRegister, 
  onToggleMode, 
  onTraditionalAuth, 
  authMessage,
  loading 
}) => {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [localError, setLocalError] = useState("");

  const handleSubmit = (e) => {
    e.preventDefault();
    setLocalError("");
    
    if (onTraditionalAuth) {
      onTraditionalAuth(email, password, isRegister);
    }
  };

  const handleGoogleSuccess = (data) => {
    // Google authentication was successful
    console.log('Google auth success:', data);
    setLocalError("");
    if (onClose) onClose();
  };

  const handleGoogleError = (error) => {
    setLocalError(error);
  };

  if (!showForm) return null;

  return (
    <GoogleOAuthProvider clientId={GOOGLE_CLIENT_ID}>
      <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
        <div className="bg-white p-8 rounded-lg max-w-md w-full mx-4">
          <div className="flex justify-between items-center mb-6">
            <h2 className="text-2xl font-bold">
              {isRegister ? "Criar Conta" : "Entrar"}
            </h2>
            <button
              onClick={onClose}
              className="text-gray-500 hover:text-gray-700 text-xl font-bold"
            >
              ×
            </button>
          </div>

          {/* Google OAuth Button */}
          <div className="mb-6">
            <GoogleAuthButton 
              isLogin={!isRegister}
              onSuccess={handleGoogleSuccess}
              onError={handleGoogleError}
            />
          </div>

          {/* Divider */}
          <div className="flex items-center my-6">
            <hr className="flex-grow border-gray-300" />
            <span className="px-3 text-gray-500 text-sm">ou</span>
            <hr className="flex-grow border-gray-300" />
          </div>

          {/* Traditional Email/Password Section */}
          <div className="space-y-4">
            {(authMessage || localError) && (
              <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded">
                {authMessage || localError}
              </div>
            )}

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Email
              </label>
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                disabled={loading}
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Password
              </label>
              <input
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
                minLength={8}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                disabled={loading}
              />
            </div>

            <button
              onClick={handleSubmit}
              disabled={loading || !email || !password}
              className="w-full bg-blue-600 text-white py-2 px-4 rounded-md hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {loading
                ? "Processando..."
                : isRegister
                ? "Criar Conta"
                : "Entrar"
              }
            </button>
          </div>

          {/* Toggle between login/register */}
          <div className="text-center mt-4">
            <button
              onClick={onToggleMode}
              className="text-blue-600 hover:text-blue-800 text-sm"
            >
              {isRegister
                ? "Já tem conta? Faça login"
                : "Não tem conta? Registre-se"
              }
            </button>
          </div>
        </div>
      </div>
    </GoogleOAuthProvider>
  );
};

// Logout component with Google logout support
const LogoutButton = ({ onLogout, className = "" }) => {
  const handleLogout = () => {
    // Logout from Google if user logged in with Google
    try {
      googleLogout();
    } catch (error) {
      console.log('No Google session to logout');
    }
    
    // Call the logout callback
    if (onLogout) {
      onLogout();
    }
  };

  return (
    <button
      onClick={handleLogout}
      className={`bg-red-600 text-white px-4 py-2 rounded-md hover:bg-red-700 transition-colors ${className}`}
    >
      Sair
    </button>
  );
};

// Main App wrapper with GoogleOAuthProvider
const AppWithGoogleAuth = ({ children }) => {
  return (
    <GoogleOAuthProvider clientId={GOOGLE_CLIENT_ID}>
      {children}
    </GoogleOAuthProvider>
  );
};

// Demo component showing how to integrate with your existing auth
const GoogleAuthDemo = () => {
  const [showAuthForm, setShowAuthForm] = useState(false);
  const [isRegisterForm, setIsRegisterForm] = useState(false);
  const [user, setUser] = useState(null);
  const [authMessage, setAuthMessage] = useState("");
  const [loading, setLoading] = useState(false);

  const handleTraditionalAuth = async (email, password, isRegister) => {
    setLoading(true);
    setAuthMessage("");
    
    try {
      // Simulate API call to your existing auth endpoints
      const endpoint = isRegister ? '/api/auth/register' : '/api/auth/login';
      const response = await fetch(`http://localhost:5000${endpoint}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, password })
      });
      
      const data = await response.json();
      
      if (response.ok) {
        if (!isRegister) {
          setUser(data.user);
          localStorage.setItem('userSession', JSON.stringify({
            token: data.token,
            ...data.user
          }));
        }
        setShowAuthForm(false);
        setAuthMessage("");
      } else {
        setAuthMessage(data.message);
      }
    } catch (error) {
      setAuthMessage('Erro de conexão. Tente novamente.');
    } finally {
      setLoading(false);
    }
  };

  const handleLogout = () => {
    setUser(null);
    localStorage.removeItem('userSession');
  };

  return (
    <div className="min-h-screen bg-gray-50 p-8">
      <div className="max-w-md mx-auto">
        <h1 className="text-3xl font-bold text-center mb-8">
          Google OAuth Demo
        </h1>
        
        {user ? (
          <div className="bg-white p-6 rounded-lg shadow-md">
            <h2 className="text-xl font-semibold mb-4">Bem-vindo!</h2>
            <p className="mb-4">Email: {user.email}</p>
            <LogoutButton onLogout={handleLogout} />
          </div>
        ) : (
          <div className="space-y-4">
            <button
              onClick={() => {
                setIsRegisterForm(false);
                setShowAuthForm(true);
              }}
              className="w-full bg-blue-600 text-white py-3 px-4 rounded-md hover:bg-blue-700"
            >
              Fazer Login
            </button>
            <button
              onClick={() => {
                setIsRegisterForm(true);
                setShowAuthForm(true);
              }}
              className="w-full bg-green-600 text-white py-3 px-4 rounded-md hover:bg-green-700"
            >
              Criar Conta
            </button>
          </div>
        )}

        <AuthFormWithGoogle
          showForm={showAuthForm}
          onClose={() => setShowAuthForm(false)}
          isRegister={isRegisterForm}
          onToggleMode={() => setIsRegisterForm(!isRegisterForm)}
          onTraditionalAuth={handleTraditionalAuth}
          authMessage={authMessage}
          loading={loading}
        />
      </div>
    </div>
  );
};

export default AppWithGoogleAuth;
export { AuthFormWithGoogle, LogoutButton, GoogleAuthButton, GoogleAuthDemo };