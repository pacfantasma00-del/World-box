import React, { useState } from 'react';
import { GameEngine } from '../game/engine';
import { ChronicleEvent } from '../game/types';
import { sounds } from '../game/sound';

interface ChronicleModalProps {
  engine: GameEngine;
  onClose: () => void;
}

export const ChronicleModal: React.FC<ChronicleModalProps> = ({
  engine,
  onClose,
}) => {
  const [filter, setFilter] = useState<string>('all');
  const [epicLore, setEpicLore] = useState<string | null>(null);
  const [isGeneratingLore, setIsGeneratingLore] = useState<boolean>(false);

  const events = engine.chronicle.filter((ev) => filter === 'all' || ev.type === filter);

  const handleGenerateLore = async () => {
    setIsGeneratingLore(true);
    sounds.playClick();
    try {
      const topKingdom = engine.kingdoms[0];
      const res = await fetch('/api/generate-lore', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          kingdomName: topKingdom?.name || 'WorldBox Sandbox',
          race: topKingdom?.race || 'ancient civilization',
          year: engine.gameYear,
          warsCount: engine.kingdoms.length,
          kingName: 'the High Monarchs',
        }),
      });
      const data = await res.json();
      if (data?.lore) {
        setEpicLore(data.lore);
        sounds.playDivine();
      }
    } catch (err) {
      console.error('Error generating chronicle lore:', err);
    } finally {
      setIsGeneratingLore(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 backdrop-blur-sm p-4">
      <div className="w-full max-w-2xl bg-slate-900 border border-slate-700/80 rounded-2xl p-6 shadow-2xl flex flex-col gap-4 max-h-[85vh] overflow-hidden">
        {/* Header */}
        <div className="flex items-center justify-between border-b border-slate-800 pb-3">
          <div className="flex items-center gap-2.5">
            <span className="text-2xl">📜</span>
            <div>
              <h2 className="text-lg font-bold text-white font-medieval">
                Gazeta do Mundo & Crônicas Históricas
              </h2>
              <p className="text-xs text-slate-400">
                O registro vivo de guerras, ascensão de eras, feitos heroicos e cataclismos divinos.
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="w-8 h-8 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300 hover:text-white flex items-center justify-center font-bold transition-colors"
          >
            ✕
          </button>
        </div>

        {/* Filter bar and AI Generator Button */}
        <div className="flex items-center justify-between gap-2 flex-wrap">
          <div className="flex items-center gap-1 bg-slate-950 p-1 rounded-xl border border-slate-800">
            {['all', 'war', 'era', 'hero', 'disaster'].map((f) => (
              <button
                key={f}
                onClick={() => setFilter(f)}
                className={`px-2.5 py-1 rounded-lg text-xs font-medium capitalize transition-colors ${
                  filter === f
                    ? 'bg-amber-500 text-slate-950 font-bold'
                    : 'text-slate-400 hover:text-white hover:bg-slate-800'
                }`}
              >
                {f}
              </button>
            ))}
          </div>

          <button
            onClick={handleGenerateLore}
            disabled={isGeneratingLore}
            className="px-3 py-1.5 bg-gradient-to-r from-amber-500 to-yellow-500 hover:from-amber-600 hover:to-yellow-600 text-slate-950 rounded-xl text-xs font-bold transition-all shadow-md shadow-amber-500/20 flex items-center gap-1.5 cursor-pointer disabled:opacity-50"
          >
            <span>✨</span>
            <span>{isGeneratingLore ? 'Compondo Épico...' : 'Compilar Crônica Épica (Gemini)'}</span>
          </button>
        </div>

        {/* AI Epic Lore Highlight if present */}
        {epicLore && (
          <div className="bg-gradient-to-br from-amber-950/30 to-slate-950 border border-amber-500/40 rounded-xl p-4 flex flex-col gap-2">
            <div className="flex items-center justify-between text-xs font-medieval text-amber-400 font-bold">
              <span>Crônica dos Bardos Divinos</span>
              <button
                onClick={() => setEpicLore(null)}
                className="text-slate-500 hover:text-slate-300 text-[11px]"
              >
                Ocultar
              </button>
            </div>
            <p className="text-xs text-slate-200 leading-relaxed italic whitespace-pre-line font-serif">
              {epicLore}
            </p>
          </div>
        )}

        {/* Event Timeline List */}
        <div className="flex-1 overflow-y-auto flex flex-col gap-2 pr-1">
          {events.length === 0 ? (
            <div className="text-center py-12 text-slate-500 text-xs italic">
              Nenhum evento registrado nesta categoria ainda.
            </div>
          ) : (
            events.map((ev) => (
              <div
                key={ev.id}
                className="bg-slate-950/60 border border-slate-800 rounded-xl p-3 flex items-start gap-3 hover:border-slate-700 transition-colors"
              >
                <div className="w-8 h-8 rounded-lg bg-slate-900 border border-slate-800 flex items-center justify-center text-lg shrink-0">
                  {ev.icon}
                </div>
                <div className="flex-1 flex flex-col gap-0.5">
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-semibold text-slate-200">{ev.text}</span>
                    <span className="text-[10px] text-slate-500 font-mono">
                      Ano {ev.year} · Mês {ev.month}
                    </span>
                  </div>
                </div>
              </div>
            ))
          )}
        </div>
      </div>
    </div>
  );
};
