// Base Item class
class Item {
    static dropChance = 0.0;

    static levelRange = [1, 5];

    static baseWeight = 0;

    constructor(x, y, name, speed = 1, weight = 0, size = 0, bonuses = {}, enchantments = {}) {
        this.x = x;
        this.y = y;
        this.name = name;
        this.speed = speed; // Time cost to pick up or use
        this.enchantments = enchantments;
        this.bonuses = bonuses;
        this.weight = weight;
        this.size = size;
        this.identified = false;
        this.cursed = false;
        this.description = 'This is a plain old item.';
    }

    // Abstract methods to be implemented by subclasses
    getSymbol() {
        throw new Error('getSymbol must be implemented by subclass');
    }

    getWeight() {
        return this.weight;
    }

    getColor() {
        throw new Error('getColor must be implemented by subclass');
    }

    onCollect(game) {
        throw new Error('onCollect must be implemented by subclass');
    }

    onDrop(game) {
    }

    use(game) {
    }

    remove(game) {
    }

    getType() {
        return this.constructor.name.toLowerCase();
    }

    // Create a copy for inventory (without position)
    createInventoryCopy() {
        const copy = Object.create(Object.getPrototypeOf(this));
        Object.assign(copy, this);
        delete copy.x;
        delete copy.y;
        return copy;
    }
}

class EmptyItem extends Item {
    constructor() {
        super(-1, -1, 'Empty', 0, 0, 0);
        this.description = 'An empty slot, awaiting plunder hard-won in the depths.';
    }

    getSymbol() {
        return ' ';
    }

    getColor() {
        return '#000000';
    }

    onCollect(game) {
    }

    getDamageBonus() {
        return 0;
    }

    getDamage() {
        return 0;
    }
}

// Gold item class
class Gold extends Item {
    static dropChance = 0.4;

    static levelRange = [1, 100];

    constructor(x, y, amount) {
        const altNames = ['Gold Coins', 'Gold Nugget', 'Treasure', 'Pile of Gold', 'Coin Purse'];
        super(x, y, altNames[Math.floor(Math.random() * altNames.length)], 0, 0, 0);
        this.amount = amount || Math.floor(Math.random() * 50) + 10;
        this.description = 'A glittering promise of tavern songs, arcane reagents, and sharpened steel.';
    }

    getWeight() {
        return Math.ceil(this.amount / 100); // 1 weight per 100 gold
    }

    getSymbol() {
        return '$';
    }

    getColor() {
        return '#ffff00';
    }

    onCollect(game) {
        Game.player.addGold(this.amount);
        game.addMessage(`Found ${this.amount} gold!`);
    }
}

// Potion item class
class Potion extends Item {
    constructor(x, y, name, enchantments) {
        super(x, y, name, 10, 1, 2, {}, enchantments);
        this.description = 'A glass vial of alchemical mystery—its contents swirl with latent promise.';
    }

    getSymbol() {
        return '!';
    }

    getColor() {
        return '#ff00ff';
    }

    onCollect(game) {
        Game.player.addPotion(this.createInventoryCopy());
    }
}

// HealthPotion subclass - enhanced healing potion
class HealthPotion extends Potion {
    static dropChance = 0.05;

    static levelRange = [1, 5];

    constructor(x, y, name, healAmount) {
        super(x, y, name || 'Health Potion');
        this.healAmount = healAmount || 20;
        this.description = 'A ruby-red draught that knits torn flesh and steadies the warrior\'s breath.';
    }

    getColor() {
        return '#ff88ff'; // Brighter pink to distinguish from regular potions
    }

    use(game) {
        game.addMessage(`You drink the health potion!`);
        const healedAmount = Game.player.heal(this.healAmount);
        return {
            success: true,
            message: `You drink ${this.name} (+${healedAmount} HP).`,
            potion: this,
        };
    }

    onCollect(game) {
        Game.player.addPotion(this.createInventoryCopy());
        game.addMessage(`Found a powerful ${this.name}!`);
    }
}

class SpeedPotion extends Potion {
    static dropChance = 0.05;

    static levelRange = [1, 5];

    constructor(x, y, name, speedBoost) {
        super(x, y, name || 'Speed Potion');
        this.speedBoost = speedBoost || 50; // Example speed boost value
        this.description = 'An emerald tonic that sharpens reflexes—time itself seems to lean in your favor.';
    }

    getColor() {
        return '#00ff00'; // Green color for speed potions
    }

    onCollect(game) {
        Game.player.addPotion(this.createInventoryCopy());
        game.addMessage(`Found a Potion that boosts speed!`);
    }

    use(game) {
        game.addMessage(`You drink the speed potion!`);
        Game.player.speed -= this.speedBoost;
        game.timeManager.scheduleEvent(1000, this, () => {
            Game.player.speed += this.speedBoost;
            game.addMessage('The effect of the speed potion wears off.');
        });
        return {
            success: true,
            message: `You drink ${this.name} and feel faster! (+${this.speedBoost} speed)`,
            potion: this,
        };
    }
}

