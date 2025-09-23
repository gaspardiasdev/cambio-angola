/* eslint-disable no-unused-vars */
import { useState } from "react";
import { motion } from "framer-motion";
import { useAuth } from "../context/AuthContext";
import { Button } from "../App";

/* Small inline icons to avoid react-icons issues */
function MenuIcon(props) {
  return (
    <svg viewBox="0 0 24 24" width="24" height="24" fill="none" {...props}>
      <path
        d="M4 6h16M4 12h16M4 18h16"
        stroke="currentColor"
        strokeWidth="2"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
}
function CloseIcon(props) {
  return (
    <svg viewBox="0 0 24 24" width="24" height="24" fill="none" {...props}>
      <path
        d="M6 6l12 12M6 18L18 6"
        stroke="currentColor"
        strokeWidth="2"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
}

export default function Header({ todayRates }) {
  const { isLoggedIn, logout, setShowAuthForm, setIsRegisterForm, user } =
    useAuth() || {};
  const [mobileOpen, setMobileOpen] = useState(false);

  const handleLoginClick = () => {
    setIsRegisterForm(false);
    setShowAuthForm(true);
    setMobileOpen(false);
  };

  const handleRegisterClick = () => {
    setIsRegisterForm(true);
    setShowAuthForm(true);
    setMobileOpen(false);
  };

  const contactEmail = "contato@cambio.ao";

  return (
    <header className="sticky top-0 z-50">
      <div className="bg-slate-800 text-slate-100 text-xs">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-7">
            {/* Left: email + status (hidden on xs) */}
            <div className="flex items-center space-x-3">
              <div className="hidden sm:flex items-center text-xs text-slate-200 space-x-2">
                <span
                  className="truncate max-w-[320px]"
                  title={user?.email ?? contactEmail}
                >
                  {user?.email ?? contactEmail}
                </span>
                <span className="w-2 h-2 bg-green-400 rounded-full animate-pulse" />
              </div>
            </div>

            {/* Right: user name / fallback */}
            <div className="flex items-center space-x-2">
              <span className="hidden sm:inline text-xs text-slate-300">
                Olá,
              </span>
              <span
                className="text-xs font-medium truncate max-w-[160px]"
                title={user?.name ?? user?.email ?? "Convidado"}
              >
                {user?.name
                  ? user.name
                  : user?.email
                  ? user.email.split("@")[0]
                  : "Convidado"}
              </span>
            </div>
          </div>
        </div>
      </div>
      <div className="bg-white border-b border-slate-200">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-16">
            <div className="flex items-center space-x-3">
              <div className="w-8 h-8 bg-blue-600 rounded-lg flex items-center justify-center shrink-0">
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

              <div className="leading-tight">
                <h1 className="text-lg font-semibold text-slate-900">
                  Câmbio Angola
                </h1>
                <p className="text-xs text-slate-500 hidden sm:block">
                  Taxas em tempo real
                </p>
              </div>
            </div>

            <div className="hidden md:flex items-center space-x-4 px-4 py-2 bg-slate-50 rounded-lg">
              {todayRates ? (
                <>
                  <div className="flex items-center space-x-2">
                    <span className="text-lg">🇺🇸</span>
                    <div>
                      <p className="text-sm font-medium text-slate-900">
                        {todayRates.usdSell} KZ
                      </p>
                      <p className="text-xs text-slate-500">USD/AOA</p>
                    </div>
                  </div>
                  <div className="w-2 h-2 bg-green-500 rounded-full animate-pulse" />
                </>
              ) : (
                <div className="text-sm text-slate-500">
                  Taxas indisponíveis
                </div>
              )}
            </div>

            <div className="hidden sm:flex items-center space-x-2">
              {isLoggedIn ? (
                <motion.div
                  whileHover={{ scale: 1.02 }}
                  whileTap={{ scale: 0.98 }}
                >
                  <Button
                    variant="secondary"
                    size="sm"
                    onClick={() => logout()}
                  >
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

            <div className="flex items-center sm:hidden">
              <button
                aria-label="Abrir menu"
                onClick={() => setMobileOpen((s) => !s)}
                className="p-2 rounded-md hover:bg-slate-100 focus:outline-none focus:ring-2 focus:ring-slate-300"
              >
                {mobileOpen ? (
                  <CloseIcon className="w-6 h-6" />
                ) : (
                  <MenuIcon className="w-6 h-6" />
                )}
              </button>
            </div>
          </div>
        </div>

        <motion.div
          initial={{ height: 0, opacity: 0 }}
          animate={
            mobileOpen
              ? { height: "auto", opacity: 1 }
              : { height: 0, opacity: 0 }
          }
          transition={{ duration: 0.18 }}
          className="sm:hidden overflow-hidden border-t border-slate-100"
        >
          <div className="px-4 py-3 space-y-3">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-slate-900">
                  {todayRates?.usdSell ?? "—"} KZ
                </p>
                <p className="text-xs text-slate-500">USD/AOA</p>
              </div>
              <div className="w-2 h-2 bg-green-500 rounded-full animate-pulse" />
            </div>

            <div className="flex items-center space-x-2">
              {isLoggedIn ? (
                <Button
                  variant="secondary"
                  size="sm"
                  onClick={() => {
                    logout();
                    setMobileOpen(false);
                  }}
                >
                  Sair
                </Button>
              ) : (
                <>
                  <Button
                    variant="secondary"
                    size="sm"
                    onClick={handleLoginClick}
                  >
                    Entrar
                  </Button>
                  <Button
                    variant="primary"
                    size="sm"
                    onClick={handleRegisterClick}
                  >
                    Registar
                  </Button>
                </>
              )}
            </div>

            <div className="pt-2 border-t border-slate-100">
              <p className="text-xs text-slate-500">
                Email:{" "}
                <a
                  className="underline"
                  href={`mailto:${user?.email ?? contactEmail}`}
                >
                  {user?.email ?? contactEmail}
                </a>
              </p>
            </div>
          </div>
        </motion.div>
      </div>
    </header>
  );
}
