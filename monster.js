// Monster system for the roguelike dungeon game

// Base Monster class
class Monster {
  constructor(id, x, y) {
    this.id = id;
    this.x = x;
    this.y = y;
    this.hp = 1;
    this.maxHp = this.hp;
    this.dmg = 1;
    this.speed = 100;
    this.nextActionTime = 0; // Time when the monster can next act
    this.experience = 0; // Experience given to player on death
    this.type = this.getType();

    // Set stats - to be overridden by subclasses
    this.setStats();
  }

  getDamage() {
    return this.dmg;
  }

  // Abstract methods to be implemented by subclasses
  getType() {
    throw new Error('getType must be implemented by subclass');
  }

  setStats() {
    throw new Error('setStats must be implemented by subclass');
  }

  getSymbol() {
    throw new Error('getSymbol must be implemented by subclass');
  }

  getColor() {
    return 'red'; // Default color, can be overridden
  }

  // AI behavior - can be overridden by subclasses for specific behavior
  performAction(monsterManager) {
    const dist = this.distanceTo(monsterManager.game.player.x, monsterManager.game.player.y);

    if (dist === 1) {
      monsterManager.monsterAttackPlayer(this);
      return;
    }

    // Default behavior: move toward player if visible
    if (monsterManager.game.visible[this.y] && monsterManager.game.visible[this.y][this.x] && dist <= 10) {
      const step =
        monsterManager.aStarNextStep(this.x, this.y, monsterManager.game.player.x, monsterManager.game.player.y) ||
        monsterManager.pathStepToward(this.x, this.y, monsterManager.game.player.x, monsterManager.game.player.y);
      if (step) {
        const [tx, ty] = step;
        if (
          !(tx === monsterManager.game.player.x && ty === monsterManager.game.player.y) &&
          monsterManager.isWalkableForMonster(tx, ty)
        ) {
          this.moveTo(tx, ty);
        }
      }
    } else if (Math.random() < 0.2) {
      // Random movement when not chasing
      const dirs = [
        [1, 0],
        [-1, 0],
        [0, 1],
        [0, -1],
      ];
      const d = dirs[Math.floor(Math.random() * dirs.length)];
      const wx = this.x + d[0];
      const wy = this.y + d[1];
      if (monsterManager.isWalkableForMonster(wx, wy)) {
        this.moveTo(wx, wy);
      }
    }

    // Check for adjacent attack after movement
    if (this.distanceTo(monsterManager.game.player.x, monsterManager.game.player.y) === 1) {
      monsterManager.monsterAttackPlayer(this);
    }
  }

  // Common methods for all monsters
  isAlive() {
    return this.hp > 0;
  }

  takeDamage(amount) {
    this.hp -= amount;
    return this.hp <= 0;
  }

  distanceTo(x, y) {
    return Math.abs(this.x - x) + Math.abs(this.y - y);
  }

  moveTo(x, y) {
    this.x = x;
    this.y = y;
  }

  canAct(currentTick) {
    return currentTick >= this.nextActionTime;
  }

  scheduleNextAction(currentTick) {
    this.nextActionTime = currentTick + this.speed;
  }

  getDisplayName() {
    return this.type.charAt(0).toUpperCase() + this.type.slice(1);
  }
}

// Goblin - Fast, weak melee monster
class Goblin extends Monster {
  getType() {
    return 'goblin';
  }

  setStats() {
    this.hp = 6 + Math.floor(Math.random() * 3); // 6-8 HP
    this.maxHp = this.hp;
    this.dmg = 2;
    this.speed = 50; // Acts every 0.5 time units (fast)
    this.experience = 5; // Experience given to player on death
  }

  getSymbol() {
    return 'g';
  }

  getColor() {
    return '#00ff00'; // Green color for goblins
  }
}

// Orc - Strong, slow melee monster
class Orc extends Monster {
  getType() {
    return 'orc';
  }

  setStats() {
    this.hp = 14 + Math.floor(Math.random() * 5); // 14-18 HP
    this.maxHp = this.hp;
    this.dmg = 5;
    this.speed = 200; // Acts every 2.0 time units (slow)
    this.experience = 15; // Experience given to player on death
  }

  getSymbol() {
    return 'O';
  }

  getColor() {
    return '#ff4444'; // Red color for orcs
  }
}

// Skeleton - Undead, medium stats, immune to certain effects
class Skeleton extends Monster {
  getType() {
    return 'skeleton';
  }

