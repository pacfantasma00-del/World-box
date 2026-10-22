import React, { useState } from 'react';
import { ToolCategory, ToolType } from '../game/types';

interface PowerBarProps {
  activeTool: ToolType;
  onSelectTool: (tool: ToolType) => void;
  brushSize: number;
  onChangeBrushSize: (size: number) => void;
}

interface ToolDefinition {
  id: ToolType;
  name: string;
  icon: string;
  description: string;
}

export const PowerBar: React.FC<PowerBarProps> = ({
  activeTool,
  onSelectTool,
  brushSize,
  onChangeBrushSize,
}) => {
  const [activeCategory, setActiveCategory] = useState<ToolCategory>('terraforming');

  const categories: { id: ToolCategory; label: string; icon: string }[] = [
    { id: 'terraforming', label: 'World & Biomes', icon: '🌍' },
    { id: 'civilization', label: 'Civilizations', icon: '👑' },
    { id: 'creatures', label: 'Fauna & Monsters', icon: '🐾' },
    { id: 'disasters', label: 'Cataclysms', icon: '⚡' },
    { id: 'nature', label: 'Nature & Power', icon: '✨' },
  ];

  const toolsByCategory: Record<ToolCategory, ToolDefinition[]> = {
    terraforming: [
      { id: 'grass', name: 'Fertile Grass', icon: '🌱', description: 'Paint lush green plains' },
      { id: 'forest', name: 'Dense Forest', icon: '🌲', description: 'Woodlands rich in timber' },
      { id: 'soil', name: 'Rich Soil', icon: '🟤', description: 'Arable farm ground' },
      { id: 'sand', name: 'Desert Sand', icon: '🏖️', description: 'Warm shoreline sand' },
      { id: 'mountain', name: 'Stone Mountains', icon: '⛰️', description: 'Rugged impassable stone' },
      { id: 'snow', name: 'Frozen Snow', icon: '❄️', description: 'Sub-zero glacial tundra' },
      { id: 'shallow_water', name: 'Shallow Waters', icon: '🌊', description: 'Coastal shallow waters' },
      { id: 'deep_ocean', name: 'Deep Ocean', icon: '🐋', description: 'Endless abyssal ocean' },
      { id: 'lava', name: 'Lava Flow', icon: '🌋', description: 'Molten magma; hardens into stone in water' },
      { id: 'sponge', name: 'Divine Sponge', icon: '🧽', description: 'Drains water and cleans surfaces' },
      { id: 'fertilizer', name: 'Bio Fertilizer', icon: '🧪', description: 'Instant grass and tree proliferation' },
    ],
    civilization: [
      { id: 'spawn_human', name: 'Spawn Human', icon: '🧑', description: 'Balanced builders and prolific settlers' },
      { id: 'spawn_elf', name: 'Spawn Elf', icon: '🧝', description: 'Agile woodland archers with long lifespans' },
      { id: 'spawn_dwarf', name: 'Spawn Dwarf', icon: '🧔', description: 'Stout mountain smiths with heavy armor' },
      { id: 'spawn_orc', name: 'Spawn Orc', icon: '👹', description: 'Brutal warmongers who conquer rivals' },
      { id: 'spawn_boat', name: 'Trade Caravel', icon: '⛵', description: 'Sailing ship navigating coastal and deep ocean waters' },
      { id: 'divine_inspiration', name: 'Divine Inspiration', icon: '💡', description: 'Forces settlers to found a kingdom immediately' },
      { id: 'whisper_of_war', name: 'Whisper of Spite', icon: '⚔️', description: 'Instigates war between kingdoms' },
      { id: 'peace_treaty', name: 'Peace Accord', icon: '🕊️', description: 'Signs global peace between all nations' },
      { id: 'coffee_blessing', name: 'Coffee Blessing', icon: '☕', description: 'Supercharges unit speed and mining/building' },
    ],
    creatures: [
      { id: 'spawn_sheep', name: 'Sheep', icon: '🐑', description: 'Docile herbivores that graze on grass' },
      { id: 'spawn_cow', name: 'Cow', icon: '🐄', description: 'Farm animals that provide village meat' },
      { id: 'spawn_wolf', name: 'Dire Wolf', icon: '🐺', description: 'Wild carnivores hunting in packs' },
      { id: 'spawn_bear', name: 'Grizzly Bear', icon: '🐻', description: 'Fierce territorial predator' },
      { id: 'spawn_dragon', name: 'Elder Dragon', icon: '🐉', description: 'Flying beast spitting torrents of fire' },
      { id: 'spawn_zombie', name: 'Undead Zombie', icon: '🧟', description: 'Infectious corpse turning victims on kill' },
      { id: 'spawn_skeleton', name: 'Skeleton Archer', icon: '💀', description: 'Undead warrior armed with bows' },
      { id: 'spawn_demon', name: 'Nether Demon', icon: '👿', description: 'Fiend immune to lava and fire' },
    ],
    disasters: [
      { id: 'lightning', name: 'Lightning Strike', icon: '⚡', description: 'Blasts tiles, ignites fires; chance for Immortality' },
      { id: 'meteor', name: 'Meteor Crash', icon: '☄️', description: 'Cataclysmic asteroid creating lava crater' },
      { id: 'tnt_bomb', name: 'TNT Cluster', icon: '🧨', description: 'Explosive blast shattering terrain and houses' },
      { id: 'tsar_nuke', name: 'Tsar Bomba', icon: '☢️', description: 'Apocalyptic mega-blast vaporizing everything' },
      { id: 'earthquake', name: 'Earthquake', icon: '🌋', description: 'Rips fissures and tears down castles' },
      { id: 'acid_rain', name: 'Acid Rain', icon: '🧪', description: 'Dissolves vegetation and melts rock' },
      { id: 'fire_brush', name: 'Fire Blaze', icon: '🔥', description: 'Ignites forest fires that burn down cities' },
      { id: 'divine_light', name: 'Divine Light', icon: '✨', description: 'Cures plagues, heals wounds, extinguishes fires' },
    ],
    nature: [
      { id: 'inspector', name: 'Inspect Unit', icon: '🔍', description: 'Click any citizen or monster to inspect traits and stats' },
      { id: 'rain', name: 'Cooling Rain', icon: '🌧️', description: 'Extinguishes blazes and waters dry soil' },
      { id: 'plague_spore', name: 'Zombie Virus', icon: '☣️', description: 'Infects units to spread zombie plague' },
      { id: 'cleanse', name: 'Holy Cleanse', icon: '🌟', description: 'Removes all infections and curses' },
    ],
  };

  const currentTools = toolsByCategory[activeCategory];
  const brushSizes = [1, 2, 3, 5];

  return (
    <div className="absolute bottom-3 left-1/2 -translate-x-1/2 w-[95%] max-w-4xl z-20 flex flex-col items-center">
      {/* Sub-bar: Specific Tools & Brush Sizes */}
      <div className="w-full bg-slate-900/95 backdrop-blur-md border border-slate-700/80 rounded-2xl p-2.5 shadow-2xl flex items-center justify-between gap-3">
        {/* Tools Palette Scrollable */}
        <div className="flex items-center gap-1.5 overflow-x-auto pb-1 scrollbar-none flex-1">
          {currentTools.map((tool) => {
            const isSelected = activeTool === tool.id;
            return (
              <button
                key={tool.id}
                onClick={() => onSelectTool(tool.id)}
                title={`${tool.name} — ${tool.description}`}
                className={`relative group shrink-0 flex items-center gap-1.5 px-3 py-2 rounded-xl text-xs font-medium transition-all ${
                  isSelected
                    ? 'bg-amber-500 text-slate-950 font-bold shadow-md shadow-amber-500/30 scale-105'
                    : 'bg-slate-800/90 text-slate-300 hover:bg-slate-750 hover:text-white border border-slate-700/50'
                }`}
              >
                <span className="text-base">{tool.icon}</span>
                <span className="whitespace-nowrap">{tool.name}</span>

                {/* Floating tooltip on hover */}
                <span className="absolute bottom-full mb-2 left-1/2 -translate-x-1/2 hidden group-hover:block bg-slate-950 text-slate-200 text-[11px] px-2.5 py-1 rounded-md border border-slate-700 whitespace-nowrap z-30 pointer-events-none shadow-lg">
                  {tool.description}
                </span>
              </button>
            );
          })}
        </div>

        {/* Brush Size Selector */}
        <div className="flex items-center gap-1 bg-slate-950/80 border border-slate-800 rounded-xl p-1 shrink-0">
          <span className="text-[10px] text-slate-400 px-1 font-semibold uppercase tracking-wider">
            Size
          </span>
          {brushSizes.map((size) => (
            <button
              key={size}
              onClick={() => onChangeBrushSize(size)}
              className={`w-7 h-7 rounded-lg text-xs font-mono font-bold flex items-center justify-center transition-colors ${
                brushSize === size
                  ? 'bg-amber-500 text-slate-950'
                  : 'text-slate-400 hover:text-white hover:bg-slate-800'
              }`}
            >
              {size * 2 - 1}x
            </button>
          ))}
        </div>
      </div>

      {/* Main Category Tabs */}
      <div className="flex items-center gap-1 mt-1.5 bg-slate-950/90 backdrop-blur border border-slate-800 rounded-xl p-1 shadow-lg">
        {categories.map((cat) => (
          <button
            key={cat.id}
            onClick={() => {
              setActiveCategory(cat.id);
              // auto-select first tool in category if current active tool is in different category
              const toolsInCat = toolsByCategory[cat.id];
              if (!toolsInCat.some((t) => t.id === activeTool)) {
                onSelectTool(toolsInCat[0].id);
              }
            }}
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold transition-all ${
              activeCategory === cat.id
                ? 'bg-slate-800 text-amber-400 shadow-sm border border-slate-700'
                : 'text-slate-400 hover:text-slate-200 hover:bg-slate-900'
            }`}
          >
            <span>{cat.icon}</span>
            <span>{cat.label}</span>
          </button>
        ))}
      </div>
    </div>
  );
};
