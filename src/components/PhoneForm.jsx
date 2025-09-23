/* eslint-disable no-unused-vars */
import { useState, useEffect } from "react";
import { motion } from "framer-motion";
import { useAuth } from "../context/AuthContext";
import { savePhoneNumber } from "../services/api";

export default function PhoneForm() {
  const { token } = useAuth();
  const [phoneNumber, setPhoneNumber] = useState("");
  const [message, setMessage] = useState("");
  const [isSuccess, setIsSuccess] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [errors, setErrors] = useState({});

  // Formatos de telefone angolanos aceites - CORRIGIDOS
  const phoneFormats = [
    {
      prefix: "+244 9",
      example: "+244 900 000 000",
      description: "Formato internacional",
    },
    {
      prefix: "244 9",
      example: "244 900 000 000",
      description: "Sem símbolo +",
    },
    {
      prefix: "9",
      example: "900 000 000",
      description: "Formato local",
    },
  ];

  // Função para formatar o telefone no padrão angolano CORRETO
  const formatPhoneNumber = (value) => {
    // Remove todos os caracteres não numéricos exceto +
    let cleaned = value.replace(/[^\d+]/g, "");

    // Se começar com +244, remove o +244 temporariamente
    if (cleaned.startsWith("+244")) {
      cleaned = cleaned.slice(4);
    }
    // Se começar com 244, remove o 244
    else if (cleaned.startsWith("244")) {
      cleaned = cleaned.slice(3);
    }

    // Garante que só tem números a partir daqui
    cleaned = cleaned.replace(/\D/g, "");

    // Formata no padrão angolano CORRETO: +244 900 000 000
    if (cleaned.length > 0) {
      // Adiciona o +244 no início
      let formatted = "+244 ";

      // Pega os próximos 9 dígitos (o número angolano tem 9 dígitos após o 244)
      const digits = cleaned.slice(0, 9);

      if (digits.length > 0) {
        // Formata CORRETAMENTE: 900 000 000 (3-3-3)
        formatted += digits.slice(0, 3); // Primeiros 3 dígitos: 900

        if (digits.length > 3) {
          formatted += " " + digits.slice(3, 6); // Próximos 3 dígitos: 000
        }
        if (digits.length > 6) {
          formatted += " " + digits.slice(6, 9); // Últimos 3 dígitos: 000
        }
      }

      return formatted.trim();
    }

    return value;
  };

  const validatePhoneNumber = (number) => {
    const newErrors = {};

    if (!number || number.trim() === "") {
      newErrors.phone = "Número de telefone é obrigatório";
      setErrors(newErrors);
      return false;
    }

    // Remove espaços para validação
    const cleanNumber = number.replace(/\s/g, "");

    // Regex para números angolanos (formato padrão: +2449XXXXXXXX)
    const phoneRegex = /^\+2449\d{8}$/;

    const isValid = phoneRegex.test(cleanNumber);

    if (!isValid) {
      newErrors.phone =
        "Número de telefone angolano inválido. Formato: +244 900 000 000";
    }

    setErrors(newErrors);
    return isValid;
  };

  const handlePhoneChange = (e) => {
    const rawValue = e.target.value;
    const formattedValue = formatPhoneNumber(rawValue);
    setPhoneNumber(formattedValue);

    // Validação em tempo real
    if (formattedValue) {
      setTimeout(() => validatePhoneNumber(formattedValue), 300);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setMessage("");
    setIsSuccess(false);

    // Remove espaços antes de enviar para a API
    const cleanPhoneNumber = phoneNumber.replace(/\s/g, "");

    if (!validatePhoneNumber(phoneNumber)) {
      return;
    }

    if (!token) {
      setMessage("Precisa estar autenticado para salvar o número.");
      setIsSuccess(false);
      return;
    }

    try {
      setIsLoading(true);
      // Envia o número sem espaços: +2449XXXXXXXX
      const response = await savePhoneNumber(cleanPhoneNumber, token);
      setMessage("✅ Número de telefone salvo com sucesso!");
      setIsSuccess(true);

      // Limpa erros
      setErrors({});
    } catch (error) {
      console.error("Erro ao salvar telefone:", error);
      setMessage(`❌ ${error.message}`);
      setIsSuccess(false);
    } finally {
      setIsLoading(false);
    }
  };

  // Limpa mensagens após 5 segundos
  useEffect(() => {
    if (message) {
      const timer = setTimeout(() => {
        setMessage("");
        setIsSuccess(false);
      }, 5000);
      return () => clearTimeout(timer);
    }
  }, [message]);

  const getInputBorderColor = () => {
    if (errors.phone) return "border-red-500 focus:ring-red-500";
    if (phoneNumber && !errors.phone && phoneNumber.length > 5)
      return "border-green-500 focus:ring-green-500";
    return "border-gray-300 focus:ring-blue-500";
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5, delay: 0.1 }}
      whileHover={{ scale: 1.01 }}
      className="bg-white/80 backdrop-blur-md p-6 rounded-2xl shadow-lg border border-white/20"
    >
      {/* Header */}
      <div className="flex items-center gap-3 mb-4">
        <motion.div
          className="w-10 h-10 bg-gradient-to-br from-green-500 to-emerald-600 rounded-xl flex items-center justify-center shadow-lg"
          animate={{ rotate: [0, 10, -10, 0] }}
          transition={{ duration: 2, repeat: Infinity }}
        >
          <span className="text-white text-lg">📱</span>
        </motion.div>
        <div>
          <h3 className="text-lg font-bold mb-1 text-gray-800">
            Alertas WhatsApp
          </h3>
          <p className="text-gray-600 text-sm">
            Receba notificações instantâneas das melhores taxas
          </p>
        </div>
      </div>

      {/* Formatos aceites */}
      <div className="mb-4 p-3 bg-blue-50 rounded-lg border border-blue-200">
        <p className="text-xs font-semibold text-blue-800 mb-2">
          📋 Formatos aceites:
        </p>
        <div className="space-y-1">
          {phoneFormats.map((format, index) => (
            <div
              key={index}
              className="flex items-center justify-between text-xs"
            >
              <span className="font-mono text-blue-700">{format.example}</span>
              <span className="text-blue-600">{format.description}</span>
            </div>
          ))}
        </div>
        <p className="text-xs text-blue-600 mt-2">
          <strong>Padrão final:</strong> +244 9XX XXX XXX
        </p>
      </div>

      <form onSubmit={handleSubmit} className="space-y-4">
        {/* Input do telefone */}
        <div>
          <label
            htmlFor="phone"
            className="block text-sm font-medium text-gray-700 mb-2"
          >
            Número de Telefone
          </label>
          <div className="relative">
            <input
              type="tel"
              id="phone"
              value={phoneNumber}
              onChange={handlePhoneChange}
              placeholder="Ex: +244 900 000 000" 
              className={`w-full p-3 rounded-lg shadow-sm bg-white/70 focus:outline-none focus:ring-2 transition duration-200 ${getInputBorderColor()}`}
              required
              disabled={isLoading}
            />

            {/* Indicador visual */}
            <div className="absolute right-3 top-1/2 transform -translate-y-1/2">
              {phoneNumber && !errors.phone && phoneNumber.length > 10 && (
                <motion.span
                  initial={{ scale: 0 }}
                  animate={{ scale: 1 }}
                  className="text-green-500 text-lg"
                >
                  ✅
                </motion.span>
              )}
              {errors.phone && (
                <motion.span
                  initial={{ scale: 0 }}
                  animate={{ scale: 1 }}
                  className="text-red-500 text-lg"
                >
                  ❌
                </motion.span>
              )}
            </div>
          </div>

          {/* Mensagem de erro */}
          {errors.phone && (
            <motion.p
              className="mt-2 text-sm text-red-600 flex items-center gap-2"
              initial={{ opacity: 0, y: -5 }}
              animate={{ opacity: 1, y: 0 }}
            >
              <span>⚠️</span>
              {errors.phone}
            </motion.p>
          )}

          {/* Dica de formatação */}
          {phoneNumber && !errors.phone && phoneNumber.length > 5 && (
            <motion.p
              className="mt-2 text-sm text-green-600 flex items-center gap-2"
              initial={{ opacity: 0, y: -5 }}
              animate={{ opacity: 1, y: 0 }}
            >
              <span>✅</span>
              Número válido! Pronto para receber alertas.
            </motion.p>
          )}
        </div>

        {/* Botão de submit */}
        <motion.button
          type="submit"
          disabled={isLoading || !!errors.phone || !phoneNumber}
          whileHover={{
            scale: !isLoading && !errors.phone && phoneNumber ? 1.02 : 1,
          }}
          whileTap={{
            scale: !isLoading && !errors.phone && phoneNumber ? 0.98 : 1,
          }}
          className={`w-full py-3 rounded-lg font-bold shadow-md text-white transition-all duration-200 ${
            isLoading || !!errors.phone || !phoneNumber
              ? "bg-gray-400 cursor-not-allowed"
              : "bg-gradient-to-r from-green-600 to-emerald-700 hover:from-green-700 hover:to-emerald-800 shadow-lg hover:shadow-xl"
          }`}
        >
          {isLoading ? (
            <div className="flex items-center justify-center gap-2">
              <motion.div
                className="w-4 h-4 border-2 border-white border-t-transparent rounded-full"
                animate={{ rotate: 360 }}
                transition={{ duration: 1, repeat: Infinity, ease: "linear" }}
              />
              A guardar...
            </div>
          ) : (
            <div className="flex items-center justify-center gap-2">
              <span>💾</span>
              Salvar Número
            </div>
          )}
        </motion.button>
      </form>

      {/* Mensagem de feedback */}
      {message && (
        <motion.div
          className={`mt-4 p-3 rounded-lg text-sm font-medium text-center shadow-sm border ${
            isSuccess
              ? "bg-green-50 text-green-700 border-green-200"
              : "bg-red-50 text-red-700 border-red-200"
          }`}
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: -10 }}
        >
          {message}
        </motion.div>
      )}

      {/* Informações adicionais */}
      <div className="mt-4 p-3 bg-gradient-to-r from-blue-50 to-purple-50 rounded-lg border border-blue-200">
        <div className="flex items-start gap-2">
          <span className="text-blue-600 text-sm">ℹ️</span>
          <div className="text-xs text-blue-800">
            <p className="font-semibold mb-1">Como funciona:</p>
            <ul className="space-y-1 text-blue-700">
              <li>
                • Receba alertas quando as taxas atingirem valores favoráveis
              </li>
              <li>• Notificações instantâneas via WhatsApp</li>
              <li>• Dados atualizados em tempo real</li>
              <li>• Privacidade garantida - seu número fica seguro</li>
            </ul>
          </div>
        </div>
      </div>

      {/* Exemplo do formato que será enviado */}
      {phoneNumber && !errors.phone && (
        <motion.div
          initial={{ opacity: 0, height: 0 }}
          animate={{ opacity: 1, height: "auto" }}
          className="mt-4 p-3 bg-gray-50 rounded-lg border border-gray-200"
        >
          <p className="text-xs text-gray-600 mb-1">📤 Será enviado como:</p>
          <p className="font-mono text-sm text-gray-800">
            {phoneNumber.replace(/\s/g, "")}
          </p>
        </motion.div>
      )}

      {/* Botão de teste (apenas para demonstração) */}
      {phoneNumber && !errors.phone && !isLoading && (
        <motion.div
          initial={{ opacity: 0, height: 0 }}
          animate={{ opacity: 1, height: "auto" }}
          className="mt-4"
        >
          <button
            type="button"
            className="w-full py-2 px-4 text-sm font-medium text-blue-700 bg-blue-50 border border-blue-200 rounded-lg hover:bg-blue-100 transition-colors duration-200"
            onClick={() => {
              setMessage(
                "📱 Teste de notificação enviado! Verifique seu WhatsApp."
              );
              setIsSuccess(true);
            }}
          >
            📤 Enviar Teste de Notificação
          </button>
        </motion.div>
      )}
    </motion.div>
  );
}
