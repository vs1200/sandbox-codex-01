import type { GameMode } from "../../logic/types";

type RankingMode = Exclude<GameMode, "guide">;
import { useGameStore } from "../../stores/gameStore";

const modeLabels: Record<RankingMode, string> = {
  infinite: "無限モード",
  timeAttack: "TAモード",
  timeSurvival: "持ち時間モード",
};

export function RankingPage() {
  const rankings = useGameStore((s) => s.rankings);
  const backToTitle = useGameStore((s) => s.backToTitle);

  return (
    <div className="w-full flex-1 overflow-auto p-6">
      <div className="max-w-3xl mx-auto">
        <div className="flex items-center justify-between mb-6">
          <h2 className="text-2xl font-bold">ランキング</h2>
          <button
            type="button"
            onClick={backToTitle}
            className="px-4 py-2 bg-bg-secondary border border-border rounded-lg font-bold hover:border-accent transition-colors"
          >
            タイトルへ
          </button>
        </div>

        <div className="grid md:grid-cols-3 gap-4">
          {(Object.keys(modeLabels) as RankingMode[]).map((mode) => (
            <section
              key={mode}
              className="bg-bg-secondary border border-border rounded-lg p-4"
            >
              <h3 className="font-bold mb-3">{modeLabels[mode]}</h3>
              <ol className="space-y-2">
                {rankings[mode].length === 0 ? (
                  <li className="text-sm text-text-dim">記録なし</li>
                ) : (
                  rankings[mode].map((entry, idx) => (
                    <li key={`${entry.achievedAt}-${idx}`} className="text-sm">
                      <span className="font-mono mr-2">#{idx + 1}</span>
                      <span className="font-bold">
                        {formatScore(mode, entry.value)}
                      </span>
                    </li>
                  ))
                )}
              </ol>
            </section>
          ))}
        </div>
      </div>
    </div>
  );
}

function formatScore(mode: GameMode, value: number) {
  if (mode === "timeAttack") {
    const totalSec = Math.floor(value / 1000);
    const min = Math.floor(totalSec / 60);
    const sec = totalSec % 60;
    const millis = Math.floor((value % 1000) / 10);
    return `${min}:${String(sec).padStart(2, "0")}.${String(millis).padStart(2, "0")}`;
  }
  return `${value} REN`;
}
