/* eslint-disable no-unused-vars */
// src/services/api.js
import { healthCheck } from './healthCheck.js';
const API_BASE_URL = import.meta.env.VITE_API_URL || "http://localhost:5000";
const REQUEST_TIMEOUT = Number(import.meta.env.VITE_API_TIMEOUT) || 30000;


// Classe de erro padronizada
export class ApiError extends Error {
  constructor(message, status = 500, data = null) {
    super(message);
    this.name = "ApiError";
    this.status = status;
    this.data = data;
  }
}

// Melhorar em api.js
export const apiFetchWithFallback = async (endpoint, options = {}, token = null, retries = 2) => {
  const urls = [
    import.meta.env.VITE_API_URL,
    "https://cambio-angola-backend-production.up.railway.app",
    "http://localhost:5000"
  ].filter(Boolean);
  
  let lastError;
  
  for (const baseUrl of urls) {
    try {
      console.log(`Tentando conectar com: ${baseUrl}`);
      
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 10000);

      const headers = { 
        "Content-Type": "application/json", 
        ...options.headers 
      };
      
      if (token) {
        headers["Authorization"] = `Bearer ${token}`;
      }

      const response = await fetch(`${baseUrl}/api${endpoint}`, {
        ...options,
        headers,
        signal: controller.signal,
      });

      clearTimeout(timeoutId);

      if (response.ok) {
        console.log(`Conectado com sucesso: ${baseUrl}`);
        
        // Atualizar a URL base para próximas chamadas
        if (baseUrl !== API_BASE_URL) {
          console.log(`Mudando URL base para: ${baseUrl}`);
        }
        
        const contentType = response.headers.get("content-type");
        
        if (contentType && contentType.includes("application/json")) {
          return await response.json();
        } else if (contentType && contentType.includes("text")) {
          return { message: await response.text() };
        }
        
        return response;
      } else {
        throw new Error(`HTTP ${response.status}: ${response.statusText}`);
      }
      
    } catch (error) {
      console.warn(`Falhou conectar com ${baseUrl}:`, error.message);
      lastError = error;
      continue;
    }
  }
  
  throw new ApiError(
    `Não foi possível conectar com nenhum servidor. Último erro: ${lastError?.message}`,
    503
  );
};

// Validação de inputs
export const validateInput = (data, rules = {}) => {
  const errors = {};
  Object.keys(rules).forEach((field) => {
    const value = data[field];
    const rule = rules[field];
    if (rule.required && (!value || value.toString().trim() === ""))
      errors[field] = `${field} é obrigatório`;
    if (
      value &&
      rule.type === "email" &&
      !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value)
    )
      errors[field] = "Email inválido";
    if (value && rule.type === "phone" && !/^\+244\s?9\d{8}$/.test(value))
      errors[field] = "Número de telefone angolano inválido";
    if (value && rule.min && value.toString().length < rule.min)
      errors[field] = `${field} deve ter pelo menos ${rule.min} caracteres`;
    if (value && rule.max && value.toString().length > rule.max)
      errors[field] = `${field} deve ter no máximo ${rule.max} caracteres`;
    if (value && rule.pattern && !rule.pattern.test(value))
      errors[field] = rule.message || `${field} tem formato inválido`;
  });
  return { isValid: Object.keys(errors).length === 0, errors };
};

// Hook para pegar token da sessão
const getToken = () => {
  try {
    const raw = localStorage.getItem("userSession");
    if (!raw) return null;
    const parsed = JSON.parse(raw);
    return parsed?.token || null;
  } catch (err) {
    console.warn("userSession inválido no localStorage:", err);
    return null;
  }
};


// === AUTENTICAÇÃO ===
export const login = async (email, password) => {
  const validation = validateInput(
    { email, password },
    {
      email: { required: true, type: "email" },
      password: { required: true, min: 8 }
    }
  );
  if (!validation.isValid) throw new ApiError(Object.values(validation.errors)[0]);

  const data = await apiFetchWithFallback("/auth/login", {
    method: "POST",
    body: JSON.stringify({ email, password })
  });

  // salvar sessão (token + user)
  if (data?.token) {
    localStorage.setItem("userSession", JSON.stringify({ token: data.token, user: data.user || null }));
  }

  return data;
};


export const register = async (email, password) => {
  const validation = validateInput(
    { email, password },
    {
      email: { required: true, type: "email" },
      password: { required: true, min: 8 }
    }
  );
  if (!validation.isValid) throw new ApiError(Object.values(validation.errors)[0]);

  const data = await apiFetchWithFallback("/auth/register", {
    method: "POST",
    body: JSON.stringify({ email, password })
  });

  if (data?.token) {
    localStorage.setItem("userSession", JSON.stringify({ token: data.token, user: data.user || null }));
  }

  return data;
};


