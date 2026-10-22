import React, { useRef, useEffect, useState } from 'react';
import { GameEngine } from '../game/engine';
import { ToolType, Unit, Kingdom } from '../game/types';
import { TILE_COLORS, MOOD_DETAILS } from '../game/constants';

interface WorldBoxCanvasProps {
  engine: GameEngine;
  activeTool: ToolType;
  brushSize: number;
  onSelectUnit: (unit: Unit | null) => void;
  onSelectKingdom: (kingdom: Kingdom | null) => void;
}

export const WorldBoxCanvas: React.FC<WorldBoxCanvasProps> = ({
  engine,
  activeTool,
  brushSize,
  onSelectUnit,
  onSelectKingdom,
}) => {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const containerRef = useRef<HTMLDivElement | null>(null);

  // Pan & Zoom state
  const [zoom, setZoom] = useState<number>(1.2);
  const [pan, setPan] = useState<{ x: number; y: number }>({ x: 0, y: 0 });
  const [isPanning, setIsPanning] = useState<boolean>(false);
  const [panStart, setPanStart] = useState<{ x: number; y: number }>({ x: 0, y: 0 });
  const [isPainting, setIsPainting] = useState<boolean>(false);
  const [hoverGrid, setHoverGrid] = useState<{ x: number; y: number } | null>(null);
  const [showBorders, setShowBorders] = useState<boolean>(true);
  const [showThoughts, setShowThoughts] = useState<boolean>(true);

  // Auto-center pan on initial load
  useEffect(() => {
    if (containerRef.current) {
      const rect = containerRef.current.getBoundingClientRect();
      const tileSize = 12 * zoom;
      const totalWidth = engine.width * tileSize;
      const totalHeight = engine.height * tileSize;
      setPan({
        x: (rect.width - totalWidth) / 2,
        y: (rect.height - totalHeight) / 2,
      });
    }
  }, []);

  // Main Render Loop
  useEffect(() => {
    let animationFrameId: number;

    const render = () => {
      engine.tick();

      const canvas = canvasRef.current;
      if (!canvas) return;
      const ctx = canvas.getContext('2d', { alpha: false });
      if (!ctx) return;

      const tileSize = 12 * zoom;

      // Clear Canvas
      ctx.fillStyle = '#050811';
      ctx.fillRect(0, 0, canvas.width, canvas.height);

      ctx.save();
      ctx.translate(pan.x, pan.y);

      // 1. Draw Grid Tiles
      for (let y = 0; y < engine.height; y++) {
        for (let x = 0; x < engine.width; x++) {
          const tile = engine.grid[y][x];
          const px = x * tileSize;
          const py = y * tileSize;

          // Frustum culling optimization
          if (
            px + pan.x + tileSize < 0 ||
            px + pan.x > canvas.width ||
            py + pan.y + tileSize < 0 ||
            py + pan.y > canvas.height
          ) {
            continue;
          }

          let color = TILE_COLORS[tile.type] || '#22c55e';

          // Water wave shimmer & coastline surf
          if (tile.type === 'deep_ocean' || tile.type === 'shallow_water') {
            const wave = Math.sin(x * 0.4 + y * 0.4 + engine.tickCount * 0.06);
            if (wave > 0.65) {
              color = tile.type === 'deep_ocean' ? '#1d4ed8' : '#7dd3fc';
            }
          }

          ctx.fillStyle = color;
          ctx.fillRect(px, py, tileSize + 0.5, tileSize + 0.5);

          // Forest tree pixel detailing
          if (tile.type === 'forest') {
            const wind = Math.sin(engine.tickCount * 0.05 + x) * 0.5;
            ctx.fillStyle = '#14532d';
            ctx.fillRect(px + 2 + wind, py + 1, tileSize - 4, tileSize - 4);
            ctx.fillStyle = '#166534';
            ctx.fillRect(px + 3 + wind, py + 2, tileSize - 6, tileSize - 6);
          }

          // Mountain snowy ridge
          if (tile.type === 'mountain') {
            ctx.fillStyle = '#475569';
            ctx.fillRect(px + 1, py + 1, tileSize - 2, tileSize - 2);
            ctx.fillStyle = '#94a3b8';
            ctx.fillRect(px + 3, py + 1, tileSize - 6, 3);
          }

          // Wheat crops
          if (tile.hasCrop) {
            const growth = (tile.cropGrowth || 0) / 100;
            ctx.fillStyle = growth > 0.8 ? '#facc15' : '#84cc16';
            ctx.fillRect(px + tileSize * 0.2, py + tileSize * 0.2, tileSize * 0.6, tileSize * 0.6);
          }

          // Kingdom territory tint
          if (showBorders && tile.kingdomId) {
            const kingdom = engine.kingdoms.find((k) => k.id === tile.kingdomId);
            if (kingdom) {
              ctx.fillStyle = kingdom.color + '28';
              ctx.fillRect(px, py, tileSize, tileSize);
            }
          }
        }
      }

      // 2. Draw Buildings
      for (const b of engine.buildings) {
        const px = b.x * tileSize;
        const py = b.y * tileSize;

        if (
          px + pan.x + tileSize * 2 < 0 ||
          px + pan.x > canvas.width ||
          py + pan.y + tileSize * 2 < 0 ||
          py + pan.y > canvas.height
        ) {
          continue;
        }

        ctx.save();
        if (b.type === 'arcane_obelisk') {
          // Arcane golden obelisk with glowing crystal
          ctx.fillStyle = '#6b21a8';
          ctx.fillRect(px + tileSize * 0.25, py - 4, tileSize * 0.5, tileSize * 1.4);
          const glow = Math.sin(engine.tickCount * 0.1) * 2;
          ctx.fillStyle = '#c084fc';
          ctx.beginPath();
          ctx.arc(px + tileSize * 0.5, py - 6 + glow, 4, 0, Math.PI * 2);
          ctx.fill();
        } else if (b.type === 'castle') {
          ctx.fillStyle = '#334155';
          ctx.fillRect(px, py - 2, tileSize * 1.5, tileSize * 1.4);
          ctx.fillStyle = '#475569';
          ctx.fillRect(px + 2, py - 5, 4, 5); // left turret
          ctx.fillRect(px + tileSize * 1.5 - 6, py - 5, 4, 5); // right turret
          ctx.fillStyle = '#eab308';
          ctx.fillRect(px + tileSize * 0.75 - 1, py - 8, 2, 8); // flag pole
          ctx.fillStyle = '#ef4444';
          ctx.fillRect(px + tileSize * 0.75 + 1, py - 8, 5, 4); // flag banner
        } else if (b.type === 'house') {
          ctx.fillStyle = '#64748b';
          ctx.fillRect(px + 2, py + 2, tileSize - 2, tileSize - 2);
          ctx.fillStyle = '#b45309';
          ctx.fillRect(px + 1, py, tileSize, 3);
          // Chimney smoke
          if (engine.tickCount % 20 < 10) {
            ctx.fillStyle = 'rgba(203, 213, 225, 0.6)';
            ctx.fillRect(px + tileSize - 3, py - 3, 2, 2);
          }
        } else {
          // Tent or Hut
          ctx.fillStyle = '#d97706';
          ctx.beginPath();
          ctx.moveTo(px + tileSize * 0.5, py + 1);
          ctx.lineTo(px + tileSize, py + tileSize);
          ctx.lineTo(px, py + tileSize);
          ctx.fill();
        }
        ctx.restore();
      }

      // 3. Draw Units
      for (const unit of engine.units) {
        const px = unit.x * tileSize;
        const py = unit.y * tileSize;

        if (
          px + pan.x + tileSize < 0 ||
          px + pan.x > canvas.width ||
          py + pan.y + tileSize < 0 ||
          py + pan.y > canvas.height
        ) {
          continue;
        }

        ctx.save();

        // Selection box
        if (engine.selectedUnitId === unit.id) {
          ctx.strokeStyle = '#38bdf8';
          ctx.lineWidth = 2;
          ctx.strokeRect(px - 4, py - 4, tileSize + 8, tileSize + 8);
        }

        // Blessed Aura
        if (unit.traits.includes('blessed')) {
          ctx.fillStyle = 'rgba(254, 240, 138, 0.45)';
          ctx.beginPath();
          ctx.arc(px + tileSize / 2, py + tileSize / 2, tileSize * 0.9, 0, Math.PI * 2);
          ctx.fill();
        }

        // Unit Rendering
        if (unit.type === 'boat') {
          // Sailing Ship
          ctx.fillStyle = '#78350f';
          ctx.fillRect(px, py + 3, tileSize * 1.4, tileSize * 0.6);
          // Mast & Sail
          ctx.fillStyle = '#cbd5e1';
          ctx.fillRect(px + tileSize * 0.6, py - 4, 2, 7);
          ctx.fillStyle = '#ffffff';
          ctx.beginPath();
          ctx.moveTo(px + tileSize * 0.6 + 2, py - 3);
          ctx.lineTo(px + tileSize * 1.2, py);
          ctx.lineTo(px + tileSize * 0.6 + 2, py + 3);
          ctx.fill();
        } else if (unit.type === 'dragon') {
          ctx.fillStyle = '#991b1b';
          ctx.fillRect(px - 4, py - 4, tileSize * 2, tileSize * 2);
          ctx.fillStyle = '#ef4444';
          ctx.fillRect(px - 10, py, 6, 8);
          ctx.fillRect(px + tileSize * 2 + 4, py, 6, 8);
        } else if (unit.type === 'sheep') {
          ctx.fillStyle = '#f8fafc';
          ctx.fillRect(px + 2, py + 3, tileSize - 4, tileSize - 5);
          ctx.fillStyle = '#1e293b';
          ctx.fillRect(px + tileSize - 3, py + 2, 2, 2);
        } else if (unit.type === 'wolf') {
          ctx.fillStyle = '#64748b';
          ctx.fillRect(px + 1, py + 2, tileSize - 2, tileSize - 4);
        } else if (unit.type === 'zombie') {
          ctx.fillStyle = '#65a30d';
          ctx.fillRect(px + 2, py + 1, tileSize - 4, tileSize - 2);
        } else if (unit.type === 'demon') {
          ctx.fillStyle = '#ea580c';
          ctx.fillRect(px + 2, py + 1, tileSize - 4, tileSize - 2);
        } else {
          // Civilized Humanoid
          const baseColor =
            unit.color ||
            (unit.race === 'elf'
              ? '#10b981'
              : unit.race === 'dwarf'
                ? '#f59e0b'
                : unit.race === 'orc'
                  ? '#16a34a'
                  : '#38bdf8');

          ctx.fillStyle = baseColor;
          ctx.fillRect(px + 2, py + 2, tileSize - 4, tileSize - 4);

          // Head
          ctx.fillStyle = unit.race === 'orc' ? '#84cc16' : '#fde047';
          ctx.fillRect(px + 3, py - 1, tileSize - 6, 3);

          // Crown for Ruler
          if (unit.profession === 'ruler') {
            ctx.fillStyle = '#fbbf24';
            ctx.fillRect(px + 2, py - 4, tileSize - 4, 3);
          }

          // Hero weapon glint if level >= 5
          if (unit.level >= 5) {
            ctx.fillStyle = '#38bdf8';
            ctx.fillRect(px + tileSize - 2, py - 2, 2, 4);
          }
        }

        // Health bar
        if (unit.hp < unit.maxHp) {
          const hpPercent = Math.max(0, unit.hp / unit.maxHp);
          ctx.fillStyle = '#b91c1c';
          ctx.fillRect(px, py - 5, tileSize, 2);
          ctx.fillStyle = '#22c55e';
          ctx.fillRect(px, py - 5, tileSize * hpPercent, 2);
        }

        // Autonomous Thought Bubble
        const isHovered = hoverGrid && Math.hypot(unit.x - hoverGrid.x, unit.y - hoverGrid.y) < 1.5;
        if (showThoughts && (engine.selectedUnitId === unit.id || isHovered || (unit.level >= 5 && engine.tickCount % 120 < 60))) {
          const moodInfo = MOOD_DETAILS[unit.mood] || MOOD_DETAILS.content;
          ctx.fillStyle = 'rgba(15, 23, 42, 0.9)';
          ctx.strokeStyle = moodInfo.color;
          ctx.lineWidth = 1;

          const bubbleText = `${moodInfo.icon} ${unit.name} (Lvl ${unit.level})`;
          ctx.font = 'bold 9px monospace';
          const textWidth = ctx.measureText(bubbleText).width;

          ctx.fillRect(px - textWidth / 2 + tileSize / 2 - 4, py - 18, textWidth + 8, 12);
          ctx.strokeRect(px - textWidth / 2 + tileSize / 2 - 4, py - 18, textWidth + 8, 12);

          ctx.fillStyle = '#f8fafc';
          ctx.fillText(bubbleText, px - textWidth / 2 + tileSize / 2, py - 9);
        }

        ctx.restore();
      }

      // 4. Draw Disaster Effects
      for (const effect of engine.effects) {
        ctx.save();
        const tx = effect.targetX * tileSize;
        const ty = effect.targetY * tileSize;

        if (effect.type === 'lightning') {
          ctx.strokeStyle = '#fef08a';
          ctx.lineWidth = 3;
          ctx.beginPath();
          let cx = effect.x * tileSize;
          let cy = effect.y * tileSize;
          ctx.moveTo(cx, cy);
          for (let step = 0; step < 5; step++) {
            cx += (Math.random() - 0.5) * 20;
            cy += (ty - cy) * 0.3;
            ctx.lineTo(cx, cy);
          }
          ctx.lineTo(tx, ty);
          ctx.stroke();

          ctx.fillStyle = 'rgba(255, 255, 255, 0.8)';
          ctx.beginPath();
          ctx.arc(tx, ty, effect.radius * tileSize * (1 - effect.progress), 0, Math.PI * 2);
          ctx.fill();
        } else if (effect.type === 'meteor') {
          const curX = effect.x * tileSize + (tx - effect.x * tileSize) * effect.progress;
          const curY = effect.y * tileSize + (ty - effect.y * tileSize) * effect.progress;

          ctx.fillStyle = '#ea580c';
          ctx.beginPath();
          ctx.arc(curX, curY, 8, 0, Math.PI * 2);
          ctx.fill();

          ctx.strokeStyle = 'rgba(251, 146, 60, 0.5)';
          ctx.lineWidth = 4;
          ctx.beginPath();
          ctx.moveTo(effect.x * tileSize, effect.y * tileSize);
          ctx.lineTo(curX, curY);
          ctx.stroke();
        } else if (effect.type === 'explosion') {
          const r = effect.radius * tileSize * effect.progress;
          ctx.strokeStyle = effect.color;
          ctx.lineWidth = 4 * (1 - effect.progress);
          ctx.beginPath();
          ctx.arc(tx, ty, r, 0, Math.PI * 2);
          ctx.stroke();

          ctx.fillStyle = `rgba(239, 68, 68, ${0.4 * (1 - effect.progress)})`;
          ctx.beginPath();
          ctx.arc(tx, ty, r, 0, Math.PI * 2);
          ctx.fill();
        } else if (effect.type === 'divine_ray') {
          const beamWidth = effect.radius * tileSize * 1.5;
          const grad = ctx.createLinearGradient(tx, 0, tx, ty);
          grad.addColorStop(0, 'rgba(254, 240, 138, 0.8)');
          grad.addColorStop(1, 'rgba(250, 204, 21, 0.2)');
          ctx.fillStyle = grad;
          ctx.fillRect(tx - beamWidth / 2, 0, beamWidth, ty);
        }
        ctx.restore();
      }

      // 5. Draw Particles
      for (const p of engine.particles) {
        ctx.save();
        ctx.fillStyle = p.color;
        ctx.globalAlpha = Math.max(0, p.life / p.maxLife);
        ctx.fillRect(p.x * tileSize, p.y * tileSize, p.size, p.size);
        ctx.restore();
      }

      // 6. Draw Floating Texts (Combat damage, level ups)
      for (const ft of engine.floatingTexts) {
        ctx.save();
        ctx.fillStyle = ft.color;
        ctx.globalAlpha = ft.alpha;
        ctx.font = `bold ${ft.size || 10}px monospace`;
        ctx.fillText(ft.text, ft.x * tileSize, ft.y * tileSize);
        ctx.restore();
      }

      // 7. Day / Night & Ambient Lighting Tint
      if (engine.laws.dayNightCycle) {
        // Darkness curve: darkest at midnight (timeOfDay = 0.75)
        const nightIntensity = Math.max(0, Math.sin(engine.timeOfDay * Math.PI * 2 - Math.PI / 2) * 0.5 + 0.2);
        if (nightIntensity > 0.05) {
          ctx.save();
          ctx.fillStyle = `rgba(11, 15, 38, ${nightIntensity * 0.55})`;
          ctx.fillRect(0, 0, engine.width * tileSize, engine.height * tileSize);

          // Warm radial lights from castles & village centers
          for (const b of engine.buildings) {
            const bx = b.x * tileSize;
            const by = b.y * tileSize;
            const rad = tileSize * 3;
            const glow = ctx.createRadialGradient(bx, by, 1, bx, by, rad);
            glow.addColorStop(0, 'rgba(251, 191, 36, 0.35)');
            glow.addColorStop(1, 'rgba(251, 191, 36, 0)');
            ctx.fillStyle = glow;
            ctx.beginPath();
            ctx.arc(bx, by, rad, 0, Math.PI * 2);
            ctx.fill();
          }
          ctx.restore();
        }
      }

      // 8. Brush Hover Outline
      if (hoverGrid && engine.isInBounds(hoverGrid.x, hoverGrid.y)) {
        ctx.save();
        const hx = hoverGrid.x * tileSize;
        const hy = hoverGrid.y * tileSize;
        const br = brushSize * tileSize;

        ctx.strokeStyle = '#ffffff';
        ctx.lineWidth = 1.5;
        ctx.setLineDash([4, 4]);

        if (activeTool === 'inspector') {
          ctx.strokeStyle = '#38bdf8';
          ctx.strokeRect(hx - 2, hy - 2, tileSize + 4, tileSize + 4);
        } else {
          ctx.beginPath();
          ctx.arc(hx + tileSize / 2, hy + tileSize / 2, br, 0, Math.PI * 2);
          ctx.stroke();
        }
        ctx.restore();
      }

      ctx.restore();

      animationFrameId = requestAnimationFrame(render);
    };

    animationFrameId = requestAnimationFrame(render);
    return () => cancelAnimationFrame(animationFrameId);
  }, [engine, zoom, pan, activeTool, brushSize, hoverGrid, showBorders, showThoughts]);

  // Canvas Interactions
  const handlePointerDown = (e: React.PointerEvent<HTMLCanvasElement>) => {
    if (e.button === 1 || e.buttons === 4 || e.altKey || activeTool === 'inspector') {
      setIsPanning(true);
      setPanStart({ x: e.clientX - pan.x, y: e.clientY - pan.y });
      return;
    }

    if (e.button === 0) {
      setIsPainting(true);
      applyToolAtClientPos(e.clientX, e.clientY);
    }
  };

  const handlePointerMove = (e: React.PointerEvent<HTMLCanvasElement>) => {
    if (isPanning) {
      setPan({
        x: e.clientX - panStart.x,
        y: e.clientY - panStart.y,
      });
      return;
    }

    const canvas = canvasRef.current;
    if (canvas) {
      const rect = canvas.getBoundingClientRect();
      const clientX = e.clientX - rect.left;
      const clientY = e.clientY - rect.top;
      const tileSize = 12 * zoom;
      const gx = Math.floor((clientX - pan.x) / tileSize);
      const gy = Math.floor((clientY - pan.y) / tileSize);
      setHoverGrid({ x: gx, y: gy });

      if (isPainting && activeTool !== 'inspector') {
        applyToolAtClientPos(e.clientX, e.clientY);
      }
    }
  };

  const handlePointerUp = () => {
    if (isPanning) setIsPanning(false);
    if (isPainting) setIsPainting(false);
  };

  const applyToolAtClientPos = (clientX: number, clientY: number) => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const rect = canvas.getBoundingClientRect();
    const x = clientX - rect.left;
    const y = clientY - rect.top;
    const tileSize = 12 * zoom;

    const gx = Math.floor((x - pan.x) / tileSize);
    const gy = Math.floor((y - pan.y) / tileSize);

    if (activeTool === 'inspector') {
      const clickedUnit = engine.getUnitAt(gx, gy);
      if (clickedUnit) {
        engine.selectedUnitId = clickedUnit.id;
        onSelectUnit(clickedUnit);
        return;
      }
      const tile = engine.grid[gy]?.[gx];
      if (tile?.kingdomId) {
        const k = engine.kingdoms.find((k) => k.id === tile.kingdomId);
        if (k) onSelectKingdom(k);
      } else {
        onSelectUnit(null);
        onSelectKingdom(null);
      }
      return;
    }

    engine.applyTool(activeTool, gx, gy, brushSize);
  };

  const handleWheel = (e: React.WheelEvent<HTMLCanvasElement>) => {
    e.preventDefault();
    const zoomFactor = e.deltaY < 0 ? 1.15 : 0.85;
    const newZoom = Math.min(3.5, Math.max(0.4, zoom * zoomFactor));

    const canvas = canvasRef.current;
    if (canvas) {
      const rect = canvas.getBoundingClientRect();
      const mouseX = e.clientX - rect.left;
      const mouseY = e.clientY - rect.top;

      setPan((prev) => ({
        x: mouseX - (mouseX - prev.x) * (newZoom / zoom),
        y: mouseY - (mouseY - prev.y) * (newZoom / zoom),
      }));
    }
    setZoom(newZoom);
  };

  useEffect(() => {
    const handleResize = () => {
      const canvas = canvasRef.current;
      const container = containerRef.current;
      if (canvas && container) {
        canvas.width = container.clientWidth;
        canvas.height = container.clientHeight;
      }
    };
    handleResize();
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  const hoveredTile =
    hoverGrid && engine.isInBounds(hoverGrid.x, hoverGrid.y)
      ? engine.grid[hoverGrid.y][hoverGrid.x]
      : null;

  const hoveredKingdom = hoveredTile?.kingdomId
    ? engine.kingdoms.find((k) => k.id === hoveredTile.kingdomId)
    : null;

  return (
    <div ref={containerRef} className="relative w-full h-full overflow-hidden bg-slate-950 select-none">
      <canvas
        ref={canvasRef}
        onPointerDown={handlePointerDown}
        onPointerMove={handlePointerMove}
        onPointerUp={handlePointerUp}
        onWheel={handleWheel}
        className="w-full h-full block cursor-crosshair touch-none"
      />

      {/* Floating Canvas Controls */}
      <div className="absolute top-16 right-4 flex flex-col gap-2 z-10">
        <div className="bg-slate-900/90 backdrop-blur border border-slate-700/60 rounded-xl p-1.5 flex flex-col gap-1 shadow-lg">
          <button
            onClick={() => setZoom((z) => Math.min(3.5, z * 1.2))}
            title="Zoom In"
            className="w-8 h-8 flex items-center justify-center text-slate-200 hover:text-white hover:bg-slate-800 rounded-lg text-lg font-bold transition-colors"
          >
            +
          </button>
          <button
            onClick={() => setZoom((z) => Math.max(0.4, z * 0.8))}
            title="Zoom Out"
            className="w-8 h-8 flex items-center justify-center text-slate-200 hover:text-white hover:bg-slate-800 rounded-lg text-lg font-bold transition-colors"
          >
            −
          </button>
          <button
            onClick={() => {
              setZoom(1.2);
              if (containerRef.current) {
                const rect = containerRef.current.getBoundingClientRect();
                const tileSize = 12 * 1.2;
                setPan({
                  x: (rect.width - engine.width * tileSize) / 2,
                  y: (rect.height - engine.height * tileSize) / 2,
                });
              }
            }}
            title="Reset View"
            className="w-8 h-8 flex items-center justify-center text-slate-400 hover:text-white hover:bg-slate-800 rounded-lg text-xs transition-colors"
          >
            ⌖
          </button>
          <div className="h-px bg-slate-800 my-0.5" />
          <button
            onClick={() => setShowBorders((b) => !b)}
            title="Toggle Kingdom Borders"
            className={`w-8 h-8 flex items-center justify-center rounded-lg text-xs font-medium transition-colors ${
              showBorders ? 'text-amber-400 bg-amber-500/20' : 'text-slate-400 hover:bg-slate-800'
            }`}
          >
            🏰
          </button>
          <button
            onClick={() => setShowThoughts((t) => !t)}
            title="Toggle Thought Bubbles"
            className={`w-8 h-8 flex items-center justify-center rounded-lg text-xs font-medium transition-colors ${
              showThoughts ? 'text-sky-400 bg-sky-500/20' : 'text-slate-400 hover:bg-slate-800'
            }`}
          >
            💭
          </button>
        </div>
      </div>

      {/* Hover Info HUD */}
      {hoverGrid && hoveredTile && (
        <div className="absolute bottom-28 left-4 bg-slate-900/85 backdrop-blur-md border border-slate-800 rounded-lg px-3 py-1.5 text-xs text-slate-300 flex items-center gap-3 shadow-md pointer-events-none">
          <span className="font-mono text-slate-400">
            X:{hoverGrid.x} Y:{hoverGrid.y}
          </span>
          <span className="capitalize text-slate-200 font-medium">
            {hoveredTile.type.replace('_', ' ')}
          </span>
          {hoveredKingdom && (
            <span
              className="flex items-center gap-1.5 font-medium"
              style={{ color: hoveredKingdom.color }}
            >
              <span>{hoveredKingdom.bannerSymbol}</span>
              <span>{hoveredKingdom.name}</span>
            </span>
          )}
          {hoveredTile.hasCrop && <span className="text-amber-300">🌾 Wheat Field</span>}
        </div>
      )}
    </div>
  );
};
