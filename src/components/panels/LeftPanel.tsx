import { useEffect } from "react";
import { useGameStore } from "../../stores/gameStore";
import { MinoPreview } from "../board/MinoPreview";

export function LeftPanel() {
  const holdMino = useGameStore((s) => s.holdMino);
  const holdActivated = useGameStore((s) => s.holdActivated);
  const ren = useGameStore((s) => s.ren);
  const mode = useGameStore((s) => s.mode);
  const elapsedTime = useGameStore((s) => s.elapsedTime);
  const timeLeftMs = useGameStore((s) => s.timeLeftMs);
  const bonusEffectMs = useGameStore((s) => s.bonusEffectMs);
  const startTime = useGameStore((s) => s.startTime);
  const gameStatus = useGameStore((s) => s.gameStatus);
  const updateTimer = useGameStore((s) => s.updateTimer);

  // タイマー更新
  useEffect(() => {
    if (
      (mode !== "timeAttack" && mode !== "timeSurvival") ||
      !startTime ||
      gameStatus !== "playing"
    ) {
      return;
    }
    let frameId: number;
    const tick = () => {
      updateTimer();
      frameId = requestAnimationFrame(tick);
    };
    frameId = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(frameId);
  }, [mode, startTime, gameStatus, updateTimer]);

  return (
    <div className="flex flex-col gap-3 min-w-[80px]">
      {/* HOLD */}
      <div className="bg-bg-secondary border border-border rounded-lg p-3">
        <p className="text-xs text-text-dim mb-2 font-bold">HOLD</p>
        {holdActivated && holdMino ? (
          <MinoPreview mino={holdMino} size={14} />
        ) : (
          <div className="w-14 h-7 bg-bg-board rounded" />
        )}
      </div>

      <div className="mt-auto flex flex-col gap-3">
        {/* REN Counter */}
        {ren > 0 && (
          <div className="bg-bg-secondary border border-accent rounded-lg p-3 text-center">
            <p className="text-2xl font-bold text-accent">{ren}</p>
            <p className="text-xs text-text-dim">REN</p>
          </div>
        )}

        {/* Timer */}
        {(mode === "timeAttack" || mode === "timeSurvival") && (
          <div className="relative bg-bg-secondary border border-border rounded-lg p-3 text-center">
            {mode === "timeSurvival" && bonusEffectMs > 0 && (
              <p className="absolute -top-5 left-1/2 -translate-x-1/2 text-xs font-bold text-accent animate-bonus-time pointer-events-none">
                +{(bonusEffectMs / 1000).toFixed(2)}s
              </p>
            )}
            <p className="text-xs text-text-dim mb-1">TIME</p>
            <p
              className={`text-sm font-mono font-bold ${
                mode === "timeSurvival" && timeLeftMs <= 3000
                  ? "text-red-400"
                  : ""
              }`}
            >
              {mode === "timeAttack"
                ? formatTimeDisplay(elapsedTime)
                : formatCountdownDisplay(timeLeftMs)}
            </p>
          </div>
        )}
      </div>
    </div>
  );
}

function formatTimeDisplay(ms: number): string {
  const totalSec = Math.floor(ms / 1000);
  const min = Math.floor(totalSec / 60);
  const sec = totalSec % 60;
  const millis = Math.floor((ms % 1000) / 10);
  const secStr = sec < 10 ? `0${sec}` : `${sec}`;
  const msStr = millis < 10 ? `0${millis}` : `${millis}`;
  return `${min}:${secStr}.${msStr}`;
}

function formatCountdownDisplay(ms: number): string {
  const clamped = Math.max(ms, 0);
  const sec = Math.floor(clamped / 1000);
  const millis = Math.floor((clamped % 1000) / 10);
  const secStr = sec < 10 ? `0${sec}` : `${sec}`;
  const msStr = millis < 10 ? `0${millis}` : `${millis}`;
  return `${secStr}.${msStr}`;
}
