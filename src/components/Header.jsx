/* eslint-disable no-unused-vars */
import { motion } from "framer-motion";
import { useAuth } from "../context/AuthContext";
import { Button } from "../App";

export default function Header({ todayRates }) {
  const { isLoggedIn, logout, setShowAuthForm, setIsRegisterForm } = useAuth();

  const handleLoginClick = () => {
    setIsRegisterForm(false);
    setShowAuthForm(true);
  };

  const handleRegisterClick = () => {
    setIsRegisterForm(true);
    setShowAuthForm(true);
  };

  return (
    <header className="bg-white border-b border-slate-200 sticky top-0 z-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between items-center h-16">
          {/* Logo - Simple and Clean */}
          <div className="flex items-center space-x-3">
            <div className="w-8 h-8 bg-blue-600 rounded-lg flex items-center justify-center">
              <svg
                className="w-4 h-4 text-white"
                fill="currentColor"
                viewBox="0 0 20 20"
              >
                <path d="M8.433 7.418c.155-.103.346-.196.567-.267v1.698a2.305 2.305 0 01-.567-.267C8.07 8.34 8 8.114 8 8c0-.114.07-.34.433-.582zM11 12.849v-1.698c.22.071.412.164.567.267.364.243.433.468.433.582 0 .114-.07.34-.433.582a2.305 2.305 0 01-.567.267z" />
                <path
                  fillRule="evenodd"
                  d="M10 18a8 8 0 100-16 8 8 0 000 16zm1-13a1 1 0 10-2 0v.092a4.535 4.535 0 00-1.676.662C6.602 6.234 6 7.009 6 8c0 .99.602 1.765 1.324 2.246.48.32 1.054.545 1.676.662v1.941c-.391-.127-.68-.317-.843-.504a1 1 0 10-1.51 1.31c.562.649 1.413 1.076 2.353 1.253V15a1 1 0 102 0v-.092a4.535 4.535 0 001.676-.662C13.398 13.766 14 12.991 14 12c0-.99-.602-1.765-1.324-2.246A4.535 4.535 0 0011 9.092V7.151c.391.127.68.317.843.504a1 1 0 101.511-1.31c-.563-.649-1.413-1.076-2.354-1.253V5z"
                  clipRule="evenodd"
                />
              </svg>
            </div>
            <div>
              <h1 className="text-lg font-semibold text-slate-900">
                Câmbio Angola
              </h1>
              <p className="text-xs text-slate-500 hidden sm:block">
                Taxas em tempo real
              </p>
            </div>
          </div>

          {/* Current Rate - Subtle Display */}
          {todayRates && (
            <motion.div
              className="hidden md:flex items-center space-x-4 px-4 py-2 bg-slate-50 rounded-lg"
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ duration: 0.3 }}
            >
              <div className="flex items-center space-x-2">
                <span className="text-lg">🇺🇸</span>
                <div>
                  <p className="text-sm font-medium text-slate-900">
                    {todayRates.usdSell} KZ
                  </p>
                  <p className="text-xs text-slate-500">USD/AOA</p>
                </div>
              </div>
              <div className="w-2 h-2 bg-green-500 rounded-full animate-pulse"></div>
            </motion.div>
          )}

          {/* Auth Buttons - Clean */}
          <div className="flex items-center space-x-2">
            {isLoggedIn ? (
              <motion.div
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.98 }}
              >
                <Button variant="secondary" size="sm" onClick={() => logout()}>
                  Sair
                </Button>
              </motion.div>
            ) : (
              <>
                <motion.div
                  whileHover={{ scale: 1.02 }}
                  whileTap={{ scale: 0.98 }}
                >
                  <Button
                    variant="secondary"
                    size="sm"
                    onClick={handleLoginClick}
                  >
                    Entrar
                  </Button>
                </motion.div>
                <motion.div
                  whileHover={{ scale: 1.02 }}
                  whileTap={{ scale: 0.98 }}
                >
                  <Button
                    variant="primary"
                    size="sm"
                    onClick={handleRegisterClick}
                  >
                    Registar
                  </Button>
                </motion.div>
              </>
            )}
          </div>
        </div>
      </div>
    </header>
  );
}