export const validateSession = async () => {
  const token = getToken();
  if (!token) throw new ApiError("Autenticação necessária.");
  return apiFetchWithFallback("/auth/validate", { method: "POST" }, token);
};


// === TAXAS ===
export const fetchRates = async () => apiFetchWithFallback("/rates", {}, getToken());

export const fetchRatesStats = async () => {
  const token = getToken();
  if (!token) throw new ApiError("Autenticação necessária.");
  return apiFetchWithFallback("/rates/stats", {}, token);
};

// === ALERTAS ===
export const createAlert = async (alertData) => {
  const token = getToken();
  if (!token) throw new ApiError("Autenticação necessária.");

  const validation = validateInput(alertData, {
    currency: { required: true },
    value: { required: true },
    rateType: { required: true },
  });
  if (!validation.isValid)
    throw new ApiError(Object.values(validation.errors)[0]);

  const sanitizedData = {
    currency: alertData.currency.toLowerCase().trim(),
    value: parseFloat(alertData.value),
    type: alertData.type || "above",
    rateType: alertData.rateType.toLowerCase().trim(),
  };
  
  if (sanitizedData.value <= 0)
    throw new ApiError("O valor deve ser maior que zero.");
  if (!["buy", "sell"].includes(sanitizedData.rateType))
    throw new ApiError("Tipo de taxa inválido.");
  if (!["usd", "eur", "zar", "cad"].includes(sanitizedData.currency))
    throw new ApiError("Moeda não suportada.");

  return apiFetchWithFallback("/alerts", {
    method: "POST",
    body: JSON.stringify(sanitizedData)
  }, token);
};

export const fetchUserAlerts = async () => {
  const token = getToken();
  if (!token) throw new ApiError("Autenticação necessária.");
  return apiFetchWithFallback("/alerts", {}, token);
};

export const deleteAlert = async (alertId) => {
  const token = getToken();
  if (!token) throw new ApiError("Autenticação necessária.");
  if (!alertId || typeof alertId !== "string")
    throw new ApiError("ID do alerta inválido.");
  return apiFetchWithFallback(`/alerts/${alertId}`, { method: "DELETE" }, token);
};

// === SIMULADOR ===
export const simulateExchange = async (simulationData) => {
  const token = getToken();
  if (!token) throw new ApiError("Autenticação necessária.");

  const validation = validateInput(simulationData, {
    amount: { required: true },
    fromCurrency: { required: true },
    toCurrency: { required: true }
  });
  if (!validation.isValid)
    throw new ApiError(Object.values(validation.errors)[0]);

  return apiFetchWithFallback("/simulate", {
    method: "POST",
    body: JSON.stringify(simulationData)
  }, token);
};

// === UTILIZADOR ===
export const savePhoneNumber = async (phoneNumber) => {
  const token = getToken();
  if (!token) throw new ApiError("Autenticação necessária.");

  const validation = validateInput(
    { phoneNumber },
    { phoneNumber: { required: true, type: "phone" } }
  );
  if (!validation.isValid) throw new ApiError(validation.errors.phoneNumber);

  return apiFetchWithFallback("/user/phone", {
    method: "POST",
    body: JSON.stringify({ phoneNumber: phoneNumber.trim() })
  }, token);
};

