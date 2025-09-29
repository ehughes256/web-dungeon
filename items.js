// Base Item class
class Item {
  static dropChance = 0.0;

  static levelRange = [1, 5];

  static baseWeight = 0;

  constructor(x, y, name, speed = 1, enchantments = {}, weight = 0) {
    this.x = x;
    this.y = y;
    this.name = name;
    this.speed = speed; // Time cost to pick up or use
    this.enchantments = enchantments;
    this.weight = weight;
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

  onDrop(game) {}

  use(game) {}

  remove(game) {}

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
    super(-1, -1, 'Empty', 0, {}, 0);
  }

  getSymbol() {
    return ' ';
  }

  getColor() {
    return '#000000';
  }

  onCollect(game) {}

  getDamageDefense() {
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
    super(x, y, altNames[Math.floor(Math.random() * altNames.length)], 0, {}, 0);
    this.amount = amount || Math.floor(Math.random() * 50) + 10;
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
    game.player.addGold(this.amount);
    game.addMessage(`Found ${this.amount} gold!`);
  }
}

// Potion item class
class Potion extends Item {
  constructor(x, y, name) {
    super(x, y, name, 10, {}, 2);
  }

  getSymbol() {
    return '!';
  }

  getColor() {
    return '#ff00ff';
  }

  onCollect(game) {
    game.player.addPotion(this.createInventoryCopy());
  }
}

// HealthPotion subclass - enhanced healing potion
class HealthPotion extends Potion {
  static dropChance = 0.05;

  static levelRange = [1, 5];

  constructor(x, y, name, healAmount) {
    super(x, y, name || 'Health Potion');
    this.healAmount = healAmount || 20;
  }

  getColor() {
    return '#ff88ff'; // Brighter pink to distinguish from regular potions
  }

  use(game) {
    game.addMessage(`You drink the health potion!`);
    const healedAmount = game.player.heal(this.healAmount);
    return {
      success: true,
      message: `You drink ${this.name} (+${healedAmount} HP).`,
      potion: this,
    };
  }

  onCollect(game) {
    game.player.addPotion(this.createInventoryCopy());
    game.addMessage(`Found a powerful ${this.name}!`);
  }
}

class SpeedPotion extends Potion {
  static dropChance = 0.05;

  static levelRange = [1, 5];

  constructor(x, y, name, speedBoost) {
    super(x, y, name || 'Speed Potion');
    this.speedBoost = speedBoost || 20; // Example speed boost value
  }

  getColor() {
    return '#00ff00'; // Green color for speed potions
  }

  onCollect(game) {
    game.player.addPotion(this.createInventoryCopy());
    game.addMessage(`Found a Potion that boosts speed!`);
  }

