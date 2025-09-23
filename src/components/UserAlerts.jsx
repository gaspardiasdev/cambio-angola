/* eslint-disable no-unused-vars */
import { useState, useEffect } from "react";
import { motion } from "framer-motion";
import { useAuth } from "./../context/AuthContext";
import { fetchUserAlerts, deleteAlert } from "../services/api";

export default function UserAlerts() {
  const [alerts, setAlerts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [deleting, setDeleting] = useState(null);
  const { token } = useAuth();

  const loadAlerts = async () => {
    if (!token) {
      setError("Autenticação necessária.");
      setLoading(false);
      return;
    }
    setLoading(true);
    setError(null);
    try {
      const userAlerts = await fetchUserAlerts(token);
      setAlerts(userAlerts);
    } catch (err) {
      setError("Não foi possível carregar os alertas.");
      console.error(err);
    }
    setLoading(false);
  };

  useEffect(() => {
    loadAlerts();
  }, [token]);

  const handleDelete = async (alertId) => {
    if (!window.confirm("Tens a certeza que queres apagar este alerta?")) return;

    try {
      setDeleting(alertId);
      await deleteAlert(alertId, token);
      setAlerts((prev) => prev.filter((a) => a._id !== alertId));
    } catch (err) {
      setError("Erro ao apagar o alerta.");
      console.error(err);
    } finally {
      setDeleting(null);
    }
  };

  if (loading) {
    return (
      <div className="p-4 text-center text-gray-600 bg-white/60 backdrop-blur-md rounded-xl shadow-inner">
        A carregar os teus alertas...
      </div>
    );
  }

  if (error) {
    return (
      <div className="p-4 text-center font-medium bg-red-50 text-red-700 border border-red-200 rounded-xl">
        {error}
      </div>
    );
  }

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5, delay: 0.1 }}
      className="p-6 bg-white/80 backdrop-blur-md rounded-2xl shadow-lg mb-6"
    >
      <h3 className="text-lg font-bold text-gray-800 mb-4">🔔 Meus Alertas</h3>

      {alerts.length === 0 ? (
        <div className="p-4 text-center text-gray-500 bg-gray-50 rounded-xl border border-gray-200">
          Ainda não tens alertas definidos.
        </div>
      ) : (
        <ul className="space-y-3">
          {alerts.map((alert) => (
            <motion.li
              key={alert._id}
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              whileHover={{ scale: 1.01 }}
              className="flex justify-between items-center bg-white/70 p-4 rounded-xl shadow-sm border border-gray-200"
            >
              <div>
                <span className="font-semibold text-gray-800">
                  {alert.currency.toUpperCase()}
                </span>
                <span className="ml-2 text-sm text-gray-600">
                  {alert.rateType === "buy" ? "Compra" : "Venda"} ≥{" "}
                  <span className="font-medium text-blue-600">
                    {alert.value} Kz
                  </span>
                </span>
              </div>
              <motion.button
                onClick={() => handleDelete(alert._id)}
                disabled={deleting === alert._id}
                whileTap={{ scale: 0.9 }}
                whileHover={{ scale: 1.1 }}
                className={`p-2 rounded-full transition ${
                  deleting === alert._id
                    ? "text-gray-400 cursor-not-allowed"
                    : "text-red-600 hover:bg-red-50"
                }`}
                title="Apagar alerta"
              >
                {deleting === alert._id ? (
                  <span className="text-xs">...</span>
                ) : (
                  <svg
                    xmlns="http://www.w3.org/2000/svg"
                    className="h-5 w-5"
                    viewBox="0 0 20 20"
                    fill="currentColor"
                  >
                    <path
                      fillRule="evenodd"
                      d="M9 2a1 1 0 00-.894.553L7.382 4H4a1 1 0 000 2v10a2 2 0 002 
                        2h8a2 2 0 002-2V6a1 1 0 100-2h-3.382l-.724-1.447A1 
                        1 0 0011 2H9zM7 8a1 1 0 
                        012 0v6a1 1 0 11-2 
                        0V8zm5-1a1 1 0 00-1 1v6a1 
                        1 0 102 0V8a1 1 0 00-1-1z"
                      clipRule="evenodd"
                    />
                  </svg>
                )}
              </motion.button>
            </motion.li>
          ))}
        </ul>
      )}
    </motion.div>
  );
}
