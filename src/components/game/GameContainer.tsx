import { useRef } from "react";
import { useFitScale } from "../../hooks/useFitScale";
import { useGameStore } from "../../stores/gameStore";
import { BoardGrid } from "../board/BoardGrid";
import { LeftPanel } from "../panels/LeftPanel";
import { RightPanel } from "../panels/RightPanel";
import { ChoicePanel } from "./ChoicePanel";

// 基準デザインサイズ (px)。このサイズを基準にゲーム UI 全体を等比拡縮する。
const DESIGN_WIDTH = 720;
const DESIGN_HEIGHT = 500;

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
          <div className="flex gap-4 items-start flex-1 min-h-0">
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
