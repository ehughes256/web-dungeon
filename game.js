// Game class - main game logic and UI management
class Game {
    constructor() {
        Game.player = new Player(this, 0, 0);
        this.canvas = document.getElementById('dungeon');
        this.ctx = this.canvas.getContext('2d');
        this.tileSize = 20;
        this.width = Math.floor(this.canvas.width / this.tileSize);
        this.height = Math.floor(this.canvas.height / this.tileSize);
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
                    await this.openAdjacentDoors();
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
                this.addMessage(`${item.name}: ${item.description || 'An indescribable object.'}`);
                return;
            }
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
                let itemText = hasItem ? itemObject.name : 'None';
                const itemClass = hasItem ? 'slot-item' : 'slot-item slot-empty';

                // Make equipped item name clickable
                if (hasItem) {
                    itemText = `<span class="item-name-clickable" onclick="game.showEquippedItemInfo('${bodyPartName}')">${itemText}</span>`;
                    // Add cursed indicator
                    if (itemObject.cursed) {
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
            lines.push('</div></div>');
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
            section('Weapons', p.inventory.weapons, (it, i) => this.renderInvRow('weapons', it, i, p.equippedWeapon() === it));
            section('Armor', p.inventory.armor, (it, i) => this.renderInvRow('armor', it, i, p.equippedArmor().includes(it)));
            lines.push(`</div>`);
        }
        container.innerHTML = lines.join('');
    }

