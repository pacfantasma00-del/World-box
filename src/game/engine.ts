import {
  Tile,
  TileType,
  Unit,
  Kingdom,
  Village,
  Building,
  DisasterEffect,
  WorldLaws,
  ToolType,
  CreatureType,
  RaceType,
  TraitType,
  UnitProfession,
  UnitMood,
  FloatingText,
  WorldParticle,
  ChronicleEvent,
  KingdomEra,
} from './types';
import {
  WORLD_WIDTH,
  WORLD_HEIGHT,
  KINGDOM_COLORS,
  KINGDOM_SYMBOLS,
  RACE_CONFIGS,
  TRAITS_DATA,
  ERA_DETAILS,
  AUTONOMOUS_THOUGHTS,
  HERO_TITLES,
} from './constants';
import { generateWorld, WorldPreset } from './worldGen';
import { sounds } from './sound';

export class GameEngine {
  public width: number = WORLD_WIDTH;
  public height: number = WORLD_HEIGHT;
  public grid: Tile[][] = [];
  public units: Unit[] = [];
  public kingdoms: Kingdom[] = [];
  public villages: Village[] = [];
  public buildings: Building[] = [];
  public effects: DisasterEffect[] = [];
  public floatingTexts: FloatingText[] = [];
  public particles: WorldParticle[] = [];
  public chronicle: ChronicleEvent[] = [];

  public laws: WorldLaws = {
    peaceWorld: false,
    hungerEnabled: true,
    disastersEnabled: true,
    plagueSpread: true,
    fastCivilization: false,
    eternalFire: false,
    dayNightCycle: true,
  };

  public gameYear: number = 1;
  public tickCount: number = 0;
  public speed: number = 1; // 0, 1, 2, 5
  public selectedUnitId: string | null = null;
  public selectedKingdomId: string | null = null;
  public timeOfDay: number = 0.25; // 0: dawn, 0.25: noon, 0.5: dusk, 0.75: midnight

  private kingdomNameIndex: Record<RaceType, number> = {
    human: 0,
    elf: 0,
    dwarf: 0,
    orc: 0,
  };

  constructor(preset: WorldPreset = 'continents', seed?: number) {
    this.resetWorld(preset, seed);
  }

  public resetWorld(preset: WorldPreset = 'continents', seed?: number) {
    this.grid = generateWorld(preset, this.width, this.height, seed);
    this.units = [];
    this.kingdoms = [];
    this.villages = [];
    this.buildings = [];
    this.effects = [];
    this.floatingTexts = [];
    this.particles = [];
    this.chronicle = [];
    this.gameYear = 1;
    this.tickCount = 0;
    this.timeOfDay = 0.25;
    this.selectedUnitId = null;
    this.selectedKingdomId = null;

    this.addChronicle(
      'A new world has been formed from the primordial void.',
      '🌍',
      'disaster'
    );

    // Seed initial peaceful fauna on temperate land
    this.seedInitialCreatures();
  }

  private seedInitialCreatures() {
    let sheepCount = 0;
    for (let y = 10; y < this.height - 10; y += 4) {
      for (let x = 10; x < this.width - 10; x += 4) {
        if (this.grid[y][x].type === 'grass' && Math.random() < 0.15 && sheepCount < 8) {
          this.spawnCreature('sheep', x, y);
          sheepCount++;
        }
      }
    }
  }

  public addChronicle(text: string, icon: string, type: ChronicleEvent['type']) {
    const month = (Math.floor(this.tickCount / 5) % 12) + 1;
    this.chronicle.unshift({
      id: `ev-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`,
      year: this.gameYear,
      month,
      text,
      icon,
      type,
    });
    // Keep last 60
    if (this.chronicle.length > 60) {
      this.chronicle.pop();
    }
  }

  public addFloatingText(text: string, x: number, y: number, color: string = '#f8fafc', size: number = 10) {
    this.floatingTexts.push({
      id: `ft-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`,
      text,
      x,
      y,
      color,
      alpha: 1,
      vy: -0.04,
      size,
    });
  }

  public addParticle(x: number, y: number, vx: number, vy: number, color: string, life: number = 20, size: number = 2) {
    this.particles.push({
      id: `p-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`,
      x,
      y,
      vx,
      vy,
      life,
      maxLife: life,
      color,
      size,
    });
  }

  public tick() {
    if (this.speed === 0) return;

    for (let s = 0; s < this.speed; s++) {
      this.tickCount++;
      if (this.tickCount % 60 === 0) {
        this.gameYear++;
      }

      // Day / Night cycle progression
      if (this.laws.dayNightCycle) {
        this.timeOfDay = (this.timeOfDay + 0.0005) % 1;
      }

      this.updateTerrain();
      this.updateEffects();
      this.updateFloatingTextsAndParticles();
      this.updateUnits();
      this.updateCivilizationEras();
      this.updateDiplomacy();
    }
  }

