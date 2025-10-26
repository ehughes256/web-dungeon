// Test for the new Dungeon methods: inBounds, isValidMove, canDropHere, etc.
const { Dungeon, MazeGenerator } = require('./maze.js');

console.log('=== Dungeon Methods Test ===\n');

// Create a simple dungeon
const generator = new MazeGenerator(20, 15);
const dungeon = generator.generateDungeon();

console.log(`Dungeon dimensions: ${dungeon.width} x ${dungeon.height}`);
console.log(`Number of rooms: ${dungeon.rooms.length}\n`);

// Test inBounds
console.log('Testing inBounds:');
console.log(`  inBounds(0, 0): ${dungeon.inBounds(0, 0)} (expected: true)`);
console.log(`  inBounds(10, 10): ${dungeon.inBounds(10, 10)} (expected: true)`);
console.log(`  inBounds(-1, 5): ${dungeon.inBounds(-1, 5)} (expected: false)`);
console.log(`  inBounds(25, 5): ${dungeon.inBounds(25, 5)} (expected: false)`);
console.log(`  inBounds(5, -1): ${dungeon.inBounds(5, -1)} (expected: false)`);
console.log(`  inBounds(5, 20): ${dungeon.inBounds(5, 20)} (expected: false)\n`);

// Test isValidMove - find a floor tile
let floorTile = null;
for (let y = 0; y < dungeon.height; y++) {
    for (let x = 0; x < dungeon.width; x++) {
        const tile = dungeon.getTile(x, y);
        if (tile && tile.type === '.') {
            floorTile = {x, y};
            break;
        }
    }
    if (floorTile) break;
}

console.log('Testing isValidMove:');
if (floorTile) {
    console.log(`  Floor tile at (${floorTile.x}, ${floorTile.y})`);
    console.log(`  isValidMove(${floorTile.x}, ${floorTile.y}): ${dungeon.isValidMove(floorTile.x, floorTile.y)} (expected: true)`);
}
console.log(`  isValidMove(0, 0): ${dungeon.isValidMove(0, 0)} (wall - expected: false)`);
console.log(`  isValidMove(-1, 5): ${dungeon.isValidMove(-1, 5)} (out of bounds - expected: false)\n`);

// Test canDropHere
console.log('Testing canDropHere:');
const mockItems = [];
if (floorTile) {
    console.log(`  canDropHere(${floorTile.x}, ${floorTile.y}, []): ${dungeon.canDropHere(floorTile.x, floorTile.y, mockItems)} (expected: true)`);

    // Add an item at that location
    mockItems.push({x: floorTile.x, y: floorTile.y, name: 'TestItem'});
    console.log(`  canDropHere(${floorTile.x}, ${floorTile.y}, [item]): ${dungeon.canDropHere(floorTile.x, floorTile.y, mockItems)} (expected: false - occupied)`);
}
console.log(`  canDropHere(0, 0, []): ${dungeon.canDropHere(0, 0, [])} (wall - expected: false)\n`);

// Test getWalkableDirections
console.log('Testing getWalkableDirections:');
if (floorTile) {
    const directions = dungeon.getWalkableDirections(floorTile.x, floorTile.y);
    console.log(`  From (${floorTile.x}, ${floorTile.y}): ${directions.length} walkable directions`);
    directions.forEach(dir => {
        console.log(`    Direction (${dir.dx}, ${dir.dy})`);
    });
}
console.log();

// Test openAdjacentDoors and closeAdjacentDoors - find a door
let doorTile = null;
for (let y = 0; y < dungeon.height; y++) {
    for (let x = 0; x < dungeon.width; x++) {
        const tile = dungeon.getTile(x, y);
        if (tile && tile.type === '+') {
            doorTile = {x, y};
            break;
        }
    }
    if (doorTile) break;
}

console.log('Testing door operations:');
if (doorTile) {
    console.log(`  Found closed door at (${doorTile.x}, ${doorTile.y})`);

    // Find an adjacent floor tile to the door
    const adjacentDirs = [[0, 1], [0, -1], [1, 0], [-1, 0]];
    let playerPos = null;
    for (const [dx, dy] of adjacentDirs) {
        const nx = doorTile.x + dx;
        const ny = doorTile.y + dy;
        const tile = dungeon.getTile(nx, ny);
        if (tile && tile.type === '.') {
            playerPos = {x: nx, y: ny};
            break;
        }
    }

    if (playerPos) {
        console.log(`  Player standing at (${playerPos.x}, ${playerPos.y})`);
        const opened = dungeon.openAdjacentDoors(playerPos.x, playerPos.y);
        console.log(`  openAdjacentDoors(): ${opened} door(s) opened`);
        console.log(`  Door tile type after opening: ${dungeon.getTile(doorTile.x, doorTile.y).type} (expected: /)`);

        const closed = dungeon.closeAdjacentDoors(playerPos.x, playerPos.y);
        console.log(`  closeAdjacentDoors(): ${closed} door(s) closed`);
        console.log(`  Door tile type after closing: ${dungeon.getTile(doorTile.x, doorTile.y).type} (expected: +)`);
    }
} else {
    console.log('  No doors found in this dungeon');
}
console.log();

// Test getTileDescription
console.log('Testing getTileDescription:');
console.log(`  Wall (#): "${dungeon.getTileDescription(0, 0)}"`);
if (floorTile) {
    console.log(`  Floor (.): "${dungeon.getTileDescription(floorTile.x, floorTile.y)}"`);
}
if (doorTile) {
    console.log(`  Door (+): "${dungeon.getTileDescription(doorTile.x, doorTile.y)}"`);
}
console.log(`  Out of bounds: "${dungeon.getTileDescription(-1, -1)}"`);
console.log();

console.log('✅ All Dungeon method tests completed!');

