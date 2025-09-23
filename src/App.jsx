/* eslint-disable no-undef */
/* eslint-disable no-unused-vars */
import React, { useState, useEffect, Suspense, lazy, useCallback, useMemo } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { parseISO } from "date-fns";
import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";

// Componentes principais
import AuthModal from "./components/AuthModal";
import Header from "./components/Header";
import ErrorBoundary from "./components/ErrorBoundary";
import Loader from "./components/Loader";
import ToastNotifications from "./components/ToastNotifications";
import FAQ from "./components/FAQ";

// Lazy loading para componentes pesados
const MainContent = lazy(() => import("./components/MainContent"));
const AdminPanel = lazy(() => import("./AdminDashboard"));
const Landing = lazy(() => import("./components/CambioLanding"));

// Hooks e utilitários
import { useAuth } from "./context/AuthContext";
import { fetchRates, exportData } from "./services/api";
import { useNetworkStatus } from "./utils/performanceUtils";
import { useNotifications } from "./utils/notifications";
import "./index.css";

const formatRates = (rates = []) => {
  console.log("Raw rates data received:", rates);

  if (!rates || !Array.isArray(rates)) {
    console.warn("Rates data is not valid:", rates);
    return [];
  }

  if (rates.length === 0) {
    console.warn("No rates data available");
    return [];
  }

  const processedRates = rates
    .filter((rate) => {
      if (!rate) {
        console.warn("Null or undefined rate found");
        return false;
      }
      if (!rate.date) {
        console.warn("Rate without date found:", rate);
        return false;
      }
      return true;
    })
    .map((rate, index) => {
      try {
        // Handle different date formats
        let parsedDate;
        if (rate.date instanceof Date) {
          parsedDate = rate.date;
        } else if (typeof rate.date === "string") {
          parsedDate = new Date(rate.date);
        } else {
          console.warn(`Invalid date format at index ${index}:`, rate.date);
          parsedDate = new Date();
        }

        // Check if date is valid
        if (isNaN(parsedDate.getTime())) {
          console.warn(`Invalid date at index ${index}:`, rate.date);
          parsedDate = new Date();
        }

        const processedRate = {
          ...rate,
          date: parsedDate,
          // Ensure all currency values are numbers with fallbacks
          usdBuy: parseFloat(rate.usdBuy) || 0,
          usdSell: parseFloat(rate.usdSell) || 0,
          eurBuy: parseFloat(rate.eurBuy) || 0,
          eurSell: parseFloat(rate.eurSell) || 0,
          zarBuy: parseFloat(rate.zarBuy) || 0,
          zarSell: parseFloat(rate.zarSell) || 0,
          cadBuy: parseFloat(rate.cadBuy) || 0,
          cadSell: parseFloat(rate.cadSell) || 0,
        };

        console.log(`Processed rate ${index}:`, {
          date: processedRate.date,
          usdSell: processedRate.usdSell,
          eurSell: processedRate.eurSell,
        });

        return processedRate;
      } catch (error) {
        console.error(`Error processing rate at index ${index}:`, rate, error);
        return null;
      }
    })
    .filter(Boolean) // Remove any null results
    .sort((a, b) => new Date(b.date) - new Date(a.date)); // Sort by date descending

  console.log("Final processed rates:", processedRates);
  return processedRates;
};

const formatDate = (date, format = "short") => {
  const d = new Date(date);
  const options = {
    short: { day: "2-digit", month: "short" },
    long: { weekday: "long", day: "numeric", month: "long" },
    full: { day: "2-digit", month: "2-digit", year: "numeric" },
  };
  return d.toLocaleDateString("pt-AO", options[format]);
};

// Simplified Button Component
export const Button = ({
  variant = "primary",
  size = "md",
  children,
  className = "",
  ...props
}) => {
  const baseClasses =
    "inline-flex items-center justify-center font-medium transition-colors focus:outline-none focus:ring-2 focus:ring-offset-2 disabled:opacity-50 disabled:cursor-not-allowed";

  const variants = {
    primary: "bg-blue-600 text-white hover:bg-blue-700 focus:ring-blue-500",
    secondary:
      "bg-white text-blue-600 border border-blue-200 hover:bg-blue-50 focus:ring-blue-500",
    success: "bg-green-600 text-white hover:bg-green-700 focus:ring-green-500",
    warning: "bg-amber-600 text-white hover:bg-amber-700 focus:ring-amber-500",
    danger: "bg-red-600 text-white hover:bg-red-700 focus:ring-red-500",
  };

  const sizes = {
    sm: "px-3 py-1.5 text-sm rounded-md",
    md: "px-4 py-2 text-sm rounded-lg",
    lg: "px-6 py-3 text-base rounded-lg",
  };

  return (
    <motion.button
      whileHover={{ scale: 1.02 }}
      whileTap={{ scale: 0.98 }}
      className={`${baseClasses} ${variants[variant]} ${sizes[size]} ${className}`}
      {...props}
    >
      {children}
    </motion.button>
  );
};