  // --- Terrain Cellular Automata & Ambient Particles ---
  private updateTerrain() {
    const fireSpreads: { x: number; y: number }[] = [];
    const fireExtinguishes: { x: number; y: number }[] = [];

    const sampleRate = 0.08;
    for (let y = 0; y < this.height; y++) {
      for (let x = 0; x < this.width; x++) {
        const tile = this.grid[y][x];

        // Crop growth
        if (tile.hasCrop && tile.cropGrowth !== undefined && tile.cropGrowth < 100) {
          tile.cropGrowth += this.laws.fastCivilization ? 5 : 2;
        }

        // Fire mechanics
        if (tile.type === 'fire') {
          if (Math.random() < 0.2) {
            this.addParticle(
              x + Math.random(),
              y + Math.random(),
              (Math.random() - 0.5) * 0.03,
              -0.05,
              '#fb923c',
              15,
              1.5
            );
          }

          if (!this.laws.eternalFire) {
            tile.fireTicks = (tile.fireTicks || 0) + 1;
            if (tile.fireTicks > 25) {
              fireExtinguishes.push({ x, y });
            }
          }

          const neighbors = this.getNeighbors(x, y);
          for (const n of neighbors) {
            const nt = this.grid[n.y][n.x];
            if ((nt.type === 'forest' || nt.type === 'grass' || nt.hasCrop) && Math.random() < 0.12) {
              fireSpreads.push(n);
            }
          }
        }

        // Lava ambient embers & water collision
        if (tile.type === 'lava' && Math.random() < sampleRate) {
          if (Math.random() < 0.15) {
            this.addParticle(
              x + Math.random(),
              y + Math.random(),
              (Math.random() - 0.5) * 0.04,
              -0.04,
              '#f87171',
              18,
              1.5
            );
          }

          const neighbors = this.getNeighbors(x, y);
          for (const n of neighbors) {
            const nt = this.grid[n.y][n.x];
            if (nt.type === 'deep_ocean' || nt.type === 'shallow_water' || nt.type === 'ice') {
              nt.type = 'mountain';
              tile.type = 'mountain';
              this.addFloatingText('Stone Formed', x, y, '#94a3b8', 8);
              break;
            }
          }
        }
      }
    }

    for (const p of fireExtinguishes) {
      const tile = this.grid[p.y][p.x];
      tile.type = 'soil';
      tile.fireTicks = 0;
      tile.hasCrop = false;
    }
    for (const p of fireSpreads) {
      const tile = this.grid[p.y][p.x];
      tile.type = 'fire';
      tile.fireTicks = 0;
      tile.hasCrop = false;
    }
  }

  // --- Floating Texts & Particles Update ---
  private updateFloatingTextsAndParticles() {
    for (let i = this.floatingTexts.length - 1; i >= 0; i--) {
      const ft = this.floatingTexts[i];
      ft.y += ft.vy;
      ft.alpha -= 0.02;
      if (ft.alpha <= 0) {
        this.floatingTexts.splice(i, 1);
      }
    }

    for (let i = this.particles.length - 1; i >= 0; i--) {
      const p = this.particles[i];
      p.x += p.vx;
      p.y += p.vy;
      p.life--;
      if (p.life <= 0) {
        this.particles.splice(i, 1);
      }
    }
  }

  // --- Disasters & Visual Effects ---
  private updateEffects() {
    const now = Date.now();
    for (let i = this.effects.length - 1; i >= 0; i--) {
      const effect = this.effects[i];
      const elapsed = now - effect.createdAt;
      effect.progress = Math.min(1, elapsed / effect.durationMs);

      if (effect.progress >= 1) {
        this.applyDisasterImpact(effect);
        this.effects.splice(i, 1);
      }
    }
  }

  private applyDisasterImpact(effect: DisasterEffect) {
    const cx = Math.floor(effect.targetX);
    const cy = Math.floor(effect.targetY);
    const r = effect.radius;

    if (effect.type === 'lightning') {
      sounds.playThunder();
      this.damageUnitsInRadius(cx, cy, r, 120, 'lightning');
      this.igniteTiles(cx, cy, r);
      this.addFloatingText('⚡ LIGHTNING!', cx, cy, '#facc15', 12);
      this.addChronicle(`Lightning struck at (${cx}, ${cy})!`, '⚡', 'disaster');
    } else if (effect.type === 'meteor') {
      sounds.playExplosion();
      this.craterTerrain(cx, cy, r, 'lava');
      this.damageUnitsInRadius(cx, cy, r * 1.5, 300, 'meteor');
      this.addFloatingText('☄️ METEOR IMPACT!', cx, cy, '#ea580c', 14);
      this.addChronicle(`A cataclysmic meteor crashed at (${cx}, ${cy})!`, '☄️', 'disaster');
    } else if (effect.type === 'explosion') {
      sounds.playExplosion();
      this.craterTerrain(cx, cy, r, 'soil');
      this.damageUnitsInRadius(cx, cy, r * 1.2, 180, 'explosion');
      this.addFloatingText('💥 EXPLOSION!', cx, cy, '#ef4444', 12);
    } else if (effect.type === 'earthquake') {
      sounds.playExplosion();
      this.crackTerrain(cx, cy, r);
      this.damageUnitsInRadius(cx, cy, r, 70, 'earthquake');
      this.addFloatingText('🌋 EARTHQUAKE!', cx, cy, '#78350f', 12);
    } else if (effect.type === 'acid_drop') {
      this.meltTerrain(cx, cy, r);
      this.damageUnitsInRadius(cx, cy, r, 100, 'acid');
      this.addFloatingText('🧪 ACID RAIN!', cx, cy, '#84cc16', 11);
    } else if (effect.type === 'divine_ray') {
      sounds.playDivine();
      this.blessUnitsInRadius(cx, cy, r);
      this.addFloatingText('✨ DIVINE GRACE!', cx, cy, '#fef08a', 13);
    }
  }

  private damageUnitsInRadius(cx: number, cy: number, radius: number, damage: number, source: string) {
    for (const unit of this.units) {
      const dx = unit.x - cx;
      const dy = unit.y - cy;
      if (Math.hypot(dx, dy) <= radius) {
        if (source === 'lightning' && Math.random() < 0.25) {
          if (!unit.traits.includes('immortal')) {
            unit.traits.push('immortal');
            this.addFloatingText('✨ IMMORTAL!', unit.x, unit.y, '#eab308', 12);
            this.addChronicle(`${unit.name} survived lightning and gained Immortality!`, '✨', 'hero');
          }
          if (!unit.traits.includes('fireproof')) {
            unit.traits.push('fireproof');
          }
        }
        if (unit.traits.includes('fireproof') && (source === 'lava' || source === 'meteor')) {
          continue;
        }
        unit.hp -= damage;
        this.addFloatingText(`-${damage}`, unit.x, unit.y, '#ef4444');
      }
    }
  }

  private blessUnitsInRadius(cx: number, cy: number, radius: number) {
    for (const unit of this.units) {
      const dx = unit.x - cx;
      const dy = unit.y - cy;
      if (Math.hypot(dx, dy) <= radius) {
        unit.hp = unit.maxHp;
        unit.traits = unit.traits.filter((t) => t !== 'infected');
        if (!unit.traits.includes('blessed')) {
          unit.traits.push('blessed');
        }
        unit.mood = 'enlightened';
        this.addFloatingText('HEALED & BLESSED 🕊️', unit.x, unit.y, '#fef08a', 11);
      }
    }
    for (let dy = -radius; dy <= radius; dy++) {
      for (let dx = -radius; dx <= radius; dx++) {
        const nx = cx + dx;
        const ny = cy + dy;
        if (this.isInBounds(nx, ny) && this.grid[ny][nx].type === 'fire') {
          this.grid[ny][nx].type = 'grass';
        }
      }
    }
  }

