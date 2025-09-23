/* eslint-disable no-unused-vars */
// src/components/MainContentOptimized.js

import { motion } from "framer-motion";
import RateTable from "./RateTable";
import CurrencyChart from "./CurrencyChart";
import AlertForm from "./AlertForm";
import UserAlerts from "./UserAlerts";
import DailySummary from "./DailySummary";
import PhoneForm from "./PhoneForm";

export default function MainContent({
  rates,
  currencies,
  isPremium,
  selectedCurrency,
  setSelectedCurrency,
  exportRates,
  formatDate,
}) {
  const todayRates = rates[0];
  const yesterdayRates = rates[1];

  const containerVariants = {
    hidden: { opacity: 0 },
    visible: {
      opacity: 1,
      transition: { staggerChildren: 0.1 },
    },
  };

  const sectionVariants = {
    hidden: { opacity: 0, y: 30 },
    visible: { 
      opacity: 1, 
      y: 0, 
      transition: { 
        type: "spring", 
        stiffness: 100, 
        damping: 15 
      } 
    },
  };

  return (
    <motion.div
      className="w-full max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 space-y-8 pb-16"
      variants={containerVariants}
      initial="hidden"
      animate="visible"
    >
      {/* Hero Section - Resumo Destacado */}
      <motion.section variants={sectionVariants}>
        <div className="bg-gradient-to-br from-blue-50 via-white to-purple-50 rounded-3xl border border-blue-100 shadow-sm overflow-hidden">
          <div className="px-6 py-8 sm:px-8 sm:py-10">
            <DailySummary
              todayRates={todayRates}
              yesterdayRates={yesterdayRates}
              formatDate={formatDate}
            />
          </div>
        </div>
      </motion.section>

      {/* Tabela Histórica - Mais Compacta */}
      <motion.section variants={sectionVariants}>
        <div className="bg-white rounded-3xl shadow-sm border border-slate-200 overflow-hidden">
          <div className="px-6 py-4 bg-gradient-to-r from-slate-50 to-slate-100 border-b border-slate-200">
            <div className="flex items-center justify-between">
              <div>
                <h3 className="text-xl font-bold text-slate-900">Histórico de Câmbio</h3>
                <p className="text-sm text-slate-600 mt-1">
                  {isPremium ? "Últimos 30 dias" : "Últimos 3 dias"} • 
                  <span className="ml-2 text-xs bg-blue-100 text-blue-800 px-2 py-1 rounded-full">
                    {isPremium ? "Premium" : "Gratuito"}
                  </span>
                </p>
              </div>
              {!isPremium && (
                <div className="text-right">
                  <p className="text-xs text-amber-600 font-medium">
                    Quer ver mais dados?
                  </p>
                  <button className="text-sm text-blue-600 hover:text-blue-700 font-semibold underline">
                    Upgrade para Premium
                  </button>
                </div>
              )}
            </div>
          </div>
          <div className="overflow-x-auto">
            <RateTable
              rates={rates}
              currencies={currencies}
              isPremium={isPremium}
              formatDate={formatDate}
            />
          </div>
        </div>
      </motion.section>

      {/* Seção Premium - Layout em Cards */}
      {isPremium && (
        <motion.section variants={sectionVariants}>
          <div className="bg-gradient-to-br from-indigo-50 via-purple-50 to-pink-50 rounded-3xl p-6 sm:p-8 border border-purple-100 shadow-sm">
            
            {/* Header Premium */}
            <div className="text-center mb-8">
              <div className="inline-flex items-center gap-2 bg-gradient-to-r from-purple-600 to-pink-600 text-white px-4 py-2 rounded-full text-sm font-semibold mb-4">
                <span>✨</span>
                Premium Dashboard
              </div>
              <h2 className="text-2xl sm:text-3xl font-bold text-slate-900 mb-2">
                Análises Avançadas
              </h2>
              <p className="text-slate-600 max-w-2xl mx-auto">
                Ferramentas exclusivas para maximizar suas decisões de câmbio
              </p>
            </div>

            {/* Seletor de Moeda - Mais Visual */}
            <div className="flex flex-wrap justify-center gap-3 mb-8">
              {currencies.map((currency) => (
                <motion.button
                  key={currency.code}
                  onClick={() => setSelectedCurrency(currency.code)}
                  className={`group flex items-center gap-3 px-6 py-3 rounded-2xl font-semibold transition-all duration-300 ${
                    selectedCurrency === currency.code
                      ? "bg-gradient-to-r from-blue-600 to-purple-600 text-white shadow-lg scale-105"
                      : "bg-white/80 text-slate-700 hover:bg-white hover:shadow-md border border-slate-200"
                  }`}
                  whileHover={{ scale: selectedCurrency === currency.code ? 1.05 : 1.02 }}
                  whileTap={{ scale: 0.98 }}
                >
                  <span className="text-2xl">{currency.flag}</span>
                  <div className="text-left">
                    <p className="text-sm font-bold">{currency.name}</p>
                    <p className="text-xs opacity-75">{currency.code.toUpperCase()}</p>
                  </div>
                </motion.button>
              ))}
            </div>

            {/* Botão de Exportar - Mais Destacado */}
            <div className="text-center mb-8">
              <motion.button
                onClick={exportRates}
                className="inline-flex items-center gap-2 px-8 py-4 bg-gradient-to-r from-emerald-500 to-teal-600 text-white font-bold rounded-2xl shadow-lg hover:shadow-xl transition-all duration-300"
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
              >
                <span>📊</span>
                Exportar Dados Completos
                <span>📥</span>
              </motion.button>
            </div>

            {/* Grid Responsivo - Layout Melhorado */}
            <div className="grid grid-cols-1 xl:grid-cols-12 gap-6">
              
              {/* Gráfico Principal - Maior Destaque */}
              <motion.div 
                className="xl:col-span-8"
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: 0.3 }}
              >
                <div className="bg-white/90 backdrop-blur-sm rounded-2xl shadow-lg border border-white/50 overflow-hidden h-full">
                  <div className="px-6 py-4 bg-gradient-to-r from-blue-500 to-purple-500 text-white">
                    <h3 className="text-lg font-bold flex items-center gap-2">
                      <span>📈</span>
                      Análise de Tendência
                    </h3>
                    <p className="text-sm opacity-90">Evolução detalhada das taxas</p>
                  </div>
                  <div className="p-6">
                    <CurrencyChart
                      rates={rates}
                      selectedCurrency={selectedCurrency}
                    />
                  </div>
                </div>
              </motion.div>

              {/* Painel Lateral - Ferramentas */}
              <motion.div 
                className="xl:col-span-4 space-y-4"
                initial={{ opacity: 0, x: 20 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: 0.4 }}
              >
                {/* WhatsApp Alerts */}
                <div className="bg-gradient-to-br from-green-50 to-emerald-50 rounded-2xl border border-green-200 overflow-hidden">
                  <div className="px-4 py-3 bg-gradient-to-r from-green-500 to-emerald-500 text-white">
                    <h4 className="font-bold text-sm flex items-center gap-2">
                      <span>💬</span>
                      Alertas WhatsApp
                    </h4>
                  </div>
                  <div className="p-4">
                    <PhoneForm currencies={currencies} />
                  </div>
                </div>

                {/* Price Alerts */}
                <div className="bg-gradient-to-br from-amber-50 to-orange-50 rounded-2xl border border-amber-200 overflow-hidden">
                  <div className="px-4 py-3 bg-gradient-to-r from-amber-500 to-orange-500 text-white">
                    <h4 className="font-bold text-sm flex items-center gap-2">
                      <span>🔔</span>
                      Alertas de Preço
                    </h4>
                  </div>
                  <div className="p-4">
                    <AlertForm currencies={currencies} />
                  </div>
                </div>

                {/* My Alerts */}
                <div className="bg-gradient-to-br from-blue-50 to-indigo-50 rounded-2xl border border-blue-200 overflow-hidden">
                  <div className="px-4 py-3 bg-gradient-to-r from-blue-500 to-indigo-500 text-white">
                    <h4 className="font-bold text-sm flex items-center gap-2">
                      <span>⚡</span>
                      Meus Alertas
                    </h4>
                  </div>
                  <div className="p-4">
                    <UserAlerts />
                  </div>
                </div>
              </motion.div>
            </div>
          </div>
        </motion.section>
      )}

      {/* Call-to-Action para usuários gratuitos */}
      {!isPremium && (
        <motion.section variants={sectionVariants}>
          <div className="bg-gradient-to-br from-purple-600 to-pink-600 rounded-3xl text-white overflow-hidden shadow-xl">
            <div className="px-6 py-8 sm:px-8 sm:py-12 text-center">
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.5 }}
              >
                <div className="text-6xl mb-4">🚀</div>
                <h3 className="text-2xl sm:text-3xl font-bold mb-4">
                  Desbloqueie o Poder Completo
                </h3>
                <p className="text-lg mb-6 opacity-90 max-w-2xl mx-auto">
                  Gráficos avançados, histórico completo, alertas personalizados e muito mais
                </p>
                
                <div className="flex flex-wrap justify-center gap-4 mb-8">
                  {[
                    "📊 Gráficos Interativos",
                    "📱 Alertas WhatsApp", 
                    "📈 30 Dias de Histórico",
                    "⚡ Notificações Instantâneas"
                  ].map((feature, index) => (
                    <div 
                      key={index}
                      className="bg-white/20 backdrop-blur-sm px-4 py-2 rounded-full text-sm font-medium"
                    >
                      {feature}
                    </div>
                  ))}
                </div>

                <motion.button
                  className="inline-flex items-center gap-3 bg-white text-purple-600 px-8 py-4 rounded-2xl font-bold text-lg shadow-lg hover:shadow-xl transition-all duration-300"
                  whileHover={{ scale: 1.05 }}
                  whileTap={{ scale: 0.95 }}
                >
                  <span>💎</span>
                  Upgrade Premium
                  <span className="text-sm bg-purple-100 px-2 py-1 rounded-full">5.000 KZ/mês</span>
                </motion.button>
              </motion.div>
            </div>
          </div>
        </motion.section>
      )}
    </motion.div>
  );
}