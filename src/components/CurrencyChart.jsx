/* eslint-disable no-unused-vars */
// src/components/CurrencyChart.js
import React, { useState, useMemo } from "react";
import { Line } from "react-chartjs-2";
import { motion, AnimatePresence } from "framer-motion";
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  Title,
  Tooltip,
  Legend,
  Filler,
} from "chart.js";

ChartJS.register(
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  Title,
  Tooltip,
  Legend,
  Filler
);

export default function CurrencyChart({ rates, selectedCurrency }) {
  const [viewMode, setViewMode] = useState("7d"); // 7d, 15d, 30d
  const [showComparison, setShowComparison] = useState(true);

  const currencyInfo = {
    usd: {
      name: "Dólar Americano",
      flag: "🇺🇸",
      colors: {
        primary: "#3B82F6",
        secondary: "#1E40AF",
        gradient: "from-blue-500 to-blue-700",
      },
    },
    eur: {
      name: "Euro",
      flag: "🇪🇺",
      colors: {
        primary: "#8B5CF6",
        secondary: "#7C3AED",
        gradient: "from-purple-500 to-purple-700",
      },
    },
    zar: {
      name: "Rand Sul-Africano",
      flag: "🇿🇦",
      colors: {
        primary: "#10B981",
        secondary: "#059669",
        gradient: "from-green-500 to-green-700",
      },
    },
    cad: {
      name: "Dólar Canadense",
      flag: "🇨🇦",
      colors: {
        primary: "#EF4444",
        secondary: "#DC2626",
        gradient: "from-red-500 to-red-700",
      },
    },
  };

  const viewModeOptions = {
    "7d": { label: "7 dias", days: 7 },
    "15d": { label: "15 dias", days: 15 },
    "30d": { label: "30 dias", days: 30 },
  };

  const filteredRates = useMemo(() => {
    if (!rates || rates.length === 0) return [];

    // calcula a data limite com base no viewMode
    const cutoff = new Date();
    cutoff.setDate(cutoff.getDate() - viewModeOptions[viewMode].days);

    // garante que rates estão ordenados por data crescente
    const sortedRates = [...rates].sort(
      (a, b) => new Date(a.date) - new Date(b.date)
    );

    // retorna só os que estão dentro do intervalo escolhido
    return sortedRates.filter((rate) => new Date(rate.date) >= cutoff);
  }, [rates, viewMode]);

  const stats = useMemo(() => {
    if (!filteredRates.length) return null;

    const buyValues = filteredRates.map(
      (rate) => rate[`${selectedCurrency}Buy`]
    );
    const sellValues = filteredRates.map(
      (rate) => rate[`${selectedCurrency}Sell`]
    );

    const latest = filteredRates[filteredRates.length - 1];
    const previous = filteredRates[filteredRates.length - 2];

    const buyChange = previous
      ? ((latest[`${selectedCurrency}Buy`] -
          previous[`${selectedCurrency}Buy`]) /
          previous[`${selectedCurrency}Buy`]) *
        100
      : 0;
    const sellChange = previous
      ? ((latest[`${selectedCurrency}Sell`] -
          previous[`${selectedCurrency}Sell`]) /
          previous[`${selectedCurrency}Sell`]) *
        100
      : 0;

    return {
      maxBuy: Math.max(...buyValues),
      minBuy: Math.min(...buyValues),
      maxSell: Math.max(...sellValues),
      minSell: Math.min(...sellValues),
      avgBuy: buyValues.reduce((a, b) => a + b, 0) / buyValues.length,
      avgSell: sellValues.reduce((a, b) => a + b, 0) / sellValues.length,
      buyChange: buyChange,
      sellChange: sellChange,
      latest,
    };
  }, [filteredRates, selectedCurrency]);

  if (!rates || rates.length === 0) {
    return (
      <motion.div
        initial={{ opacity: 0, scale: 0.9 }}
        animate={{ opacity: 1, scale: 1 }}
        transition={{ duration: 0.5 }}
        className="relative overflow-hidden"
      >
        {/* Background animado */}
        <div className="absolute inset-0 bg-gradient-to-br from-slate-100 to-blue-100 rounded-3xl" />
        <div className="absolute inset-0 flex items-center justify-center">
          <motion.div
            className="w-16 h-16 border-4 border-blue-500 border-t-transparent rounded-full"
            animate={{ rotate: 360 }}
            transition={{ duration: 1, repeat: Infinity, ease: "linear" }}
          />
        </div>
        <div className="relative z-10 text-center p-12">
          <motion.div
            animate={{ scale: [1, 1.1, 1] }}
            transition={{ duration: 2, repeat: Infinity }}
          >
            <span className="text-4xl mb-4 block">📊</span>
          </motion.div>
          <h3 className="text-xl font-bold text-slate-700 mb-2">
            Carregando dados...
          </h3>
          <p className="text-slate-500">Preparando gráfico de análise</p>
        </div>
      </motion.div>
    );
  }

  const currInfo = currencyInfo[selectedCurrency];

  const data = {
    labels: filteredRates.map((rate) => {
      const date = new Date(rate.date);
      return date.toLocaleDateString("pt-AO", {
        day: "2-digit",
        month: "2-digit",
      });
    }),
    datasets: [
      {
        label: `💰 Taxa de Compra`,
        data: filteredRates.map((rate) => rate[`${selectedCurrency}Buy`]),
        borderColor: currInfo.colors.primary,
        backgroundColor: `${currInfo.colors.primary}15`,
        borderWidth: 3,
        tension: 0.4,
        fill: showComparison ? false : true,
        pointBackgroundColor: currInfo.colors.primary,
        pointBorderColor: "#ffffff",
        pointBorderWidth: 2,
        pointRadius: 6,
        pointHoverRadius: 8,
        pointHoverBackgroundColor: currInfo.colors.secondary,
      },
      ...(showComparison
        ? [
            {
              label: `🏪 Taxa de Venda`,
              data: filteredRates.map(
                (rate) => rate[`${selectedCurrency}Sell`]
              ),
              borderColor: "#EF4444",
              backgroundColor: "#EF444415",
              borderWidth: 3,
              tension: 0.4,
              fill: false,
              pointBackgroundColor: "#EF4444",
              pointBorderColor: "#ffffff",
              pointBorderWidth: 2,
              pointRadius: 6,
              pointHoverRadius: 8,
              pointHoverBackgroundColor: "#DC2626",
            },
          ]
        : []),
    ],
  };

  const options = {
    responsive: true,
    maintainAspectRatio: false,
    interaction: {
      intersect: false,
      mode: "index",
    },
    plugins: {
      legend: {
        position: "top",
        align: "center",
        labels: {
          font: { size: 14, weight: "600" },
          color: "#1F2937",
          padding: 20,
          usePointStyle: true,
          pointStyle: "circle",
        },
      },
      tooltip: {
        backgroundColor: "rgba(0, 0, 0, 0.9)",
        titleColor: "#ffffff",
        bodyColor: "#ffffff",
        borderColor: currInfo.colors.primary,
        borderWidth: 2,
        cornerRadius: 12,
        padding: 16,
        titleFont: { size: 14, weight: "600" },
        bodyFont: { size: 13 },
        callbacks: {
          title: (tooltipItems) => {
            const date = new Date(
              filteredRates[tooltipItems[0].dataIndex].date
            );
            return date.toLocaleDateString("pt-AO", {
              weekday: "long",
              day: "numeric",
              month: "long",
            });
          },
          label: (context) =>
            `${context.dataset.label}: ${context.formattedValue.replace(
              ",",
              "."
            )} KZ`,
        },
      },
    },
    scales: {
      y: {
        beginAtZero: false,
        grid: {
          color: "#E5E7EB",
          drawBorder: false,
        },
        ticks: {
          color: "#6B7280",
          font: { size: 12, weight: "500" },
          callback: (value) => `${value.toLocaleString()} KZ`,
        },
        title: {
          display: true,
          text: "Valor em Kwanza (KZ)",
          color: "#374151",
          font: { size: 13, weight: "600" },
        },
      },
      x: {
        grid: {
          color: "#F3F4F6",
          drawBorder: false,
        },
        ticks: {
          color: "#6B7280",
          font: { size: 12, weight: "500" },
        },
        title: {
          display: true,
          text: "Período",
          color: "#374151",
          font: { size: 13, weight: "600" },
        },
      },
    },
  };

  return (
    <div className="relative">
      {/* Background effects */}
      <div className="absolute inset-0 bg-gradient-to-br from-white/80 to-slate-50/80 rounded-3xl" />
      <div className="absolute inset-0 bg-gradient-to-tr from-transparent via-white/50 to-transparent rounded-3xl" />

      <motion.div
        initial={{ opacity: 0, y: 30 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.6 }}
        className="relative z-10 p-4 sm:p-6 lg:p-8"
      >
        {/* Header */}
        <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-6 mb-8">
          <div className="flex items-center gap-4 justify-center lg:justify-start">
            <motion.div
              className={`w-12 h-12 bg-gradient-to-br ${currInfo.colors.gradient} rounded-2xl flex items-center justify-center shadow-lg`}
              whileHover={{ scale: 1.1, rotate: 5 }}
              transition={{ type: "spring", stiffness: 400 }}
            >
              <span className="text-2xl">{currInfo.flag}</span>
            </motion.div>
            <div className="text-center lg:text-left">
              <motion.h2
                className="text-2xl font-bold bg-gradient-to-r from-slate-800 to-slate-600 bg-clip-text text-transparent"
                key={selectedCurrency}
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
              >
                {currInfo.name}
              </motion.h2>
              <p className="text-sm text-slate-600 font-medium">
                Análise de tendência • {viewModeOptions[viewMode].label}
              </p>
            </div>
          </div>

          {/* Controls */}
          <div className="flex flex-wrap justify-center gap-3">
            {/* View Mode Toggle */}
            <div className="flex bg-slate-100 rounded-2xl p-1">
              {Object.entries(viewModeOptions).map(([key, option]) => (
                <motion.button
                  key={key}
                  onClick={() => setViewMode(key)}
                  className={`px-3 sm:px-4 py-1.5 sm:py-2 rounded-xl text-xs sm:text-sm font-semibold transition-all ${
                    viewMode === key
                      ? `bg-gradient-to-r ${currInfo.colors.gradient} text-white shadow-md`
                      : "text-slate-600 hover:text-slate-800"
                  }`}
                  whileHover={{ scale: 1.05 }}
                  whileTap={{ scale: 0.95 }}
                >
                  {option.label}
                </motion.button>
              ))}
            </div>

            {/* Comparison Toggle */}
            <motion.button
              onClick={() => setShowComparison(!showComparison)}
              className={`px-4 py-2 rounded-2xl font-semibold text-sm border-2 transition-all ${
                showComparison
                  ? "bg-emerald-500 text-white border-emerald-500 shadow-emerald-500/25"
                  : "bg-white text-slate-600 border-slate-200 hover:border-slate-300"
              }`}
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
            >
              {showComparison ? "🔄 Comparativo" : "📈 Simples"}
            </motion.button>
          </div>
        </div>

        {/* Stats Cards */}
        <AnimatePresence mode="wait">
          {stats && (
            <motion.div
              key={`${selectedCurrency}-${viewMode}`}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -20 }}
              className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-8"
            >
              {/* ...cards... */}
            </motion.div>
          )}
        </AnimatePresence>

        {/* Chart Container */}
        <motion.div
          className="relative w-full max-w-5xl mx-auto bg-white/70 backdrop-blur-sm rounded-2xl border border-white/50 shadow-xl p-4 sm:p-6"
          whileHover={{ scale: 1.01 }}
          transition={{ type: "spring", stiffness: 300 }}
        >
          <div className="h-64 sm:h-72 lg:h-96">
            <Line data={data} options={options} />
          </div>
        </motion.div>

        {/* Analysis summary */}
        <motion.div
          className="mt-6 p-4 sm:p-6 bg-gradient-to-r from-slate-50 to-blue-50 rounded-2xl border border-slate-200 text-center sm:text-left"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.5 }}
        >
          {/* ...conteúdo resumo... */}
        </motion.div>
      </motion.div>
    </div>
  );
}
