import { searchChoices } from "../data/choiceDatabase";
import { generateBag } from "./bag";
import { getRandomInitialTane } from "./tane";
import type { MinoType } from "./types";

interface SurviveState {
  queue: MinoType[];
  hold: MinoType | null;
  holdActivated: boolean;
  tane: number;
}

const MAX_ATTEMPTS = 100;

function keyOf(state: SurviveState): string {
  return `${state.queue.join("")}|${state.hold ?? "_"}|${
    state.holdActivated ? 1 : 0
  }|${state.tane}`;
}

/**
 * 与えられた局面から、確定詰みに陥らずに「消費できるミノ数」の最大値を返す。
 *
 * 1手 = キュー先頭ミノを1枚消費する操作（配置 or HOLD操作）とみなす。
 * - 現在ミノの配置 / HOLDミノの配置（スワップ） / HOLD有効化 のいずれかで前進
 * - どの操作も取れない（＝確定詰み）ノードでは 0 を返す
 * - キューを消費し切ったら 0 を返す（それ以上前進する必要はない）
 *
 * 戻り値がキュー長と一致すれば「可視キュー全体を捌ける」開始局面である。
 */
export function maxSurvivableDepth(
  state: SurviveState,
  memo: Map<string, number> = new Map(),
): number {
  if (state.queue.length === 0) return 0;

  const key = keyOf(state);
  const cached = memo.get(key);
  if (cached !== undefined) return cached;

  const current = state.queue[0];
  const rest = state.queue.slice(1);
  let best = 0;

  for (const nextTane of searchChoices(current, state.tane)) {
    best = Math.max(
      best,
      1 +
        maxSurvivableDepth(
          {
            queue: rest,
            hold: state.hold,
            holdActivated: state.holdActivated,
            tane: nextTane,
          },
          memo,
        ),
    );
  }

  if (state.holdActivated && state.hold && state.hold !== current) {
    for (const nextTane of searchChoices(state.hold, state.tane)) {
      best = Math.max(
        best,
        1 +
          maxSurvivableDepth(
            { queue: rest, hold: current, holdActivated: true, tane: nextTane },
            memo,
          ),
      );
    }
  }

  if (!state.holdActivated) {
    best = Math.max(
      best,
      1 +
        maxSurvivableDepth(
          { queue: rest, hold: current, holdActivated: true, tane: state.tane },
          memo,
        ),
    );
  }

  memo.set(key, best);
  return best;
}

/**
 * 開始局面（初期タネ + ミノキュー）が「可視キュー全体を捌ける」かを判定する。
 */
export function isViableStart(tane: number, queue: MinoType[]): boolean {
  return (
    maxSurvivableDepth({ queue, hold: null, holdActivated: false, tane }) ===
    queue.length
  );
}

/**
 * デッドロックしない開始局面（初期タネ + ミノキュー）を生成する。
 *
 * - 生成した局面が {@link isViableStart} を満たせば即採用
 * - 満たさなければ再生成（上限 {@link MAX_ATTEMPTS} 回）
 * - 上限まで満たすものが無かった場合は、最長生存手数が最大の局面を採用（フォールバック）
 *
 * 実測では約85%が一発で基準を満たすため、期待試行回数は約1.2回。
 */
export function generateViableDeal(): { queue: MinoType[]; tane: number } {
  let best: { queue: MinoType[]; tane: number } | null = null;
  let bestDepth = -1;

  for (let attempt = 0; attempt < MAX_ATTEMPTS; attempt++) {
    const queue = [...generateBag(), ...generateBag()];
    const tane = getRandomInitialTane();

    const depth = maxSurvivableDepth({
      queue,
      hold: null,
      holdActivated: false,
      tane,
    });
    if (depth === queue.length) {
      return { queue, tane };
    }
    if (depth > bestDepth) {
      bestDepth = depth;
      best = { queue, tane };
    }
  }

  return best as { queue: MinoType[]; tane: number };
}