  setStats() {
    this.hp = 8 + Math.floor(Math.random() * 4); // 8-11 HP
    this.maxHp = this.hp;
    this.dmg = 3;
    this.speed = 120; // Medium speed
    this.experience = 10; // Experience given to player on death
  }

  getSymbol() {
    return 's';
  }

  getColor() {
    return '#cccccc'; // Bone white color
  }
}

// Spider - Very fast, low HP, poison attack
class Spider extends Monster {
  getType() {
    return 'spider';
  }

  setStats() {
    this.hp = 3 + Math.floor(Math.random() * 2); // 3-4 HP (fragile)
    this.maxHp = this.hp;
    this.dmg = 1;
    this.speed = 30; // Very fast
    this.experience = 7; // Experience given to player on death
  }

  getSymbol() {
    return 'x';
  }

  getColor() {
    return '#8800ff'; // Purple for spiders
  }

  performAction(monsterManager) {
    // Spiders prefer to stay at range and dart in for quick attacks
    const dist = this.distanceTo(monsterManager.game.player.x, monsterManager.game.player.y);

    if (dist === 1) {
      monsterManager.monsterAttackPlayer(this);
      // After attacking, try to move away
      const retreatDirs = [[-1,-1], [-1,0], [-1,1], [0,-1], [0,1], [1,-1], [1,0], [1,1]];
      for (const [dx, dy] of retreatDirs) {
        const newX = this.x + dx;
        const newY = this.y + dy;
        const newDist = Math.abs(newX - monsterManager.game.player.x) + Math.abs(newY - monsterManager.game.player.y);
        if (newDist > dist && monsterManager.isWalkableForMonster(newX, newY)) {
          this.moveTo(newX, newY);
          break;
        }
      }
      return;
    }

    // Default spider behavior if not adjacent
    super.performAction(monsterManager);
  }
}

// Troll - Very tanky, regenerates health, slow
class Troll extends Monster {
  constructor(id, x, y) {
    super(id, x, y);
    this.lastRegenTick = 0;
  }

  getType() {
    return 'troll';
  }

  setStats() {
    this.hp = 25 + Math.floor(Math.random() * 10); // 25-34 HP (very tanky)
    this.maxHp = this.hp;
    this.dmg = 7;
    this.speed = 300; // Very slow
    this.experience = 25; // Experience given to player on death
  }

  getSymbol() {
    return 'T';
  }

  getColor() {
    return '#00aa00'; // Dark green for trolls
  }

  performAction(monsterManager) {
    // Regenerate health every few ticks
    if (monsterManager.game.currentTick - this.lastRegenTick > 500 && this.hp < this.maxHp) {
      this.hp = Math.min(this.maxHp, this.hp + 2);
      this.lastRegenTick = monsterManager.game.currentTick;
      if (monsterManager.game.visible[this.y] && monsterManager.game.visible[this.y][this.x]) {
        monsterManager.game.addMessage(`The ${this.getDisplayName()} regenerates!`);
      }
    }

    super.performAction(monsterManager);
  }
}

// Bat - Flying creature, erratic movement, weak but annoying
class Bat extends Monster {
  getType() {
    return 'bat';
  }

  setStats() {
    this.hp = 2 + Math.floor(Math.random() * 2); // 2-3 HP
    this.maxHp = this.hp;
    this.dmg = 1;
    this.speed = 40; // Fast and erratic
    this.experience = 4; // Experience given to player on death
  }

  getSymbol() {
    return 'b';
  }

  getColor() {
    return '#aa4400'; // Brown color for bats
  }

  performAction(monsterManager) {
    const dist = this.distanceTo(monsterManager.game.player.x, monsterManager.game.player.y);

    if (dist === 1) {
      monsterManager.monsterAttackPlayer(this);
      return;
    }

    // Bats move more erratically, even when chasing
    if (Math.random() < 0.7) {
      // Random erratic movement 70% of the time
      const dirs = [
        [1, 0], [-1, 0], [0, 1], [0, -1],
        [1, 1], [1, -1], [-1, 1], [-1, -1]
      ];
      const d = dirs[Math.floor(Math.random() * dirs.length)];
      const wx = this.x + d[0];
      const wy = this.y + d[1];
      if (monsterManager.isWalkableForMonster(wx, wy)) {
        this.moveTo(wx, wy);
      }
    } else {
      // Sometimes chase player normally
      super.performAction(monsterManager);
    }
  }
}

