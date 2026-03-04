# web-dungeon

## 🎯 NEW: Trap System!

Hidden traps now lurk in the dungeon! They remain invisible until you detect them (based on Intelligence and Luck) or trigger them the hard way.

**Features:**
- **6 Trap Types**: Spike, Poison Dart, Pit, Teleport, Alarm, and Weakening traps
- **Smart Detection**: Higher INT and LUCK = better trap spotting
- **Visual Indicators**: Discovered traps show as `^` on the map in color-coded format
- **Running Risk**: Running is fast but stops when you spot or trigger a trap
- **Level Scaling**: Deeper dungeons have deadlier traps

**See Full Documentation:**
- `TRAPS_README.md` - Complete trap mechanics and balance
- `TRAP_IMPLEMENTATION_SUMMARY.md` - Technical implementation details
- `trap_guide.html` - Visual guide (open in browser)
- `test_traps.html` - Test suite for trap system

---

## Scroll Types Added:
- Psionic Scroll: Damages all visible monsters (existing).
- Teleportation Scroll: Randomly relocates you to a safe, walkable tile on the current level.
- Mapping Scroll: Reveals all non-wall tiles on the current dungeon level.
- Fireball Scroll: Explodes around you, damaging all monsters within a radius (even if not currently visible).
- Regeneration Scroll: Grants a buff that periodically heals body parts over time.

Low-Level Weapons Added:
- Stick: Very weak, very common starter fallback.
- Rusty Knife: Slightly better than a stick; quick.
- Club: Heavier, slower hit; modest damage.
- Bone Shard: Light improvised shiv; fast.

Low-Level Armor Added:
- Tattered Cloak (torso): Minimal protection, very light.
- Padded Cap (head): Small early-game head defense.
- Patchwork Trousers (legs): Light leg covering.
- Worn Sandals (feet): Token foot protection.
- Ragged Gloves (hands): Slight mitigation for hand hits.
- Frayed Bracers (arms): Minimal arm padding.

Usage:
Press 'r' or use the Inventory sidebar (Cast button) to activate the first scroll stack in your inventory.

Gameplay Notes:
- Teleport may land you in unexplored territory—use it to escape danger.
- Mapping does not reveal walls you haven’t seen, but it uncovers all traversable spaces, doors, and stairs.
- Fireball affects monsters within its radius regardless of line of sight (intentionally powerful panic button).
- Regeneration stacks if multiple scrolls are read; each adds its own scheduled healing pulses.
- Early drops now more frequently include improvised gear before true weapons/armor appear.

Enjoy exploring with the expanded magic arsenal and broader early-game loot curve!
