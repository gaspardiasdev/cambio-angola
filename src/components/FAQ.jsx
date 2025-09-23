/* eslint-disable no-unused-vars */
import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { ChevronDown, ChevronUp } from "lucide-react";

const defaultFaqs = [
  {
    q: "Por que devo confiar nas taxas daqui?",
    a: "As taxas são atualizadas diariamente com base em fontes verificadas do mercado paralelo de Luanda.",
  },
  {
    q: "Qual é a diferença do Premium?",
    a: "No Premium recebes 2–3 alertas diários direto no WhatsApp, com as melhores oportunidades de compra e venda.",
  },
  {
    q: "Vocês vendem ou compram divisas?",
    a: "Não. Apenas fornecemos informação confiável e atualizada para que tomes decisões seguras.",
  },
];

export default function FAQ({ faqs = defaultFaqs }) {
  const [open, setOpen] = useState(null);

  return (
    <section className="relative z-10 bg-gradient-to-br from-slate-50 via-blue-50/50 to-purple-50/50 py-12 px-6 rounded-2xl shadow-inner">
      <div className="max-w-3xl mx-auto space-y-6">
        {/* Título */}
        <div className="text-center mb-8">
          <h2 className="text-3xl font-bold text-slate-800">❓ Perguntas Frequentes</h2>
          <p className="text-slate-500 mt-2">
            Tens dúvidas? Aqui estão as respostas mais comuns.
          </p>
        </div>

        {/* Lista de FAQs */}
        {faqs.map((f, idx) => (
          <motion.div
            key={idx}
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: idx * 0.05 }}
            className="bg-white rounded-xl shadow-sm border border-slate-200 overflow-hidden hover:shadow-md transition-all"
          >
            <button
              className="w-full flex justify-between items-center p-5 font-semibold text-left text-slate-700"
              onClick={() => setOpen(open === idx ? null : idx)}
            >
              {f.q}
              {open === idx ? (
                <ChevronUp className="w-5 h-5 text-blue-600" />
              ) : (
                <ChevronDown className="w-5 h-5 text-slate-400" />
              )}
            </button>
            <AnimatePresence>
              {open === idx && (
                <motion.div
                  initial={{ opacity: 0, height: 0 }}
                  animate={{ opacity: 1, height: "auto" }}
                  exit={{ opacity: 0, height: 0 }}
                  transition={{ duration: 0.3 }}
                  className="px-5 pb-5 text-sm text-slate-600 border-t"
                >
                  {f.a}
                </motion.div>
              )}
            </AnimatePresence>
          </motion.div>
        ))}
      </div>
    </section>
  );
}
