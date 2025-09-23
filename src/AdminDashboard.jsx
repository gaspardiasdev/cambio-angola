/* eslint-disable no-dupe-keys */
/* eslint-disable no-unused-vars */
import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Users, Crown, Shield, TrendingUp, RefreshCw, AlertTriangle, CheckCircle } from "lucide-react";
import {
  fetchUsers,
  updateRates,
  upgradeToPremium,
  removePremium,
  fetchRates,
  getUserIdByEmail,
} from "./services/api";
import { useAdminApi } from "./hooks/useAdminApi";

// Componente de Modal de Confirmação
const ConfirmationModal = ({ 
  isOpen, 
  onClose, 
  onConfirm, 
  title, 
  message, 
  confirmText = "Confirmar",
  cancelText = "Cancelar",
  type = "warning",
  loading = false 
}) => {
  if (!isOpen) return null;

  const typeStyles = {
    warning: {
      bgColor: "bg-amber-50",
      borderColor: "border-amber-200",
      iconColor: "text-amber-600",
      confirmButton: "bg-amber-600 hover:bg-amber-700"
    },
    danger: {
      bgColor: "bg-red-50",
      borderColor: "border-red-200", 
      iconColor: "text-red-600",
      confirmButton: "bg-red-600 hover:bg-red-700"
    },
    info: {
      bgColor: "bg-blue-50",
      borderColor: "border-blue-200",
      iconColor: "text-blue-600", 
      confirmButton: "bg-blue-600 hover:bg-blue-700"
    }
  };

  const style = typeStyles[type];

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
          <AlertTriangle className={`w-8 h-8 ${style.iconColor}`} />
        </div>

        <h3 className="text-xl font-bold text-gray-900 text-center mb-2">
          {title}
        </h3>
        
        <div className="text-gray-600 text-center mb-6">
          {typeof message === 'string' ? <p>{message}</p> : message}
        </div>

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

// Componente de Estatística
const StatCard = ({ title, value, icon: Icon, color = "blue" }) => {
  const colors = {
    blue: "bg-blue-50 border-blue-200 text-blue-600",
    green: "bg-green-50 border-green-200 text-green-600",
    purple: "bg-purple-50 border-purple-200 text-purple-600",
    orange: "bg-orange-50 border-orange-200 text-orange-600"
  };

  return (
    <motion.div
      whileHover={{ scale: 1.02, y: -2 }}
      className={`${colors[color]} rounded-2xl p-6 shadow-sm border-2 transition-all duration-200`}
    >
      <div className="flex items-center gap-2 mb-2">
        <Icon className="w-5 h-5" />
        <p className="text-sm font-semibold uppercase tracking-wide">{title}</p>
      </div>
      <p className="text-3xl font-bold text-gray-900">{value.toLocaleString()}</p>
    </motion.div>
  );
};

// Componente de Card de Utilizador com Confirmações
const SecureUserCard = ({ user, onUpgrade, onDowngrade, onViewDetails, loading }) => {
  const [confirmAction, setConfirmAction] = useState(null);
  const [actionLoading, setActionLoading] = useState(false);

  const handleUpgradeClick = () => {
    setConfirmAction({
      type: 'upgrade',
      title: 'Promover a Premium',
      message: (
        <div>
          <p className="mb-3">Tem certeza que deseja promover <strong>{user.email}</strong> para utilizador Premium?</p>
          <div className="bg-blue-50 rounded-lg p-3 text-sm">
            <p><strong>Benefícios que serão concedidos:</strong></p>
            <ul className="list-disc list-inside mt-1 space-y-1">
              <li>Acesso a alertas de preço ilimitados</li>
              <li>Histórico completo de taxas</li>
              <li>Exportação de dados</li>
              <li>Suporte prioritário</li>
            </ul>
          </div>
        </div>
      ),
      confirmText: 'Promover',
      type: 'info',
      action: () => onUpgrade(user.email)
    });
  };

  const handleDowngradeClick = () => {
    setConfirmAction({
      type: 'downgrade',
      title: 'Remover Premium',
      message: (
        <div>
          <p className="mb-3">Tem certeza que deseja remover o status Premium de <strong>{user.email}</strong>?</p>
          <div className="bg-red-50 rounded-lg p-3 text-sm">
            <p className="text-red-700 font-medium">⚠️ O utilizador perderá imediatamente:</p>
            <ul className="list-disc list-inside mt-1 space-y-1 text-red-600">
              <li>Alertas de preço (limitados a 3)</li>
              <li>Histórico de taxas</li>
              <li>Funcionalidade de exportação</li>
              <li>Suporte prioritário</li>
            </ul>
          </div>
        </div>
      ),
      confirmText: 'Remover Premium',
      type: 'danger',
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
            <Shield className="w-4 h-4" />
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
        type={confirmAction?.type}
        loading={actionLoading}
      />
    </>
  );
};

// Componente de Gestão de Taxas com Confirmações
const SecureRatesForm = ({ todayRates, onUpdate, loading }) => {
  const [rates, setRates] = useState({});
  const [showSaveConfirmation, setShowSaveConfirmation] = useState(false);
  const [hasChanges, setHasChanges] = useState(false);
  const [saveLoading, setSaveLoading] = useState(false);

  const rateFields = ['usdBuy', 'usdSell', 'eurBuy', 'eurSell', 'zarBuy', 'zarSell', 'cadBuy', 'cadSell'];
  
  useEffect(() => {
    if (todayRates) {
      const initialData = Object.fromEntries(
        Object.entries(todayRates).filter(([key]) => rateFields.includes(key))
      );
      setRates(initialData);
    }
  }, [todayRates]);

  const handleChange = (e) => {
    const { name, value } = e.target;
    if (rateFields.includes(name)) {
      setRates(prev => {
        const newRates = { ...prev, [name]: parseFloat(value) || 0 };
        setHasChanges(JSON.stringify(newRates) !== JSON.stringify(todayRates));
        return newRates;
      });
    }
  };

  const handleSaveClick = () => {
    if (!hasChanges) return;
    setShowSaveConfirmation(true);
  };

  const handleConfirmedSave = async () => {
    try {
      setSaveLoading(true);
      await onUpdate(rates);
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
    const currencyNames = {
      usd: 'Dólar',
      eur: 'Euro', 
      zar: 'Rand',
      cad: 'Dólar Can.'
    };

    Object.keys(rates).forEach(field => {
      const currency = field.slice(0, 3);
      const type = field.slice(3);
      const oldValue = todayRates[field];
      const newValue = rates[field];
      if (oldValue !== newValue) {
        diffs.push(`${currencyNames[currency]} ${type === 'Buy' ? 'Compra' : 'Venda'}: ${oldValue} → ${newValue} KZ`);
      }
    });
    return diffs;
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0, transition: { delay: 0.1 } }}
      className="bg-white rounded-2xl shadow-lg p-6"
    >
      <div className="flex items-center justify-between mb-6">
        <div>
          <h2 className="text-xl font-bold text-gray-900">Atualizar Taxas</h2>
          <p className="text-sm text-gray-500 mt-1">
            Última atualização: {new Date().toLocaleString('pt-PT')}
          </p>
        </div>
        {hasChanges && (
          <div className="bg-amber-50 border border-amber-200 rounded-lg px-3 py-2">
            <p className="text-amber-700 text-sm font-medium">Alterações não guardadas</p>
          </div>
        )}
      </div>
      
      <div className="space-y-6">
        <div className="grid grid-cols-2 gap-4">
          {Object.keys(rates).map(key => (
            <div key={key}>
              <label htmlFor={key} className="block text-sm font-medium capitalize text-gray-700">
                {key.replace('Buy', ' Compra').replace('Sell', ' Venda').replace('usd', 'Dólar').replace('eur', 'Euro').replace('zar', 'Rand').replace('cad', 'Dólar Can.')}
              </label>
              <input
                id={key}
                name={key}
                type="number"
                step="0.01"
                value={rates[key] || ''}
                onChange={handleChange}
                disabled={loading || saveLoading}
                className="mt-1 block w-full rounded-xl border border-gray-300 p-3 focus:ring-2 focus:ring-blue-500 focus:border-transparent disabled:bg-gray-100"
              />
            </div>
          ))}
        </div>
        
        <button
          onClick={handleSaveClick}
          disabled={!hasChanges || loading || saveLoading}
          className={`w-full py-3 rounded-xl font-bold text-white transition-colors ${
            !hasChanges || loading || saveLoading
              ? "bg-gray-400 cursor-not-allowed" 
              : "bg-green-600 hover:bg-green-700"
          }`}
        >
          {saveLoading ? "Atualizando..." : hasChanges ? "Guardar Alterações" : "Sem Alterações"}
        </button>
      </div>

      <ConfirmationModal
        isOpen={showSaveConfirmation}
        onClose={() => setShowSaveConfirmation(false)}
        onConfirm={handleConfirmedSave}
        title="Confirmar Atualização de Taxas"
        message={
          <div>
            <p className="mb-3">Está prestes a atualizar as seguintes taxas:</p>
            <div className="bg-gray-50 rounded-lg p-3 text-sm max-h-32 overflow-y-auto">
              {getDifferences().map((diff, index) => (
                <div key={index} className="mb-1">{diff}</div>
              ))}
            </div>
            <div className="mt-3 p-3 bg-amber-50 rounded-lg">
              <p className="text-amber-700 font-medium text-sm">
                ⚠️ Esta ação afetará todos os utilizadores da plataforma imediatamente.
              </p>
            </div>
          </div>
        }
        type="warning"
        confirmText="Atualizar Taxas"
        loading={saveLoading}
      />
    </motion.div>
  );
};

// Componente de Lista de Utilizadores
const UserManagement = ({ users, onUpgrade, onDowngrade, onViewDetails, loading }) => {
  const [searchTerm, setSearchTerm] = useState("");
  const [filteredUsers, setFilteredUsers] = useState(users);

  useEffect(() => {
    let filtered = users;
    if (searchTerm) {
      filtered = users.filter(user => 
        user.email.toLowerCase().includes(searchTerm.toLowerCase())
      );
    }
    setFilteredUsers(filtered);
  }, [searchTerm, users]);

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className="bg-white rounded-2xl shadow-lg p-6"
    >
      <div className="flex items-center justify-between mb-6">
        <h2 className="text-xl font-bold text-gray-900">
          Utilizadores ({filteredUsers.length})
        </h2>
        <div className="relative">
          <input
            type="text"
            placeholder="Pesquisar por email..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="pl-4 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
          />
        </div>
      </div>

      <div className="space-y-3 max-h-96 overflow-y-auto">
        {filteredUsers.map(user => (
          <SecureUserCard
            key={user._id || user.email}
            user={user}
            onUpgrade={onUpgrade}
            onDowngrade={onDowngrade}
            onViewDetails={onViewDetails}
            loading={loading}
          />
        ))}
      </div>

      {filteredUsers.length === 0 && (
        <div className="text-center py-12">
          <Users className="w-12 h-12 text-gray-400 mx-auto mb-4" />
          <p className="text-gray-500">Nenhum utilizador encontrado</p>
        </div>
      )}
    </motion.div>
  );
};

// Modal de Detalhes do Utilizador
const UserDetailsModal = ({ user, onClose }) => {
  if (!user) return null;

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
        className="bg-white rounded-2xl p-6 max-w-lg w-full max-h-[90vh] overflow-y-auto"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-center justify-between mb-6">
          <h3 className="text-xl font-bold text-gray-900">Detalhes do Utilizador</h3>
          <button
            onClick={onClose}
            className="w-8 h-8 rounded-full hover:bg-gray-100 flex items-center justify-center text-xl text-gray-500 hover:text-gray-700"
          >
            ×
          </button>
        </div>

        <div className="flex items-center gap-4 mb-6 p-4 bg-gray-50 rounded-xl">
          <div className="w-16 h-16 rounded-full bg-gradient-to-r from-blue-500 to-purple-600 flex items-center justify-center text-white font-bold text-xl">
            {user.email[0].toUpperCase()}
          </div>
          <div className="flex-1">
            <p className="font-semibold text-lg text-gray-900">{user.email}</p>
            <div className="flex items-center gap-2 mt-1">
              <span className={`px-2 py-1 rounded-full text-xs font-medium ${
                user.isPremium 
                  ? 'bg-yellow-100 text-yellow-800' 
                  : 'bg-gray-100 text-gray-800'
              }`}>
                {user.isPremium ? 'Premium' : 'Básico'}
              </span>
              {user.isAdmin && (
                <span className="px-2 py-1 bg-red-100 text-red-800 rounded-full text-xs font-medium">
                  Admin
                </span>
              )}
            </div>
          </div>
        </div>

        <div className="space-y-4">
          <div className="p-3 bg-blue-50 rounded-lg">
            <p className="text-sm text-blue-600 font-medium">Data de Registo</p>
            <p className="text-blue-800 font-semibold">
              {new Date(user.dateCreated || user.createdAt).toLocaleString('pt-PT')}
            </p>
          </div>

          <div className="p-3 bg-green-50 rounded-lg">
            <p className="text-sm text-green-600 font-medium">Último Login</p>
            <p className="text-green-800 font-semibold">
              {user.lastLogin ? new Date(user.lastLogin).toLocaleString('pt-PT') : 'Nunca'}
            </p>
          </div>

          <div className="p-3 bg-orange-50 rounded-lg">
            <p className="text-sm text-orange-600 font-medium">Alertas Ativos</p>
            <p className="text-orange-800 font-semibold">{user.alertsCount || 0} alertas</p>
          </div>
        </div>
      </motion.div>
    </motion.div>
  );
};

