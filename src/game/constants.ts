import { TraitInfo, TraitType, RaceType, KingdomEra, UnitMood } from './types';

export const WORLD_WIDTH = 100;
export const WORLD_HEIGHT = 65;

export const TILE_COLORS: Record<string, string> = {
  deep_ocean: '#1e3a8a', // Deep Blue
  shallow_water: '#38bdf8', // Cyan / Light Blue
  sand: '#fde047', // Warm Sand Yellow
  soil: '#78350f', // Rich Soil
  grass: '#22c55e', // Vibrant Grass Green
  forest: '#15803d', // Dark Pine Green
  mountain: '#64748b', // Slate Stone
  snow: '#f8fafc', // Snowy Peak White
  ice: '#bae6fd', // Glacial Blue
  lava: '#ef4444', // Fiery Red/Orange
  fire: '#f97316', // Blaze Orange
};

export const KINGDOM_COLORS = [
  '#ef4444', // Red
  '#3b82f6', // Blue
  '#10b981', // Emerald
  '#f59e0b', // Amber
  '#8b5cf6', // Violet
  '#ec4899', // Pink
  '#06b6d4', // Cyan
  '#eab308', // Gold
  '#14b8a6', // Teal
  '#f97316', // Orange
];

export const KINGDOM_SYMBOLS = ['👑', '⚔️', '🛡️', '🦅', '🦁', '🐉', '🌲', '⚒️', '⚡', '🌙', '☀️', '🔥'];

export const ERA_DETAILS: Record<KingdomEra, { name: string; icon: string; description: string; nextCost: number }> = {
  tribal: {
    name: 'Tribal Era',
    icon: '⛺',
    description: 'Campfires, wooden spears, rudimentary tents and nomadic foraging.',
    nextCost: 100,
  },
  bronze: {
    name: 'Bronze Age',
    icon: '🛖',
    description: 'Permanent wooden huts, organized wheat farms, and village militias.',
    nextCost: 300,
  },
  iron: {
    name: 'Iron Age',
    icon: '🏰',
    description: 'Stone masonry, iron weaponry, watchtowers, and territory expansion.',
    nextCost: 700,
  },
  medieval: {
    name: 'Medieval Kingdom',
    icon: '⚔️',
    description: 'Grand royal castles, fortified town walls, coastal docks, and sailing trade fleets.',
    nextCost: 1500,
  },
  arcane: {
    name: 'Arcane Golden Age',
    icon: '✨',
    description: 'Enchanted stone obelisks, legendary mithril arms, and divine enlightenment.',
    nextCost: 99999,
  },
};

export const MOOD_DETAILS: Record<UnitMood, { name: string; icon: string; color: string }> = {
  inspired: { name: 'Inspired', icon: '💡', color: '#facc15' },
  content: { name: 'Content', icon: '😊', color: '#4ade80' },
  fearful: { name: 'Fearful', icon: '😨', color: '#f87171' },
  ambitious: { name: 'Ambitious', icon: '👑', color: '#c084fc' },
  vengeful: { name: 'Vengeful', icon: '🔥', color: '#ef4444' },
  peaceful: { name: 'Peaceful', icon: '🕊️', color: '#38bdf8' },
  enlightened: { name: 'Enlightened', icon: '🌟', color: '#fbbf24' },
};

export const HERO_TITLES = [
  'the Brave',
  'the Swift',
  'the Giant Slayer',
  'the Ironborn',
  'the Wise',
  'the Undying',
  'the Stormbringer',
  'the Blade Master',
  'the Architect',
  'the Dragonbane',
  'the Golden Monarch',
  'the Savage',
];

export const AUTONOMOUS_THOUGHTS: Record<UnitMood, string[]> = {
  inspired: [
    'Planejando construir novos santuários de pedra para honrar os deuses.',
    'Sinto que este reino alcançará uma era dourada de prosperidade.',
    'A energia arcana do mundo está pulsando sob os meus pés.',
    'Desenhei um novo projeto de fortificação para o meu povo.',
  ],
  content: [
    'O cheiro do trigo maduro traz paz à nossa aldeia.',
    'O sol está radiante sobre os campos do reino hoje.',
    'Nossa despensa tem alimento suficiente para toda a estação.',
    'A vida na vila é tranquila sob a proteção do nosso monarca.',
  ],
  fearful: [
    'Ouço rugidos de monstros e uivos famintos vindos das matas...',
    'Tremo com os relâmpagos e cataclismos que rasgam os céus.',
    'As frotas de guerra inimigas estão avançando na nossa fronteira!',
    'Temo que a praga zumbi esteja se espalhando pelas vilas vizinhas.',
  ],
  ambitious: [
    'Desejo liderar o exército e conquistar mais territórios para a coroa.',
    'Vou forjar a espada mais afiada de todo o continente.',
    'Um dia meu nome será entalhado na pedra como o maior herói do reino.',
    'Precisamos avançar nossa civilização para a era do ferro imediatamente.',
  ],
  vengeful: [
    'Os invasores pagarão caro por terem queimado nossas colheitas.',
    'Minha lâmina só descansará quando o rei inimigo for derrotado.',
    'A honra do meu clã será lavada com a queda de seus castelos!',
    'Vingança pelas almas dos nossos guerreiros caídos na batalha.',
  ],
  peaceful: [
    'Contemplando as ondas do oceano que banham nossa costa.',
    'Espero que o tratado de paz dure por muitas gerações.',
    'Cuidando dos animais da fazenda com dedicação e carinho.',
    'A harmonia com a floresta nos concede sabedoria ancestral.',
  ],
  enlightened: [
    'Percebo os desígnios superiores do criador que olha do alto.',
    'A vida e a morte são apenas partes de um grande ciclo infinito.',
    'Toquei a luz divina e meu espírito se tornou imorredouro.',
    'As estrelas sussurram segredos de eras ainda não nascidas.',
  ],
};

