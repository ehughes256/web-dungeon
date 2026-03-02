// Game class - main game logic and UI management
class Game {
    constructor() {
        // Initialize random color assignments for potions
        initializePotionColors();
        // Initialize random magic phrase assignments for scrolls
        initializeScrollMagicPhrases();
        // Initialize random material assignments for wands
        initializeWandMaterials();

        // Set global game instance reference
        Game.instance = this;
        Game.player = new Player(this, 0, 0);
        Game.player.giveStartingEquipment();
        this.canvas = document.getElementById('dungeon');
        this.ctx = this.canvas.getContext('2d');
        this.tileSize = 20;
        // Make dungeon twice as large as the viewport
        this.width = Math.floor(this.canvas.width / this.tileSize) * 2;
        this.height = Math.floor(this.canvas.height / this.tileSize) * 2;
        this.explored = [];
        this.visible = [];
        this.levelCache = {};
        this.gameOver = false;
        this.currentTick = 0;
        this.dungeonLevel = 1;
        this.showingEquipped = true;
        this.timeManager = new TimeManager(this);
        this.monsterManager = new MonsterManager(this);
        this.itemManager = new ItemManager(this);
        // Examine / Inspect mode state
        this.examineMode = false;
        this.examineCursor = null; // {x,y}
        // Direction select mode (for force/lockpick)
        this.directionSelectMode = null;
        // Targeting mode state (for wands and ranged attacks)
        this.targetingMode = false;
        this.targetingCursor = null; // {x,y}
        this.targetingCallback = null; // Function to call when target is selected
        this.targetingItem = null; // The wand/item being used
        // Running state
        this.running = false;
        this.generateDungeon();
        this.monsterManager.spawnMonsters();
        this.itemManager.generateItems();
        this.computeFOV();
        this.setupEventListeners();
        this.render();
        this.updateUI();
        this.buildInventory();
    }

    // --- Shadow Casting FOV (more efficient) ---
    computeFOV(radius = 8) {
        if (!this.visible || !this.explored) {
            this.visible = Array(this.height).fill().map(() => Array(this.width).fill(false));
            this.explored = Array(this.height).fill().map(() => Array(this.width).fill(false));
        }
        for (let y = 0; y < this.height; y++) {
            for (let x = 0; x < this.width; x++) {
                this.visible[y][x] = false;
            }
        }
        const px = Game.player.x, py = Game.player.y;
        this.visible[py][px] = true;
        this.explored[py][px] = true;
        for (let octant = 0; octant < 8; octant++) {
            this.castShadow(px, py, 1, 1.0, 0.0, radius, octant);
        }
        this.itemManager.updateItemMemory();
    }

    castShadow(cx, cy, row, start, end, radius, octant) {
        if (start < end) return;
        const radiusSquared = radius * radius;
        for (let currentRow = row; currentRow <= radius; currentRow++) {
            let dx = -currentRow - 1;
            let dy = -currentRow;
            let blocked = false;
            let newStart = 0;
            while (dx <= 0) {
                dx++;
                const [mx, my] = this.transformOctant(cx, cy, dx, dy, octant);
                if (!this.dungeon.inBounds(mx, my)) continue;
                const leftSlope = (dx - 0.5) / (dy + 0.5);
                const rightSlope = (dx + 0.5) / (dy - 0.5);
                if (start < rightSlope) continue;
                if (end > leftSlope) break;
                if (dx * dx + dy * dy <= radiusSquared) {
                    this.visible[my][mx] = true;
                    this.explored[my][mx] = true;
                }
                if (blocked) {
                    if (this.dungeon)
                        if (this.dungeon.isOpaque(mx, my)) {
                            newStart = rightSlope;
                            continue;
                        } else {
                            blocked = false;
                            start = newStart;
                        }
                } else {
                    if (this.dungeon.isOpaque(mx, my) && currentRow < radius) {
                        blocked = true;
                        this.castShadow(cx, cy, currentRow + 1, start, leftSlope, radius, octant);
                        newStart = rightSlope;
                    }
                }
            }
            if (blocked) break;
        }
    }

    transformOctant(cx, cy, dx, dy, octant) {
        switch (octant) {
            case 0:
                return [cx + dx, cy - dy];
            case 1:
                return [cx + dy, cy - dx];
            case 2:
                return [cx - dy, cy - dx];
            case 3:
                return [cx - dx, cy - dy];
            case 4:
                return [cx - dx, cy + dy];
            case 5:
                return [cx - dy, cy + dx];
            case 6:
                return [cx + dy, cy + dx];
            case 7:
                return [cx + dx, cy + dy];
            default:
                return [cx, cy];
        }
    }


    descend() {
        if (this.gameOver) return;
        this.dungeonLevel += 1;
        if (this.levelCache[this.dungeonLevel]) {
            this.addMessage(`You return to level ${this.dungeonLevel}.`);
        } else {
            this.generateDungeon();
            this.monsterManager.spawnMonsters();
            this.itemManager.generateItems();
            if (this.dungeon.upStair) {
                Game.player.x = this.dungeon.upStair.x;
                Game.player.y = this.dungeon.upStair.y;
            }
            this.computeFOV();
            this.addMessage(`You discover new level ${this.dungeonLevel}.`);
        }
        this.computeFOV();
        this.render();
        this.updateUI();
    }

    ascend() {
        if (this.gameOver) return;
        if (this.dungeonLevel === 1) {
            this.addMessage('You are already at the top.');
            return;
        }
        this.dungeonLevel -= 1;
        if (this.dungeon.downStair) {
            Game.player.x = this.dungeon.downStair.x;
            Game.player.y = this.dungeon.downStair.y;
        }
        this.computeFOV();
        this.render();
        this.updateUI();
        this.addMessage(`You return to level ${this.dungeonLevel}.`);
    }

    generateDungeon() {
        this.itemManager = new ItemManager(this);
        this.monsterManager = new MonsterManager(this);
        this.explored = Array(this.height).fill().map(() => Array(this.width).fill(false));
        this.visible = Array(this.height).fill().map(() => Array(this.width).fill(false));

        const mazeGenerator = new MazeGenerator(this.width, this.height);
        this.dungeon = mazeGenerator.generateDungeon();

        // Place traps after dungeon generation
        mazeGenerator.placeTraps(this.dungeon, this.dungeonLevel);

        // Lock some doors
        mazeGenerator.lockDoors(this.dungeon, this.dungeonLevel);

        // Place treasure chests
        mazeGenerator.placeChests(this.dungeon, this.dungeonLevel);

        if (this.dungeon.rooms.length && !this.levelCache[this.dungeonLevel]) {
            const r = this.dungeon.rooms[0];
            Game.player.x = r.x + Math.floor(r.width / 2);
            Game.player.y = r.y + Math.floor(r.height / 2);
        }
    }


    async runInDirection(dx, dy) {
        if (this.gameOver) return;

        this.running = true;

        while (this.running) {
            const newX = Game.player.x + dx;
            const newY = Game.player.y + dy;

            // Stop if we hit a wall or go out of bounds
            const tile = this.dungeon.getTile(newX, newY);
            if (!tile || tile.type === '#') {
                this.running = false;
                break;
            }

            // Stop if there's a monster in the next position
            if (this.monsterManager.monsters.some(m => m.x === newX && m.y === newY)) {
                this.running = false;
                break;
            }

            // Stop at doors or stairs
            const tileType = tile.type;
            if (tileType === '+' || tileType === '/' || tileType === '<' || tileType === '>') {
                this.running = false;
                break;
            }

            if (this.dungeon.isValidMove(newX, newY)) {
                Game.player.x = newX;
                Game.player.y = newY;

                // Check for traps - this will also stop running if trap is discovered
                this.checkForTraps();

                // Check for chests - stop running on unopened chests
                const chestResult = this.checkForChest();
                if (chestResult) this.running = false;

                const foundItem = this.itemManager.checkForItems();
                if (foundItem) this.running = false;
            }
            this.render();

            // Small delay to make running visible but fast
            await this.sleep(100);

            // Consume a turn for each step
            await this.consumeTurn(Game.player.speed);

            // In open rooms, continue running in the same direction
            // Only stop if we can't continue in the current direction
            const nextX = Game.player.x + dx;
            const nextY = Game.player.y + dy;

            // Stop if the next tile in our direction is blocked
            if (!this.dungeon.inBounds(nextX, nextY) ||
                (!this.dungeon.isValidMove(newX, newY))) {
                this.running = false;
                break;
            }


            // Check if we're in a narrow corridor and need to handle turns
            const walkableDirections = this.dungeon.getWalkableDirections(Game.player.x, Game.player.y);

            // If we're in a corridor (2 or fewer walkable directions), handle corridor logic
            if (walkableDirections.length <= 2) {
                if (walkableDirections.length === 2) {
                    // Find the direction that's not backwards
                    const backwards = {dx: -dx, dy: -dy};
                    const forward = walkableDirections.find(dir =>
                        !(dir.dx === backwards.dx && dir.dy === backwards.dy)
                    );

                    if (forward) {
                        dx = forward.dx;
                        dy = forward.dy;
                    } else {
                        // Dead end
                        this.running = false;
                        break;
                    }
                } else if (walkableDirections.length === 1) {
                    // Dead end
                    this.running = false;
                    break;
                }
            }
            // If walkableDirections.length > 2, we're in an open room
            // Just continue in the same direction (dx, dy remain unchanged)
        }
    }

