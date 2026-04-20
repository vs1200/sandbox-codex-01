import { useGameStore } from "../../stores/gameStore";

export function GameOverModal() {
  const ren = useGameStore((s) => s.ren);
  const mode = useGameStore((s) => s.mode);
  const timeResult = useGameStore((s) => s.timeResult);
  const resetGame = useGameStore((s) => s.resetGame);
  const startGame = useGameStore((s) => s.startGame);

  return (
    <div className="fixed inset-0 bg-black/60 flex items-center justify-center z-50">
      <div className="bg-bg-secondary border border-border rounded-xl p-8 text-center max-w-sm mx-4">
        <h2 className="text-2xl font-bold mb-4">GAME OVER</h2>

        {mode === "timeAttack" && ren >= 25 ? (
          <>
            <p className="text-lg text-accent mb-2">🎉 達成！</p>
            <p className="text-3xl font-bold font-mono mb-1">{timeResult}</p>
            <p className="text-text-dim text-sm mb-6">25 REN クリア</p>
          </>
        ) : (
          <>
            <p className="text-4xl font-bold text-accent mb-1">
              {Math.max(ren, 0)}
            </p>
            <p className="text-text-dim text-sm mb-6">REN</p>
          </>
        )}

        <div className="flex gap-3 justify-center">
          <button
            type="button"
            onClick={() => {
              resetGame();
              startGame(mode);
            }}
            className="px-6 py-3 bg-accent text-white rounded-lg font-bold
							hover:bg-accent-hover transition-colors cursor-pointer"
          >
            もう一度
          </button>
          <button
            type="button"
            onClick={resetGame}
            className="px-6 py-3 bg-bg-board border border-border rounded-lg font-bold
							hover:border-accent transition-colors cursor-pointer"
          >
            タイトルへ
          </button>
        </div>
      </div>
    </div>
  );
}