// Wizard - Ranged attacker, stays at distance
class Wizard extends Monster {
  constructor(id, x, y) {
    super(id, x, y);
    this.lastSpellTick = 0;
  }

  getType() {
    return 'wizard';
  }

  setStats() {
    this.hp = 8 + Math.floor(Math.random() * 3); // 8-10 HP
    this.maxHp = this.hp;
    this.dmg = 4;
    this.speed = 150; // Medium-slow
    this.experience = 20; // Experience given to player on death
  }

  getSymbol() {
    return 'W';
  }

  getColor() {
    return '#4444ff'; // Blue for wizards
  }

  performAction(monsterManager) {
    const dist = this.distanceTo(monsterManager.game.player.x, monsterManager.game.player.y);

    // Wizards prefer to attack from range
    if (dist >= 2 && dist <= 5 && monsterManager.game.visible[this.y] && monsterManager.game.visible[this.y][this.x]) {
      if (monsterManager.game.currentTick - this.lastSpellTick > 200) {
        // Cast magic missile
        const damage = this.dmg;
        monsterManager.game.player.takeDamage(damage);
        monsterManager.game.addMessage(`The ${this.getDisplayName()} casts magic missile for ${damage} damage!`);
        this.lastSpellTick = monsterManager.game.currentTick;
        return;
      }
    }

    // If too close, try to move away
    if (dist <= 2) {
      const retreatDirs = [[-1,-1], [-1,0], [-1,1], [0,-1], [0,1], [1,-1], [1,0], [1,1]];
      for (const [dx, dy] of retreatDirs) {
        const newX = this.x + dx;
        const newY = this.y + dy;
        const newDist = Math.abs(newX - monsterManager.game.player.x) + Math.abs(newY - monsterManager.game.player.y);
        if (newDist > dist && monsterManager.isWalkableForMonster(newX, newY)) {
          this.moveTo(newX, newY);
          return;
        }
      }
    }

    // Default behavior if can't cast or retreat
    super.performAction(monsterManager);
  }
}

// Minotaur - Elite monster, high stats, charges at player
class Minotaur extends Monster {
  constructor(id, x, y) {
    super(id, x, y);
    this.charging = false;
  }

  getType() {
    return 'minotaur';
  }

  setStats() {
    this.hp = 30 + Math.floor(Math.random() * 15); // 30-44 HP (boss-like)
    this.maxHp = this.hp;
    this.dmg = 8;
    this.speed = 180; // Medium-slow normally
    this.experience = 50; // Experience given to player on death
  }

  getSymbol() {
    return 'M';
  }

  getColor() {
    return '#ff8800'; // Orange for minotaurs
  }

  performAction(monsterManager) {
    const dist = this.distanceTo(monsterManager.game.player.x, monsterManager.game.player.y);

    // Start charging if player is in line of sight and at medium distance
    if (!this.charging && dist >= 3 && dist <= 6) {
      const dx = monsterManager.game.player.x - this.x;
      const dy = monsterManager.game.player.y - this.y;

      // Check if player is in a straight line (horizontal, vertical, or diagonal)
      if (dx === 0 || dy === 0 || Math.abs(dx) === Math.abs(dy)) {
        this.charging = true;
        this.speed = 60; // Much faster when charging
        monsterManager.game.addMessage(`The ${this.getDisplayName()} begins charging!`);
      }
    }

    // Stop charging when adjacent or after a few moves
    if (this.charging && (dist <= 1 || Math.random() < 0.3)) {
      this.charging = false;
      this.speed = 180; // Back to normal speed
    }

    super.performAction(monsterManager);
  }
}

// Ghost - Phases through walls, ethereal
class Ghost extends Monster {
  getType() {
    return 'ghost';
  }

  setStats() {
    this.hp = 6 + Math.floor(Math.random() * 4); // 6-9 HP
    this.maxHp = this.hp;
    this.dmg = 3;
    this.speed = 80; // Medium-fast
    this.experience = 12; // Experience given to player on death
  }

  getSymbol() {
    return 'G';
  }

  getColor() {
    return '#aaaaff'; // Pale blue for ghosts
  }

