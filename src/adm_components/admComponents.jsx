/* eslint-disable no-unused-vars */
import { useState, useEffect, useMemo } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { 
  Users, Crown, Shield, TrendingUp, Activity, BarChart3, 
  Calendar, Search, Filter, Download, Plus, Settings,
  AlertTriangle, CheckCircle, Clock, Mail, Phone,
  DollarSign, Euro, Database, RefreshCw
} from "lucide-react";
import {
  fetchUsers,
  updateRates,
  upgradeToPremium,
  removePremium,
  fetchRates,
  fetchAllAlerts,
  getUserIdByEmail,
} from "./../services/api";
import { useAdminApi } from "./../hooks/useAdminApi";

// Componente de mensagem
export const MessageBox = ({ message, type }) => {
  if (!message) return null;
  const colors = {
    success: "bg-green-50 text-green-700 border-green-200",
    info: "bg-blue-50 text-blue-700 border-blue-200",
    error: "bg-red-50 text-red-700 border-red-200"
  };
  return (
    <motion.div
      initial={{ opacity: 0, y: -20 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -20 }}
      className={`p-4 rounded-xl border-2 ${colors[type]} flex items-center gap-2`}
    >
      {type === 'success' && <CheckCircle className="w-5 h-5" />}
      {type === 'error' && <AlertCircle className="w-5 h-5" />}
      {message}
    </motion.div>
  );
};

// Componente de estatística aprimorado
export const StatCard = ({ title, value, icon: Icon, trend, color = "blue", subtitle, loading }) => {
  const colors = {
    blue: "from-blue-500 to-blue-600",
    green: "from-green-500 to-green-600",
    purple: "from-purple-500 to-purple-600",
    orange: "from-orange-500 to-orange-600",
    red: "from-red-500 to-red-500",
    yellow: "from-yellow-500 to-yellow-600"
  };

  const bgColors = {
    blue: "bg-blue-50 border-blue-200",
    green: "bg-green-50 border-green-200",
    purple: "bg-purple-50 border-purple-200",
    orange: "bg-orange-50 border-orange-200",
    red: "bg-red-50 border-red-200",
    yellow: "bg-yellow-50 border-yellow-200"
  };

  return (
    <motion.div
      whileHover={{ scale: 1.02, y: -2 }}
      className={`${bgColors[color]} rounded-2xl p-6 shadow-sm border-2 transition-all duration-200`}
    >
      <div className="flex items-start justify-between">
        <div className="flex-1">
          <div className="flex items-center gap-2 mb-1">
            <Icon className={`w-5 h-5 text-${color}-600`} />
            <p className="text-sm font-semibold text-gray-600 uppercase tracking-wide">{title}</p>
          </div>
          
          {loading ? (
            <div className="animate-pulse">
              <div className="h-8 bg-gray-200 rounded w-16 mb-2"></div>
              <div className="h-4 bg-gray-200 rounded w-24"></div>
            </div>
          ) : (
            <>
              <p className="text-3xl font-bold text-gray-900 mb-1">{value.toLocaleString()}</p>
              {subtitle && <p className="text-sm text-gray-500">{subtitle}</p>}
              {trend && (
                <div className={`flex items-center gap-1 text-sm mt-2 ${
                  trend.positive ? 'text-green-600' : 'text-red-600'
                }`}>
                  {trend.positive ? '↗' : '↘'}
                  <span className="font-medium">{trend.value}</span>
                  <span className="text-gray-500">vs mês anterior</span>
                </div>
              )}
            </>
          )}
        </div>
      </div>
    </motion.div>
  );
};

