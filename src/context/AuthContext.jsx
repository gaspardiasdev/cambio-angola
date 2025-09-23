/* eslint-disable react-refresh/only-export-components */
import React, {
  createContext,
  useState,
  useEffect,
  useContext,
  useCallback,
  useRef,
} from "react";
import { logger, notifications } from "../utils/notifications";

const AuthContext = createContext();

export const AuthProvider = ({ children }) => {
  const [token, setToken] = useState(null);
  const [user, setUser] = useState(null);
  const [showAuthForm, setShowAuthForm] = useState(false);
  const [isRegisterForm, setIsRegisterForm] = useState(false);
  const [authMessage, setAuthMessage] = useState("");
  const [loading, setLoading] = useState(true);

  // Refs para controle de estado
  const mountedRef = useRef(true);
  const sessionCheckedRef = useRef(false);
  const validationTimeoutRef = useRef(null);

  // Derivar propriedades do user object
  const isLoggedIn = !!token && !!user;
  const isPremium = user?.isPremium || false;
  const isAdmin = user?.isAdmin || false;

  // Função para validar JWT
  const isTokenValid = useCallback((token) => {
    if (!token) return false;

    try {
      const payload = JSON.parse(atob(token.split(".")[1]));
      const currentTime = Date.now() / 1000;

      // Adicionar margem de 5 minutos para evitar expiração prematura
      if (payload.exp && payload.exp < (currentTime + 300)) {
        return false;
      }

      return true;
    } catch (error) {
      logger.error("Token inválido", { details: error.message });
      return false;
    }
  }, []);

  // Função para extrair dados do token
  const extractTokenData = useCallback((token) => {
    try {
      const payload = JSON.parse(atob(token.split(".")[1]));
      return {
        userId: payload.userId || payload.id,
        email: payload.email,
        isPremium: payload.isPremium || false,
        isAdmin: payload.isAdmin || false,
        exp: payload.exp,
      };
    } catch (error) {
      logger.error("Erro ao extrair dados do token", {
        details: error.message,
      });
      return null;
    }
  }, []);

  // Função de login otimizada
  const login = useCallback(
    (newToken, userData = null) => {
      if (!newToken || !isTokenValid(newToken)) {
        const message = "Token inválido ou expirado.";
        setAuthMessage(message);
        notifications.error(message);
        return false;
      }

      const tokenData = extractTokenData(newToken);
      if (!tokenData) {
        const message = "Erro ao processar dados de autenticação.";
        setAuthMessage(message);
        notifications.error(message);
        return false;
      }

      const finalUserData = {
        id: tokenData.userId,
        email: userData?.email || tokenData.email,
        isPremium:
          userData?.isPremium !== undefined
            ? userData.isPremium
            : tokenData.isPremium,
        isAdmin:
          userData?.isAdmin !== undefined
            ? userData.isAdmin
            : tokenData.isAdmin,
      };

      // Salvar sessão
      try {
        localStorage.setItem(
          "userSession",
          JSON.stringify({
            token: newToken,
            userId: finalUserData.id,
            email: finalUserData.email,
            isPremium: finalUserData.isPremium,
            isAdmin: finalUserData.isAdmin,
            loginTime: Date.now(),
          })
        );
      } catch (error) {
        logger.error("Erro ao salvar sessão", { details: error.message });
      }

      // Atualizar estado
      setToken(newToken);
      setUser(finalUserData);
      setShowAuthForm(false);
      setAuthMessage("");

      logger.info("Login realizado com sucesso", {
        type: "auth",
        details: {
          email: finalUserData.email,
          isPremium: finalUserData.isPremium,
          isAdmin: finalUserData.isAdmin,
        },
      });

      notifications.success(`Bem-vindo, ${finalUserData.email}!`);

      return true;
    },
    [isTokenValid, extractTokenData]
  );

  // Função de logout simplificada
  const logout = useCallback(
    (message = "") => {
      const userEmail = user?.email || "Utilizador";

      // Limpar timeout de validação
      if (validationTimeoutRef.current) {
        clearTimeout(validationTimeoutRef.current);
        validationTimeoutRef.current = null;
      }

      // Reset refs
      sessionCheckedRef.current = false;

      try {
        localStorage.removeItem("userSession");
      } catch (error) {
        logger.error("Erro ao limpar sessão", { details: error.message });
      }

      setToken(null);
      setUser(null);
      setAuthMessage(message || "");

      logger.info("Logout realizado", {
        type: "auth",
        details: { email: userEmail, reason: message },
      });

      if (message) {
        setShowAuthForm(true);
        notifications.info(message);
      } else {
        notifications.info("Sessão terminada com sucesso");
      }
    },
    [user]
  );

  // Verificar sessão existente - SIMPLIFICADO
  const checkSession = useCallback(async () => {
    if (sessionCheckedRef.current || !mountedRef.current) {
      return;
    }

    sessionCheckedRef.current = true;
    logger.debug("Verificando sessão existente...");

    try {
      const sessionData = localStorage.getItem("userSession");

      if (!sessionData) {
        logger.debug("Nenhuma sessão encontrada");
        return;
      }

      const session = JSON.parse(sessionData);

      if (!session.token || !session.userId || !session.email) {
        logger.warn("Dados de sessão incompletos");
        logout("Sessão inválida");
        return;
      }

      // Verificar idade da sessão (24 horas)
      const sessionAge = Date.now() - (session.loginTime || 0);
      if (sessionAge > 24 * 60 * 60 * 1000) {
        logger.info("Sessão expirada por tempo");
        logout("Sessão expirada.");
        return;
      }

      if (isTokenValid(session.token)) {
        setToken(session.token);
        setUser({
          id: session.userId,
          email: session.email,
          isPremium: Boolean(session.isPremium),
          isAdmin: Boolean(session.isAdmin),
        });
        logger.info("Sessão restaurada automaticamente", {
          details: { email: session.email },
        });
      } else {
        logout("Sessão inválida, faça login novamente.");
      }
    } catch (error) {
      logger.error("Erro ao verificar sessão", {
        details: error.message,
      });
      // Em caso de erro, limpar dados possivelmente corrompidos
      try {
        localStorage.removeItem("userSession");
      } catch (e) {
        // Ignore
      }
    } finally {
      if (mountedRef.current) {
        setLoading(false);
      }
    }
  }, [isTokenValid, logout]);

  // Função de chamada de API otimizada
  const apiCall = useCallback(async (url, options = {}) => {
    try {
      const apiUrl = import.meta.env.VITE_API_URL || "http://localhost:5000";

      const response = await fetch(`${apiUrl}${url}`, {
        ...options,
        timeout: 10000, // 10 segundos de timeout
        headers: {
          "Content-Type": "application/json",
          ...options.headers,
        },
      });

      // Tentar parsear JSON mesmo se response não for ok
      let data;
      try {
        data = await response.json();
      } catch (jsonError) {
        data = { message: `HTTP ${response.status}` };
      }

      if (!response.ok) {
        throw new Error(data.message || `Erro ${response.status}`);
      }

      return data;
    } catch (error) {
      if (error.name === "TypeError" && error.message.includes("fetch")) {
        const connectionError = "Erro de conexão. Verifique sua internet.";
        logger.error("Erro de conectividade", {
          details: error.message,
        });
        throw new Error(connectionError);
      }

      logger.error("Erro na API", {
        details: { url, error: error.message },
      });
      throw error;
    }
  }, []);

  const registerUser = useCallback(
    async (email, password) => {
      logger.info("Iniciando registo de utilizador", {
        details: { email },
      });

      // Validação básica
      if (!email || !password) {
        throw new Error("Email e senha são obrigatórios.");
      }

      if (password.length < 6) {
        throw new Error("A senha deve ter pelo menos 6 caracteres.");
      }

      const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
      if (!emailRegex.test(email)) {
        throw new Error("Email inválido.");
      }

      const result = await apiCall("/api/auth/register", {
        method: "POST",
        body: JSON.stringify({ email: email.toLowerCase().trim(), password }),
      });

      logger.info("Registo bem-sucedido", {
        details: { email, success: result.success },
      });

      return result;
    },
    [apiCall]
  );

  const loginUser = useCallback(
    async (email, password) => {
      logger.info("Iniciando login de utilizador", {
        details: { email },
      });

      if (!email || !password) {
        throw new Error("Email e senha são obrigatórios.");
      }

      const result = await apiCall("/api/auth/login", {
        method: "POST",
        body: JSON.stringify({ email: email.toLowerCase().trim(), password }),
      });

      logger.info("Login API bem-sucedido", {
        details: {
          email,
          hasToken: !!result.token,
          isPremium: result.user?.isPremium || result.isPremium,
          isAdmin: result.user?.isAdmin || result.isAdmin,
        },
      });

      return result;
    },
    [apiCall]
  );

  // Google login
  const googleLogin = useCallback(
    async (googleCredential) => {
      try {
        const result = await apiCall("/auth/google", {
          method: "POST",
          body: JSON.stringify({
            credential: googleCredential.credential,
            clientId: googleCredential.clientId,
          }),
        });

        if (result.token) {
          const loginSuccess = login(result.token, result.user);
          if (loginSuccess) {
            logger.info("Login Google bem-sucedido", {
              details: { email: result.user.email, method: "google" },
            });
            notifications.success(
              `Bem-vindo, ${result.user.name || result.user.email}!`
            );
          }
          return loginSuccess;
        }
      } catch (error) {
        logger.error("Erro no login Google", {
          details: error.message,
        });
        notifications.error(error.message);
        throw error;
      }
    },
    [apiCall, login]
  );

  // Verificação inicial de sessão - UMA ÚNICA VEZ
  useEffect(() => {
    mountedRef.current = true;
    
    // Timeout para evitar bloqueio
    const initTimeout = setTimeout(() => {
      checkSession();
    }, 100);

    return () => {
      mountedRef.current = false;
      clearTimeout(initTimeout);
    };
  }, [checkSession]);

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      if (validationTimeoutRef.current) {
        clearTimeout(validationTimeoutRef.current);
      }
    };
  }, []);

  // Validação periódica OPCIONAL - apenas se online
  useEffect(() => {
    if (!isLoggedIn || !token || !navigator.onLine) {
      return;
    }

    // Validar apenas a cada 30 minutos
    const validateSession = async () => {
      try {
        const result = await apiCall("/api/auth/validate", {
          method: "POST",
          headers: { Authorization: `Bearer ${token}` },
        });

        if (result.token && result.token !== token && mountedRef.current) {
          logger.info("Sessão atualizada automaticamente");
          login(result.token, result.user);
        }
      } catch (error) {
        // Só fazer logout em erro 401/403
        if (error.message.includes("401") || error.message.includes("403")) {
          logout("Sessão expirada");
        } else {
          logger.warn("Validação de sessão falhou - mantendo sessão atual");
        }
      }
    };

    // Validar após 30 minutos
    validationTimeoutRef.current = setTimeout(validateSession, 30 * 60 * 1000);

    return () => {
      if (validationTimeoutRef.current) {
        clearTimeout(validationTimeoutRef.current);
      }
    };
  }, [isLoggedIn, token, apiCall, login, logout]);

  const value = {
    token,
    user,
    isPremium,
    isAdmin,
    isLoggedIn,
    loading,
    showAuthForm,
    setShowAuthForm,
    isRegisterForm,
    setIsRegisterForm,
    authMessage,
    setAuthMessage,
    login,
    logout,
    registerUser,
    loginUser,
    isTokenValid,
    googleLogin,
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error("useAuth deve ser usado dentro de um AuthProvider");
  }
  return context;
};