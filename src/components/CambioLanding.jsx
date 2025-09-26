/* eslint-disable no-unused-vars */
import { useState, useEffect, useCallback, useRef } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  TrendingUp,
  Bell,
  Smartphone,
  Download,
  CheckCircle,
  Star,
  Users,
  Clock,
  Shield,
  ArrowRight,
  Play,
  X,
  AlertCircle,
} from "lucide-react";
import { useAuth } from "../context/AuthContext";
import { fetchRates } from "../services/api";
import { logger } from "../utils/notifications";
import AuthModal from "./AuthModal"; // Importando o modal externo

const testimonials = [
  {
    name: "João Silva",
    role: "Empresário",
    text: "Economizo tempo e dinheiro com as taxas em tempo real. Indispensável para quem trabalha com divisas.",
    rating: 5,
  },
  {
    name: "Maria Santos",
    role: "Importadora",
    text: "Os alertas Email chegam na hora certa. Já consegui aproveitar várias oportunidades.",
    rating: 5,
  },
];

const faqs = [
  {
    q: "Como funcionam os alertas?",
    a: "Recebe notificações instantâneas no Email quando as taxas atingem os valores que define.",
  },
  {
    q: "As taxas são confiáveis?",
    a: "Sim, atualizamos diariamente com base nas melhores casas de câmbio de Luanda.",
  },
  {
    q: "Posso cancelar a qualquer momento?",
    a: "Claro! Sem contratos, pode cancelar quando quiser.",
  },
];

// Toast Notification Component
const Toast = ({ message, type, onClose }) => (
  <motion.div
    initial={{ opacity: 0, y: 50, x: 100 }}
    animate={{ opacity: 1, y: 0, x: 0 }}
    exit={{ opacity: 0, y: 50, x: 100 }}
    className={`fixed top-4 right-4 z-50 p-4 rounded-xl shadow-lg max-w-sm ${
      type === "success"
        ? "bg-green-500 text-white"
        : type === "error"
        ? "bg-red-500 text-white"
        : "bg-blue-500 text-white"
    }`}
  >
    <div className="flex items-center gap-3">
      {type === "success" && <CheckCircle className="w-5 h-5" />}
      {type === "error" && <AlertCircle className="w-5 h-5" />}
      {type === "info" && <Bell className="w-5 h-5" />}
      <span className="font-medium">{message}</span>
      <button onClick={onClose} className="ml-2">
        <X className="w-4 h-4" />
      </button>
    </div>
  </motion.div>
);