// Componente de filtro avançado
export const AdvancedFilters = ({ onFiltersChange, totalUsers }) => {
  const [filters, setFilters] = useState({
    search: "",
    type: "all",
    dateRange: "all",
    status: "all"
  });

  const handleFilterChange = (key, value) => {
    const newFilters = { ...filters, [key]: value };
    setFilters(newFilters);
    onFiltersChange(newFilters);
  };

  return (
    <div className="bg-white rounded-xl p-6 shadow-sm border border-gray-200 mb-6">
      <div className="flex items-center justify-between mb-4">
        <h3 className="text-lg font-semibold text-gray-900">Filtros de Pesquisa</h3>
        <span className="text-sm text-gray-500">{totalUsers} utilizadores encontrados</span>
      </div>
      
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Pesquisa por email */}
        <div className="relative">
          <Search className="w-4 h-4 absolute left-3 top-3.5 text-gray-400" />
          <input
            type="text"
            placeholder="Pesquisar por email..."
            value={filters.search}
            onChange={(e) => handleFilterChange('search', e.target.value)}
            className="w-full pl-10 pr-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent text-sm"
          />
        </div>

        {/* Tipo de utilizador */}
        <div className="relative">
          <Users className="w-4 h-4 absolute left-3 top-3.5 text-gray-400" />
          <select
            value={filters.type}
            onChange={(e) => handleFilterChange('type', e.target.value)}
            className="w-full pl-10 pr-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent text-sm appearance-none"
          >
            <option value="all">Todos os tipos</option>
            <option value="premium">Premium</option>
            <option value="basic">Básico</option>
            <option value="admin">Administradores</option>
          </select>
        </div>

        {/* Período de registo */}
        <div className="relative">
          <Calendar className="w-4 h-4 absolute left-3 top-3.5 text-gray-400" />
          <select
            value={filters.dateRange}
            onChange={(e) => handleFilterChange('dateRange', e.target.value)}
            className="w-full pl-10 pr-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent text-sm appearance-none"
          >
            <option value="all">Todos os períodos</option>
            <option value="today">Hoje</option>
            <option value="week">Esta semana</option>
            <option value="month">Este mês</option>
            <option value="quarter">Últimos 3 meses</option>
          </select>
        </div>

        {/* Status de actividade */}
        <div className="relative">
          <Activity className="w-4 h-4 absolute left-3 top-3.5 text-gray-400" />
          <select
            value={filters.status}
            onChange={(e) => handleFilterChange('status', e.target.value)}
            className="w-full pl-10 pr-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent text-sm appearance-none"
          >
            <option value="all">Todos os status</option>
            <option value="active">Activos (últimos 7 dias)</option>
            <option value="inactive">Inativos</option>
            <option value="new">Novos (últimos 30 dias)</option>
          </select>
        </div>
      </div>
    </div>
  );
};

