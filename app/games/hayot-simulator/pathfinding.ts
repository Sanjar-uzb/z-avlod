export type Point = {
  x: number;
  y: number;
};

export type Rect = {
  x: number;
  y: number;
  width: number;
  height: number;
};

export const WORLD_WIDTH = 1800;
export const WORLD_HEIGHT = 1200;
export const PLAYER_RADIUS = 15;
export const GRID_SIZE = 25;
export const COLS = Math.ceil(WORLD_WIDTH / GRID_SIZE); // 72
export const ROWS = Math.ceil(WORLD_HEIGHT / GRID_SIZE); // 48

export function isPointWalkable(
  x: number,
  y: number,
  obstacles: Rect[],
  padding = 19
): boolean {
  if (
    x < padding ||
    x > WORLD_WIDTH - padding ||
    y < padding ||
    y > WORLD_HEIGHT - padding
  ) {
    return false;
  }
  for (const obs of obstacles) {
    if (
      x >= obs.x - padding &&
      x <= obs.x + obs.width + padding &&
      y >= obs.y - padding &&
      y <= obs.y + obs.height + padding
    ) {
      return false;
    }
  }
  return true;
}

export function hasLineOfSight(
  p1: Point,
  p2: Point,
  obstacles: Rect[],
  padding = 19
): boolean {
  const dist = Math.hypot(p2.x - p1.x, p2.y - p1.y);
  if (dist <= 2) return true;
  const steps = Math.ceil(dist / 12);
  for (let i = 1; i <= steps; i++) {
    const t = i / steps;
    const x = p1.x + (p2.x - p1.x) * t;
    const y = p1.y + (p2.y - p1.y) * t;
    if (!isPointWalkable(x, y, obstacles, padding)) {
      return false;
    }
  }
  return true;
}

export function smoothPath(rawPath: Point[], obstacles: Rect[]): Point[] {
  if (rawPath.length <= 2) return rawPath;
  const smoothed: Point[] = [rawPath[0]];
  let currentIdx = 0;

  while (currentIdx < rawPath.length - 1) {
    let furthestIdx = currentIdx + 1;
    for (let i = rawPath.length - 1; i > currentIdx; i--) {
      if (hasLineOfSight(rawPath[currentIdx], rawPath[i], obstacles)) {
        furthestIdx = i;
        break;
      }
    }
    smoothed.push(rawPath[furthestIdx]);
    currentIdx = furthestIdx;
  }

  return smoothed;
}

export function findStandSpotNearNpc(
  playerPos: Point,
  npcPos: Point,
  obstacles: Rect[],
  desiredDistance = 50
): Point {
  const candidateOffsets: Point[] = [
    { x: 0, y: desiredDistance },
    { x: -desiredDistance, y: 0 },
    { x: desiredDistance, y: 0 },
    { x: 0, y: -desiredDistance },
    { x: -desiredDistance * 0.7, y: desiredDistance * 0.7 },
    { x: desiredDistance * 0.7, y: desiredDistance * 0.7 },
    { x: -desiredDistance * 0.7, y: -desiredDistance * 0.7 },
    { x: desiredDistance * 0.7, y: -desiredDistance * 0.7 },
  ];

  const walkableSpots: Point[] = [];
  for (const offset of candidateOffsets) {
    const spotX = Math.round(npcPos.x + offset.x);
    const spotY = Math.round(npcPos.y + offset.y);
    if (isPointWalkable(spotX, spotY, obstacles)) {
      walkableSpots.push({ x: spotX, y: spotY });
    }
  }

  if (walkableSpots.length > 0) {
    walkableSpots.sort(
      (a, b) =>
        Math.hypot(a.x - playerPos.x, a.y - playerPos.y) -
        Math.hypot(b.x - playerPos.x, b.y - playerPos.y)
    );
    return walkableSpots[0];
  }

  return { x: npcPos.x, y: npcPos.y + desiredDistance };
}

export class GridPathfinder {
  private grid: Uint8Array;
  private obstacles: Rect[];

  constructor(obstacles: Rect[]) {
    this.obstacles = obstacles;
    this.grid = new Uint8Array(COLS * ROWS);
    this.buildGrid();
  }

