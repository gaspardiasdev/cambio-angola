/* eslint-disable no-unused-vars */
import { useState, useEffect, useMemo } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { 
  Users, Crown, Shield, TrendingUp, Activity, BarChart3, 
  Calendar, Search, Filter, Download, Plus, Settings,
  AlertTriangle, CheckCircle, Clock, Mail, Phone,
  DollarSign, Euro, Database, RefreshCw, X, Check,
  AlertCircle
} from "lucide-react";

// Componente de Modal de Confirmação
const ConfirmationModal = ({ 
  isOpen, 
  onClose, 
  onConfirm, 
  title, 
  message, 
  confirmText = "Confirmar",
  cancelText = "Cancelar",
  type = "warning", // warning, danger, info
  loading = false 
}) => {
  if (!isOpen) return null;

  const typeStyles = {
    warning: {
      icon: AlertTriangle,
      bgColor: "bg-amber-50",
      borderColor: "border-amber-200",
      iconColor: "text-amber-600",
      confirmButton: "bg-amber-600 hover:bg-amber-700"
    },
    danger: {
      icon: X,
      bgColor: "bg-red-50",
      borderColor: "border-red-200", 
      iconColor: "text-red-600",
      confirmButton: "bg-red-600 hover:bg-red-700"
    },
    info: {
      icon: AlertCircle,
      bgColor: "bg-blue-50",
      borderColor: "border-blue-200",
      iconColor: "text-blue-600", 
      confirmButton: "bg-blue-600 hover:bg-blue-700"
    }
  };

  const style = typeStyles[type];
  const IconComponent = style.icon;

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4"
      onClick={onClose}
    >
      <motion.div
        initial={{ scale: 0.9, y: 20 }}
        animate={{ scale: 1, y: 0 }}
        exit={{ scale: 0.9, y: 20 }}
        className="bg-white rounded-2xl p-6 max-w-md w-full"
        onClick={(e) => e.stopPropagation()}
      >
        <div className={`flex items-center justify-center w-16 h-16 mx-auto mb-4 rounded-full ${style.bgColor} ${style.borderColor} border-2`}>
          <IconComponent className={`w-8 h-8 ${style.iconColor}`} />
        </div>

        <h3 className="text-xl font-bold text-gray-900 text-center mb-2">
          {title}
        </h3>
        
        <p className="text-gray-600 text-center mb-6">
          {message}
        </p>

        <div className="flex gap-3">
          <button
            onClick={onClose}
            disabled={loading}
            className="flex-1 px-4 py-3 border border-gray-300 text-gray-700 rounded-xl hover:bg-gray-50 font-medium transition-colors disabled:opacity-50"
          >
            {cancelText}
          </button>
          <button
            onClick={onConfirm}
            disabled={loading}
            className={`flex-1 px-4 py-3 text-white rounded-xl font-medium transition-colors disabled:opacity-50 ${style.confirmButton}`}
          >
            {loading ? (
              <div className="flex items-center justify-center gap-2">
                <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                Processando...
              </div>
            ) : (
              confirmText
            )}
          </button>
        </div>
      </motion.div>
    </motion.div>
  );
};

