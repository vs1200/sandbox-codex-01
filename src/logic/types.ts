export type MinoType = "i" | "o" | "j" | "l" | "s" | "z" | "t";
export type GameMode = "infinite" | "timeAttack";
export type GameStatus = "idle" | "playing" | "gameover";
export type AnimationPhase = "placing" | "clearing";

export interface AnimationState {
  phase: AnimationPhase;
  prevTane: number;
  placedMino: MinoType;
  targetCells: number[];
  /** 落下中の各フレームで描画する 4 セル。frames[0] = 開始位置, frames[length - 1] = 着地位置 */
  frames: number[][];
}

export interface ChoiceEntry {
  mino: MinoType;
  currentTane: number;
  nextTane: number;
}

export const MINO_TYPES: MinoType[] = ["i", "o", "j", "l", "s", "z", "t"];

export const MINO_COLORS: Record<MinoType, string> = {
  i: "#00d4ff",
  o: "#ffdd00",
  j: "#2266ff",
  l: "#ff8800",
  s: "#44ff00",
  z: "#ff3333",
  t: "#aa44ff",
};

export const INITIAL_TANES = [21, 23, 53, 56, 61, 66, 71, 74] as const;

export const BOARD_ROWS = 20;
export const BOARD_COLS = 10;
export const PLAY_AREA_START = 3;
export const PLAY_AREA_END = 6;
export const TA_TARGET_REN = 25;

/** デザイン基準上の 1 セルのサイズ (px)。Board / MinoPreview のサイズ算出に利用。 */
export const CELL_SIZE_PX = 28;

/** ミノ配置アニメーションで 1 マス落下するのに要する時間 (ms) */
export const FALL_STEP_MS = 10;
/** 着地後、ライン消しに移るまでのフラッシュ保持時間 (ms) */
export const PLACE_HOLD_MS = 90;
/** ライン消しエフェクトの長さ (ms) */
export const CLEAR_DURATION_MS = 180;
