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
} from "../../logic/types";
import { useGameStore } from "../../stores/gameStore";

export function BoardGrid() {
  const tane = useGameStore((s) => s.tane);
  const minoQueue = useGameStore((s) => s.minoQueue);
  const animation = useGameStore((s) => s.animation);

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

  return (
    <div
      className="grid border border-border rounded-md overflow-hidden"
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
    </div>
  );
}