  performAction(monsterManager) {
    const dist = this.distanceTo(monsterManager.game.player.x, monsterManager.game.player.y);

    if (dist === 1) {
      monsterManager.monsterAttackPlayer(this);
      return;
    }

    // Ghosts can move through walls - direct path to player
    if (monsterManager.game.visible[this.y] && monsterManager.game.visible[this.y][this.x] && dist <= 8) {
      const dx = monsterManager.game.player.x - this.x;
      const dy = monsterManager.game.player.y - this.y;

      let moveX = 0;
      let moveY = 0;
      if (dx > 0) moveX = 1;
      else if (dx < 0) moveX = -1;
      if (dy > 0) moveY = 1;
      else if (dy < 0) moveY = -1;

      const newX = this.x + moveX;
      const newY = this.y + moveY;

      if (monsterManager.game.inBounds(newX, newY)) {
        this.moveTo(newX, newY);
      }
    } else {
      // Random movement when not chasing
      const dirs = [[1,0], [-1,0], [0,1], [0,-1], [1,1], [1,-1], [-1,1], [-1,-1]];
      const d = dirs[Math.floor(Math.random() * dirs.length)];
      const wx = this.x + d[0];
      const wy = this.y + d[1];
      if (monsterManager.game.inBounds(wx, wy)) {
        this.moveTo(wx, wy);
      }
    }
  }
}

// Monster factory for creating monsters
class MonsterFactory {
  static monsterTypes = [
    { class: Goblin, weight: 4 },
    { class: Orc, weight: 2 },
    { class: Skeleton, weight: 2 },
    { class: Spider, weight: 3 },
    { class: Troll, weight: 1 },
    { class: Bat, weight: 3 },
    { class: Wizard, weight: 2 },
    { class: Minotaur, weight: 1 },
    { class: Ghost, weight: 2 },
  ];

  static createRandomMonster(id, x, y) {
    const totalWeight = this.monsterTypes.reduce((sum, type) => sum + type.weight, 0);
    let random = Math.random() * totalWeight;

    for (const monsterType of this.monsterTypes) {
      if (random < monsterType.weight) {
        return new monsterType.class(id, x, y);
      }
      random -= monsterType.weight;
    }

    // Fallback to goblin
    return new Goblin(id, x, y);
  }
}

class MonsterManager {
  constructor(game) {
    this.game = game;
    this.monsters = [];
    this.monsterIdCounter = 1;
  }

  // Monster spawning logic using factory
  spawnMonsters() {
    const maxMon = Math.max(1, Math.floor(this.game.rooms.length * 0.7));
    const startRoom = this.game.rooms[0];
    let attempts = 0;
    this.monsters = [];

    while (this.monsters.length < maxMon && attempts < 800) {
      attempts++;
      const room = this.game.rooms[Math.floor(Math.random() * this.game.rooms.length)];
      if (room === startRoom) continue;

      const x = room.x + Math.floor(Math.random() * room.width);
      const y = room.y + Math.floor(Math.random() * room.height);

      if (!this.isWalkableForMonster(x, y)) continue;
      if (this.game.itemManager.items.some((it) => it.x === x && it.y === y)) continue;
      if (
        (this.game.upStair && x === this.game.upStair.x && y === this.game.upStair.y) ||
        (this.game.downStair && x === this.game.downStair.x && y === this.game.downStair.y)
      )
        continue;

      const monster = MonsterFactory.createRandomMonster(this.monsterIdCounter++, x, y);
      this.monsters.push(monster);
    }
  }

  // Helper for monster walkability
  isWalkableForMonster(x, y) {
    if (x < 0 || y < 0 || x >= this.game.width || y >= this.game.height) return false;
    const t = this.game.dungeon[y][x];
    if (t === '#' || t === '+') return false; // wall or closed door
    if (this.monsters.some((m) => m.x === x && m.y === y)) return false;
    return true;
  }

  // Greedy step toward target (simple heuristic)
  pathStepToward(sx, sy, tx, ty) {
    const dx = Math.sign(tx - sx);
    const dy = Math.sign(ty - sy);
    const primaryFirst = Math.random() < 0.5; // small variation
    const options = primaryFirst
      ? [
          [sx + dx, sy],
          [sx, sy + dy],
        ]
      : [
          [sx, sy + dy],
          [sx + dx, sy],
        ];

    for (const [nx, ny] of options) {
      if (this.isWalkableForMonster(nx, ny) || (nx === this.game.player.x && ny === this.game.player.y)) {
        return [nx, ny];
      }
    }
    return null;
  }