  private buildGrid() {
    for (let r = 0; r < ROWS; r++) {
      for (let c = 0; c < COLS; c++) {
        const cx = c * GRID_SIZE + GRID_SIZE / 2;
        const cy = r * GRID_SIZE + GRID_SIZE / 2;
        const half = GRID_SIZE * 0.42;

        const walkable =
          isPointWalkable(cx, cy, this.obstacles) &&
          isPointWalkable(cx - half, cy - half, this.obstacles) &&
          isPointWalkable(cx + half, cy - half, this.obstacles) &&
          isPointWalkable(cx - half, cy + half, this.obstacles) &&
          isPointWalkable(cx + half, cy + half, this.obstacles);

        this.grid[r * COLS + c] = walkable ? 1 : 0;
      }
    }
  }

  private isCellWalkable(c: number, r: number): boolean {
    if (c < 0 || c >= COLS || r < 0 || r >= ROWS) return false;
    return this.grid[r * COLS + c] === 1;
  }

  public findPath(start: Point, target: Point): Point[] | null {
    if (hasLineOfSight(start, target, this.obstacles)) {
      return [target];
    }

    const startCol = Math.max(0, Math.min(COLS - 1, Math.floor(start.x / GRID_SIZE)));
    const startRow = Math.max(0, Math.min(ROWS - 1, Math.floor(start.y / GRID_SIZE)));
    const targetCol = Math.max(0, Math.min(COLS - 1, Math.floor(target.x / GRID_SIZE)));
    const targetRow = Math.max(0, Math.min(ROWS - 1, Math.floor(target.y / GRID_SIZE)));

    const startNode = startRow * COLS + startCol;
    const targetNode = targetRow * COLS + targetCol;

    if (startNode === targetNode) {
      return [target];
    }

    const totalCells = COLS * ROWS;
    const gScore = new Float32Array(totalCells).fill(Infinity);
    const fScore = new Float32Array(totalCells).fill(Infinity);
    const cameFrom = new Int32Array(totalCells).fill(-1);
    const inOpenSet = new Uint8Array(totalCells);
    const closedSet = new Uint8Array(totalCells);

    gScore[startNode] = 0;
    fScore[startNode] = Math.hypot(targetCol - startCol, targetRow - startRow);

    const openSet: number[] = [startNode];
    inOpenSet[startNode] = 1;

    let iterations = 0;
    const MAX_ITERATIONS = 3200;

    const dxs = [0, 1, 0, -1, 1, 1, -1, -1];
    const dys = [-1, 0, 1, 0, -1, 1, 1, -1];
    const costs = [1, 1, 1, 1, 1.414, 1.414, 1.414, 1.414];

    while (openSet.length > 0 && iterations < MAX_ITERATIONS) {
      iterations++;

      let bestIdx = 0;
      let lowestF = fScore[openSet[0]];
      for (let i = 1; i < openSet.length; i++) {
        if (fScore[openSet[i]] < lowestF) {
          lowestF = fScore[openSet[i]];
          bestIdx = i;
        }
      }

      const current = openSet[bestIdx];

      if (current === targetNode) {
        const rawPoints: Point[] = [target];
        let curr = current;
        while (curr !== startNode && curr !== -1) {
          const r = Math.floor(curr / COLS);
          const c = curr % COLS;
          rawPoints.unshift({
            x: c * GRID_SIZE + GRID_SIZE / 2,
            y: r * GRID_SIZE + GRID_SIZE / 2,
          });
          curr = cameFrom[curr];
        }
        return smoothPath(rawPoints, this.obstacles);
      }

      openSet.splice(bestIdx, 1);
      inOpenSet[current] = 0;
      closedSet[current] = 1;

      const curRow = Math.floor(current / COLS);
      const curCol = current % COLS;

      for (let d = 0; d < 8; d++) {
        const nCol = curCol + dxs[d];
        const nRow = curRow + dys[d];

        if (nCol < 0 || nCol >= COLS || nRow < 0 || nRow >= ROWS) continue;

        const neighbor = nRow * COLS + nCol;
        if (closedSet[neighbor]) continue;

        if (!this.isCellWalkable(nCol, nRow)) {
          if (neighbor !== targetNode) continue;
        }

        // Prevent diagonal movement cutting across corners
        if (d >= 4) {
          if (!this.isCellWalkable(curCol + dxs[d], curRow) || !this.isCellWalkable(curCol, curRow + dys[d])) {
            continue;
          }
        }

        const tentativeG = gScore[current] + costs[d];

        if (tentativeG < gScore[neighbor]) {
          cameFrom[neighbor] = current;
          gScore[neighbor] = tentativeG;
          fScore[neighbor] = tentativeG + Math.hypot(targetCol - nCol, targetRow - nRow);

          if (!inOpenSet[neighbor]) {
            openSet.push(neighbor);
            inOpenSet[neighbor] = 1;
          }
        }
      }
    }

    return null;
  }
}