  private craterTerrain(cx: number, cy: number, radius: number, centerTile: TileType) {
    for (let dy = -radius; dy <= radius; dy++) {
      for (let dx = -radius; dx <= radius; dx++) {
        const nx = cx + dx;
        const ny = cy + dy;
        const d = Math.hypot(dx, dy);
        if (this.isInBounds(nx, ny) && d <= radius) {
          if (d <= radius * 0.45) {
            this.grid[ny][nx].type = centerTile;
          } else if (d <= radius * 0.8) {
            this.grid[ny][nx].type = 'soil';
          } else if (this.grid[ny][nx].type === 'forest') {
            this.grid[ny][nx].type = 'fire';
          }
          this.grid[ny][nx].hasCrop = false;
        }
      }
    }
  }

  private crackTerrain(cx: number, cy: number, length: number) {
    let curX = cx;
    let curY = cy;
    for (let i = 0; i < length * 2; i++) {
      if (this.isInBounds(curX, curY)) {
        this.grid[curY][curX].type = 'deep_ocean';
      }
      curX += Math.round((Math.random() - 0.5) * 2);
      curY += Math.round(Math.random() > 0.5 ? 1 : 0);
    }
  }

  private meltTerrain(cx: number, cy: number, radius: number) {
    for (let dy = -radius; dy <= radius; dy++) {
      for (let dx = -radius; dx <= radius; dx++) {
        const nx = cx + dx;
        const ny = cy + dy;
        if (this.isInBounds(nx, ny) && Math.hypot(dx, dy) <= radius) {
          const t = this.grid[ny][nx];
          if (t.type === 'mountain' || t.type === 'snow') {
            t.type = 'soil';
          } else if (t.type === 'forest' || t.type === 'grass') {
            t.type = 'sand';
          }
          t.hasCrop = false;
        }
      }
    }
  }

  private igniteTiles(cx: number, cy: number, radius: number) {
    for (let dy = -radius; dy <= radius; dy++) {
      for (let dx = -radius; dx <= radius; dx++) {
        const nx = cx + dx;
        const ny = cy + dy;
        if (this.isInBounds(nx, ny) && Math.hypot(dx, dy) <= radius) {
          const t = this.grid[ny][nx];
          if (t.type === 'forest' || t.type === 'grass' || t.hasCrop) {
            t.type = 'fire';
            t.fireTicks = 0;
            t.hasCrop = false;
          }
        }
      }
    }
  }

  // --- Units AI, Consciousness & Leveling Loop ---
  private updateUnits() {
    const newUnits: Unit[] = [];

    for (let i = this.units.length - 1; i >= 0; i--) {
      const unit = this.units[i];

      // Age update
      if (this.tickCount % 60 === 0 && !unit.traits.includes('immortal')) {
        unit.age++;
        if (unit.age > 80 && Math.random() < 0.15) {
          unit.hp = 0;
        }
      }

      // Traits effects
      if (unit.traits.includes('regeneration') && unit.hp < unit.maxHp) {
        unit.hp = Math.min(unit.maxHp, unit.hp + 1);
      }

      // Infection / Plague
      if (unit.traits.includes('infected')) {
        unit.hp -= 0.5;
        if (this.laws.plagueSpread && Math.random() < 0.05) {
          for (const other of this.units) {
            if (other.id !== unit.id && Math.hypot(other.x - unit.x, other.y - unit.y) < 2) {
              if (!other.traits.includes('infected') && !other.traits.includes('blessed')) {
                other.traits.push('infected');
                this.addFloatingText('INFECTED ☣️', other.x, other.y, '#84cc16');
              }
            }
          }
        }
      }

      // Environment damage
      const currentTile = this.grid[Math.floor(unit.y)]?.[Math.floor(unit.x)];
      if (currentTile) {
        if (currentTile.type === 'lava' && !unit.traits.includes('fireproof')) {
          unit.hp -= 20;
          this.addFloatingText('-20 🔥', unit.x, unit.y, '#ef4444');
        } else if (currentTile.type === 'fire' && !unit.traits.includes('fireproof')) {
          unit.hp -= 8;
          this.addFloatingText('-8 🔥', unit.x, unit.y, '#f97316');
        } else if (
          (currentTile.type === 'deep_ocean' || currentTile.type === 'shallow_water') &&
          unit.type !== 'dragon' &&
          unit.type !== 'boat'
        ) {
          unit.hp -= 0.3;
        }
      }

      // Death check
      if (unit.hp <= 0) {
        if (unit.traits.includes('infected') && unit.type !== 'zombie') {
          const zombie: Unit = {
            id: `zombie-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`,
            name: `Zombie ${unit.name}`,
            type: 'zombie',
            x: unit.x,
            y: unit.y,
            actionState: 'fighting',
            hp: 80,
            maxHp: 80,
            damage: 16,
            speed: 1.0,
            kills: 0,
            age: 1,
            profession: 'undead',
            traits: ['bloodthirsty'],
            weapon: 'Infected Claws',
            armor: 'Rotting Skin',
            color: '#65a30d',
            thought: 'Ressuscitado faminto por carne viva...',
            mood: 'vengeful',
            level: unit.level,
            xp: 0,
            maxXp: 100,
          };
          newUnits.push(zombie);
          this.addFloatingText('🧟 RISEN AS ZOMBIE!', unit.x, unit.y, '#84cc16', 11);
        }
        this.units.splice(i, 1);
        continue;
      }

      // Autonomous Cognitive Thought Loop
      if (this.tickCount % 90 === 0 && Math.random() < 0.4) {
        this.updateAutonomousThought(unit);
      }

      // Behavior execution & XP gain
      this.executeUnitBehavior(unit);
    }

    if (newUnits.length > 0) {
      this.units.push(...newUnits);
    }

    // Civilizations Settlement Check
    this.checkCivilizationSettlements();
  }

