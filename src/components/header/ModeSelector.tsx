import type { GameMode } from "../../logic/types";
import { useGameStore } from "../../stores/gameStore";

export function ModeSelector() {
  const startGame = useGameStore((s) => s.startGame);
  const guideEnabled = useGameStore((s) => s.guideEnabled);
  const setGuideEnabled = useGameStore((s) => s.setGuideEnabled);

  const handleStart = (mode: GameMode) => {
    startGame(mode);
  };

  return (
    <div className="flex flex-col items-center justify-center gap-6 flex-1 p-8">
      <p className="text-text-dim text-lg">モードを選択してください</p>
      <div className="flex gap-4 flex-wrap justify-center">
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
        <button
          type="button"
          onClick={() => handleStart("timeSurvival")}
          className="px-8 py-4 bg-bg-secondary text-text border border-border rounded-lg text-lg font-bold
						hover:border-accent transition-colors cursor-pointer"
        >
          持ち時間モード
        </button>
      </div>

      <label className="flex items-center gap-2 text-text cursor-pointer select-none">
        <input
          type="checkbox"
          checked={guideEnabled}
          onChange={(e) => setGuideEnabled(e.target.checked)}
          className="w-4 h-4 accent-accent cursor-pointer"
        />
        <span className="text-sm font-bold">おすすめ配置を表示する</span>
      </label>

      <p className="text-text-dim text-sm max-w-md text-center">
        無限モード: できるだけ長くRENを繋ぎ続けましょう
        <br />
        TAモード: 25 REN をできるだけ早く達成しましょう
        <br />
        持ち時間モード: 10秒から始まり、タイムアップまでの最大RENを競います
        <br />
        おすすめ配置を表示する:
        どのモードでもゲームオーバー回避のおすすめ配置を提案します
      </p>
    </div>
  );
}
