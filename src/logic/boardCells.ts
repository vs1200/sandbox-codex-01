import {
  type AnimationState,
  BOARD_COLS,
  BOARD_ROWS,
  PLAY_AREA_END,
  PLAY_AREA_START,
} from "./types";

export interface BoardCellRender {
  color: string;
  animClass: string;
}

/**
 * アニメーションの現在ステップに対応する「描画すべきミノ 4 セル」を返す pure 関数。
 * - placing 中: frames[step] (範囲外は最終フレームに丸める)
 * - clearing 中: targetCells に固定
 * - animation なし: 空配列
 */
export function selectAnimationDrawCells(
  animation: AnimationState | null,
  fallStep: number,
): number[] {
  if (!animation) return [];
  if (animation.phase === "placing") {
    const frames = animation.frames;
    if (!frames || frames.length === 0) return animation.targetCells;
    const idx = Math.min(fallStep, frames.length - 1);
    return frames[idx];
  }
  return animation.targetCells;
}

export interface ComputeBoardCellsArgs {
  taneCells: number[];
  /** 上部に表示する現在ミノ (アニメ非表示時のみ) */
  minoCells: number[];
  minoColor: string | undefined;
  animation: AnimationState | null;
  /** アニメ中フレームで描画すべき 4 セル (selectAnimationDrawCells の結果) */
  animDrawCells: number[];
  animColor: string | undefined;
  /** placing の最終フレーム (= 着地後) か */
  isPlaceLanded: boolean;
}

/**
 * 盤面 (BOARD_ROWS × BOARD_COLS) の各セルの「色 / アニメ class」を算出する pure 関数。
 * 描画優先度:
 *   1. 壁エリア (PLAY_AREA 外) → wall 色
 *   2. アニメーション非表示時の上部ミノ → ミノ色
 *   3. タネパターン → wall 色
 *   4. アニメーション placing 中の描画セル → ミノ色 (+ 着地時 flash)
 *   5. アニメーション clearing 中の下部行 → flash-out
 */
export function computeBoardCells(
  args: ComputeBoardCellsArgs,
): BoardCellRender[] {
  const {
    taneCells,
    minoCells,
    minoColor,
    animation,
    animDrawCells,
    animColor,
    isPlaceLanded,
  } = args;

  const taneSet = new Set(taneCells);
  const minoSet = new Set(minoCells);
  const animSet = new Set(animDrawCells);
  const inAnimation = animation !== null;

  const result: BoardCellRender[] = [];
  for (let row = 0; row < BOARD_ROWS; row++) {
    for (let col = 0; col < BOARD_COLS; col++) {
      const cellNum = row * BOARD_COLS + col;
      const isPlayArea = col >= PLAY_AREA_START && col <= PLAY_AREA_END;

      let color = "var(--color-cell-empty)";
      let animClass = "";

      if (!isPlayArea) {
        color = "var(--color-wall)";
      } else if (!inAnimation && minoSet.has(cellNum)) {
        // アニメ中は上部ミノを描画しない (落下中のミノとの重複を避ける)
        color = minoColor ?? "var(--color-cell-empty)";
      } else if (taneSet.has(cellNum)) {
        color = "var(--color-wall)";
      }

      if (animation) {
        if (animation.phase === "placing" && animSet.has(cellNum)) {
          color = animColor ?? "var(--color-cell-empty)";
          // 着地フレームでだけ flash エフェクトを付与
          if (isPlaceLanded) animClass = "animate-place";
        } else if (animation.phase === "clearing" && row >= 18) {
          if (isPlayArea && !taneSet.has(cellNum)) {
            animClass = "animate-clear";
          }
        }
      }

      result.push({ color, animClass });
    }
  }
  return result;
}