// Componente de gestão de taxas aprimorado
export const RatesManagement = ({ currentRates, onUpdate, loading }) => {
  const [rates, setRates] = useState({});
  const [isEditing, setIsEditing] = useState(false);
  const [lastUpdate, setLastUpdate] = useState(null);

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
      setLastUpdate(currentRates.date);
    }
  }, [currentRates]);

  const currencies = [
    { code: 'usd', name: 'Dólar Americano', flag: '🇺🇸', color: 'blue' },
    { code: 'eur', name: 'Euro', flag: '🇪🇺', color: 'purple' },
    { code: 'zar', name: 'Rand Sul-Africano', flag: '🇿🇦', color: 'green' },
    { code: 'cad', name: 'Dólar Canadense', flag: '🇨🇦', color: 'red' }
  ];

  const handleRateChange = (field, value) => {
    setRates(prev => ({ ...prev, [field]: parseFloat(value) || 0 }));
  };

  const handleSave = async () => {
    try {
      await onUpdate(rates);
      setIsEditing(false);
      setLastUpdate(new Date());
    } catch (error) {
      console.error('Erro ao atualizar taxas:', error);
    }
  };

  return (
    <div className="bg-white rounded-xl p-6 shadow-sm border border-gray-200">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h3 className="text-lg font-semibold text-gray-900">Gestão de Taxas de Câmbio</h3>
          {lastUpdate && (
            <p className="text-sm text-gray-500 mt-1">
              Última actualização: {new Date(lastUpdate).toLocaleString('pt-PT')}
            </p>
          )}
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
                onClick={() => setIsEditing(false)}
                className="px-4 py-2 text-gray-600 border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors"
              >
                Cancelar
              </button>
              <button
                onClick={handleSave}
                disabled={loading}
                className="flex items-center gap-2 px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 disabled:opacity-50 transition-colors"
              >
                <CheckCircle className="w-4 h-4" />
                {loading ? 'A guardar...' : 'Guardar'}
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
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Taxa de Compra</label>
                {isEditing ? (
                  <input
                    type="number"
                    step="0.01"
                    value={rates[`${currency.code}Buy`] || ''}
                    onChange={(e) => handleRateChange(`${currency.code}Buy`, e.target.value)}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  />
                ) : (
                  <div className="text-lg font-bold text-gray-900">
                    {rates[`${currency.code}Buy`]?.toLocaleString() || 'N/A'} KZ
                  </div>
                )}
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Taxa de Venda</label>
                {isEditing ? (
                  <input
                    type="number"
                    step="0.01"
                    value={rates[`${currency.code}Sell`] || ''}
                    onChange={(e) => handleRateChange(`${currency.code}Sell`, e.target.value)}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  />
                ) : (
                  <div className="text-lg font-bold text-gray-900">
                    {rates[`${currency.code}Sell`]?.toLocaleString() || 'N/A'} KZ
                  </div>
                )}
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};

