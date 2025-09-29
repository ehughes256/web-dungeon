class MazeGenerator {
  constructor(width, height) {
    this.width = width;
    this.height = height;
  }

  generateDungeon() {
    const dungeon = Array(this.height)
      .fill()
      .map(() => Array(this.width).fill('#'));
    const rooms = [];

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
      } while (this.roomOverlaps(room, rooms) && attempts < maxAttempts);

      if (attempts < maxAttempts) {
        rooms.push(room);
        this.carveRoom(room, dungeon);
      }
    }

    // Connect rooms with corridors
    for (let i = 0; i < rooms.length - 1; i++) {
      this.connectRooms(rooms[i], rooms[i + 1], dungeon, rooms);
    }

    // Place stairs
    const stairs = this.placeStairs(rooms);

    return {
      dungeon,
      rooms,
      upStair: stairs.upStair,
      downStair: stairs.downStair,
    };
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
        dungeon[y][x] = '.';
      }
    }
  }

  isInsideRoom(x, y, room) {
    return x >= room.x && x < room.x + room.width && y >= room.y && y < room.y + room.height;
  }

  connectRooms(r1, r2, dungeon, rooms) {
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
      if (dungeon[c.y][c.x] === '#') {
        dungeon[c.y][c.x] = '.';
      }
    });

    // Place doors
    if (door1 && dungeon[door1.y][door1.x] === '.' && !this.doorAdjacent(door1.x, door1.y, dungeon)) {
      dungeon[door1.y][door1.x] = '+';
    }
    if (door2 && dungeon[door2.y][door2.x] === '.' && !this.doorAdjacent(door2.x, door2.y, dungeon)) {
      dungeon[door2.y][door2.x] = '+';
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
      if (nx < 0 || ny < 0 || nx >= this.width || ny >= this.height) continue;
      const t = dungeon[ny][nx];
      if (t === '+' || t === '/') return true;
    }
    return false;
  }

  placeStairs(rooms) {
    if (rooms.length < 2) {
      return { upStair: null, downStair: null };
    }

    // Place up stair
    const upRoom = rooms[Math.floor(Math.random() * rooms.length)];
    const upStair = {
      x: upRoom.x + Math.floor(Math.random() * upRoom.width),
      y: upRoom.y + Math.floor(Math.random() * upRoom.height),
    };

    // Place down stair in different room
    let downRoom;
    do {
      downRoom = rooms[Math.floor(Math.random() * rooms.length)];
    } while (downRoom === upRoom && rooms.length > 1);

    const downStair = {
      x: downRoom.x + Math.floor(Math.random() * downRoom.width),
      y: downRoom.y + Math.floor(Math.random() * downRoom.height),
    };

    return { upStair, downStair };
  }
}