// Scroll item class
class Scroll extends Item {
    constructor(x, y, name) {
        super(x, y, name, 30, 1, 1);
        this.description = 'A crackling parchment covered in sigils that shimmer and rearrange when not directly watched.';
    }

    getSymbol() {
        return '?';
    }

    getColor() {
        return '#00ffff';
    }

    // Treat all subclassed scrolls uniformly for memory coloring
    getType() {
        return 'scroll';
    }

    onCollect(game) {
        Game.player.addScroll(this.createInventoryCopy());
    }
}

class PsionicScroll extends Scroll {
    static dropChance = 0.2;

    static levelRange = [1, 5];

    constructor(x, y, name, damage) {
        super(x, y, 'Psionic Scroll');
        this.damage = damage || 25;
        this.description = 'A vellum scroll humming with latent mental force—its release is a silent scream that shatters thought.';
    }

    getColor() {
        return '#aa00ff'; // Purple color for psionic scrolls
    }

    onCollect(game) {
        Game.player.addScroll(this.createInventoryCopy());
        game.addMessage(`Found a powerful scroll!`);
    }

    use(game) {
        const targets = game.monsterManager.monsters.filter((m) => game.visible[m.y] && game.visible[m.y][m.x]);
        if (!targets.length) {
            game.addMessage('No targets in sight.');
            return;
        }
        const dmg = this.damage || 10;
        let killed = 0;
        targets.forEach((m) => {
            m.hp -= dmg;
            if (m.hp <= 0) killed++;
        });
        if (killed) game.monsterManager.monsters = game.monsterManager.monsters.filter((m) => m.hp > 0);
        game.addMessage(`You cast ${this.name}. ${targets.length} hit, ${killed} slain.`);
        game.render();
    }
}

// --- New Scroll Types ---

// Teleportation: randomly relocates the player to a safe tile.
class TeleportScroll extends Scroll {
    static dropChance = 0.05;
    static levelRange = [1, 15];

    constructor(x, y) {
        super(x, y, 'Teleportation Scroll');
        this.description = 'Glyphs swirl in spirals—space seems thin where your fingers brush the vellum.';
    }

    getColor() {
        return '#44aaff';
    }

    use(game) {
        const validPositions = [];
        for (let y = 0; y < game.height; y++) {
            for (let x = 0; x < game.width; x++) {
                if (!game.inBounds(x, y)) continue;
                const t = game.dungeon[y][x];
                if (!(t === '.' || t === '/' || t === '<' || t === '>')) continue;
                if (game.monsterManager.monsters.some(m => m.x === x && m.y === y)) continue;
                validPositions.push([x, y]);
            }
        }
        if (!validPositions.length) {
            game.addMessage('The magic fizzles—nowhere to go.');
            return;
        }
        const [nx, ny] = validPositions[Math.floor(Math.random() * validPositions.length)];
        Game.player.x = nx;
        Game.player.y = ny;
        game.addMessage('Reality folds; you reappear elsewhere!');
        game.computeFOV();
        game.render();
    }
}

// Mapping: reveals the dungeon layout (walkable tiles + doors + stairs).
class MappingScroll extends Scroll {
    static dropChance = 0.04;
    static levelRange = [1, 12];

    constructor(x, y) {
        super(x, y, 'Mapping Scroll');
        this.description = 'An ink lattice of corridors overlays the parchment—reading it crystallizes spatial insight.';
    }

    getColor() {
        return '#ffff44';
    }

    use(game) {
        for (let y = 0; y < game.height; y++) {
            for (let x = 0; x < game.width; x++) {
                const t = game.dungeon[y][x];
                if (t !== '#') game.explored[y][x] = true; // reveal all non-walls
            }
        }
        game.addMessage('Your mind expands—paths and chambers blaze in memory.');
        game.render();
    }
}

// Fireball: damages all monsters within a radius around the player.
class FireballScroll extends Scroll {
    static dropChance = 0.06;
    static levelRange = [2, 15];

    constructor(x, y, damage = 18, radius = 3) {
        super(x, y, 'Fireball Scroll');
        this.damage = damage;
        this.radius = radius;
        this.description = 'Crimson sigils pulse with heat—unleash it to bathe nearby foes in roaring flame.';
    }

    getColor() {
        return '#ff5522';
    }

    use(game) {
        const px = Game.player.x, py = Game.player.y;
        const affected = [];
        game.monsterManager.monsters.forEach(m => {
            const dx = m.x - px;
            const dy = m.y - py;
            if (dx * dx + dy * dy <= this.radius * this.radius) affected.push(m);
        });
        if (!affected.length) {
            game.addMessage('Flames curl harmlessly—no foes nearby.');
            return;
        }
        let slain = 0;
        affected.forEach(m => {
            m.hp -= this.damage;
            if (m.hp <= 0) slain++;
        });
        if (slain) game.monsterManager.monsters = game.monsterManager.monsters.filter(m => m.hp > 0);
        game.addMessage(`A sphere of fire erupts! ${affected.length} scorched, ${slain} slain.`);
        game.render();
    }
}

