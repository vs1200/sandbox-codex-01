import { useRef } from "react";
import { useFitScale } from "../../hooks/useFitScale";
import { BOARD_COLS, BOARD_ROWS, CELL_SIZE_PX } from "../../logic/types";
import { useGameStore } from "../../stores/gameStore";
import { BoardGrid } from "../board/BoardGrid";
import { LeftPanel } from "../panels/LeftPanel";
import { RightPanel } from "../panels/RightPanel";
import { ChoicePanel } from "./ChoicePanel";

// デザイン基準サイズ (px)。Board (セルサイズ × 行/列) を中心に、
// 左右パネルと ChoicePanel を収める余裕を含めたステージサイズを見積もる。
const PANEL_WIDTH = 100; // LeftPanel/RightPanel の見積り幅 (カード幅近似)
const H_GAP = 16; // gap-4
const DESIGN_WIDTH = PANEL_WIDTH * 2 + H_GAP * 2 + BOARD_COLS * CELL_SIZE_PX;
// Board 高さ + ChoicePanel 見積り (~150) + gap (16)
const CHOICE_PANEL_HEIGHT_HINT = 150;
const DESIGN_HEIGHT =
  BOARD_ROWS * CELL_SIZE_PX + H_GAP + CHOICE_PANEL_HEIGHT_HINT;

export function GameContainer() {
  const gameStatus = useGameStore((s) => s.gameStatus);
  const stageRef = useRef<HTMLDivElement>(null);
  // 0.92 → 上下左右に約 8% の余白を確保する
  const scale = useFitScale(stageRef, DESIGN_WIDTH, DESIGN_HEIGHT, 0.92);

  if (gameStatus === "idle") return null;

  return (
    <div className="flex-1 min-h-0 w-full p-4 flex items-center justify-center overflow-hidden">
      <div
        ref={stageRef}
        className="w-full h-full flex items-center justify-center"
      >
        <div
          style={{
            width: DESIGN_WIDTH,
            height: DESIGN_HEIGHT,
            transform: `scale(${scale})`,
            transformOrigin: "center center",
          }}
          className="flex flex-col items-center gap-4 shrink-0"
        >
          <div className="flex gap-4 items-start">
            <LeftPanel />
            <BoardGrid />
            <RightPanel />
          </div>
          <ChoicePanel />
        </div>
      </div>
    </div>
  );
}
