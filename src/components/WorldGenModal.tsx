import React, { useState } from 'react';
import { WorldPreset } from '../game/worldGen';
import { sounds } from '../game/sound';

interface WorldGenModalProps {
  onClose: () => void;
  onGenerate: (preset: WorldPreset, seed: number) => void;
}

export const WorldGenModal: React.FC<WorldGenModalProps> = ({
  onClose,
  onGenerate,
}) => {
  const [selectedPreset, setSelectedPreset] = useState<WorldPreset>('continents');
  const [seed, setSeed] = useState<number>(Math.floor(Math.random() * 100000));

  const presets: { id: WorldPreset; name: string; icon: string; description: string }[] = [
    {
      id: 'continents',
      name: 'Continents',
      icon: '🌍',
      description: 'Lush natural continents surrounded by deep oceans and coastal archipelagos.',
    },
    {
      id: 'archipelago',
      name: 'Island Archipelago',
      icon: '🏝️',
      description: 'Cluster of tropical islands ideal for maritime colonization.',
    },
    {
      id: 'twin_continents',
      name: 'Twin Continents',
      icon: '🌐',
      description: 'Two massive landmasses separated by a central ocean strait.',
    },
    {
      id: 'pangaea',
      name: 'Pangaea',
      icon: '🗺️',
      description: 'A single enormous supercontinent with inner lakes and mountain chains.',
    },
    {
      id: 'volcanic',
      name: 'Volcanic Caldera',
      icon: '🌋',
      description: 'A fiery realm with central magma chambers, ash plains, and active lava.',
    },
    {
      id: 'blank',
      name: 'Blank Ocean Canvas',
      icon: '🌊',
      description: 'Pure ocean waters ready for full custom terraforming from scratch.',
    },
  ];

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 backdrop-blur-sm p-4">
      <div className="w-full max-w-lg bg-slate-900 border border-slate-700/80 rounded-2xl p-6 shadow-2xl flex flex-col gap-5">
        {/* Header */}
        <div className="flex items-center justify-between border-b border-slate-800 pb-3">
          <div className="flex items-center gap-2.5">
            <span className="text-2xl">🗺️</span>
            <div>
              <h2 className="text-lg font-bold text-white font-medieval">
                Generate New World
              </h2>
              <p className="text-xs text-slate-400">
                Choose a procedural landmass template and world seed.
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

        {/* Preset Cards */}
        <div className="grid grid-cols-2 gap-2.5">
          {presets.map((preset) => {
            const isSelected = selectedPreset === preset.id;
            return (
              <button
                key={preset.id}
                onClick={() => {
                  setSelectedPreset(preset.id);
                  sounds.playClick();
                }}
                className={`p-3 rounded-xl border text-left flex flex-col gap-1.5 transition-all ${
                  isSelected
                    ? 'bg-amber-500/15 border-amber-500 text-white shadow-md'
                    : 'bg-slate-950/60 border-slate-800 text-slate-400 hover:border-slate-700 hover:text-slate-200'
                }`}
              >
                <div className="flex items-center gap-2">
                  <span className="text-xl">{preset.icon}</span>
                  <span className="text-xs font-bold font-medieval">{preset.name}</span>
                </div>
                <p className="text-[11px] text-slate-400 leading-relaxed">
                  {preset.description}
                </p>
              </button>
            );
          })}
        </div>

        {/* Seed input */}
        <div className="flex items-center justify-between gap-3 bg-slate-950/80 p-3 rounded-xl border border-slate-800">
          <div className="flex flex-col">
            <span className="text-xs font-medium text-slate-300">World Seed</span>
            <span className="text-[10px] text-slate-500 font-mono">
              Deterministic terrain generator seed
            </span>
          </div>
          <div className="flex items-center gap-2">
            <input
              type="number"
              value={seed}
              onChange={(e) => setSeed(parseInt(e.target.value) || 0)}
              className="w-28 bg-slate-900 border border-slate-700 rounded-lg px-2.5 py-1 text-xs font-mono text-white text-right focus:outline-none focus:border-amber-500"
            />
            <button
              onClick={() => {
                setSeed(Math.floor(Math.random() * 100000));
                sounds.playClick();
              }}
              title="Randomize Seed"
              className="px-2.5 py-1 bg-slate-800 hover:bg-slate-700 text-slate-300 rounded-lg text-xs font-mono transition-colors"
            >
              🎲
            </button>
          </div>
        </div>

        {/* Actions */}
        <div className="flex items-center justify-end gap-3 pt-2 border-t border-slate-800">
          <button
            onClick={onClose}
            className="px-4 py-2 bg-slate-800 hover:bg-slate-700 text-slate-300 rounded-xl text-xs font-medium transition-colors"
          >
            Cancel
          </button>
          <button
            onClick={() => {
              onGenerate(selectedPreset, seed);
              sounds.playExplosion();
              onClose();
            }}
            className="px-5 py-2 bg-gradient-to-r from-amber-500 to-yellow-500 hover:from-amber-600 hover:to-yellow-600 text-slate-950 rounded-xl text-xs font-bold transition-all shadow-lg shadow-amber-500/20"
          >
            Generate World
          </button>
        </div>
      </div>
    </div>
  );
};
