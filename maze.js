class FloorTile {
    constructor(type) {
        this.type = type; // '#': wall, '.': floor, '+': door, '/': stair
        this.items = [];
        this.trap = null;
        this.discovered = false;
    }

    isWalkable() {
        return this.type === '.' || this.type === '/' || this.type === '+';
    }

    addItem(item) {
        this.items.push(item);
    }

    removeItem(item) {
        const index = this.items.indexOf(item);
        if (index !== -1) {
            this.items.splice(index, 1);
            return true;
        }
        return false;
    }

    hasItems() {
        return this.items.length > 0;
    }

    getTopItem() {
        return this.items.length > 0 ? this.items[this.items.length - 1] : null;
    }

    clearItems() {
        this.items = [];
    }
}

class Dungeon {
    constructor(width, height) {
        this.width = width;
        this.height = height;
        this.tiles = Array(height)
            .fill()
            .map(() => Array(width).fill(null).map(() => new FloorTile('#')));
        this.rooms = [];
        this.upStair = null;
        this.downStair = null;
    }

    getTile(x, y) {
        if (!this.inBounds(x, y)) return null;
        return this.tiles[y][x];
    }

    setTileType(x, y, type) {
        if (!this.inBounds(x, y)) return;
        this.tiles[y][x].type = type;
    }

    inBounds(x, y) {
        return x >= 0 && y >= 0 && x < this.width && y < this.height;
    }

    isOpaque(x, y) {
        const tile = this.getTile(x, y);
        return !tile || tile.type === '#' || tile.type === '+';
    }

    isWalkable(x, y) {
        const tile = this.getTile(x, y);
        return tile && tile.isWalkable();
    }

    getWalkableDirections(x, y) {
        const directions = [
            {dx: 0, dy: -1}, // Up
            {dx: 0, dy: 1},  // Down
            {dx: -1, dy: 0}, // Left
            {dx: 1, dy: 0},  // Right
        ];

        return directions.filter(dir => {
            const newX = x + dir.dx;
            const newY = y + dir.dy;
            const tile = this.getTile(newX, newY);
            return tile && tile.type !== '#' && tile.type !== '+';
        });
    }

    openAdjacentDoors(playerX, playerY) {
        let opened = 0;
        const dirs = [[1, 0], [-1, 0], [0, 1], [0, -1], [1, 1], [1, -1], [-1, 1], [-1, -1]];
        for (const [dx, dy] of dirs) {
            const x = playerX + dx, y = playerY + dy;
            if (!this.inBounds(x, y)) continue;
            const tile = this.getTile(x, y);
            if (tile && tile.type === '+') {
                this.setTileType(x, y, '/');
                opened++;
            }
        }
        return opened;
    }

    closeAdjacentDoors(playerX, playerY) {
        let closed = 0;
        const dirs = [[1, 0], [-1, 0], [0, 1], [0, -1], [1, 1], [1, -1], [-1, 1], [-1, -1]];
        for (const [dx, dy] of dirs) {
            const x = playerX + dx, y = playerY + dy;
            if (!this.inBounds(x, y)) continue;
            const tile = this.getTile(x, y);
            if (tile && tile.type === '/') {
                this.setTileType(x, y, '+');
                closed++;
            }
        }
        return closed;
    }

    getTileDescription(x, y) {
        const tile = this.getTile(x, y);
        if (!tile) {
            return 'The void stares back.';
        }
        switch (tile.type) {
            case '#':
                return 'A rough-hewn stone wall—unyielding.';
            case '.':
                return 'Open dungeon floor, strewn with dust and echoes.';
            case '+':
                return 'A closed wooden door; hinges creak with potential.';
            case '/':
                return 'An open doorway leading into shadow.';
            case '<':
                return 'A stairwell spiraling upward.';
            case '>':
                return 'Steps descending into deeper peril.';
            default:
                return 'Featureless dark.';
        }
    }

    isValidMove(x, y) {
        if (!this.inBounds(x, y)) return false;
        const tile = this.getTile(x, y);
        return tile && (tile.type === '.' || tile.type === '/' || tile.type === '<' || tile.type === '>');
    }

    canDropHere(x, y) {
        if (!this.inBounds(x, y)) return false;
        const tile = this.getTile(x, y);
        // Allow dropping items on walkable tiles (multiple items can be on same tile now)
        return tile && (tile.type === '.' || tile.type === '/' || tile.type === '<' || tile.type === '>');
    }
}

class MazeGenerator {
    constructor(width, height) {
        this.width = width;
        this.height = height;
    }

    generateDungeon() {
        const dungeon = new Dungeon(this.width, this.height);
        const numRooms = Math.floor(Math.random() * 8) + 6;
        const maxAttempts = 50;

        // Generate rooms
        for (let i = 0; i < numRooms; i++) {
            let attempts = 0,
                room;
            do {
                const w = Math.floor(Math.random() * 8) + 4;
                const h = Math.floor(Math.random() * 6) + 4;
                const x = Math.floor(Math.random() * (this.width - w - 2)) + 1;
                const y = Math.floor(Math.random() * (this.height - h - 2)) + 1;
                room = {x, y, width: w, height: h};
                attempts++;
            } while (this.roomOverlaps(room, dungeon.rooms) && attempts < maxAttempts);

            if (attempts < maxAttempts) {
                dungeon.rooms.push(room);
                this.carveRoom(room, dungeon);
            }
        }

        // Connect rooms with corridors
        for (let i = 0; i < dungeon.rooms.length - 1; i++) {
            this.connectRooms(dungeon.rooms[i], dungeon.rooms[i + 1], dungeon);
        }

        // Place stairs
        this.placeStairs(dungeon);

        return dungeon;
    }

