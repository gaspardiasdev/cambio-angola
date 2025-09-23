// src/services/api.js
const API_BASE_URL = import.meta.env.VITE_API_URL || "http://localhost:5000";
const REQUEST_TIMEOUT = 30000; // 30 segundos

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
export const apiFetch = async (endpoint, options = {}, token = null, retries = 3) => {
  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), REQUEST_TIMEOUT);

  try {
    const headers = { 
      "Content-Type": "application/json", 
      ...options.headers 
    };
    
    if (token) {
      headers["Authorization"] = `Bearer ${token}`;
    }

    const response = await fetch(`${API_BASE_URL}/api${endpoint}`, {
      ...options,
      headers,
      signal: controller.signal,
    });

    clearTimeout(timeoutId);

    // CORREÇÃO: Melhor handling de diferentes tipos de resposta
    let data = null;
    const contentType = response.headers.get("content-type");
    
    if (contentType && contentType.includes("application/json")) {
      try {
        data = await response.json();
      } catch (parseError) {
        console.warn("Erro ao fazer parse do JSON:", parseError);
        data = { message: "Resposta inválida do servidor" };
      }
    } else if (contentType && contentType.includes("text")) {
      data = { message: await response.text() };
    }

    if (!response.ok) {
      // CORREÇÃO: Handling mais específico por status code
      switch (response.status) {
        case 401:
          localStorage.removeItem("userSession");
          window.dispatchEvent(
            new CustomEvent("auth-error", {
              detail: { message: "Sessão expirada. Faça login novamente." },
            })
          );
          break;
        case 403:
          throw new ApiError("Acesso negado", 403, data);
        case 404:
          throw new ApiError("Recurso não encontrado", 404, data);
        case 429:
          throw new ApiError("Muitas tentativas. Tente novamente mais tarde.", 429, data);
        default:
          throw new ApiError(
            data?.message || `Erro HTTP ${response.status}`,
            response.status,
            data
          );
      }
    }

    return data;
  } catch (error) {
    clearTimeout(timeoutId);

    if (error.name === "AbortError") {
      throw new ApiError("Tempo limite da requisição excedido", 408);
    }

    if (error instanceof ApiError) throw error;

    // CORREÇÃO: Retry mais inteligente
    if (retries > 0 && !navigator.onLine) {
      // Se offline, aguardar mais tempo
      await new Promise((resolve) => setTimeout(resolve, 5000));
      return apiFetch(endpoint, options, token, retries - 1);
    }

    throw new ApiError(
      error.message.includes("Failed to fetch") || error.message.includes("NetworkError")
        ? "Erro de conectividade. Verifique sua ligação à internet."
        : error.message || "Erro interno do servidor",
      500
    );
  }
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
const getToken = () => JSON.parse(localStorage.getItem("userSession"))?.token;

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

  return apiFetch("/auth/login", {
    method: "POST",
    body: JSON.stringify({ email, password })
  });
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

  return apiFetch("/auth/register", {
    method: "POST",
    body: JSON.stringify({ email, password })
  });
};

export const validateSession = async () => {
  const token = getToken();
  if (!token) throw new ApiError("Autenticação necessária.");
  // FIXED: Add /api prefix
  return apiFetch("/api/auth/validate", { method: "POST" }, token);
};

// === TAXAS ===
export const fetchRates = async () => apiFetch("/rates", {}, getToken());

export const fetchRatesStats = async () => {
  const token = getToken();
  if (!token) throw new ApiError("Autenticação necessária.");
  return apiFetch("/rates/stats", {}, token);
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

  return apiFetch("/alerts", {
    method: "POST",
    body: JSON.stringify(sanitizedData)
  }, token);
};

export const fetchUserAlerts = async () => {
  const token = getToken();
  if (!token) throw new ApiError("Autenticação necessária.");
  return apiFetch("/alerts", {}, token);
};

export const deleteAlert = async (alertId) => {
  const token = getToken();
  if (!token) throw new ApiError("Autenticação necessária.");
  if (!alertId || typeof alertId !== "string")
    throw new ApiError("ID do alerta inválido.");
  return apiFetch(`/alerts/${alertId}`, { method: "DELETE" }, token);
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

  return apiFetch("/simulate", {
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

  return apiFetch("/user/phone", {
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

  return apiFetch("/admin/rates", {
    method: "POST",
    body: JSON.stringify(sanitized)
  }, token);
};

export const fetchUsers = async () => {
  const token = getToken();
  if (!token) throw new ApiError("Autenticação necessária.");
  return apiFetch("/admin/users", {}, token);
};

export const updateUserPremium = async (userId, isPremium) => {
  const token = getToken();
  if (!token) throw new ApiError("Autenticação de administrador necessária.");

  // Validate userId format (should be MongoDB ObjectId)
  if (!userId || typeof userId !== 'string' || userId.length !== 24) {
    throw new ApiError("ID de usuário inválido. Use o ID do MongoDB.");
  }

  return apiFetch(`/admin/users/${userId}/premium`, {
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

  return apiFetch(`/admin/users/email/${encodeURIComponent(email)}/premium`, {
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
  return apiFetch("/admin/alerts", {}, token);
};

export const googleAuth = async (googleCredential) => {
  const validation = validateInput(
    { credential: googleCredential.credential },
    { credential: { required: true } }
  );
  if (!validation.isValid) throw new ApiError(Object.values(validation.errors)[0]);

  return apiFetch("/auth/google", {
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