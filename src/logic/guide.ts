import { searchChoices } from "../data/choiceDatabase";
import type { MinoType } from "./types";

type GuideAction = { nextTane: number; isHoldChoice: boolean } | "activateHold";

interface GuideState {
  queue: MinoType[];
  holdMino: MinoType | null;
  holdActivated: boolean;
  tane: number;
}

interface EvalResult {
  score: number;
  bestAction: GuideAction | null;
}

function keyOf(state: GuideState): string {
  const { queue, holdMino, holdActivated, tane } = state;
  return `${queue.join("")}|${holdMino ?? "_"}|${holdActivated ? 1 : 0}|${tane}`;
}

function evalState(
  state: GuideState,
  memo: Map<string, EvalResult>,
): EvalResult {
  if (state.queue.length === 0) {
    return { score: 0, bestAction: null };
  }

  const key = keyOf(state);
  const cached = memo.get(key);
  if (cached) return cached;

  const current = state.queue[0];
  const restQueue = state.queue.slice(1);
  const currentChoices = searchChoices(current, state.tane);

  let bestScore = Number.NEGATIVE_INFINITY;
  let bestAction: GuideAction | null = null;

  for (const nextTane of currentChoices) {
    const next = evalState(
      {
        queue: restQueue,
        holdMino: state.holdMino,
        holdActivated: state.holdActivated,
        tane: nextTane,
      },
      memo,
    );
    const score = 1 + next.score;
    if (score > bestScore) {
      bestScore = score;
      bestAction = { nextTane, isHoldChoice: false };
    }
  }

  if (state.holdActivated && state.holdMino && state.holdMino !== current) {
    const holdChoices = searchChoices(state.holdMino, state.tane);
    for (const nextTane of holdChoices) {
      const next = evalState(
        {
          queue: restQueue,
          holdMino: current,
          holdActivated: true,
          tane: nextTane,
        },
        memo,
      );
      const score = 1 + next.score;
      if (score > bestScore) {
        bestScore = score;
        bestAction = { nextTane, isHoldChoice: true };
      }
    }
  }

  if (!state.holdActivated) {
    const next = evalState(
      {
        queue: restQueue,
        holdMino: current,
        holdActivated: true,
        tane: state.tane,
      },
      memo,
    );
    if (next.score > bestScore) {
      bestScore = next.score;
      bestAction = "activateHold";
    }
  }

  const result = {
    score: Number.isFinite(bestScore) ? bestScore : 0,
    bestAction,
  };
  memo.set(key, result);
  return result;
}

export function getGuideRecommendation(state: GuideState): GuideAction | null {
  return evalState(state, new Map()).bestAction;
}