    setupEventListeners() {
        document.addEventListener('keydown', async (e) => {
            if (this.gameOver) return;
            const k = e.key.toLowerCase();
            const shiftHeld = e.shiftKey;

            // Targeting mode key handling (for wands)
            if (this.targetingMode) {
                let dx = 0, dy = 0;
                switch (k) {
                    case 'arrowup':
                    case 'k':
                        dy = -1;
                        break;
                    case 'arrowdown':
                    case 'j':
                        dy = 1;
                        break;
                    case 'arrowleft':
                    case 'h':
                        dx = -1;
                        break;
                    case 'arrowright':
                    case 'l':
                        dx = 1;
                        break;
                    case 'y':
                        dx = -1;
                        dy = -1;
                        break;
                    case 'u':
                        dx = 1;
                        dy = -1;
                        break;
                    case 'b':
                        dx = -1;
                        dy = 1;
                        break;
                    case 'n':
                        dx = 1;
                        dy = 1;
                        break;
                    case 'enter':
                        // Confirm target
                        if (this.targetingCallback) {
                            this.targetingCallback(this.targetingCursor.x, this.targetingCursor.y);
                        }
                        this.exitTargetingMode();
                        return;
                    case 'escape':
                        this.addMessage('Targeting cancelled.');
                        this.exitTargetingMode();
                        return;
                    default:
                        return;
                }
                if (dx || dy) {
                    this.moveTargetingCursor(dx, dy);
                    e.preventDefault();
                }
                return; // Prevent normal mode handling while targeting
            }

            // Examine mode key handling (non-turn consuming)
            if (this.examineMode) {
                let dx = 0, dy = 0;
                switch (k) {
                    case 'arrowup':
                    case 'k':
                        dy = -1;
                        break;
                    case 'arrowdown':
                    case 'j':
                        dy = 1;
                        break;
                    case 'arrowleft':
                    case 'h':
                        dx = -1;
                        break;
                    case 'arrowright':
                    case 'l':
                        dx = 1;
                        break;
                    case 'y':
                        dx = -1;
                        dy = -1;
                        break;
                    case 'u':
                        dx = 1;
                        dy = -1;
                        break;
                    case 'b':
                        dx = -1;
                        dy = 1;
                        break;
                    case 'n':
                        dx = 1;
                        dy = 1;
                        break;
                    case 'enter':
                        this.describeAt(this.examineCursor.x, this.examineCursor.y, true);
                        return;
                    case 'x': // toggle exit
                    case 'escape':
                        this.exitExamineMode();
                        return;
                    default:
                        return;
                }
                if (dx || dy) {
                    this.moveExamineCursor(dx, dy);
                    e.preventDefault();
                }
                return; // Prevent normal mode handling while examining
            }

            // Direction select mode (for force / lockpick)
            if (this.directionSelectMode) {
                let ddx = 0, ddy = 0;
                let selfTarget = false;
                switch (k) {
                    case 'arrowup': case 'k': ddy = -1; break;
                    case 'arrowdown': case 'j': ddy = 1; break;
                    case 'arrowleft': case 'h': ddx = -1; break;
                    case 'arrowright': case 'l': ddx = 1; break;
                    case 'y': ddx = -1; ddy = -1; break;
                    case 'u': ddx = 1; ddy = -1; break;
                    case 'b': ddx = -1; ddy = 1; break;
                    case 'n': ddx = 1; ddy = 1; break;
                    case '.': case 'enter': selfTarget = true; break;
                    case 'escape':
                        this.directionSelectMode = null;
                        this.addMessage('Cancelled.');
                        return;
                    default: return;
                }
                if (ddx || ddy || selfTarget) {
                    await this.handleDirectionSelect(ddx, ddy);
                    e.preventDefault();
                }
                return;
            }

            let dx = 0, dy = 0;
            switch (k) {
                // Movement and actions
                case 'arrowup':
                    dy = -1;
                    break;
                case 'arrowdown':
                    dy = 1;
                    break;
                case 'arrowleft':
                    dx = -1;
                    break;
                case 'arrowright':
                    dx = 1;
                    break;
                case 'h':
                    dx = -1;
                    break;
                case 'j':
                    dy = 1;
                    break;
                case 'k':
                    dy = -1;
                    break;
                case 'l':
                    dx = 1;
                    break;
                case 'y':
                    dx = -1;
                    dy = -1;
                    break;
                case 'u':
                    dx = 1;
                    dy = -1;
                    break;
                case 'b':
                    dx = -1;
                    dy = 1;
                    break;
                case 'n':
                    dx = 1;
                    dy = 1;
                    break;
                case '>':
                    this.useDownStairs();
                    return;
                case '<':
                    this.useUpStairs();
                    return;
                case 'o':
                    if (shiftHeld) {
                        await this.openChestAtPlayer();
                    } else {
                        await this.openAdjacentDoors();
                    }
                    return;
                case 'c':
                    await this.closeAdjacentDoors();
                    return;
                case '/':
                    this.toggleSidebarView();
                    return;
                case 'x':
                    this.startExamineMode();
                    return; // Enter examine mode
                case '.':
                    this.addMessage('You wait a moment...');
                    await this.consumeTurn(100);
                    return;
                case 't':
                    if (Game.player.canTeleport() && Game.player.mana >= 20) {
                        await this.activateTeleport();
                    } else if (!Game.player.canTeleport()) {
                        this.addMessage('You have no means to teleport!');
                    } else {
                        this.addMessage('Not enough mana to teleport! (Need 20)');
                    }
                    return;
                case 'f':
                    this.startForceMode();
                    return;
                case 'z':
                    if (Game.player.canGoInvisible() && Game.player.mana >= 30) {
                        await this.toggleInvisibility();
                    } else if (!Game.player.canGoInvisible()) {
                        this.addMessage('You have no means to become invisible!');
                    } else {
                        this.addMessage('Not enough mana to activate invisibility! (Need 30)');
                    }
                    return;
                default:
                    return;
            }
            if (dx || dy) {
                this.running = false;
                if (shiftHeld) {
                    await this.runInDirection(dx, dy);
                } else {
                    await this.handleMove(dx, dy);
                }
                e.preventDefault();
            }
        });
    }

    startExamineMode() {
        this.examineMode = true;
        this.examineCursor = {x: Game.player.x, y: Game.player.y};
        this.addMessage('Examine: move cursor with movement keys, Enter to inspect, Esc/X to exit.');
        this.render();
    }

    exitExamineMode() {
        this.examineMode = false;
        this.examineCursor = null;
        this.addMessage('Examine mode ended.');
        this.render();
    }

    startTargetingMode(item, callback, initialTarget = null) {
        this.targetingMode = true;
        this.targetingItem = item;
        this.targetingCallback = callback;

        // Start cursor at initial target or nearest visible monster
        if (initialTarget) {
            this.targetingCursor = {x: initialTarget.x, y: initialTarget.y};
        } else {
            // Find nearest visible monster
            let nearestMonster = null;
            let nearestDist = Infinity;

            for (const monster of this.monsterManager.monsters) {
                if (!this.visible[monster.y] || !this.visible[monster.y][monster.x]) continue;

                const dx = monster.x - Game.player.x;
                const dy = monster.y - Game.player.y;
                const dist = Math.sqrt(dx * dx + dy * dy);

                if (dist < nearestDist) {
                    nearestDist = dist;
                    nearestMonster = monster;
                }
            }

            if (nearestMonster) {
                this.targetingCursor = {x: nearestMonster.x, y: nearestMonster.y};
            } else {
                // Default to player position
                this.targetingCursor = {x: Game.player.x, y: Game.player.y};
            }
        }

        const itemName = item.getDisplayName ? item.getDisplayName() : item.name;
        this.addMessage(`Targeting with ${itemName}. Move cursor, Enter to confirm, Esc to cancel.`);
        this.render();
    }

    exitTargetingMode() {
        this.targetingMode = false;
        this.targetingCursor = null;
        this.targetingCallback = null;
        this.targetingItem = null;
        this.render();
    }

    moveTargetingCursor(dx, dy) {
        if (!this.targetingCursor) return;
        const nx = this.targetingCursor.x + dx;
        const ny = this.targetingCursor.y + dy;
        if (!this.dungeon.inBounds(nx, ny)) return;

        this.targetingCursor.x = nx;
        this.targetingCursor.y = ny;

        // Auto-describe target
        this.describeTargetAt(nx, ny);
        this.render();
    }

