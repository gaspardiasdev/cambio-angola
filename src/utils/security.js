// utils/security.js
import DOMPurify from 'dompurify';

export const sanitizeInput = (input) => {
  if (typeof input !== 'string') return input;
  return DOMPurify.sanitize(input);
};

export const validateCSRF = (token) => {
  // Implementar validação CSRF se necessário
  return token && token.length > 10;
};