// Componente principal do dashboard
export default function EnhancedAdminDashboard({ todayRates }) {
  const [users, setUsers] = useState([]);
  const [filteredUsers, setFilteredUsers] = useState([]);
  const [selectedUser, setSelectedUser] = useState(null);
  const [alerts, setAlerts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [statsLoading, setStatsLoading] = useState(true);

  const { loading: apiLoading, message, type, handleAction, setMessage } = useAdminApi();

  // Carregar dados iniciais
  useEffect(() => {
    const loadInitialData = async () => {
      try {
        setLoading(true);
        
        const [usersData, alertsData] = await Promise.all([
          fetchUsers().catch(() => ({ users: [] })),
          fetchAllAlerts().catch(() => [])
        ]);
        
        setUsers(Array.isArray(usersData.users) ? usersData.users : []);
        setFilteredUsers(Array.isArray(usersData.users) ? usersData.users : []);
        setAlerts(Array.isArray(alertsData) ? alertsData : []);
        
      } catch (error) {
        console.error("Erro ao carregar dados:", error);
      } finally {
        setLoading(false);
        setStatsLoading(false);
      }
    };

    loadInitialData();
  }, []);

  // Estatísticas calculadas
  const stats = useMemo(() => {
    const now = new Date();
    const lastMonth = new Date(now.getFullYear(), now.getMonth() - 1, now.getDate());
    const lastWeek = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);

    const totalUsers = users.length;
    const premiumUsers = users.filter(u => u.isPremium).length;
    const adminUsers = users.filter(u => u.isAdmin).length;
    const activeUsers = users.filter(u => 
      u.lastLogin && new Date(u.lastLogin) > lastWeek
    ).length;
    const newUsersThisMonth = users.filter(u => 
      new Date(u.dateCreated || u.createdAt) > lastMonth
    ).length;
    const totalAlerts = alerts.length;
    const activeAlerts = alerts.filter(a => a.isActive).length;

    return {
      totalUsers,
      premiumUsers,
      adminUsers,
      activeUsers,
      newUsersThisMonth,
      totalAlerts,
      activeAlerts,
      premiumPercentage: totalUsers > 0 ? ((premiumUsers / totalUsers) * 100).toFixed(1) : 0
    };
  }, [users, alerts]);

  // Filtrar utilizadores
  const handleFiltersChange = (filters) => {
    let filtered = [...users];

    if (filters.search) {
      filtered = filtered.filter(user =>
        user.email.toLowerCase().includes(filters.search.toLowerCase())
      );
    }

    if (filters.type !== 'all') {
      filtered = filtered.filter(user => {
        switch (filters.type) {
          case 'premium': return user.isPremium;
          case 'basic': return !user.isPremium;
          case 'admin': return user.isAdmin;
          default: return true;
        }
      });
    }

    if (filters.dateRange !== 'all') {
      const now = new Date();
      const filterDate = new Date();
      
      switch (filters.dateRange) {
        case 'today':
          filterDate.setHours(0, 0, 0, 0);
          break;
        case 'week':
          filterDate.setDate(now.getDate() - 7);
          break;
        case 'month':
          filterDate.setMonth(now.getMonth() - 1);
          break;
        case 'quarter':
          filterDate.setMonth(now.getMonth() - 3);
          break;
      }
      
      filtered = filtered.filter(user =>
        new Date(user.dateCreated || user.createdAt) >= filterDate
      );
    }

    setFilteredUsers(filtered);
  };

  // Gestão de utilizadores
  const handleUpgrade = async (userEmail) => {
    try {
      const userId = await getUserIdByEmail(userEmail);
      const res = await handleAction(upgradeToPremium, userId);
      if (res) {
        setUsers(prevUsers =>
          prevUsers.map(u =>
            u._id === userId ? { ...u, isPremium: true } : u
          )
        );
        setFilteredUsers(prevUsers =>
          prevUsers.map(u =>
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
      const userId = await getUserIdByEmail(userEmail);
      const res = await handleAction(removePremium, userId);
      if (res) {
        setUsers(prevUsers =>
          prevUsers.map(u =>
            u._id === userId ? { ...u, isPremium: false } : u
          )
        );
        setFilteredUsers(prevUsers =>
          prevUsers.map(u =>
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
    return res;
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p className="text-gray-600">A carregar painel administrativo...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-7xl mx-auto p-6 space-y-6">
        {/* Header */}
        <div className="bg-white rounded-xl p-6 shadow-sm border border-gray-200">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-3xl font-bold text-gray-900">Painel Administrativo</h1>
              <p className="text-gray-600 mt-1">
                Gestão completa da plataforma Câmbio Angola
              </p>
            </div>
            <div className="flex items-center gap-3">
              <div className="text-right">
                <p className="text-sm text-gray-500">Última actualização</p>
                <p className="font-medium">{new Date().toLocaleString('pt-PT')}</p>
              </div>
              <button
                onClick={() => window.location.reload()}
                className="p-3 bg-blue-600 text-white rounded-xl hover:bg-blue-700 transition-colors"
                title="Actualizar dados"
              >
                <RefreshCw className="w-5 h-5" />
              </button>
            </div>
          </div>
        </div>

        {/* Estatísticas principais */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          <StatCard
            title="Total Utilizadores"
            value={stats.totalUsers}
            icon={Users}
            color="blue"
            subtitle={`${stats.newUsersThisMonth} novos este mês`}
            loading={statsLoading}
          />
          <StatCard
            title="Utilizadores Premium"
            value={stats.premiumUsers}
            icon={Crown}
            color="yellow"
            subtitle={`${stats.premiumPercentage}% do total`}
            loading={statsLoading}
          />
          <StatCard
            title="Utilizadores Activos"
            value={stats.activeUsers}
            icon={Activity}
            color="green"
            subtitle="Últimos 7 dias"
            loading={statsLoading}
          />
          <StatCard
            title="Alertas Activos"
            value={stats.activeAlerts}
            icon={AlertTriangle}
            color="orange"
            subtitle={`${stats.totalAlerts} total`}
            loading={statsLoading}
          />
        </div>

        {/* Gestão de taxas */}
        <RatesManagement 
          currentRates={todayRates}
          onUpdate={handleUpdateRates}
          loading={apiLoading}
        />

        {/* Filtros avançados */}
        <AdvancedFilters 
          onFiltersChange={handleFiltersChange}
          totalUsers={filteredUsers.length}
        />

        {/* Lista de utilizadores */}
        <div className="bg-white rounded-xl shadow-sm border border-gray-200">
          <div className="p-6 border-b border-gray-200">
            <div className="flex items-center justify-between">
              <h2 className="text-xl font-semibold text-gray-900">
                Gestão de Utilizadores ({filteredUsers.length})
              </h2>
              <button
                onClick={() => {
                  // Implementar exportação de dados
                  console.log('Exportar dados dos utilizadores');
                }}
                className="flex items-center gap-2 px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors"
              >
                <Download className="w-4 h-4" />
                Exportar Dados
              </button>
            </div>
          </div>

          <div className="p-6">
            {filteredUsers.length === 0 ? (
              <div className="text-center py-12">
                <Users className="w-12 h-12 text-gray-400 mx-auto mb-4" />
                <p className="text-gray-500 text-lg">Nenhum utilizador encontrado</p>
                <p className="text-gray-400 text-sm">Ajuste os filtros para ver mais resultados</p>
              </div>
            ) : (
              <div className="space-y-4">
                {filteredUsers.map(user => (
                  <UserCard
                    key={user._id || user.email}
                    user={user}
                    onUpgrade={handleUpgrade}
                    onDowngrade={handleDowngrade}
                    onViewDetails={setSelectedUser}
                    loading={apiLoading}
                  />
                ))}
              </div>
            )}
          </div>
        </div>

        {/* Mensagens de feedback */}
        <AnimatePresence>
          {message && (
            <motion.div
              className="fixed bottom-6 right-6 z-50"
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

        {/* Modal de detalhes do utilizador */}
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

// Componente de card de utilizador simplificado
export const UserCard = ({ user, onUpgrade, onDowngrade, onViewDetails, loading }) => {
  const [showActions, setShowActions] = useState(false);

  return (
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
            onClick={() => onUpgrade(user.email)}
            disabled={loading}
            className="flex items-center gap-2 px-3 py-2 text-green-700 bg-green-50 hover:bg-green-100 rounded-lg transition-colors disabled:opacity-50"
            title="Promover a Premium"
          >
            <Crown className="w-4 h-4" />
            <span className="hidden sm:inline">Premium</span>
          </button>
        ) : (
          <button
            onClick={() => onDowngrade(user.email)}
            disabled={loading}
            className="flex items-center gap-2 px-3 py-2 text-red-700 bg-red-50 hover:bg-red-100 rounded-lg transition-colors disabled:opacity-50"
            title="Remover Premium"
          >
            <Users className="w-4 h-4" />
            <span className="hidden sm:inline">Básico</span>
          </button>
        )}
      </div>
    </motion.div>
  );
};

// Modal de detalhes do utilizador
export const UserDetailsModal = ({ user, onClose }) => {
  if (!user) return null;

  const formatDate = (date) => {
    if (!date) return 'N/A';
    return new Date(date).toLocaleString('pt-PT');
  };

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
        {/* Header */}
        <div className="flex items-center justify-between mb-6">
          <h3 className="text-xl font-bold text-gray-900">Detalhes do Utilizador</h3>
          <button
            onClick={onClose}
            className="w-8 h-8 rounded-full hover:bg-gray-100 flex items-center justify-center text-xl text-gray-500 hover:text-gray-700"
          >
            ×
          </button>
        </div>

        {/* Avatar e info básica */}
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

        {/* Informações detalhadas */}
        <div className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <div className="p-3 bg-blue-50 rounded-lg">
              <div className="flex items-center gap-2 mb-1">
                <Calendar className="w-4 h-4 text-blue-600" />
                <span className="text-sm font-medium text-blue-900">Data de Registo</span>
              </div>
              <p className="text-blue-800 font-semibold">
                {formatDate(user.dateCreated || user.createdAt)}
              </p>
            </div>

            <div className="p-3 bg-green-50 rounded-lg">
              <div className="flex items-center gap-2 mb-1">
                <Activity className="w-4 h-4 text-green-600" />
                <span className="text-sm font-medium text-green-900">Último Login</span>
              </div>
              <p className="text-green-800 font-semibold">
                {user.lastLogin ? formatDate(user.lastLogin) : 'Nunca'}
              </p>
            </div>
          </div>

          {user.phoneNumber && (
            <div className="p-3 bg-purple-50 rounded-lg">
              <div className="flex items-center gap-2 mb-1">
                <Phone className="w-4 h-4 text-purple-600" />
                <span className="text-sm font-medium text-purple-900">Número de Telefone</span>
              </div>
              <p className="text-purple-800 font-semibold">{user.phoneNumber}</p>
            </div>
          )}

          <div className="p-3 bg-orange-50 rounded-lg">
            <div className="flex items-center gap-2 mb-1">
              <AlertTriangle className="w-4 h-4 text-orange-600" />
              <span className="text-sm font-medium text-orange-900">Alertas Ativos</span>
            </div>
            <p className="text-orange-800 font-semibold">{user.alertsCount || 0} alertas</p>
          </div>

          {user.isPremium && user.premiumExpiryDate && (
            <div className="p-3 bg-yellow-50 rounded-lg border border-yellow-200">
              <div className="flex items-center gap-2 mb-1">
                <Clock className="w-4 h-4 text-yellow-600" />
                <span className="text-sm font-medium text-yellow-900">Premium Expira</span>
              </div>
              <p className="text-yellow-800 font-semibold">
                {formatDate(user.premiumExpiryDate)}
              </p>
            </div>
          )}
        </div>

        {/* Estatísticas de uso */}
        <div className="mt-6 p-4 bg-gray-50 rounded-xl">
          <h4 className="font-semibold text-gray-900 mb-3">Estatísticas de Uso</h4>
          <div className="grid grid-cols-3 gap-3 text-center">
            <div>
              <p className="text-2xl font-bold text-gray-900">{user.alertsCount || 0}</p>
              <p className="text-xs text-gray-600">Alertas Criados</p>
            </div>
            <div>
              <p className="text-2xl font-bold text-gray-900">
                {user.loginCount || 0}
              </p>
              <p className="text-xs text-gray-600">Total Logins</p>
            </div>
            <div>
              <p className="text-2xl font-bold text-gray-900">
                {user.isPremium ? 'Sim' : 'Não'}
              </p>
              <p className="text-xs text-gray-600">Status Premium</p>
            </div>
          </div>
        </div>

        {/* Ações rápidas */}
        <div className="mt-6 flex gap-2">
          <button
            className="flex-1 py-2 px-4 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors text-sm font-medium"
            onClick={() => {
              navigator.clipboard.writeText(user.email);
              // Poderia adicionar uma notificação aqui
            }}
          >
            Copiar Email
          </button>
          <button
            className="flex-1 py-2 px-4 bg-gray-200 text-gray-800 rounded-lg hover:bg-gray-300 transition-colors text-sm font-medium"
            onClick={() => {
              window.open(`mailto:${user.email}`, '_blank');
            }}
          >
            Enviar Email
          </button>
        </div>
      </motion.div>
    </motion.div>
  );
};
// Componente de gestão de utilizadores
export const UserManagement = ({ 
  users, 
  onUpgrade, 
  onDowngrade, 
  onViewDetails, 
  loading,
  onExport 
}) => {
  const [searchTerm, setSearchTerm] = useState("");
  const [filterType, setFilterType] = useState("all");
  const [filteredUsers, setFilteredUsers] = useState(users);

  useEffect(() => {
    let filtered = users;

    if (searchTerm) {
      filtered = filtered.filter(user => 
        user.email.toLowerCase().includes(searchTerm.toLowerCase())
      );
    }

    if (filterType !== "all") {
      filtered = filtered.filter(user => {
        switch (filterType) {
          case "premium": return user.isPremium;
          case "basic": return !user.isPremium;
          case "admin": return user.isAdmin;
          default: return true;
        }
      });
    }

    setFilteredUsers(filtered);
  }, [searchTerm, filterType, users]);

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className="bg-white rounded-2xl shadow-lg p-6"
    >
      <div className="flex items-center justify-between mb-6">
        <h2 className="text-xl font-bold text-gray-900">Utilizadores ({filteredUsers.length})</h2>
        <button
          onClick={onExport}
          className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
        >
          <Download className="w-4 h-4" />
          Exportar
        </button>
      </div>

      {/* Filtros */}
      <div className="flex flex-col sm:flex-row gap-4 mb-6">
        <div className="relative flex-1">
          <Search className="w-4 h-4 absolute left-3 top-3.5 text-gray-400" />
          <input
            type="text"
            placeholder="Pesquisar por email..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full pl-10 pr-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
          />
        </div>
        <div className="relative">
          <Filter className="w-4 h-4 absolute left-3 top-3.5 text-gray-400" />
          <select
            value={filterType}
            onChange={(e) => setFilterType(e.target.value)}
            className="pl-10 pr-8 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
          >
            <option value="all">Todos</option>
            <option value="premium">Premium</option>
            <option value="basic">Básico</option>
            <option value="admin">Admin</option>
          </select>
        </div>
      </div>

      {/* Lista de Utilizadores */}
      <div className="space-y-3 max-h-96 overflow-y-auto">
        {filteredUsers.map(user => (
          <UserCard
            key={user.email}
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

// Componente de formulário de taxas
export const RatesForm = ({ todayRates, onUpdate }) => {
  const rateFields = ['usdBuy','usdSell','eurBuy','eurSell','zarBuy','zarSell','cadBuy','cadSell'];
  const initialData = Object.fromEntries(
    Object.entries(todayRates).filter(([key]) => rateFields.includes(key))
  );
  const [data, setData] = useState(initialData);
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState("");
  const [type, setType] = useState("info");

  const handleChange = (e) => {
    const { name, value } = e.target;
    if (rateFields.includes(name)) {
      setData(prev => ({ ...prev, [name]: value }));
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setMessage("Atualizando taxas...");
    setType("info");

    try {
      await onUpdate(data);
      setMessage("Taxas atualizadas com sucesso!");
      setType("success");
    } catch (error) {
      setMessage("Erro ao atualizar taxas");
      setType("error");
    } finally {
      setLoading(false);
    }
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0, transition: { delay: 0.1 } }}
      className="bg-white rounded-2xl shadow-lg p-6"
    >
      <h2 className="text-xl font-bold text-gray-900 mb-6">Atualizar Taxas</h2>
      
      <div className="space-y-6">
        <div className="grid grid-cols-2 gap-4">
          {Object.keys(data).map(key => (
            <div key={key}>
              <label htmlFor={key} className="block text-sm font-medium capitalize text-gray-700">
                {key.replace('Buy', ' Compra').replace('Sell', ' Venda')}
              </label>
              <input
                id={key}
                name={key}
                type="number"
                step="0.01"
                value={data[key]}
                onChange={handleChange}
                disabled={loading}
                className="mt-1 block w-full rounded-xl border border-gray-300 p-3 focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              />
            </div>
          ))}
        </div>
        
        <button
          onClick={handleSubmit}
          disabled={loading}
          className={`w-full py-3 rounded-xl font-bold text-white transition-colors ${
            loading ? "bg-blue-400 cursor-not-allowed" : "bg-blue-600 hover:bg-blue-700"
          }`}
        >
          {loading ? "Atualizando..." : "Atualizar Taxas"}
        </button>
        
        <AnimatePresence>
          {message && <MessageBox message={message} type={type} />}
        </AnimatePresence>
      </div>
    </motion.div>
  );
};