    describeTargetAt(x, y) {
        if (!this.dungeon.inBounds(x, y)) {
            this.addMessage('Out of bounds.');
            return;
        }

        // Check for monster
        const monster = this.monsterManager.monsters.find(m => m.x === x && m.y === y);
        if (monster) {
            if (this.visible[y] && this.visible[y][x]) {
                this.addMessage(`Target: ${monster.getDisplayName()} (${monster.hp}/${monster.maxHp} HP)`);
            } else {
                this.addMessage(`Target: unknown (not visible)`);
            }
            return;
        }

        // Check for tile
        const tile = this.dungeon.getTile(x, y);
        if (tile) {
            if (tile.type === '#') {
                this.addMessage('Target: wall');
            } else if (tile.type === '.') {
                this.addMessage('Target: floor');
            } else {
                this.addMessage(`Target: ${tile.type}`);
            }
        }
    }

    moveExamineCursor(dx, dy) {
        if (!this.examineCursor) return;
        const nx = this.examineCursor.x + dx;
        const ny = this.examineCursor.y + dy;
        if (!this.dungeon.inBounds(nx, ny)) return;
        if (!this.explored[ny][nx]) return; // keep cursor within explored
        this.examineCursor.x = nx;
        this.examineCursor.y = ny;
        // Auto-describe on move (lightweight)
        this.describeAt(nx, ny, false);
        this.render();
    }

    describeAt(x, y, verbose = false) {
        if (!this.dungeon.inBounds(x, y)) {
            this.addMessage('Out of bounds.');
            return;
        }
        if (!this.explored[y][x]) {
            this.addMessage('Unexplored darkness.');
            return;
        }
        // Monster first (if visible)
        const monster = this.monsterManager.monsters.find(m => m.x === x && m.y === y && this.visible[m.y] && this.visible[m.y][m.x]);
        if (monster) {
            this.addMessage(`${monster.getDisplayName()}: ${monster.description}`);
            return;
        }
        // Item if visible
        const tile = this.dungeon.getTile(x, y);
        if (tile && tile.hasItems() && this.visible[y] && this.visible[y][x]) {
            const item = tile.getTopItem();
            if (item) {
                const displayName = item.getDisplayName ? item.getDisplayName() : item.name;
                this.addMessage(`${displayName}: ${item.description || 'An indescribable object.'}`);
                return;
            }
        }
        // Chest description (if visible)
        if (tile && tile.chest && this.visible[y] && this.visible[y][x]) {
            if (tile.chest.opened) {
                this.addMessage('An opened chest, picked clean.');
            } else if (tile.chest.locked) {
                this.addMessage('A sturdy locked chest.');
            } else {
                this.addMessage('A wooden chest.');
            }
            return;
        }
        // Tile description - delegate to dungeon
        const tilDesc = this.dungeon.getTileDescription(x, y);
        this.addMessage(tilDesc);
    }

    // Toggle between inventory and stats sidebar views
    toggleSidebarView() {
        this.showingEquipped = !this.showingEquipped;
        this.buildInventory();
    }

    // Restored inventory UI construction
    buildInventory() {
        const container = document.getElementById('inventoryContents');
        if (!container) return;
        const p = Game.player;
        const lines = [];

        // Equipped section
        lines.push(`<div class='equipped-section'>`);
        if (this.showingEquipped) {
            lines.push(`<h4>Currently Equipped</h4>`);
            lines.push(`<div class='equipped-grid'>`);
            const renderSlot = (bodyPartName) => {
                const itemObject = p.body[bodyPartName];
                const hasItem = itemObject && !(itemObject instanceof EmptyItem);
                const slotClass = hasItem ? 'equipped-slot has-item' : 'equipped-slot';
                let itemText = hasItem ? (itemObject.getDisplayName ? itemObject.getDisplayName() : itemObject.name) : 'None';
                const itemClass = hasItem ? 'slot-item' : 'slot-item slot-empty';

                // Make equipped item name clickable
                if (hasItem) {
                    itemText = `<span class="item-name-clickable" onclick="game.showEquippedItemInfo('${bodyPartName}')">${itemText}</span>`;

                    // Show unidentified indicator
                    if (!itemObject.identified) {
                        itemText += ` <span class="tag" style="background-color: #6666aa; font-size: 0.8em;">Unidentified</span>`;
                    }

                    // Add cursed indicator
                    if (itemObject.cursed && itemObject.identified) {
                        itemText += ' <span class="tag" style="background-color: #aa0000; color: #fff; font-size: 0.8em;">CURSED</span>';
                    }
                }

                const unequipButton = (hasItem && !(itemObject instanceof Fists)) ? `<div class='slot-actions'><button onclick="game.unequipSlot('${bodyPartName}')">Remove</button></div>` : '';
                return `<div class='${slotClass}'>
                    <span class='slot-label'>${bodyPartName}:</span>
                    <span class='${itemClass}'>${itemText}</span>
                    ${unequipButton}
                </div>`;
            };
            lines.push(renderSlot("weapon"));
            lines.push(renderSlot("armor"));
            lines.push(renderSlot("helmet"));
            lines.push(renderSlot("ring"));
            lines.push(renderSlot("gloves"));
            lines.push(renderSlot("boots"));
            lines.push('</div>');
            // Show consumables (food, potions, scrolls, wands, keys, lockpicks) under equipped view
            const quickSection = (title, arr, renderFn) => {
                if (!arr || !arr.length) return;
                lines.push(`<div class='inv-section'><h4>${title}</h4>`);
                arr.forEach((item, idx) => lines.push(renderFn(item, idx)));
                lines.push('</div>');
            };
            quickSection('Food', p.inventory.food, (it, i) => this.renderInvRow('food', it, i));
            quickSection('Potions', p.inventory.potions, (it, i) => this.renderInvRow('potions', it, i));
            quickSection('Scrolls', p.inventory.scrolls, (it, i) => this.renderInvRow('scrolls', it, i));
            quickSection('Wands', p.inventory.wands, (it, i) => this.renderInvRow('wands', it, i));
            quickSection('Keys', p.inventory.keys, (it, i) => this.renderInvRow('keys', it, i));
            quickSection('Lockpicks', p.inventory.lockpicks, (it, i) => this.renderInvRow('lockpicks', it, i));
            lines.push('</div>');
        } else {
            const section = (title, arr, renderFn) => {
                if (!arr || !arr.length) return;
                lines.push(`<div class='inv-section'><h4>${title}</h4>`);
                arr.forEach((item, idx) => lines.push(renderFn(item, idx)));
                lines.push('</div>');
            };
            lines.push(`<h4>Inventory</h4>`);
            lines.push(`<div class="in-pack">`);
            section('Potions', p.inventory.potions, (it, i) => this.renderInvRow('potions', it, i));
            section('Scrolls', p.inventory.scrolls, (it, i) => this.renderInvRow('scrolls', it, i));
            section('Wands', p.inventory.wands, (it, i) => this.renderInvRow('wands', it, i));
            section('Weapons', p.inventory.weapons, (it, i) => this.renderInvRow('weapons', it, i, p.equippedWeapon() === it));
            section('Armor', p.inventory.armor, (it, i) => this.renderInvRow('armor', it, i, p.equippedArmor().includes(it)));
            section('Food', p.inventory.food, (it, i) => this.renderInvRow('food', it, i));
            section('Keys', p.inventory.keys, (it, i) => this.renderInvRow('keys', it, i));
            section('Lockpicks', p.inventory.lockpicks, (it, i) => this.renderInvRow('lockpicks', it, i));
            lines.push(`</div>`);
        }
        container.innerHTML = lines.join('');
    }