  private updateAutonomousThought(unit: Unit) {
    // Determine dynamic mood based on unit context
    if (unit.hp < unit.maxHp * 0.35) {
      unit.mood = 'fearful';
    } else if (unit.traits.includes('blessed')) {
      unit.mood = 'enlightened';
    } else if (unit.actionState === 'fighting') {
      unit.mood = 'vengeful';
    } else if (unit.level >= 5 || unit.profession === 'ruler') {
      unit.mood = 'ambitious';
    } else if (unit.profession === 'builder') {
      unit.mood = 'inspired';
    } else {
      unit.mood = 'content';
    }

    const moodThoughts = AUTONOMOUS_THOUGHTS[unit.mood] || AUTONOMOUS_THOUGHTS.content;
    unit.thought = moodThoughts[Math.floor(Math.random() * moodThoughts.length)];
  }

  public grantXp(unit: Unit, amount: number) {
    unit.xp += amount;
    if (unit.xp >= unit.maxXp) {
      unit.level++;
      unit.xp = 0;
      unit.maxXp = Math.floor(unit.maxXp * 1.5);
      unit.maxHp += 25;
      unit.hp = unit.maxHp;
      unit.damage += 4;
      unit.speed = Math.min(2.5, unit.speed + 0.05);

      this.addFloatingText(`⭐ LEVEL ${unit.level}!`, unit.x, unit.y, '#facc15', 12);
      sounds.playDivine();

      // Equipment upgrades
      if (unit.level === 3) {
        unit.weapon = unit.race === 'elf' ? 'Composite Longbow' : unit.race === 'dwarf' ? 'Steel Battleaxe' : 'Broad Iron Sword';
        unit.armor = 'Chainmail Shirt';
      } else if (unit.level === 5) {
        const title = HERO_TITLES[Math.floor(Math.random() * HERO_TITLES.length)];
        unit.heroTitle = title;
        unit.name = `${unit.name} ${title}`;
        unit.weapon = unit.race === 'elf' ? 'Sunfire Bow' : 'Mithril Longsword';
        unit.armor = 'Full Plate Armor';

        // Grant a random prestigious trait
        const availableTraits: TraitType[] = ['strong', 'swift', 'regeneration', 'genius'];
        const missing = availableTraits.filter((t) => !unit.traits.includes(t));
        if (missing.length > 0) {
          const newTrait = missing[Math.floor(Math.random() * missing.length)];
          unit.traits.push(newTrait);
          this.addFloatingText(`TRAIT: ${newTrait.toUpperCase()} ✨`, unit.x, unit.y, '#a855f7', 11);
        }

        this.addChronicle(
          `${unit.name} ascended to Level 5 and became legendary!`,
          '⭐',
          'hero'
        );
      } else if (unit.level === 10) {
        unit.weapon = 'Excalibur of Kings';
        unit.armor = 'Celestial Aegis';
        if (!unit.traits.includes('immortal')) {
          unit.traits.push('immortal');
        }
      }
    }
  }

  private executeUnitBehavior(unit: Unit) {
    const isCivilized = Boolean(unit.race && unit.kingdomId);

    // Passive XP for living
    if (this.tickCount % 60 === 0) {
      this.grantXp(unit, 1);
    }

    // 1. Boat special behavior
    if (unit.type === 'boat') {
      this.executeBoatBehavior(unit);
      return;
    }

    // 2. Combat check
    const enemy = this.findNearestEnemy(unit);
    if (enemy) {
      unit.actionState = 'fighting';
      const dist = Math.hypot(enemy.x - unit.x, enemy.y - unit.y);
      if (dist <= 1.2) {
        // Attack!
        const dmg = Math.round(unit.damage * (unit.traits.includes('bloodthirsty') ? 1.4 : 1));
        enemy.hp -= dmg;
        this.addFloatingText(`-${dmg}`, enemy.x, enemy.y, '#ef4444', 9);
        this.grantXp(unit, 5);

        // Clashing sparks
        for (let s = 0; s < 3; s++) {
          this.addParticle(
            enemy.x + (Math.random() - 0.5) * 0.4,
            enemy.y + (Math.random() - 0.5) * 0.4,
            (Math.random() - 0.5) * 0.05,
            (Math.random() - 0.5) * 0.05,
            '#fbbf24',
            10,
            1.5
          );
        }

        if (Math.random() < 0.25) sounds.playSword();

        if (enemy.hp <= 0) {
          unit.kills++;
          this.grantXp(unit, 25);
          if (unit.kingdomId) {
            const k = this.kingdoms.find((k) => k.id === unit.kingdomId);
            if (k) k.totalKills++;
          }
        }
      } else {
        this.moveTowards(unit, enemy.x, enemy.y);
      }
      return;
    }

    // 3. Dragon rampage
    if (unit.type === 'dragon') {
      if (Math.random() < 0.1) {
        const tx = Math.floor(unit.x);
        const ty = Math.floor(unit.y);
        if (this.isInBounds(tx, ty) && Math.random() < 0.3) {
          const t = this.grid[ty][tx];
          if (t.type === 'forest' || t.type === 'grass') {
            t.type = 'fire';
            sounds.playRoar();
            this.addFloatingText('🔥 DRAGON BREATH', tx, ty, '#ea580c', 10);
          }
        }
      }
    }

    // 4. Civilized tasks: Farming, Building & Territory Expansion
    if (isCivilized && unit.villageId) {
      const village = this.villages.find((v) => v.id === unit.villageId);
      if (village) {
        const gx = Math.floor(unit.x);
        const gy = Math.floor(unit.y);
        if (this.isInBounds(gx, gy)) {
          const t = this.grid[gy][gx];
          if (!t.kingdomId) {
            t.kingdomId = unit.kingdomId;
            t.villageId = village.id;
          }

          // Farmer: plants crops
          if (unit.profession === 'farmer' && t.type === 'grass' && !t.hasCrop) {
            t.hasCrop = true;
            t.cropGrowth = 0;
            village.wheat += 3;
            this.grantXp(unit, 3);
          }

          // Builder: constructs homes
          if (unit.profession === 'builder' && Math.random() < 0.04) {
            this.tryPlaceBuilding(village, gx, gy);
            this.grantXp(unit, 6);
          }
        }
      }
    }

    // 5. Default wander
    if (Math.random() < 0.35) {
      const angle = Math.random() * Math.PI * 2;
      const step = unit.speed * 0.4 * (unit.traits.includes('swift') ? 1.3 : 1);
      const nextX = unit.x + Math.cos(angle) * step;
      const nextY = unit.y + Math.sin(angle) * step;

      if (this.isWalkableFor(unit, nextX, nextY)) {
        unit.x = nextX;
        unit.y = nextY;
      }
    }
  }

