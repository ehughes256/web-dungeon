class FloorTile {
    constructor(type) {
        this.type = type; // '#': wall, '.': floor, '+': door, '/': stair
        this.items = [];
        this.discovered = false;
    }

    isWalkable() {
        return this.type === '.' || this.type === '/' || this.type === '+';
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

    canDropHere(x, y, items) {
        if (!this.inBounds(x, y)) return false;
        const tile = this.getTile(x, y);
        if (!tile || !(tile.type === '.' || tile.type === '/' || tile.type === '<' || tile.type === '>')) return false;
        return !items.some(it => it.x === x && it.y === y);
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
        room = { x, y, width: w, height: h };
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
    return rooms.some(
      (room) =>
        newRoom.x < room.x + room.width + 1 &&
        newRoom.x + newRoom.width + 1 > room.x &&
        newRoom.y < room.y + room.height + 1 &&
        newRoom.y + newRoom.height + 1 > room.y
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

    let x = x1,
      y = y1;
    const path = [];

    // Move horizontally first
    const stepX = x2 > x1 ? 1 : -1;
    while (x !== x2) {
      x += stepX;
      path.push({
        x,
        y,
        in1: this.isInsideRoom(x, y, r1),
        in2: this.isInsideRoom(x, y, r2),
      });
    }

    // Then move vertically
    const stepY = y2 > y1 ? 1 : -1;
    while (y !== y2) {
      y += stepY;
      path.push({
        x,
        y,
        in1: this.isInsideRoom(x, y, r1),
        in2: this.isInsideRoom(x, y, r2),
      });
    }

    // Find door positions
    let door1 = null,
      door2 = null;
    for (let i = 1; i < path.length; i++) {
      const p = path[i - 1],
        c = path[i];
      if (p.in1 && !c.in1 && !door1) door1 = c;
      if (!p.in2 && c.in2 && !door2) door2 = p;
    }

    // Carve corridor
    path.forEach((c) => {
      const tile = dungeon.getTile(c.x, c.y);
      if (tile && tile.type === '#') {
        dungeon.setTileType(c.x, c.y, '.');
      }
    });

    // Place doors
    if (door1) {
      const tile1 = dungeon.getTile(door1.x, door1.y);
      if (tile1 && tile1.type === '.' && !this.doorAdjacent(door1.x, door1.y, dungeon)) {
        dungeon.setTileType(door1.x, door1.y, '+');
      }
    }
    if (door2) {
      const tile2 = dungeon.getTile(door2.x, door2.y);
      if (tile2 && tile2.type === '.' && !this.doorAdjacent(door2.x, door2.y, dungeon)) {
        dungeon.setTileType(door2.x, door2.y, '+');
      }
    }
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
  module.exports = { FloorTile, Dungeon, MazeGenerator };
}