    renderInvRow(category, item, index, equipped = false) {
        const tags = [];
        if (equipped) tags.push('<span class="tag">Eq</span>');

        // Show unidentified indicator for equipped items
        if (equipped && !item.identified && (category === 'weapons' || category === 'armor')) {
            tags.push(`<span class="tag" style="background-color: #6666aa;">Unidentified</span>`);
        }

        if (item.cursed && item.identified) tags.push('<span class="tag" style="background-color: #aa0000; color: #fff;">CURSED</span>');
        if (category === 'weapons') tags.push(`<span class='tag'>+${item.identified ? item.getDamage() : "?"} atk</span>`);
        if (category === 'armor') tags.push(`<span class='tag'>+${item.identified ? item.defense : "?"} def</span>`);
        if (category === 'potions') {
            if (item.healAmount) tags.push(`<span class='tag'>+${item.identified ? item.healAmount : "?"} HP</span>`);
            if (item.count > 1) tags.push(`<span class='tag'>x${item.count}</span>`);
        }
        if (category === 'scrolls') {
            if (item.count > 1) tags.push(`<span class='tag'>x${item.count}</span>`);
        }
        if (category === 'wands') {
            if (item.identified) {
                tags.push(`<span class='tag'>${item.charges}/${item.maxCharges}</span>`);
            } else {
                tags.push(`<span class='tag'>?/?</span>`);
            }
        }
        if (category === 'food') {
            tags.push(`<span class='tag'>+${item.hungerRestore} food</span>`);
            if (item.count > 1) tags.push(`<span class='tag'>x${item.count}</span>`);
        }
        if (category === 'keys' || category === 'lockpicks') {
            if (item.count > 1) tags.push(`<span class='tag'>x${item.count}</span>`);
        }
        let actionButtons = '';
        if (category === 'weapons' && !(item instanceof Fists)) {
            actionButtons += equipped ? `<button onclick="game.unequipInventoryItem('weapons')">Unequip</button>` : `<button onclick="game.equipInventoryItem('weapons',${index})">Equip</button>`;
        }
        if (category === 'armor') {
            actionButtons += equipped ? `<button onclick="game.unequipInventoryItem('armor')">Unequip</button>` : `<button onclick="game.equipInventoryItem('armor',${index})">Equip</button>`;
        }
        if (category === 'potions') actionButtons += `<button onclick="game.useInventoryItem('potions',${index})">Drink</button>`;
        if (category === 'scrolls') actionButtons += `<button onclick="game.useInventoryItem('scrolls',${index})">Cast</button>`;
        if (category === 'wands') actionButtons += `<button onclick="game.useInventoryItem('wands',${index})">Zap</button>`;
        if (category === 'food') actionButtons += `<button onclick="game.useInventoryItem('food',${index})">Eat</button>`;
        if (category === 'lockpicks') actionButtons += `<button onclick="game.useInventoryItem('lockpicks',${index})">Use</button>`;
        actionButtons += `<button onclick="Game.player.dropInventoryItem('${category}',${index})">Drop</button>`;

        // Make item name clickable to show details
        const displayName = (item.getDisplayName && typeof item.getDisplayName === 'function') ? item.getDisplayName() : (item.name || 'Unknown');
        const itemName = `<span class="item-name-clickable" onclick="game.showItemInfoByIndex('${category}', ${index})">${displayName}</span>`;

        return `<div class='inv-item-row'><div style='flex:1 1 auto;'>${itemName} ${tags.join(' ')}</div><div class='inv-actions'>${actionButtons}</div></div>`;
    }

    equipInventoryItem(category, index) {
        if (category === 'weapons') {
            const w = Game.player.inventory.weapons[index];
            if (!w) return;
            const result = Game.player.equipWeapon(w);
            if (result === 'cursed') {
                const current = Game.player.equippedWeapon();
                const displayName = current.getDisplayName ? current.getDisplayName() : current.name;
                this.addMessage(`The ${displayName} is cursed! You cannot remove it!`);
            } else {
                const displayName = w.getDisplayName ? w.getDisplayName() : w.name;
                this.addMessage(`You equip ${displayName}.`);
            }
        } else if (PlayerBody.armorLocations.includes(category)) {
            const a = Game.player.inventory.armor[index];
            if (!a) return;
            const result = Game.player.equipArmor(a);
            if (result === 'cursed') {
                const current = Game.player.body[a.bodyLocation];
                const displayName = current.getDisplayName ? current.getDisplayName() : current.name;
                this.addMessage(`The ${displayName} is cursed! You cannot remove it!`);
            } else {
                const displayName = a.getDisplayName ? a.getDisplayName() : a.name;
                this.addMessage(`You don ${displayName}.`);
            }
        }
        this.buildInventory();
        this.updateUI();
    }

    unequipInventoryItem(category) {
        if (category === 'weapons' && Game.player.equippedWeapon()) {
            const result = Game.player.unEquipWeapon();
            if (result === 'cursed') {
                const weapon = Game.player.equippedWeapon();
                const displayName = weapon.getDisplayName ? weapon.getDisplayName() : weapon.name;
                this.addMessage(`The ${displayName} is cursed! You cannot remove it!`);
            } else {
                const displayName = result.getDisplayName ? result.getDisplayName() : result.name;
                this.addMessage(`You stow ${displayName}.`);
            }
        }
        if (category === 'armor') {
            const equipped = Game.player.equippedArmor();
            equipped.forEach(a => {
                const result = Game.player.unEquipArmor(a);
                if (result === 'cursed') {
                    const displayName = a.getDisplayName ? a.getDisplayName() : a.name;
                    this.addMessage(`The ${displayName} is cursed! You cannot remove it!`);
                } else if (result) {
                    const displayName = a.getDisplayName ? a.getDisplayName() : a.name;
                    this.addMessage(`You remove ${displayName}.`);
                }
            });
        }
        this.buildInventory();
        this.updateUI();
    }

    unequipSlot(bodyPartName) {
        const p = Game.player;
        if (bodyPartName === 'weapon') {
            const weapon = p.body.weapon;
            if (weapon && !(weapon instanceof EmptyItem) && !(weapon instanceof Fists)) {
                const result = p.unEquipWeapon();
                const displayName = weapon.getDisplayName ? weapon.getDisplayName() : weapon.name;
                if (result === 'cursed') {
                    this.addMessage(`The ${displayName} is cursed! You cannot remove it!`);
                } else {
                    this.addMessage(`You stow ${displayName}.`);
                }
            }
        } else if (p.body[bodyPartName]) {
            const item = p.body[bodyPartName];
            if (item && !(item instanceof EmptyItem)) {
                const result = p.unEquipArmor(item);
                const displayName = item.getDisplayName ? item.getDisplayName() : item.name;
                if (result === 'cursed') {
                    this.addMessage(`The ${displayName} is cursed! You cannot remove it!`);
                } else if (result) {
                    this.addMessage(`You remove ${displayName}.`);
                }
            }
        }
        this.buildInventory();
        this.updateUI();
    }

    async useInventoryItem(category, index) {
        const p = Game.player;
        const arr = p.inventory[category];
        if (!arr || !arr[index]) {
            this.addMessage('Nothing to use.');
            return;
        }
        const item = arr[index];
        if (category === 'potions') {
            if (typeof item.use === 'function') {
                const result = item.use(this);
                if (result && result.message) this.addMessage(result.message);
            } else {
                const healAmount = item.healAmount || 20;
                const actualHeal = p.heal(healAmount);
                const displayName = item.getDisplayName ? item.getDisplayName() : item.name;
                this.addMessage(`You drink ${displayName} (+${actualHeal} HP).`);
            }
            item.count -= 1;
            if (item.count <= 0) arr.splice(index, 1);
            this.consumeTurn(20);
        } else if (category === 'scrolls') {
            if (typeof item.use === 'function') {
                const displayName = item.getDisplayName ? item.getDisplayName() : item.name;
                this.addMessage(`You read the ${displayName}.`);
                item.use(this);
            }
            item.count -= 1;
            if (item.count <= 0) arr.splice(index, 1);
            await this.consumeTurn(30);
        } else if (category === 'wands') {
            if (typeof item.use === 'function') {
                const result = await item.use(this);
                if (result && result.success) {
                    // Remove wand if empty
                    if (item.charges <= 0) {
                        const displayName = item.getDisplayName ? item.getDisplayName() : item.name;
                        arr.splice(index, 1);
                        this.addMessage(`The ${displayName} crumbles to dust.`);
                    }
                    await this.consumeTurn(item.speed || 15);
                }
            }
        } else if (category === 'food') {
            const result = item.use(this);
            if (result && result.message) this.addMessage(result.message);
            item.count -= 1;
            if (item.count <= 0) arr.splice(index, 1);
            this.consumeTurn(10);
        } else if (category === 'lockpicks') {
            this.startLockpickMode();
            return; // Don't consume turn yet - direction select will handle it
        }
        this.buildInventory();
        this.updateUI();
        this.render();
    }

    async handleMove(dx, dy) {
        const nx = Game.player.x + dx, ny = Game.player.y + dy;
        if (nx < 0 || ny < 0 || nx >= this.width || ny >= this.height) return;
        const tile = this.dungeon.getTile(nx, ny);
        if (tile && tile.type === '+') {
            if (tile.locked) {
                if (Game.player.hasKey()) {
                    Game.player.useKey();
                    tile.locked = false;
                    this.dungeon.setTileType(nx, ny, '/');
                    this.addMessage('You unlock the door with a key.');
                    await this.consumeTurn(20);
                } else {
                    this.addMessage('The door is locked.');
                }
            } else {
                this.dungeon.setTileType(nx, ny, '/');
                this.addMessage('You open the door.');
                await this.consumeTurn(20);
            }
            return;
        }
        const monster = this.monsterManager.monsters.find(m => m.x === nx && m.y === ny);
        if (monster) {
            const result = Game.player.attemptAttack(monster);
            if (result.hit) {
                await this.monsterManager.attackMonster(monster);
            } else {
                this.addMessage('You miss!');
                await this.consumeTurn(Game.player.equippedWeapon().speed || 50);
            }
            return;
        }
        if (this.dungeon.isValidMove(nx, ny)) {
            Game.player.x = nx;
            Game.player.y = ny;

            // Check for traps
            this.checkForTraps();

            // Check for chests
            this.checkForChest();

            this.itemManager.checkForItems();
            await this.consumeTurn(Game.player.speed);
        }
    }

