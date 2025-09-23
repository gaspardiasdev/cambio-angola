/* eslint-disable no-unused-vars */
// src/components/RateTable.jsx
import { motion } from "framer-motion";
import { memo, useMemo } from "react";

const ConfidenceBadge = ({ level }) => {
  if (!level) return <span className="text-xs text-gray-400">-</span>;

  const styles =
    level === "high"
      ? "bg-green-100 text-green-800"
      : level === "medium"
      ? "bg-yellow-100 text-yellow-800"
      : "bg-gray-100 text-gray-800";

  const label =
    level === "high" ? "Alta Confiança" : level === "medium" ? "Média Confiança" : "Baixa Confiança";

  return (
    <span className={`text-xs px-2 py-1 rounded-full ${styles}`}>
      {label}
    </span>
  );
};

const TableHeaderCell = ({ children }) => (
  <th
    scope="col"
    className="px-6 py-3 text-left text-sm font-semibold"
  >
    {children}
  </th>
);

const RateTable = memo(({ rates, currencies, formatDate, isPremium }) => {
  // Free users veem só 3 dias
  const displayedRates = useMemo(
    () => (isPremium ? rates.slice(0, 31) : rates.slice(0, 3)),
    [rates, isPremium]
  );

  return (
    <div className="overflow-x-auto rounded-xl border border-slate-200 shadow-sm">
      <table className="min-w-full border-collapse">
        {/* Cabeçalho */}
        <thead className="bg-gradient-to-r from-blue-600 to-purple-600 text-white">
          <tr>
            <TableHeaderCell>Data</TableHeaderCell>
            {currencies.flatMap((currency) => [
              <TableHeaderCell key={`header-${currency.code}-buy`}>
                <div className="flex items-center space-x-2">
                  <span role="img" aria-label={`${currency.code} flag`}>
                    {currency.flag}
                  </span>
                  <span>{currency.code} Compra</span>
                </div>
              </TableHeaderCell>,
              <TableHeaderCell key={`header-${currency.code}-sell`}>
                <div className="flex items-center space-x-2">
                  <span role="img" aria-label={`${currency.code} flag`}>
                    {currency.flag}
                  </span>
                  <span>{currency.code} Venda</span>
                </div>
              </TableHeaderCell>,
            ])}
            <TableHeaderCell>Confiança</TableHeaderCell>
          </tr>
        </thead>

        {/* Corpo */}
        <tbody className="divide-y divide-slate-200 bg-white">
          {displayedRates.map((rate, rateIndex) => (
            <motion.tr
              key={rate._id || rate.id || `rate-${rateIndex}`}
              className="hover:bg-slate-50 transition-colors duration-200"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ duration: 0.2 }}
            >
              <td className="px-6 py-4 text-sm font-medium text-slate-700">
                {formatDate(rate.date, "short")}
              </td>

              {currencies.flatMap((currency, currencyIndex) => {
                const buyValue = rate[`${currency.code}Buy`];
                const sellValue = rate[`${currency.code}Sell`];

                return [
                  <td
                    key={`${rate._id || rate.id || rateIndex}-${currency.code}-buy-${currencyIndex}`}
                    className="px-6 py-4 text-sm text-slate-600"
                  >
                    {typeof buyValue === "number" ? buyValue.toLocaleString() : "-"}
                  </td>,
                  <td
                    key={`${rate._id || rate.id || rateIndex}-${currency.code}-sell-${currencyIndex}`}
                    className="px-6 py-4 text-sm font-medium text-slate-900"
                  >
                    {typeof sellValue === "number" ? sellValue.toLocaleString() : "-"}
                  </td>,
                ];
              })}

              <td className="px-6 py-4">
                <ConfidenceBadge level={rate.confidence} />
              </td>
            </motion.tr>
          ))}
        </tbody>
      </table>
    </div>
  );
});

export default RateTable;
