// Test multiple maze generations to ensure consistency
const {Dungeon, MazeGenerator} = require('./maze.js');

console.log('Testing maze generation consistency (10 iterations)...\n');

let totalTests = 10;
let passedOverlap = 0;
let passedDoors = 0;
let passedConnectivity = 0;

for (let test = 0; test < totalTests; test++) {
    const generator = new MazeGenerator(60, 30);
    const dungeon = generator.generateDungeon();

    // Test 1: Room overlaps
    let hasOverlap = false;
    for (let i = 0; i < dungeon.rooms.length; i++) {
        for (let j = i + 1; j < dungeon.rooms.length; j++) {
            const r1 = dungeon.rooms[i];
            const r2 = dungeon.rooms[j];

            if (r1.x < r2.x + r2.width &&
                r1.x + r1.width > r2.x &&
                r1.y < r2.y + r2.height &&
                r1.y + r1.height > r2.y) {
                hasOverlap = true;
                break;
            }
        }
        if (hasOverlap) break;
    }
    if (!hasOverlap) passedOverlap++;

    // Test 2: Door validity
    let doorCount = 0;
    let validDoors = 0;

    for (let y = 0; y < dungeon.height; y++) {
        for (let x = 0; x < dungeon.width; x++) {
            const tile = dungeon.getTile(x, y);
            if (tile && (tile.type === '+' || tile.type === '/')) {
                doorCount++;

                const adjacentFloors = [
                    [x+1, y], [x-1, y], [x, y+1], [x, y-1]
                ].filter(([nx, ny]) => {
                    const t = dungeon.getTile(nx, ny);
                    return t && (t.type === '.' || t.type === '/' || t.type === '+');
                }).length;

                if (adjacentFloors >= 2) {
                    validDoors++;
                }
            }
        }
    }

    if (doorCount === 0 || validDoors === doorCount) passedDoors++;

    // Test 3: Connectivity
    const visited = new Set();
    const queue = [];

    if (dungeon.rooms.length > 0) {
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

        const connectivity = (reachableRoomTiles / totalRoomTiles * 100);
        if (connectivity > 95) passedConnectivity++;
    }
}

console.log(`Room Overlap Test:    ${passedOverlap}/${totalTests} passed`);
console.log(`Door Validity Test:   ${passedDoors}/${totalTests} passed`);
console.log(`Connectivity Test:    ${passedConnectivity}/${totalTests} passed`);
console.log();

if (passedOverlap === totalTests && passedDoors === totalTests && passedConnectivity === totalTests) {
    console.log('✅ All tests passed! Maze generation is working correctly.');
} else {
    console.log('⚠️  Some tests failed. There may still be issues with maze generation.');
}

