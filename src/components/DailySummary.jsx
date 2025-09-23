/* eslint-disable no-unused-vars */
/* eslint-disable no-undef */
// Enhanced DailySummary component with debug info
import React from "react";
import { motion } from "framer-motion";
import { Card } from "../App";

export default function DailySummary({ todayRates, yesterdayRates, formatDate }) {
  // Debug logging
  console.log("DailySummary props:", { todayRates, yesterdayRates });

  if (!todayRates) {
    console.warn("DailySummary: todayRates is null/undefined");
    return (
      <div className="p-8 bg-amber-50 border-l-4 border-amber-400 rounded-lg">
        <div className="flex items-center">
          <div className="text-amber-600">
            <h3 className="text-lg font-semibold">Dados não disponíveis</h3>
            <p className="text-sm">As taxas de câmbio estão sendo carregadas...</p>
          </div>
        </div>
      </div>
    );
  }

  // Verify that todayRates has the expected structure
  const requiredFields = ['usdBuy', 'usdSell', 'eurBuy', 'eurSell', 'zarBuy', 'zarSell', 'cadBuy', 'cadSell'];
  const missingFields = requiredFields.filter(field => todayRates[field] === undefined || todayRates[field] === null);
  
  if (missingFields.length > 0) {
    console.warn("DailySummary: Missing required fields:", missingFields);
    console.log("Available fields:", Object.keys(todayRates));
  }

  const currencies = [
    {
      code: "usd",
      name: "Dólar",
      flag: "🇺🇸",
      accent: "from-blue-500 to-blue-700",
    },
    {
      code: "eur",
      name: "Euro",
      flag: "🇪🇺",
      accent: "from-purple-500 to-purple-700",
    },
    {
      code: "zar",
      name: "Rand",
      flag: "🇿🇦",
      accent: "from-green-500 to-green-700",
    },
    {
      code: "cad",
      name: "Dólar Can.",
      flag: "🇨🇦",
      accent: "from-red-500 to-red-700",
    },
  ];

  const getTrend = (today, yesterday) => {
    if (!yesterday || yesterday === 0) {
      return {
        direction: "neutral",
        percent: "0.00",
        color: "text-slate-500",
        bgColor: "bg-slate-500/10",
      };
    }

    const change = today - yesterday;
    const percent = ((change / yesterday) * 100).toFixed(2);
    
    if (change > 0) {
      return {
        direction: "up",
        percent: `+${percent}`,
        color: "text-emerald-500",
        bgColor: "bg-emerald-500/10",
      };
    } else if (change < 0) {
      return {
        direction: "down",
        percent: percent,
        color: "text-red-500",
        bgColor: "bg-red-500/10",
      };
    } else {
      return {
        direction: "neutral",
        percent: "0.00",
        color: "text-slate-500",
        bgColor: "bg-slate-500/10",
      };
    }
  };

  const containerVariants = {
    hidden: { opacity: 0 },
    visible: { opacity: 1, transition: { staggerChildren: 0.15 } },
  };
  
  const cardVariants = {
    hidden: { opacity: 0, y: 20, scale: 0.97 },
    visible: {
      opacity: 1,
      y: 0,
      scale: 1,
      transition: { type: "spring", stiffness: 90, damping: 15 },
    },
  };

  return (
    <section className="py-8 bg-slate-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="mb-6">
          <h2 className="text-2xl font-bold text-slate-900 mb-2">
            Resumo de Hoje
          </h2>
          <p className="text-slate-600">
            {todayRates.date ? formatDate(todayRates.date, "long") : "Data não disponível"}
          </p>
        </div>

        <motion.div 
          className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4"
          variants={containerVariants}
          initial="hidden"
          animate="visible"
        >
          {currencies.map((currency, index) => {
            const buyRate = todayRates[`${currency.code}Buy`];
            const sellRate = todayRates[`${currency.code}Sell`];
            const yesterdaySell = yesterdayRates?.[`${currency.code}Sell`];
            
            // Debug log for each currency
            console.log(`${currency.code.toUpperCase()} rates:`, {
              buy: buyRate,
              sell: sellRate,
              yesterdaySell: yesterdaySell
            });

            const trend = getTrend(sellRate, yesterdaySell);

            return (
              <motion.div key={currency.code} variants={cardVariants}>
                <Card className="relative">
                  <div className="flex items-center justify-between mb-4">
                    <div className="flex items-center space-x-2">
                      <span className="text-2xl">{currency.flag}</span>
                      <div>
                        <p className="font-semibold text-slate-900">
                          {currency.name}
                        </p>
                        <p className="text-sm text-slate-500">
                          {currency.code.toUpperCase()}
                        </p>
                      </div>
                    </div>

                    {trend.direction !== "neutral" && (
                      <div
                        className={`flex items-center space-x-1 px-2 py-1 rounded-full text-xs font-medium ${
                          trend.direction === "up"
                            ? "bg-green-100 text-green-800"
                            : "bg-red-100 text-red-800"
                        }`}
                      >
                        <span>{trend.direction === "up" ? "↗" : "↘"}</span>
                        <span>{trend.percent}%</span>
                      </div>
                    )}
                  </div>

                  <div className="space-y-3">
                    <div className="flex justify-between items-center">
                      <span className="text-sm text-slate-500">Compra</span>
                      <span className="font-semibold text-slate-900">
                        {buyRate ? buyRate.toLocaleString() : "N/A"} KZ
                      </span>
                    </div>
                    <div className="flex justify-between items-center">
                      <span className="text-sm text-slate-500">Venda</span>
                      <span className="text-lg font-bold text-slate-900">
                        {sellRate ? sellRate.toLocaleString() : "N/A"} KZ
                      </span>
                    </div>
                  </div>
                </Card>
              </motion.div>
            );
          })}
        </motion.div>
      </div>
    </section>
  );
}