  use(game) {
    game.addMessage(`You drink the speed potion!`);
    game.player.speed -= this.speedBoost;
    game.timeManager.scheduleEvent(1000, this, () => {
      game.player.speed += this.speedBoost;
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
    super(x, y, name, 30, {}, 1);
  }

  getSymbol() {
    return '?';
  }

  getColor() {
    return '#00ffff';
  }

  onCollect(game) {
    game.player.addScroll(this.createInventoryCopy());
  }
}

class PsionicScroll extends Scroll {
  static dropChance = 0.2;

  static levelRange = [1, 5];

  constructor(x, y, name, damage) {
    super(x, y, 'Psionic Scroll');
    this.damage = damage || 25;
  }

  getColor() {
    return '#aa00ff'; // Purple color for psionic scrolls
  }

  onCollect(game) {
    game.player.addScroll(this.createInventoryCopy());
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

// Weapon item class
class Weapon extends Item {
  static baseDamage = 5;

  static baseSpeed = 10;

  constructor(x, y, name, attackBonus, enchantment, weight) {
    super(x, y, name, Weapon.baseSpeed, enchantment || {}, weight || 3);
    this.damage = Weapon.baseDamage;
    this.attackBonus = attackBonus || 0;
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

  getAttackBonus() {
    return this.attackBonus;
  }

  onCollect(game) {
    const weaponCopy = this.createInventoryCopy();
    game.player.addWeapon(weaponCopy);
  }
}

class SmallDagger extends Weapon {
  static dropChance = 0.1;

  static levelRange = [1, 5];

  constructor(x, y, name, attackBonus) {
    super(x, y, name || 'Small Dagger', attackBonus || 3, {}, 4);
  }
}

// Light/Fast Weapons
class Shortsword extends Weapon {
  static dropChance = 0.08;
  static levelRange = [2, 6];

  constructor(x, y, name, attackBonus) {
    super(x, y, name || 'Shortsword', attackBonus || 5, {}, 6);
    this.speed = 12; // Slightly slower than dagger
  }
}

class Rapier extends Weapon {
  static dropChance = 0.06;
  static levelRange = [3, 7];

  constructor(x, y, name, attackBonus) {
    super(x, y, name || 'Rapier', attackBonus || 4, {}, 5);
    this.speed = 8; // Very fast weapon
  }

  getColor() {
    return '#ffaa44'; // Slightly different color for finesse weapons
  }
}

// Medium Weapons
class Longsword extends Weapon {
  static dropChance = 0.07;
  static levelRange = [3, 8];

  constructor(x, y, name, attackBonus) {
    super(x, y, name || 'Longsword', attackBonus || 7, {}, 10);
    this.speed = 15; // Slower but more damage
  }
}

class Battleaxe extends Weapon {
  static dropChance = 0.06;
  static levelRange = [4, 9];

  constructor(x, y, name, attackBonus) {
    super(x, y, name || 'Battleaxe', attackBonus || 8, {}, 12);
    this.speed = 18; // Heavy and slow but powerful
  }

  getSymbol() {
    return '¥'; // Different symbol for axes
  }

  getColor() {
    return '#ff6644'; // Reddish color for axes
  }
}

class Warhammer extends Weapon {
  static dropChance = 0.05;
  static levelRange = [4, 9];

  constructor(x, y, name, attackBonus) {
    super(x, y, name || 'Warhammer', attackBonus || 9, {}, 15);
    this.speed = 20; // Very slow but devastating
  }

  getSymbol() {
    return 'T'; // Hammer-like symbol
  }

  getColor() {
    return '#aa4444'; // Dark red for blunt weapons
  }
}

// Heavy/Two-handed Weapons
class Greatsword extends Weapon {
  static dropChance = 0.04;
  static levelRange = [5, 10];

  constructor(x, y, name, attackBonus) {
    super(x, y, name || 'Greatsword', attackBonus || 12, {}, 20);
    this.speed = 25; // Very slow but massive damage
  }

  getSymbol() {
    return '†'; // Cross-like symbol for great weapons
  }

  getColor() {
    return '#ff2222'; // Bright red for powerful weapons
  }
}

class Halberd extends Weapon {
  static dropChance = 0.03;
  static levelRange = [6, 12];

  constructor(x, y, name, attackBonus) {
    super(x, y, name || 'Halberd', attackBonus || 10, {}, 18);
    this.speed = 22; // Polearm with reach advantage
  }

  getSymbol() {
    return 'Þ'; // Unique symbol for polearms
  }

  getColor() {
    return '#ff4488'; // Purple-red for exotic weapons
  }
}

// Ranged Weapons (still melee in this system but different flavor)
class Spear extends Weapon {
  static dropChance = 0.07;
  static levelRange = [2, 7];

  constructor(x, y, name, attackBonus) {
    super(x, y, name || 'Spear', attackBonus || 6, {}, 8);
    this.speed = 14; // Medium speed, good reach
  }

  getSymbol() {
    return '|'; // Straight line for spears
  }

  getColor() {
    return '#ffcc44'; // Yellow-orange for spears
  }
}

// Exotic/Magical Weapons
class EnchantedBlade extends Weapon {
  static dropChance = 0.02;
  static levelRange = [7, 15];

  constructor(x, y, name, attackBonus) {
    super(x, y, name || 'Enchanted Blade', attackBonus || 15, {}, 8);
    this.speed = 10; // Magical efficiency
  }

  getColor() {
    return '#44ffff'; // Cyan for magical weapons
  }
}

class DragonSlayer extends Weapon {
  static dropChance = 0.01;
  static levelRange = [10, 20];

  constructor(x, y, name, attackBonus) {
    super(x, y, name || 'Dragonslayer Sword', attackBonus || 20, {}, 25);
    this.speed = 30; // Legendary weapon, slow but devastating
  }

  getSymbol() {
    return '♦'; // Diamond symbol for legendary weapons
  }

  getColor() {
    return '#ffdd00'; // Gold for legendary weapons
  }
}

// Armor item class
class Armor extends Item {
  constructor(x, y, name, speed, enchantments, weight, defense, bodyLocation) {
    super(x, y, name, speed, enchantments, weight);
    this.bodyLocation = bodyLocation || 'torso';
    this.defense = defense;
  }

  getBodyLocation() {
    return this.bodyLocation;
  }

  getDamageDefense() {
    return this.defense;
  }

  getEncumbrance() {
    return this.weight;
  }

  getSymbol() {
    return '[';
  }

  getColor() {
    return '#4444ff';
  }

  onCollect(game) {
    const armorCopy = this.createInventoryCopy();
    game.player.addArmor(armorCopy);
  }
}

class ClothRobe extends Armor {
  static dropChance = 0.1;

  static levelRange = [1, 5];

  constructor(x, y, name) {
    super(x, y, name || 'Cloth Robe', 15, {}, 50, 1, 'torso');
  }
}

// Head Armor
class LeatherHelm extends Armor {
  static dropChance = 0.08;
  static levelRange = [1, 3];

  constructor(x, y, name) {
    super(x, y, name || 'Leather Helm', 12, {}, 20, 1, 'head');
  }
}

class IronHelmet extends Armor {
  static dropChance = 0.05;
  static levelRange = [2, 6];

  constructor(x, y, name) {
    super(x, y, name || 'Iron Helmet', 18, {}, 80, 3, 'head');
  }
}

// Torso Armor
class LeatherVest extends Armor {
  static dropChance = 0.08;
  static levelRange = [1, 4];

  constructor(x, y, name) {
    super(x, y, name || 'Leather Vest', 16, {}, 40, 2, 'torso');
  }
}

class ChainMail extends Armor {
  static dropChance = 0.06;
  static levelRange = [2, 6];

  constructor(x, y, name) {
    super(x, y, name || 'Chain Mail', 20, {}, 150, 4, 'torso');
  }
}

class PlateMail extends Armor {
  static dropChance = 0.03;
  static levelRange = [4, 8];

  constructor(x, y, name) {
    super(x, y, name || 'Plate Mail', 25, {}, 300, 6, 'torso');
  }
}

// Leg Armor
class LeatherPants extends Armor {
  static dropChance = 0.07;
  static levelRange = [1, 4];

  constructor(x, y, name) {
    super(x, y, name || 'Leather Pants', 14, {}, 35, 1, 'legs');
  }
}

class IronGreaves extends Armor {
  static dropChance = 0.05;
  static levelRange = [3, 7];

  constructor(x, y, name) {
    super(x, y, name || 'Iron Greaves', 22, {}, 120, 3, 'legs');
  }
}

// Foot Armor
class LeatherBoots extends Armor {
  static dropChance = 0.09;
  static levelRange = [1, 3];

  constructor(x, y, name) {
    super(x, y, name || 'Leather Boots', 10, {}, 25, 1, 'feet');
  }
}

class IronBoots extends Armor {
  static dropChance = 0.06;
  static levelRange = [2, 5];

  constructor(x, y, name) {
    super(x, y, name || 'Iron Boots', 16, {}, 60, 2, 'feet');
  }
}

// Hand Armor
class LeatherGloves extends Armor {
  static dropChance = 0.08;
  static levelRange = [1, 3];

  constructor(x, y, name) {
    super(x, y, name || 'Leather Gloves', 8, {}, 15, 1, 'hands');
  }
}

class IronGauntlets extends Armor {
  static dropChance = 0.05;
  static levelRange = [3, 6];

  constructor(x, y, name) {
    super(x, y, name || 'Iron Gauntlets', 14, {}, 45, 2, 'hands');
  }
}

// Arm Armor
class LeatherBracers extends Armor {
  static dropChance = 0.07;
  static levelRange = [1, 4];

  constructor(x, y, name) {
    super(x, y, name || 'Leather Bracers', 12, {}, 30, 1, 'arms');
  }
}

class SteelVambraces extends Armor {
  static dropChance = 0.04;
  static levelRange = [3, 7];

  constructor(x, y, name) {
    super(x, y, name || 'Steel Vambraces', 18, {}, 70, 3, 'arms');
  }
}

// Ring Armor (accessories)
class ProtectionRing extends Armor {
  static dropChance = 0.03;
  static levelRange = [2, 8];

  constructor(x, y, name) {
    super(x, y, name || 'Ring of Protection', 5, {}, 5, 2, 'rings');
  }

  getColor() {
    return '#ffaa00'; // Gold color for rings
  }

  getSymbol() {
    return 'o'; // Different symbol for rings
  }
}

// Item factory for creating items
class ItemFactory {
  static itemTypes = [
    { class: Gold, chance: Gold.dropChance },
    { class: HealthPotion, chance: HealthPotion.dropChance },
    { class: SpeedPotion, chance: SpeedPotion.dropChance },
    { class: PsionicScroll, chance: PsionicScroll.dropChance },
    // Weapons - Light/Fast
    { class: SmallDagger, chance: SmallDagger.dropChance },
    { class: Shortsword, chance: Shortsword.dropChance },
    { class: Rapier, chance: Rapier.dropChance },
    // Weapons - Medium
    { class: Longsword, chance: Longsword.dropChance },
    { class: Spear, chance: Spear.dropChance },
    { class: Battleaxe, chance: Battleaxe.dropChance },
    { class: Warhammer, chance: Warhammer.dropChance },
    // Weapons - Heavy/Exotic
    { class: Greatsword, chance: Greatsword.dropChance },
    { class: Halberd, chance: Halberd.dropChance },
    { class: EnchantedBlade, chance: EnchantedBlade.dropChance },
    { class: DragonSlayer, chance: DragonSlayer.dropChance },
    // Armor
    { class: ClothRobe, chance: ClothRobe.dropChance },
    // Head armor
    { class: LeatherHelm, chance: LeatherHelm.dropChance },
    { class: IronHelmet, chance: IronHelmet.dropChance },
    // Torso armor
    { class: LeatherVest, chance: LeatherVest.dropChance },
    { class: ChainMail, chance: ChainMail.dropChance },
    { class: PlateMail, chance: PlateMail.dropChance },
    // Leg armor
    { class: LeatherPants, chance: LeatherPants.dropChance },
    { class: IronGreaves, chance: IronGreaves.dropChance },
    // Foot armor
    { class: LeatherBoots, chance: LeatherBoots.dropChance },
    { class: IronBoots, chance: IronBoots.dropChance },
    // Hand armor
    { class: LeatherGloves, chance: LeatherGloves.dropChance },
    { class: IronGauntlets, chance: IronGauntlets.dropChance },
    // Arm armor
    { class: LeatherBracers, chance: LeatherBracers.dropChance },
    { class: SteelVambraces, chance: SteelVambraces.dropChance },
    // Ring armor
    { class: ProtectionRing, chance: ProtectionRing.dropChance },
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
}

class ItemManager {
  constructor(game) {
    this.game = game;
    this.items = [];
    this.itemMemory = new Map();
  }

  generateItems() {
    this.items = [];
    this.itemMemory = new Map();

    this.game.rooms.forEach((room) => {
      const numItems = Math.floor(Math.random() * 3) + 1;
      for (let i = 0; i < numItems; i++) {
        if (Math.random() < 0.7) {
          const x = room.x + Math.floor(Math.random() * room.width);
          const y = room.y + Math.floor(Math.random() * room.height);

          // Skip if position conflicts with stairs, player, or doors
          if (
            (this.game.upStair && x === this.game.upStair.x && y === this.game.upStair.y) ||
            (this.game.downStair && x === this.game.downStair.x && y === this.game.downStair.y) ||
            (x === this.game.player.x && y === this.game.player.y) ||
            this.game.dungeon[y][x] === '+'
          ) {
            continue;
          }

          const item = ItemFactory.createRandomItem(x, y);
          this.items.push(item);
        }
      }
    });
  }

  checkForItems() {
    const { player } = this.game;
    const idx = this.items.findIndex((it) => it.x === player.x && it.y === player.y);
    if (idx !== -1) {
      const item = this.items[idx];
      item.onCollect(this.game);
      this.items.splice(idx, 1);
      this.itemMemory.delete(`${item.x},${item.y}`);
      this.game.updateUI();
    }
  }

  updateItemMemory() {
    if (!this.itemMemory) this.itemMemory = new Map();

    this.items.forEach((item) => {
      if (this.game.visible[item.y] && this.game.visible[item.y][item.x]) {
        this.itemMemory.set(`${item.x},${item.y}`, {
          symbol: item.getSymbol(),
          type: item.getType(),
        });
      }
    });
  }
}