  private executeBoatBehavior(boat: Unit) {
    // Boat sails on water between coastal towns
    if (Math.random() < 0.4) {
      const angle = Math.random() * Math.PI * 2;
      const step = boat.speed * 0.5;
      const nextX = boat.x + Math.cos(angle) * step;
      const nextY = boat.y + Math.sin(angle) * step;

      if (this.isInBounds(Math.floor(nextX), Math.floor(nextY))) {
        const t = this.grid[Math.floor(nextY)][Math.floor(nextX)];
        if (t.type === 'deep_ocean' || t.type === 'shallow_water') {
          boat.x = nextX;
          boat.y = nextY;

          // Water ripple particles
          if (Math.random() < 0.2) {
            this.addParticle(boat.x, boat.y, 0, 0, '#7dd3fc', 12, 1);
          }
        }
      }
    }
  }

  private isWalkableFor(unit: Unit, x: number, y: number): boolean {
    if (!this.isInBounds(Math.floor(x), Math.floor(y))) return false;
    if (unit.type === 'dragon') return true;
    if (unit.type === 'boat') {
      const t = this.grid[Math.floor(y)][Math.floor(x)];
      return t.type === 'deep_ocean' || t.type === 'shallow_water';
    }

    const tile = this.grid[Math.floor(y)][Math.floor(x)];
    if (tile.type === 'deep_ocean') return false;
    if (tile.type === 'mountain' && unit.race !== 'dwarf') return false;
    if (tile.type === 'lava' && !unit.traits.includes('fireproof')) return false;

    return true;
  }

  private moveTowards(unit: Unit, targetX: number, targetY: number) {
    const dx = targetX - unit.x;
    const dy = targetY - unit.y;
    const dist = Math.hypot(dx, dy);
    if (dist > 0.05) {
      const step = Math.min(dist, unit.speed * 0.35 * (unit.traits.includes('swift') ? 1.3 : 1));
      const nx = unit.x + (dx / dist) * step;
      const ny = unit.y + (dy / dist) * step;
      if (this.isWalkableFor(unit, nx, ny)) {
        unit.x = nx;
        unit.y = ny;
      }
    }
  }

  private findNearestEnemy(unit: Unit): Unit | null {
    let nearest: Unit | null = null;
    let minDist = 8;

    for (const other of this.units) {
      if (other.id === unit.id) continue;

      const isHostile = this.areHostile(unit, other);
      if (isHostile) {
        const d = Math.hypot(other.x - unit.x, other.y - unit.y);
        if (d < minDist) {
          minDist = d;
          nearest = other;
        }
      }
    }
    return nearest;
  }

  public areHostile(u1: Unit, u2: Unit): boolean {
    const monsters = ['zombie', 'skeleton', 'demon', 'dragon', 'wolf', 'bear'];
    const isM1 = monsters.includes(u1.type);
    const isM2 = monsters.includes(u2.type);

    if (isM1 && !isM2) return true;
    if (!isM1 && isM2) return true;
    if (u1.type === 'zombie' && u2.type === 'human') return true;

    if (u1.kingdomId && u2.kingdomId && u1.kingdomId !== u2.kingdomId) {
      const k1 = this.kingdoms.find((k) => k.id === u1.kingdomId);
      if (k1 && k1.relations[u2.kingdomId] === 'war') {
        return true;
      }
    }

    return false;
  }

  private tryPlaceBuilding(village: Village, gx: number, gy: number) {
    const exists = this.buildings.some((b) => b.x === gx && b.y === gy);
    if (exists) return;

    const kingdom = this.kingdoms.find((k) => k.id === village.kingdomId);
    const era = kingdom?.era || 'tribal';

    const bCount = this.buildings.filter((b) => b.villageId === village.id).length;
    let bType: Building['type'] = 'tent';

    if (era === 'arcane' && bCount > 10) {
      bType = 'arcane_obelisk';
    } else if (era === 'medieval' && bCount > 8) {
      bType = 'castle';
    } else if (era === 'iron' && bCount > 5) {
      bType = 'house';
    } else if (era === 'bronze' && bCount > 2) {
      bType = 'hut';
    }

    this.buildings.push({
      id: `build-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`,
      x: gx,
      y: gy,
      type: bType,
      hp: 150,
      maxHp: 150,
      villageId: village.id,
      kingdomId: village.kingdomId,
    });
  }

  // --- Civilization Evolution & Eras Loop ---
  private updateCivilizationEras() {
    if (this.tickCount % 120 !== 0) return;

    for (const kingdom of this.kingdoms) {
      const citizens = this.units.filter((u) => u.kingdomId === kingdom.id);
      const villages = this.villages.filter((v) => v.kingdomId === kingdom.id);

      // Accumulate culture & gold
      kingdom.culture += citizens.length * (this.laws.fastCivilization ? 6 : 2);
      kingdom.gold += villages.length * 5;

      const curEra = kingdom.era;
      const targetCost = ERA_DETAILS[curEra].nextCost;

      if (kingdom.culture >= targetCost) {
        let nextEra: KingdomEra = 'bronze';
        if (curEra === 'tribal') nextEra = 'bronze';
        else if (curEra === 'bronze') nextEra = 'iron';
        else if (curEra === 'iron') nextEra = 'medieval';
        else if (curEra === 'medieval') nextEra = 'arcane';

        if (nextEra !== curEra) {
          kingdom.era = nextEra;
          sounds.playDivine();

          const capital = villages[0];
          if (capital) {
            this.addFloatingText(`ERA: ${ERA_DETAILS[nextEra].name.toUpperCase()}! 🏛️`, capital.centerX, capital.centerY, '#facc15', 13);
          }

          this.addChronicle(
            `${kingdom.name} advanced to the ${ERA_DETAILS[nextEra].name}!`,
            '🏛️',
            'era'
          );

          // If reached medieval era: spawn naval trade boat on nearest coastal water!
          if (nextEra === 'medieval' && capital) {
            const waterNear = this.findWaterNear(capital.centerX, capital.centerY);
            if (waterNear) {
              this.spawnCreature('boat', waterNear.x, waterNear.y);
              this.addChronicle(`${kingdom.name} launched their first sailing trade ship!`, '⛵', 'kingdom');
            }
          }
        }
      }
    }
  }

