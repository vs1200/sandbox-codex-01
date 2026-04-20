import { useGameStore } from "../../stores/gameStore";
import { BoardGrid } from "../board/BoardGrid";
import { LeftPanel } from "../panels/LeftPanel";
import { RightPanel } from "../panels/RightPanel";
import { ChoicePanel } from "./ChoicePanel";

export function GameContainer() {
  const gameStatus = useGameStore((s) => s.gameStatus);

  if (gameStatus === "idle") return null;

  return (
    <div className="flex flex-col items-center flex-1 p-4 gap-4">
      <div className="flex gap-4 items-start">
        <LeftPanel />
        <BoardGrid />
        <RightPanel />
      </div>
      <ChoicePanel />
    </div>
  );
}
