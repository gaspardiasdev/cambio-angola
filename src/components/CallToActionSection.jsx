/* eslint-disable no-unused-vars */
// src/components/CallToActionSection.js
import { motion } from "framer-motion";
import { useState } from "react";
import useDevice from "../hooks/useDevice";
import { Button, Card } from "../App";

export default function CallToActionSection({
  isLoggedIn,
  isPremium,
  setShowAuthForm,
  handleUpgrade,
}) {
  const [openFaq, setOpenFaq] = useState(null);
  const [hoveredCard, setHoveredCard] = useState(null);
  const device = useDevice(); // 'mobile' | 'tablet' | 'desktop'

  const premiumBenefits = [
    "Alertas WhatsApp ilimitados",
    "Histórico completo (30 dias)",
    "Exportação Excel",
    "Análises de tendência",
    "Sem publicidade",
  ];

  const faqs = [
    {
      q: "Por que devo confiar nas taxas daqui?",
      a: "As taxas são atualizadas em tempo real através de múltiplas fontes verificadas, incluindo bancos e casas de câmbio oficiais.",
      icon: "🛡️",
      color: "from-blue-500 to-blue-600",
    },
    {
      q: "Qual é a diferença do Premium?",
      a: "Usuários Premium recebem alertas personalizados via SMS/WhatsApp e análises avançadas de tendência.",
      icon: "⭐",
      color: "from-purple-500 to-purple-600",
    },
    {
      q: "Vocês vendem ou compram divisas?",
      a: "Não comercializamos moedas. Fornecemos dados precisos e atualizados sobre taxas de câmbio.",
      icon: "ℹ️",
      color: "from-green-500 to-green-600",
    },
    {
      q: "Como posso pagar o Premium?",
      a: "Aceitamos Multicaixa Express, transferência bancária, referência multibanco e cartões de crédito/débito.",
      icon: "💳",
      color: "from-orange-500 to-orange-600",
    },
  ];

  const cardVariants = {
    hidden: { opacity: 0, y: 30, scale: 0.95 },
    visible: {
      opacity: 1,
      y: 0,
      scale: 1,
      transition: { type: "spring", stiffness: 100, damping: 15 },
    },
  };

  return (
    <section className="py-12 bg-white">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Título */}
        <div className="text-center mb-10">
          <h2 className="text-3xl font-bold text-slate-900 mb-4">
            {isPremium ? "Obrigado por ser Premium!" : "Funcionalidades Premium"}
          </h2>
          {!isPremium && (
            <p className="text-lg text-slate-600 max-w-2xl mx-auto">
              Desbloqueia análises avançadas, histórico completo e alertas
              personalizados por apenas{" "}
              <span className="font-semibold text-slate-900">2.500 KZ/mês</span>
            </p>
          )}
        </div>

        {/* Lista de benefícios (só mostra para quem não é Premium) */}
        {!isPremium && (
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4 mb-12">
            {premiumBenefits.map((benefit, index) => (
              <motion.div
                key={benefit}
                variants={cardVariants}
                initial="hidden"
                animate="visible"
                transition={{ delay: index * 0.1 }}
              >
                <Card className="flex items-center gap-3 p-4">
                  <span className="text-green-600 text-lg">✅</span>
                  <span className="text-slate-700 text-sm font-medium">
                    {benefit}
                  </span>
                </Card>
              </motion.div>
            ))}
          </div>
        )}

        {/* FAQ */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-10">
          {faqs.map((faq, index) => (
            <motion.div
              key={index}
              initial="hidden"
              animate="visible"
              variants={cardVariants}
              transition={{ delay: index * 0.1 }}
            >
              <Card className="text-center h-full p-6">
                <div className="text-3xl mb-3">{faq.icon}</div>
                <h3 className="font-semibold text-slate-900 mb-2">{faq.q}</h3>
                <p className="text-sm text-slate-600">{faq.a}</p>
              </Card>
            </motion.div>
          ))}
        </div>

        {/* Botões de ação */}
        <div className="flex flex-col sm:flex-row gap-4 justify-center">
          {!isPremium && (
            <Button variant="primary" size="lg" onClick={handleUpgrade}>
              Upgrade Premium - 2.500 KZ/mês
            </Button>
          )}
          <Button
            variant="success"
            size="lg"
            onClick={() =>
              window.open(
                "https://wa.me/244900000000?text=Quero+receber+alertas+gratuitos",
                "_blank"
              )
            }
          >
            Alertas WhatsApp Grátis
          </Button>
        </div>
      </div>
    </section>
  );
}