// === EXPORTAÇÃO ===
export const exportData = async () => {
  const token = getToken();
  if (!token) throw new ApiError("Autenticação necessária para exportar dados.");

  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), 30000);

  try {
    const response = await fetch(`${API_BASE_URL}/api/export-rates`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${token}`,
      },
      signal: controller.signal,
    });
    clearTimeout(timeoutId);

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      throw new ApiError(
        errorData.message || "Falha na exportação de dados.",
        response.status,
        errorData
      );
    }

    const blob = await response.blob();
    if (blob.size === 0)
      throw new ApiError("Arquivo de exportação vazio.", 204);

    const url = window.URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.style.display = "none";
    a.href = url;
    a.download = `taxas_cambio_${new Date().toISOString().split("T")[0]}.xlsx`;
    document.body.appendChild(a);
    a.click();
    window.URL.revokeObjectURL(url);
    document.body.removeChild(a);

    return { success: true, message: "Dados exportados com sucesso!" };
  } catch (error) {
    clearTimeout(timeoutId);
    if (error.name === "AbortError")
      throw new ApiError("Tempo limite para exportação excedido", 408);
    throw error;
  }
};

// === ADMINISTRAÇÃO ===
export const updateRates = async (ratesData) => {
  const token = getToken();
  if (!token) throw new ApiError("Autenticação de administrador necessária.");

  const requiredFields = [
    "usdBuy", "usdSell", "eurBuy", "eurSell", 
    "zarBuy", "zarSell", "cadBuy", "cadSell"
  ];
  
  const validation = validateInput(
    ratesData,
    requiredFields.reduce((acc, f) => ({ ...acc, [f]: { required: true } }), {})
  );
  if (!validation.isValid)
    throw new ApiError("Todos os campos de taxas são obrigatórios.");

  const sanitized = {};
  Object.entries(ratesData).forEach(([k, v]) => {
    const num = parseFloat(v);
    if (isNaN(num) || num <= 0)
      throw new ApiError(`Taxa ${k} deve ser um número positivo.`);
    sanitized[k] = num;
  });

  return apiFetchWithFallback("/admin/rates", {
    method: "POST",
    body: JSON.stringify(sanitized)
  }, token);
};

export const fetchUsers = async () => {
  const token = getToken();
  if (!token) throw new ApiError("Autenticação necessária.");
  return apiFetchWithFallback("/admin/users", {}, token);
};

export const updateUserPremium = async (userId, isPremium) => {
  const token = getToken();
  if (!token) throw new ApiError("Autenticação de administrador necessária.");

  // Validate userId format (should be MongoDB ObjectId)
  if (!userId || typeof userId !== 'string' || userId.length !== 24) {
    throw new ApiError("ID de usuário inválido. Use o ID do MongoDB.");
  }

  return apiFetchWithFallback(`/admin/users/${userId}/premium`, {
    method: "PATCH",
    body: JSON.stringify({ isPremium })
  }, token);
};

// Add this function to api.js
export const getUserIdByEmail = async (email) => {
  const token = getToken();
  if (!token) throw new ApiError("Autenticação necessária.");
  
  try {
    const usersData = await fetchUsers();
    const user = usersData.users?.find(u => u.email === email);
    
    if (!user) {
      throw new ApiError(`Utilizador com email "${email}" não encontrado`);
    }
    
    return user._id;
  } catch (error) {
    throw new ApiError(`Erro ao buscar utilizador: ${error.message}`);
  }
};

// Alternative version of updateUserPremium that uses email:
export const updateUserPremiumByEmail = async (email, isPremium) => {
  const token = getToken();
  if (!token) throw new ApiError("Autenticação de administrador necessária.");

  // Validate email format
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  if (!emailRegex.test(email)) {
    throw new ApiError("Email inválido.");
  }

  return apiFetchWithFallback(`/admin/users/email/${encodeURIComponent(email)}/premium`, {
    method: "PATCH",
    body: JSON.stringify({ isPremium })
  }, token);
};

// Update the aliases to use the correct function:
export const upgradeToPremium = async (userEmailOrId) => {
  // Check if it's an email or MongoDB ObjectId
  if (userEmailOrId.includes('@')) {
    return updateUserPremiumByEmail(userEmailOrId, true);
  } else {
    return updateUserPremium(userEmailOrId, true);
  }
};

export const removePremium = async (userEmailOrId) => {
  if (userEmailOrId.includes('@')) {
    return updateUserPremiumByEmail(userEmailOrId, false);
  } else {
    return updateUserPremium(userEmailOrId, false);
  }
};

export const findUserByEmail = async (email) => {
  const token = getToken();
  if (!token) throw new ApiError("Autenticação de administrador necessária.");
  
  const users = await fetchUsers();
  const user = users.users?.find(u => u.email === email);
  
  if (!user) {
    throw new ApiError(`Utilizador com email "${email}" não encontrado`);
  }
  
  return user;
};

export const fetchAllAlerts = async () => {
  const token = getToken();
  if (!token) throw new ApiError("Autenticação de administrador necessária.");
  return apiFetchWithFallback("/admin/alerts", {}, token);
};

export const googleAuth = async (googleCredential) => {
  const validation = validateInput(
    { credential: googleCredential.credential },
    { credential: { required: true } }
  );
  if (!validation.isValid) throw new ApiError(Object.values(validation.errors)[0]);

  return apiFetchWithFallback("/auth/google", {
    method: "POST",
    body: JSON.stringify({
      credential: googleCredential.credential,
      clientId: googleCredential.clientId
    })
  });
};

// Listener global para erros de autenticação
if (typeof window !== "undefined") {
  window.addEventListener("auth-error", (event) => {
    console.warn("Erro de autenticação:", event.detail.message);
  });
}