// Regeneration: grants periodic healing over time.
class RegenerationScroll extends Scroll {
    static dropChance = 0.03;
    static levelRange = [3, 18];

    constructor(x, y, totalHeals = 5, healPerTick = 4, interval = 400) {
        super(x, y, 'Regeneration Scroll');
        this.totalHeals = totalHeals;
        this.healPerTick = healPerTick;
        this.interval = interval; // ticks between heals
        this.description = 'Verdant runes shed tiny motes—life reknits at their whispered urging.';
    }

    getColor() {
        return '#33dd55';
    }

    use(game) {
        game.addMessage('Warm vitality suffuses your frame.');
        for (let i = 1; i <= this.totalHeals; i++) {
            game.timeManager.scheduleEvent(this.interval * i, this, () => {
                const healed = Game.player.heal(this.healPerTick);
                game.addMessage(`Regeneration restores ${healed} HP across your wounds.`);
                game.updateUI();
                game.render();
            });
        }
    }
}

// Weapon item class
class Weapon extends Item {
    static baseDamage = 5;

    static baseSpeed = 50; // Base time cost to swing. 2 attacks per 'turn'

    constructor(x, y, name, weight, size, bonuses, enchantments) {
        super(x, y, name, Weapon.baseSpeed, weight || 3, size, bonuses, enchantments);
        this.damage = Weapon.baseDamage;
    }

    getSymbol() {
        return '/';
    }

    getColor() {
        return '#ff4444';
    }

    getDamage() {
        return this.damage;
    }

    getDamageBonus() {
        return (this.bonuses.damage || 0) + (this.enchantments.damage || 0);
    }

    getAttackBonus() {
        return (this.bonuses.attack || 0) + (this.enchantments.attack || 0) + this.attackBonus;
    }

    onCollect(game) {
        const weaponCopy = this.createInventoryCopy();
        Game.player.addWeapon(weaponCopy);
        game.addMessage(`Found a ${this.name}!`);
    }

    getType() {
        return 'weapon';
    }
}

class Fists extends Weapon {
    constructor() {
        super(-1, -1, 'Fists', 30, 0);
        this.speed = 30;
        this.damage = 2;
        this.description = 'Your own two hands—last resort of the desperate and the disciplined.';
    }

    getSymbol() {
        return ' ';
    }

    getColor() {
        return '#ffffff';
    }

    onCollect(game) {
    }
}

// --- New Low-Level Weapons ---
class Stick extends Weapon {
    static dropChance = 0.05; // reduced from 0.12
    static levelRange = [1, 2];

    constructor(x, y) {
        super(x, y, 'Stick', 3, 3);
        this.speed = 40; // Fast but weak
        this.damage = 2;
        this.description = 'A simple length of wood—better than bare hands, barely.';
    }

    getColor() {
        return '#aa8844';
    }
}

class RustyKnife extends Weapon {
    static dropChance = 0.045; // reduced from 0.09
    static levelRange = [1, 3];

    constructor(x, y) {
        super(x, y, 'Rusty Knife', 4, 4);
        this.speed = 32;
        this.damage = 4;
        this.description = 'Pitted and dull, yet still capable of drawing blood.';
    }

    getColor() {
        return '#bb9966';
    }
}

class Club extends Weapon {
    static dropChance = 0.04; // reduced from 0.07
    static levelRange = [1, 3];

    constructor(x, y) {
        super(x, y, 'Club', 8, 8);
        this.speed = 55; // Slower, a bit heavier hit
        this.damage = 6;
        this.description = 'A crude bludgeon hewn from a knot of hardwood.';
    }

    getColor() {
        return '#885522';
    }
}

class BoneShard extends Weapon {
    static dropChance = 0.035; // reduced from 0.06
    static levelRange = [1, 2];

    constructor(x, y) {
        super(x, y, 'Bone Shard', 2, 2);
        this.speed = 38;
        this.damage = 3;
        this.description = 'A jagged splinter of bone—unpleasant to meet at speed.';
    }

    getColor() {
        return '#ddd5c5';
    }
}

// Restored original weapon classes
class SmallDagger extends Weapon {
    static dropChance = 0.1;
    static levelRange = [1, 5];

    constructor(x, y, name) {
        super(x, y, name || 'Small Dagger', 5, 5);
        this.speed = 30;
        this.damage = 5;
        this.description = 'A slender blade balanced for quick thrusts—beloved of rogues and alley shadows.';
    }
}

class Shortsword extends Weapon {
    static dropChance = 0.08;
    static levelRange = [2, 6];

    constructor(x, y, name) {
        super(x, y, name || 'Shortsword', 7, 7);
        this.speed = 40;
        this.damage = 7;
        this.description = 'A versatile soldier\'s blade—equally suited to parry, riposte, or decisive thrust.';
    }
}