// Simplified Card Component
export const Card = ({ children, className = "", padding = "p-6" }) => (
  <motion.div
    initial={{ opacity: 0, y: 20 }}
    animate={{ opacity: 1, y: 0 }}
    className={`bg-white rounded-xl border border-slate-200 shadow-sm ${padding} ${className}`}
  >
    {children}
  </motion.div>
);

// Offline Indicator Component
const OfflineIndicator = ({ isOnline }) => (
  <AnimatePresence>
    {!isOnline && (
      <motion.div
        initial={{ opacity: 0, y: -50 }}
        animate={{ opacity: 1, y: 0 }}
        exit={{ opacity: 0, y: -50 }}
        className="fixed top-0 left-0 right-0 bg-amber-500 text-white text-center py-2 z-50 shadow-lg"
      >
        <div className="flex items-center justify-center space-x-2">
          <span className="text-sm">📡</span>
          <span className="font-semibold">Modo Offline</span>
          <span className="text-amber-100">- Mostrando dados em cache</span>
        </div>
      </motion.div>
    )}
  </AnimatePresence>
);

// Loading Screen Component
const LoadingScreen = ({ message }) => (
  <div className="min-h-screen flex flex-col items-center justify-center bg-gradient-to-br from-blue-900 to-purple-900">
    <div className="text-center">
      <motion.div
        className="w-24 h-24 bg-gradient-to-br from-blue-400 to-purple-500 rounded-3xl flex items-center justify-center shadow-lg mx-auto mb-6"
        animate={{ scale: [1, 1.1, 1] }}
        transition={{ duration: 1.5, repeat: Infinity }}
      >
        <span className="text-3xl">💱</span>
      </motion.div>
      <h2 className="text-3xl font-bold text-white mb-2">Câmbio Angola</h2>
      <p className="text-blue-200 mb-6">{message}</p>
      <div className="w-64 h-2 bg-white/20 rounded-full mx-auto overflow-hidden">
        <motion.div
          className="h-full bg-gradient-to-r from-blue-400 to-purple-500 rounded-full"
          animate={{ x: ["-100%", "100%"] }}
          transition={{ duration: 1.5, repeat: Infinity, ease: "easeInOut" }}
        />
      </div>
    </div>
  </div>
);

