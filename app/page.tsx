"use client";

import { useState } from "react";
import ReactMarkdown from "react-markdown";
import { useStreamingExplain } from "../hooks/useStreamingExplain";

export default function Home() {
  const [code, setCode] = useState("");
  const [isELI5, setIsELI5] = useState(false);
  const { output, loading, explainCode } = useStreamingExplain();

  const handleExplain = () => {
    explainCode(code, isELI5);
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 to-blue-50 p-6">
      <div className="max-w-4xl mx-auto">
        <div className="text-center mb-8">
          <h1 className="text-4xl font-bold bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent mb-2">
            AI Feature Explainer
          </h1>
          <p className="text-slate-600">Verstaan je code in enkele seconden</p>
        </div>

        <div className="bg-white rounded-2xl shadow-xl border border-slate-200/60 p-8 mb-6">
          <textarea
            className="w-full h-48 border-2 border-slate-200 focus:border-blue-400 focus:ring-4 focus:ring-blue-100 p-4 rounded-xl mb-6 font-mono text-sm resize-none transition-all duration-200 placeholder:text-slate-400"
            placeholder="Plak hier je code..."
            value={code}
            onChange={(e) => setCode(e.target.value)}
          />

          <div className="flex gap-3 items-center">
            <button
              onClick={handleExplain}
              disabled={loading || !code.trim()}
              className="bg-gradient-to-r from-blue-600 to-blue-700 hover:from-blue-700 hover:to-blue-800 text-white px-6 py-3 rounded-xl font-medium shadow-lg hover:shadow-xl disabled:from-gray-400 disabled:to-gray-500 disabled:cursor-not-allowed transition-all duration-200 transform hover:scale-105 disabled:hover:scale-100"
            >
              {loading ? "Analyseren..." : "✨ Leg uit"}
            </button>

            <button
              onClick={() => setIsELI5(!isELI5)}
              className={`px-6 py-3 rounded-xl font-medium border-2 transition-all duration-200 transform hover:scale-105 ${
                isELI5
                  ? "bg-gradient-to-r from-green-500 to-green-600 text-white border-green-500 shadow-lg"
                  : "bg-white text-slate-700 border-slate-300 hover:border-slate-400 hover:bg-slate-50 shadow-sm"
              }`}
            >
              {isELI5 ? "✓ " : ""}🧒 ELI5
            </button>
          </div>
        </div>

        {(output || loading) && (
          <div className="bg-white rounded-2xl shadow-xl border border-slate-200/60 p-8">
            <h2 className="text-lg font-semibold text-slate-800 mb-4 flex items-center gap-2">
              <span className="w-2 h-2 bg-blue-500 rounded-full"></span>
              Uitleg
            </h2>
            <div className="prose prose-slate max-w-none">
              <div className="whitespace-pre-wrap font-mono text-sm leading-relaxed text-slate-700 bg-slate-50 p-6 rounded-xl border">
                {(output && <ReactMarkdown>{output}</ReactMarkdown>) ||
                  (loading && (
                    <div className="flex items-center gap-2 text-blue-600">
                      <div className="animate-spin w-4 h-4 border-2 border-blue-600 border-t-transparent rounded-full"></div>
                      AI denkt na...
                    </div>
                  ))}
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