class Rapier extends Weapon {
    static dropChance = 0.06;
    static levelRange = [3, 7];

    constructor(x, y, name) {
        super(x, y, name || 'Rapier', 6, 6);
        this.speed = 35;
        this.damage = 6;
        this.description = 'A needle-fine blade tuned for elegance and lethal precision.';
    }

    getColor() {
        return '#ffaa44';
    }
}

class Longsword extends Weapon {
    static dropChance = 0.07;
    static levelRange = [3, 8];

    constructor(x, y, name) {
        super(x, y, name || 'Longsword', 20, 20);
        this.speed = 50;
        this.damage = 15;
        this.description = 'A knightly blade of balanced heft and reach—reliable in any melee.';
    }
}

class Spear extends Weapon {
    static dropChance = 0.07;
    static levelRange = [2, 7];

    constructor(x, y, name) {
        super(x, y, name || 'Spear', 20, 20);
        this.speed = 50;
        this.damage = 12;
        this.description = 'A stout haft ending in a leaf-shaped head—reach keeps foes an arm\'s length away.';
    }

    getSymbol() {
        return '|';
    }

    getColor() {
        return '#ffcc44';
    }
}

class Battleaxe extends Weapon {
    static dropChance = 0.06;
    static levelRange = [4, 9];

    constructor(x, y, name) {
        super(x, y, name || 'Battleaxe', 30, 20);
        this.speed = 50;
        this.damage = 20;
        this.description = 'A brutal, bearded axe meant to hew through timber, mail, and bone alike.';
    }

    getSymbol() {
        return '¥';
    }

    getColor() {
        return '#ff6644';
    }
}

class Warhammer extends Weapon {
    static dropChance = 0.05;
    static levelRange = [4, 9];

    constructor(x, y, name) {
        super(x, y, name || 'Warhammer', 50, 30);
        this.speed = 75;
        this.damage = 30;
        this.description = 'A mass of forged iron on a haft—designed to crumple plate and pulp shields.';
    }

    getSymbol() {
        return 'T';
    }

    getColor() {
        return '#aa4444';
    }
}

class Greatsword extends Weapon {
    static dropChance = 0.04;
    static levelRange = [5, 10];

    constructor(x, y, name) {
        super(x, y, name || 'Greatsword', 40, 40);
        this.speed = 75;
        this.damage = 30;
        this.description = 'An immense two-handed blade—each swing a cleaving arc of ruin.';
    }

    getSymbol() {
        return '†';
    }

    getColor() {
        return '#ff2222';
    }
}

class Halberd extends Weapon {
    static dropChance = 0.03;
    static levelRange = [6, 12];

    constructor(x, y, name) {
        super(x, y, name || 'Halberd', 35, 40);
        this.speed = 60;
        this.damage = 25;
        this.description = 'A polearm marrying axe blade, spear point, and hook—control and carnage in equal measure.';
    }

    getSymbol() {
        return 'Þ';
    }

    getColor() {
        return '#ff4488';
    }
}

class EnchantedBlade extends Weapon {
    static dropChance = 0.02;
    static levelRange = [7, 15];

    constructor(x, y, name) {
        super(x, y, name || 'Enchanted Blade', 20, 20);
        this.speed = 45;
        this.damage = 20;
        this.description = 'Runes shimmer along its fuller—the metal hums with restrained arcana.';
    }

    getColor() {
        return '#44ffff';
    }
}

class DragonSlayer extends Weapon {
    static dropChance = 0.01;
    static levelRange = [10, 20];

    constructor(x, y, name) {
        super(x, y, name || 'Dragonslayer Sword', 45, 40, {attack: 5, damage: 10});
        this.speed = 55;
        this.damage = 50;
        this.description = 'A legendary blade wreathed in ancient heat—said to drink the heartfire of slain wyrms.';
    }

    getSymbol() {
        return '♦';
    }

    getColor() {
        return '#ffdd00';
    }
}

// ==== Armor System (restored) ====
class Armor extends Item {
    constructor(x, y, name, bodyLocation, speed, weight, size, defense, bonuses = {}, enchantments = {}) {
        super(x, y, name, speed, weight, size, bonuses, enchantments);
        this.bodyLocation = bodyLocation || 'torso';
        this.defense = defense;
    }

    getDefense() {
        return {
            base: this.defense,
            bonus: this.getDefenseBonus(),
            fromBonus: this.bonuses.defense || 0,
            fromEnchantment: this.enchantments.defense || 0
        };
    }

    getDefenseBonus() {
        return (this.bonuses.defense || 0) + (this.enchantments.defense || 0);
    }

    getEncumbrance() {
        return this.weight / Math.max(1, this.size);
    }

    getSymbol() {
        return '[';
    }

    getColor() {
        return '#4444ff';
    }

    onCollect(game) {
        const copy = this.createInventoryCopy();
        Game.player.addArmor(copy);
        game.addMessage(`Found a ${this.name}!`);
    }