// Componente Principal do Dashboard
export default function EnhancedAdminDashboard({ todayRates }) {
  const [users, setUsers] = useState([]);
  const [selectedUser, setSelectedUser] = useState(null);

  const { loading, message, type, handleAction, setMessage } = useAdminApi();

  // Buscar utilizadores ao carregar
  useEffect(() => {
    const loadUsers = async () => {
      try {
        const data = await fetchUsers();
        setUsers(Array.isArray(data.users) ? data.users : []);
      } catch (error) {
        console.error("Erro ao carregar usuários:", error);
        setUsers([]);
      }
    };
    loadUsers();
  }, []);

  const handleUpgrade = async (userEmail) => {
    try {
      let userId = userEmail;
      if (userEmail.includes('@')) {
        userId = await getUserIdByEmail(userEmail);
      }
      
      const res = await handleAction(upgradeToPremium, userId);
      if (res) {
        setUsers(prevUsers =>
          prevUsers.map((u) => 
            u._id === userId ? { ...u, isPremium: true } : u
          )
        );
      }
    } catch (error) {
      console.error("Erro no upgrade:", error);
      setMessage(`Erro no upgrade: ${error.message}`);
    }
  };

  const handleDowngrade = async (userEmail) => {
    try {
      let userId = userEmail;
      if (userEmail.includes('@')) {
        userId = await getUserIdByEmail(userEmail);
      }
      
      const res = await handleAction(removePremium, userId);
      if (res) {
        setUsers(prevUsers =>
          prevUsers.map((u) => 
            u._id === userId ? { ...u, isPremium: false } : u
          )
        );
      }
    } catch (error) {
      console.error("Erro no downgrade:", error);
      setMessage(`Erro no downgrade: ${error.message}`);
    }
  };

  const handleUpdateRates = async (ratesData) => {
    const res = await handleAction(updateRates, ratesData);
    if (res?.success) {
      console.log("Taxas atualizadas:", ratesData);
    }
  };

  const stats = {
    totalUsers: users.length,
    premiumUsers: users.filter((u) => u.isPremium).length,
    adminUsers: users.filter((u) => u.isAdmin).length,
    recentUsers: users.filter(
      (u) =>
        new Date(u.createdAt || u.dateCreated) >
        new Date(Date.now() - 30 * 24 * 60 * 60 * 1000)
    ).length,
  };

  return (
    <div className="min-h-screen bg-gray-50 p-6">
      <div className="max-w-7xl mx-auto">
        <motion.div
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          className="mb-8"
        >
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-3xl font-bold text-gray-900 mb-2">
                Painel de Administração
              </h1>
              <p className="text-gray-600">
                Gerencie utilizadores e taxas de câmbio com confirmações de segurança
              </p>
            </div>
            <button
              onClick={() => window.location.reload()}
              className="p-3 bg-blue-600 text-white rounded-xl hover:bg-blue-700 transition-colors"
              title="Atualizar dados"
            >
              <RefreshCw className="w-5 h-5" />
            </button>
          </div>
        </motion.div>

        {/* Estatísticas */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
          <StatCard
            title="Total de Utilizadores"
            value={stats.totalUsers}
            icon={Users}
            color="blue"
          />
          <StatCard
            title="Utilizadores Premium"
            value={stats.premiumUsers}
            icon={Crown}
            color="purple"
          />
          <StatCard
            title="Administradores"
            value={stats.adminUsers}
            icon={Shield}
            color="orange"
          />
          <StatCard
            title="Novos este Mês"
            value={stats.recentUsers}
            icon={TrendingUp}
            color="green"
          />
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          <div className="lg:col-span-2">
            <UserManagement
              users={users}
              onUpgrade={handleUpgrade}
              onDowngrade={handleDowngrade}
              onViewDetails={setSelectedUser}
              loading={loading}
            />
          </div>
          <div className="lg:col-span-1">
            <SecureRatesForm 
              todayRates={todayRates} 
              onUpdate={handleUpdateRates}
              loading={loading}
            />
          </div>
        </div>

        {/* Mensagens de feedback */}
        <AnimatePresence>
          {message && (
            <motion.div
              className="fixed bottom-6 right-6 z-40"
              initial={{ opacity: 0, x: 100 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: 100 }}
            >
              <div className={`p-4 rounded-xl shadow-lg border-2 max-w-md ${
                type === 'success' 
                  ? 'bg-green-50 text-green-700 border-green-200'
                  : type === 'error'
                  ? 'bg-red-50 text-red-700 border-red-200'
                  : 'bg-blue-50 text-blue-700 border-blue-200'
              }`}>
                <div className="flex items-center gap-2">
                  {type === 'success' && <CheckCircle className="w-5 h-5" />}
                  {type === 'error' && <AlertTriangle className="w-5 h-5" />}
                  <span className="font-medium">{message}</span>
                </div>
              </div>
            </motion.div>
          )}
        </AnimatePresence>

        <AnimatePresence>
          {selectedUser && (
            <UserDetailsModal
              user={selectedUser}
              onClose={() => setSelectedUser(null)}
            />
          )}
        </AnimatePresence>
      </div>
    </div>
  );
}