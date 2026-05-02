import { useMemo } from "react";
import { useFallAnimationStep } from "../../hooks/useFallAnimationStep";
import {
  computeBoardCells,
  selectAnimationDrawCells,
} from "../../logic/boardCells";
import { getInitialMinoCells } from "../../logic/placement";
import { getTaneCells } from "../../logic/tane";
import {
  BOARD_COLS,
  BOARD_ROWS,
  CELL_SIZE_PX,
  MINO_COLORS,
  TIME_ATTACK_LIMIT_MS,
} from "../../logic/types";
import { useGameStore } from "../../stores/gameStore";

export function BoardGrid() {
  const tane = useGameStore((s) => s.tane);
  const minoQueue = useGameStore((s) => s.minoQueue);
  const animation = useGameStore((s) => s.animation);
  const mode = useGameStore((s) => s.mode);
  const elapsedTime = useGameStore((s) => s.elapsedTime);
  const timeBonusEffectMs = useGameStore((s) => s.timeBonusEffectMs);

  const { step: fallStep, isLanded: isPlaceLanded } =
    useFallAnimationStep(animation);

  // 表示用タネ (アニメ中は前タネ)
  const displayTane = animation ? animation.prevTane : tane;
  const taneCells = useMemo(() => getTaneCells(displayTane), [displayTane]);

  // 上部に表示する現在ミノ
  const currentMino = minoQueue[0];
  const minoCells = useMemo(
    () => (currentMino ? getInitialMinoCells(currentMino) : []),
    [currentMino],
  );
  const minoColor = currentMino ? MINO_COLORS[currentMino] : undefined;

  // アニメ中のミノ
  const animColor = animation ? MINO_COLORS[animation.placedMino] : undefined;
  const animDrawCells = useMemo(
    () => selectAnimationDrawCells(animation, fallStep),
    [animation, fallStep],
  );

  const cells = useMemo(
    () =>
      computeBoardCells({
        taneCells,
        minoCells,
        minoColor,
        animation,
        animDrawCells,
        animColor,
        isPlaceLanded,
      }),
    [
      taneCells,
      minoCells,
      minoColor,
      animation,
      animDrawCells,
      animColor,
      isPlaceLanded,
    ],
  );

  const remainingMs = Math.max(0, TIME_ATTACK_LIMIT_MS - elapsedTime);
  const isHurry = remainingMs <= 3000;
  const showBonus = Date.now() - timeBonusEffectMs < 450;

  return (
    <div
      className="relative grid border border-border rounded-md overflow-hidden"
      style={{
        gridTemplateColumns: `repeat(${BOARD_COLS}, 1fr)`,
        gridTemplateRows: `repeat(${BOARD_ROWS}, 1fr)`,
        // Board はセルサイズ×行・列数で固定。周囲の他コンポーネントに左右されないようにする。
        width: BOARD_COLS * CELL_SIZE_PX,
        height: BOARD_ROWS * CELL_SIZE_PX,
      }}
    >
      {cells.map((cell, i) => (
        <div
          key={i}
          className={cell.animClass}
          style={{
            backgroundColor: cell.color,
            boxShadow: "inset 0 0 0 0.5px rgba(0,0,0,0.2)",
          }}
        />
      ))}
      {mode === "timeAttack" && (
        <div className="absolute left-2 bottom-2 pointer-events-none">
          <p className="text-[11px] text-text-dim leading-none">TIME</p>
          <p
            className={`text-sm font-mono font-bold leading-none mt-1 ${isHurry ? "text-red-500" : "text-text"}`}
          >
            {formatTimeDisplay(remainingMs)}
          </p>
          {showBonus && (
            <p className="text-xs font-bold text-emerald-400 animate-time-bonus">
              +1.00s
            </p>
          )}
        </div>
      )}
    </div>
  );
}

function formatTimeDisplay(ms: number): string {
  const totalSec = Math.floor(ms / 1000);
  const min = Math.floor(totalSec / 60);
  const sec = totalSec % 60;
  const millis = Math.floor((ms % 1000) / 10);
  const secStr = sec < 10 ? `0${sec}` : `${sec}`;
  const msStr = millis < 10 ? `0${millis}` : `${millis}`;
  return `${min}:${secStr}.${msStr}`;
}