    roomOverlaps(newRoom, rooms) {
        // Check if rooms overlap or are too close (need at least 2 tiles separation for corridors)
        return rooms.some(
            (room) =>
                newRoom.x < room.x + room.width + 2 &&
                newRoom.x + newRoom.width + 2 > room.x &&
                newRoom.y < room.y + room.height + 2 &&
                newRoom.y + newRoom.height + 2 > room.y
        );
    }

    carveRoom(room, dungeon) {
        for (let y = room.y; y < room.y + room.height; y++) {
            for (let x = room.x; x < room.x + room.width; x++) {
                dungeon.setTileType(x, y, '.');
            }
        }
    }

    isInsideRoom(x, y, room) {
        return x >= room.x && x < room.x + room.width && y >= room.y && y < room.y + room.height;
    }

    connectRooms(r1, r2, dungeon) {
        const x1 = r1.x + Math.floor(r1.width / 2);
        const y1 = r1.y + Math.floor(r1.height / 2);
        const x2 = r2.x + Math.floor(r2.width / 2);
        const y2 = r2.y + Math.floor(r2.height / 2);

        let x = x1;
        let y = y1;
        const path = [];

        // Start from room 1 center
        path.push({x, y});

        // Move horizontally first
        const stepX = x2 > x1 ? 1 : -1;
        while (x !== x2) {
            x += stepX;
            path.push({x, y});
        }

        // Then move vertically
        const stepY = y2 > y1 ? 1 : -1;
        while (y !== y2) {
            y += stepY;
            path.push({x, y});
        }

        // Track door positions
        const doorPositions = [];

        // Carve corridor and identify door positions at room boundaries
        for (let i = 0; i < path.length; i++) {
            const curr = path[i];
            const prev = i > 0 ? path[i - 1] : null;

            const currInR1 = this.isInsideRoom(curr.x, curr.y, r1);
            const currInR2 = this.isInsideRoom(curr.x, curr.y, r2);
            const prevInR1 = prev ? this.isInsideRoom(prev.x, prev.y, r1) : false;
            const prevInR2 = prev ? this.isInsideRoom(prev.x, prev.y, r2) : false;

            const tile = dungeon.getTile(curr.x, curr.y);
            if (!tile) continue;

            // Carve floor if it's a wall
            if (tile.type === '#') {
                dungeon.setTileType(curr.x, curr.y, '.');
            }

            // Detect transition from room to corridor (door location)
            if (prev) {
                // Exiting room 1
                if (prevInR1 && !currInR1 && !currInR2) {
                    doorPositions.push({x: curr.x, y: curr.y, room: 1});
                }
                // Entering room 2
                if (!prevInR1 && !prevInR2 && currInR2) {
                    doorPositions.push({x: curr.x, y: curr.y, room: 2});
                }
            }
        }

        // Place doors at detected positions
        for (const doorPos of doorPositions) {
            const tile = dungeon.getTile(doorPos.x, doorPos.y);
            if (tile && tile.type === '.' && !this.doorAdjacent(doorPos.x, doorPos.y, dungeon)) {
                // Verify this is a proper doorway (has walls on perpendicular sides)
                if (this.isValidDoorPosition(doorPos.x, doorPos.y, dungeon)) {
                    dungeon.setTileType(doorPos.x, doorPos.y, '+');
                }
            }
        }
    }

    isValidDoorPosition(x, y, dungeon) {
        // A door should have walls or nothing on at least 2 perpendicular sides
        // This prevents doors in the middle of corridors
        const north = dungeon.getTile(x, y - 1);
        const south = dungeon.getTile(x, y + 1);
        const west = dungeon.getTile(x - 1, y);
        const east = dungeon.getTile(x + 1, y);

        const verticalWalls = (!north || north.type === '#') && (!south || south.type === '#');
        const horizontalWalls = (!west || west.type === '#') && (!east || east.type === '#');

        // Door should span either horizontally or vertically between walls
        return verticalWalls || horizontalWalls;
    }

    doorAdjacent(x, y, dungeon) {
        const dirs = [
            [1, 0],
            [-1, 0],
            [0, 1],
            [0, -1],
        ];
        for (const [dx, dy] of dirs) {
            const nx = x + dx,
                ny = y + dy;
            if (!dungeon.inBounds(nx, ny)) continue;
            const tile = dungeon.getTile(nx, ny);
            if (tile && (tile.type === '+' || tile.type === '/')) return true;
        }
        return false;
    }

    placeStairs(dungeon) {
        if (dungeon.rooms.length < 2) {
            return;
        }

        // Place up stair
        const upRoom = dungeon.rooms[Math.floor(Math.random() * dungeon.rooms.length)];
        dungeon.upStair = {
            x: upRoom.x + Math.floor(Math.random() * upRoom.width),
            y: upRoom.y + Math.floor(Math.random() * upRoom.height),
        };

        // Place down stair in different room
        let downRoom;
        do {
            downRoom = dungeon.rooms[Math.floor(Math.random() * dungeon.rooms.length)];
        } while (downRoom === upRoom && dungeon.rooms.length > 1);

        dungeon.downStair = {
            x: downRoom.x + Math.floor(Math.random() * downRoom.width),
            y: downRoom.y + Math.floor(Math.random() * downRoom.height),
        };
    }
}

// Export for Node.js testing
if (typeof module !== 'undefined' && module.exports) {
    module.exports = {FloorTile, Dungeon, MazeGenerator};
}

