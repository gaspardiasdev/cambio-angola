/* eslint-disable no-unused-vars */
/* eslint-disable no-case-declarations */
// components/AuthModal.jsx

import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { GoogleOAuthProvider, GoogleLogin } from '@react-oauth/google';
import { useAuth } from "../context/AuthContext";

const GOOGLE_CLIENT_ID = import.meta.env.VITE_GOOGLE_CLIENT_ID || "your-google-client-id.apps.googleusercontent.com";

// Adicionar este console.log:
console.log('GOOGLE_CLIENT_ID sendo usado:', GOOGLE_CLIENT_ID);
console.log('Todas as env vars:', import.meta.env);

export default function AuthModal({ isOpen, onClose, isLogin, onToggleForm }) {
  const {
    setAuthMessage,
    authMessage,
    login,
    registerUser,
    loginUser,
    loading: authLoading,
  } = useAuth();

  const [formData, setFormData] = useState({
    email: "",
    password: "",
    confirmPassword: "",
  });
  const [loading, setLoading] = useState(false);
  const [errors, setErrors] = useState({});
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);

  // Limpa formulário quando o modal abre/fecha ou troca entre login/registo
  useEffect(() => {
    if (isOpen) {
      setFormData({ email: "", password: "", confirmPassword: "" });
      setErrors({});
      setAuthMessage("");
    }
  }, [isOpen, isLogin, setAuthMessage]);

  // Função para lidar com sucesso do Google OAuth
  const handleGoogleSuccess = async (credentialResponse) => {
    try {
      setLoading(true);
      setAuthMessage("");

      // Enviar credencial para o backend
      const response = await fetch(`${process.env.REACT_APP_API_URL || 'http://localhost:5000'}/api/auth/google`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          credential: credentialResponse.credential,
          clientId: credentialResponse.clientId
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.message || 'Erro na autenticação Google');
      }

      // Usar a função login existente do AuthContext
      const userData = {
        email: data.user.email,
        name: data.user.name,
        picture: data.user.picture,
        isPremium: data.user.isPremium || false,
        isAdmin: data.user.isAdmin || false,
      };

      const loginSuccess = login(data.token, userData);

      if (loginSuccess) {
        setAuthMessage("Login Google realizado com sucesso!");
        setTimeout(() => {
          onClose();
        }, 1000);
      } else {
        setAuthMessage("Erro ao processar autenticação Google.");
      }

    } catch (error) {
      console.error('Google OAuth Error:', error);
      setAuthMessage(error.message || 'Erro na autenticação com Google');
    } finally {
      setLoading(false);
    }
  };

  const handleGoogleError = () => {
    setAuthMessage('Falha na autenticação Google. Tente novamente.');
  };

  // Validação de campos (mantém a mesma lógica existente)
  const validateField = (name, value) => {
    const newErrors = { ...errors };

    switch (name) {
      case "email":
        const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
        if (!value) {
          newErrors.email = "Email é obrigatório";
        } else if (!emailRegex.test(value)) {
          newErrors.email = "Email inválido";
        } else {
          delete newErrors.email;
        }
        break;

      case "password":
        if (!value) {
          newErrors.password = "Senha é obrigatória";
        } else if (value.length < 6) {
          newErrors.password = "Senha deve ter pelo menos 6 caracteres";
        } else {
          delete newErrors.password;
        }
        break;

      case "confirmPassword":
        if (!isLogin) {
          if (!value) {
            newErrors.confirmPassword = "Confirmação de senha é obrigatória";
          } else if (value !== formData.password) {
            newErrors.confirmPassword = "Senhas não coincidem";
          } else {
            delete newErrors.confirmPassword;
          }
        }
        break;

      default:
        break;
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
    
    // Validação em tempo real com debounce
    setTimeout(() => validateField(name, value), 300);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setAuthMessage("");

    // Validação completa
    const isEmailValid = validateField("email", formData.email);
    const isPasswordValid = validateField("password", formData.password);
    const isConfirmPasswordValid =
      isLogin || validateField("confirmPassword", formData.confirmPassword);

    if (!isEmailValid || !isPasswordValid || !isConfirmPasswordValid) {
      setLoading(false);
      return;
    }

    try {
      if (!isLogin) {
        // Registro
        const data = await registerUser(formData.email, formData.password);

        if (data.success || data.message === "Utilizador registado com sucesso!") {
          setAuthMessage("Registo bem-sucedido! Entrando automaticamente...");

          if (data.token) {
            const userData = {
              email: data.user?.email || formData.email,
              isPremium: data.user?.isPremium || false,
              isAdmin: data.user?.isAdmin || false,
            };
            const loginSuccess = login(data.token, userData);

            if (loginSuccess) {
              onClose();
            } else {
              setAuthMessage("Erro ao processar login automático. Faça login manualmente.");
            }
          } else {
            // Switch to login form
            onToggleForm();
            setFormData(prev => ({ ...prev, password: "", confirmPassword: "" }));
          }
        } else {
          setAuthMessage(data.message || "Erro no registo");
        }
      } else {
        // Login
        const data = await loginUser(formData.email, formData.password);

        if (data.token) {
          const userData = {
            email: data.user?.email || formData.email,
            isPremium: data.user?.isPremium || data.isPremium || false,
            isAdmin: data.user?.isAdmin || data.isAdmin || false,
          };

          const loginSuccess = login(data.token, userData);

          if (loginSuccess) {
            onClose();
          } else {
            setAuthMessage("Erro ao processar login. Tente novamente.");
          }
        } else {
          setAuthMessage(data.message || "Credenciais inválidas");
        }
      }
    } catch (error) {
      console.error("Erro na autenticação:", error);
      setAuthMessage(error.message || "Erro de comunicação com o servidor");
    } finally {
      setLoading(false);
    }
  };

  if (!isOpen) return null;

  return (
    <GoogleOAuthProvider clientId={GOOGLE_CLIENT_ID}>
      <AnimatePresence>
        <motion.div
          className="fixed inset-0 z-50 flex items-center justify-center bg-gray-900/50 backdrop-blur-sm p-4"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
        >
          <motion.div
            className="bg-white rounded-2xl shadow-2xl w-full max-w-md relative overflow-hidden"
            initial={{ scale: 0.9, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            exit={{ scale: 0.9, opacity: 0 }}
            transition={{ type: "spring", duration: 0.5 }}
          >
            {/* Header */}
            <div className="bg-gradient-to-r from-blue-600 to-purple-600 p-6 text-white relative">
              <button
                onClick={onClose}
                className="absolute top-4 right-4 text-white/80 hover:text-white text-2xl font-bold transition-colors"
                disabled={loading}
              >
                &times;
              </button>
              <div className="flex items-center gap-3">
                <motion.div
                  className="w-12 h-12 bg-white/20 rounded-2xl flex items-center justify-center"
                  animate={{ rotate: [0, 360] }}
                  transition={{ duration: 20, repeat: Infinity, ease: "linear" }}
                >
                  <span className="text-2xl">🔒</span>
                </motion.div>
                <div>
                  <h3 className="text-xl font-bold">
                    {isLogin ? "Entrar" : "Criar Conta"}
                  </h3>
                  <p className="text-white/80 text-sm">
                    {isLogin
                      ? "Acesse sua conta"
                      : "Junte-se à nossa comunidade"}
                  </p>
                </div>
              </div>
            </div>

            {/* Form */}
            <div className="p-6">
              {/* Botão Google OAuth */}
              <div className="mb-6 flex justify-center">
                <GoogleLogin
                  onSuccess={handleGoogleSuccess}
                  onError={handleGoogleError}
                  size="large"
                  theme="outline"
                  text={isLogin ? "signin_with" : "signup_with"}
                  shape="rectangular"
                  logo_alignment="left"
                  width="320"
                  disabled={loading || authLoading}
                />
              </div>

              {/* Divisor */}
              <div className="flex items-center my-6">
                <hr className="flex-grow border-gray-300" />
                <span className="px-3 text-gray-500 text-sm">ou</span>
                <hr className="flex-grow border-gray-300" />
              </div>

              <form onSubmit={handleSubmit} className="space-y-4">
                {/* Email */}
                <div>
                  <label
                    htmlFor="email"
                    className="block text-sm font-medium text-gray-700 mb-1"
                  >
                    Email
                  </label>
                  <div className="relative">
                    <input
                      type="email"
                      id="email"
                      name="email"
                      value={formData.email}
                      onChange={handleInputChange}
                      placeholder="exemplo@email.com"
                      className={`w-full p-3 border rounded-lg focus:outline-none focus:ring-2 transition ${
                        errors.email
                          ? "border-red-500 focus:ring-red-500"
                          : "border-gray-300 focus:ring-blue-500"
                      }`}
                      required
                      disabled={loading}
                    />
                    {errors.email && (
                      <motion.p
                        className="mt-1 text-sm text-red-600"
                        initial={{ opacity: 0, y: -5 }}
                        animate={{ opacity: 1, y: 0 }}
                      >
                        {errors.email}
                      </motion.p>
                    )}
                  </div>
                </div>

                {/* Senha */}
                <div>
                  <label
                    htmlFor="password"
                    className="block text-sm font-medium text-gray-700 mb-1"
                  >
                    Senha
                  </label>
                  <div className="relative">
                    <input
                      type={showPassword ? "text" : "password"}
                      id="password"
                      name="password"
                      value={formData.password}
                      onChange={handleInputChange}
                      placeholder={
                        isLogin ? "Sua senha" : "Mínimo 6 caracteres"
                      }
                      className={`w-full p-3 border rounded-lg focus:outline-none focus:ring-2 pr-10 transition ${
                        errors.password
                          ? "border-red-500 focus:ring-red-500"
                          : "border-gray-300 focus:ring-blue-500"
                      }`}
                      required
                      disabled={loading}
                    />
                    <button
                      type="button"
                      onClick={() => setShowPassword(!showPassword)}
                      className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-500 hover:text-gray-700"
                      disabled={loading}
                    >
                      {showPassword ? "🙈" : "👁"}
                    </button>
                  </div>
                  {errors.password && (
                    <motion.p
                      className="mt-1 text-sm text-red-600"
                      initial={{ opacity: 0, y: -5 }}
                      animate={{ opacity: 1, y: 0 }}
                    >
                      {errors.password}
                    </motion.p>
                  )}
                </div>

                {/* Confirmação de senha (apenas no registo) */}
                {!isLogin && (
                  <motion.div
                    initial={{ opacity: 0, height: 0 }}
                    animate={{ opacity: 1, height: "auto" }}
                    exit={{ opacity: 0, height: 0 }}
                    transition={{ duration: 0.3 }}
                  >
                    <label
                      htmlFor="confirmPassword"
                      className="block text-sm font-medium text-gray-700 mb-1"
                    >
                      Confirmar Senha
                    </label>
                    <div className="relative">
                      <input
                        type={showConfirmPassword ? "text" : "password"}
                        id="confirmPassword"
                        name="confirmPassword"
                        value={formData.confirmPassword}
                        onChange={handleInputChange}
                        placeholder="Confirme sua senha"
                        className={`w-full p-3 border rounded-lg focus:outline-none focus:ring-2 pr-10 transition ${
                          errors.confirmPassword
                            ? "border-red-500 focus:ring-red-500"
                            : "border-gray-300 focus:ring-blue-500"
                        }`}
                        required
                        disabled={loading}
                      />
                      <button
                        type="button"
                        onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                        className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-500 hover:text-gray-700"
                        disabled={loading}
                      >
                        {showConfirmPassword ? "🙈" : "👁"}
                      </button>
                    </div>
                    {errors.confirmPassword && (
                      <motion.p
                        className="mt-1 text-sm text-red-600"
                        initial={{ opacity: 0, y: -5 }}
                        animate={{ opacity: 1, y: 0 }}
                      >
                        {errors.confirmPassword}
                      </motion.p>
                    )}
                  </motion.div>
                )}

                {/* Botão de submit */}
                <motion.button
                  type="submit"
                  disabled={loading || authLoading || Object.keys(errors).length > 0}
                  className={`w-full py-3 rounded-lg font-bold text-white transition-all ${
                    loading || authLoading || Object.keys(errors).length > 0
                      ? "bg-gray-400 cursor-not-allowed"
                      : "bg-gradient-to-r from-blue-500 to-purple-600 hover:from-blue-600 hover:to-purple-700 shadow-lg hover:shadow-xl"
                  }`}
                  whileHover={
                    !loading && !authLoading && Object.keys(errors).length === 0
                      ? { scale: 1.02 }
                      : {}
                  }
                  whileTap={
                    !loading && !authLoading && Object.keys(errors).length === 0
                      ? { scale: 0.98 }
                      : {}
                  }
                >
                  {loading || authLoading ? (
                    <div className="flex items-center justify-center gap-2">
                      <motion.div
                        className="w-4 h-4 border-2 border-white border-t-transparent rounded-full"
                        animate={{ rotate: 360 }}
                        transition={{
                          duration: 1,
                          repeat: Infinity,
                          ease: "linear",
                        }}
                      />
                      {isLogin ? "Entrando..." : "Registando..."}
                    </div>
                  ) : isLogin ? (
                    "Entrar"
                  ) : (
                    "Registar"
                  )}
                </motion.button>
              </form>

              {/* Mensagem de erro/sucesso */}
              <AnimatePresence>
                {authMessage && (
                  <motion.div
                    className={`mt-4 p-3 rounded-lg text-sm font-medium text-center border ${
                      authMessage.includes("sucesso") ||
                      authMessage.includes("bem-sucedido")
                        ? "bg-green-50 text-green-700 border-green-200"
                        : "bg-red-50 text-red-700 border-red-200"
                    }`}
                    initial={{ opacity: 0, y: -10 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: -10 }}
                  >
                    {authMessage}
                  </motion.div>
                )}
              </AnimatePresence>

              {/* Toggle entre login e registo */}
              <div className="mt-6 text-center text-sm text-gray-600">
                {isLogin ? (
                  <p>
                    Não tem conta?{" "}
                    <button
                      onClick={onToggleForm}
                      className="text-blue-600 hover:text-blue-700 font-semibold underline transition-colors"
                      disabled={loading}
                    >
                      Registe-se aqui
                    </button>
                  </p>
                ) : (
                  <p>
                    Já tem uma conta?{" "}
                    <button
                      onClick={onToggleForm}
                      className="text-blue-600 hover:text-blue-700 font-semibold underline transition-colors"
                      disabled={loading}
                    >
                      Entre aqui
                    </button>
                  </p>
                )}
              </div>

              {/* Termos e condições (apenas no registo) */}
              {!isLogin && (
                <motion.div
                  className="mt-4 text-xs text-gray-500 text-center"
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  exit={{ opacity: 0 }}
                >
                  Ao registar-se, concorda com os nossos{" "}
                  <button className="text-blue-600 hover:text-blue-700 underline">
                    Termos de Serviço
                  </button>{" "}
                  e{" "}
                  <button className="text-blue-600 hover:text-blue-700 underline">
                    Política de Privacidade
                  </button>
                </motion.div>
              )}
            </div>
          </motion.div>
        </motion.div>
      </AnimatePresence>
    </GoogleOAuthProvider>
  );
}