export type TileType =
  | 'deep_ocean'
  | 'shallow_water'
  | 'sand'
  | 'soil'
  | 'grass'
  | 'forest'
  | 'mountain'
  | 'snow'
  | 'ice'
  | 'lava'
  | 'fire';

export type RaceType = 'human' | 'elf' | 'dwarf' | 'orc';

export type CreatureType =
  | RaceType
  | 'sheep'
  | 'cow'
  | 'wolf'
  | 'bear'
  | 'dragon'
  | 'zombie'
  | 'skeleton'
  | 'demon'
  | 'necromancer'
  | 'boat';

export type TraitType =
  | 'immortal'
  | 'giant'
  | 'tiny'
  | 'genius'
  | 'bloodthirsty'
  | 'fireproof'
  | 'blessed'
  | 'infected'
  | 'regeneration'
  | 'strong'
  | 'swift';

export interface TraitInfo {
  id: TraitType;
  name: string;
  description: string;
  icon: string;
  color: string;
}

export type BuildingType =
  | 'tent'
  | 'hut'
  | 'house'
  | 'castle'
  | 'watchtower'
  | 'dock'
  | 'arcane_obelisk';

export interface Building {
  id: string;
  x: number;
  y: number;
  type: BuildingType;
  hp: number;
  maxHp: number;
  villageId: string;
  kingdomId: string;
}

export interface Village {
  id: string;
  name: string;
  kingdomId: string;
  race: RaceType;
  centerX: number;
  centerY: number;
  wood: number;
  stone: number;
  wheat: number;
  level: number;
  foundedYear: number;
}

export type KingdomEra = 'tribal' | 'bronze' | 'iron' | 'medieval' | 'arcane';

export interface Kingdom {
  id: string;
  name: string;
  color: string;
  bannerSymbol: string;
  race: RaceType;
  kingId: string | null;
  foundedYear: number;
  relations: Record<string, 'peace' | 'war' | 'alliance'>;
  totalKills: number;
  era: KingdomEra;
  culture: number;
  gold: number;
  technologyProgress: number;
}

export type UnitProfession =
  | 'ruler'
  | 'warrior'
  | 'archer'
  | 'farmer'
  | 'builder'
  | 'miner'
  | 'settler'
  | 'civilian'
  | 'wild'
  | 'undead'
  | 'captain';

export type UnitMood =
  | 'inspired'
  | 'content'
  | 'fearful'
  | 'ambitious'
  | 'vengeful'
  | 'peaceful'
  | 'enlightened';

export interface Unit {
  id: string;
  name: string;
  type: CreatureType;
  race?: RaceType;
  kingdomId?: string;
  villageId?: string;
  x: number;
  y: number;
  targetX?: number;
  targetY?: number;
  actionState: 'idle' | 'wandering' | 'farming' | 'building' | 'gathering' | 'fighting' | 'fleeing';
  hp: number;
  maxHp: number;
  damage: number;
  speed: number;
  kills: number;
  age: number;
  profession: UnitProfession;
  traits: TraitType[];
  weapon: string;
  armor: string;
  color?: string;

  // Autonomous Cognitive Consciousness & Evolution Loop
  thought: string;
  mood: UnitMood;
  level: number;
  xp: number;
  maxXp: number;
  heroTitle?: string;
}

export interface Tile {
  type: TileType;
  elevation: number;
  temperature: number;
  moisture: number;
  kingdomId?: string;
  villageId?: string;
  hasCrop?: boolean;
  cropGrowth?: number;
  fireTicks?: number;
}

export interface DisasterEffect {
  id: string;
  type: 'lightning' | 'meteor' | 'fireball' | 'explosion' | 'acid_drop' | 'divine_ray' | 'earthquake';
  x: number;
  y: number;
  targetX: number;
  targetY: number;
  radius: number;
  progress: number; // 0 to 1
  durationMs: number;
  createdAt: number;
  color: string;
}

export interface FloatingText {
  id: string;
  text: string;
  x: number;
  y: number;
  color: string;
  alpha: number;
  vy: number;
  size?: number;
}

export interface WorldParticle {
  id: string;
  x: number;
  y: number;
  vx: number;
  vy: number;
  life: number;
  maxLife: number;
  color: string;
  size: number;
}

export interface ChronicleEvent {
  id: string;
  year: number;
  month: number;
  text: string;
  icon: string;
  type: 'war' | 'peace' | 'era' | 'hero' | 'disaster' | 'kingdom';
}

export interface WorldLaws {
  peaceWorld: boolean;
  hungerEnabled: boolean;
  disastersEnabled: boolean;
  plagueSpread: boolean;
  fastCivilization: boolean;
  eternalFire: boolean;
  dayNightCycle: boolean;
}

export type ToolCategory =
  | 'terraforming'
  | 'civilization'
  | 'creatures'
  | 'disasters'
  | 'nature';

export type ToolType =
  // Terraforming
  | 'deep_ocean'
  | 'shallow_water'
  | 'sand'
  | 'grass'
  | 'forest'
  | 'mountain'
  | 'snow'
  | 'lava'
  | 'soil'
  | 'sponge'
  | 'fertilizer'
  // Civilizations
  | 'spawn_human'
  | 'spawn_elf'
  | 'spawn_dwarf'
  | 'spawn_orc'
  | 'spawn_boat'
  | 'divine_inspiration'
  | 'whisper_of_war'
  | 'peace_treaty'
  | 'coffee_blessing'
  // Creatures
  | 'spawn_sheep'
  | 'spawn_cow'
  | 'spawn_wolf'
  | 'spawn_bear'
  | 'spawn_dragon'
  | 'spawn_zombie'
  | 'spawn_skeleton'
  | 'spawn_demon'
  | 'spawn_necromancer'
  // Disasters
  | 'lightning'
  | 'meteor'
  | 'tnt_bomb'
  | 'tsar_nuke'
  | 'earthquake'
  | 'volcano'
  | 'acid_rain'
  | 'divine_light'
  | 'fire_brush'
  // Nature / Inspector
  | 'inspector'
  | 'rain'
  | 'temperature_heat'
  | 'temperature_cold'
  | 'plague_spore'
  | 'cleanse';
