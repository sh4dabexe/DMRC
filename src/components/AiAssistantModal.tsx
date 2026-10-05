'use client';

import React, { useState } from 'react';
import { Sparkles, Send, Bot, User, ArrowRight, X, AlertCircle } from 'lucide-react';
import { RouteQueryResult } from '@/engine/types';

interface AiAssistantModalProps {
  isOpen: boolean;
  onClose: () => void;
  onApplyRoute: (fromId: string, toId: string) => void;
}

export const AiAssistantModal: React.FC<AiAssistantModalProps> = ({
  isOpen,
  onClose,
  onApplyRoute
}) => {
  const [prompt, setPrompt] = useState('');
  const [loading, setLoading] = useState(false);
  const [response, setResponse] = useState<any>(null);

  if (!isOpen) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!prompt.trim() || loading) return;

    setLoading(true);
    setResponse(null);

    try {
      const res = await fetch('/api/assistant', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ prompt: prompt.trim() })
      });
      const data = await res.json();
      setResponse(data);
    } catch (err) {
      setResponse({ error: 'Failed to communicate with assistant.' });
    } finally {
      setLoading(false);
    }
  };

  const samplePrompts = [
    "Welcome se Dwarka jana hai, change kam karna hai",
    "Fastest route from Kashmere Gate to Millennium City Gurugram",
    "Rajiv Chowk to Noida Sector 52 direct metro"
  ];

  return (
    <div className="fixed inset-0 z-50 bg-black/40 backdrop-blur-xs flex items-center justify-center p-4">
      <div className="bg-white rounded-3xl border border-[#E4E5E7] shadow-xl max-w-lg w-full p-6 space-y-4 animate-in fade-in zoom-in-95 duration-200">
        <div className="flex items-center justify-between border-b border-neutral-100 pb-3">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-lg bg-gradient-to-tr from-purple-600 to-indigo-600 text-white flex items-center justify-center shadow-sm">
              <Sparkles className="w-4 h-4" />
            </div>
            <div>
              <h3 className="font-bold text-base text-neutral-900">AI Journey Assistant</h3>
              <p className="text-xs text-neutral-500">Natural-language & Hinglish route interpretation</p>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="p-1 rounded-lg hover:bg-neutral-100 text-neutral-400 hover:text-black transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Input Form */}
        <form onSubmit={handleSubmit} className="space-y-3">
          <div className="relative">
            <textarea
              rows={2}
              value={prompt}
              onChange={(e) => setPrompt(e.target.value)}
              placeholder="e.g. Welcome se Dwarka jana hai, change kam..."
              className="w-full p-3 text-xs font-medium bg-neutral-50 border border-neutral-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-black resize-none"
            />
          </div>

          <div className="flex items-center justify-between">
            <span className="text-[10px] text-neutral-400">English or Hinglish supported</span>
            <button
              type="submit"
              disabled={loading || !prompt.trim()}
              className="px-4 py-2 bg-neutral-900 hover:bg-black text-white text-xs font-bold rounded-xl disabled:opacity-50 flex items-center gap-1.5 transition-all shadow-xs"
            >
              {loading ? (
                <div className="w-3.5 h-3.5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
              ) : (
                <>
                  <span>Ask Assistant</span>
                  <Send className="w-3 h-3" />
                </>
              )}
            </button>
          </div>
        </form>

        {/* Sample queries */}
        <div className="space-y-1.5 pt-1">
          <span className="text-[10px] font-bold uppercase tracking-wider text-neutral-400">
            Suggested Prompts
          </span>
          <div className="flex flex-col gap-1.5">
            {samplePrompts.map((sp, idx) => (
              <button
                key={idx}
                type="button"
                onClick={() => setPrompt(sp)}
                className="text-left text-xs bg-neutral-50 hover:bg-neutral-100 text-neutral-700 p-2 rounded-lg transition-all"
              >
                "{sp}"
              </button>
            ))}
          </div>
        </div>

        {/* Result Area */}
        {response && (
          <div className="pt-2 border-t border-neutral-100">
            {response.recognized ? (
              <div className="p-3.5 bg-purple-50/70 border border-purple-200 rounded-2xl space-y-2">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2 font-bold text-xs text-purple-950">
                    <span>{response.from.name}</span>
                    <ArrowRight className="w-3.5 h-3.5 text-purple-400" />
                    <span>{response.to.name}</span>
                  </div>
                  <span className="text-[10px] font-semibold bg-purple-200/80 text-purple-900 px-2 py-0.5 rounded-full capitalize">
                    {response.preference.replace('_', ' ')}
                  </span>
                </div>

                <p className="text-xs text-purple-900 font-medium">
                  {response.explanation}
                </p>

                <button
                  type="button"
                  onClick={() => {
                    onApplyRoute(response.from.id, response.to.id);
                    onClose();
                  }}
                  className="w-full mt-1 py-2 bg-purple-950 hover:bg-black text-white text-xs font-bold rounded-xl transition-all shadow-xs"
                >
                  Load Route in Planner & Map →
                </button>
              </div>
            ) : (
              <div className="p-3 bg-neutral-50 border border-neutral-200 rounded-2xl text-xs text-neutral-700 flex items-start gap-2">
                <AlertCircle className="w-4 h-4 text-neutral-500 shrink-0 mt-0.5" />
                <p>{response.message || response.error}</p>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
};
