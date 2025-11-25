// Test maze generation improvements
const {Dungeon, MazeGenerator} = require('./maze.js');

console.log('Testing maze generation improvements...\n');

// Test 1: Check that rooms don't overlap
console.log('Test 1: Checking room overlaps');
const generator = new MazeGenerator(60, 30);
const dungeon = generator.generateDungeon();

let overlaps = 0;
for (let i = 0; i < dungeon.rooms.length; i++) {
    for (let j = i + 1; j < dungeon.rooms.length; j++) {
        const r1 = dungeon.rooms[i];
        const r2 = dungeon.rooms[j];

        // Check if rooms actually overlap (not just touch)
        if (r1.x < r2.x + r2.width &&
            r1.x + r1.width > r2.x &&
            r1.y < r2.y + r2.height &&
            r1.y + r1.height > r2.y) {
            overlaps++;
            console.log(`  ❌ Room ${i} overlaps with room ${j}`);
        }
    }
}

if (overlaps === 0) {
    console.log(`  ✓ No room overlaps detected (${dungeon.rooms.length} rooms)`);
} else {
    console.log(`  ✗ Found ${overlaps} room overlaps`);
}

// Test 2: Check that doors are properly positioned
console.log('\nTest 2: Checking door positions');
let doorCount = 0;
let validDoors = 0;

for (let y = 0; y < dungeon.height; y++) {
    for (let x = 0; x < dungeon.width; x++) {
        const tile = dungeon.getTile(x, y);
        if (tile && (tile.type === '+' || tile.type === '/')) {
            doorCount++;

            // Check if door has floor/room tiles adjacent
            const adjacentFloors = [
                [x+1, y], [x-1, y], [x, y+1], [x, y-1]
            ].filter(([nx, ny]) => {
                const t = dungeon.getTile(nx, ny);
                return t && (t.type === '.' || t.type === '/' || t.type === '+');
            }).length;

            // A valid door should have at least 2 adjacent walkable tiles
            if (adjacentFloors >= 2) {
                validDoors++;
            } else {
                console.log(`  ⚠ Door at (${x}, ${y}) has only ${adjacentFloors} adjacent floors`);
            }
        }
    }
}

if (doorCount > 0) {
    console.log(`  ✓ Found ${doorCount} doors, ${validDoors} properly connected`);
    if (validDoors === doorCount) {
        console.log('  ✓ All doors are properly connected!');
    } else {
        console.log(`  ⚠ ${doorCount - validDoors} doors may be improperly placed`);
    }
} else {
    console.log('  ℹ No doors found (expected for some maze layouts)');
}

// Test 3: Check connectivity - can we reach all rooms?
console.log('\nTest 3: Checking room connectivity');
if (dungeon.rooms.length > 0) {
    const visited = new Set();
    const queue = [];

    // Start from first room center
    const startRoom = dungeon.rooms[0];
    queue.push([
        startRoom.x + Math.floor(startRoom.width / 2),
        startRoom.y + Math.floor(startRoom.height / 2)
    ]);

    while (queue.length > 0) {
        const [x, y] = queue.shift();
        const key = `${x},${y}`;

        if (visited.has(key)) continue;
        visited.add(key);

        // Check all 4 directions
        [[x+1, y], [x-1, y], [x, y+1], [x, y-1]].forEach(([nx, ny]) => {
            if (nx >= 0 && ny >= 0 && nx < dungeon.width && ny < dungeon.height) {
                const tile = dungeon.getTile(nx, ny);
                if (tile && (tile.type === '.' || tile.type === '/' || tile.type === '+')) {
                    const nkey = `${nx},${ny}`;
                    if (!visited.has(nkey)) {
                        queue.push([nx, ny]);
                    }
                }
            }
        });
    }

    // Count how many room tiles are reachable
    let reachableRoomTiles = 0;
    let totalRoomTiles = 0;

    for (const room of dungeon.rooms) {
        for (let y = room.y; y < room.y + room.height; y++) {
            for (let x = room.x; x < room.x + room.width; x++) {
                totalRoomTiles++;
                if (visited.has(`${x},${y}`)) {
                    reachableRoomTiles++;
                }
            }
        }
    }

    const connectivity = (reachableRoomTiles / totalRoomTiles * 100).toFixed(1);
    console.log(`  ✓ ${connectivity}% of room tiles are connected`);

    if (connectivity > 95) {
        console.log('  ✓ Excellent connectivity!');
    } else if (connectivity > 80) {
        console.log('  ⚠ Good connectivity, but some rooms may be isolated');
    } else {
        console.log('  ✗ Poor connectivity - many rooms are unreachable');
    }
}

console.log('\n✅ Maze generation test complete!');