    checkForTraps() {
        const tile = this.dungeon.getTile(Game.player.x, Game.player.y);
        if (!tile || !tile.trap) return;

        const trap = tile.trap;

        // If trap is already discovered or triggered, don't do anything
        if (trap.triggered) return;

        // Calculate detection chance based on intelligence and luck
        const baseChance = 5; // 5% base chance
        const intBonus = Math.floor((Game.player.intelligence - 50) / 10); // +1% per 10 int above 50
        const luckBonus = Math.floor((Game.player.luck - 50) / 20); // +1% per 20 luck above 50
        const equipmentBonus = Game.player.getTrapDetectionBonus(); // From equipment like Ring of Searching

        const detectionDifficulty = trap.getDetectionDifficulty();
        const detectionChance = Math.min(95, Math.max(1, baseChance + intBonus + luckBonus + equipmentBonus + (100 - detectionDifficulty) / 2));

        const roll = Math.random() * 100;
        if (roll < detectionChance) {
            // Player spotted the trap!
            trap.discovered = true;
            this.addMessage(`You spot a ${trap.name}!`);
            this.running = false; // Stop running
        } else {
            // Trap was not spotted - trigger it!
            trap.trigger(this, Game.player);
            trap.discovered = true; // Traps become visible after triggering
            this.running = false; // Stop running when trap triggers
        }
    }

    async activateTeleport() {
        // Teleport to random valid location
        if (!Game.player.consumeMana(20)) {
            this.addMessage('Not enough mana!');
            return;
        }

        const attempts = 100;
        for (let i = 0; i < attempts; i++) {
            const x = Math.floor(Math.random() * this.width);
            const y = Math.floor(Math.random() * this.height);

            if (this.dungeon.isValidMove(x, y)) {
                const hasMonster = this.monsterManager.monsters.some(m => m.x === x && m.y === y);
                if (!hasMonster) {
                    Game.player.x = x;
                    Game.player.y = y;
                    this.addMessage('You teleport through space!');
                    this.computeFOV();
                    this.render();
                    await this.consumeTurn(100);
                    return;
                }
            }
        }
        this.addMessage('Teleportation failed!');
        await this.consumeTurn(50);
    }

    async toggleInvisibility() {
        if (Game.player.invisible) {
            // Already invisible, turn it off (free action)
            Game.player.invisible = false;
            this.addMessage('You become visible again.');
            this.render();
        } else {
            // Activate invisibility
            if (!Game.player.consumeMana(30)) {
                this.addMessage('Not enough mana!');
                return;
            }

            Game.player.invisible = true;
            this.addMessage('You fade from sight...');

            // Schedule invisibility to end after 50 turns (adjustable)
            this.timeManager.scheduleEvent(5000, (game) => {
                if (Game.player.invisible) {
                    Game.player.invisible = false;
                    game.addMessage('Your invisibility wears off.');
                    game.render();
                }
            });

            this.render();
            await this.consumeTurn(50);
        }
    }


    async openAdjacentDoors() {
        const opened = this.dungeon.openAdjacentDoors(Game.player.x, Game.player.y);
        if (opened) {
            this.addMessage(`You open ${opened} door${opened > 1 ? 's' : ''}.`);
            await this.consumeTurn(20);
        } else {
            this.addMessage('No closed door adjacent.');
        }
    }

    // Check if player stepped on a chest
    checkForChest() {
        const tile = this.dungeon.getTile(Game.player.x, Game.player.y);
        if (!tile || !tile.chest || tile.chest.opened) return false;

        if (tile.chest.locked) {
            this.addMessage('You find a locked chest.');
            return true;
        }
        // Auto-open unlocked chests
        this.openChest(tile.chest, tile, false);
        return true;
    }

    async openChestAtPlayer() {
        const tile = this.dungeon.getTile(Game.player.x, Game.player.y);
        if (!tile || !tile.chest || tile.chest.opened) {
            this.addMessage('There is no chest to open here.');
            return;
        }
        if (tile.chest.locked) {
            if (Game.player.hasKey()) {
                Game.player.useKey();
                tile.chest.locked = false;
                this.openChest(tile.chest, tile, false);
                this.addMessage('You unlock and open the chest with a key.');
                await this.consumeTurn(20);
            } else {
                this.addMessage('The chest is locked.');
            }
        } else {
            this.openChest(tile.chest, tile, false);
            await this.consumeTurn(10);
        }
    }

    openChest(chest, tile, forced) {
        chest.opened = true;
        let items = chest.items;

        if (forced) {
            items = this.breakChestItems(items);
        }

        // Dump surviving items onto the floor tile
        for (const item of items) {
            item.x = chest.x;
            item.y = chest.y;
            tile.addItem(item);
        }
        chest.items = [];

        if (!forced) {
            this.addMessage('You open the chest!');
        }

        this.itemManager.updateItemMemory();
        this.updateUI();
    }

    breakChestItems(items) {
        const survivors = [];
        for (const item of items) {
            let breakChance = 0;
            let breakMsg = '';

            if (item instanceof Potion) {
                breakChance = 0.50;
                breakMsg = `A ${item.name} shatters!`;
            } else if (item instanceof Scroll) {
                breakChance = 0.25;
                breakMsg = `A ${item.name} is torn to pieces!`;
            } else if (item instanceof Wand) {
                breakChance = 0.10;
                breakMsg = `A ${item.name} snaps in half!`;
            }

            if (breakChance > 0 && Math.random() < breakChance) {
                this.addMessage(breakMsg);
            } else {
                survivors.push(item);
            }
        }
        return survivors;
    }

    startForceMode() {
        this.addMessage('Force in which direction? (movement key)');
        this.directionSelectMode = 'force';
    }

    startLockpickMode() {
        if (!Game.player.hasLockpick()) {
            this.addMessage('You have no lockpicks!');
            return;
        }
        this.addMessage('Pick lock in which direction? (movement key)');
        this.directionSelectMode = 'lockpick';
    }

    async handleDirectionSelect(dx, dy) {
        const mode = this.directionSelectMode;
        this.directionSelectMode = null;

        const tx = Game.player.x + dx;
        const ty = Game.player.y + dy;
        const tile = this.dungeon.getTile(tx, ty);
        if (!tile) {
            this.addMessage('Nothing there.');
            return;
        }

        // Determine target: locked door or locked chest
        const isDoor = tile.type === '+' && tile.locked;
        const isChest = tile.chest && tile.chest.locked && !tile.chest.opened;

        if (!isDoor && !isChest) {
            this.addMessage('Nothing locked there.');
            return;
        }

        if (mode === 'force') {
            const successChance = Math.min(80, Math.floor(Game.player.strength / 2) + Game.player.level * 2);
            const success = Math.random() * 100 < successChance;
            if (isDoor) {
                if (success) {
                    tile.locked = false;
                    this.dungeon.setTileType(tx, ty, '/');
                    this.addMessage('You force the door open!');
                } else {
                    this.addMessage('You fail to force the door open.');
                }
            } else if (isChest) {
                if (success) {
                    tile.chest.locked = false;
                    this.addMessage('You force the chest open!');
                    this.openChest(tile.chest, tile, true);
                } else {
                    this.addMessage('You fail to force the chest open.');
                }
            }
            await this.consumeTurn(50);
        } else if (mode === 'lockpick') {
            const successChance = Math.min(95, 60 + Math.floor(Game.player.dexterity / 5));
            Game.player.useLockpick();
            const success = Math.random() * 100 < successChance;
            if (isDoor) {
                if (success) {
                    tile.locked = false;
                    this.addMessage('You pick the lock!');
                } else {
                    this.addMessage('The lockpick snaps!');
                }
            } else if (isChest) {
                if (success) {
                    tile.chest.locked = false;
                    this.addMessage('You pick the chest lock!');
                } else {
                    this.addMessage('The lockpick snaps!');
                }
            }
            await this.consumeTurn(30);
        }
    }

    async closeAdjacentDoors() {
        const closed = this.dungeon.closeAdjacentDoors(Game.player.x, Game.player.y);
        if (closed) {
            this.addMessage(`You close ${closed} door${closed > 1 ? 's' : ''}.`);
            await this.consumeTurn(20);
        } else {
            this.addMessage('No closed door adjacent.');
        }
    }

    useDownStairs() {
        if (this.gameOver) return;
        if (this.dungeon.downStair && Game.player.x === this.dungeon.downStair.x && Game.player.y === this.dungeon.downStair.y) {
            this.descend();
            return;
        }
        this.addMessage('There are no stairs here.');
    }

    useUpStairs() {
        if (this.gameOver) return;
        if (this.dungeon.upStair && Game.player.x === this.dungeon.upStair.x && Game.player.y === this.dungeon.upStair.y) {
            this.ascend();
            return;
        }
        this.addMessage('There are no stairs here.');
    }

    async consumeTurn(ticksToConsume = 100) {
        for (let i = 0; i < ticksToConsume; i++) {
            // advanceTime handles monster animation internally
            await this.timeManager.advanceTime();
        }
        // Final update to ensure FOV and UI are current
        this.computeFOV();
        this.render();
        this.updateUI();
    }

