// Monster manager for spawning, AI, combat, and loot

class MonsterManager {
    constructor(game) {
        this.game = game;
        this.monsters = [];
        this.monsterIdCounter = 1;
    }

    // Spawn a specific monster type at a given position
    spawnSpecificMonster(MonsterClass, x, y) {
        const monster = new MonsterClass(this.monsterIdCounter++, x, y);
        this.monsters.push(monster);
        return monster;
    }

    // Monster spawning logic using factory
    spawnMonsters() {
        const maxMon = Math.max(1, Math.floor(this.game.dungeon.rooms.length * 0.7));
        const startRoom = this.game.dungeon.rooms[0];
        let attempts = 0;
        this.monsters = [];

        while (this.monsters.length < maxMon && attempts < 800) {
            attempts++;
            const room = this.game.dungeon.rooms[Math.floor(Math.random() * this.game.dungeon.rooms.length)];
            if (room === startRoom) continue;

            const x = room.x + Math.floor(Math.random() * room.width);
            const y = room.y + Math.floor(Math.random() * room.height);

            if (!this.isWalkableForMonster(x, y)) continue;
            // Check if there are items on this tile
            const tile = this.game.dungeon.getTile(x, y);
            if (tile && tile.hasItems()) continue;
            if (
                (this.game.upStair && x === this.game.upStair.x && y === this.game.upStair.y) ||
                (this.game.downStair && x === this.game.downStair.x && y === this.game.downStair.y)
            )
                continue;

            // Pass the current dungeon level to createRandomMonster
            const currentLevel = this.game.dungeonLevel || 1;
            const monster = MonsterFactory.createRandomMonster(this.monsterIdCounter++, x, y, currentLevel);
            this.monsters.push(monster);
        }
    }

    // Occasionally spawn a new monster far from the player
    trySpawnWanderingMonster() {
        // Cap total monsters to avoid runaway growth
        const maxMonsters = Math.max(8, Math.floor(this.game.dungeon.rooms.length * 1.2));
        if (this.monsters.length >= maxMonsters) return;

        // Find rooms far from the player (at least 15 tiles away)
        const px = Game.player.x;
        const py = Game.player.y;
        const farRooms = this.game.dungeon.rooms.filter(room => {
            const cx = room.x + Math.floor(room.width / 2);
            const cy = room.y + Math.floor(room.height / 2);
            const dist = Math.sqrt((cx - px) ** 2 + (cy - py) ** 2);
            return dist >= 15;
        });

        if (farRooms.length === 0) return;

        const room = farRooms[Math.floor(Math.random() * farRooms.length)];

        // Try a few positions in the room
        for (let i = 0; i < 5; i++) {
            const x = room.x + Math.floor(Math.random() * room.width);
            const y = room.y + Math.floor(Math.random() * room.height);

            if (!this.isWalkableForMonster(x, y)) continue;
            const tile = this.game.dungeon.getTile(x, y);
            if (tile && tile.hasItems()) continue;
            if (x === px && y === py) continue;
            // Don't spawn on stairs
            if ((this.game.upStair && x === this.game.upStair.x && y === this.game.upStair.y) ||
                (this.game.downStair && x === this.game.downStair.x && y === this.game.downStair.y)) continue;
            // Don't spawn in player's field of view
            if (this.game.visible[y] && this.game.visible[y][x]) continue;

            const currentLevel = this.game.dungeonLevel || 1;
            const monster = MonsterFactory.createRandomMonster(this.monsterIdCounter++, x, y, currentLevel);
            monster.scheduleNextAction(this.game.currentTick);
            this.monsters.push(monster);
            return;
        }
    }

    // Helper for monster walkability
    isWalkableForMonster(x, y, monster) {
        if (x < 0 || y < 0 || x >= this.game.width || y >= this.game.height) return false;
        const tile = this.game.dungeon.getTile(x, y);
        if (!tile || tile.type === '#') return false; // wall
        if (tile.type === '+') {
            // Closed door: only passable if monster can open doors and door is unlocked
            if (!(monster && monster.canOpenDoors && !tile.locked)) return false;
        }
        return !this.monsters.some((m) => m.x === x && m.y === y);
    }

