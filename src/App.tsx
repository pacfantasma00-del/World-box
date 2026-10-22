import React, { useState } from 'react';
import { GameEngine } from './game/engine';
import { ToolType, Unit, Kingdom } from './game/types';
import { WorldBoxCanvas } from './components/WorldBoxCanvas';
import { PowerBar } from './components/PowerBar';
import { TopBar } from './components/TopBar';
import { UnitInspector } from './components/UnitInspector';
import { KingdomsModal } from './components/KingdomsModal';
import { WorldGenModal } from './components/WorldGenModal';
import { WorldLawsModal } from './components/WorldLawsModal';
import { ChronicleModal } from './components/ChronicleModal';
import { PixModal } from './components/PixModal';
import { DownloadModal } from './components/DownloadModal';
import { AstroMatrixModal } from './components/AstroMatrixModal';
import { sounds } from './game/sound';

export default function App() {
  const [engine] = useState(() => new GameEngine('continents', 777));
  const [activeTool, setActiveTool] = useState<ToolType>('grass');
  const [brushSize, setBrushSize] = useState<number>(2);

  const [selectedUnit, setSelectedUnit] = useState<Unit | null>(null);
  const [selectedKingdom, setSelectedKingdom] = useState<Kingdom | null>(null);

  const [showWorldGen, setShowWorldGen] = useState<boolean>(false);
  const [showKingdoms, setShowKingdoms] = useState<boolean>(false);
  const [showLaws, setShowLaws] = useState<boolean>(false);
  const [showChronicle, setShowChronicle] = useState<boolean>(false);
  const [showPix, setShowPix] = useState<boolean>(false);
  const [showDownload, setShowDownload] = useState<boolean>(false);
  const [showAstroMatrix, setShowAstroMatrix] = useState<boolean>(false);

  const [isMuted, setIsMuted] = useState<boolean>(false);
  const [, setSpeedState] = useState<number>(1);
  const [, setRenderTrigger] = useState<number>(0);

  const handleToggleMute = () => {
    const nextMuted = !isMuted;
    setIsMuted(nextMuted);
    sounds.setMuted(nextMuted);
  };

  const handleUnitIntervention = (action: 'lightning' | 'bless' | 'infect' | 'coffee' | 'kill') => {
    if (!selectedUnit) return;

    if (action === 'lightning') {
      engine.applyTool('lightning', Math.floor(selectedUnit.x), Math.floor(selectedUnit.y), 1);
    } else if (action === 'bless') {
      selectedUnit.hp = selectedUnit.maxHp;
      selectedUnit.traits = selectedUnit.traits.filter((t) => t !== 'infected');
      if (!selectedUnit.traits.includes('blessed')) {
        selectedUnit.traits.push('blessed');
      }
      selectedUnit.mood = 'enlightened';
      selectedUnit.thought = 'A bênção dos céus purificou meu corpo e espírito!';
      sounds.playDivine();
    } else if (action === 'infect') {
      if (!selectedUnit.traits.includes('infected')) {
        selectedUnit.traits.push('infected');
      }
      selectedUnit.mood = 'fearful';
      selectedUnit.thought = 'Sinto uma febre estranha corrompendo meu sangue...';
      sounds.playSpawn();
    } else if (action === 'coffee') {
      if (!selectedUnit.traits.includes('swift')) {
        selectedUnit.traits.push('swift');
      }
      selectedUnit.speed = Math.min(3.5, selectedUnit.speed * 1.5);
      selectedUnit.mood = 'inspired';
      selectedUnit.thought = 'Uma energia divina relampeja em meus passos!';
      sounds.playClick();
    } else if (action === 'kill') {
      selectedUnit.hp = 0;
      setSelectedUnit(null);
      sounds.playSword();
    }
  };

  return (
    <div className="relative w-screen h-screen overflow-hidden bg-slate-950 font-sans select-none">
      {/* Top HUD */}
      <TopBar
        engine={engine}
        onOpenWorldGen={() => setShowWorldGen(true)}
        onOpenKingdoms={() => setShowKingdoms(true)}
        onOpenLaws={() => setShowLaws(true)}
        onOpenChronicle={() => setShowChronicle(true)}
        onOpenPix={() => setShowPix(true)}
        onOpenDownload={() => setShowDownload(true)}
        onOpenAstroMatrix={() => setShowAstroMatrix(true)}
        isMuted={isMuted}
        onToggleMute={handleToggleMute}
        onSpeedChange={(s) => setSpeedState(s)}
      />

      {/* Main Interactive Pixel Canvas Viewport */}
      <WorldBoxCanvas
        engine={engine}
        activeTool={activeTool}
        brushSize={brushSize}
        onSelectUnit={(unit) => setSelectedUnit(unit)}
        onSelectKingdom={(kingdom) => {
          setSelectedKingdom(kingdom);
          if (kingdom) setShowKingdoms(true);
        }}
      />

      {/* Bottom Power Bar */}
      <PowerBar
        activeTool={activeTool}
        onSelectTool={(tool) => setActiveTool(tool)}
        brushSize={brushSize}
        onChangeBrushSize={(size) => setBrushSize(size)}
      />

      {/* Unit Inspector Sheet */}
      <UnitInspector
        unit={selectedUnit}
        onClose={() => setSelectedUnit(null)}
        onIntervene={handleUnitIntervention}
      />

      {/* Kingdoms & Diplomacy Modal */}
      {showKingdoms && (
        <KingdomsModal
          engine={engine}
          onClose={() => setShowKingdoms(false)}
          onSelectKingdom={(k) => setSelectedKingdom(k)}
        />
      )}

      {/* World Generation Modal */}
      {showWorldGen && (
        <WorldGenModal
          onClose={() => setShowWorldGen(false)}
          onGenerate={(preset, seed) => {
            engine.resetWorld(preset, seed);
            setSelectedUnit(null);
            setSelectedKingdom(null);
          }}
        />
      )}

      {/* World Laws Modal */}
      {showLaws && (
        <WorldLawsModal
          laws={engine.laws}
          onUpdateLaws={(newLaws) => {
            engine.laws = newLaws;
          }}
          onClose={() => setShowLaws(false)}
        />
      )}

      {/* World History Chronicle Modal */}
      {showChronicle && (
        <ChronicleModal
          engine={engine}
          onClose={() => setShowChronicle(false)}
        />
      )}

      {/* Pix Nexus Pag Gateway Modal */}
      {showPix && (
        <PixModal
          engine={engine}
          onClose={() => setShowPix(false)}
        />
      )}

      {/* Download & Install Hub Modal */}
      {showDownload && (
        <DownloadModal
          engine={engine}
          onClose={() => setShowDownload(false)}
          onWorldLoaded={() => {
            setRenderTrigger((prev) => prev + 1);
            setSelectedUnit(null);
            setSelectedKingdom(null);
          }}
        />
      )}

      {/* ASTRO CORE MATRIX Modal */}
      {showAstroMatrix && (
        <AstroMatrixModal onClose={() => setShowAstroMatrix(false)} />
      )}
    </div>
  );
}