  private findWaterNear(x: number, y: number): { x: number; y: number } | null {
    for (let dy = -6; dy <= 6; dy++) {
      for (let dx = -6; dx <= 6; dx++) {
        const nx = x + dx;
        const ny = y + dy;
        if (this.isInBounds(nx, ny)) {
          const t = this.grid[ny][nx];
          if (t.type === 'shallow_water' || t.type === 'deep_ocean') {
            return { x: nx, y: ny };
          }
        }
      }
    }
    return null;
  }

  private checkCivilizationSettlements() {
    const races: RaceType[] = ['human', 'elf', 'dwarf', 'orc'];
    for (const race of races) {
      const unassigned = this.units.filter((u) => u.race === race && !u.kingdomId);
      if (unassigned.length >= 2) {
        const u = unassigned[0];
        const gx = Math.floor(u.x);
        const gy = Math.floor(u.y);
        const tile = this.grid[gy]?.[gx];
        if (tile && tile.type !== 'deep_ocean' && tile.type !== 'shallow_water') {
          this.foundKingdom(race, gx, gy, unassigned.slice(0, 4));
        }
      }
    }
  }

  public foundKingdom(race: RaceType, x: number, y: number, settlers: Unit[]): Kingdom {
    const colorIndex = this.kingdoms.length % KINGDOM_COLORS.length;
    const symbolIndex = this.kingdoms.length % KINGDOM_SYMBOLS.length;

    const nameIdx = this.kingdomNameIndex[race]++;
    const nameList = RACE_CONFIGS[race].kingdomNames;
    const kingdomName = nameList[nameIdx % nameList.length] || `${race.toUpperCase()} Realm #${this.kingdoms.length + 1}`;

    const kingdomId = `k-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`;
    const villageId = `v-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`;

    const newKingdom: Kingdom = {
      id: kingdomId,
      name: kingdomName,
      color: KINGDOM_COLORS[colorIndex],
      bannerSymbol: KINGDOM_SYMBOLS[symbolIndex],
      race,
      kingId: settlers[0]?.id || null,
      foundedYear: this.gameYear,
      relations: {},
      totalKills: 0,
      era: 'tribal',
      culture: 0,
      gold: 50,
      technologyProgress: 0,
    };

    const newVillage: Village = {
      id: villageId,
      name: `${kingdomName.split(' ')[0]} City`,
      kingdomId,
      race,
      centerX: x,
      centerY: y,
      wood: 30,
      stone: 15,
      wheat: 20,
      level: 1,
      foundedYear: this.gameYear,
    };

    settlers.forEach((unit, idx) => {
      unit.kingdomId = kingdomId;
      unit.villageId = villageId;
      unit.profession = idx === 0 ? 'ruler' : idx === 1 ? 'warrior' : 'builder';
      unit.color = newKingdom.color;
      unit.thought = 'Construindo o berço da nossa nova nação!';
      unit.mood = 'inspired';
    });

    for (let dy = -3; dy <= 3; dy++) {
      for (let dx = -3; dx <= 3; dx++) {
        const nx = x + dx;
        const ny = y + dy;
        if (this.isInBounds(nx, ny) && Math.hypot(dx, dy) <= 3) {
          const t = this.grid[ny][nx];
          if (t.type !== 'deep_ocean') {
            t.kingdomId = kingdomId;
            t.villageId = villageId;
          }
        }
      }
    }

    this.buildings.push({
      id: `th-${Date.now()}`,
      x,
      y,
      type: 'castle',
      hp: 300,
      maxHp: 300,
      villageId,
      kingdomId,
    });

    for (const existing of this.kingdoms) {
      const initialRelation = this.laws.peaceWorld ? 'peace' : race === 'orc' ? 'war' : 'peace';
      newKingdom.relations[existing.id] = initialRelation;
      existing.relations[newKingdom.id] = initialRelation;
    }

    this.kingdoms.push(newKingdom);
    this.villages.push(newVillage);

    this.addFloatingText(`👑 ${newKingdom.name} FOUNDED!`, x, y, newKingdom.color, 12);
    this.addChronicle(
      `${newKingdom.name} was founded under the rule of King ${settlers[0]?.name || 'the Monarch'}.`,
      '👑',
      'kingdom'
    );

    return newKingdom;
  }

  // --- Diplomacy Evaluation ---
  private updateDiplomacy() {
    if (this.tickCount % 120 !== 0 || this.laws.peaceWorld) return;

    for (let i = 0; i < this.kingdoms.length; i++) {
      for (let j = i + 1; j < this.kingdoms.length; j++) {
        const k1 = this.kingdoms[i];
        const k2 = this.kingdoms[j];

        if (Math.random() < 0.1) {
          const curRel = k1.relations[k2.id] || 'peace';
          if (curRel === 'peace' && Math.random() < 0.25) {
            k1.relations[k2.id] = 'war';
            k2.relations[k1.id] = 'war';
            sounds.playSword();
            this.addChronicle(
              `⚔️ War declared between ${k1.name} and ${k2.name}!`,
              '⚔️',
              'war'
            );
          } else if (curRel === 'war' && Math.random() < 0.3) {
            k1.relations[k2.id] = 'peace';
            k2.relations[k1.id] = 'peace';
            sounds.playDivine();
            this.addChronicle(
              `🕊️ Peace accord signed between ${k1.name} and ${k2.name}.`,
              '🕊️',
              'peace'
            );
          }
        }
      }
    }
  }

