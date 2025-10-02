// Quick distribution sampler for items across player levels
require('./items.js');

function sampleForLevel(level, samples=500) {
  const counts = new Map();
  for (let i=0;i<samples;i++) {
    const it = ItemFactory.createLevelAppropriateItem(0,0, level, 50);
    const name = it.constructor.name;
    counts.set(name, (counts.get(name)||0)+1);
  }
  return counts;
}

const levels = [1,2,3,4,5,6];
levels.forEach(l => {
  const c = sampleForLevel(l, 800);
  const sorted = [...c.entries()].sort((a,b)=>b[1]-a[1]);
  console.log(`Level ${l} distribution (top 12):`);
  sorted.slice(0,12).forEach(([n,v])=>console.log(`  ${n.padEnd(18)} ${v}`));
  // Show presence of key weapons
  const watch = ['SmallDagger','Shortsword','Rapier','Longsword','Spear','Battleaxe','Warhammer','Greatsword','Halberd'];
  const present = watch.filter(w=>c.has(w));
  console.log('  Present key weapons:', present.join(', ')||'none');
  console.log();
});