// Componente de Input com Confirmação
const SecureInput = ({ 
  value, 
  onChange, 
  label, 
  name, 
  type = "number", 
  confirmationRequired = false,
  onSecureSubmit,
  loading = false 
}) => {
  const [tempValue, setTempValue] = useState(value);
  const [showConfirmation, setShowConfirmation] = useState(false);
  const [hasChanges, setHasChanges] = useState(false);

  useEffect(() => {
    setTempValue(value);
  }, [value]);

  useEffect(() => {
    setHasChanges(tempValue !== value);
  }, [tempValue, value]);

  const handleChange = (e) => {
    setTempValue(e.target.value);
  };

  const handleSubmit = () => {
    if (confirmationRequired && hasChanges) {
      setShowConfirmation(true);
    } else {
      onChange({ target: { name, value: tempValue } });
    }
  };

  const handleConfirmedSubmit = () => {
    onChange({ target: { name, value: tempValue } });
    setShowConfirmation(false);
    if (onSecureSubmit) {
      onSecureSubmit(name, tempValue);
    }
  };

  return (
    <div className="relative">
      <label className="block text-sm font-medium text-gray-700 mb-2">
        {label}
      </label>
      <div className="flex gap-2">
        <input
          type={type}
          value={tempValue}
          onChange={handleChange}
          disabled={loading}
          className="flex-1 px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent disabled:bg-gray-100"
        />
        {hasChanges && (
          <button
            onClick={handleSubmit}
            disabled={loading}
            className="px-3 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 disabled:opacity-50 transition-colors"
            title="Aplicar alteração"
          >
            <Check className="w-4 h-4" />
          </button>
        )}
      </div>

      <ConfirmationModal
        isOpen={showConfirmation}
        onClose={() => setShowConfirmation(false)}
        onConfirm={handleConfirmedSubmit}
        title="Confirmar Alteração"
        message={`Tem certeza que deseja alterar ${label} de ${value} para ${tempValue}?`}
        type="warning"
        confirmText="Alterar"
        loading={loading}
      />
    </div>
  );
};

// Componente de Card de Utilizador com Confirmações
export const SecureUserCard = ({ 
  user, 
  onUpgrade, 
  onDowngrade, 
  onViewDetails, 
  loading 
}) => {
  const [confirmAction, setConfirmAction] = useState(null);
  const [actionLoading, setActionLoading] = useState(false);

  const handleUpgradeClick = () => {
    setConfirmAction({
      type: 'upgrade',
      title: 'Promover a Premium',
      message: `Tem certeza que deseja promover ${user.email} para utilizador Premium? Esta ação concederá acesso a todas as funcionalidades premium.`,
      confirmText: 'Promover',
      action: () => onUpgrade(user.email)
    });
  };

  const handleDowngradeClick = () => {
    setConfirmAction({
      type: 'downgrade',
      title: 'Remover Premium',
      message: `Tem certeza que deseja remover o status Premium de ${user.email}? O utilizador perderá acesso às funcionalidades premium imediatamente.`,
      confirmText: 'Remover Premium',
      action: () => onDowngrade(user.email)
    });
  };

  const executeAction = async () => {
    if (!confirmAction) return;
    
    try {
      setActionLoading(true);
      await confirmAction.action();
      setConfirmAction(null);
    } catch (error) {
      console.error('Erro ao executar ação:', error);
    } finally {
      setActionLoading(false);
    }
  };

  return (
    <>
      <motion.div
        layout
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="flex items-center justify-between p-4 border border-gray-200 rounded-xl hover:bg-gray-50 transition-colors"
      >
        <div className="flex items-center gap-4">
          <div className="w-12 h-12 rounded-full bg-gradient-to-r from-blue-500 to-purple-600 flex items-center justify-center text-white font-bold">
            {user.email[0].toUpperCase()}
          </div>
          <div>
            <div className="flex items-center gap-2 mb-1">
              <p className="font-semibold text-gray-900">{user.email}</p>
              {user.isPremium && <Crown className="w-4 h-4 text-yellow-500" />}
              {user.isAdmin && <Shield className="w-4 h-4 text-red-500" />}
            </div>
            <div className="flex items-center gap-4 text-sm text-gray-500">
              <span>Registado: {new Date(user.dateCreated || user.createdAt).toLocaleDateString('pt-PT')}</span>
              {user.phoneNumber && <span>Tel: ***{user.phoneNumber.slice(-4)}</span>}
              <span>Alertas: {user.alertsCount || 0}</span>
            </div>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={() => onViewDetails(user)}
            className="p-2 text-gray-600 hover:text-blue-600 hover:bg-blue-50 rounded-lg transition-colors"
            title="Ver detalhes"
          >
            <Settings className="w-4 h-4" />
          </button>
          
          {!user.isPremium ? (
            <button
              onClick={handleUpgradeClick}
              disabled={loading || actionLoading}
              className="flex items-center gap-2 px-3 py-2 text-green-700 bg-green-50 hover:bg-green-100 rounded-lg transition-colors disabled:opacity-50"
              title="Promover a Premium"
            >
              <Crown className="w-4 h-4" />
              <span className="hidden sm:inline">Premium</span>
            </button>
          ) : (
            <button
              onClick={handleDowngradeClick}
              disabled={loading || actionLoading}
              className="flex items-center gap-2 px-3 py-2 text-red-700 bg-red-50 hover:bg-red-100 rounded-lg transition-colors disabled:opacity-50"
              title="Remover Premium"
            >
              <Users className="w-4 h-4" />
              <span className="hidden sm:inline">Básico</span>
            </button>
          )}
        </div>
      </motion.div>

      <ConfirmationModal
        isOpen={!!confirmAction}
        onClose={() => setConfirmAction(null)}
        onConfirm={executeAction}
        title={confirmAction?.title}
        message={confirmAction?.message}
        confirmText={confirmAction?.confirmText}
        type={confirmAction?.type === 'downgrade' ? 'danger' : 'warning'}
        loading={actionLoading}
      />
    </>
  );
};