    getType() {
        return 'armor';
    }
}

class BodyArmor extends Armor {
    constructor(x, y, name, speed, weight, size, defense, bonuses = {}, enchantments = {}) {
        super(x, y, name, 'torso', speed, weight, size, defense, bonuses, enchantments);
    }

    getSymbol() {
        return '[';
    }
}

class Sleeves extends Armor {
    constructor(x, y, name, speed, weight, size, defense, bonuses = {}, enchantments = {}) {
        super(x, y, name, 'arms', speed, weight, size, defense, bonuses, enchantments);
    }

    getSymbol() {
        return '{';
    }
}

class Gloves extends Armor {
    constructor(x, y, name, speed, weight, size, defense, bonuses = {}, enchantments = {}) {
        super(x, y, name, 'hands', speed, weight, size, defense, bonuses, enchantments);
    }

    getSymbol() {
        return '}';
    }
}

class Shoes extends Armor {
    constructor(x, y, name, speed, weight, size, defense, bonuses = {}, enchantments = {}) {
        super(x, y, name, 'feet', speed, weight, size, defense, bonuses, enchantments);
    }

    getSymbol() {
        return 'v';
    }
}

class Pants extends Armor {
    constructor(x, y, name, speed, weight, size, defense, bonuses = {}, enchantments = {}) {
        super(x, y, name, 'legs', speed, weight, size, defense, bonuses, enchantments);
    }

    getSymbol() {
        return ']';
    }
}

// Low-level armor (new / common early)
class TatteredCloak extends BodyArmor {
    static dropChance = 0.08;
    static levelRange = [1, 2];

    constructor(x, y) {
        super(x, y, 'Tattered Cloak', 18, 3, 5, 1);
        this.description = 'Shredded fabric offering the barest whisper of protection.';
    }

    getColor() {
        return '#888888';
    }
}

class Helmet extends Armor {
    static dropChance = 0.07;
    static levelRange = [1, 2];

    constructor(x, y, name, speed, weight, size, defense, bonuses = {}, enchantments = {}) {
        super(x, y, name, 'head', speed, weight, size, defense, bonuses, enchantments);
    }

    getSymbol() {
        return '^';
    }
}

class PaddedCap extends Helmet {
    static dropChance = 0.07;
    static levelRange = [1, 2];

    constructor(x, y) {
        super(x, y, 'Padded Cap', 8, 6, 6, 2);
        this.description = 'Layers of cloth and batting absorb a little of the world\'s cruelty.';
    }

    getColor() {
        return '#8888ff';
    }
}

class PatchworkTrousers extends Pants {
    static dropChance = 0.07;
    static levelRange = [1, 3];

    constructor(x, y) {
        super(x, y, 'Patchwork Trousers', 14, 8, 10, 2);
        this.description = 'Stitched from scraps—flexible, drafty, minimally protective.';
    }
}

class WornSandals extends Shoes {
    static dropChance = 0.08;
    static levelRange = [1, 2];

    constructor(x, y) {
        super(x, y, 'Worn Sandals', 10, 4, 5, 1);
        this.description = 'Leather thongs and tired soles—better than bare stone beneath you.';
    }

    getColor() {
        return '#aa8844';
    }
}

class RaggedGloves extends Gloves {
    static dropChance = 0.07;
    static levelRange = [1, 2];

    constructor(x, y) {
        super(x, y, 'Ragged Gloves', 9, 3, 4, 1);
        this.description = 'Frayed finger coverings that keep grime out more than blades.';
    }
}

class FrayedBracers extends Sleeves {
    static dropChance = 0.06;
    static levelRange = [1, 2];

    constructor(x, y) {
        super(x, y, 'Frayed Bracers', 9, 4, 6, 1);
        this.description = 'Loose wraps offering token forearm padding.';
    }
}

// Mid baseline cloth
class ClothRobe extends BodyArmor {
    static dropChance = 0.1;
    static levelRange = [1, 5];

    constructor(x, y, name) {
        super(x, y, name || 'Cloth Robe', 20, 5, 5, 2);
        this.description = 'Simple woven garments—little protection, but movement comes easily.';
    }
}

// Standard armor & accessories (moved here after Armor so inheritance works)
class LeatherHelm extends Helmet {
    static dropChance = 0.08;

    static levelRange = [1, 3];

    constructor(x, y, name) {
        super(x, y, name || 'Leather Helm', 10, 10, 10, 5);
        this.description = 'Cured leather shaped to turn aside glancing cuts and falling grit.';
    }

    getColor() {
        return '#aa8844';
    }
}

class IronHelmet extends Helmet {
    static dropChance = 0.05;

    static levelRange = [2, 6];

    constructor(x, y, name) {
        super(x, y, name || 'Iron Helmet', 15, 25, 10, 10);
        this.description = 'A riveted iron dome—heavy, but reassuring when arrows whisper past.';
    }

    getColor() {
        return '#8888ff';
    }
}

class LeatherVest extends BodyArmor {
    static dropChance = 0.08;