    // Greedy step toward target (simple heuristic)
    pathStepToward(sx, sy, tx, ty, monster) {
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
            if (this.isWalkableForMonster(nx, ny, monster) || (nx === Game.player.x && ny === Game.player.y)) {
                return [nx, ny];
            }
        }
        return null;
    }

    // A* pathfinding for smarter monster movement
    aStarNextStep(sx, sy, tx, ty, monster, maxNodes = 800) {
        if (sx === tx && sy === ty) return null;

        const open = new Map();
        const cameFrom = new Map(); // childKey -> parentKey
        const key = (x, y) => x + ',' + y;
        const h = (x, y) => Math.abs(x - tx) + Math.abs(y - ty);
        const startKey = key(sx, sy);
        const targetKey = key(tx, ty);
        const start = {x: sx, y: sy, g: 0, f: h(sx, sy)};

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
                [1, 1],
                [-1, 0],
                [-1, 1],
                [0, 1],
                [-1, -1],
                [0, -1],
                [1, -1]
            ];
            for (const [dx, dy] of dirs) {
                const nx = current.x + dx;
                const ny = current.y + dy;
                if (nx < 0 || ny < 0 || nx >= this.game.width || ny >= this.game.height) continue;
                const nk = key(nx, ny);
                if (closed.has(nk)) continue;
                const tile = this.game.dungeon.getTile(nx, ny);
                if (!tile || tile.type === '#') continue;
                if (tile.type === '+' && !(monster && monster.canOpenDoors && !tile.locked)) continue;
                if (this.monsters.some((m) => m.x === nx && m.y === ny && !(nx === tx && ny === ty))) continue;

                const tentativeG = (gScore.get(currentKey) ?? Infinity) + 1;
                const existing = open.get(nk);
                if (!existing || tentativeG < (gScore.get(nk) ?? Infinity)) {
                    cameFrom.set(nk, currentKey);
                    gScore.set(nk, tentativeG);
                    const f = tentativeG + h(nx, ny);
                    open.set(nk, {x: nx, y: ny, g: tentativeG, f});
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
    async processTimeIncrement() {
        const actingMonsters = this.monsters.filter(
            (monster) => monster.isAlive() && monster.canAct(this.game.currentTick)
        );

        let anyMovement = false;
        for (const monster of actingMonsters) {
            const oldX = monster.x;
            const oldY = monster.y;
            monster.performAction(this);

            // Track if any monster moved or acted
            const moved = (monster.x !== oldX || monster.y !== oldY);
            if (moved) {
                anyMovement = true;
                // Check for traps after monster moves
                monster.checkForTraps(this.game);

                // Handle death effects and remove dead monsters (killed by traps)
                for (const m of this.monsters) {
                    if (!m.isAlive()) m.onDeath(this);
                }
                this.monsters = this.monsters.filter((m) => m.isAlive());

                // Only add delay if the monster is visible to the player
                const isVisible = monster.isAlive() && this.game.visible[monster.y] && this.game.visible[monster.y][monster.x];
                if (isVisible) {
                    // Render immediately after each visible monster moves so we can see it
                    this.game.render();
                    // Add a delay after each visible monster action to make movement visible
                    await this.game.sleep(50);
                }
            }
        }

        // Occasionally spawn a wandering monster (check every 200 ticks, ~3% chance)
        if (this.game.currentTick % 200 === 0 && Math.random() < 0.03) {
            this.trySpawnWanderingMonster();
        }

        // Process poison ticks (every 500 ticks, same rate as player)
        if (this.game.currentTick % 500 === 0) {
            for (const monster of this.monsters) {
                if (monster.isAlive() && monster.poisoned) {
                    const poisonDmg = monster.processPoisonTick(this.game);
                    if (poisonDmg > 0) {
                        const isVisible = this.game.visible[monster.y] && this.game.visible[monster.y][monster.x];
                        if (isVisible) {
                            this.game.addMessage(`The ${monster.getDisplayName()} takes ${poisonDmg} poison damage!`);
                            anyMovement = true;
                        }
                        if (!monster.isAlive()) {
                            if (isVisible) {
                                this.game.addMessage(`The ${monster.getDisplayName()} dies from poison!`);
                            }
                            Game.player.experience += monster.experience;
                            monster.onDeath(this);
                        }
                    }
                }
            }
            this.monsters = this.monsters.filter((m) => m.isAlive());
        }

        // Return whether any monster actually moved (for conditional rendering)
        return anyMovement;
    }

    // Combat methods
    monsterAttackPlayer(monster) {
        this.game.running = false;

        const chanceToEvade = Game.player.chanceToEvade();
        if ((Math.random() * 100) < chanceToEvade) {
            this.game.addMessage(`You evade the ${monster.getDisplayName()}'s attack!`);
            monster.scheduleNextAction(this.game.currentTick, monster.attackSpeed);
            return;
        }
        const dmg = Math.max(1, monster.getDamage());
        const actualDamage = Game.player.hitPlayer(dmg);

        if(actualDamage === 0) {
            this.game.addMessage(`The ${monster.getDisplayName()} attacks but you block it!`);
        } else {
            this.game.addMessage(`The ${monster.getDisplayName()} hits you for ${actualDamage} damage.`);
        }

        // Monster poison attack
        if (actualDamage > 0 && monster.poisonChance && Math.random() < monster.poisonChance) {
            const poisonDmg = monster.poisonDmgPerTick || 2;
            const poisonTicks = monster.poisonDuration || 5;
            Game.player.applyPoison(poisonDmg, poisonTicks);
            this.game.addMessage(`The ${monster.getDisplayName()}'s attack poisons you!`);
        }

        if (Game.player.isDead()) {
            this.game.gameOver = true;
            this.game.addMessage('You die. Game over.');
        }
        monster.scheduleNextAction(this.game.currentTick, monster.attackSpeed);
    }
    async attackMonster(monster) {
        // Player attacks a monster
        const attack = Game.player.getAttack();
        const physicalDamage = Math.floor((Math.random() * attack.baseDamage) + attack.bonus + attack.strengthBonus) + 1;

        // Apply physical damage with resistance
        const physicalResult = monster.takeDamage(physicalDamage, 'physical');
        let totalActualDamage = physicalResult.actualDamage;
        const damageBreakdown = [{
            type: 'physical',
            intended: physicalDamage,
            actual: physicalResult.actualDamage,
            resistance: physicalResult.resistance
        }];

        // Calculate and apply elemental damage
        const weapon = attack.weapon;
        const elementalDamages = weapon.getAllElementalDamage();

        for (const [type, amount] of Object.entries(elementalDamages)) {
            if (amount > 0) {
                // Apply to current HP (don't kill with elemental if already dead)
                if (monster.hp > 0) {
                    const elementalResult = monster.takeDamage(amount, type);
                    totalActualDamage += elementalResult.actualDamage;
                    damageBreakdown.push({
                        type: type,
                        intended: amount,
                        actual: elementalResult.actualDamage,
                        resistance: elementalResult.resistance
                    });
                }
            }
        }

        // Apply poison DoT if weapon has poison damage and monster survived
        if (monster.hp > 0) {
            const poisonAmount = weapon.getElementalDamage('poison');
            if (poisonAmount > 0 && monster.resistances.poison !== 0.0) {
                monster.applyPoison(Math.ceil(poisonAmount / 2), 5);
                this.game.addMessage(`${monster.getDisplayName()} is poisoned!`);
            }
        }

        const died = monster.hp <= 0;

        // Build damage message with resistance indicators
        let damageMsg = `You hit ${monster.getDisplayName()} for `;
        const damageParts = [];

        for (const part of damageBreakdown) {
            let partMsg = `${part.actual}`;
            if (part.resistance < 0.75) {
                partMsg += ' resisted';
            } else if (part.resistance > 1.25) {
                partMsg += ' CRITICAL';
            }
            if (part.type !== 'physical') {
                partMsg += ` ${part.type}`;
            }
            damageParts.push(partMsg);
        }

        damageMsg += damageParts.join(' + ') + ` damage (${totalActualDamage} total).`;
        this.game.addMessage(damageMsg);

        // Apply lifesteal
        const lifestealBonus = Game.player.getLifestealBonus();
        if (lifestealBonus > 0) {
            const lifestealAmount = Math.floor(totalActualDamage * lifestealBonus);
            if (lifestealAmount > 0) {
                const healed = Game.player.heal(lifestealAmount);
                if (healed > 0) {
                    this.game.addMessage(`You drain ${healed} health from ${monster.getDisplayName()}.`);
                }
            }
        }

        if (died) {
            this.game.addMessage(`${monster.getDisplayName()} dies.`);
            Game.player.gainExperience(monster.experience);
            monster.onDeath(this);

            // Check for loot drops
            this.rollMonsterLoot(monster);

            this.monsters = this.monsters.filter((m) => m !== monster);
            this.game.render();
        }

        await this.game.consumeTurn(Game.player.equippedWeapon().speed || 50);
    }

    // Roll for loot when a monster dies
    rollMonsterLoot(monster) {
        // Base drop chance: 20% for weak monsters, up to 80% for powerful ones
        const experienceThreshold = Math.max(1, monster.experience);
        const baseDropChance = Math.min(0.80, 0.20 + (experienceThreshold / 100) * 0.6);

        // Wealth ring bonus to drop chance
        const wealthBonus = Game.player.getGoldFindBonus() - 1.0; // Convert multiplier to bonus
        const finalDropChance = Math.min(0.95, baseDropChance + (wealthBonus * 0.2));

        if (Math.random() > finalDropChance) {
            return; // No drop
        }

        // Determine monster's effective level for loot quality
        const monsterLevel = this.estimateMonsterLevel(monster);
        const playerLuck = Game.player.luck;

        // Determine number of drops (rare chance for multiple items from tough monsters)
        let numDrops = 1;
        if (experienceThreshold > 50 && Math.random() < 0.15) {
            numDrops = 2; // 15% chance for 2 items from tough monsters
        }
        if (experienceThreshold > 100 && Math.random() < 0.05) {
            numDrops = 3; // 5% chance for 3 items from very tough monsters
        }

        const tile = this.game.dungeon.getTile(monster.x, monster.y);
        if (!tile) return;

        // Generate drops
        for (let i = 0; i < numDrops; i++) {
            const lootType = this.determineMonsterLootType(monster);
            let item;

            if (lootType === 'gold') {
                // Gold drop scales with monster difficulty
                const goldAmount = Math.floor((10 + experienceThreshold * 2) * (0.8 + Math.random() * 0.4));
                item = new Gold(monster.x, monster.y, goldAmount);
            } else if (lootType === 'boss') {
                // Boss-quality drop
                item = ItemFactory.createBossDrop(monster.x, monster.y, monsterLevel, playerLuck);
            } else {
                // Regular item with potential quality boost for tough monsters
                const options = {};
                if (lootType !== 'any') {
                    options.category = lootType;
                }
                if (experienceThreshold > 50) {
                    options.bossDropBonus = true; // Tough monsters drop better loot
                }

                item = ItemFactory.createLevelAppropriateItem(
                    monster.x,
                    monster.y,
                    monsterLevel,
                    playerLuck,
                    options
                );
            }

            if (item) {
                tile.addItem(item);
                if (i === 0) { // Only show message for first drop
                    const itemName = item instanceof Gold ? `${item.amount} gold` : (item.getDisplayName ? item.getDisplayName() : item.name);
                    this.game.addMessage(`${monster.getDisplayName()} dropped ${itemName}!`);
                }
            }
        }

        this.game.itemManager.updateItemMemory();
    }

    // Estimate a monster's level based on its stats
    estimateMonsterLevel(monster) {
        // Use experience as primary indicator, with bounds checking
        const levelFromExp = Math.max(1, Math.floor(monster.experience / 10));

        // Also check the monster's levelRange if available
        if (monster.constructor.levelRange) {
            const [minLevel, maxLevel] = monster.constructor.levelRange;
            const avgLevel = Math.floor((minLevel + maxLevel) / 2);
            // Average the two estimates
            return Math.floor((levelFromExp + avgLevel) / 2);
        }

        return levelFromExp;
    }

    // Determine what type of loot a monster should drop
    determineMonsterLootType(monster) {
        const experience = monster.experience;
        const monsterName = monster.getDisplayName().toLowerCase();

        // Boss monsters (very high experience) drop boss-quality loot
        if (experience > 100) {
            return 'boss';
        }

        // Monster-specific loot preferences
        if (monsterName.includes('dragon')) {
            // Dragons prefer dropping weapons, armor, or gold
            const roll = Math.random();
            if (roll < 0.3) return ItemCategory.WEAPON;
            if (roll < 0.5) return ItemCategory.ARMOR;
            return 'gold';
        }

        if (monsterName.includes('lich') || monsterName.includes('demon') || monsterName.includes('shaman')) {
            // Spellcasters prefer dropping scrolls, wands, or potions
            const roll = Math.random();
            if (roll < 0.4) return ItemCategory.SCROLL;
            if (roll < 0.7) return ItemCategory.WAND;
            return ItemCategory.POTION;
        }

        if (monsterName.includes('orc') || monsterName.includes('warrior') || monsterName.includes('berserker')) {
            // Warriors prefer dropping weapons or armor
            return Math.random() < 0.6 ? ItemCategory.WEAPON : ItemCategory.ARMOR;
        }

        if (monsterName.includes('goblin') || monsterName.includes('kobold')) {
            // Weaker monsters mostly drop gold or consumables
            const roll = Math.random();
            if (roll < 0.6) return 'gold';
            return ItemCategory.POTION;
        }

        // Default: random weighted drop
        const roll = Math.random();
        if (roll < 0.3) return 'gold';
        if (roll < 0.5) return ItemCategory.WEAPON;
        if (roll < 0.65) return ItemCategory.ARMOR;
        if (roll < 0.80) return ItemCategory.POTION;
        if (roll < 0.90) return ItemCategory.SCROLL;
        return ItemCategory.WAND;
    }
}

// Export for Node.js testing
if (typeof module !== 'undefined' && module.exports) {
    module.exports = {MonsterManager};
}
