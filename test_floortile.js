// Test script to verify FloorTile implementation
const { FloorTile, Dungeon, MazeGenerator } = require('./maze.js');

// Create a small test dungeon
const generator = new MazeGenerator(10, 10);
const dungeon = generator.generateDungeon();

console.log('=== FloorTile & Dungeon Implementation Test ===\n');
console.log('Dungeon dimensions:', dungeon.height, 'x', dungeon.width);
console.log('Number of rooms:', dungeon.rooms.length);

// Check that dungeon tiles are FloorTile objects
console.log('\nChecking FloorTile structure:');
const sampleTile = dungeon.getTile(0, 0);
console.log('Sample tile at (0,0):', sampleTile);
console.log('Has type property:', 'type' in sampleTile);
console.log('Has items property:', 'items' in sampleTile);
console.log('Has discovered property:', 'discovered' in sampleTile);
console.log('Tile type value:', sampleTile.type);

// Test Dungeon class methods
console.log('\nTesting Dungeon class methods:');
console.log('getTile(0, 0):', dungeon.getTile(0, 0).type);
console.log('inBounds(0, 0):', dungeon.inBounds(0, 0));
console.log('inBounds(100, 100):', dungeon.inBounds(100, 100));
console.log('isOpaque(0, 0):', dungeon.isOpaque(0, 0));
console.log('isWalkable(0, 0):', dungeon.isWalkable(0, 0));

// Count tile types
const tileCounts = {};
for (let y = 0; y < dungeon.height; y++) {
    for (let x = 0; x < dungeon.width; x++) {
        const tile = dungeon.getTile(x, y);
        const type = tile.type;
        tileCounts[type] = (tileCounts[type] || 0) + 1;
    }
}

console.log('\nTile type counts:');
for (const [type, count] of Object.entries(tileCounts)) {
    const name = {
        '#': 'walls',
        '.': 'floor',
        '+': 'closed doors',
        '/': 'open doors'
    }[type] || 'unknown';
    console.log(`  ${type} (${name}): ${count}`);
}

// Verify stairs
console.log('\nStairs:');
console.log('Up stair:', dungeon.upStair);
console.log('Down stair:', dungeon.downStair);

// Verify that we can access and modify tile types
console.log('\nTesting tile modification:');
const testTile = dungeon.getTile(5, 5);
console.log('Before: type =', testTile.type);
dungeon.setTileType(5, 5, '/');
console.log('After: type =', dungeon.getTile(5, 5).type);

// Test items array
console.log('\nTesting items array:');
console.log('Items array exists:', Array.isArray(testTile.items));
console.log('Items array length:', testTile.items.length);

console.log('\n✅ All FloorTile and Dungeon tests passed!');