export const TRAITS_DATA: Record<TraitType, TraitInfo> = {
  immortal: {
    id: 'immortal',
    name: 'Immortal',
    description: 'Immune to aging and natural death.',
    icon: '✨',
    color: '#eab308',
  },
  giant: {
    id: 'giant',
    name: 'Giant',
    description: '+50% Max HP, +30% Attack damage, towering presence.',
    icon: '🗿',
    color: '#f97316',
  },
  tiny: {
    id: 'tiny',
    name: 'Tiny',
    description: '-30% Max HP, +25% Speed, agile and nimble.',
    icon: '🐭',
    color: '#38bdf8',
  },
  genius: {
    id: 'genius',
    name: 'Genius',
    description: 'Builds cities faster and leads armies with tactical wisdom.',
    icon: '🧠',
    color: '#a855f7',
  },
  bloodthirsty: {
    id: 'bloodthirsty',
    name: 'Bloodthirsty',
    description: '+40% Attack damage, eagerly seeks enemies in battle.',
    icon: '🩸',
    color: '#dc2626',
  },
  fireproof: {
    id: 'fireproof',
    name: 'Fireproof',
    description: 'Completely immune to burning and lava damage.',
    icon: '🔥',
    color: '#f59e0b',
  },
  blessed: {
    id: 'blessed',
    name: 'Blessed',
    description: 'Protected by divine light. +30% to all attributes.',
    icon: '🕊️',
    color: '#fef08a',
  },
  infected: {
    id: 'infected',
    name: 'Infected (Zombie Virus)',
    description: 'Slowly perishes and rises as an aggressive Zombie upon death.',
    icon: '☣️',
    color: '#84cc16',
  },
  regeneration: {
    id: 'regeneration',
    name: 'Regeneration',
    description: 'Rapidly recovers health over time.',
    icon: '💚',
    color: '#10b981',
  },
  strong: {
    id: 'strong',
    name: 'Mighty',
    description: 'Physical prowess grants +20% damage.',
    icon: '💪',
    color: '#b45309',
  },
  swift: {
    id: 'swift',
    name: 'Swift',
    description: '+30% Movement speed.',
    icon: '⚡',
    color: '#06b6d4',
  },
};

export const RACE_CONFIGS: Record<
  RaceType,
  {
    name: string;
    description: string;
    baseHp: number;
    baseDamage: number;
    baseSpeed: number;
    preferredBiome: string;
    innateTraits: TraitType[];
    kingdomNames: string[];
    firstNames: string[];
  }
> = {
  human: {
    name: 'Human',
    description: 'Adaptable settlers, prolific builders with balanced combat and trade.',
    baseHp: 100,
    baseDamage: 12,
    baseSpeed: 1.1,
    preferredBiome: 'grass',
    innateTraits: [],
    kingdomNames: [
      'Kingdom of Eldoria',
      'Valoria Empire',
      'Crown of Arandel',
      'Kingdom of Stormhold',
      'Highland Realms',
      'Silvervale Principality',
    ],
    firstNames: ['Arthur', 'Garrick', 'Elena', 'Rowan', 'Cedric', 'Gwen', 'Marcus', 'Theron', 'Lyra', 'Darius'],
  },
  elf: {
    name: 'Elf',
    description: 'Agile woodland dwellers with high lifespan, natural archery, and peace with nature.',
    baseHp: 85,
    baseDamage: 15,
    baseSpeed: 1.35,
    preferredBiome: 'forest',
    innateTraits: ['swift'],
    kingdomNames: [
      'Silvanas Dominion',
      'Sunleaf Enclave',
      'Emerald Glade',
      'Lothlorien Realm',
      'Starfall Sanctuary',
    ],
    firstNames: ['Aeloria', 'Faelar', 'Sylphira', 'Eldrin', 'Aerith', 'Thalor', 'Moriel', 'Vespera', 'Kaelen'],
  },
  dwarf: {
    name: 'Dwarf',
    description: 'Hardy mountain smiths, heavy armor, slower speed but massive health reserves.',
    baseHp: 150,
    baseDamage: 14,
    baseSpeed: 0.9,
    preferredBiome: 'mountain',
    innateTraits: ['strong'],
    kingdomNames: [
      'Ironforge Hold',
      'Stonehammer Clan',
      'Deepdelve Citadel',
      'Anvilgard Empire',
      'Karak-Azul',
    ],
    firstNames: ['Thrum', 'Gimli', 'Brokk', 'Dvalin', 'Brunhild', 'Orsik', 'Krag', 'Torin', 'Vondal'],
  },
  orc: {
    name: 'Orc',
    description: 'Brutal and warlike clans with savage melee power, constantly seeking conquest.',
    baseHp: 120,
    baseDamage: 18,
    baseSpeed: 1.15,
    preferredBiome: 'soil',
    innateTraits: ['bloodthirsty'],
    kingdomNames: [
      'Gorgoroth Horde',
      'Bloodskull Clan',
      'Ironfang Warband',
      'Blackrock Dominion',
      'Draenor Tribe',
    ],
    firstNames: ['Grom', 'Azog', 'Kragh', 'Ugluk', 'Mogor', 'Draka', 'Korg', 'Thrall', 'Brak', 'Gorza'],
  },
};