export default function Landing() {
  // State management
  const [showAuthModal, setShowAuthModal] = useState(false);
  const [authMode, setAuthMode] = useState("login"); // 'login' ou 'register'
  const [isLogin, setIsLogin] = useState(true);
  const [openFaq, setOpenFaq] = useState(null);
  const [todayRates, setTodayRates] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [toast, setToast] = useState(null);

  // Refs para evitar re-renders desnecessários
  const loadRatesRef = useRef(false);
  const authTimeoutRef = useRef(null);

  // Show toast notification
  const showToast = useCallback((message, type = "info") => {
    setToast({ message, type });
    // Auto-remove toast
    setTimeout(() => setToast(null), 5000);
  }, []);

  // Load real exchange rates - OTIMIZADO
  const loadRates = useCallback(async () => {
    // Evitar múltiplas chamadas simultâneas
    if (loadRatesRef.current) {
      return;
    }

    loadRatesRef.current = true;

    try {
      setLoading(true);
      setError(null);

      logger.debug("Carregando taxas de câmbio...");
      const rates = await fetchRates();

      if (rates && rates.length > 0) {
        setTodayRates(rates[0]);
        logger.info("Taxas carregadas com sucesso", {
          details: { count: rates.length, latest: rates[0]?.date },
        });
      } else {
        throw new Error("Nenhuma taxa encontrada");
      }
    } catch (err) {
      logger.error("Erro ao carregar taxas", {
        details: err.message,
        showNotification: false,
      });
      setError("Erro ao carregar taxas de câmbio");
      showToast("Erro ao carregar taxas. Usando dados offline.", "error");

      // Fallback data
      setTodayRates({
        usdBuy: 850,
        usdSell: 870,
        eurBuy: 920,
        eurSell: 940,
        date: new Date(),
      });
    } finally {
      setLoading(false);
      loadRatesRef.current = false;
    }
  }, [showToast]);

  // Load rates on mount - apenas uma vez
  useEffect(() => {
    loadRates();

    // Auto-refresh a cada 5 minutos
    const interval = setInterval(loadRates, 5 * 60 * 1000);
    return () => clearInterval(interval);
  }, [loadRates]);

  // Função para abrir o modal em modo específico
  const openAuthModal = (mode) => {
    setAuthMode(mode);
    setShowAuthModal(true);
  };

  // Função para fechar o modal
  const closeAuthModal = () => {
    setShowAuthModal(false);
  };

  // Função para alternar entre login e registro
  const toggleAuthMode = () => {
    setAuthMode((prev) => (prev === "login" ? "register" : "login"));
  };

  // Redirect authenticated users
  const { isLoggedIn } = useAuth();
  useEffect(() => {
    if (isLoggedIn) {
      window.location.href = "/app";
    }
  }, [isLoggedIn]);

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      if (authTimeoutRef.current) {
        clearTimeout(authTimeoutRef.current);
      }
    };
  }, []);

  // Animation variants
  const fadeInUp = {
    hidden: { opacity: 0, y: 60 },
    visible: { opacity: 1, y: 0, transition: { duration: 0.6 } },
  };

  const staggerChildren = {
    hidden: { opacity: 0 },
    visible: {
      opacity: 1,
      transition: { staggerChildren: 0.2 },
    },
  };

  // Loading state
  if (loading) {
    return (
      <div className="min-h-screen bg-white flex items-center justify-center">
        <div className="text-center">
          <div className="w-12 h-12 border-4 border-blue-500 border-t-transparent rounded-full animate-spin mx-auto mb-4" />
          <p className="text-gray-600">Carregando taxas de câmbio...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-white">
      {/* Header */}
      <header className="bg-white border-b border-gray-100 sticky top-0 z-40">
        <div className="max-w-6xl mx-auto px-4 py-4 flex justify-between items-center">
          <div className="flex items-center space-x-3">
            <div className="w-10 h-10 bg-blue-600 rounded-xl flex items-center justify-center">
              <TrendingUp className="w-6 h-6 text-white" />
            </div>
            <div>
              <h1 className="text-xl font-bold text-gray-900">Câmbio Angola</h1>
              <p className="text-sm text-gray-500">Taxas em tempo real</p>
            </div>
          </div>

          <div className="flex items-center space-x-4">
            <button
              onClick={() => openAuthModal("login")}
              className="text-gray-600 hover:text-gray-900 font-medium"
            >
              Entrar
            </button>
            <button
              onClick={() => openAuthModal("register")}
              className="bg-blue-600 text-white px-6 py-2 rounded-xl hover:bg-blue-700 transition-colors font-medium"
            >
              Começar Grátis
            </button>
          </div>
        </div>
      </header>

      {/* Hero Section */}
      <section className="py-20 px-4">
        <div className="max-w-6xl mx-auto text-center">
          <motion.div
            initial="hidden"
            animate="visible"
            variants={staggerChildren}
          >
            <motion.h1
              variants={fadeInUp}
              className="text-5xl md:text-6xl font-bold text-gray-900 mb-6"
            >
              Taxas de Câmbio
              <span className="text-blue-600"> em Tempo Real</span>
            </motion.h1>

            <motion.p
              variants={fadeInUp}
              className="text-xl text-gray-600 mb-8 max-w-2xl mx-auto"
            >
              Nunca mais perca uma oportunidade. Receba alertas instantâneos das
              melhores taxas de câmbio de Luanda.
            </motion.p>

            {/* Current Rate Display */}
            <motion.div
              variants={fadeInUp}
              className="bg-gradient-to-r from-blue-50 to-indigo-50 rounded-2xl p-8 mb-8 max-w-md mx-auto"
            >
              <div className="flex items-center justify-center mb-4">
                <span className="text-4xl">🇺🇸</span>
                <div className="flex items-center mx-4">
                  <div
                    className={`w-2 h-2 rounded-full mx-2 ${
                      error ? "bg-red-500" : "bg-green-500 animate-pulse"
                    }`}
                  />
                  {error && (
                    <span className="text-xs text-red-600">Offline</span>
                  )}
                </div>
                <span className="text-2xl font-bold text-gray-900">
                  {todayRates ? `${todayRates.usdSell} KZ` : "---"}
                </span>
              </div>
              <p className="text-gray-600">
                Dólar Americano •{" "}
                {error ? "Dados em cache" : "Atualizado agora"}
              </p>
            </motion.div>

            <motion.div
              variants={fadeInUp}
              className="flex flex-col sm:flex-row gap-4 justify-center"
            >
              <button
                onClick={() => {
                  setIsLogin(false);
                  setShowAuthModal(true);
                }}
                className="bg-blue-600 text-white px-8 py-4 rounded-xl text-lg font-semibold hover:bg-blue-700 transition-colors shadow-lg"
              >
                Começar Grátis
                <ArrowRight className="w-5 h-5 ml-2 inline" />
              </button>
              <button
                onClick={() => showToast("Demo em breve!", "info")}
                className="border-2 border-gray-200 px-8 py-4 rounded-xl text-lg font-semibold hover:border-gray-300 transition-colors"
              >
                <Play className="w-5 h-5 mr-2 inline" />
                Ver Demo
              </button>
            </motion.div>
          </motion.div>
        </div>
      </section>

      {/* Features Section */}
      <section className="py-20 bg-gray-50">
        <div className="max-w-6xl mx-auto px-4">
          <motion.div
            initial="hidden"
            whileInView="visible"
            viewport={{ once: true }}
            variants={staggerChildren}
            className="text-center mb-16"
          >
            <motion.h2
              variants={fadeInUp}
              className="text-4xl font-bold text-gray-900 mb-4"
            >
              Tudo o que precisa numa app
            </motion.h2>
            <motion.p variants={fadeInUp} className="text-xl text-gray-600">
              Simples, rápido e sempre atualizado
            </motion.p>
          </motion.div>

          <motion.div
            initial="hidden"
            whileInView="visible"
            viewport={{ once: true }}
            variants={staggerChildren}
            className="grid md:grid-cols-3 gap-8"
          >
            {[
              {
                icon: Bell,
                title: "Alertas Email",
                description:
                  "Receba notificações instantâneas quando as taxas atingem os valores que define.",
                highlight: "Grátis",
              },
              {
                icon: TrendingUp,
                title: "Dados Históricos",
                description:
                  "Acesse histórico completo e analise tendências para tomar melhores decisões.",
                highlight: "Premium",
              },
              {
                icon: Download,
                title: "Exportar Dados",
                description:
                  "Baixe relatórios completos em Excel para sua contabilidade.",
                highlight: "Premium",
              },
            ].map((feature, index) => (
              <motion.div
                key={index}
                variants={fadeInUp}
                className="bg-white p-8 rounded-2xl shadow-sm border border-gray-100 hover:shadow-lg transition-shadow"
              >
                <div className="w-12 h-12 bg-blue-100 rounded-xl flex items-center justify-center mb-6">
                  <feature.icon className="w-6 h-6 text-blue-600" />
                </div>
                <div className="flex items-center gap-2 mb-3">
                  <h3 className="text-xl font-semibold text-gray-900">
                    {feature.title}
                  </h3>
                  <span
                    className={`text-xs px-2 py-1 rounded-full ${
                      feature.highlight === "Premium"
                        ? "bg-purple-100 text-purple-700"
                        : "bg-green-100 text-green-700"
                    }`}
                  >
                    {feature.highlight}
                  </span>
                </div>
                <p className="text-gray-600">{feature.description}</p>
              </motion.div>
            ))}
          </motion.div>
        </div>
      </section>

      {/* Pricing Section */}
      <section className="py-20">
        <div className="max-w-6xl mx-auto px-4">
          <motion.div
            initial="hidden"
            whileInView="visible"
            viewport={{ once: true }}
            variants={staggerChildren}
            className="text-center mb-16"
          >
            <motion.h2
              variants={fadeInUp}
              className="text-4xl font-bold text-gray-900 mb-4"
            >
              Planos Simples
            </motion.h2>
            <motion.p variants={fadeInUp} className="text-xl text-gray-600">
              Comece grátis, faça upgrade quando precisar
            </motion.p>
          </motion.div>

          <motion.div
            initial="hidden"
            whileInView="visible"
            viewport={{ once: true }}
            variants={staggerChildren}
            className="grid md:grid-cols-2 gap-8 max-w-4xl mx-auto"
          >
            {/* Free Plan */}
            <motion.div
              variants={fadeInUp}
              className="bg-white p-8 rounded-2xl border-2 border-gray-200"
            >
              <h3 className="text-2xl font-bold text-gray-900 mb-2">Grátis</h3>
              <p className="text-gray-600 mb-6">Para começar</p>
              <div className="text-4xl font-bold text-gray-900 mb-6">0 KZ</div>

              <ul className="space-y-4 mb-8">
                {["Média das Taxas atualizadas"].map((feature, index) => (
                  <li key={index} className="flex items-center gap-3">
                    <CheckCircle className="w-5 h-5 text-green-500" />
                    <span>{feature}</span>
                  </li>
                ))}
              </ul>

              <button
                onClick={() => {
                  setIsLogin(false);
                  setShowAuthModal(true);
                }}
                className="w-full border-2 border-blue-600 text-blue-600 py-3 rounded-xl font-semibold hover:bg-blue-50 transition-colors"
              >
                Começar Grátis
              </button>
            </motion.div>

            {/* Premium Plan */}
            <motion.div
              variants={fadeInUp}
              className="bg-blue-600 p-8 rounded-2xl text-white relative"
            >
              <div className="absolute top-4 right-4 bg-white text-blue-600 px-3 py-1 rounded-full text-sm font-semibold">
                Popular
              </div>
              <h3 className="text-2xl font-bold mb-2">Premium</h3>
              <p className="text-blue-100 mb-6">Para profissionais</p>
              <div className="text-4xl font-bold mb-6">
                5,000 KZ <span className="text-lg font-normal">/mês</span>
              </div>

              <ul className="space-y-4 mb-8">
                {[
                  "Taxas atualizadas diariamente",
                  "30 dias de histórico completo",
                  "Alertas Email ilimitados",
                  "Exportar dados em Excel",
                  "Análises de tendência",
                  "Suporte prioritário",
                ].map((feature, index) => (
                  <li key={index} className="flex items-center gap-3">
                    <CheckCircle className="w-5 h-5 text-white" />
                    <span>{feature}</span>
                  </li>
                ))}
              </ul>

              <button
                onClick={() => showToast("Contacte-nos para upgrade!", "info")}
                className="w-full bg-white text-blue-600 py-3 rounded-xl font-semibold hover:bg-gray-50 transition-colors"
              >
                Fazer Upgrade
              </button>
            </motion.div>
          </motion.div>
        </div>
      </section>

      {/* Social Proof */}
      <section className="py-20 bg-gray-50">
        <div className="max-w-6xl mx-auto px-4">
          <motion.div
            initial="hidden"
            whileInView="visible"
            viewport={{ once: true }}
            variants={staggerChildren}
            className="text-center mb-16"
          >
            <motion.h2
              variants={fadeInUp}
              className="text-4xl font-bold text-gray-900 mb-4"
            >
              Mais de 1,000 pessoas já confiam em nós
            </motion.h2>
          </motion.div>

          <motion.div
            initial="hidden"
            whileInView="visible"
            viewport={{ once: true }}
            variants={staggerChildren}
            className="grid md:grid-cols-2 gap-8"
          >
            {testimonials.map((testimonial, index) => (
              <motion.div
                key={index}
                variants={fadeInUp}
                className="bg-white p-8 rounded-2xl shadow-sm border border-gray-100"
              >
                <div className="flex mb-4">
                  {[...Array(testimonial.rating)].map((_, i) => (
                    <Star
                      key={i}
                      className="w-5 h-5 text-yellow-400 fill-current"
                    />
                  ))}
                </div>
                <p className="text-gray-600 mb-6 text-lg">{testimonial.text}</p>
                <div className="flex items-center gap-3">
                  <div className="w-12 h-12 bg-blue-100 rounded-full flex items-center justify-center">
                    {testimonial.name[0]}
                  </div>
                  <div>
                    <div className="font-semibold text-gray-900">
                      {testimonial.name}
                    </div>
                    <div className="text-gray-500 text-sm">
                      {testimonial.role}
                    </div>
                  </div>
                </div>
              </motion.div>
            ))}
          </motion.div>
        </div>
      </section>

      {/* FAQ Section */}
      <section className="py-20">
        <div className="max-w-4xl mx-auto px-4">
          <motion.div
            initial="hidden"
            whileInView="visible"
            viewport={{ once: true }}
            variants={staggerChildren}
            className="text-center mb-16"
          >
            <motion.h2
              variants={fadeInUp}
              className="text-4xl font-bold text-gray-900 mb-4"
            >
              Perguntas Frequentes
            </motion.h2>
          </motion.div>

          <motion.div
            initial="hidden"
            whileInView="visible"
            viewport={{ once: true }}
            variants={staggerChildren}
            className="space-y-4"
          >
            {faqs.map((faq, index) => (
              <motion.div
                key={index}
                variants={fadeInUp}
                className="bg-white border border-gray-200 rounded-xl overflow-hidden"
              >
                <button
                  onClick={() => setOpenFaq(openFaq === index ? null : index)}
                  className="w-full p-6 text-left flex justify-between items-center hover:bg-gray-50 transition-colors"
                >
                  <span className="font-semibold text-gray-900">{faq.q}</span>
                  <motion.div
                    animate={{ rotate: openFaq === index ? 180 : 0 }}
                    transition={{ duration: 0.2 }}
                  >
                    <ArrowRight className="w-5 h-5 text-gray-400 transform rotate-90" />
                  </motion.div>
                </button>
                <AnimatePresence>
                  {openFaq === index && (
                    <motion.div
                      initial={{ height: 0, opacity: 0 }}
                      animate={{ height: "auto", opacity: 1 }}
                      exit={{ height: 0, opacity: 0 }}
                      transition={{ duration: 0.3 }}
                    >
                      <div className="px-6 pb-6 text-gray-600">{faq.a}</div>
                    </motion.div>
                  )}
                </AnimatePresence>
              </motion.div>
            ))}
          </motion.div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-20 bg-blue-600">
        <div className="max-w-4xl mx-auto px-4 text-center">
          <motion.div
            initial="hidden"
            whileInView="visible"
            viewport={{ once: true }}
            variants={staggerChildren}
          >
            <motion.h2
              variants={fadeInUp}
              className="text-4xl font-bold text-white mb-6"
            >
              Pronto para começar?
            </motion.h2>
            <motion.p
              variants={fadeInUp}
              className="text-xl text-blue-100 mb-8"
            >
              Junte-se a milhares de angolanos que já economizam tempo e
              dinheiro
            </motion.p>
            <motion.button
              variants={fadeInUp}
              onClick={() => {
                setIsLogin(false);
                setShowAuthModal(true);
              }}
              className="bg-white text-blue-600 px-8 py-4 rounded-xl text-lg font-semibold hover:bg-gray-50 transition-colors shadow-lg"
            >
              Começar Grátis Agora
            </motion.button>
          </motion.div>
        </div>
      </section>

      {/* Footer */}
      <footer className="bg-gray-900 text-white py-12">
        <div className="max-w-6xl mx-auto px-4">
          <div className="grid md:grid-cols-4 gap-8">
            <div>
              <div className="flex items-center space-x-3 mb-4">
                <div className="w-8 h-8 bg-blue-600 rounded-lg flex items-center justify-center">
                  <TrendingUp className="w-5 h-5 text-white" />
                </div>
                <span className="text-xl font-bold">Câmbio Angola</span>
              </div>
              <p className="text-gray-400">
                A sua fonte confiável para taxas de câmbio em tempo real.
              </p>
            </div>

            <div>
              <h4 className="font-semibold mb-4">Produto</h4>
              <ul className="space-y-2 text-gray-400">
                <li>Recursos</li>
                <li>Preços</li>
                <li>API</li>
              </ul>
            </div>

            <div>
              <h4 className="font-semibold mb-4">Empresa</h4>
              <ul className="space-y-2 text-gray-400">
                <li>Sobre</li>
                <li>Blog</li>
                <li>Contacto</li>
              </ul>
            </div>

            <div>
              <h4 className="font-semibold mb-4">Suporte</h4>
              <ul className="space-y-2 text-gray-400">
                <li>Ajuda</li>
                <li>Privacidade</li>
                <li>Termos</li>
              </ul>
            </div>
          </div>

          <div className="border-t border-gray-800 mt-8 pt-8 text-center text-gray-400">
            <p>&copy; 2024 Câmbio Angola. Todos os direitos reservados.</p>
          </div>
        </div>
      </footer>

      {/* Modal de Autenticação */}
      <AuthModal 
        isOpen={showAuthModal}
        onClose={closeAuthModal}
        isLogin={authMode === 'login'}
        onToggleForm={toggleAuthMode}
      /> 

      {/* Toast Notifications */}
      <AnimatePresence>
        {toast && (
          <Toast
            message={toast.message}
            type={toast.type}
            onClose={() => setToast(null)}
          />
        )}
      </AnimatePresence>
    </div>
  );
}
