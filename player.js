class PlayerBody {
  constructor() {
    this.weapon = new EmptyItem();
    this.head = new EmptyItem();
    this.torso = new EmptyItem();
    this.legs = new EmptyItem();
    this.feet = new EmptyItem();
    this.hands = new EmptyItem();
    this.arms = new EmptyItem();
    this.rings = new EmptyItem();
  }
}

class Player {
  constructor(x = 0, y = 0, health = 100, level = 1) {
    this.x = x;
    this.y = y;
    this.health = health;
    this.speed = 100;
    this.maxHealth = 100;
    this.level = level;
    this.inventory = { gold: 0, potions: [], scrolls: [], weapons: [], armor: [] };
    this.body = new PlayerBody();
    this.weight = 0; // Current carried weight

    this.strength = 50; // Strength attribute
    this.dexterity = 50; // Dexterity attribute
    this.intelligence = 50; // Intelligence attribute
    this.wisdom = 50; // Wisdom attribute
    this.charisma = 50; // Charisma attribute
    this.luck = 50; // Luck attribute
    this.experience = 0; // Experience points
  }

  equippedWeapon() {
    return this.body.weapon;
  }

  armorDefense() {
    let def = this.body.legs.getDamageDefense() || 0;
    def += this.body.feet.getDamageDefense() || 0;
    def += this.body.hands.getDamageDefense() || 0;
    def += this.body.arms.getDamageDefense() || 0;
    def += this.body.head.getDamageDefense() || 0;
    def += this.body.torso.getDamageDefense() || 0;

    return def;
  }

  equippedArmor() {
    return [
      this.body.head,
      this.body.torso,
      this.body.legs,
      this.body.feet,
      this.body.hands,
      this.body.arms,
      this.body.rings,
    ].filter((a) => !(a instanceof EmptyItem));
  }

  // Movement and position methods
  moveTo(x, y) {
    this.x = x;
    this.y = y;
  }

  // Combat stats
  getAttack() {
    return this.equippedWeapon().getDamage();
  }

  getDefense() {
    return this.armorDefense();
  }

  // Health management
  heal(amount) {
    const healthBefore = this.health;
    this.health = Math.min(this.maxHealth, this.health + amount);
    return this.health - healthBefore; // Return actual amount healed
  }

  takeDamage(damage) {
    const actualDamage = Math.max(1, damage - this.getDefense());
    this.health -= actualDamage;
    if (this.health < 0) this.health = 0;
    return actualDamage;
  }

  isDead() {
    return this.health <= 0;
  }

  // Equipment management
  equipWeapon(weapon) {
    this.unEquipWeapon();
    this.inventory.weapons.splice(this.inventory.weapons.indexOf(weapon), 1);
    this.body.weapon = weapon;
    return true;
  }

  unEquipWeapon() {
    if (this.equippedWeapon()) {
      if (!(this.equippedWeapon() instanceof EmptyItem)) {
        this.inventory.weapons.push(this.equippedWeapon());
      }
      this.body.weapon = new EmptyItem();
      return true;
    }
    return false;
  }

  equipArmor(armor) {
    const { bodyLocation } = armor;
    if (!bodyLocation || !['head', 'torso', 'legs', 'feet', 'hands', 'arms', 'rings'].includes(bodyLocation)) {
      return false;
    }
    this.inventory.armor.splice(this.inventory.armor.indexOf(armor), 1);
    this.unEquipArmor(bodyLocation);
    this.body[bodyLocation] = armor;
    return true;
  }

  unEquipArmor(bodyLocation) {
    if (!bodyLocation || !['head', 'torso', 'legs', 'feet', 'hands', 'arms', 'rings'].includes(bodyLocation)) {
      return false;
    }
    const armor = this.body[bodyLocation];
    if (armor && !(armor instanceof EmptyItem)) {
      this.inventory.armor.push(armor);
      this.body[bodyLocation] = new EmptyItem();
      return true;
    }
    return false;
  }

  // Inventory management
  addGold(amount) {
    this.inventory.gold += amount;
  }

  addPotion(potion) {
    if (!this.inventory.potions) this.inventory.potions = [];
    const match = this.inventory.potions.find((p) => p.name === potion.name && p.healAmount === potion.healAmount);
    if (match) match.count += 1;
    else {
      potion.count = 1;
      this.inventory.potions.push(potion);
    }
  }

  addScroll(scroll) {
    if (!this.inventory.scrolls) this.inventory.scrolls = [];
    const match = this.inventory.scrolls.find((s) => s.name === scroll.name && s.damage === scroll.damage);
    if (match) match.count += 1;
    else {
      scroll.count = 1;
      this.inventory.scrolls.push(scroll);
    }
  }

  addWeapon(weapon) {
    if (!this.inventory.weapons) this.inventory.weapons = [];
    this.inventory.weapons.push(weapon);
  }

  addArmor(armor) {
    if (!this.inventory.armor) this.inventory.armor = [];
    this.inventory.armor.push(armor);
  }

  // Item usage
  drinkPotion(game) {
    if (!this.inventory.potions || this.inventory.potions.length === 0) {
      game.addMessage('No potions to drink.');
      return;
    }
    const stack = this.inventory.potions[0];
    if (stack && typeof stack.use === 'function') stack.use(game);
    stack.count -= 1;
    if (stack.count <= 0) this.inventory.potions.shift();
    game.consumeTurn(20);
  }

  castScroll(game) {
    if (!this.inventory.scrolls || this.inventory.scrolls.length === 0) {
      game.addMessage('No scrolls to cast.');
      return { success: false, message: 'No scrolls to cast.' };
    }
    const stack = this.inventory.scrolls[0];
    game.addMessage('You read the scroll.');
    if (stack && typeof stack.use === 'function') stack.use(game);
    stack.count -= 1;
    if (stack.count <= 0) this.inventory.scrolls.shift();
    game.consumeTurn(30);
    return { success: true, message: 'Scroll cast.' };
  }
}
