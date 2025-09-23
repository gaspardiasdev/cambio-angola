/* eslint-disable no-unused-vars */
import React, { useState } from "react";
import { motion } from "framer-motion";
import { useAuth } from "./../context/AuthContext";
import { createAlert } from "./../services/api";

export default function AlertForm({ currencies, isPremium = false }) {
  const { isLoggedIn, setAuthMessage, token } = useAuth();
  const [alertForm, setAlertForm] = useState({
    currency: "usd",
    value: "",
    rateType: "buy",
    alertType: "simple", // simple, percentage, trend
    percentageChange: 2, // valor padrão para variação percentual
  });
  const [alertMessage, setAlertMessage] = useState("");
  const [isError, setIsError] = useState(false);
  const [isLoading, setIsLoading] = useState(false);

  // Tipos de alerta disponíveis
  const alertTypes = [
    { 
      value: "simple", 
      label: "Valor Fixo", 
      icon: "🎯",
      description: "Alerta quando atingir um valor específico",
      available: true // Disponível para todos
    },
    { 
      value: "percentage", 
      label: "Variação Percentual", 
      icon: "📊",
      description: "Alerta quando houver variação significativa",
      available: isPremium // Apenas premium
    },
    { 
      value: "trend", 
      label: "Mudança de Tendência", 
      icon: "⚡",
      description: "Alerta quando a tendência do mercado mudar",
      available: isPremium // Apenas premium
    }
  ];

  const handleAlertSubmit = async (e) => {
    e.preventDefault();

    if (!isLoggedIn) {
      setAuthMessage("Faz login ou regista-te para definir um alerta.");
      return;
    }

    // Validações específicas por tipo de alerta
    if (alertForm.alertType === "simple" && (!alertForm.value || parseFloat(alertForm.value) <= 0)) {
      setAlertMessage("⚠️ Insira um valor maior que zero.");
      setIsError(true);
      return;
    }

    if (alertForm.alertType === "percentage" && (!alertForm.percentageChange || alertForm.percentageChange < 1)) {
      setAlertMessage("⚠️ A variação percentual deve ser pelo menos 1%.");
      setIsError(true);
      return;
    }

    try {
      setIsLoading(true);
      
      // Preparar dados conforme o tipo de alerta
      const alertData = {
        currency: alertForm.currency,
        rateType: alertForm.rateType,
        alertType: alertForm.alertType,
        value: alertForm.alertType === "percentage" ? alertForm.percentageChange : alertForm.value
      };

      const data = await createAlert(alertData, token);
      setAlertMessage(data.message || "✅ Alerta definido com sucesso!");
      setIsError(false);
      
      // Reset do formulário mantendo algumas preferências
      setAlertForm(prev => ({
        ...prev,
        value: "",
        percentageChange: 2
      }));
    } catch (error) {
      console.error("Erro ao enviar o alerta:", error);
      setAlertMessage(error.message || "❌ Erro ao definir alerta.");
      setIsError(true);
    } finally {
      setIsLoading(false);
    }
  };

  const renderAlertTypeDescription = () => {
    const currentType = alertTypes.find(type => type.value === alertForm.alertType);
    return (
      <div className="mt-2 p-3 bg-blue-50 rounded-lg border border-blue-200">
        <p className="text-sm text-blue-700 flex items-center gap-2">
          <span className="text-lg">{currentType?.icon}</span>
          {currentType?.description}
        </p>
      </div>
    );
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5, delay: 0.1 }}
      whileHover={{ scale: 1.01 }}
      className="p-6 bg-white/80 backdrop-blur-md rounded-2xl shadow-lg mb-6"
    >
      <div className="flex items-center justify-between mb-4">
        <h3 className="text-lg font-bold text-gray-800">
          🔔 Alertas Inteligentes
        </h3>
        {!isPremium && (
          <span className="text-xs bg-amber-100 text-amber-800 px-2 py-1 rounded-full">
            Básico
          </span>
        )}
      </div>

      <form onSubmit={handleAlertSubmit} className="space-y-4">
        {/* Moeda */}
        <div>
          <label className="text-sm font-medium mb-1 block">Moeda</label>
          <select
            value={alertForm.currency}
            onChange={(e) =>
              setAlertForm({ ...alertForm, currency: e.target.value })
            }
            className="p-3 w-full rounded-lg shadow-sm bg-white/70 border focus:outline-none focus:ring-2 focus:ring-blue-400"
          >
            {currencies.map((currency) => (
              <option key={currency.code} value={currency.code}>
                {currency.name} ({currency.code.toUpperCase()})
              </option>
            ))}
          </select>
        </div>

        {/* Tipo de Transação */}
        <div>
          <label className="text-sm font-medium mb-1 block">
            Tipo de Transação
          </label>
          <div className="flex gap-6">
            <label className="flex items-center gap-2 cursor-pointer">
              <input
                type="radio"
                name="rateType"
                value="buy"
                checked={alertForm.rateType === "buy"}
                onChange={(e) =>
                  setAlertForm({ ...alertForm, rateType: e.target.value })
                }
                className="form-radio text-blue-500"
              />
              Compra
            </label>
            <label className="flex items-center gap-2 cursor-pointer">
              <input
                type="radio"
                name="rateType"
                value="sell"
                checked={alertForm.rateType === "sell"}
                onChange={(e) =>
                  setAlertForm({ ...alertForm, rateType: e.target.value })
                }
                className="form-radio text-blue-500"
              />
              Venda
            </label>
          </div>
        </div>

        {/* Tipo de Alerta */}
        <div>
          <label className="text-sm font-medium mb-1 block">
            Tipo de Alerta
          </label>
          <div className="grid grid-cols-1 gap-2">
            {alertTypes.map((type) => (
              <label
                key={type.value}
                className={`flex items-center p-3 rounded-lg border cursor-pointer transition-all ${
                  alertForm.alertType === type.value
                    ? "border-blue-500 bg-blue-50"
                    : "border-gray-200 hover:border-gray-300"
                } ${!type.available ? "opacity-50 cursor-not-allowed" : ""}`}
              >
                <input
                  type="radio"
                  name="alertType"
                  value={type.value}
                  checked={alertForm.alertType === type.value}
                  onChange={(e) =>
                    setAlertForm({ ...alertForm, alertType: e.target.value })
                  }
                  disabled={!type.available}
                  className="form-radio text-blue-500"
                />
                <div className="ml-3">
                  <div className="flex items-center gap-2">
                    <span className="text-lg">{type.icon}</span>
                    <span className="font-medium">{type.label}</span>
                    {!type.available && (
                      <span className="text-xs bg-purple-100 text-purple-800 px-2 py-1 rounded-full ml-2">
                        Premium
                      </span>
                    )}
                  </div>
                </div>
              </label>
            ))}
          </div>
        </div>

        {/* Campo dinâmico baseado no tipo de alerta */}
        {alertForm.alertType === "simple" && (
          <div>
            <label className="text-sm font-medium mb-1 block">
              Valor-Alvo (Kz)
            </label>
            <input
              type="number"
              placeholder="Ex: 850"
              value={alertForm.value}
              onChange={(e) =>
                setAlertForm({ ...alertForm, value: e.target.value })
              }
              className="p-3 w-full rounded-lg shadow-sm bg-white/70 border focus:outline-none focus:ring-2 focus:ring-blue-400"
              required
            />
          </div>
        )}

        {alertForm.alertType === "percentage" && (
          <div>
            <label className="text-sm font-medium mb-1 block">
              Variação Percentual (%)
            </label>
            <input
              type="number"
              min="1"
              max="20"
              step="0.5"
              value={alertForm.percentageChange}
              onChange={(e) =>
                setAlertForm({ ...alertForm, percentageChange: e.target.value })
              }
              className="p-3 w-full rounded-lg shadow-sm bg-white/70 border focus:outline-none focus:ring-2 focus:ring-blue-400"
              required
            />
            <p className="text-xs text-gray-500 mt-1">
              Alerta quando a taxa variar mais de {alertForm.percentageChange}%
            </p>
          </div>
        )}

        {alertForm.alertType === "trend" && (
          <div className="p-4 bg-gray-50 rounded-lg">
            <p className="text-sm text-gray-600 text-center">
              <span className="text-lg">⚡</span><br />
              Serás alertado automaticamente quando detectarmos uma mudança
              significativa na tendência do mercado para {alertForm.currency.toUpperCase()}.
            </p>
          </div>
        )}

        {/* Descrição do tipo de alerta */}
        {renderAlertTypeDescription()}

        {/* Botão */}
        <motion.button
          type="submit"
          disabled={isLoading || (!isPremium && alertForm.alertType !== "simple")}
          whileHover={{ scale: !isLoading ? 1.02 : 1 }}
          whileTap={{ scale: !isLoading ? 0.98 : 1 }}
          className={`w-full py-3 rounded-lg font-bold shadow-md text-white transition
            ${
              isLoading || (!isPremium && alertForm.alertType !== "simple")
                ? "bg-gray-400 cursor-not-allowed"
                : "bg-blue-500 hover:bg-blue-600"
            }
          `}
        >
          {isLoading ? "A guardar..." : "Definir Alerta Inteligente"}
        </motion.button>

        {/* Call-to-action para upgrade */}
        {!isPremium && alertForm.alertType !== "simple" && (
          <div className="p-3 bg-purple-50 rounded-lg border border-purple-200 text-center">
            <p className="text-sm text-purple-700 mb-2">
              <strong>Alertas Inteligentes são exclusivos Premium</strong>
            </p>
            <button
              type="button"
              onClick={() => setAuthMessage("Contacte-nos para upgrade para Premium!")}
              className="text-xs bg-purple-600 text-white px-3 py-1 rounded-full hover:bg-purple-700 transition"
            >
              Quero Upgrade
            </button>
          </div>
        )}
      </form>

      {alertMessage && (
        <div
          className={`mt-4 p-3 rounded-lg text-sm font-medium text-center shadow-sm 
            ${
              isError
                ? "bg-red-50 text-red-700 border border-red-200"
                : "bg-green-50 text-green-700 border border-green-200"
            }
          `}
        >
          {alertMessage}
        </div>
      )}

      {/* Comparação com concorrentes */}
      <div className="mt-6 p-4 bg-gray-50 rounded-lg border border-gray-200">
        <h4 className="text-sm font-semibold text-gray-800 mb-2">
          📋 Comparação com Outras Plataformas
        </h4>
        <div className="text-xs text-gray-600 space-y-1">
          <div className="flex justify-between">
            <span>Cambiang:</span>
            <span>Alertas básicos apenas</span>
          </div>
          <div className="flex justify-between">
            <span>OPEx:</span>
            <span>Sem alertas personalizados</span>
          </div>
          <div className="flex justify-between font-semibold text-blue-600">
            <span>Nosso diferencial:</span>
            <span>Alertas inteligentes e personalizados</span>
          </div>
        </div>
      </div>
    </motion.div>
  );
}