  // --- God Powers & Tools ---
  public applyTool(tool: ToolType, gridX: number, gridY: number, brushRadius: number = 2) {
    if (!this.isInBounds(gridX, gridY)) return;

    // Terraforming
    const terraformMap: Partial<Record<ToolType, TileType>> = {
      deep_ocean: 'deep_ocean',
      shallow_water: 'shallow_water',
      sand: 'sand',
      grass: 'grass',
      forest: 'forest',
      mountain: 'mountain',
      snow: 'snow',
      lava: 'lava',
      soil: 'soil',
      fire_brush: 'fire',
    };

    if (terraformMap[tool]) {
      const targetType = terraformMap[tool]!;
      for (let dy = -brushRadius; dy <= brushRadius; dy++) {
        for (let dx = -brushRadius; dx <= brushRadius; dx++) {
          const nx = gridX + dx;
          const ny = gridY + dy;
          if (this.isInBounds(nx, ny) && Math.hypot(dx, dy) <= brushRadius) {
            this.grid[ny][nx].type = targetType;
            if (targetType === 'deep_ocean' || targetType === 'shallow_water') {
              this.grid[ny][nx].kingdomId = undefined;
              this.grid[ny][nx].villageId = undefined;
              this.grid[ny][nx].hasCrop = false;
            }
          }
        }
      }
      sounds.playClick();
      return;
    }

    // Spawning Civilized Races & Boats
    if (tool.startsWith('spawn_')) {
      const creature = tool.replace('spawn_', '') as CreatureType;
      this.spawnCreature(creature, gridX, gridY);
      sounds.playSpawn();
      return;
    }

    // Disasters & Powers
    if (tool === 'lightning') {
      this.effects.push({
        id: `lightning-${Date.now()}`,
        type: 'lightning',
        x: gridX,
        y: gridY - 20,
        targetX: gridX,
        targetY: gridY,
        radius: brushRadius + 1,
        progress: 0,
        durationMs: 300,
        createdAt: Date.now(),
        color: '#facc15',
      });
      return;
    }

    if (tool === 'meteor') {
      this.effects.push({
        id: `meteor-${Date.now()}`,
        type: 'meteor',
        x: gridX - 15,
        y: gridY - 25,
        targetX: gridX,
        targetY: gridY,
        radius: brushRadius + 3,
        progress: 0,
        durationMs: 800,
        createdAt: Date.now(),
        color: '#ea580c',
      });
      return;
    }

    if (tool === 'tnt_bomb' || tool === 'tsar_nuke') {
      const r = tool === 'tsar_nuke' ? brushRadius + 8 : brushRadius + 2;
      this.effects.push({
        id: `exp-${Date.now()}`,
        type: 'explosion',
        x: gridX,
        y: gridY,
        targetX: gridX,
        targetY: gridY,
        radius: r,
        progress: 0,
        durationMs: tool === 'tsar_nuke' ? 1200 : 500,
        createdAt: Date.now(),
        color: '#f87171',
      });
      return;
    }

    if (tool === 'earthquake') {
      this.effects.push({
        id: `eq-${Date.now()}`,
        type: 'earthquake',
        x: gridX,
        y: gridY,
        targetX: gridX,
        targetY: gridY,
        radius: brushRadius + 6,
        progress: 0,
        durationMs: 600,
        createdAt: Date.now(),
        color: '#78350f',
      });
      return;
    }

    if (tool === 'acid_rain') {
      this.effects.push({
        id: `acid-${Date.now()}`,
        type: 'acid_drop',
        x: gridX,
        y: gridY,
        targetX: gridX,
        targetY: gridY,
        radius: brushRadius + 2,
        progress: 0,
        durationMs: 400,
        createdAt: Date.now(),
        color: '#84cc16',
      });
      return;
    }

    if (tool === 'divine_light') {
      this.effects.push({
        id: `divine-${Date.now()}`,
        type: 'divine_ray',
        x: gridX,
        y: gridY - 20,
        targetX: gridX,
        targetY: gridY,
        radius: brushRadius + 2,
        progress: 0,
        durationMs: 500,
        createdAt: Date.now(),
        color: '#fef08a',
      });
      return;
    }

    if (tool === 'sponge') {
      for (let dy = -brushRadius; dy <= brushRadius; dy++) {
        for (let dx = -brushRadius; dx <= brushRadius; dx++) {
          const nx = gridX + dx;
          const ny = gridY + dy;
          if (this.isInBounds(nx, ny) && Math.hypot(dx, dy) <= brushRadius) {
            const t = this.grid[ny][nx];
            if (t.type === 'deep_ocean' || t.type === 'shallow_water' || t.type === 'fire') {
              t.type = 'sand';
            }
          }
        }
      }
      sounds.playClick();
      return;
    }

    if (tool === 'fertilizer') {
      for (let dy = -brushRadius; dy <= brushRadius; dy++) {
        for (let dx = -brushRadius; dx <= brushRadius; dx++) {
          const nx = gridX + dx;
          const ny = gridY + dy;
          if (this.isInBounds(nx, ny) && Math.hypot(dx, dy) <= brushRadius) {
            const t = this.grid[ny][nx];
            if (t.type === 'soil' || t.type === 'sand') {
              t.type = 'grass';
            } else if (t.type === 'grass') {
              t.type = 'forest';
            }
          }
        }
      }
      sounds.playClick();
      return;
    }

    if (tool === 'rain') {
      for (let dy = -brushRadius * 2; dy <= brushRadius * 2; dy++) {
        for (let dx = -brushRadius * 2; dx <= brushRadius * 2; dx++) {
          const nx = gridX + dx;
          const ny = gridY + dy;
          if (this.isInBounds(nx, ny) && Math.hypot(dx, dy) <= brushRadius * 2) {
            const t = this.grid[ny][nx];
            if (t.type === 'fire') {
              t.type = 'grass';
            } else if (t.type === 'soil') {
              t.type = 'grass';
            }
            if (Math.random() < 0.2) {
              this.addParticle(nx, ny, 0, 0.1, '#38bdf8', 10, 1.5);
            }
          }
        }
      }
      sounds.playClick();
      return;
    }

    if (tool === 'divine_inspiration') {
      const targetUnit = this.units.find(
        (u) => Math.hypot(u.x - gridX, u.y - gridY) <= 3 && u.race
      );
      if (targetUnit && targetUnit.race) {
        this.foundKingdom(targetUnit.race, gridX, gridY, [targetUnit]);
        sounds.playDivine();
      }
      return;
    }

    if (tool === 'whisper_of_war') {
      if (this.kingdoms.length >= 2) {
        const k1 = this.kingdoms[0];
        const k2 = this.kingdoms[1];
        k1.relations[k2.id] = 'war';
        k2.relations[k1.id] = 'war';
        sounds.playSword();
        this.addChronicle(
          `⚔️ Divine Whisper of Spite instigated War between ${k1.name} and ${k2.name}!`,
          '⚔️',
          'war'
        );
      }
      return;
    }

    if (tool === 'peace_treaty') {
      for (const k1 of this.kingdoms) {
        for (const k2 of this.kingdoms) {
          if (k1.id !== k2.id) {
            k1.relations[k2.id] = 'peace';
            k2.relations[k1.id] = 'peace';
          }
        }
      }
      sounds.playDivine();
      this.addChronicle('🕊️ Divine Peace Accord unified all warring nations.', '🕊️', 'peace');
      return;
    }

    if (tool === 'coffee_blessing') {
      for (const unit of this.units) {
        if (Math.hypot(unit.x - gridX, unit.y - gridY) <= brushRadius + 2) {
          if (!unit.traits.includes('swift')) {
            unit.traits.push('swift');
          }
          unit.speed = Math.min(3.0, unit.speed * 1.5);
          unit.mood = 'inspired';
          unit.thought = 'A cafeína dos deuses acelerou meu corpo e mente!';
          this.addFloatingText('SUPERCHARGED ☕', unit.x, unit.y, '#f59e0b', 10);
        }
      }
      sounds.playClick();
      return;
    }

    if (tool === 'plague_spore') {
      for (const unit of this.units) {
        if (Math.hypot(unit.x - gridX, unit.y - gridY) <= brushRadius + 2) {
          if (!unit.traits.includes('infected')) {
            unit.traits.push('infected');
            this.addFloatingText('INFECTED ☣️', unit.x, unit.y, '#84cc16', 10);
          }
        }
      }
      sounds.playClick();
      return;
    }

    if (tool === 'cleanse') {
      this.blessUnitsInRadius(gridX, gridY, brushRadius + 3);
      return;
    }
  }

