import { useRef } from "react";
import { useFitScale } from "../../hooks/useFitScale";
import { BOARD_COLS, BOARD_ROWS, CELL_SIZE_PX } from "../../logic/types";
import { useGameStore } from "../../stores/gameStore";
import { BoardGrid } from "../board/BoardGrid";
import { LeftPanel } from "../panels/LeftPanel";
import { RightPanel } from "../panels/RightPanel";
import { ChoicePanel } from "./ChoicePanel";

// デザイン基準サイズ (px)。Board (セルサイズ × 行/列) を中心に、
// 左右パネルと Board の 3 カラムを収める余裕を見積もる。
const PANEL_WIDTH = 100; // LeftPanel/RightPanel の見積り幅 (カード幅近似)
const H_GAP = 16; // gap-4
const DESIGN_WIDTH = PANEL_WIDTH * 2 + H_GAP * 2 + BOARD_COLS * CELL_SIZE_PX;
const DESIGN_HEIGHT = BOARD_ROWS * CELL_SIZE_PX;

export function GameContainer() {
  const gameStatus = useGameStore((s) => s.gameStatus);
  const stageRef = useRef<HTMLDivElement>(null);
  // 0.96 → 端末ごとの差を吸収しつつ上下左右に最小限の余白を残す
  const scale = useFitScale(stageRef, DESIGN_WIDTH, DESIGN_HEIGHT, 0.96);

  if (gameStatus === "idle") return null;

  return (
    <div className="flex-1 min-h-0 w-full p-4 flex flex-col items-center gap-3 overflow-hidden">
      <div
        ref={stageRef}
        className="w-full flex-1 min-h-0 flex items-center justify-center overflow-hidden"
      >
        <div
          style={{
            width: DESIGN_WIDTH,
            height: DESIGN_HEIGHT,
            transform: `scale(${scale})`,
            transformOrigin: "center center",
          }}
          className="flex items-start gap-4 shrink-0"
        >
          <LeftPanel />
          <BoardGrid />
          <RightPanel />
        </div>
      </div>
      <ChoicePanel />
    </div>
  );
}
