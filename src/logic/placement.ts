import { getTaneCells } from "./tane";
import {
  BOARD_COLS,
  BOARD_ROWS,
  type MinoType,
  PLAY_AREA_END,
  PLAY_AREA_START,
} from "./types";

/**
 * 各ミノの「盤面上部に表示される初期位置」のセル番号を返す。
 * 落下アニメーションの開始位置として利用する (row 0-1, col 3-6)。
 */
export function getInitialMinoCells(mino: MinoType): number[] {
  switch (mino) {
    case "i":
      return [3, 4, 5, 6];
    case "o":
      return [4, 5, 14, 15];
    case "j":
      return [3, 13, 14, 15];
    case "l":
      return [5, 13, 14, 15];
    case "s":
      return [4, 5, 13, 14];
    case "z":
      return [3, 4, 14, 15];
    case "t":
      return [4, 13, 14, 15];
  }
}

/**
 * 落下アニメーションの全フレームを計算する。
 *
 * 設計方針:
 * - 各ステップは「物理的に妥当な状態」でなければならない:
 *   1. ミノセル自身がタネと重なってはならない
 *   2. ミノの真下面 (各セルの直下のうち自分のセルでない位置) がタネと重なってはならない
 *      (= タネの上に「乗っかった」中間状態を生成しない)
 *   3. 列は PLAY_AREA 内
 * - まず最終形状 (= 回転後) を最上行から target まで 1 マスずつ下げる経路を試す。
 *   全ステップが物理的に妥当 → このパスを採用 (落下開始時点から最終回転)。
 * - 上記が成立しない場合 (T-spin 等) は、初期形状で落とせる所まで落とし、最終フレームで
 *   target にスナップ (回転して入る)。
 */
export function computeFallFrames(
  prevTane: number,
  initialCells: number[],
  targetCells: number[],
): number[][] {
  if (targetCells.length === 0) {
    return [initialCells];
  }

  const taneSet = new Set(getTaneCells(prevTane));

  const isCellsValid = (cells: number[]): boolean => {
    // 列範囲
    for (const c of cells) {
      const col = c % BOARD_COLS;
      if (col < PLAY_AREA_START || col > PLAY_AREA_END) return false;
    }
    // ミノとタネの直接衝突
    for (const c of cells) {
      if (taneSet.has(c)) return false;
    }
    return true;
  };

  /** ミノの直下面がタネで塞がれているか (= これ以上落とすとタネを貫通する) */
  const isLandedOnTane = (cells: number[]): boolean => {
    const cellsSet = new Set(cells);
    for (const c of cells) {
      const below = c + BOARD_COLS;
      if (cellsSet.has(below)) continue;
      if (taneSet.has(below)) return true;
    }
    return false;
  };

  const targetMinRow = Math.floor(Math.min(...targetCells) / BOARD_COLS);

  // 最終形状を上方 k マスシフト (k = targetMinRow が最上部) して 1 マスずつ降ろす
  const rotatedFrames: number[][] = [];
  let rotatedOk = true;
  for (let k = targetMinRow; k >= 0; k--) {
    const cells = targetCells.map((c) => c - k * BOARD_COLS);
    if (!isCellsValid(cells)) {
      rotatedOk = false;
      break;
    }
    rotatedFrames.push(cells);
    // 真下面チェック: target に到達する前 (k > 0) に「乗ってる」状態になったらアウト
    if (k > 0 && isLandedOnTane(cells)) {
      rotatedOk = false;
      break;
    }
  }

  if (rotatedOk && rotatedFrames.length > 0) {
    return rotatedFrames;
  }

  // フォールバック: 初期形状で物理的に落とせる所まで落下 → 最終フレームで target にスナップ
  const initialMinRow =
    initialCells.length > 0
      ? Math.floor(Math.min(...initialCells) / BOARD_COLS)
      : 0;
  const maxFallSteps = Math.max(targetMinRow - initialMinRow, 0);

  const fallback: number[][] = [];
  for (let s = 0; s <= maxFallSteps; s++) {
    const cells = initialCells.map((c) => c + s * BOARD_COLS);
    if (!isCellsValid(cells)) break;
    fallback.push(cells);
    // 次のステップでタネに衝突 / または乗ってる状態 → ここで止める
    if (s < maxFallSteps && isLandedOnTane(cells)) break;
  }

  // 最終フレームで target にスナップ (回転して入る)
  if (
    fallback.length === 0 ||
    !arraysEqualAsSet(fallback[fallback.length - 1], targetCells)
  ) {
    fallback.push(targetCells);
  }
  return fallback;
}

function arraysEqualAsSet(a: number[], b: number[]): boolean {
  if (a.length !== b.length) return false;
  const setA = new Set(a);
  for (const v of b) if (!setA.has(v)) return false;
  return true;
}

/**
 * 各ミノの全回転パターン（bounding box 左上原点）。
 * セルは [row, col] のペア（左上が (0, 0)）。
 */