  public spawnCreature(type: CreatureType, x: number, y: number): Unit {
    const isRace = ['human', 'elf', 'dwarf', 'orc'].includes(type);
    const race = isRace ? (type as RaceType) : undefined;
    const raceCfg = race ? RACE_CONFIGS[race] : null;

    const names = raceCfg?.firstNames || ['Creature'];
    const randomName = `${names[Math.floor(Math.random() * names.length)]}`;

    const traits: TraitType[] = raceCfg ? [...raceCfg.innateTraits] : [];
    if (Math.random() < 0.15) traits.push('giant');
    if (Math.random() < 0.15) traits.push('genius');
    if (Math.random() < 0.1) traits.push('immortal');
    if (Math.random() < 0.1) traits.push('fireproof');

    const baseHp = raceCfg
      ? raceCfg.baseHp
      : type === 'dragon'
        ? 800
        : type === 'boat'
          ? 350
          : type === 'bear'
            ? 160
            : 70;
    const maxHp = baseHp * (traits.includes('giant') ? 1.5 : traits.includes('tiny') ? 0.7 : 1);
    const damage = raceCfg ? raceCfg.baseDamage : type === 'dragon' ? 45 : type === 'wolf' ? 14 : 6;
    const speed = raceCfg ? raceCfg.baseSpeed : type === 'dragon' ? 1.8 : type === 'boat' ? 1.4 : 1.0;

    let profession: UnitProfession = 'civilian';
    if (type === 'boat') profession = 'captain';
    else if (!race) profession = 'wild';

    const defaultThoughts = AUTONOMOUS_THOUGHTS.content;
    const initialThought = defaultThoughts[Math.floor(Math.random() * defaultThoughts.length)];

    const unit: Unit = {
      id: `u-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`,
      name: type === 'boat' ? 'Royal Caravel' : race ? randomName : type.toUpperCase(),
      type,
      race,
      x: x + (Math.random() - 0.5) * 0.5,
      y: y + (Math.random() - 0.5) * 0.5,
      actionState: 'wandering',
      hp: maxHp,
      maxHp,
      damage,
      speed,
      kills: 0,
      age: Math.floor(Math.random() * 20) + 16,
      profession,
      traits,
      weapon:
        type === 'boat'
          ? 'Naval Cannons'
          : race === 'elf'
            ? 'Elven Bow'
            : race === 'dwarf'
              ? 'Warhammer'
              : 'Iron Sword',
      armor: type === 'boat' ? 'Oak Hull' : 'Leather Tunic',
      thought: initialThought,
      mood: 'content',
      level: 1,
      xp: 0,
      maxXp: 100,
    };

    this.units.push(unit);
    return unit;
  }

  public getUnitAt(x: number, y: number): Unit | null {
    for (const unit of this.units) {
      if (Math.hypot(unit.x - x, unit.y - y) <= 1.2) {
        return unit;
      }
    }
    return null;
  }

  public isInBounds(x: number, y: number): boolean {
    return x >= 0 && x < this.width && y >= 0 && y < this.height;
  }

  private getNeighbors(x: number, y: number): { x: number; y: number }[] {
    const res: { x: number; y: number }[] = [];
    const dirs = [
      { x: 0, y: -1 },
      { x: 1, y: 0 },
      { x: 0, y: 1 },
      { x: -1, y: 0 },
    ];
    for (const d of dirs) {
      const nx = x + d.x;
      const ny = y + d.y;
      if (this.isInBounds(nx, ny)) {
        res.push({ x: nx, y: ny });
      }
    }
    return res;
  }
}