    static levelRange = [1, 4];

    constructor(x, y, name) {
        super(x, y, name || 'Leather Vest', 10, 20, 20, 10);
        this.description = 'Supple layers of boiled leather—light, flexible, and modestly protective.';
    }

    getColor() {
        return '#aa8844';
    }
}

class ChainMail extends BodyArmor {
    static dropChance = 0.06;

    static levelRange = [2, 6];

    constructor(x, y, name) {
        super(x, y, name || 'Chain Mail', 20, 50, 25, 20);
        this.description = 'Interlocked iron rings that chime softly—a stalwart defense against slashing blows.';
    }

    getColor() {
        return '#8888ff';
    }
}

class PlateMail extends BodyArmor {
    static dropChance = 0.03;

    static levelRange = [4, 8];

    constructor(x, y, name) {
        super(x, y, name || 'Plate Mail', 30, 80, 30, 30);
        this.description = 'A walking fortress of tempered plates—few blows land true against such craft.';
    }

    getColor() {
        return '#4444ff';
    }
}

class LeatherPants extends Pants {
    static dropChance = 0.07;

    static levelRange = [1, 4];

    constructor(x, y, name) {
        super(x, y, name || 'Leather Pants', 15, 15, 15, 8);
        this.description = 'Reinforced leggings of oiled hide—keeps briars and blades at bay.';
    }
}

class IronGreaves extends Pants {
    static dropChance = 0.05;

    static levelRange = [3, 7];

    constructor(x, y, name) {
        super(x, y, name || 'Iron Greaves', 25, 40, 20, 15);
        this.description = 'Weighty plates that guard shin and knee—each step a promise of endurance.';
    }
}

class LeatherBoots extends Shoes {
    static dropChance = 0.09;

    static levelRange = [1, 3];

    constructor(x, y, name) {
        super(x, y, name || 'Leather Boots', 12, 10, 10, 5);
        this.description = 'Well-oiled boots that hug the foot—tread soft, tread sure.';
    }

    getColor() {
        return '#aa8844';
    }
}

class IronBoots extends Shoes {
    static dropChance = 0.06;

    static levelRange = [2, 5];

    constructor(x, y, name) {
        super(x, y, name || 'Iron Boots', 20, 30, 15, 12);
        this.description = 'Clanking sabatons—subtlety traded for steadfast protection.';
    }

    getColor() {
        return '#8888ff';
    }
}

class LeatherGloves extends Gloves {
    static dropChance = 0.08;

    static levelRange = [1, 3];

    constructor(x, y, name) {
        super(x, y, name || 'Leather Gloves', 10, 8, 8, 4);
        this.description = 'Supple gloves improving grip and shielding knuckles from cruel stone.';
    }
}

class IronGauntlets extends Gloves {
    static dropChance = 0.05;

    static levelRange = [3, 6];

    constructor(x, y, name) {
        super(x, y, name || 'Iron Gauntlets', 18, 20, 12, 10);
        this.description = 'Segmented gauntlets of overlapping plates—turning blades with practiced ease.';
    }
}

class LeatherBracers extends Sleeves {
    static dropChance = 0.07;

    static levelRange = [1, 4];

    constructor(x, y, name) {
        super(x, y, name || 'Leather Bracers', 10, 12, 12, 6);
        this.description = 'Hardened leather cinched at the forearms—deflects stray cuts and bowstring burn.';
    }
}

class SteelVambraces extends Sleeves {
    static dropChance = 0.04;

    static levelRange = [3, 7];

    constructor(x, y, name) {
        super(x, y, name || 'Steel Vambraces', 20, 30, 15, 12);
        this.description = 'Polished steel guards that flash in torchlight and foil seeking blades.';
    }
}

class Ring extends Armor {
    constructor(x, y, name, weight, size, defense, bonuses = {}, enchantments = {}) {
        super(x, y, name, 'finger', 5, weight || 1, size || 1, defense || 0, bonuses, enchantments);
    }

    getSymbol() {
        return 'o';
    }
}

class ProtectionRing extends Ring {
    static dropChance = 0.03;

    static levelRange = [2, 8];

    constructor(x, y, name) {
        super(x, y, name || 'Ring of Protection', 5, 1, 1, 0, {defense: 5});
        this.description = 'A faint, translucent shimmer halos this band—an unseen bulwark against harm.';
    }

    getColor() {
        return '#ffaa00';
    }
}