    render() {
        const ts = this.tileSize;
        this.ctx.clearRect(0, 0, this.canvas.width, this.canvas.height);

        // Calculate camera offset to center player
        const viewportTilesX = Math.floor(this.canvas.width / ts);
        const viewportTilesY = Math.floor(this.canvas.height / ts);
        const cameraX = Game.player.x - Math.floor(viewportTilesX / 2);
        const cameraY = Game.player.y - Math.floor(viewportTilesY / 2);

        // Store camera offset for mouse coordinate conversion
        this.cameraX = cameraX;
        this.cameraY = cameraY;

        // Only render tiles visible in viewport
        const startX = Math.max(0, cameraX);
        const startY = Math.max(0, cameraY);
        const endX = Math.min(this.width, cameraX + viewportTilesX + 1);
        const endY = Math.min(this.height, cameraY + viewportTilesY + 1);

        for (let y = startY; y < endY; y++) {
            for (let x = startX; x < endX; x++) {
                if (!this.explored[y][x]) continue;
                const tile = this.dungeon.getTile(x, y);
                if (!tile) continue;
                const tileType = tile.type;
                const px = (x - cameraX) * ts, py = (y - cameraY) * ts;
                this.ctx.fillStyle = '#000';
                this.ctx.fillRect(px, py, ts, ts);
                this.ctx.font = '16px monospace';
                this.ctx.textAlign = 'center';
                this.ctx.textBaseline = 'middle';
                let char = tileType, color = '#888';
                if (tileType === '#') color = '#777'; else if (tileType === '.') color = '#555'; else if (tileType === '+') {
                    char = '+';
                    color = tile.locked ? '#aa6600' : '#aa7722';
                } else if (tileType === '/') {
                    char = '/';
                    color = '#ddbb77';
                }
                this.ctx.fillStyle = color;
                this.ctx.fillText(char, px + ts / 2, py + ts / 2);
            }
        }
        const drawStair = (stair, symbol, color) => {
            if (!stair) return;
            const {x, y} = stair;
            if (!this.explored[y][x]) return;
            const px = (x - cameraX) * ts, py = (y - cameraY) * ts;
            this.ctx.fillStyle = '#000';
            this.ctx.fillRect(px, py, ts, ts);
            this.ctx.font = '16px monospace';
            this.ctx.textAlign = 'center';
            this.ctx.textBaseline = 'middle';
            this.ctx.fillStyle = color;
            this.ctx.fillText(symbol, px + ts / 2, py + ts / 2);
        };
        drawStair(this.dungeon.upStair, '<', '#88ff88');
        drawStair(this.dungeon.downStair, '>', '#ff8888');

        // Draw discovered traps
        for (let y = startY; y < endY; y++) {
            for (let x = startX; x < endX; x++) {
                if (!this.explored[y][x]) continue;
                const tile = this.dungeon.getTile(x, y);
                if (tile && tile.trap && tile.trap.discovered ) {
                    const px = (x - cameraX) * ts, py = (y - cameraY) * ts;
                    this.ctx.font = '16px monospace';
                    this.ctx.textAlign = 'center';
                    this.ctx.textBaseline = 'middle';
                    this.ctx.fillStyle = tile.trap.color || '#ff4444';
                    this.ctx.fillText(tile.trap.symbol, px + ts / 2, py + ts / 2);
                }
            }
        }

        // Draw chests
        for (let y = startY; y < endY; y++) {
            for (let x = startX; x < endX; x++) {
                if (!this.explored[y][x]) continue;
                const tile = this.dungeon.getTile(x, y);
                if (tile && tile.chest) {
                    const px = (x - cameraX) * ts, py = (y - cameraY) * ts;
                    this.ctx.font = '16px monospace';
                    this.ctx.textAlign = 'center';
                    this.ctx.textBaseline = 'middle';
                    if (tile.chest.opened) {
                        this.ctx.fillStyle = '#666666';
                        this.ctx.fillText('_', px + ts / 2, py + ts / 2);
                    } else if (tile.chest.locked) {
                        this.ctx.fillStyle = '#aa6600';
                        this.ctx.fillText('=', px + ts / 2, py + ts / 2);
                    } else {
                        this.ctx.fillStyle = '#FFD700';
                        this.ctx.fillText('=', px + ts / 2, py + ts / 2);
                    }
                }
            }
        }

        // Draw items from floor tiles
        for (let y = startY; y < endY; y++) {
            for (let x = startX; x < endX; x++) {
                if (!this.visible[y][x]) continue;
                const tile = this.dungeon.getTile(x, y);
                if (tile && tile.hasItems()) {
                    const it = tile.getTopItem(); // Show top item
                    if (it) {
                        const px = (x - cameraX) * ts, py = (y - cameraY) * ts;
                        this.ctx.font = '16px monospace';
                        this.ctx.textAlign = 'center';
                        this.ctx.textBaseline = 'middle';
                        this.ctx.fillStyle = it.getColor ? (it.getColor() || '#fff') : '#fff';
                        this.ctx.fillText(it.getSymbol ? it.getSymbol() : '?', px + ts / 2, py + ts / 2);
                    }
                }
            }
        }
        this.itemManager.itemMemory.forEach((mem, key) => {
            const [xs, ys] = key.split(',').map(Number);
            if (this.visible[ys] && this.visible[ys][xs]) return;
            if (!this.explored[ys][xs]) return;
            // Only draw if in viewport
            if (xs < startX || xs >= endX || ys < startY || ys >= endY) return;
            const px = (xs - cameraX) * ts, py = (ys - cameraY) * ts;
            this.ctx.font = '16px monospace';
            this.ctx.textAlign = 'center';
            this.ctx.textBaseline = 'middle';
            const memColors = {
                gold: '#666600',
                potion: '#662266',
                scroll: '#006666',
                weapon: '#663333',
                armor: '#333366'
            };
            this.ctx.fillStyle = memColors[mem.type] || '#555';
            this.ctx.fillText(mem.symbol, px + ts / 2, py + ts / 2);
        });
        for (const m of this.monsterManager.monsters) {
            if (!this.visible[m.y] || !this.visible[m.y][m.x]) continue;
            // Only draw if in viewport
            if (m.x < startX || m.x >= endX || m.y < startY || m.y >= endY) continue;
            const px = (m.x - cameraX) * ts, py = (m.y - cameraY) * ts;
            this.ctx.font = '16px monospace';
            this.ctx.textAlign = 'center';
            this.ctx.textBaseline = 'middle';
            this.ctx.fillStyle = m.poisoned ? '#44ff44' : m.getColor();
            this.ctx.fillText(m.getSymbol(), px + ts / 2, py + ts / 2);
        }
        // Draw player at center of screen (relative to camera)
        const ppx = (Game.player.x - cameraX) * ts, ppy = (Game.player.y - cameraY) * ts;
        this.ctx.font = '16px monospace';
        this.ctx.textAlign = 'center';
        this.ctx.textBaseline = 'middle';
        this.ctx.fillStyle = this.gameOver ? '#ff0000' : '#00ff00';
        this.ctx.fillText('@', ppx + ts / 2, ppy + ts / 2);
        // Examine cursor highlight
        if (this.examineMode && this.examineCursor) {
            const cx = (this.examineCursor.x - cameraX) * ts;
            const cy = (this.examineCursor.y - cameraY) * ts;
            this.ctx.strokeStyle = '#ffff00';
            this.ctx.lineWidth = 2;
            this.ctx.strokeRect(cx + 1, cy + 1, ts - 2, ts - 2);
        }

        // Targeting cursor highlight (for wands)
        if (this.targetingMode && this.targetingCursor) {
            const cx = (this.targetingCursor.x - cameraX) * ts;
            const cy = (this.targetingCursor.y - cameraY) * ts;
            this.ctx.strokeStyle = '#ff0000'; // Red for targeting
            this.ctx.lineWidth = 3;
            this.ctx.strokeRect(cx, cy, ts, ts);

            // Draw crosshair
            this.ctx.strokeStyle = '#ff0000';
            this.ctx.lineWidth = 2;
            this.ctx.beginPath();
            this.ctx.moveTo(cx + ts/2, cy);
            this.ctx.lineTo(cx + ts/2, cy + ts);
            this.ctx.moveTo(cx, cy + ts/2);
            this.ctx.lineTo(cx + ts, cy + ts/2);
            this.ctx.stroke();
        }
    }


