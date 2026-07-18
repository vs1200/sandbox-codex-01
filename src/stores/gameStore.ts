import { create } from "zustand";
import { searchChoices } from "../data/choiceDatabase";
import { generateBag, refillQueue } from "../logic/bag";
import {
  computeFallFrames,
  computePlacedMinoCells,
  getInitialMinoCells,
} from "../logic/placement";
import { getRandomInitialTane, getTaneCells } from "../logic/tane";
import type {
  AnimationState,
  GameMode,
  GameStatus,
  MinoType,
} from "../logic/types";
import {
  CLEAR_DURATION_MS,
  FALL_STEP_MS,
  PLACE_HOLD_MS,
  TA_TARGET_REN,
  TS_INITIAL_TIME_MS,
} from "../logic/types";

interface GameState {
  currentPage: "title" | "ranking";
  gameStatus: GameStatus;
  mode: GameMode;
  guideEnabled: boolean;

  minoQueue: MinoType[];
  holdMino: MinoType | null;
  holdActivated: boolean;

  tane: number;
  ntj: number;
  nti: number;

  ren: number;

  nextChoices: number[];
  holdChoices: number[];

  animation: AnimationState | null;

  startTime: number | null;
  elapsedTime: number;
  timeResult: string;
  timeLeftMs: number;
  bonusEffectMs: number;
  latestRankingInfo: { isHighScore: boolean; rank: number | null } | null;
  rankings: Record<RankingMode, RankingEntry[]>;

  // アクション
  setGuideEnabled: (enabled: boolean) => void;
  startGame: (mode: GameMode) => void;
  selectChoice: (nextTane: number, isHoldChoice: boolean) => void;
  activateHold: () => void;
  shuffle: () => void;
  resetGame: () => void;
  updateTimer: () => void;
  clearAnimation: () => void;
  openRankingPage: () => void;
  backToTitle: () => void;
}

type RankingMode = GameMode;

interface RankingEntry {
  value: number;
  achievedAt: string;
}

const RANKING_KEY = "tetris-ren-ren-rankings";
const MAX_RANKING_ITEMS = 10;

function loadRankings(): Record<RankingMode, RankingEntry[]> {
  try {
    const raw = localStorage.getItem(RANKING_KEY);
    if (!raw) return { infinite: [], timeAttack: [], timeSurvival: [] };
    const parsed = JSON.parse(raw) as Record<RankingMode, RankingEntry[]>;
    return {
      infinite: Array.isArray(parsed.infinite) ? parsed.infinite : [],
      timeAttack: Array.isArray(parsed.timeAttack) ? parsed.timeAttack : [],
      timeSurvival: Array.isArray(parsed.timeSurvival)
        ? parsed.timeSurvival
        : [],
    };
  } catch {
    return { infinite: [], timeAttack: [], timeSurvival: [] };
  }
}

function saveRankings(rankings: Record<RankingMode, RankingEntry[]>) {
  localStorage.setItem(RANKING_KEY, JSON.stringify(rankings));
}

function isBetterScore(mode: RankingMode, a: number, b: number): boolean {
  return mode === "timeAttack" ? a < b : a > b;
}

function sortRankings(
  mode: RankingMode,
  entries: RankingEntry[],
): RankingEntry[] {
  return [...entries].sort((a, b) =>
    mode === "timeAttack" ? a.value - b.value : b.value - a.value,
  );
}

function computeChoices(
  currentMino: MinoType,
  holdMino: MinoType | null,
  holdActivated: boolean,
  tane: number,
): { nextChoices: number[]; holdChoices: number[] } {
  const nextChoices = searchChoices(currentMino, tane);
  let holdChoices: number[] = [];
  if (holdActivated && holdMino && holdMino !== currentMino) {
    holdChoices = searchChoices(holdMino, tane);
  }
  return { nextChoices, holdChoices };
}

interface TimerUpdateResult {
  gameStatus: GameStatus;
  elapsedTime: number;
  timeLeftMs: number;
}