// Item factory for creating items
class ItemFactory {
    static itemTypes = [
        {class: Gold, chance: Gold.dropChance}, // move Gold to top again for clarity
        // Low-level weapons (reduced chances)
        {class: Stick, chance: Stick.dropChance},
        {class: RustyKnife, chance: RustyKnife.dropChance},
        {class: Club, chance: Club.dropChance},
        {class: BoneShard, chance: BoneShard.dropChance},
        // Core consumables & scrolls
        {class: HealthPotion, chance: HealthPotion.dropChance},
        {class: SpeedPotion, chance: SpeedPotion.dropChance},
        {class: PsionicScroll, chance: PsionicScroll.dropChance},
        {class: TeleportScroll, chance: TeleportScroll.dropChance},
        {class: MappingScroll, chance: MappingScroll.dropChance},
        {class: FireballScroll, chance: FireballScroll.dropChance},
        {class: RegenerationScroll, chance: RegenerationScroll.dropChance},
        // Weapons - Light/Fast
        {class: SmallDagger, chance: SmallDagger.dropChance},
        {class: Shortsword, chance: Shortsword.dropChance},
        {class: Rapier, chance: Rapier.dropChance},
        // Weapons - Medium
        {class: Longsword, chance: Longsword.dropChance},
        {class: Spear, chance: Spear.dropChance},
        {class: Battleaxe, chance: Battleaxe.dropChance},
        {class: Warhammer, chance: Warhammer.dropChance},
        // Weapons - Heavy/Exotic
        {class: Greatsword, chance: Greatsword.dropChance},
        {class: Halberd, chance: Halberd.dropChance},
        {class: EnchantedBlade, chance: EnchantedBlade.dropChance},
        {class: DragonSlayer, chance: DragonSlayer.dropChance},
        // Armor (low-level first)
        {class: TatteredCloak, chance: TatteredCloak.dropChance},
        {class: PaddedCap, chance: PaddedCap.dropChance},
        {class: PatchworkTrousers, chance: PatchworkTrousers.dropChance},
        {class: WornSandals, chance: WornSandals.dropChance},
        {class: RaggedGloves, chance: RaggedGloves.dropChance},
        {class: FrayedBracers, chance: FrayedBracers.dropChance},
        {class: ClothRobe, chance: ClothRobe.dropChance},
        // Head armor
        {class: LeatherHelm, chance: LeatherHelm.dropChance},
        {class: IronHelmet, chance: IronHelmet.dropChance},
        // Torso armor
        {class: LeatherVest, chance: LeatherVest.dropChance},
        {class: ChainMail, chance: ChainMail.dropChance},
        {class: PlateMail, chance: PlateMail.dropChance},
        // Leg armor
        {class: LeatherPants, chance: LeatherPants.dropChance},
        {class: IronGreaves, chance: IronGreaves.dropChance},
        // Foot armor
        {class: LeatherBoots, chance: LeatherBoots.dropChance},
        {class: IronBoots, chance: IronBoots.dropChance},
        // Hand armor
        {class: LeatherGloves, chance: LeatherGloves.dropChance},
        {class: IronGauntlets, chance: IronGauntlets.dropChance},
        // Arm armor
        {class: LeatherBracers, chance: LeatherBracers.dropChance},
        {class: SteelVambraces, chance: SteelVambraces.dropChance},
        // Ring armor
        {class: ProtectionRing, chance: ProtectionRing.dropChance},
    ];

    static createRandomItem(x, y) {
        const totalChance = ItemFactory.itemTypes.reduce((sum, it) => sum + it.chance, 0);
        let rand = Math.random() * totalChance;
        for (const itemType of ItemFactory.itemTypes) {
            if (rand < itemType.chance) {
                return new itemType.class(x, y);
            }
            rand -= itemType.chance;
        }
        // Fallback to gold if no other item is selected
        return new Gold(x, y);
    }

    static createLevelAppropriateItem(x, y, currentLevel, playerLuck = 50) {
        // Calculate luck modifier (-2 to +2 level range)
        // Luck 0 = -2 levels, Luck 50 = 0 levels, Luck 100 = +2 levels
        const luckModifier = Math.floor((playerLuck - 50) / 25);
        const effectiveLevel = Math.max(1, currentLevel + luckModifier);

        // Filter items that are appropriate for this level (with luck modifier)
        const validItems = ItemFactory.itemTypes.filter(itemType => {
            const levelRange = itemType.class.levelRange;
            if (!levelRange) return true; // Items without level range are always valid

            // Item is valid if the effective level overlaps with its level range
            return effectiveLevel >= levelRange[0] && effectiveLevel <= levelRange[1];
        });

        // If no valid items found (shouldn't happen), fall back to all items
        if (validItems.length === 0) {
            return ItemFactory.createRandomItem(x, y);
        }

        // Calculate total chance for valid items
        const totalChance = validItems.reduce((sum, it) => sum + it.chance, 0);
        let rand = Math.random() * totalChance;

        for (const itemType of validItems) {
            if (rand < itemType.chance) {
                return new itemType.class(x, y);
            }
            rand -= itemType.chance;
        }

        // Fallback to first valid item
        return new validItems[0].class(x, y);
    }
}

// Restored ItemManager class (handles item placement, guaranteed weapon spawn, pickup, and memory)
class ItemManager {
    constructor(game) {
        this.game = game;
        this.items = [];
        this.itemMemory = new Map(); // key: "x,y" -> {symbol, type}
    }

