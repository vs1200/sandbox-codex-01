import type { GameMode } from "../../logic/types";
import { useGameStore } from "../../stores/gameStore";

export function ModeSelector() {
  const startGame = useGameStore((s) => s.startGame);

  const handleStart = (mode: GameMode) => {
    startGame(mode);
  };

  return (
    <div className="flex flex-col items-center justify-center gap-6 flex-1 p-8">
      <p className="text-text-dim text-lg">モードを選択してください</p>
      <div className="flex gap-4">
        <button
          type="button"
          onClick={() => handleStart("infinite")}
          className="px-8 py-4 bg-accent text-white rounded-lg text-lg font-bold
						hover:bg-accent-hover transition-colors cursor-pointer"
        >
          無限モード
        </button>
        <button
          type="button"
          onClick={() => handleStart("timeAttack")}
          className="px-8 py-4 bg-bg-secondary text-text border border-border rounded-lg text-lg font-bold
						hover:border-accent transition-colors cursor-pointer"
        >
          TAモード
        </button>
      </div>
      <p className="text-text-dim text-sm max-w-md text-center">
        無限モード: できるだけ長くRENを繋ぎ続けましょう
        <br />
        TAモード: 25 REN をできるだけ早く達成しましょう
      </p>
    </div>
  );
}
