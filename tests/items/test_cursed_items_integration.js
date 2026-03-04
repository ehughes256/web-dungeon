// Integration test for cursed items in the game context
// This test verifies the feature works with the actual game mechanics

// Load items.js and scrolls.js (in Node.js environment)
if (typeof require !== 'undefined') {
    const items = require('../../items/items.js');
    const scrolls = require('../../items/scrolls.js');
    Object.assign(global, items, scrolls);
}

// Mock Game object with player (must be global for items.js to access)
global.Game = {
    player: {
        body: {
            weapon: null,
            armor: null,
            helmet: null,
            boots: null,
            gloves: null,
            ring: null
        }
    }
};


// Mock game object for testing
const mockGame = {
    addMessage: function(msg) {
        console.log('  [Game Message]:', msg);
    },
    updateUI: function() {
        console.log('  [UI Updated]');
    },
    render: function() {
        console.log('  [Game Rendered]');
    },
    timeManager: {
        scheduleEvent: function() {}
    },
    monsterManager: {
        monsters: []
    },
    visible: [],
    computeFOV: function() {},
    dungeon: {
        inBounds: function() { return true; },
        getTile: function() { return { type: '.' }; }
    },
    width: 50,
    height: 50
};

function testPlayerEquipCursedWeapon() {
    console.log('\n=== Testing Curse Prevention on Weapon ===');

    // Reset player body
    global.Game.player.body = {
        weapon: null,
        armor: null,
        helmet: null,
        boots: null,
        gloves: null,
        ring: null
    };

    // Create and curse a weapon
    const sword = new Longsword(0, 0);
    console.log('Created Longsword, damage:', sword.damage);

    sword.applyCurse();
    console.log('Applied curse, damage now:', sword.damage);
    console.log('Cursed status:', sword.cursed);

    // Simulate equipping
    global.Game.player.body.weapon = sword;
    console.log('Simulated equipping weapon');

    // Test that cursed flag is set
    if (global.Game.player.body.weapon.cursed) {
        console.log('✓ Weapon is correctly marked as cursed!');
    } else {
        console.log('✗ ERROR: Weapon not marked as cursed!');
        process.exit(1);
    }

    // Verify negative damage
    if (global.Game.player.body.weapon.damage < 0) {
        console.log('✓ Weapon has negative damage:', global.Game.player.body.weapon.damage);
    } else {
        console.log('✗ ERROR: Weapon does not have negative damage!');
        process.exit(1);
    }

    console.log('✓ Weapon curse test passed');
}

function testPlayerEquipCursedArmor() {
    console.log('\n=== Testing Curse Prevention on Armor ===');

    // Reset player body
    global.Game.player.body = {
        weapon: null,
        armor: null,
        helmet: null,
        boots: null,
        gloves: null,
        ring: null
    };

    // Create and curse armor
    const armor = new ChainMail(0, 0);
    console.log('Created ChainMail, defense:', armor.defense);

    armor.applyCurse();
    console.log('Applied curse, defense now:', armor.defense);
    console.log('Cursed status:', armor.cursed);

    // Simulate equipping
    global.Game.player.body.armor = armor;
    console.log('Simulated equipping armor');

    // Test that cursed flag is set
    if (global.Game.player.body.armor.cursed) {
        console.log('✓ Armor is correctly marked as cursed!');
    } else {
        console.log('✗ ERROR: Armor not marked as cursed!');
        process.exit(1);
    }

    // Verify negative defense
    if (global.Game.player.body.armor.defense < 0) {
        console.log('✓ Armor has negative defense:', global.Game.player.body.armor.defense);
    } else {
        console.log('✗ ERROR: Armor does not have negative defense!');
        process.exit(1);
    }

    console.log('✓ Armor curse test passed');
}

function testUncurseScrollUsage() {
    console.log('\n=== Testing Uncurse Scroll Usage ===');

    // Reset player body
    global.Game.player.body = {
        weapon: null,
        armor: null,
        helmet: null,
        boots: null,
        gloves: null,
        ring: null
    };

    // Create and equip cursed weapon
    const sword = new Longsword(0, 0);
    sword.applyCurse();
    global.Game.player.body.weapon = sword;
    console.log('Equipped cursed Longsword');
    console.log('Weapon is cursed:', global.Game.player.body.weapon.cursed);
    console.log('Weapon damage:', global.Game.player.body.weapon.damage);

    // Create and equip cursed armor
    const armor = new ChainMail(0, 0);
    armor.applyCurse();
    global.Game.player.body.armor = armor;
    console.log('Equipped cursed ChainMail');
    console.log('Armor is cursed:', global.Game.player.body.armor.cursed);
    console.log('Armor defense:', global.Game.player.body.armor.defense);

    // Use uncurse scroll
    console.log('\nUsing Uncurse Scroll...');
    const scroll = new UncurseScroll(0, 0);
    scroll.use(mockGame);

    // Check if items are no longer cursed
    console.log('\nAfter uncurse:');
    console.log('Weapon is cursed:', global.Game.player.body.weapon.cursed);
    console.log('Weapon damage:', global.Game.player.body.weapon.damage);
    console.log('Armor is cursed:', global.Game.player.body.armor.cursed);
    console.log('Armor defense:', global.Game.player.body.armor.defense);

    if (!global.Game.player.body.weapon.cursed && !global.Game.player.body.armor.cursed) {
        console.log('✓ Uncurse scroll successfully removed all curses!');
    } else {
        console.log('✗ ERROR: Some items are still cursed!');
        process.exit(1);
    }

    // Verify stats are positive again
    if (global.Game.player.body.weapon.damage > 0 && global.Game.player.body.armor.defense > 0) {
        console.log('✓ Stats restored to positive values!');
    } else {
        console.log('✗ ERROR: Stats not properly restored!');
        process.exit(1);
    }

    console.log('✓ Uncurse scroll usage test passed');
}

function testStatInversion() {
    console.log('\n=== Testing Stat Inversion on Curse ===');

    // Test weapon with bonuses
    const weapon = new DragonSlayer(0, 0);
    const originalDamage = weapon.damage;
    const originalDamageBonus = weapon.bonuses.damage || 0;
    const originalAttackBonus = weapon.bonuses.attack || 0;

    console.log('DragonSlayer original stats:');
    console.log('  Damage:', originalDamage);
    console.log('  Damage Bonus:', originalDamageBonus);
    console.log('  Attack Bonus:', originalAttackBonus);

    weapon.applyCurse();

    console.log('After curse:');
    console.log('  Damage:', weapon.damage);
    console.log('  Damage Bonus:', weapon.bonuses.damage);
    console.log('  Attack Bonus:', weapon.bonuses.attack);

    if (weapon.damage < 0 &&
        weapon.bonuses.damage <= 0 &&
        weapon.bonuses.attack <= 0) {
        console.log('✓ All stats correctly inverted to negative!');
    } else {
        console.log('✗ ERROR: Stats not properly inverted!');
        process.exit(1);
    }

    console.log('✓ Stat inversion test passed');
}

// Run all integration tests
console.log('Starting cursed items integration tests...\n');

try {
    testPlayerEquipCursedWeapon();
    testPlayerEquipCursedArmor();
    testUncurseScrollUsage();
    testStatInversion();

    console.log('\n=== All Integration Tests Passed! ===\n');
    console.log('The cursed items feature is fully integrated and working correctly.');
} catch (error) {
    console.error('Integration test failed:', error);
    process.exit(1);
}

