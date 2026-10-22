import React, { useState, useEffect, useRef } from 'react';
import { GameEngine } from '../game/engine';
import { sounds } from '../game/sound';

interface DownloadModalProps {
  engine: GameEngine;
  onClose: () => void;
  onWorldLoaded: () => void;
}

interface BeforeInstallPromptEvent extends Event {
  prompt: () => Promise<void>;
  userChoice: Promise<{ outcome: 'accepted' | 'dismissed'; platform: string }>;
}

export const DownloadModal: React.FC<DownloadModalProps> = ({
  engine,
  onClose,
  onWorldLoaded,
}) => {
  const [deferredPrompt, setDeferredPrompt] = useState<BeforeInstallPromptEvent | null>(null);
  const [isInstalled, setIsInstalled] = useState<boolean>(false);
  const [isIOS, setIsIOS] = useState<boolean>(false);
  const [exportSuccess, setExportSuccess] = useState<boolean>(false);
  const [copiedCommand, setCopiedCommand] = useState<boolean>(false);
  const fileInputRef = useRef<HTMLInputElement | null>(null);

  useEffect(() => {
    // Detect standalone mode
    const standalone =
      window.matchMedia('(display-mode: standalone)').matches ||
      (window.navigator as any).standalone === true;
    setIsInstalled(standalone);

    // Detect iOS
    const ua = window.navigator.userAgent.toLowerCase();
    setIsIOS(/iphone|ipad|ipod/.test(ua));

    const handleBeforeInstallPrompt = (e: Event) => {
      e.preventDefault();
      setDeferredPrompt(e as BeforeInstallPromptEvent);
    };

    window.addEventListener('beforeinstallprompt', handleBeforeInstallPrompt);
    return () => window.removeEventListener('beforeinstallprompt', handleBeforeInstallPrompt);
  }, []);

  const handleInstallApp = async () => {
    if (!deferredPrompt) return;
    sounds.playClick();
    await deferredPrompt.prompt();
    const { outcome } = await deferredPrompt.userChoice;
    if (outcome === 'accepted') {
      setIsInstalled(true);
      setDeferredPrompt(null);
    }
  };

  // Export current world to a downloadable .worldbox JSON file
  const handleExportWorld = () => {
    sounds.playClick();
    const worldData = {
      version: '1.2.0',
      exportedAt: new Date().toISOString(),
      gameYear: engine.gameYear,
      tickCount: engine.tickCount,
      width: engine.width,
      height: engine.height,
      laws: engine.laws,
      grid: engine.grid,
      kingdoms: engine.kingdoms,
      villages: engine.villages,
      buildings: engine.buildings,
      units: engine.units,
      chronicle: engine.chronicle,
    };

    const blob = new Blob([JSON.stringify(worldData, null, 2)], {
      type: 'application/json',
    });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `worldbox_save_year_${engine.gameYear}_${Date.now()}.worldbox`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);

    setExportSuccess(true);
    setTimeout(() => setExportSuccess(false), 3000);
  };

  // Import world from file
  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (event) => {
      try {
        const json = JSON.parse(event.target?.result as string);
        if (json.grid && json.width && json.height) {
          engine.grid = json.grid;
          engine.width = json.width;
          engine.height = json.height;
          engine.kingdoms = json.kingdoms || [];
          engine.villages = json.villages || [];
          engine.buildings = json.buildings || [];
          engine.units = json.units || [];
          engine.chronicle = json.chronicle || [];
          engine.gameYear = json.gameYear || 1;
          engine.tickCount = json.tickCount || 0;
          if (json.laws) engine.laws = json.laws;

          sounds.playDivine();
          onWorldLoaded();
          onClose();
        }
      } catch (err) {
        console.error('Error importing world file:', err);
      }
    };
    reader.readAsText(file);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/75 backdrop-blur-sm p-4">
      <div className="w-full max-w-xl bg-slate-900 border border-slate-700/80 rounded-2xl p-6 shadow-2xl flex flex-col gap-5 max-h-[90vh] overflow-y-auto">
        {/* Header */}
        <div className="flex items-center justify-between border-b border-slate-800 pb-3">
          <div className="flex items-center gap-2.5">
            <div className="w-9 h-9 rounded-xl bg-amber-500/20 border border-amber-500/40 flex items-center justify-center text-xl">
              📥
            </div>
            <div>
              <h2 className="text-base font-bold text-white font-medieval">
                Download & Instalação do Aplicativo
              </h2>
              <p className="text-xs text-slate-400">
                Instale o simulador no celular/PC e faça backup dos seus mundos.
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="w-8 h-8 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300 hover:text-white flex items-center justify-center font-bold transition-colors cursor-pointer"
          >
            ✕
          </button>
        </div>

        {/* Option 1: Termux (Android) & Linux 1-Click Auto-Installer */}
        <div className="bg-gradient-to-r from-emerald-950/60 to-slate-950/90 border border-emerald-500/40 rounded-xl p-4 flex flex-col gap-3 shadow-lg">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2.5">
              <span className="text-2xl">⚡</span>
              <div>
                <h3 className="text-sm font-bold text-white flex items-center gap-2">
                  <span>Termux (Android) & Linux — Instalação 1-Clique</span>
                  <span className="px-2 py-0.5 bg-emerald-500/20 text-emerald-400 border border-emerald-500/30 text-[10px] rounded-full uppercase tracking-wider font-mono">
                    Recomendado
                  </span>
                </h3>
                <p className="text-xs text-slate-300">
                  Instala dependências via <code className="text-emerald-400 font-mono">pkg install</code>, baixa o ZIP completo atualizado e roda na hora.
                </p>
              </div>
            </div>

            <a
              href="/install.sh"
              download="install.sh"
              className="px-3 py-1.5 bg-slate-800 hover:bg-slate-700 text-slate-300 border border-slate-700 rounded-lg text-xs font-mono shrink-0 cursor-pointer flex items-center gap-1"
              title="Baixar script install.sh"
            >
              <span>📄</span>
              <span>install.sh</span>
            </a>
          </div>

          {/* 1-Click Terminal Command */}
          <div className="bg-slate-950 border border-slate-800/90 rounded-lg p-2.5 flex items-center justify-between gap-2">
            <code className="text-xs font-mono text-emerald-300 break-all select-all">
              pkg update -y && pkg install -y curl && curl -sSL {typeof window !== 'undefined' ? window.location.origin : 'https://...'}/install.sh | bash
            </code>
            <button
              onClick={() => {
                const cmd = `pkg update -y && pkg install -y curl && curl -sSL ${window.location.origin}/install.sh | bash`;
                navigator.clipboard.writeText(cmd);
                sounds.playClick();
                setCopiedCommand(true);
                setTimeout(() => setCopiedCommand(false), 3000);
              }}
              className="px-3 py-1.5 bg-emerald-600 hover:bg-emerald-500 text-white font-bold rounded-lg text-xs transition-all shrink-0 cursor-pointer shadow flex items-center gap-1"
            >
              <span>{copiedCommand ? '✓' : '📋'}</span>
              <span>{copiedCommand ? 'Copiado!' : 'Copiar'}</span>
            </button>
          </div>

          <div className="text-[11px] text-slate-400 space-y-1">
            <p>✓ <strong>O que esse comando faz:</strong></p>
            <p className="pl-3 text-slate-300">1. Executa <span className="text-emerald-400 font-mono">pkg install -y nodejs-lts python unzip curl</span></p>
            <p className="pl-3 text-slate-300">2. Baixa e extrai o pacote completo em <span className="text-amber-400 font-mono">~/astro-worldbox</span></p>
            <p className="pl-3 text-slate-300">3. Instala dependências do npm e gera o <span className="text-blue-400 font-mono">start.sh</span> blindado</p>
            <p className="pl-3 text-slate-300">4. Inicia o servidor local em <span className="text-amber-400 font-mono">http://127.0.0.1:3000</span> sem erros de PM2</p>
          </div>
        </div>

        {/* Option 2: PWA Direct Installation */}
        <div className="bg-slate-950/80 border border-slate-800 rounded-xl p-4 flex flex-col gap-3">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2.5">
              <span className="text-2xl">📱</span>
              <div>
                <h3 className="text-sm font-bold text-white">
                  Instalar como Aplicativo PWA Nativo
                </h3>
                <p className="text-xs text-slate-400">
                  Adiciona o WorldBox à tela de início do seu Android, Windows ou Linux com suporte offline.
                </p>
              </div>
            </div>

            {isInstalled ? (
              <span className="px-3 py-1 bg-emerald-500/20 text-emerald-400 border border-emerald-500/30 rounded-lg text-xs font-bold shrink-0">
                ✓ Já Instalado
              </span>
            ) : deferredPrompt ? (
              <button
                onClick={handleInstallApp}
                className="px-4 py-2 bg-gradient-to-r from-amber-500 to-yellow-500 hover:from-amber-600 hover:to-yellow-600 text-slate-950 font-bold rounded-xl text-xs transition-all shadow-md shrink-0 cursor-pointer"
              >
                Instalar Agora
              </button>
            ) : (
              <button
                onClick={() => {
                  alert('Para instalar: no menu do navegador (três pontinhos), toque em "Adicionar à tela inicial" ou "Instalar aplicativo".');
                }}
                className="px-3 py-1.5 bg-slate-800 hover:bg-slate-700 text-slate-300 rounded-lg text-xs font-medium shrink-0 cursor-pointer"
              >
                Instruções
              </button>
            )}
          </div>

          {isIOS && (
            <div className="bg-slate-900/80 p-2.5 rounded-lg border border-slate-800 text-[11px] text-slate-300">
              🍎 <strong>No iPhone / iPad:</strong> Toque no botão <strong>Compartilhar</strong> (ícone com seta) no Safari e selecione <strong>"Adicionar à Tela de Início"</strong>.
            </div>
          )}
        </div>

        {/* Option 2: Full Source Code ZIP Download */}
        <div className="bg-slate-950/80 border border-slate-800 rounded-xl p-4 flex flex-col gap-3">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2.5">
              <span className="text-2xl">📦</span>
              <div>
                <h3 className="text-sm font-bold text-white">
                  Baixar Código Completo (.ZIP)
                </h3>
                <p className="text-xs text-slate-400">
                  Baixe todos os arquivos e scripts do projeto para rodar no Termux, Linux, Windows ou VS Code.
                </p>
              </div>
            </div>

            <a
              href="/api/download-zip"
              download="worldbox-god-simulator.zip"
              className="px-4 py-2 bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-500 hover:to-indigo-500 text-white font-bold rounded-xl text-xs transition-all shadow-md shrink-0 flex items-center gap-1.5 cursor-pointer"
            >
              <span>📥</span>
              <span>Baixar ZIP</span>
            </a>
          </div>
        </div>

        {/* Option 2: World Save & Backup Export */}
        <div className="bg-slate-950/80 border border-slate-800 rounded-xl p-4 flex flex-col gap-3">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2.5">
              <span className="text-2xl">💾</span>
              <div>
                <h3 className="text-sm font-bold text-white">
                  Exportar & Baixar Mundo (.worldbox)
                </h3>
                <p className="text-xs text-slate-400">
                  Baixe o mapa atual, civilizações, heróis e crônicas em um arquivo leve para guardar ou transferir.
                </p>
              </div>
            </div>

            <button
              onClick={handleExportWorld}
              className="px-4 py-2 bg-slate-800 hover:bg-slate-700 text-amber-400 border border-amber-500/40 font-bold rounded-xl text-xs transition-colors shrink-0 flex items-center gap-1.5 cursor-pointer"
            >
              <span>{exportSuccess ? '✓' : '📥'}</span>
              <span>{exportSuccess ? 'Baixado!' : 'Baixar Mundo'}</span>
            </button>
          </div>
        </div>

        {/* Option 3: Import World Save */}
        <div className="bg-slate-950/80 border border-slate-800 rounded-xl p-4 flex flex-col gap-3">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2.5">
              <span className="text-2xl">📂</span>
              <div>
                <h3 className="text-sm font-bold text-white">
                  Restaurar / Importar Mundo Salvo
                </h3>
                <p className="text-xs text-slate-400">
                  Carregue um arquivo .worldbox salvo previamente no simulador.
                </p>
              </div>
            </div>

            <button
              onClick={() => fileInputRef.current?.click()}
              className="px-4 py-2 bg-slate-800 hover:bg-slate-700 text-slate-200 border border-slate-700 font-bold rounded-xl text-xs transition-colors shrink-0 cursor-pointer"
            >
              Carregar Arquivo
            </button>
            <input
              type="file"
              ref={fileInputRef}
              onChange={handleFileChange}
              accept=".worldbox,.json"
              className="hidden"
            />
          </div>
        </div>
      </div>
    </div>
  );
};
