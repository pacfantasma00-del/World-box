import test from 'node:test';
import assert from 'node:assert/strict';
import { GameEngine } from './engine';

test('GameEngine initializes grid with procedural world', () => {
  const engine = new GameEngine('continents', 12345);
  assert.equal(engine.grid.length, engine.height);
  assert.equal(engine.grid[0].length, engine.width);
  assert.ok(engine.grid[30][30].type);
  assert.ok(engine.chronicle.length >= 1, 'Chronicle records world creation');
});

test('Spawning civilized units and founding kingdom', () => {
  const engine = new GameEngine('blank', 12345);
  for (let y = 20; y < 35; y++) {
    for (let x = 20; x < 35; x++) {
      engine.grid[y][x].type = 'grass';
    }
  }

  const u1 = engine.spawnCreature('human', 25, 25);
  const u2 = engine.spawnCreature('human', 26, 25);

  assert.equal(u1.race, 'human');
  assert.equal(u2.race, 'human');
  assert.ok(u1.thought, 'Unit has autonomous thought');
  assert.ok(u1.mood, 'Unit has psychological mood');

  // Trigger civilization settlements check
  engine.tick();

  assert.ok(engine.kingdoms.length >= 1, 'A kingdom should be founded by 2 settlers');
  assert.ok(u1.kingdomId, 'Unit 1 should be enrolled in kingdom');
  assert.ok(engine.villages.length >= 1, 'A village should be founded');
});

test('Autonomous XP & Level Up looping makes units more powerful', () => {
  const engine = new GameEngine('blank', 123);
  const unit = engine.spawnCreature('elf', 15, 15);
  const initialDamage = unit.damage;
  const initialMaxHp = unit.maxHp;

  // Grant enough XP to level up
  engine.grantXp(unit, 150);

  assert.ok(unit.level >= 2, 'Unit should level up with sufficient XP');
  assert.ok(unit.damage > initialDamage, 'Unit damage should increase on level up');
  assert.ok(unit.maxHp > initialMaxHp, 'Unit max HP should increase on level up');
  assert.ok(engine.floatingTexts.length >= 1, 'Floating text indicates level up');
});

test('Boat spawns and navigates water', () => {
  const engine = new GameEngine('blank', 999);
  // Place water
  engine.grid[10][10].type = 'deep_ocean';
  const boat = engine.spawnCreature('boat', 10, 10);

  assert.equal(boat.type, 'boat');
  assert.equal(boat.weapon, 'Naval Cannons');
  assert.ok(boat.hp >= 300);
});

test('God power lightning strikes and damages terrain/units', () => {
  const engine = new GameEngine('continents', 999);
  const unit = engine.spawnCreature('orc', 40, 40);
  const initialHp = unit.hp;

  engine.applyTool('lightning', 40, 40, 2);
  assert.equal(engine.effects.length, 1);
  assert.equal(engine.effects[0].type, 'lightning');

  engine.effects[0].createdAt = Date.now() - 500;
  engine.tick();

  assert.ok(unit.hp < initialHp || unit.traits.includes('immortal'), 'Unit should take damage or gain immortal');
});

test('Zombie turns upon death if infected', () => {
  const engine = new GameEngine('blank', 456);
  const unit = engine.spawnCreature('human', 20, 20);
  unit.traits.push('infected');
  unit.hp = 0;

  engine.tick();

  const zombie = engine.units.find((u) => u.type === 'zombie');
  assert.ok(zombie, 'Infected unit should rise as zombie');
});