    renderInvRow(category, item, index, equipped = false) {
        const tags = [];
        if (equipped) tags.push('<span class="tag">Eq</span>');
        if (item.cursed) tags.push('<span class="tag" style="background-color: #aa0000; color: #fff;">CURSED</span>');
        if (category === 'weapons') tags.push(`<span class='tag'>+${item.getDamage()} atk</span>`);
        if (category === 'armor') tags.push(`<span class='tag'>+${item.defense} def</span>`);
        if (category === 'potions') {
            if (item.healAmount) tags.push(`<span class='tag'>+${item.healAmount} HP</span>`);
            if (item.count > 1) tags.push(`<span class='tag'>x${item.count}</span>`);
        }
        if (category === 'scrolls') {
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
        actionButtons += `<button onclick="Game.player.dropInventoryItem('${category}',${index})">Drop</button>`;

        // Make item name clickable to show details
        const itemName = `<span class="item-name-clickable" onclick="game.showItemInfoByIndex('${category}', ${index})">${item.name || 'Unknown'}</span>`;

        return `<div class='inv-item-row'><div style='flex:1 1 auto;'>${itemName} ${tags.join(' ')}</div><div class='inv-actions'>${actionButtons}</div></div>`;
    }

    equipInventoryItem(category, index) {
        if (category === 'weapons') {
            const w = Game.player.inventory.weapons[index];
            if (!w) return;
            Game.player.equipWeapon(w);
            this.addMessage(`You equip ${w.name}.`);
        } else if (PlayerBody.armorLocations.includes(category)) {
            const a = Game.player.inventory.armor[index];
            if (!a) return;
            Game.player.equipArmor(a);
            this.addMessage(`You don ${a.name}.`);
        }
        this.buildInventory();
        this.updateUI();
    }

    unequipInventoryItem(category) {
        if (category === 'weapons' && Game.player.equippedWeapon()) {
            const result = Game.player.unEquipWeapon();
            if (result === 'cursed') {
                this.addMessage(`The ${Game.player.equippedWeapon().name} is cursed! You cannot remove it!`);
            } else {
                this.addMessage(`You stow ${result.name}.`);
            }
        }
        if (category === 'armor') {
            const equipped = Game.player.equippedArmor();
            equipped.forEach(a => {
                const result = Game.player.unEquipArmor(a);
                if (result === 'cursed') {
                    this.addMessage(`The ${a.name} is cursed! You cannot remove it!`);
                } else if (result) {
                    this.addMessage(`You remove ${a.name}.`);
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
                if (result === 'cursed') {
                    this.addMessage(`The ${weapon.name} is cursed! You cannot remove it!`);
                } else {
                    this.addMessage(`You stow ${weapon.name}.`);
                }
            }
        } else if (p.body[bodyPartName]) {
            const item = p.body[bodyPartName];
            if (item && !(item instanceof EmptyItem)) {
                const result = p.unEquipArmor(item);
                if (result === 'cursed') {
                    this.addMessage(`The ${item.name} is cursed! You cannot remove it!`);
                } else if (result) {
                    this.addMessage(`You remove ${item.name}.`);
                }
            }
        }
        this.buildInventory();
        this.updateUI();
    }

    useInventoryItem(category, index) {
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
                this.addMessage(`You drink ${item.name} (+${actualHeal} HP).`);
            }
            item.count -= 1;
            if (item.count <= 0) arr.splice(index, 1);
            this.consumeTurn(20);
        } else if (category === 'scrolls') {
            if (typeof item.use === 'function') {
                this.addMessage(`You read the ${item.name}.`);
                item.use(this);
            } else {
                const targets = this.monsterManager.monsters.filter(m => this.visible[m.y] && this.visible[m.y][m.x]);
                if (targets.length) {
                    const damage = item.damage || 10;
                    let killed = 0;
                    targets.forEach(m => {
                        m.hp -= damage;
                        if (m.hp <= 0) killed++;
                    });
                    if (killed) this.monsterManager.monsters = this.monsterManager.monsters.filter(m => m.hp > 0);
                    this.addMessage(`You cast ${item.name}. ${targets.length} hit, ${killed} slain.`);
                } else this.addMessage(`You cast ${item.name}, but there are no targets in sight.`);
            }
            item.count -= 1;
            if (item.count <= 0) arr.splice(index, 1);
            this.consumeTurn(30);
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
            this.dungeon.setTileType(nx, ny, '/');
            this.addMessage('You open the door.');
            await this.consumeTurn(20);
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
            this.itemManager.checkForItems();
            await this.consumeTurn(Game.player.speed);
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
            await this.timeManager.advanceTime();
            this.computeFOV();
            this.render();
            this.updateUI();
        }
    }

    render() {
        const ts = this.tileSize;
        this.ctx.clearRect(0, 0, this.canvas.width, this.canvas.height);
        for (let y = 0; y < this.height; y++) {
            for (let x = 0; x < this.width; x++) {
                if (!this.explored[y][x]) continue;
                const tile = this.dungeon.getTile(x, y);
                if (!tile) continue;
                const tileType = tile.type;
                const px = x * ts, py = y * ts;
                this.ctx.fillStyle = '#000';
                this.ctx.fillRect(px, py, ts, ts);
                this.ctx.font = '16px monospace';
                this.ctx.textAlign = 'center';
                this.ctx.textBaseline = 'middle';
                let char = tileType, color = '#888';
                if (tileType === '#') color = '#777'; else if (tileType === '.') color = '#555'; else if (tileType === '+') {
                    char = '+';
                    color = '#aa7722';
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
            const px = x * ts, py = y * ts;
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
        // Draw items from floor tiles
        for (let y = 0; y < this.height; y++) {
            for (let x = 0; x < this.width; x++) {
                if (!this.visible[y][x]) continue;
                const tile = this.dungeon.getTile(x, y);
                if (tile && tile.hasItems()) {
                    const it = tile.getTopItem(); // Show top item
                    if (it) {
                        const px = x * ts, py = y * ts;
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
            const px = xs * ts, py = ys * ts;
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
            const px = m.x * ts, py = m.y * ts;
            this.ctx.font = '16px monospace';
            this.ctx.textAlign = 'center';
            this.ctx.textBaseline = 'middle';
            this.ctx.fillStyle = m.getColor();
            this.ctx.fillText(m.getSymbol(), px + ts / 2, py + ts / 2);
        }
        const ppx = Game.player.x * ts, ppy = Game.player.y * ts;
        this.ctx.font = '16px monospace';
        this.ctx.textAlign = 'center';
        this.ctx.textBaseline = 'middle';
        this.ctx.fillStyle = this.gameOver ? '#ff0000' : '#00ff00';
        this.ctx.fillText('@', ppx + ts / 2, ppy + ts / 2);
        // Examine cursor highlight
        if (this.examineMode && this.examineCursor) {
            const cx = this.examineCursor.x * ts;
            const cy = this.examineCursor.y * ts;
            this.ctx.strokeStyle = '#ffff00';
            this.ctx.lineWidth = 2;
            this.ctx.strokeRect(cx + 1, cy + 1, ts - 2, ts - 2);
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
        document.getElementById('gold').textContent = Game.player.inventory.gold;
        document.getElementById('exp').textContent = Game.player.experience;
        document.getElementById('weight').textContent = Game.player.carriedWeight();
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

        // Set item name
        nameEl.textContent = item.name || 'Unknown Item';

        // Set item description
        descEl.textContent = item.description || 'A mysterious item.';

        // Build stats display
        const stats = [];

        // Category-specific stats
        if (category === 'weapons') {
            if (item.damage !== undefined) {
                stats.push({label: 'Base Damage', value: item.damage, positive: item.damage > 0});
            }
            if (typeof item.getDamage === 'function') {
                const totalDamage = item.getDamage();
                if (totalDamage !== item.damage) {
                    stats.push({label: 'Total Damage', value: totalDamage, positive: true});
                }
            }
            if (typeof item.getDamageBonus === 'function') {
                const bonus = item.getDamageBonus();
                if (bonus !== 0) {
                    stats.push({label: 'Damage Bonus', value: `+${bonus}`, positive: bonus > 0});
                }
            }
            if (typeof item.getAttackBonus === 'function') {
                const atkBonus = item.getAttackBonus();
                if (atkBonus !== 0) {
                    stats.push({label: 'Attack Bonus', value: `+${atkBonus}`, positive: atkBonus > 0});
                }
            }
            if (item.speed !== undefined) {
                stats.push({label: 'Attack Speed', value: item.speed});
            }
        } else if (category === 'armor') {
            if (item.defense !== undefined) {
                stats.push({label: 'Defense', value: item.defense, positive: item.defense > 0});
            }
            if (typeof item.getDefenseBonus === 'function') {
                const defBonus = item.getDefenseBonus();
                if (defBonus !== 0) {
                    stats.push({label: 'Defense Bonus', value: `+${defBonus}`, positive: defBonus > 0});
                }
            }
            if (item.bodyLocation) {
                stats.push({label: 'Slot', value: item.bodyLocation});
            }
        } else if (category === 'potions') {
            if (item.healAmount !== undefined) {
                stats.push({label: 'Heal Amount', value: `+${item.healAmount} HP`, positive: true});
            }
            if (item.speedBoost !== undefined) {
                stats.push({label: 'Speed Boost', value: item.speedBoost, positive: true});
            }
            if (item.count !== undefined && item.count > 1) {
                stats.push({label: 'Quantity', value: item.count});
            }
        } else if (category === 'scrolls') {
            if (item.damage !== undefined) {
                stats.push({label: 'Damage', value: item.damage, positive: true});
            }
            if (item.radius !== undefined) {
                stats.push({label: 'Radius', value: item.radius});
            }
            if (item.healPerTick !== undefined) {
                stats.push({label: 'Heal Per Tick', value: `+${item.healPerTick} HP`, positive: true});
            }
            if (item.totalHeals !== undefined) {
                stats.push({label: 'Total Heals', value: item.totalHeals});
            }
            if (item.count !== undefined && item.count > 1) {
                stats.push({label: 'Quantity', value: item.count});
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
                    stats.push({label: `${key} bonus`, value: `+${value}`, positive: value > 0});
                }
            });
        }

        // Enchantments
        if (item.enchantments && Object.keys(item.enchantments).length > 0) {
            Object.entries(item.enchantments).forEach(([key, value]) => {
                if (value !== 0) {
                    stats.push({label: `${key} enchantment`, value: `+${value}`, positive: value > 0});
                }
            });
        }

        // Status flags
        if (item.identified !== undefined) {
            stats.push({label: 'Identified', value: item.identified ? 'Yes' : 'No'});
        }
        if (item.cursed) {
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

    startItemSelection(scroll) {
        this.currentEnchantmentScroll = scroll;
        const dialog = document.getElementById('enchantmentDialog');
        const itemsContainer = document.getElementById('enchantmentItems');

        // Add equipped items
        const equippedSection = [];
        Object.entries(Game.player.body).forEach(([slot, item]) => {
            if (item && !(item instanceof EmptyItem) && !(item instanceof Fists)) {
                if (item instanceof Weapon || item instanceof Armor) {
                    equippedSection.push({ item, slot, equipped: true });
                }
            }
        });

        // Add inventory weapons
        const weaponSection = [];
        Game.player.inventory.weapons.forEach((item, index) => {
            if (item && !(item instanceof EmptyItem) && !(item instanceof Fists)) {
                weaponSection.push({ item, category: 'weapons', index });
            }
        });

        // Add inventory armor
        const armorSection = [];
        Game.player.inventory.armor.forEach((item, index) => {
            if (item && !(item instanceof EmptyItem)) {
                armorSection.push({ item, category: 'armor', index });
            }
        });

        let html = '';

        if (equippedSection.length > 0) {
            html += '<div class="enchantment-section"><h4>Equipped Items</h4>';
            equippedSection.forEach(({ item, slot }) => {
                const currentEnchant = item.enchantments || {};
                const enchantText = Object.keys(currentEnchant).length > 0
                    ? `Current enchantments: ${Object.entries(currentEnchant).map(([k,v]) => `+${v} ${k}`).join(', ')}`
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
            weaponSection.forEach(({ item, category, index }) => {
                const currentEnchant = item.enchantments || {};
                const enchantText = Object.keys(currentEnchant).length > 0
                    ? `Current enchantments: ${Object.entries(currentEnchant).map(([k,v]) => `+${v} ${k}`).join(', ')}`
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
            armorSection.forEach(({ item, category, index }) => {
                const currentEnchant = item.enchantments || {};
                const enchantText = Object.keys(currentEnchant).length > 0
                    ? `Current enchantments: ${Object.entries(currentEnchant).map(([k,v]) => `+${v} ${k}`).join(', ')}`
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

        const power = this.currentEnchantmentScroll.enchantmentPower || 1;

        // Apply enchantment based on item type
        if (item instanceof Weapon) {
            item.enchantments.damage = (item.enchantments.damage || 0) + power;
            this.addMessage(`${item.name} glows with power! +${power} damage enchantment applied.`);
        } else if (item instanceof Armor) {
            item.enchantments.defense = (item.enchantments.defense || 0) + power;
            this.addMessage(`${item.name} shimmers with protective magic! +${power} defense enchantment applied.`);
        }

        // Close the dialog and update UI
        this.closeEnchantmentDialog();
        this.updateUI();
        this.render();
    }

    closeEnchantmentDialog() {
        const dialog = document.getElementById('enchantmentDialog');
        dialog.classList.remove('show');
        this.currentEnchantmentScroll = null;
    }
}