    instantiateDroppedItem(item, x, y) {
        const ctorName = item.constructor && item.constructor.name;
        try {
            switch (ctorName) {
                case 'HealthPotion':
                    return new HealthPotion(x, y, item.name, item.healAmount);
                case 'SpeedPotion':
                    return new SpeedPotion(x, y, item.name, item.speedBoost);
                case 'Potion':
                    return new Potion(x, y, item.name, item.healAmount);
                case 'PsionicScroll':
                    return new PsionicScroll(x, y, item.name, item.damage);
                case 'TeleportScroll':
                    return new TeleportScroll(x, y);
                case 'MappingScroll':
                    return new MappingScroll(x, y);
                case 'FireballScroll':
                    return new FireballScroll(x, y, item.damage, item.radius);
                case 'RegenerationScroll':
                    return new RegenerationScroll(x, y, item.totalHeals, item.healPerTick, item.interval);
                case 'EnchantmentScroll':
                    return new EnchantmentScroll(x, y, item.enchantmentPower);
                case 'UncurseScroll':
                    return new UncurseScroll(x, y);
                case 'IdentifyScroll':
                    return new IdentifyScroll(x, y);
                case 'Scroll':
                    return new Scroll(x, y, item.name, item.damage);
                default:
                    return null;
            }
        } catch (e) {
            console.error('instantiateDroppedItem error', e);
            return null;
        }
    }

    updateUI() {
        document.getElementById('level').textContent = Game.player.level;
        document.getElementById('health').textContent = Game.player.health;
        document.getElementById('mana').textContent = Math.floor(Game.player.mana);
        document.getElementById('gold').textContent = Game.player.inventory.gold;
        document.getElementById('exp').textContent = Game.player.experience;
        const carried = Game.player.carriedWeight();
        const capacity = Game.player.strength * 2;
        const weightEl = document.getElementById('weight');
        weightEl.textContent = `${carried}/${capacity}`;
        weightEl.style.color = carried > capacity ? '#ff4444' : '';
        const poisonEl = document.getElementById('poison-status');
        if (poisonEl) {
            poisonEl.style.display = Game.player.poisoned ? '' : 'none';
        }
        const hungerEl = document.getElementById('hunger-status');
        if (hungerEl) {
            if (Game.player.isStarving()) {
                hungerEl.style.display = '';
                hungerEl.style.color = '#ff4444';
                hungerEl.textContent = 'STARVING';
            } else if (Game.player.isHungry()) {
                hungerEl.style.display = '';
                hungerEl.style.color = '#ffaa00';
                hungerEl.textContent = 'Hungry';
            } else {
                hungerEl.style.display = 'none';
            }
        }
        this.buildInventory();
    }

    addMessage(msg) {
        const box = document.getElementById('messages');
        const div = document.createElement('div');
        div.textContent = msg;
        box.appendChild(div);
        box.scrollTop = box.scrollHeight;
        while (box.children.length > 20) box.removeChild(box.firstChild);
    }

    sleep(ms) {
        return new Promise(resolve => setTimeout(resolve, ms));
    }

    showItemDialog(item, category) {
        if (!item) return;

        const dialog = document.getElementById('itemDialog');
        const nameEl = document.getElementById('dialogItemName');
        const descEl = document.getElementById('dialogItemDescription');
        const statsEl = document.getElementById('dialogItemStats');

        // Set item name - use getDisplayName for potions
        nameEl.textContent = (item.getDisplayName && typeof item.getDisplayName === 'function') ? item.getDisplayName() : (item.name || 'Unknown Item');

        // Check if item is identified (defaults to true if property doesn't exist)
        const isIdentified = item.identified !== false;

        // Build stats display
        const stats = [];

        // Category-specific stats
        if (category === 'weapons') {
            // Set item description
            descEl.textContent = item.description || 'A mysterious item.';
            if (item.damage !== undefined) {
                stats.push({
                    label: 'Base Damage',
                    value: isIdentified ? item.damage : '???',
                    positive: isIdentified && item.damage > 0
                });
            }
            if (typeof item.getDamage === 'function') {
                const totalDamage = item.getDamage();
                if (totalDamage !== item.damage) {
                    stats.push({
                        label: 'Total Damage',
                        value: isIdentified ? totalDamage : '???',
                        positive: isIdentified
                    });
                }
            }
            if (typeof item.getDamageBonus === 'function') {
                const bonus = item.getDamageBonus();
                if (bonus !== 0) {
                    stats.push({
                        label: 'Damage Bonus',
                        value: isIdentified ? `+${bonus}` : '???',
                        positive: isIdentified && bonus > 0
                    });
                }
            }
            if (typeof item.getAttackBonus === 'function') {
                const atkBonus = item.getAttackBonus();
                if (atkBonus !== 0) {
                    stats.push({
                        label: 'Attack Bonus',
                        value: isIdentified ? `+${atkBonus}` : '???',
                        positive: isIdentified && atkBonus > 0
                    });
                }
            }
            if (item.speed !== undefined) {
                stats.push({label: 'Attack Speed', value: isIdentified ? item.speed : '???'});
            }

            // Show elemental damage if present
            if (typeof item.getAllElementalDamage === 'function' && isIdentified) {
                const elementalDamages = item.getAllElementalDamage();
                for (const [type, amount] of Object.entries(elementalDamages)) {
                    if (amount > 0) {
                        const elementName = type.charAt(0).toUpperCase() + type.slice(1);
                        stats.push({
                            label: `${elementName} Damage`,
                            value: `+${amount}`,
                            positive: true
                        });
                    }
                }
            }
        } else if (category === 'armor') {
            // Set item description
            descEl.textContent = item.description || 'A mysterious item.';

            if (item.defense !== undefined) {
                stats.push({
                    label: 'Defense',
                    value: isIdentified ? item.defense : '???',
                    positive: isIdentified && item.defense > 0
                });
            }
            if (typeof item.getDefenseBonus === 'function') {
                const defBonus = item.getDefenseBonus();
                if (defBonus !== 0) {
                    stats.push({
                        label: 'Defense Bonus',
                        value: isIdentified ? `+${defBonus}` : '???',
                        positive: isIdentified && defBonus > 0
                    });
                }
            }
            if (item.bodyLocation) {
                stats.push({label: 'Slot', value: item.bodyLocation});
            }

            // Show elemental resistances if present
            if (typeof item.getAllResistances === 'function' && isIdentified) {
                const resistances = item.getAllResistances();
                for (const [element, value] of Object.entries(resistances)) {
                    if (value > 0) {
                        const elementName = element.charAt(0).toUpperCase() + element.slice(1);
                        const percentage = Math.round(value * 100);
                        stats.push({
                            label: `${elementName} Resistance`,
                            value: `${percentage}%`,
                            positive: true
                        });
                    }
                }
            }
        } else if (category === 'potions') {
            // Set item description
            descEl.textContent = isIdentified ? item.description : 'A mysterious potion.';

            if (isIdentified) {
                if (item.healAmount !== undefined) {
                    stats.push({
                        label: 'Heal Amount',
                        value: isIdentified ? `+${item.healAmount} HP` : '???',
                        positive: isIdentified
                    });
                }
                if (item.speedBoost !== undefined) {
                    stats.push({
                        label: 'Speed Boost',
                        value: isIdentified ? item.speedBoost : '???',
                        positive: isIdentified
                    });
                }
            }
            if (item.count !== undefined && item.count > 1) {
                stats.push({label: 'Quantity', value: item.count});
            }
        } else if (category === 'scrolls') {
            descEl.textContent = isIdentified ? item.description : 'A mysterious scroll.';
            if (isIdentified) {
                if (item.damage !== undefined) {
                    stats.push({label: 'Damage', value: isIdentified ? item.damage : '???', positive: isIdentified});
                }
                if (item.radius !== undefined) {
                    stats.push({label: 'Radius', value: isIdentified ? item.radius : '???'});
                }
                if (item.healPerTick !== undefined) {
                    stats.push({
                        label: 'Heal Per Tick',
                        value: isIdentified ? `+${item.healPerTick} HP` : '???',
                        positive: isIdentified
                    });
                }
                if (item.totalHeals !== undefined) {
                    stats.push({label: 'Total Heals', value: isIdentified ? item.totalHeals : '???'});
                }
            }
            if (item.count !== undefined && item.count > 1) {
                stats.push({label: 'Quantity', value: item.count});
            }
        } else if (category === 'wands') {
            descEl.textContent = isIdentified ? item.description : 'A mysterious wand.';
            if (isIdentified) {
                stats.push({label: 'Charges', value: `${item.charges}/${item.maxCharges}`});
                if (item.damage !== undefined) {
                    stats.push({label: 'Damage', value: item.damage, positive: true});
                }
                if (item.radius !== undefined) {
                    stats.push({label: 'Radius', value: item.radius});
                }
                if (item.slowDuration !== undefined) {
                    stats.push({label: 'Slow Duration', value: `${item.slowDuration} turns`});
                }
            } else {
                stats.push({label: 'Charges', value: '???'});
            }
        }

        // Common stats for all items
        if (item.weight !== undefined && item.weight > 0) {
            stats.push({label: 'Weight', value: item.weight});
        }
        if (item.size !== undefined && item.size > 0) {
            stats.push({label: 'Size', value: item.size});
        }

        // Bonuses
        if (item.bonuses && Object.keys(item.bonuses).length > 0) {
            Object.entries(item.bonuses).forEach(([key, value]) => {
                if (value !== 0) {
                    stats.push({
                        label: `${key} bonus`,
                        value: isIdentified ? `+${value}` : '???',
                        positive: isIdentified && value > 0
                    });
                }
            });
        }

        // Enchantments
        if (item.enchantments && Object.keys(item.enchantments).length > 0) {
            Object.entries(item.enchantments).forEach(([key, value]) => {
                if (typeof value === 'object' && value !== null) {
                    // Nested enchantments (elemental, resistances)
                    Object.entries(value).forEach(([subKey, subVal]) => {
                        const label = `${subKey} ${key}`;
                        const display = typeof subVal === 'number' && subVal < 1
                            ? `${Math.round(subVal * 100)}%`
                            : `+${subVal}`;
                        stats.push({
                            label: label,
                            value: isIdentified ? display : '???',
                            positive: isIdentified && subVal > 0
                        });
                    });
                } else if (value !== 0) {
                    stats.push({
                        label: `${key} enchantment`,
                        value: isIdentified ? `+${value}` : '???',
                        positive: isIdentified && value > 0
                    });
                }
            });
        }

        // Status flags
        if (item.identified !== undefined) {
            stats.push({label: 'Identified', value: item.identified ? 'Yes' : 'No'});
        }
        if (isIdentified && item.cursed) {
            stats.push({label: 'Cursed', value: 'Yes', positive: false});
        }

        // Render stats
        if (stats.length > 0) {
            statsEl.innerHTML = stats.map(stat => {
                const valueClass = stat.positive === true ? 'dialog-stat-value positive' :
                    stat.positive === false ? 'dialog-stat-value negative' :
                        'dialog-stat-value';
                return `<div class="dialog-stat-row">
                    <span class="dialog-stat-label">${stat.label}:</span>
                    <span class="${valueClass}">${stat.value}</span>
                </div>`;
            }).join('');
        } else {
            statsEl.innerHTML = '<div style="color: #888; text-align: center;">No additional stats</div>';
        }

        // Show dialog
        dialog.classList.add('show');
    }

