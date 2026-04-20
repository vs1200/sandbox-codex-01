import { create } from "zustand";
import { searchChoices } from "../data/choiceDatabase";
import { generateBag, refillQueue } from "../logic/bag";
import { getRandomInitialTane, getTaneCells } from "../logic/tane";
import type {
  AnimationState,
  GameMode,
  GameStatus,
  MinoType,
} from "../logic/types";
import { TA_TARGET_REN } from "../logic/types";

interface GameState {
  gameStatus: GameStatus;
  mode: GameMode;

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

  // アクション
  startGame: (mode: GameMode) => void;
  selectChoice: (nextTane: number, isHoldChoice: boolean) => void;
  activateHold: () => void;
  shuffle: () => void;
  resetGame: () => void;
  updateTimer: () => void;
  clearAnimation: () => void;
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

export const useGameStore = create<GameState>((set, get) => ({
  gameStatus: "idle",
  mode: "infinite",
  minoQueue: [],
  holdMino: null,
  holdActivated: false,
  tane: 0,
  ntj: 0,
  nti: 0,
  ren: -1,
  nextChoices: [],
  holdChoices: [],
  animation: null,
  startTime: null,
  elapsedTime: 0,
  timeResult: "",

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
      ren: -1,
      nextChoices,
      holdChoices,
      animation: null,
      startTime: mode === "timeAttack" ? Date.now() : null,
      elapsedTime: 0,
      timeResult: "",
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
    const targetCells = getTaneCells(nextTane);

    let newGameStatus: GameStatus = "playing";
    let newTimeResult = state.timeResult;
    let newElapsed = state.elapsedTime;

    if (reachedTarget || isGameOver) {
      newGameStatus = "gameover";
      if (reachedTarget && state.startTime) {
        newElapsed = Date.now() - state.startTime;
        newTimeResult = formatTime(newElapsed);
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
      animation: {
        phase: "placing",
        prevTane,
        placedMino,
        targetCells,
      },
    });

    // アニメーションフェーズ遷移
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
        }, 180);
      }
    }, 250);
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
    if (state.ren > -1) return; // シャッフルは開始直後のみ

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
      ren: -1,
      nextChoices,
      holdChoices,
      animation: null,
      startTime: state.mode === "timeAttack" ? Date.now() : null,
      elapsedTime: 0,
      timeResult: "",
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
      ren: -1,
      nextChoices: [],
      holdChoices: [],
      animation: null,
      startTime: null,
      elapsedTime: 0,
      timeResult: "",
    });
  },

  updateTimer: () => {
    const state = get();
    if (state.startTime && state.gameStatus === "playing") {
      set({ elapsedTime: Date.now() - state.startTime });
    }
  },

  clearAnimation: () => {
    set({ animation: null });
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