function computeSurvivalBonusMs(mode: GameMode, ren: number): number {
  return mode === "timeSurvival" ? (1 / (1 + ren / 40)) * 1000 : 0;
}

function computeSurvivalTimerUpdate(
  state: Pick<GameState, "mode" | "startTime" | "elapsedTime" | "timeLeftMs">,
  bonusMs: number,
): TimerUpdateResult {
  if (state.mode !== "timeSurvival" || !state.startTime) {
    return {
      gameStatus: "playing",
      elapsedTime: state.elapsedTime,
      timeLeftMs: state.timeLeftMs,
    };
  }

  const now = Date.now();
  const consumed = now - state.startTime - state.elapsedTime;
  const timeLeftMs = Math.max(state.timeLeftMs - consumed + bonusMs, 0);
  const elapsedTime = now - state.startTime;

  return {
    gameStatus: timeLeftMs <= 0 ? "gameover" : "playing",
    elapsedTime,
    timeLeftMs,
  };
}

function persistRankingIfNeeded(
  state: Pick<GameState, "mode" | "rankings" | "guideEnabled">,
  scoreValue: number | null,
): {
  rankings: Record<RankingMode, RankingEntry[]>;
  latestRankingInfo: { isHighScore: boolean; rank: number | null } | null;
} {
  // おすすめ表示は練習用機能のため、ランキングには集計しない
  if (scoreValue === null || state.guideEnabled) {
    return { rankings: state.rankings, latestRankingInfo: null };
  }

  const mode = state.mode;
  const current = state.rankings[mode];
  const merged = sortRankings(mode, [
    ...current,
    { value: scoreValue, achievedAt: new Date().toISOString() },
  ]).slice(0, MAX_RANKING_ITEMS);
  const rankings = { ...state.rankings, [mode]: merged };
  saveRankings(rankings);

  const rank = merged.findIndex((entry) => entry.value === scoreValue) + 1;
  const prevBest = current[0]?.value;

  return {
    rankings,
    latestRankingInfo: {
      isHighScore:
        prevBest === undefined || isBetterScore(mode, scoreValue, prevBest),
      rank: rank > 0 ? rank : null,
    },
  };
}
export const useGameStore = create<GameState>((set, get) => ({
  currentPage: "title",
  gameStatus: "idle",
  mode: "infinite",
  guideEnabled: false,
  minoQueue: [],
  holdMino: null,
  holdActivated: false,
  tane: 0,
  ntj: 0,
  nti: 0,
  ren: 0,
  nextChoices: [],
  holdChoices: [],
  animation: null,
  startTime: null,
  elapsedTime: 0,
  timeResult: "",
  timeLeftMs: TS_INITIAL_TIME_MS,
  bonusEffectMs: 0,
  latestRankingInfo: null,
  rankings: loadRankings(),

  setGuideEnabled: (enabled: boolean) => {
    set({ guideEnabled: enabled });
  },

  startGame: (mode: GameMode) => {
    const queue = [...generateBag(), ...generateBag()];
    const tane = getRandomInitialTane();
    const ntj = Math.floor(tane / 10);
    const nti = tane % 10;
    const currentMino = queue[0];
    const { nextChoices, holdChoices } = computeChoices(
      currentMino,
      null,
      false,
      tane,
    );

    set({
      gameStatus: "playing",
      mode,
      minoQueue: queue,
      holdMino: null,
      holdActivated: false,
      tane,
      ntj,
      nti,
      ren: 0,
      nextChoices,
      holdChoices,
      animation: null,
      startTime:
        mode === "timeAttack" || mode === "timeSurvival" ? Date.now() : null,
      elapsedTime: 0,
      timeResult: "",
      timeLeftMs: TS_INITIAL_TIME_MS,
      bonusEffectMs: 0,
      latestRankingInfo: null,
      currentPage: "title",
    });
  },

  selectChoice: (nextTane: number, isHoldChoice: boolean) => {
    const state = get();
    if (state.gameStatus !== "playing") return;

    const currentMino = state.minoQueue[0];
    const prevTane = state.tane;

    // HOLD ミノの配置の場合、現在のミノとHOLDを交換
    let newHoldMino = state.holdMino;
    if (isHoldChoice) {
      newHoldMino = currentMino;
    }

    // ミノキュー進行
    const newQueue = refillQueue(state.minoQueue.slice(1));

    const newRen = state.ren + 1;
    const bonusMs = computeSurvivalBonusMs(state.mode, newRen);
    const newNtj = Math.floor(nextTane / 10);
    const newNti = nextTane % 10;

    // 配置候補の検索
    const nextMino = newQueue[0];
    const { nextChoices: newNextChoices, holdChoices: newHoldChoices } =
      computeChoices(nextMino, newHoldMino, state.holdActivated, nextTane);

    // TAモード: 目標REN達成チェック
    const isTA = state.mode === "timeAttack";
    const reachedTarget = isTA && newRen === TA_TARGET_REN;

    // ゲームオーバー判定
    const isGameOver =
      !reachedTarget &&
      state.holdActivated &&
      newNextChoices.length === 0 &&
      newHoldChoices.length === 0;

    // アニメーションのセットアップ
    const placedMino = isHoldChoice
      ? (state.holdMino as MinoType)
      : currentMino;
    // 実際に配置されるミノ 4 セル（クリア前）をアニメーション対象とする
    const placedCells = computePlacedMinoCells(placedMino, prevTane, nextTane);
    const targetCells =
      placedCells.size > 0 ? [...placedCells] : getTaneCells(nextTane);

    // 落下アニメーションのフレームを計算
    const initialCells = getInitialMinoCells(placedMino);
    const frames = computeFallFrames(prevTane, initialCells, targetCells);

    let newGameStatus: GameStatus = "playing";
    let newTimeResult = state.timeResult;
    const timerUpdate = computeSurvivalTimerUpdate(state, bonusMs);
    let newElapsed = timerUpdate.elapsedTime;
    const newTimeLeftMs = timerUpdate.timeLeftMs;
    newGameStatus = timerUpdate.gameStatus;

    if (reachedTarget || isGameOver) {
      newGameStatus = "gameover";
      if (reachedTarget && state.startTime) {
        newElapsed = Date.now() - state.startTime;
        newTimeResult = formatTime(newElapsed);
      }
    }

    let latestRankingInfo: {
      isHighScore: boolean;
      rank: number | null;
    } | null = state.latestRankingInfo;
    let updatedRankings = state.rankings;
    if (newGameStatus === "gameover") {
      const scoreValue =
        state.mode === "timeAttack"
          ? reachedTarget
            ? newElapsed
            : null
          : newRen;
      const rankingResult = persistRankingIfNeeded(state, scoreValue);
      updatedRankings = rankingResult.rankings;
      if (rankingResult.latestRankingInfo) {
        latestRankingInfo = rankingResult.latestRankingInfo;
      }
    }

    set({
      minoQueue: newQueue,
      holdMino: newHoldMino,
      tane: nextTane,
      ntj: newNtj,
      nti: newNti,
      ren: newRen,
      nextChoices: newNextChoices,
      holdChoices: newHoldChoices,
      gameStatus: newGameStatus,
      elapsedTime: newElapsed,
      timeResult: newTimeResult,
      timeLeftMs: newTimeLeftMs,
      bonusEffectMs: bonusMs,
      rankings: updatedRankings,
      latestRankingInfo,
      animation: {
        phase: "placing",
        prevTane,
        placedMino,
        targetCells,
        frames,
      },
    });
    if (bonusMs > 0) {
      setTimeout(() => {
        if (get().bonusEffectMs === bonusMs) set({ bonusEffectMs: 0 });
      }, 650);
    }

    // アニメーションフェーズ遷移
    // 落下ステップ数 + 着地保持時間後に clearing、その後に animation をクリア
    const placingDuration =
      Math.max(frames.length - 1, 0) * FALL_STEP_MS + PLACE_HOLD_MS;
    setTimeout(() => {
      const current = get();
      if (current.animation?.prevTane === prevTane) {
        set({
          animation: {
            ...current.animation,
            phase: "clearing",
          },
        });
        setTimeout(() => {
          const cur2 = get();
          if (
            cur2.animation?.phase === "clearing" &&
            cur2.animation.prevTane === prevTane
          ) {
            set({ animation: null });
          }
        }, CLEAR_DURATION_MS);
      }
    }, placingDuration);
  },

  activateHold: () => {
    const state = get();
    if (state.gameStatus !== "playing" || state.holdActivated) return;

    const currentMino = state.minoQueue[0];
    const newQueue = refillQueue(state.minoQueue.slice(1));
    const nextMino = newQueue[0];

    const { nextChoices, holdChoices } = computeChoices(
      nextMino,
      currentMino,
      true,
      state.tane,
    );

    // HOLD有効化直後のゲームオーバー判定
    const isGameOver = nextChoices.length === 0 && holdChoices.length === 0;

    set({
      holdMino: currentMino,
      holdActivated: true,
      minoQueue: newQueue,
      nextChoices,
      holdChoices,
      gameStatus: isGameOver ? "gameover" : "playing",
    });
  },

  shuffle: () => {
    const state = get();
    if (state.ren > 0) return; // シャッフルは開始直後のみ

    const queue = [...generateBag(), ...generateBag()];
    const tane = getRandomInitialTane();
    const ntj = Math.floor(tane / 10);
    const nti = tane % 10;
    const currentMino = queue[0];
    const { nextChoices, holdChoices } = computeChoices(
      currentMino,
      null,
      false,
      tane,
    );

    set({
      minoQueue: queue,
      holdMino: null,
      holdActivated: false,
      tane,
      ntj,
      nti,
      ren: 0,
      nextChoices,
      holdChoices,
      animation: null,
      startTime:
        state.mode === "timeAttack" || state.mode === "timeSurvival"
          ? Date.now()
          : null,
      elapsedTime: 0,
      timeResult: "",
      timeLeftMs: TS_INITIAL_TIME_MS,
      bonusEffectMs: 0,
    });
  },

  resetGame: () => {
    set({
      gameStatus: "idle",
      mode: "infinite",
      minoQueue: [],
      holdMino: null,
      holdActivated: false,
      tane: 0,
      ntj: 0,
      nti: 0,
      ren: 0,
      nextChoices: [],
      holdChoices: [],
      animation: null,
      startTime: null,
      elapsedTime: 0,
      timeResult: "",
      timeLeftMs: TS_INITIAL_TIME_MS,
      bonusEffectMs: 0,
    });
  },

  updateTimer: () => {
    const state = get();
    if (!state.startTime || state.gameStatus !== "playing") return;

    const now = Date.now();
    const elapsed = now - state.startTime;

    if (state.mode === "timeAttack") {
      set({ elapsedTime: elapsed });
      return;
    }

    if (state.mode === "timeSurvival") {
      const delta = elapsed - state.elapsedTime;
      const timeLeftMs = Math.max(state.timeLeftMs - delta, 0);
      set({ elapsedTime: elapsed, timeLeftMs });
      if (timeLeftMs <= 0) {
        set({ gameStatus: "gameover" });
      }
    }
  },

  clearAnimation: () => {
    set({ animation: null });
  },

  openRankingPage: () => {
    set({ currentPage: "ranking", gameStatus: "idle" });
  },

  backToTitle: () => {
    set({ currentPage: "title", gameStatus: "idle", latestRankingInfo: null });
  },
}));

function formatTime(ms: number): string {
  const totalSec = Math.floor(ms / 1000);
  const min = Math.floor(totalSec / 60);
  const sec = totalSec % 60;
  const millis = ms % 1000;
  const secStr = sec < 10 ? `0${sec}` : `${sec}`;
  const msStr =
    millis < 10 ? `00${millis}` : millis < 100 ? `0${millis}` : `${millis}`;
  return `${min}:${secStr}:${msStr}`;
}
