import { useGameStore } from "../../stores/gameStore";
import { MinoPreview } from "../board/MinoPreview";

export function LeftPanel() {
  const holdMino = useGameStore((s) => s.holdMino);
  const holdActivated = useGameStore((s) => s.holdActivated);
  const ren = useGameStore((s) => s.ren);

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
    </div>
  );
}
