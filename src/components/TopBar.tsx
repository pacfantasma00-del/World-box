import React from 'react';
import { GameEngine } from '../game/engine';
import { sounds } from '../game/sound';

interface TopBarProps {
  engine: GameEngine;
  onOpenWorldGen: () => void;
  onOpenKingdoms: () => void;
  onOpenLaws: () => void;
  onOpenChronicle: () => void;
  onOpenPix: () => void;
  onOpenDownload: () => void;
  onOpenAstroMatrix: () => void;
  isMuted: boolean;
  onToggleMute: () => void;
  onSpeedChange: (speed: number) => void;
}

export const TopBar: React.FC<TopBarProps> = ({
  engine,
  onOpenWorldGen,
  onOpenKingdoms,
  onOpenLaws,
  onOpenChronicle,
  onOpenPix,
  onOpenDownload,
  onOpenAstroMatrix,
  isMuted,
  onToggleMute,
  onSpeedChange,
}) => {
  const speeds = [
    { label: '⏸', speed: 0, title: 'Pause' },
    { label: '1x', speed: 1, title: 'Normal Speed' },
    { label: '2x', speed: 2, title: 'Double Speed' },
    { label: '5x', speed: 5, title: 'Hyper Speed' },
  ];

  const totalUnits = engine.units.length;
  const totalKingdoms = engine.kingdoms.length;

  let activeWars = 0;
  for (let i = 0; i < engine.kingdoms.length; i++) {
    for (let j = i + 1; j < engine.kingdoms.length; j++) {
      if (engine.kingdoms[i].relations[engine.kingdoms[j].id] === 'war') {
        activeWars++;
      }
    }
  }

  const month = (Math.floor(engine.tickCount / 5) % 12) + 1;

  // Day / Night cycle status
  const tod = engine.timeOfDay;
  const timeIcon = tod < 0.2 ? '🌅 Alvorada' : tod < 0.5 ? '☀️ Dia' : tod < 0.7 ? '🌇 Poente' : '🌙 Noite';

  return (
    <header className="absolute top-3 left-1/2 -translate-x-1/2 w-[95%] max-w-6xl z-20 flex items-center justify-between gap-4 px-4 py-2 bg-slate-900/90 backdrop-blur-md border border-slate-700/80 rounded-2xl shadow-xl">
      {/* Brand & World Era */}
      <div className="flex items-center gap-3">
        <div className="w-8 h-8 rounded-lg bg-gradient-to-tr from-amber-600 to-yellow-400 flex items-center justify-center text-lg shadow-md">
          👑
        </div>
        <div>
          <h1 className="text-sm font-bold tracking-tight text-white font-medieval flex items-center gap-2">
            WorldBox <span className="text-[10px] text-amber-400 font-sans font-normal uppercase tracking-wider">God Sandbox</span>
          </h1>
          <div className="text-[11px] text-slate-400 font-mono flex items-center gap-2">
            <span>Ano {engine.gameYear} · Mês {month}</span>
            <span>·</span>
            <span className="text-slate-300 font-medium">{timeIcon}</span>
          </div>
        </div>
      </div>

      {/* World Telemetry Counters */}
      <div className="hidden md:flex items-center gap-3 text-xs font-mono text-slate-300">
        <div className="flex items-center gap-1.5 bg-slate-950/70 border border-slate-800 px-2.5 py-1 rounded-lg">
          <span className="text-slate-400">Civilização:</span>
          <span className="text-white font-bold">{totalUnits}</span>
        </div>
        <button
          onClick={onOpenKingdoms}
          className="flex items-center gap-1.5 bg-slate-950/70 hover:bg-slate-800 border border-slate-800 px-2.5 py-1 rounded-lg transition-colors cursor-pointer"
        >
          <span className="text-slate-400">Reinos:</span>
          <span className="text-amber-400 font-bold">{totalKingdoms}</span>
        </button>
        {activeWars > 0 && (
          <div className="flex items-center gap-1.5 bg-red-950/50 border border-red-800/60 px-2.5 py-1 rounded-lg text-red-400 font-bold">
            <span>⚔️</span>
            <span>{activeWars} Guerras</span>
          </div>
        )}
      </div>

      {/* Controls & Modals */}
      <div className="flex items-center gap-1.5">
        {/* Speed Bar */}
        <div className="flex items-center bg-slate-950/80 border border-slate-800 rounded-xl p-0.5">
          {speeds.map((s) => (
            <button
              key={s.speed}
              onClick={() => {
                engine.speed = s.speed;
                onSpeedChange(s.speed);
                sounds.playClick();
              }}
              title={s.title}
              className={`px-2 py-1 rounded-lg text-xs font-mono font-bold transition-colors cursor-pointer ${
                engine.speed === s.speed
                  ? 'bg-amber-500 text-slate-950 shadow-sm'
                  : 'text-slate-400 hover:text-white hover:bg-slate-800'
              }`}
            >
              {s.label}
            </button>
          ))}
        </div>

        {/* Chronicle Button */}
        <button
          onClick={onOpenChronicle}
          title="Gazeta do Mundo (Eventos e História)"
          className="px-2.5 py-1.5 bg-slate-800/80 hover:bg-slate-700 text-slate-200 border border-slate-700 rounded-xl text-xs font-medium flex items-center gap-1 transition-colors cursor-pointer"
        >
          <span>📜</span>
          <span className="hidden sm:inline">Gazeta</span>
        </button>

        {/* Kingdoms Button */}
        <button
          onClick={onOpenKingdoms}
          title="Reinos & Diplomacia"
          className="px-2.5 py-1.5 bg-slate-800/80 hover:bg-slate-700 text-slate-200 border border-slate-700 rounded-xl text-xs font-medium flex items-center gap-1 transition-colors cursor-pointer"
        >
          <span>🏰</span>
          <span className="hidden sm:inline">Reinos</span>
        </button>

        {/* World Gen Button */}
        <button
          onClick={onOpenWorldGen}
          title="Gerar Novo Mundo"
          className="px-2.5 py-1.5 bg-slate-800/80 hover:bg-slate-700 text-slate-200 border border-slate-700 rounded-xl text-xs font-medium flex items-center gap-1 transition-colors cursor-pointer"
        >
          <span>🗺️</span>
          <span className="hidden sm:inline">Mundo</span>
        </button>

        {/* Laws Button */}
        <button
          onClick={onOpenLaws}
          title="Leis Mundiais"
          className="px-2.5 py-1.5 bg-slate-800/80 hover:bg-slate-700 text-slate-200 border border-slate-700 rounded-xl text-xs font-medium flex items-center gap-1 transition-colors cursor-pointer"
        >
          <span>⚖️</span>
          <span className="hidden sm:inline">Leis</span>
        </button>

        {/* Astro Matrix Core Button */}
        <button
          onClick={onOpenAstroMatrix}
          title="ASTRO CORE MATRIX — Orquestrador & Memória Persistente"
          className="px-2.5 py-1.5 bg-cyan-500/20 hover:bg-cyan-500/30 text-cyan-300 border border-cyan-500/40 rounded-xl text-xs font-bold flex items-center gap-1 transition-all cursor-pointer shadow-[0_0_10px_rgba(6,182,212,0.2)]"
        >
          <span>🌌</span>
          <span className="hidden sm:inline">Astro Matrix</span>
        </button>

        {/* Pix Nexus Pag Button */}
        <button
          onClick={onOpenPix}
          title="Apoio Divino via Pix (Nexus Pag)"
          className="px-2.5 py-1.5 bg-emerald-500/20 hover:bg-emerald-500/30 text-emerald-300 border border-emerald-500/40 rounded-xl text-xs font-bold flex items-center gap-1 transition-all cursor-pointer"
        >
          <span>💠</span>
          <span>Pix</span>
        </button>

        {/* Download App Button */}
        <button
          onClick={onOpenDownload}
          title="Download & Instalar Aplicativo (PWA / Backup)"
          className="px-2.5 py-1.5 bg-amber-500/20 hover:bg-amber-500/30 text-amber-300 border border-amber-500/40 rounded-xl text-xs font-bold flex items-center gap-1 transition-all cursor-pointer"
        >
          <span>📥</span>
          <span className="hidden sm:inline">Baixar App</span>
        </button>

        {/* Mute Button */}
        <button
          onClick={onToggleMute}
          title={isMuted ? 'Ativar Efeitos Sonoros' : 'Silenciar'}
          className="p-1.5 bg-slate-800/80 hover:bg-slate-700 text-slate-300 border border-slate-700 rounded-xl text-xs transition-colors cursor-pointer"
        >
          {isMuted ? '🔇' : '🔊'}
        </button>
      </div>
    </header>
  );
};