// Componente de Gestão de Taxas com Confirmações
export const SecureRatesManagement = ({ 
  currentRates, 
  onUpdate, 
  loading 
}) => {
  const [rates, setRates] = useState({});
  const [isEditing, setIsEditing] = useState(false);
  const [showSaveConfirmation, setShowSaveConfirmation] = useState(false);
  const [hasChanges, setHasChanges] = useState(false);
  const [saveLoading, setSaveLoading] = useState(false);

  useEffect(() => {
    if (currentRates) {
      const rateFields = ['usdBuy', 'usdSell', 'eurBuy', 'eurSell', 'zarBuy', 'zarSell', 'cadBuy', 'cadSell'];
      const filteredRates = {};
      rateFields.forEach(field => {
        if (currentRates[field] !== undefined) {
          filteredRates[field] = currentRates[field];
        }
      });
      setRates(filteredRates);
    }
  }, [currentRates]);

  const currencies = [
    { code: 'usd', name: 'Dólar Americano', flag: '🇺🇸', color: 'blue' },
    { code: 'eur', name: 'Euro', flag: '🇪🇺', color: 'purple' },
    { code: 'zar', name: 'Rand Sul-Africano', flag: '🇿🇦', color: 'green' },
    { code: 'cad', name: 'Dólar Canadense', flag: '🇨🇦', color: 'red' }
  ];

  const handleRateChange = (field, value) => {
    setRates(prev => {
      const newRates = { ...prev, [field]: parseFloat(value) || 0 };
      setHasChanges(JSON.stringify(newRates) !== JSON.stringify(currentRates));
      return newRates;
    });
  };

  const handleSaveClick = () => {
    if (!hasChanges) return;
    setShowSaveConfirmation(true);
  };

  const handleConfirmedSave = async () => {
    try {
      setSaveLoading(true);
      await onUpdate(rates);
      setIsEditing(false);
      setHasChanges(false);
      setShowSaveConfirmation(false);
    } catch (error) {
      console.error('Erro ao atualizar taxas:', error);
    } finally {
      setSaveLoading(false);
    }
  };

  // Calcular diferenças para mostrar na confirmação
  const getDifferences = () => {
    const diffs = [];
    currencies.forEach(currency => {
      ['Buy', 'Sell'].forEach(type => {
        const field = `${currency.code}${type}`;
        const oldValue = currentRates[field];
        const newValue = rates[field];
        if (oldValue !== newValue) {
          diffs.push(`${currency.name} ${type === 'Buy' ? 'Compra' : 'Venda'}: ${oldValue} → ${newValue}`);
        }
      });
    });
    return diffs;
  };

  return (
    <div className="bg-white rounded-xl p-6 shadow-sm border border-gray-200">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h3 className="text-lg font-semibold text-gray-900">Gestão de Taxas de Câmbio</h3>
          <p className="text-sm text-gray-500 mt-1">
            Última actualização: {new Date().toLocaleString('pt-PT')}
          </p>
        </div>
        <div className="flex gap-2">
          <button
            onClick={() => window.location.reload()}
            className="p-2 text-gray-600 hover:text-gray-900 hover:bg-gray-100 rounded-lg transition-colors"
            title="Actualizar dados"
          >
            <RefreshCw className="w-4 h-4" />
          </button>
          {!isEditing ? (
            <button
              onClick={() => setIsEditing(true)}
              className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
            >
              <Settings className="w-4 h-4" />
              Editar Taxas
            </button>
          ) : (
            <div className="flex gap-2">
              <button
                onClick={() => {
                  setIsEditing(false);
                  setHasChanges(false);
                }}
                className="px-4 py-2 text-gray-600 border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors"
              >
                Cancelar
              </button>
              <button
                onClick={handleSaveClick}
                disabled={!hasChanges || loading}
                className="flex items-center gap-2 px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 disabled:opacity-50 transition-colors"
              >
                <CheckCircle className="w-4 h-4" />
                Guardar Alterações
              </button>
            </div>
          )}
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {currencies.map(currency => (
          <div key={currency.code} className={`p-4 border-2 border-${currency.color}-200 bg-${currency.color}-50 rounded-xl`}>
            <div className="flex items-center gap-2 mb-4">
              <span className="text-2xl">{currency.flag}</span>
              <div>
                <h4 className="font-semibold text-gray-900">{currency.name}</h4>
                <p className="text-sm text-gray-600">{currency.code.toUpperCase()}/AOA</p>
              </div>
            </div>
            
            <div className="space-y-3">
              <SecureInput
                label="Taxa de Compra"
                name={`${currency.code}Buy`}
                value={rates[`${currency.code}Buy`] || ''}
                onChange={(e) => handleRateChange(e.target.name, e.target.value)}
                confirmationRequired={isEditing}
                loading={loading}
              />
              
              <SecureInput
                label="Taxa de Venda"  
                name={`${currency.code}Sell`}
                value={rates[`${currency.code}Sell`] || ''}
                onChange={(e) => handleRateChange(e.target.name, e.target.value)}
                confirmationRequired={isEditing}
                loading={loading}
              />
            </div>
          </div>
        ))}
      </div>

      <ConfirmationModal
        isOpen={showSaveConfirmation}
        onClose={() => setShowSaveConfirmation(false)}
        onConfirm={handleConfirmedSave}
        title="Confirmar Actualização de Taxas"
        message={
          <div>
            <p className="mb-3">Está prestes a actualizar as seguintes taxas:</p>
            <div className="bg-gray-50 rounded-lg p-3 text-sm">
              {getDifferences().map((diff, index) => (
                <div key={index} className="mb-1">{diff}</div>
              ))}
            </div>
            <p className="mt-3 text-amber-600 font-medium">
              ⚠️ Esta acção afetará todos os utilizadores da plataforma imediatamente.
            </p>
          </div>
        }
        type="warning"
        confirmText="Actualizar Taxas"
        loading={saveLoading}
      />
    </div>
  );
};

// Hook para ações administrativas com confirmação
export const useSecureAdminActions = () => {
  const [confirmAction, setConfirmAction] = useState(null);
  const [loading, setLoading] = useState(false);

  const executeWithConfirmation = (action, confirmationConfig) => {
    setConfirmAction({
      ...confirmationConfig,
      action: async () => {
        try {
          setLoading(true);
          await action();
          setConfirmAction(null);
        } catch (error) {
          console.error('Erro na ação:', error);
          throw error;
        } finally {
          setLoading(false);
        }
      }
    });
  };

  const ConfirmationDialog = () => (
    <ConfirmationModal
      isOpen={!!confirmAction}
      onClose={() => setConfirmAction(null)}
      onConfirm={confirmAction?.action}
      title={confirmAction?.title}
      message={confirmAction?.message}
      confirmText={confirmAction?.confirmText}
      type={confirmAction?.type}
      loading={loading}
    />
  );

  return {
    executeWithConfirmation,
    ConfirmationDialog,
    loading
  };
};

export default SecureRatesManagement;