const MINO_ROTATIONS: Record<MinoType, [number, number][][]> = {
  i: [
    [
      [0, 0],
      [0, 1],
      [0, 2],
      [0, 3],
    ],
    [
      [0, 0],
      [1, 0],
      [2, 0],
      [3, 0],
    ],
  ],
  o: [
    [
      [0, 0],
      [0, 1],
      [1, 0],
      [1, 1],
    ],
  ],
  j: [
    [
      [0, 0],
      [1, 0],
      [1, 1],
      [1, 2],
    ],
    [
      [0, 0],
      [0, 1],
      [1, 0],
      [2, 0],
    ],
    [
      [0, 0],
      [0, 1],
      [0, 2],
      [1, 2],
    ],
    [
      [0, 1],
      [1, 1],
      [2, 0],
      [2, 1],
    ],
  ],
  l: [
    [
      [0, 2],
      [1, 0],
      [1, 1],
      [1, 2],
    ],
    [
      [0, 0],
      [1, 0],
      [2, 0],
      [2, 1],
    ],
    [
      [0, 0],
      [0, 1],
      [0, 2],
      [1, 0],
    ],
    [
      [0, 0],
      [0, 1],
      [1, 1],
      [2, 1],
    ],
  ],
  s: [
    [
      [0, 1],
      [0, 2],
      [1, 0],
      [1, 1],
    ],
    [
      [0, 0],
      [1, 0],
      [1, 1],
      [2, 1],
    ],
  ],
  z: [
    [
      [0, 0],
      [0, 1],
      [1, 1],
      [1, 2],
    ],
    [
      [0, 1],
      [1, 0],
      [1, 1],
      [2, 0],
    ],
  ],
  t: [
    [
      [0, 0],
      [0, 1],
      [0, 2],
      [1, 1],
    ],
    [
      [0, 1],
      [1, 0],
      [1, 1],
      [2, 1],
    ],
    [
      [0, 1],
      [1, 0],
      [1, 1],
      [1, 2],
    ],
    [
      [0, 0],
      [1, 0],
      [1, 1],
      [2, 0],
    ],
  ],
};

const PLAY_COLS: number[] = [];
for (let c = PLAY_AREA_START; c <= PLAY_AREA_END; c++) PLAY_COLS.push(c);

/**
 * プレイエリアと壁エリアを表現する盤面を構築する。
 * 壁列（col 0..2 と 7..9）は便宜上 1 として扱い、ミノ配置の判定を簡単にする。
 */
function buildBoard(currentCells: ReadonlySet<number>): Uint8Array {
  const board = new Uint8Array(BOARD_ROWS * BOARD_COLS);
  for (let r = 0; r < BOARD_ROWS; r++) {
    for (let c = 0; c < BOARD_COLS; c++) {
      const isWall = c < PLAY_AREA_START || c > PLAY_AREA_END;
      board[r * BOARD_COLS + c] = isWall ? 1 : 0;
    }
  }
  for (const cell of currentCells) board[cell] = 1;
  return board;
}

interface PlacementCandidate {
  cells: number[];
  clearedRows: number[];
  postClearCells: Set<number>;
}

function fits(
  board: Uint8Array,
  shape: ReadonlyArray<readonly [number, number]>,
  anchorRow: number,
  anchorCol: number,
): boolean {
  for (const [dr, dc] of shape) {
    const r = anchorRow + dr;
    const c = anchorCol + dc;
    if (r < 0 || r >= BOARD_ROWS || c < 0 || c >= BOARD_COLS) return false;
    if (board[r * BOARD_COLS + c]) return false;
  }
  return true;
}

function computePostClear(
  preClear: ReadonlySet<number>,
  clearedRows: number[],
): Set<number> {
  if (clearedRows.length === 0) return new Set(preClear);
  const sorted = [...clearedRows].sort((a, b) => a - b);
  const result = new Set<number>();
  for (const cell of preClear) {
    const r = Math.floor(cell / 10);
    const c = cell % 10;
    if (sorted.includes(r)) continue;
    const shift = sorted.filter((cr) => cr > r).length;
    result.add((r + shift) * 10 + c);
  }
  return result;
}

function enumeratePlacements(
  mino: MinoType,
  currentCells: ReadonlySet<number>,
): PlacementCandidate[] {
  const board = buildBoard(currentCells);
  const candidates: PlacementCandidate[] = [];

  for (const rotation of MINO_ROTATIONS[mino]) {
    const minCol = Math.min(...rotation.map(([, c]) => c));
    const maxCol = Math.max(...rotation.map(([, c]) => c));
    for (
      let anchorCol = -minCol;
      anchorCol + maxCol < BOARD_COLS;
      anchorCol++
    ) {
      // サポートされた全ての位置を列挙（重力ドロップ + タック）
      for (let anchorRow = 0; anchorRow < BOARD_ROWS; anchorRow++) {
        if (!fits(board, rotation, anchorRow, anchorCol)) continue;
        if (fits(board, rotation, anchorRow + 1, anchorCol)) continue;

        const placed = rotation.map(
          ([dr, dc]) => (anchorRow + dr) * BOARD_COLS + (anchorCol + dc),
        );

        const merged = new Set<number>(currentCells);
        for (const cell of placed) merged.add(cell);

        const placedRows = new Set(placed.map((cell) => Math.floor(cell / 10)));
        const clearedRows: number[] = [];
        for (const r of placedRows) {
          let full = true;
          for (const c of PLAY_COLS) {
            if (!merged.has(r * 10 + c)) {
              full = false;
              break;
            }
          }
          if (full) clearedRows.push(r);
        }

        candidates.push({
          cells: placed,
          clearedRows,
          postClearCells: computePostClear(merged, clearedRows),
        });
      }
    }
  }

  return candidates;
}

