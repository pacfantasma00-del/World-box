import React from 'react';
import { GameEngine } from '../game/engine';
import { Kingdom } from '../game/types';
import { sounds } from '../game/sound';

interface KingdomsModalProps {
  engine: GameEngine;
  onClose: () => void;
  onSelectKingdom: (kingdom: Kingdom) => void;
}

export const KingdomsModal: React.FC<KingdomsModalProps> = ({
  engine,
  onClose,
  onSelectKingdom,
}) => {
  const kingdoms = engine.kingdoms;

  const handleDeclareWar = (k1: Kingdom, k2: Kingdom) => {
    k1.relations[k2.id] = 'war';
    k2.relations[k1.id] = 'war';
    sounds.playSword();
  };

  const handleSignPeace = (k1: Kingdom, k2: Kingdom) => {
    k1.relations[k2.id] = 'peace';
    k2.relations[k1.id] = 'peace';
    sounds.playDivine();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 backdrop-blur-sm p-4">
      <div className="w-full max-w-2xl bg-slate-900 border border-slate-700/80 rounded-2xl p-6 shadow-2xl flex flex-col gap-4 max-h-[85vh] overflow-hidden">
        {/* Header */}
        <div className="flex items-center justify-between border-b border-slate-800 pb-3">
          <div className="flex items-center gap-2.5">
            <span className="text-2xl">🏰</span>
            <div>
              <h2 className="text-lg font-bold text-white font-medieval">
                Kingdoms & Sovereign Diplomacy
              </h2>
              <p className="text-xs text-slate-400">
                Track nations, sovereign rulers, population growth, and declare war or peace.
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

        {/* Content list */}
        <div className="flex-1 overflow-y-auto flex flex-col gap-3 pr-1">
          {kingdoms.length === 0 ? (
            <div className="text-center py-12 flex flex-col items-center gap-3">
              <span className="text-4xl">👑</span>
              <p className="text-slate-400 text-sm">
                No civilizations have established kingdoms yet.
              </p>
              <p className="text-xs text-slate-500 max-w-sm">
                Select <strong className="text-amber-400">Spawn Human</strong>,{' '}
                <strong className="text-amber-400">Elf</strong>,{' '}
                <strong className="text-amber-400">Dwarf</strong>, or{' '}
                <strong className="text-amber-400">Orc</strong> from the Civilizations tab to start!
              </p>
            </div>
          ) : (
            kingdoms.map((k) => {
              const citizens = engine.units.filter((u) => u.kingdomId === k.id);
              const villages = engine.villages.filter((v) => v.kingdomId === k.id);
              const king = engine.units.find((u) => u.id === k.kingId);
              const wars = kingdoms.filter((other) => other.id !== k.id && k.relations[other.id] === 'war');

              return (
                <div
                  key={k.id}
                  className="bg-slate-950/70 border border-slate-800 rounded-xl p-4 flex flex-col gap-3 hover:border-slate-700 transition-colors"
                >
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2.5">
                      <div
                        className="w-9 h-9 rounded-lg flex items-center justify-center text-lg border shadow-sm"
                        style={{ backgroundColor: k.color + '22', borderColor: k.color }}
                      >
                        {k.bannerSymbol}
                      </div>
                      <div>
                        <h3 className="text-sm font-bold text-white flex items-center gap-2">
                          <span style={{ color: k.color }}>{k.name}</span>
                          <span className="text-xs px-2 py-0.5 rounded bg-slate-800 text-slate-300 capitalize font-sans">
                            {k.race}
                          </span>
                          <span className="text-[11px] px-2 py-0.5 rounded bg-amber-500/20 text-amber-300 border border-amber-500/30 font-medium">
                            {k.era?.toUpperCase() || 'TRIBAL'} ERA
                          </span>
                        </h3>
                        <div className="text-xs text-slate-400 flex items-center gap-3">
                          <span>Ruler: {king ? king.name : 'Unknown Monarch'}</span>
                          <span>·</span>
                          <span>Founded: Year {k.foundedYear}</span>
                          <span>·</span>
                          <span className="text-amber-400">🪙 {k.gold || 0} Gold</span>
                        </div>
                      </div>
                    </div>

                    <div className="flex items-center gap-4 text-xs font-mono">
                      <div className="text-right">
                        <div className="text-amber-400 font-bold">{k.culture || 0} pts</div>
                        <div className="text-[10px] text-slate-500 uppercase">Culture</div>
                      </div>
                      <div className="text-right">
                        <div className="text-slate-200 font-bold">{citizens.length}</div>
                        <div className="text-[10px] text-slate-500 uppercase">Population</div>
                      </div>
                      <div className="text-right">
                        <div className="text-slate-200 font-bold">{villages.length}</div>
                        <div className="text-[10px] text-slate-500 uppercase">Villages</div>
                      </div>
                    </div>
                  </div>

                  {/* Wars / Relations list */}
                  <div className="bg-slate-900/60 rounded-lg p-2.5 flex flex-col gap-1.5 text-xs">
                    <div className="text-[11px] font-semibold text-slate-400 uppercase tracking-wider flex items-center justify-between">
                      <span>Diplomatic Stance</span>
                      {wars.length > 0 ? (
                        <span className="text-red-400 font-bold flex items-center gap-1">
                          <span>⚔️</span> At War with {wars.length} Kingdoms
                        </span>
                      ) : (
                        <span className="text-emerald-400 font-medium">🕊️ At Peace</span>
                      )}
                    </div>

                    <div className="flex flex-wrap gap-2 pt-1">
                      {kingdoms
                        .filter((other) => other.id !== k.id)
                        .map((other) => {
                          const isWar = k.relations[other.id] === 'war';
                          return (
                            <div
                              key={other.id}
                              className={`flex items-center gap-2 px-2.5 py-1 rounded-md border text-xs ${
                                isWar
                                  ? 'bg-red-950/40 border-red-800/60 text-red-300'
                                  : 'bg-slate-800/60 border-slate-700 text-slate-300'
                              }`}
                            >
                              <span>{other.bannerSymbol}</span>
                              <span className="font-medium">{other.name}</span>
                              {isWar ? (
                                <button
                                  onClick={() => handleSignPeace(k, other)}
                                  className="ml-1 text-[11px] px-1.5 py-0.5 bg-emerald-600/30 hover:bg-emerald-600/50 text-emerald-300 rounded transition-colors"
                                  title="Force Peace Pact"
                                >
                                  Make Peace
                                </button>
                              ) : (
                                <button
                                  onClick={() => handleDeclareWar(k, other)}
                                  className="ml-1 text-[11px] px-1.5 py-0.5 bg-red-600/30 hover:bg-red-600/50 text-red-300 rounded transition-colors"
                                  title="Instigate War"
                                >
                                  Declare War
                                </button>
                              )}
                            </div>
                          );
                        })}
                    </div>
                  </div>
                </div>
              );
            })
          )}
        </div>
      </div>
    </div>
  );
};
