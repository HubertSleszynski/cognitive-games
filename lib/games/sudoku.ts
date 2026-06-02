export type Difficulty = 1 | 2 | 3; 

export type SudokuPuzzle = {
  puzzle: number[];   
  solution: number[];
};

const SIZE = 9;
const CELLS = 81;

function idx(r: number, c: number) {
  return r * SIZE + c;
}

function clone(a: number[]) {
  return a.slice();
}

function shuffle<T>(arr: T[]) {
  const a = [...arr];
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [a[i], a[j]] = [a[j], a[i]];
  }
  return a;
}

function rowOf(i: number) {
  return Math.floor(i / SIZE);
}
function colOf(i: number) {
  return i % SIZE;
}
function boxOf(r: number, c: number) {
  return Math.floor(r / 3) * 3 + Math.floor(c / 3);
}

function isValidPlacement(grid: number[], pos: number, val: number) {
  const r = rowOf(pos);
  const c = colOf(pos);

  for (let cc = 0; cc < 9; cc++) {
    if (grid[idx(r, cc)] === val) return false;
  }

  for (let rr = 0; rr < 9; rr++) {
    if (grid[idx(rr, c)] === val) return false;
  }

  const br = Math.floor(r / 3) * 3;
  const bc = Math.floor(c / 3) * 3;
  for (let rr = br; rr < br + 3; rr++) {
    for (let cc = bc; cc < bc + 3; cc++) {
      if (grid[idx(rr, cc)] === val) return false;
    }
  }
  return true;
}
function candidates(grid: number[], pos: number): number[] {
  if (grid[pos] !== 0) return [];
  const opts: number[] = [];
  for (let v = 1; v <= 9; v++) {
    if (isValidPlacement(grid, pos, v)) opts.push(v);
  }
  return opts;
}

function findEmptyMRV(grid: number[]) {
  let bestPos = -1;
  let bestOpts: number[] | null = null;

  for (let i = 0; i < CELLS; i++) {
    if (grid[i] !== 0) continue;

    const opts = candidates(grid, i);
    if (opts.length === 0) return { pos: i, opts: [] };

    if (!bestOpts || opts.length < bestOpts.length) {
      bestOpts = opts;
      bestPos = i;
      if (bestOpts.length === 1) break;
    }
  }

  return { pos: bestPos, opts: bestOpts ?? [] };
}


function findEmpty(grid: number[]) {
  for (let i = 0; i < CELLS; i++) if (grid[i] === 0) return i;
  return -1;
}


function solveBacktracking(grid: number[]) {
  const { pos, opts } = findEmptyMRV(grid);
  if (pos === -1) return true;
  if (opts.length === 0) return false; 

  const nums = shuffle(opts);
  for (const v of nums) {
    grid[pos] = v;
    if (solveBacktracking(grid)) return true;
    grid[pos] = 0;
  }
  return false;
}



function countSolutions(grid: number[], limit: number): number {
  const { pos, opts } = findEmptyMRV(grid);
  if (pos === -1) return 1;
  if (opts.length === 0) return 0; 

  let count = 0;
  for (const v of opts) {
    grid[pos] = v;
    count += countSolutions(grid, limit);
    grid[pos] = 0;
    if (count >= limit) return count;
  }
  return count;
}


function generateFullSolution(): number[] {
  const grid = Array(CELLS).fill(0);
  for (let b = 0; b < 3; b++) {
    const start = b * 3;
    const nums = shuffle([1, 2, 3, 4, 5, 6, 7, 8, 9]);
    let k = 0;
    for (let r = start; r < start + 3; r++) {
      for (let c = start; c < start + 3; c++) {
        grid[idx(r, c)] = nums[k++];
      }
    }
  }
  const ok = solveBacktracking(grid);
  if (!ok) throw new Error("Nie udało się wygenerować rozwiązania Sudoku");
  return grid;
}

function targetClues(difficulty: Difficulty) {
  if (difficulty === 1) return 40; 
  if (difficulty === 2) return 32;
  return 26; 
}

export function generateSudoku(difficulty: Difficulty): SudokuPuzzle {
  const solution = generateFullSolution();
  let puzzle = clone(solution);

  const clues = targetClues(difficulty);
  let cellsToRemove = CELLS - clues;

  const positions = shuffle(Array.from({ length: CELLS }, (_, i) => i));

  for (const pos of positions) {
    if (cellsToRemove <= 0) break;

    const backup = puzzle[pos];
    puzzle[pos] = 0;

    const test = clone(puzzle);
    const solutions = countSolutions(test, 2);

    if (solutions !== 1) {
      puzzle[pos] = backup;
    } else {
      cellsToRemove--;
    }
  }

  return { puzzle, solution };
}

export function isSolvedCorrectly(board: number[], solution: number[]) {
  if (board.length !== 81 || solution.length !== 81) return false;
  for (let i = 0; i < 81; i++) {
    if (board[i] !== solution[i]) return false;
  }
  return true;
}

export function validateCell(board: number[], pos: number, val: number) {
  if (val === 0) return true;
  const copy = clone(board);
  copy[pos] = 0;
  return isValidPlacement(copy, pos, val);
}
