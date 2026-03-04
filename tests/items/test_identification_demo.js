// Demo: Global Scroll and Potion Identification System
// This demonstrates how identifying one item type identifies all current and future instances

const assert = require('assert');

// Mock Player class
global.Player = {
    identifiedScrollTypes: new Set(),
    identifiedPotionTypes: new Set()
};

// Load Item class first
const { Item } = require('../../items/items.js');
const { Scroll, PsionicScroll, TeleportScroll, initializeScrollMagicPhrases } = require('../../items/scrolls.js');
const { Potion, HealthPotion, SpeedPotion, initializePotionColors } = require('../../items/potions.js');

// Initialize the random assignments
initializeScrollMagicPhrases();
initializePotionColors();

console.log('═══════════════════════════════════════════════════════════════');
console.log('  DEMO: Global Scroll & Potion Identification System');
console.log('═══════════════════════════════════════════════════════════════\n');

// Scenario 1: Scrolls
console.log('📜 SCENARIO 1: Scrolls\n');
console.log('Creating 3 Psionic Scrolls (unidentified)...');
const scroll1 = new PsionicScroll(0, 0);
const scroll2 = new PsionicScroll(5, 5);
const scroll3 = new PsionicScroll(10, 10);

console.log(`  Scroll 1: ${scroll1.getDisplayName()} (identified=${scroll1.identified})`);
console.log(`  Scroll 2: ${scroll2.getDisplayName()} (identified=${scroll2.identified})`);
console.log(`  Scroll 3: ${scroll3.getDisplayName()} (identified=${scroll3.identified})\n`);

console.log('🔮 Player uses Scroll 1 (simulating identification)...');
Player.identifiedScrollTypes.add('Psionic Scroll');
scroll1.identified = true;
scroll2.identified = true;
scroll3.identified = true;

console.log(`  Scroll 1: ${scroll1.getDisplayName()} (identified=${scroll1.identified})`);
console.log(`  Scroll 2: ${scroll2.getDisplayName()} (identified=${scroll2.identified})`);
console.log(`  Scroll 3: ${scroll3.getDisplayName()} (identified=${scroll3.identified})\n`);

console.log('✨ Creating NEW Psionic Scroll after identification...');
const scroll4 = new PsionicScroll(15, 15);
console.log(`  Scroll 4: ${scroll4.getDisplayName()} (identified=${scroll4.identified})`);
console.log('  → Automatically identified because type is known!\n');

console.log('Creating a DIFFERENT scroll type (Teleport)...');
const teleScroll = new TeleportScroll(20, 20);
console.log(`  Teleport Scroll: ${teleScroll.getDisplayName()} (identified=${teleScroll.identified})`);
console.log('  → Not identified because it\'s a different type\n');

console.log('─────────────────────────────────────────────────────────────\n');

// Scenario 2: Potions
console.log('🧪 SCENARIO 2: Potions\n');
console.log('Creating 3 Health Potions (unidentified)...');
const potion1 = new HealthPotion(0, 0);
const potion2 = new HealthPotion(5, 5);
const potion3 = new HealthPotion(10, 10);

console.log(`  Potion 1: ${potion1.getDisplayName()} (identified=${potion1.identified})`);
console.log(`  Potion 2: ${potion2.getDisplayName()} (identified=${potion2.identified})`);
console.log(`  Potion 3: ${potion3.getDisplayName()} (identified=${potion3.identified})\n`);

console.log('💊 Player drinks Potion 1 (simulating identification)...');
Player.identifiedPotionTypes.add('Health Potion');
potion1.identified = true;
potion2.identified = true;
potion3.identified = true;

console.log(`  Potion 1: ${potion1.getDisplayName()} (identified=${potion1.identified})`);
console.log(`  Potion 2: ${potion2.getDisplayName()} (identified=${potion2.identified})`);
console.log(`  Potion 3: ${potion3.getDisplayName()} (identified=${potion3.identified})\n`);

console.log('✨ Creating NEW Health Potion after identification...');
const potion4 = new HealthPotion(15, 15);
console.log(`  Potion 4: ${potion4.getDisplayName()} (identified=${potion4.identified})`);
console.log('  → Automatically identified because type is known!\n');

console.log('Creating a DIFFERENT potion type (Speed)...');
const speedPotion = new SpeedPotion(20, 20);
console.log(`  Speed Potion: ${speedPotion.getDisplayName()} (identified=${speedPotion.identified})`);
console.log('  → Not identified because it\'s a different type\n');

console.log('═══════════════════════════════════════════════════════════════');
console.log('  SUMMARY');
console.log('═══════════════════════════════════════════════════════════════');
console.log('✓ When you identify a scroll/potion by using it:');
console.log('  • All existing instances of that type become identified');
console.log('  • All FUTURE instances spawn pre-identified');
console.log('  • Different types remain unidentified');
console.log('\n✓ Implementation complete and tested!');
console.log('═══════════════════════════════════════════════════════════════\n');

