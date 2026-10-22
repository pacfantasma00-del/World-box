import React, { useState } from 'react';
import { Unit } from '../game/types';
import { TRAITS_DATA, MOOD_DETAILS } from '../game/constants';
import { sounds } from '../game/sound';

interface UnitInspectorProps {
  unit: Unit | null;
  onClose: () => void;
  onIntervene: (action: 'lightning' | 'bless' | 'infect' | 'coffee' | 'kill') => void;
}

export const UnitInspector: React.FC<UnitInspectorProps> = ({
  unit,
  onClose,
  onIntervene,
}) => {
  const [isLoadingMind, setIsLoadingMind] = useState<boolean>(false);

  if (!unit) return null;

  const hpPercent = Math.max(0, Math.min(100, Math.round((unit.hp / unit.maxHp) * 100)));
  const xpPercent = Math.max(0, Math.min(100, Math.round((unit.xp / unit.maxXp) * 100)));
  const mood = MOOD_DETAILS[unit.mood] || MOOD_DETAILS.content;

  const handleConsultMind = async () => {
    setIsLoadingMind(true);
    sounds.playClick();
    try {
      const res = await fetch('/api/unit-mind-monologue', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: unit.name,
          race: unit.race || unit.type,
          profession: unit.profession,
          level: unit.level,
          age: unit.age,
          kills: unit.kills,
          mood: unit.mood,
          weapon: unit.weapon,
          traits: unit.traits,
        }),
      });
      const data = await res.json();
      if (data?.thought) {
        unit.thought = data.thought;
        sounds.playDivine();
      }
    } catch (err) {
      console.error('Error fetching mind thought:', err);
    } finally {
      setIsLoadingMind(false);
    }
  };

  return (
    <div className="absolute top-16 left-4 w-84 bg-slate-900/95 backdrop-blur-md border border-slate-700/80 rounded-2xl p-4 shadow-2xl z-30 flex flex-col gap-3 max-h-[85vh] overflow-y-auto">
      {/* Header */}
      <div className="flex items-center justify-between border-b border-slate-800 pb-2">
        <div className="flex items-center gap-2.5">
          <div className="w-11 h-11 rounded-xl bg-slate-800 border border-slate-700 flex items-center justify-center text-2xl shadow-inner relative">
            {unit.type === 'boat'
              ? '⛵'
              : unit.type === 'dragon'
                ? '🐉'
                : unit.type === 'zombie'
                  ? '🧟'
                  : unit.type === 'sheep'
                    ? '🐑'
                    : unit.type === 'wolf'
                      ? '🐺'
                      : unit.race === 'elf'
                        ? '🧝'
                        : unit.race === 'dwarf'
                          ? '🧔'
                          : unit.race === 'orc'
                            ? '👹'
                            : '🧑'}
            <div className="absolute -bottom-1 -right-1 bg-amber-500 text-slate-950 text-[9px] font-bold px-1 rounded-md">
              L{unit.level}
            </div>
          </div>
          <div>
            <h3 className="text-sm font-bold text-white font-medieval flex items-center gap-1.5 leading-tight">
              <span>{unit.name}</span>
            </h3>
            <div className="flex items-center gap-1.5 mt-0.5 text-xs">
              <span className="text-amber-400 capitalize font-medium">
                {unit.profession} {unit.race ? `· ${unit.race}` : ''}
              </span>
              <span
                className="px-1.5 py-0.2 rounded text-[10px] font-medium flex items-center gap-1"
                style={{ backgroundColor: mood.color + '22', color: mood.color }}
              >
                <span>{mood.icon}</span>
                <span>{mood.name}</span>
              </span>
            </div>
          </div>
        </div>
        <button
          onClick={onClose}
          className="w-7 h-7 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-400 hover:text-white flex items-center justify-center text-sm font-bold transition-colors"
        >
          ✕
        </button>
      </div>

      {/* Autonomous Cognitive Thought Bubble */}
      <div className="bg-slate-950/80 border border-slate-800 rounded-xl p-3 flex flex-col gap-1.5 shadow-sm">
        <div className="flex items-center justify-between text-[11px] font-semibold text-slate-400 uppercase tracking-wider">
          <span className="flex items-center gap-1 text-sky-400">
            <span>💭</span> Fluxo de Pensamento
          </span>
          <button
            onClick={handleConsultMind}
            disabled={isLoadingMind}
            className="text-[10px] text-amber-400 hover:text-amber-300 font-normal underline cursor-pointer disabled:opacity-50"
          >
            {isLoadingMind ? 'Meditando...' : 'Sondar Mente (Gemini)'}
          </button>
        </div>
        <p className="text-xs text-slate-200 italic leading-relaxed font-sans bg-slate-900/60 p-2 rounded-lg border border-slate-800/60">
          "{unit.thought || 'Em comunhão com a natureza do mundo...'}"
        </p>
      </div>

      {/* Vital Stats: HP & XP */}
      <div className="flex flex-col gap-2">
        {/* HP */}
        <div className="flex flex-col gap-1">
          <div className="flex items-center justify-between text-xs font-mono">
            <span className="text-slate-400">Health</span>
            <span className="text-white font-bold">
              {Math.round(unit.hp)} / {Math.round(unit.maxHp)}
            </span>
          </div>
          <div className="w-full h-2 bg-slate-950 rounded-full overflow-hidden border border-slate-800">
            <div
              className={`h-full transition-all duration-300 ${
                hpPercent > 50 ? 'bg-emerald-500' : hpPercent > 20 ? 'bg-amber-500' : 'bg-red-500'
              }`}
              style={{ width: `${hpPercent}%` }}
            />
          </div>
        </div>

        {/* XP */}
        <div className="flex flex-col gap-1">
          <div className="flex items-center justify-between text-xs font-mono">
            <span className="text-slate-400">Experience (Lvl {unit.level})</span>
            <span className="text-amber-400 font-bold">
              {unit.xp} / {unit.maxXp} XP
            </span>
          </div>
          <div className="w-full h-1.5 bg-slate-950 rounded-full overflow-hidden border border-slate-800">
            <div
              className="h-full bg-gradient-to-r from-amber-500 to-yellow-400 transition-all duration-300"
              style={{ width: `${xpPercent}%` }}
            />
          </div>
        </div>
      </div>

      {/* Attributes Grid */}
      <div className="grid grid-cols-2 gap-2 text-xs font-mono bg-slate-950/60 p-2.5 rounded-xl border border-slate-800">
        <div>
          <span className="text-slate-500">Damage:</span>{' '}
          <span className="text-slate-200 font-bold">⚔️ {Math.round(unit.damage)}</span>
        </div>
        <div>
          <span className="text-slate-500">Speed:</span>{' '}
          <span className="text-slate-200 font-bold">⚡ {unit.speed.toFixed(1)}</span>
        </div>
        <div>
          <span className="text-slate-500">Age:</span>{' '}
          <span className="text-slate-200 font-bold">⏳ {unit.age} yrs</span>
        </div>
        <div>
          <span className="text-slate-500">Kills:</span>{' '}
          <span className="text-red-400 font-bold">💀 {unit.kills}</span>
        </div>
      </div>

      {/* Equipment */}
      <div className="flex flex-col gap-1 text-xs bg-slate-800/40 p-2 rounded-lg border border-slate-800">
        <div className="flex justify-between">
          <span className="text-slate-400">Weapon:</span>
          <span className="text-amber-300 font-medium">{unit.weapon}</span>
        </div>
        <div className="flex justify-between">
          <span className="text-slate-400">Armor:</span>
          <span className="text-slate-300 font-medium">{unit.armor}</span>
        </div>
      </div>

      {/* Traits List */}
      <div className="flex flex-col gap-1.5">
        <div className="text-[11px] font-semibold text-slate-400 uppercase tracking-wider">
          Personality & Traits ({unit.traits.length})
        </div>
        <div className="flex flex-wrap gap-1.5">
          {unit.traits.length === 0 ? (
            <span className="text-xs text-slate-500 italic">No special traits yet.</span>
          ) : (
            unit.traits.map((traitId) => {
              const trait = TRAITS_DATA[traitId];
              if (!trait) return null;
              return (
                <div
                  key={traitId}
                  title={`${trait.name}: ${trait.description}`}
                  className="flex items-center gap-1 bg-slate-800/90 hover:bg-slate-750 border border-slate-700 px-2 py-0.5 rounded-md text-xs cursor-help transition-colors"
                >
                  <span>{trait.icon}</span>
                  <span className="text-slate-200 font-medium">{trait.name}</span>
                </div>
              );
            })
          )}
        </div>
      </div>

      {/* Divine Intervention Controls */}
      <div className="border-t border-slate-800 pt-2 flex flex-col gap-1.5">
        <div className="text-[11px] font-semibold text-slate-400 uppercase tracking-wider">
          Divine Interventions
        </div>
        <div className="grid grid-cols-2 gap-1.5">
          <button
            onClick={() => onIntervene('bless')}
            className="flex items-center justify-center gap-1.5 py-1.5 px-2 bg-yellow-500/20 hover:bg-yellow-500/30 text-yellow-300 border border-yellow-500/40 rounded-lg text-xs font-medium transition-colors cursor-pointer"
          >
            <span>🕊️</span> Bless & Heal
          </button>
          <button
            onClick={() => onIntervene('coffee')}
            className="flex items-center justify-center gap-1.5 py-1.5 px-2 bg-amber-500/20 hover:bg-amber-500/30 text-amber-300 border border-amber-500/40 rounded-lg text-xs font-medium transition-colors cursor-pointer"
          >
            <span>☕</span> Supercharge
          </button>
          <button
            onClick={() => onIntervene('lightning')}
            className="flex items-center justify-center gap-1.5 py-1.5 px-2 bg-sky-500/20 hover:bg-sky-500/30 text-sky-300 border border-sky-500/40 rounded-lg text-xs font-medium transition-colors cursor-pointer"
          >
            <span>⚡</span> Smite Lightning
          </button>
          <button
            onClick={() => onIntervene('infect')}
            className="flex items-center justify-center gap-1.5 py-1.5 px-2 bg-lime-500/20 hover:bg-lime-500/30 text-lime-300 border border-lime-500/40 rounded-lg text-xs font-medium transition-colors cursor-pointer"
          >
            <span>☣️</span> Zombie Virus
          </button>
        </div>
      </div>
    </div>
  );
};