    generateItems() {
        this.items = [];
        this.itemMemory = new Map();

        // Ensure at least one level-appropriate weapon spawns
        this.guaranteeWeapon();

        this.game.rooms.forEach((room) => {
            const numItems = Math.floor(Math.random() * 3);
            for (let i = 0; i < numItems; i++) {
                if (Math.random() < 0.7) {
                    const x = room.x + Math.floor(Math.random() * room.width);
                    const y = room.y + Math.floor(Math.random() * room.height);

                    // Avoid stairs, player start, doors, or occupied item tiles
                    if (
                        (this.game.upStair && x === this.game.upStair.x && y === this.game.upStair.y) ||
                        (this.game.downStair && x === this.game.downStair.x && y === this.game.downStair.y) ||
                        (x === Game.player.x && y === Game.player.y) ||
                        this.game.dungeon[y][x] === '+' ||
                        this.items.some(it => it.x === x && it.y === y)
                    ) {
                        continue;
                    }

                    const currentLevel = Game.player.level;
                    const playerLuck = Game.player.luck;
                    const item = ItemFactory.createLevelAppropriateItem(x, y, currentLevel, playerLuck);
                    this.items.push(item);
                }
            }
        });
        this.updateItemMemory();
    }

    guaranteeWeapon() {
        const weaponClasses = [
            Stick, RustyKnife, Club, BoneShard,
            SmallDagger, Shortsword, Rapier, Longsword, Spear,
            Battleaxe, Warhammer, Greatsword, Halberd,
            EnchantedBlade, DragonSlayer
        ];
        const currentLevel = Game.player.level;
        const playerLuck = Game.player.luck || 50;
        const luckModifier = Math.floor((playerLuck - 50) / 25);
        const effectiveLevel = Math.max(1, currentLevel + luckModifier);
        // Phase out primitive weapons after early game
        const phased = weaponClasses.filter(wc => {
            if (effectiveLevel >= 3 && (wc === Stick || wc === BoneShard)) return false;
            if (effectiveLevel >= 4 && (wc === RustyKnife || wc === Club)) return false;
            const lr = wc.levelRange;
            if (!lr) return true;
            return effectiveLevel >= lr[0] && effectiveLevel <= lr[1];
        });
        const validWeapons = phased.length ? phased : weaponClasses;
        if (validWeapons.length === 0) validWeapons.push(SmallDagger, Shortsword);
        const weaponClass = validWeapons[Math.floor(Math.random() * validWeapons.length)];

        let attempts = 0;
        while (attempts < 60) {
            attempts++;
            const room = this.game.rooms[Math.floor(Math.random() * this.game.rooms.length)];
            const x = room.x + Math.floor(Math.random() * room.width);
            const y = room.y + Math.floor(Math.random() * room.height);
            if (!this.game.dungeon[y] || this.game.dungeon[y][x] !== '.') continue;
            if (this.game.upStair && x === this.game.upStair.x && y === this.game.upStair.y) continue;
            if (this.game.downStair && x === this.game.downStair.x && y === this.game.downStair.y) continue;
            if (x === Game.player.x && y === Game.player.y) continue;
            if (this.items.some(it => it.x === x && it.y === y)) continue;
            this.items.push(new weaponClass(x, y));
            break;
        }
    }

    checkForItems() {
        const p = Game.player;
        const idx = this.items.findIndex(it => it.x === p.x && it.y === p.y);
        if (idx !== -1) {
            const item = this.items[idx];
            item.onCollect(this.game);
            this.items.splice(idx, 1);
            this.itemMemory.delete(`${item.x},${item.y}`);
            this.game.updateUI();
            return true;
        }
        return false;
    }

    updateItemMemory() {
        if (!this.itemMemory) this.itemMemory = new Map();
        this.items.forEach(item => {
            if (this.game.visible[item.y] && this.game.visible[item.y][item.x]) {
                this.itemMemory.set(`${item.x},${item.y}`, {
                    symbol: item.getSymbol(),
                    type: item.getType(),
                });
            }
        });
    }
}

if (typeof module !== 'undefined') {
    module.exports = {
        ItemFactory,
        ItemManager,
        Item,
        Weapon,
        Armor,
        Gold,
        HealthPotion,
        SpeedPotion,
        PsionicScroll,
        TeleportScroll,
        MappingScroll,
        FireballScroll,
        RegenerationScroll,
        Stick,
        RustyKnife,
        Club,
        BoneShard,
        SmallDagger,
        Shortsword,
        Rapier,
        Longsword,
        Spear,
        Battleaxe,
        Warhammer,
        Greatsword,
        Halberd,
        EnchantedBlade,
        DragonSlayer,
        LeatherHelm,
        IronHelmet,
        LeatherVest,
        ChainMail,
        PlateMail,
        LeatherPants,
        IronGreaves,
        LeatherBoots,
        IronBoots,
        LeatherGloves,
        IronGauntlets,
        LeatherBracers,
        SteelVambraces,
        ProtectionRing
    };
}