// App principal
export default function App() {
  const [selectedCurrency, setSelectedCurrency] = useState("usd");
  
  // Replace useCachedData with simple state management
  const [rates, setRates] = useState([]);
  const [ratesLoading, setRatesLoading] = useState(true);
  const [ratesError, setRatesError] = useState(null);

  const {
    isLoggedIn,
    isPremium,
    isAdmin,
    setShowAuthForm,
    setIsRegisterForm,
    logout,
    loading: authLoading,
  } = useAuth();

  const { isOnline } = useNetworkStatus();
  const {
    notifications: toastNotifications,
    removeNotification,
    success,
    error: notifyError,
  } = useNotifications();

  // Simple, reliable data fetching
  const loadRates = useCallback(async () => {
    try {
      setRatesLoading(true);
      setRatesError(null);
      
      console.log("🔄 Loading rates...");
      const data = await fetchRates();
      console.log("📊 API returned:", data);
      
      if (data && Array.isArray(data)) {
        setRates(data);
        console.log("✅ Rates set successfully:", data.length, "items");
      } else {
        console.warn("⚠️ Invalid data format:", data);
        setRates([]);
      }
    } catch (error) {
      console.error("❌ Error loading rates:", error);
      setRatesError(error.message);
      setRates([]); // Set empty array on error
    } finally {
      setRatesLoading(false);
    }
  }, []);

  // Load on mount
  useEffect(() => {
    loadRates();
  }, [loadRates]);

  // Auto-refresh every 5 minutes
  useEffect(() => {
    const interval = setInterval(loadRates, 5 * 60 * 1000);
    return () => clearInterval(interval);
  }, [loadRates]);

  // Temporary debug - remove after fixing
  useEffect(() => {
    const debugAPI = async () => {
      try {
        console.log("=== DEBUG: Testing API direct call ===");

        // Test 1: Check API base URL
        console.log(
          "API Base URL:",
          import.meta.env.VITE_API_URL || "http://localhost:5000"
        );

        // Test 2: Try direct fetch
        const response = await fetch(
          `${import.meta.env.VITE_API_URL || "http://localhost:5000"}/api/rates`
        );
        console.log("Direct fetch response status:", response.status);
        console.log("Direct fetch response headers:", [
          ...response.headers.entries(),
        ]);

        if (response.ok) {
          const data = await response.json();
          console.log("Direct fetch data:", data);
        } else {
          console.error("Direct fetch failed:", await response.text());
        }

        // Test 3: Try with your API function
        const apiData = await fetchRates();
        console.log("fetchRates() result:", apiData);

        console.log("=== END DEBUG ===");
      } catch (error) {
        console.error("Debug API test failed:", error);
      }
    };

    // Only run once for debugging
    if (process.env.NODE_ENV === "development") {
      debugAPI();
    }
  }, []); // Run once on mount

  const currencies = [
    { name: "Dólar", code: "usd", flag: "🇺🇸" },
    { name: "Euro", code: "eur", flag: "🇪🇺" },
    { name: "Rand", code: "zar", flag: "🇿🇦" },
    { name: "Dólar Can.", code: "cad", flag: "🇨🇦" },
  ];

  const processedRates = useMemo(() => {
    console.log("🔄 Processing rates:", rates);
    if (!rates) return [];
    const processed = formatRates(rates);
    console.log("✅ Processed rates:", processed.length, "items");
    return processed;
  }, [rates]);

  const todayRates = processedRates.length > 0 ? processedRates[0] : null;
  
  console.log("🎯 Final data for render:", {
    rates: rates?.length || 0,
    processedRates: processedRates.length,
    todayRates: !!todayRates,
    loading: ratesLoading
  });

  const handleExport = async () => {
    try {
      if (!isOnline) {
        notifyError("Exportação não disponível offline");
        return;
      }

      const token = localStorage.getItem("token");
      if (!token) {
        setShowAuthForm(true);
        notifyError("Faça login para exportar dados");
        return;
      }

      await exportData(token);
      success("Exportação iniciada! Verifique os downloads.");
    } catch (error) {
      console.error("Erro na exportação:", error);
      notifyError(`Erro na exportação: ${error.message}`);
    }
  };

  // Connectivity notifications
  useEffect(() => {
    let timeout;
    
    if (isOnline && !navigator.onLine) {
      timeout = setTimeout(() => {
        success("Conexão restaurada! Atualizando dados...");
        loadRates();
      }, 500);
    } else if (!isOnline && navigator.onLine) {
      timeout = setTimeout(() => {
        notifyError("Conexão perdida. Usando dados em cache.");
      }, 500);
    }

    return () => {
      if (timeout) clearTimeout(timeout);
    };
  }, [isOnline, success, notifyError, loadRates]);

  // Loading states
  if (authLoading) {
    return <LoadingScreen message="Verificando autenticação..." />;
  }

  if (ratesLoading && rates.length === 0) {
    return <LoadingScreen message="Carregando taxas de câmbio..." />;
  }

  // Error state
  if (ratesError && rates.length === 0) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center bg-gradient-to-br from-red-900 to-red-800 text-white">
        <div className="text-center max-w-md">
          <div className="w-24 h-24 bg-red-500 rounded-3xl flex items-center justify-center mx-auto mb-6">
            <span className="text-3xl">⚠️</span>
          </div>
          <h2 className="text-3xl font-bold mb-4">Erro de Conexão</h2>
          <p className="text-red-100 mb-6">
            {ratesError}
          </p>
          <button
            onClick={loadRates}
            className="bg-white text-red-600 px-6 py-3 rounded-xl font-semibold hover:bg-red-50 transition-colors"
          >
            Tentar Novamente
          </button>
        </div>
      </div>
    );
  }

  // Admin Panel
  if (isAdmin) {
    return (
      <ErrorBoundary>
        <OfflineIndicator isOnline={isOnline} />
        <Suspense fallback={<Loader />}>
          <div
            className="min-h-screen bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900"
            style={{ paddingTop: !isOnline ? "40px" : "0" }}
          >
            <div className="p-8">
              <div className="flex justify-between items-center mb-8">
                <div>
                  <h1 className="text-3xl font-black text-white">
                    Painel Administrativo
                  </h1>
                  {!isOnline && (
                    <p className="text-amber-300 text-sm mt-1">
                      Modo offline - funcionalidades limitadas
                    </p>
                  )}
                  {ratesError && (
                    <p className="text-red-300 text-sm mt-1">
                      Erro ao carregar dados - usando cache
                    </p>
                  )}
                </div>
                <button
                  onClick={logout}
                  className="px-6 py-3 bg-red-500 text-white rounded-xl font-semibold hover:bg-red-600 transition"
                >
                  Sair
                </button>
              </div>
              <AdminPanel todayRates={todayRates} />
            </div>
          </div>
        </Suspense>
      </ErrorBoundary>
    );
  }

  // AppShell
  const AppShell = () => (
    <ErrorBoundary>
      <OfflineIndicator isOnline={isOnline} />
      <Suspense fallback={<Loader />}>
        <div
          className="min-h-screen bg-slate-50 relative"
          style={{ paddingTop: !isOnline ? "40px" : "0" }}
        >
          {/* Background leve */}
          <motion.div
            className="absolute top-20 right-20 w-48 h-48 bg-blue-400/10 rounded-full blur-2xl"
            animate={{ x: [0, 30, 0], y: [0, -20, 0] }}
            transition={{ duration: 15, repeat: Infinity, ease: "easeInOut" }}
          />

          <div className="relative z-10 p-6">
            <div className="max-w-7xl mx-auto space-y-8">
              {/* Show loading indicator if refreshing */}
              {ratesLoading && rates.length > 0 && (
                <div className="bg-blue-50 border-l-4 border-blue-400 p-4 rounded-r-lg">
                  <div className="flex items-center">
                    <div className="w-4 h-4 border-2 border-blue-500 border-t-transparent rounded-full animate-spin mr-3" />
                    <p className="text-blue-700 text-sm">Atualizando dados...</p>
                  </div>
                </div>
              )}

              {/* Show error if we have cached data but refresh failed */}
              {ratesError && rates.length > 0 && (
                <div className="bg-amber-50 border-l-4 border-amber-400 p-4 rounded-r-lg">
                  <p className="text-amber-700 text-sm">
                    Erro na atualização: {ratesError} - usando dados em cache
                  </p>
                  <button 
                    onClick={loadRates}
                    className="mt-2 text-sm bg-amber-600 text-white px-3 py-1 rounded hover:bg-amber-700"
                  >
                    Tentar Novamente
                  </button>
                </div>
              )}

              <Header
                todayRates={todayRates}
                setShowAuthForm={setShowAuthForm}
                setIsRegisterForm={setIsRegisterForm}
              />
              
              <MainContent
                rates={processedRates}
                currencies={currencies}
                isPremium={isPremium}
                selectedCurrency={selectedCurrency}
                setSelectedCurrency={setSelectedCurrency}
                exportRates={handleExport}
                formatDate={formatDate}
              />
              
              <FAQ />
            </div>
          </div>

          <AnimatePresence>{!isLoggedIn && <AuthModal />}</AnimatePresence>
        </div>
      </Suspense>
    </ErrorBoundary>
  );

  // Router
  return (
    <BrowserRouter>
      <Routes>
        <Route
          path="/"
          element={
            <Suspense fallback={<Loader />}>
              <OfflineIndicator isOnline={isOnline} />
              <div style={{ paddingTop: !isOnline ? "40px" : "0" }}>
                <Landing />
              </div>
            </Suspense>
          }
        />
        <Route
          path="/app/*"
          element={isLoggedIn ? <AppShell /> : <Navigate to="/" replace />}
        />
        <Route path="/public" element={<AppShell />} />
        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>

      {/* Sistema de notificações */}
      <ToastNotifications
        notifications={toastNotifications}
        onRemove={removeNotification}
      />
    </BrowserRouter>
  );
}