    closeItemDialog() {
        const dialog = document.getElementById('itemDialog');
        dialog.classList.remove('show');
    }

    showItemInfoByIndex(category, index) {
        let item = null;

        if (category === 'weapons') {
            item = Game.player.inventory.weapons[index];
        } else if (category === 'armor') {
            item = Game.player.inventory.armor[index];
        } else if (category === 'potions') {
            item = Game.player.inventory.potions[index];
        } else if (category === 'scrolls') {
            item = Game.player.inventory.scrolls[index];
        } else if (category === 'wands') {
            item = Game.player.inventory.wands[index];
        }

        if (item) {
            this.showItemDialog(item, category);
        }
    }

    showEquippedItemInfo(bodyPartName) {
        const item = Game.player.body[bodyPartName];
        if (!item || item instanceof EmptyItem || item instanceof Fists) {
            return;
        }

        // Determine category based on body part
        const category = bodyPartName === 'weapon' ? 'weapons' : 'armor';
        this.showItemDialog(item, category);
    }

    startItemSelection(scroll, filterFn = () => true) {
        this.currentScroll = scroll;
        const dialog = document.getElementById('enchantmentDialog');
        const itemsContainer = document.getElementById('enchantmentItems');

        // Add equipped items
        const equippedSection = [];
        Object.entries(Game.player.body).forEach(([slot, item]) => {
            if (item && !(item instanceof EmptyItem) && !(item instanceof Fists)) {
                if (item instanceof Weapon || item instanceof Armor) {
                    if (filterFn(item)) {
                        equippedSection.push({item, slot, equipped: true});
                    }
                }
            }
        });

        // Add inventory weapons
        const weaponSection = [];
        Game.player.inventory.weapons.forEach((item, index) => {
            if (item && !(item instanceof EmptyItem) && !(item instanceof Fists)) {
                if (filterFn(item)) {
                    weaponSection.push({item, category: 'weapons', index});
                }
            }
        });

        // Add inventory armor
        const armorSection = [];
        Game.player.inventory.armor.forEach((item, index) => {
            if (item && !(item instanceof EmptyItem)) {
                if (filterFn(item)) {
                    armorSection.push({item, category: 'armor', index});
                }
            }
        });

        let html = '';

        if (equippedSection.length > 0) {
            html += '<div class="enchantment-section"><h4>Equipped Items</h4>';
            equippedSection.forEach(({item, slot}) => {
                const currentEnchant = item.enchantments || {};
                const enchantText = Object.keys(currentEnchant).length > 0
                    ? `Current enchantments: ${Object.entries(currentEnchant).flatMap(([k, v]) => typeof v === 'object' && v !== null ? Object.entries(v).map(([sk, sv]) => typeof sv === 'number' && sv < 1 ? `${Math.round(sv * 100)}% ${sk} ${k}` : `+${sv} ${sk} ${k}`) : [`+${v} ${k}`]).join(', ')}`
                    : 'No enchantments';

                let statsText = '';
                if (item instanceof Weapon) {
                    statsText = `Damage: ${item.getDamage()}`;
                } else if (item instanceof Armor) {
                    statsText = `Defense: ${item.defense}`;
                }

                html += `<div class="enchantable-item" onclick="game.applyEnchantment('equipped', '${slot}')">
                    <div class="enchantable-item-info">
                        <div class="enchantable-item-name">${item.name} (${slot})</div>
                        <div class="enchantable-item-stats">${statsText}</div>
                        <div class="enchantable-item-current">${enchantText}</div>
                    </div>
                </div>`;
            });
            html += '</div>';
        }

        if (weaponSection.length > 0) {
            html += '<div class="enchantment-section"><h4>Weapons in Inventory</h4>';
            weaponSection.forEach(({item, category, index}) => {
                const currentEnchant = item.enchantments || {};
                const enchantText = Object.keys(currentEnchant).length > 0
                    ? `Current enchantments: ${Object.entries(currentEnchant).flatMap(([k, v]) => typeof v === 'object' && v !== null ? Object.entries(v).map(([sk, sv]) => typeof sv === 'number' && sv < 1 ? `${Math.round(sv * 100)}% ${sk} ${k}` : `+${sv} ${sk} ${k}`) : [`+${v} ${k}`]).join(', ')}`
                    : 'No enchantments';

                html += `<div class="enchantable-item" onclick="game.applyEnchantment('${category}', ${index})">
                    <div class="enchantable-item-info">
                        <div class="enchantable-item-name">${item.name}</div>
                        <div class="enchantable-item-stats">Damage: ${item.getDamage()}</div>
                        <div class="enchantable-item-current">${enchantText}</div>
                    </div>
                </div>`;
            });
            html += '</div>';
        }

        if (armorSection.length > 0) {
            html += '<div class="enchantment-section"><h4>Armor in Inventory</h4>';
            armorSection.forEach(({item, category, index}) => {
                const currentEnchant = item.enchantments || {};
                const enchantText = Object.keys(currentEnchant).length > 0
                    ? `Current enchantments: ${Object.entries(currentEnchant).flatMap(([k, v]) => typeof v === 'object' && v !== null ? Object.entries(v).map(([sk, sv]) => typeof sv === 'number' && sv < 1 ? `${Math.round(sv * 100)}% ${sk} ${k}` : `+${sv} ${sk} ${k}`) : [`+${v} ${k}`]).join(', ')}`
                    : 'No enchantments';

                html += `<div class="enchantable-item" onclick="game.applyEnchantment('${category}', ${index})">
                    <div class="enchantable-item-info">
                        <div class="enchantable-item-name">${item.name}</div>
                        <div class="enchantable-item-stats">Defense: ${item.defense}</div>
                        <div class="enchantable-item-current">${enchantText}</div>
                    </div>
                </div>`;
            });
            html += '</div>';
        }

        if (equippedSection.length === 0 && weaponSection.length === 0 && armorSection.length === 0) {
            html = '<div style="color: #aaa; text-align: center; padding: 20px;">You have no enchantable items (weapons or armor).</div>';
        }

        itemsContainer.innerHTML = html;
        dialog.classList.add('show');
    }

    applyEnchantment(source, identifier) {
        let item = null;

        if (source === 'equipped') {
            // identifier is a body slot name
            item = Game.player.body[identifier];
        } else if (source === 'weapons') {
            item = Game.player.inventory.weapons[identifier];
        } else if (source === 'armor') {
            item = Game.player.inventory.armor[identifier];
        }

        if (!item) {
            this.addMessage('Invalid item selection.');
            return;
        }

        // Initialize enchantments object if it doesn't exist
        if (!item.enchantments) {
            item.enchantments = {};
        }

        // Call the scroll's onSelectItem method to apply the effect
        if (this.currentScroll && typeof this.currentScroll.onSelectItem === 'function') {
            this.currentScroll.onSelectItem(this, item);
        } else {
            this.addMessage('Error: Invalid scroll.');
        }

        // Close the dialog and update UI
        this.closeEnchantmentDialog();
        this.updateUI();
        this.render();
    }

    closeEnchantmentDialog() {
        const dialog = document.getElementById('enchantmentDialog');
        dialog.classList.remove('show');
        this.currentScroll = null;
    }
}

