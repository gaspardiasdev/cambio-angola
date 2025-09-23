/* eslint-disable no-unused-vars */
import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Users, Crown, Shield, TrendingUp } from "lucide-react";
import {
  RatesForm,
  StatCard,
  UserDetailsModal,
  UserManagement,
  MessageBox,
} from "./adm_components/admComponents";
import {
  fetchUsers,
  updateRates,
  upgradeToPremium,
  removePremium,
  fetchRates,
  getUserIdByEmail,
} from "./services/api";
import { useAdminApi } from "./hooks/useAdminApi";

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

  // FIXED: Use MongoDB ObjectId (_id) instead of email
  const handleUpgrade = async (userIdOrEmail) => {
    try {
      let userId = userIdOrEmail;
      
      // If it's an email, convert to ObjectId first
      if (userIdOrEmail.includes('@')) {
        userId = await getUserIdByEmail(userIdOrEmail);
      }
      
      const res = await handleAction(upgradeToPremium, userId);
      if (res) {
        // Update local state using the userId
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

  // FIXED: Use MongoDB ObjectId (_id) instead of email
  const handleDowngrade = async (userIdOrEmail) => {
    try {
      let userId = userIdOrEmail;
      
      // If it's an email, convert to ObjectId first
      if (userIdOrEmail.includes('@')) {
        userId = await getUserIdByEmail(userIdOrEmail);
      }
      
      const res = await handleAction(removePremium, userId);
      if (res) {
        // Update local state using the userId
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

  const handleExport = () => {
    // exportação local ou via backend
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
          <h1 className="text-3xl font-bold text-gray-900 mb-2">
            Painel de Administração
          </h1>
          <p className="text-gray-600">
            Gerencie utilizadores e taxas de câmbio
          </p>
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
              onExport={handleExport}
              loading={loading}
            />
          </div>
          <div className="lg:col-span-1">
            <RatesForm todayRates={todayRates} onUpdate={handleUpdateRates} />
          </div>
        </div>

        <AnimatePresence>
          {message && (
            <motion.div
              className="fixed bottom-6 right-6 z-40"
              initial={{ opacity: 0, x: 100 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: 100 }}
            >
              <MessageBox message={message} type={type} />
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