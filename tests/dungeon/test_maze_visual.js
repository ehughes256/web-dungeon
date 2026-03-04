// Visual maze generation test
const {Dungeon, MazeGenerator} = require('../../maze.js');

console.log('Generating sample maze...\n');

const generator = new MazeGenerator(50, 25);
const dungeon = generator.generateDungeon();

// Render the maze
for (let y = 0; y < dungeon.height; y++) {
    let row = '';
    for (let x = 0; x < dungeon.width; x++) {
        const tile = dungeon.getTile(x, y);
        if (tile) {
            row += tile.type;
        } else {
            row += ' ';
        }
    }
    console.log(row);
}

console.log(`\nGenerated dungeon with ${dungeon.rooms.length} rooms`);
console.log('Legend: # = wall, . = floor, + = closed door, / = open door\n');

// Show room information
console.log('Room details:');
dungeon.rooms.forEach((room, i) => {
    console.log(`  Room ${i+1}: (${room.x}, ${room.y}) - ${room.width}x${room.height}`);
});

// Count doors
let doorCount = 0;
for (let y = 0; y < dungeon.height; y++) {
    for (let x = 0; x < dungeon.width; x++) {
        const tile = dungeon.getTile(x, y);
        if (tile && tile.type === '+') {
            doorCount++;
        }
    }
}
console.log(`\nTotal doors: ${doorCount}`);

