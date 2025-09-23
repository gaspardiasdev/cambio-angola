// hooks/useAdminApi.js
import { useState, useCallback } from 'react';

export const useAdminApi = () => {
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState('');
  const [type, setType] = useState('info'); // 'success', 'error', 'info'

  // Função para limpar mensagens automaticamente
  const clearMessage = useCallback(() => {
    setTimeout(() => {
      setMessage('');
      setType('info');
    }, 5000);
  }, []);

  // Função principal para executar ações da API
  const handleAction = useCallback(async (apiFunction, ...args) => {
    setLoading(true);
    setMessage('');
    
    try {
      // Executar a função da API com os argumentos fornecidos
      const result = await apiFunction(...args);
      
      // Determinar mensagem de sucesso baseada no tipo de ação
      let successMessage = 'Operação realizada com sucesso!';
      
      if (apiFunction.name.includes('upgrade') || apiFunction.name.includes('Premium')) {
        successMessage = 'Utilizador promovido a Premium com sucesso!';
      } else if (apiFunction.name.includes('remove') || apiFunction.name.includes('downgrade')) {
        successMessage = 'Premium removido com sucesso!';
      } else if (apiFunction.name.includes('updateRates')) {
        successMessage = 'Taxas de câmbio atualizadas com sucesso!';
      } else if (apiFunction.name.includes('delete')) {
        successMessage = 'Item eliminado com sucesso!';
      }

      // Se a resposta contém uma mensagem customizada, usá-la
      if (result && result.message) {
        successMessage = result.message;
      }

      setMessage(successMessage);
      setType('success');
      clearMessage();
      
      return result;
      
    } catch (error) {
      console.error('Erro na ação administrativa:', error);
      
      // Determinar mensagem de erro apropriada
      let errorMessage = 'Ocorreu um erro inesperado. Tente novamente.';
      
      if (error.message) {
        errorMessage = error.message;
      } else if (error.status === 401) {
        errorMessage = 'Não tem autorização para esta ação.';
      } else if (error.status === 403) {
        errorMessage = 'Acesso negado. Verifique as suas permissões.';
      } else if (error.status === 404) {
        errorMessage = 'Recurso não encontrado.';
      } else if (error.status === 429) {
        errorMessage = 'Muitas tentativas. Aguarde um momento.';
      } else if (error.status >= 500) {
        errorMessage = 'Erro do servidor. Tente novamente mais tarde.';
      }

      setMessage(errorMessage);
      setType('error');
      clearMessage();
      
      return null;
      
    } finally {
      setLoading(false);
    }
  }, [clearMessage]);

  // Função para definir mensagem manual
  const showMessage = useCallback((msg, msgType = 'info') => {
    setMessage(msg);
    setType(msgType);
    clearMessage();
  }, [clearMessage]);

  // Função para limpar mensagem imediatamente
  const dismissMessage = useCallback(() => {
    setMessage('');
    setType('info');
  }, []);

  return {
    loading,
    message,
    type,
    handleAction,
    showMessage,
    setMessage: showMessage, // Alias para compatibilidade
    dismissMessage
  };
};