  // A* pathfinding for smarter monster movement
  aStarNextStep(sx, sy, tx, ty, maxNodes = 800) {
    if (sx === tx && sy === ty) return null;

    const open = new Map();
    const cameFrom = new Map(); // childKey -> parentKey
    const key = (x, y) => x + ',' + y;
    const h = (x, y) => Math.abs(x - tx) + Math.abs(y - ty);
    const startKey = key(sx, sy);
    const targetKey = key(tx, ty);
    const start = { x: sx, y: sy, g: 0, f: h(sx, sy) };

    open.set(startKey, start);
    const gScore = new Map([[startKey, 0]]);
    const closed = new Set();
    let nodes = 0;
    let found = false;

    while (open.size && nodes < maxNodes) {
      nodes++;
      let current;
      for (const v of open.values()) {
        if (!current || v.f < current.f) current = v;
      }

      const currentKey = key(current.x, current.y);
      open.delete(currentKey);

      if (currentKey === targetKey) {
        found = true;
        break;
      }

      closed.add(currentKey);

      const dirs = [
        [1, 0],
        [-1, 0],
        [0, 1],
        [0, -1],
      ];
      for (const [dx, dy] of dirs) {
        const nx = current.x + dx;
        const ny = current.y + dy;
        if (nx < 0 || ny < 0 || nx >= this.game.width || ny >= this.game.height) continue;
        const nk = key(nx, ny);
        if (closed.has(nk)) continue;
        const t = this.game.dungeon[ny][nx];
        if (t === '#' || t === '+') continue;
        if (this.monsters.some((m) => m.x === nx && m.y === ny && !(nx === tx && ny === ty))) continue;

        const tentativeG = (gScore.get(currentKey) ?? Infinity) + 1;
        const existing = open.get(nk);
        if (!existing || tentativeG < (gScore.get(nk) ?? Infinity)) {
          cameFrom.set(nk, currentKey);
          gScore.set(nk, tentativeG);
          const f = tentativeG + h(nx, ny);
          open.set(nk, { x: nx, y: ny, g: tentativeG, f });
        }
      }
    }

    if (!found) return null;

    // Reconstruct path from target back to start
    const path = [];
    let currentKey = targetKey;
    while (currentKey) {
      const [cx, cy] = currentKey.split(',').map(Number);
      path.push([cx, cy]);
      if (currentKey === startKey) break;
      currentKey = cameFrom.get(currentKey);
    }
    if (path[path.length - 1][0] !== sx || path[path.length - 1][1] !== sy) return null; // didn't reach start
    path.reverse();
    if (path.length < 2) return null; // already at target
    return path[1]; // first step after start
  }

  // Process time increments and handle monster actions
  processTimeIncrement() {
    const actingMonsters = this.monsters.filter(
      (monster) => monster.isAlive() && monster.canAct(this.game.currentTick)
    );

    let anyMovement = false;
    for (const monster of actingMonsters) {
      const oldX = monster.x;
      const oldY = monster.y;
      monster.performAction(this);
      monster.scheduleNextAction(this.game.currentTick);

      // Track if any monster moved for rendering purposes
      if (monster.x !== oldX || monster.y !== oldY) {
        anyMovement = true;
      }
    }

    // Render the screen if monsters moved or acted
    if (actingMonsters.length > 0) {
      this.game.render();
      // Add a small delay to make movement visible
      if (anyMovement) {
        // Use a shorter delay for smoother animation
        setTimeout(() => {}, 100); // 100ms delay
      }
    }

    return actingMonsters.length > 0;
  }

  // Combat methods
  monsterAttackPlayer(monster) {
    const dmg = Math.max(1, monster.dmg - this.game.player.getDefense());
    this.game.player.takeDamage(dmg);
    this.game.addMessage(`${monster.getDisplayName()} attacks you for ${dmg} damage! (HP ${this.game.player.health})`);

    if (this.game.player.isDead()) {
      this.game.gameOver = true;
      this.game.addMessage('You die. Game over.');
    }
  }

  attackMonster(monster) {
    const dmg = Math.max(1, this.game.player.getAttack() - 1);
    const died = monster.takeDamage(dmg);
    this.game.addMessage(`You hit ${monster.getDisplayName()} for ${dmg} damage.`);

    if (died) {
      this.game.addMessage(`${monster.getDisplayName()} dies.`);
      this.monsters = this.monsters.filter((m) => m !== monster);
      this.game.render();
    }

    this.game.consumeTurn(this.game.player.equippedWeapon().speed || 50);
  }
}

// Export for Node.js testing
if (typeof module !== 'undefined' && module.exports) {
  module.exports = { Monster, Goblin, Orc, MonsterFactory, MonsterManager };
}
