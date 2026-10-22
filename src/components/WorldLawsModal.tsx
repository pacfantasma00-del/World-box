import React from 'react';
import { WorldLaws } from '../game/types';
import { sounds } from '../game/sound';

interface WorldLawsModalProps {
  laws: WorldLaws;
  onUpdateLaws: (laws: WorldLaws) => void;
  onClose: () => void;
}

export const WorldLawsModal: React.FC<WorldLawsModalProps> = ({
  laws,
  onUpdateLaws,
  onClose,
}) => {
  const toggleLaw = (key: keyof WorldLaws) => {
    sounds.playClick();
    onUpdateLaws({
      ...laws,
      [key]: !laws[key],
    });
  };

  const lawDefinitions: {
    key: keyof WorldLaws;
    title: string;
    icon: string;
    desc: string;
  }[] = [
    {
      key: 'peaceWorld',
      title: 'Global Peace Accord',
      icon: '🕊️',
      desc: 'Prevents kingdoms from declaring war on each other. Orcs and rivals live in forced harmony.',
    },
    {
      key: 'disastersEnabled',
      title: 'Divine Cataclysms',
      icon: '⚡',
      desc: 'Allows meteor strikes, earthquakes, and lightning to alter terrain and buildings.',
    },
    {
      key: 'plagueSpread',
      title: 'Zombie Virus Contagion',
      icon: '☣️',
      desc: 'Infected units can spread the undead virus to nearby healthy citizens upon contact.',
    },
    {
      key: 'fastCivilization',
      title: 'Accelerated Civilizations',
      icon: '🏗️',
      desc: 'Cities construct stone houses and expand borders at 3x regular speed.',
    },
    {
      key: 'eternalFire',
      title: 'Eternal Wildfires',
      icon: '🔥',
      desc: 'Forest fires never burn down into ash unless extinguished by divine rain or ocean water.',
    },
  ];

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 backdrop-blur-sm p-4">
      <div className="w-full max-w-md bg-slate-900 border border-slate-700/80 rounded-2xl p-6 shadow-2xl flex flex-col gap-5">
        {/* Header */}
        <div className="flex items-center justify-between border-b border-slate-800 pb-3">
          <div className="flex items-center gap-2.5">
            <span className="text-2xl">⚖️</span>
            <div>
              <h2 className="text-lg font-bold text-white font-medieval">World Laws</h2>
              <p className="text-xs text-slate-400">
                Rule your world with absolute divine edicts.
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

        {/* Laws Toggles */}
        <div className="flex flex-col gap-2.5">
          {lawDefinitions.map((law) => {
            const isEnabled = laws[law.key];
            return (
              <button
                key={law.key}
                onClick={() => toggleLaw(law.key)}
                className={`p-3 rounded-xl border text-left flex items-start justify-between gap-3 transition-colors ${
                  isEnabled
                    ? 'bg-amber-500/10 border-amber-500/50 text-white'
                    : 'bg-slate-950/60 border-slate-800 text-slate-400 hover:border-slate-700'
                }`}
              >
                <div className="flex items-start gap-2.5">
                  <span className="text-xl mt-0.5">{law.icon}</span>
                  <div>
                    <h4 className="text-xs font-bold text-white">{law.title}</h4>
                    <p className="text-[11px] text-slate-400 leading-snug mt-0.5">
                      {law.desc}
                    </p>
                  </div>
                </div>

                {/* Toggle switch */}
                <div
                  className={`w-9 h-5 rounded-full p-0.5 transition-colors shrink-0 mt-1 ${
                    isEnabled ? 'bg-amber-500' : 'bg-slate-800'
                  }`}
                >
                  <div
                    className={`w-4 h-4 rounded-full bg-white transition-transform ${
                      isEnabled ? 'translate-x-4' : 'translate-x-0'
                    }`}
                  />
                </div>
              </button>
            );
          })}
        </div>

        {/* Footer */}
        <div className="flex justify-end pt-2 border-t border-slate-800">
          <button
            onClick={onClose}
            className="px-4 py-2 bg-amber-500 hover:bg-amber-600 text-slate-950 font-bold rounded-xl text-xs transition-colors"
          >
            Apply Edicts
          </button>
        </div>
      </div>
    </div>
  );
};
