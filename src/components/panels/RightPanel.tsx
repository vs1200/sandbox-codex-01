import { useGameStore } from "../../stores/gameStore";
import { MinoPreview } from "../board/MinoPreview";

export function RightPanel() {
  const minoQueue = useGameStore((s) => s.minoQueue);

  // NEXT: 5個先まで表示（queue[1]〜queue[5]）
  const nextMinos = minoQueue.slice(1, 6);

  return (
    <div className="flex flex-col gap-2 min-w-[80px]">
      <div className="bg-bg-secondary border border-border rounded-lg p-3">
        <p className="text-xs text-text-dim mb-2 font-bold">NEXT</p>
        <div className="flex flex-col gap-2">
          {nextMinos.map((mino, i) => (
            <div key={`next-${i}`} className={i === 0 ? "" : "opacity-60"}>
              <MinoPreview mino={mino} size={12} />
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
