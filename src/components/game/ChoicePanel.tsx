import { useMemo } from "react";
import { computePlacedMinoCellsForChoices } from "../../logic/placement";
import type { MinoType } from "../../logic/types";
import { useGameStore } from "../../stores/gameStore";
import { ChoicePreview } from "./ChoicePreview";

export function ChoicePanel() {
  const minoQueue = useGameStore((s) => s.minoQueue);
  const holdMino = useGameStore((s) => s.holdMino);
  const holdActivated = useGameStore((s) => s.holdActivated);
  const tane = useGameStore((s) => s.tane);
  const nextChoices = useGameStore((s) => s.nextChoices);
  const holdChoices = useGameStore((s) => s.holdChoices);
  const ren = useGameStore((s) => s.ren);
  const gameStatus = useGameStore((s) => s.gameStatus);
  const selectChoice = useGameStore((s) => s.selectChoice);
  const activateHold = useGameStore((s) => s.activateHold);
  const shuffle = useGameStore((s) => s.shuffle);

  const currentMino = minoQueue[0];

  const nextPlacements = useMemo(
    () => computePlacedMinoCellsForChoices(currentMino, tane, nextChoices),
    [currentMino, tane, nextChoices],
  );
  const holdPlacements = useMemo(
    () =>
      holdMino
        ? computePlacedMinoCellsForChoices(
            holdMino as MinoType,
            tane,
            holdChoices,
          )
        : new Map<number, Set<number>>(),
    [holdMino, tane, holdChoices],
  );

  if (gameStatus !== "playing") return null;

  return (
    <div className="bg-bg-secondary border border-border rounded-lg p-4 w-full max-w-xl">
      {/* 現在ミノの配置候補 */}
      {nextChoices.length > 0 && (
        <div className="mb-3">
          <p className="text-xs text-text-dim mb-2 font-bold">配置候補</p>
          <div className="flex flex-wrap gap-2">
            {nextChoices.map((nextTane) => (
              <button
                type="button"
                key={`choice-${nextTane}`}
                onClick={() => selectChoice(nextTane, false)}
                className="p-2 bg-bg-board border border-border rounded-lg
									hover:border-accent transition-colors cursor-pointer"
                title={`${currentMino} → ${nextTane}`}
              >
                <ChoicePreview
                  mino={currentMino}
                  currentTane={tane}
                  nextTane={nextTane}
                  placedCellsOverride={nextPlacements.get(nextTane)}
                />
              </button>
            ))}
          </div>
        </div>
      )}

      {/* HOLDミノの配置候補 */}
      {holdActivated && holdChoices.length > 0 && (
        <div className="mb-3 pt-3 border-t border-border">
          <p className="text-xs text-text-dim mb-2 font-bold">
            HOLD候補（{holdMino?.toUpperCase()}）
          </p>
          <div className="flex flex-wrap gap-2">
            {holdChoices.map((nextTane) => (
              <button
                type="button"
                key={`hold-${nextTane}`}
                onClick={() => selectChoice(nextTane, true)}
                className="p-2 bg-bg-board border border-accent/40 rounded-lg
									hover:border-accent transition-colors cursor-pointer"
                title={`HOLD: ${holdMino} → ${nextTane}`}
              >
                <ChoicePreview
                  mino={holdMino as MinoType}
                  currentTane={tane}
                  nextTane={nextTane}
                  placedCellsOverride={holdPlacements.get(nextTane)}
                />
              </button>
            ))}
          </div>
        </div>
      )}

      {/* HOLD / Shuffle ボタン */}
      <div className="flex gap-2 mt-3">
        {!holdActivated && (
          <button
            type="button"
            onClick={activateHold}
            className="px-4 py-2 bg-bg-board border border-border rounded-lg text-sm
							hover:border-accent transition-colors cursor-pointer"
          >
            HOLD
          </button>
        )}
        {ren === -1 && (
          <button
            type="button"
            onClick={shuffle}
            className="px-4 py-2 bg-bg-board border border-border rounded-lg text-sm
							hover:border-accent transition-colors cursor-pointer"
          >
            Shuffle
          </button>
        )}
      </div>
    </div>
  );
}