function symmetricDiff(a: ReadonlySet<number>, b: ReadonlySet<number>): number {
  let diff = 0;
  for (const x of a) if (!b.has(x)) diff++;
  for (const x of b) if (!a.has(x)) diff++;
  return diff;
}

/**
 * 配置されるミノ 4 セルの盤面座標を返す。
 *
 * 戦略:
 *   1. currentTane に対して、与えたミノの全配置候補を列挙する
 *   2. 1 行以上ライン消しを起こす配置のみ抽出
 *   3. 配置後タネが nextTane と一致するものを最優先で返す
 *   4. 一致するものが無い場合（choicedb が壊れているケース）でも、
 *      ライン消しを起こす配置のうち最も nextTane に近いものを返す
 *      （視覚的に妥当な「実際に置かれるであろう」ミノを描画するため）
 *   5. それすら無ければ空セット
 */
export function computePlacedMinoCells(
  mino: MinoType,
  currentTane: number,
  nextTane: number,
): Set<number> {
  const currentCells = new Set(getTaneCells(currentTane));
  const candidates = enumeratePlacements(mino, currentCells);
  const nextCells = new Set(getTaneCells(nextTane));

  const clearing = candidates.filter((c) => c.clearedRows.length > 0);

  for (const cand of clearing) {
    if (
      cand.postClearCells.size === nextCells.size &&
      [...cand.postClearCells].every((cell) => nextCells.has(cell))
    ) {
      return new Set(cand.cells);
    }
  }

  if (clearing.length > 0) {
    let best = clearing[0];
    let bestScore = symmetricDiff(best.postClearCells, nextCells);
    for (const cand of clearing) {
      const score = symmetricDiff(cand.postClearCells, nextCells);
      if (score < bestScore) {
        best = cand;
        bestScore = score;
      }
    }
    return new Set(best.cells);
  }

  return new Set<number>();
}

/**
 * 複数の nextTane 候補に対して、それぞれにユニークな配置を割り当てる。
 *
 * choicedb の一部エントリは元データの不整合により厳密一致できないが、
 * その場合でも候補同士で同じ配置を返してしまうと UI 上で重複表示になる。
 * 本関数では:
 *   1. 厳密一致する nextTane に対しては該当配置を割り当て
 *   2. 残りの nextTane に対しては、まだ使われていない配置のうち
 *      symmetricDiff が最小のものを greedy に割り当てる
 */
export function computePlacedMinoCellsForChoices(
  mino: MinoType,
  currentTane: number,
  nextTanes: ReadonlyArray<number>,
): Map<number, Set<number>> {
  const currentCells = new Set(getTaneCells(currentTane));
  const candidates = enumeratePlacements(mino, currentCells).filter(
    (c) => c.clearedRows.length > 0,
  );
  const result = new Map<number, Set<number>>();
  const usedKeys = new Set<string>();

  const cellsKey = (cells: ReadonlyArray<number>) =>
    [...cells].sort((a, b) => a - b).join(",");

  const remaining: number[] = [];

  // 1) 厳密一致を優先割り当て
  for (const nt of nextTanes) {
    const nextCells = new Set(getTaneCells(nt));
    let assigned = false;
    for (const cand of candidates) {
      const k = cellsKey(cand.cells);
      if (usedKeys.has(k)) continue;
      if (
        cand.postClearCells.size === nextCells.size &&
        [...cand.postClearCells].every((cell) => nextCells.has(cell))
      ) {
        result.set(nt, new Set(cand.cells));
        usedKeys.add(k);
        assigned = true;
        break;
      }
    }
    if (!assigned) remaining.push(nt);
  }

  // 2) 残りは未使用配置から最近接を greedy に
  for (const nt of remaining) {
    const nextCells = new Set(getTaneCells(nt));
    let best: PlacementCandidate | null = null;
    let bestScore = Number.POSITIVE_INFINITY;
    for (const cand of candidates) {
      const k = cellsKey(cand.cells);
      if (usedKeys.has(k)) continue;
      const score = symmetricDiff(cand.postClearCells, nextCells);
      if (score < bestScore) {
        best = cand;
        bestScore = score;
      }
    }
    if (best) {
      result.set(nt, new Set(best.cells));
      usedKeys.add(cellsKey(best.cells));
    } else {
      result.set(nt, new Set<number>());
    }
  }

  return result;
}
