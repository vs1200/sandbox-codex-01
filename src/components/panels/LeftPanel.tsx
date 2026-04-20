import { useEffect } from "react";
import { useGameStore } from "../../stores/gameStore";
import { MinoPreview } from "../board/MinoPreview";

export function LeftPanel() {
  const holdMino = useGameStore((s) => s.holdMino);
  const holdActivated = useGameStore((s) => s.holdActivated);
  const ren = useGameStore((s) => s.ren);
  const mode = useGameStore((s) => s.mode);
  const elapsedTime = useGameStore((s) => s.elapsedTime);
  const startTime = useGameStore((s) => s.startTime);
  const gameStatus = useGameStore((s) => s.gameStatus);
  const updateTimer = useGameStore((s) => s.updateTimer);

  // タイマー更新
  useEffect(() => {
    if (mode !== "timeAttack" || !startTime || gameStatus !== "playing") {
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

      {/* REN Counter */}
      {ren > 0 && (
        <div className="bg-bg-secondary border border-accent rounded-lg p-3 text-center">
          <p className="text-2xl font-bold text-accent">{ren}</p>
          <p className="text-xs text-text-dim">REN</p>
        </div>
      )}

      {/* Timer (TA mode) */}
      {mode === "timeAttack" && (
        <div className="bg-bg-secondary border border-border rounded-lg p-3 text-center">
          <p className="text-xs text-text-dim mb-1">TIME</p>
          <p className="text-sm font-mono font-bold">
            {formatTimeDisplay(elapsedTime)}
          </p>
        </div>
      )}
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
