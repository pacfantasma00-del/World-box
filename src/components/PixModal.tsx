import React, { useState, useEffect } from 'react';
import { GameEngine } from '../game/engine';
import { sounds } from '../game/sound';

interface PixModalProps {
  engine: GameEngine;
  onClose: () => void;
}

interface Tier {
  id: string;
  amount: number;
  name: string;
  icon: string;
  desc: string;
  perk: string;
}

export const PixModal: React.FC<PixModalProps> = ({ engine, onClose }) => {
  const tiers: Tier[] = [
    {
      id: 'tier_5',
      amount: 5.0,
      name: 'Oferenda aos Deuses',
      icon: '🪙',
      desc: 'Um tributo modesto ao cosmos.',
      perk: '+500 de Ouro e +300 de Cultura para todos os reinos imediatamente.',
    },
    {
      id: 'tier_10',
      amount: 10.0,
      name: 'Pacto dos Titãs',
      icon: '⚔️',
      desc: 'Bênção divina de força e prosperidade.',
      perk: 'Eleva todos os monarcas a Heróis Nível 5 e concede o traço Poderoso aos exércitos.',
    },
    {
      id: 'tier_25',
      amount: 25.0,
      name: 'Soberania do Cosmos',
      icon: '👑',
      desc: 'Apoio Supremo de Mantenedor do Projeto.',
      perk: 'Desbloqueia a Era Arcana para todas as civilizações e concede Imortalidade aos soberanos.',
    },
  ];

  const [selectedTier, setSelectedTier] = useState<Tier>(tiers[1]);
  const [chargeData, setChargeData] = useState<{
    chargeId: string;
    pixCode: string;
    amount: number;
    status: string;
  } | null>(null);
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [copied, setCopied] = useState<boolean>(false);
  const [isPaid, setIsPaid] = useState<boolean>(false);
  const [chargeError, setChargeError] = useState<string | null>(null);

  // Generate Pix charge on tier selection
  const handleCreateCharge = async (tier: Tier) => {
    setIsLoading(true);
    setCopied(false);
    setIsPaid(false);
    setChargeError(null);
    sounds.playClick();

    try {
      const res = await fetch('/api/nexus/pix-charge', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          amount: tier.amount,
          description: `WorldBox - ${tier.name}`,
        }),
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) {
        throw new Error(data?.error || 'Integração Pix indisponível.');
      }
      if (!data?.chargeId || !data?.pixCode) {
        throw new Error('O provedor não retornou uma cobrança Pix válida.');
      }
      setChargeData(data);
    } catch (err) {
      setChargeData(null);
      setChargeError(err instanceof Error ? err.message : 'Falha ao criar cobrança Pix.');
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    handleCreateCharge(selectedTier);
  }, [selectedTier]);

  // Polling for charge confirmation
  useEffect(() => {
    if (!chargeData?.chargeId || isPaid) return;

    const interval = setInterval(async () => {
      try {
        const res = await fetch(`/api/nexus/charge-status/${chargeData.chargeId}`);
        const data = await res.json();
        if (data?.status === 'completed') {
          handlePaymentSuccess();
          clearInterval(interval);
        }
      } catch {}
    }, 3000);

    return () => clearInterval(interval);
  }, [chargeData, isPaid]);

  const handlePaymentSuccess = () => {
    setIsPaid(true);
    sounds.playDivine();

    // Apply divine in-game perks based on tier
    if (selectedTier.id === 'tier_5') {
      engine.kingdoms.forEach((k) => {
        k.gold += 500;
        k.culture += 300;
      });
      engine.addChronicle('🪙 Chuva de Ouro e Prosperidade abençoou todos os reinos via Pix!', '🪙', 'kingdom');
    } else if (selectedTier.id === 'tier_10') {
      engine.units.forEach((u) => {
        if (u.race) {
          engine.grantXp(u, 250);
          if (!u.traits.includes('strong')) u.traits.push('strong');
        }
      });
      engine.addChronicle('⚔️ O Pacto dos Titãs elevou os guerreiros do mundo!', '⚔️', 'hero');
    } else if (selectedTier.id === 'tier_25') {
      engine.kingdoms.forEach((k) => {
        k.era = 'arcane';
        const king = engine.units.find((u) => u.id === k.kingId);
        if (king && !king.traits.includes('immortal')) {
          king.traits.push('immortal');
        }
      });
      engine.addChronicle('👑 A Soberania do Cosmos inaugurou a Era Arcana Mundial!', '👑', 'era');
    }
  };

  const handleCopyPix = () => {
    if (chargeData?.pixCode) {
      navigator.clipboard.writeText(chargeData.pixCode);
      setCopied(true);
      sounds.playClick();
      setTimeout(() => setCopied(false), 2500);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/75 backdrop-blur-sm p-4">
      <div className="w-full max-w-lg bg-slate-900 border border-slate-700/80 rounded-2xl p-6 shadow-2xl flex flex-col gap-5 max-h-[90vh] overflow-y-auto">
        {/* Header */}
        <div className="flex items-center justify-between border-b border-slate-800 pb-3">
          <div className="flex items-center gap-2.5">
            <div className="w-9 h-9 rounded-xl bg-emerald-500/20 border border-emerald-500/40 flex items-center justify-center text-xl">
              💠
            </div>
            <div>
              <h2 className="text-base font-bold text-white font-medieval flex items-center gap-2">
                Gateway Pix · Nexus Pag
              </h2>
              <p className="text-xs text-slate-400">
                Apoio e bênçãos divinas instantâneas via QR Code ou Pix Copia e Cola.
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

        {/* Success Screen if paid */}
        {isPaid ? (
          <div className="bg-emerald-950/40 border border-emerald-500/60 rounded-2xl p-6 flex flex-col items-center text-center gap-3 animate-fade-in">
            <span className="text-4xl animate-bounce">✨</span>
            <h3 className="text-lg font-bold text-emerald-400 font-medieval">
              Pagamento Confirmado com Sucesso!
            </h3>
            <p className="text-xs text-slate-300 max-w-sm leading-relaxed">
              As bênçãos do pacote <strong>{selectedTier.name}</strong> foram aplicadas instantaneamente a todas as civilizações do seu mundo.
            </p>
            <div className="bg-slate-900/80 border border-slate-800 p-3 rounded-xl text-xs text-amber-300 font-medium">
              {selectedTier.perk}
            </div>
            <button
              onClick={onClose}
              className="mt-2 px-6 py-2 bg-emerald-500 hover:bg-emerald-600 text-slate-950 font-bold rounded-xl text-xs transition-colors"
            >
              Voltar ao Simulador
            </button>
          </div>
        ) : (
          <>
            {/* Tier Selector */}
            <div className="flex flex-col gap-2">
              <span className="text-[11px] font-semibold text-slate-400 uppercase tracking-wider">
                Selecione o Nível de Oferenda
              </span>
              <div className="grid grid-cols-3 gap-2">
                {tiers.map((t) => {
                  const isSelected = selectedTier.id === t.id;
                  return (
                    <button
                      key={t.id}
                      onClick={() => setSelectedTier(t)}
                      className={`p-2.5 rounded-xl border text-left flex flex-col gap-1 transition-all cursor-pointer ${
                        isSelected
                          ? 'bg-amber-500/15 border-amber-500 text-white shadow-md'
                          : 'bg-slate-950/60 border-slate-800 text-slate-400 hover:border-slate-700'
                      }`}
                    >
                      <div className="flex items-center justify-between">
                        <span className="text-lg">{t.icon}</span>
                        <span className="text-xs font-bold text-amber-400 font-mono">
                          R$ {t.amount.toFixed(2)}
                        </span>
                      </div>
                      <span className="text-[11px] font-bold font-medieval line-clamp-1 text-slate-200">
                        {t.name}
                      </span>
                    </button>
                  );
                })}
              </div>
            </div>

            {/* Perks description */}
            <div className="bg-slate-950/70 border border-slate-800 rounded-xl p-3 flex items-start gap-2.5 text-xs text-slate-300">
              <span className="text-amber-400 text-base">🎁</span>
              <div>
                <strong className="text-amber-400">Recompensa Cósmica:</strong> {selectedTier.perk}
              </div>
            </div>

            {/* QR Code & Pix Copia e Cola */}
            {isLoading ? (
              <div className="py-8 flex flex-col items-center justify-center gap-2 text-slate-400 text-xs">
                <span className="animate-spin text-xl">⏳</span>
                <span>Gerando cobrança na API Nexus Pag...</span>
              </div>
            ) : chargeError ? (
              <div role="alert" className="rounded-xl border border-amber-500/40 bg-amber-500/10 p-4 text-sm text-amber-200">
                {chargeError}
              </div>
            ) : chargeData ? (
              <div className="bg-slate-950/90 border border-slate-800 rounded-2xl p-4 flex flex-col items-center gap-4">
                <div className="w-full rounded-xl border border-amber-500/30 bg-amber-500/10 p-4 text-center text-xs text-amber-200">
                  QR Code visual só será exibido quando vier de uma cobrança real validada pelo provedor.
                </div>

                <div className="text-center">
                  <div className="text-sm font-bold text-white font-mono">
                    Valor: R$ {chargeData.amount.toFixed(2)}
                  </div>
                  <div className="text-[11px] text-slate-400">
                    Aponte o app do seu banco ou use a chave Copia e Cola abaixo
                  </div>
                </div>

                {/* Copia e Cola Input */}
                <div className="w-full flex items-center gap-2">
                  <input
                    type="text"
                    readOnly
                    value={chargeData.pixCode}
                    className="flex-1 bg-slate-900 border border-slate-700 rounded-xl px-3 py-2 text-xs font-mono text-slate-300 truncate focus:outline-none"
                  />
                  <button
                    onClick={handleCopyPix}
                    className="px-4 py-2 bg-emerald-500 hover:bg-emerald-600 text-slate-950 font-bold rounded-xl text-xs transition-colors shrink-0 flex items-center gap-1.5 cursor-pointer"
                  >
                    <span>{copied ? '✓' : '📋'}</span>
                    <span>{copied ? 'Copiado!' : 'Copiar Pix'}</span>
                  </button>
                </div>

                <div className="w-full pt-2 border-t border-slate-800/80 text-center text-xs text-slate-400">
                  Aguardando confirmação bancária verificada. Nenhuma recompensa será liberada por simulação.
                </div>
              </div>
            ) : null}
          </>
        )}
      </div>
    </div>
  );
};
