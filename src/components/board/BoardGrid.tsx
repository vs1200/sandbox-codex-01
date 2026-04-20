import { useMemo } from "react";
import { getTaneCells } from "../../logic/tane";
import {
  BOARD_COLS,
  BOARD_ROWS,
  MINO_COLORS,
  type MinoType,
  PLAY_AREA_END,
  PLAY_AREA_START,
} from "../../logic/types";
import { useGameStore } from "../../stores/gameStore";

/**
 * ミノの形状をボード座標系で返す（row 0-1, col 3-6）
 */
function getMinoCells(mino: MinoType): number[] {
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

export function BoardGrid() {
  const tane = useGameStore((s) => s.tane);
  const minoQueue = useGameStore((s) => s.minoQueue);
  const animation = useGameStore((s) => s.animation);

  const displayTane = animation ? animation.prevTane : tane;
  const taneCells = useMemo(() => getTaneCells(displayTane), [displayTane]);

  const currentMino = minoQueue[0];
  const minoCells = useMemo(
    () => (currentMino ? getMinoCells(currentMino) : []),
    [currentMino],
  );
  const minoColor = currentMino ? MINO_COLORS[currentMino] : undefined;

  const animTargetCells = animation?.targetCells ?? [];
  const animMino = animation?.placedMino;
  const animColor = animMino ? MINO_COLORS[animMino] : undefined;

  const cells = useMemo(() => {
    const result: {
      color: string;
      animClass: string;
    }[] = [];

    for (let row = 0; row < BOARD_ROWS; row++) {
      for (let col = 0; col < BOARD_COLS; col++) {
        const cellNum = row * BOARD_COLS + col;
        const isPlayArea = col >= PLAY_AREA_START && col <= PLAY_AREA_END;

        let color = "var(--color-cell-empty)";
        let animClass = "";

        if (!isPlayArea) {
          // 壁エリア
          color = "var(--color-wall)";
        } else if (minoCells.includes(cellNum)) {
          // 現在のミノ表示（上部）
          color = minoColor ?? "var(--color-cell-empty)";
        } else if (taneCells.includes(cellNum)) {
          // タネパターン
          color = "var(--color-wall)";
        }

        // アニメーション
        if (animation) {
          if (
            animation.phase === "placing" &&
            animTargetCells.includes(cellNum)
          ) {
            color = animColor ?? "var(--color-cell-empty)";
            animClass = "animate-place";
          } else if (animation.phase === "clearing" && row >= 18) {
            // ライン消しエフェクト（下部行）
            if (isPlayArea && !taneCells.includes(cellNum)) {
              animClass = "animate-clear";
            }
          }
        }

        result.push({ color, animClass });
      }
    }
    return result;
  }, [taneCells, minoCells, minoColor, animation, animTargetCells, animColor]);

  return (
    <div
      className="grid border border-border rounded-md overflow-hidden"
      style={{
        gridTemplateColumns: `repeat(${BOARD_COLS}, 1fr)`,
        gridTemplateRows: `repeat(${BOARD_ROWS}, 1fr)`,
        // ステージ (デザイン基準サイズ) 内の高さ全体に揃え、aspect-ratio で幅を連動
        height: "100%",
        aspectRatio: `${BOARD_COLS} / ${BOARD_ROWS}`,
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
