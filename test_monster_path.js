const { MonsterManager, Goblin } = require('./monster.js');

// Minimal mock Game with a simple open dungeon
class MockGame {
  constructor(width, height, playerX, playerY) {
    this.width = width;
    this.height = height;
    this.player = { x: playerX, y: playerY };
    this.dungeon = Array.from({ length: height }, () => Array.from({ length: width }, () => '.'));
    this.visible = Array.from({ length: height }, () => Array.from({ length: width }, () => true));
    this.currentTick = 0;
    this.render = () => {};
    this.addMessage = () => {};
    this.projectiles = [];
  }
}

function testPath(monsterPos, playerPos) {
  const game = new MockGame(20, 10, playerPos[0], playerPos[1]);
  const mm = new MonsterManager(game);
  const gob = new Goblin(1, monsterPos[0], monsterPos[1]);
  mm.monsters = [gob];
  const step = mm.aStarNextStep(gob.x, gob.y, game.player.x, game.player.y);
  return { step, dist: step ? Math.abs(step[0] - gob.x) + Math.abs(step[1] - gob.y) : null };
}

const cases = [
  { monster: [1, 1], player: [10, 1] },
  { monster: [5, 5], player: [5, 8] },
  { monster: [0, 0], player: [0, 1] },
  { monster: [3, 3], player: [3, 3] }, // same tile
];

for (const c of cases) {
  const res = testPath(c.monster, c.player);
  console.log(`Monster ${c.monster} -> Player ${c.player} => step=${res.step} distFromMonster=${res.dist}`);
  if (c.monster[0] !== c.player[0] || c.monster[1] !== c.player[1]) {
    if (res.dist !== 1) {
      console.error('FAILED: Step is not adjacent (teleport or no move)');
      process.exit(1);
    }
  } else if (res.step !== null) {
    console.error('FAILED: Expected null step when monster already at player');
    process.exit(1);
  }
}

console.log('All A* adjacency tests passed.');

