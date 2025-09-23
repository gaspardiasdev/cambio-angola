/* eslint-disable no-unused-vars */
// components/ToastNotifications.jsx
import React from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X, CheckCircle, AlertCircle, Info, AlertTriangle, Loader } from 'lucide-react';

const ToastNotifications = ({ notifications = [], onRemove }) => {
  const getToastIcon = (type) => {
    switch (type) {
      case 'success':
        return <CheckCircle className="w-5 h-5" />;
      case 'error':
        return <AlertCircle className="w-5 h-5" />;
      case 'warning':
        return <AlertTriangle className="w-5 h-5" />;
      case 'loading':
        return <Loader className="w-5 h-5 animate-spin" />;
      default:
        return <Info className="w-5 h-5" />;
    }
  };

  const getToastStyles = (type) => {
    switch (type) {
      case 'success':
        return 'bg-green-500 border-green-400 text-white';
      case 'error':
        return 'bg-red-500 border-red-400 text-white';
      case 'warning':
        return 'bg-amber-500 border-amber-400 text-white';
      case 'loading':
        return 'bg-blue-500 border-blue-400 text-white';
      default:
        return 'bg-gray-800 border-gray-700 text-white';
    }
  };

  return (
    <div className="fixed top-4 right-4 z-50 space-y-2 max-w-sm">
      <AnimatePresence mode="popLayout">
        {notifications.map((notification) => (
          <motion.div
            key={notification.id}
            initial={{ opacity: 0, x: 100, scale: 0.8 }}
            animate={{ opacity: 1, x: 0, scale: 1 }}
            exit={{ opacity: 0, x: 100, scale: 0.8, transition: { duration: 0.2 } }}
            layout
            className={`p-4 rounded-lg shadow-lg border backdrop-blur-sm ${getToastStyles(notification.type)}`}
          >
            <div className="flex items-start gap-3">
              <div className="flex-shrink-0 mt-0.5">
                {getToastIcon(notification.type)}
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-sm font-medium leading-relaxed">
                  {notification.message}
                </p>
                {notification.data?.details && (
                  <p className="text-xs mt-1 opacity-80">
                    {notification.data.details}
                  </p>
                )}
              </div>
              {notification.type !== 'loading' && (
                <button
                  onClick={() => onRemove(notification.id)}
                  className="flex-shrink-0 opacity-70 hover:opacity-100 transition-opacity"
                >
                  <X className="w-4 h-4" />
                </button>
              )}
            </div>
            
            {/* Progress bar para loading */}
            {notification.type === 'loading' && (
              <div className="mt-3 w-full bg-white/20 rounded-full h-1">
                <div className="bg-white h-1 rounded-full animate-pulse" style={{ width: '60%' }} />
              </div>
            )}
          </motion.div>
        ))}
      </AnimatePresence>
    </div>
  );
};

export default ToastNotifications;