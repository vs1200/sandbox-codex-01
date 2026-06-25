import { useMemo } from "react";
import { getGuideRecommendation } from "../../logic/guide";
import { computePlacedMinoCellsForChoices } from "../../logic/placement";
import type { MinoType } from "../../logic/types";
import { useGameStore } from "../../stores/gameStore";
import { ChoicePreview } from "./ChoicePreview";

const CHOICE_PREVIEW_CELL_SIZE = 14;
const CHOICE_BUTTON_SIZE = CHOICE_PREVIEW_CELL_SIZE * 4 + 3 + 16;

export function ChoicePanel() {
  const minoQueue = useGameStore((s) => s.minoQueue);
  const holdMino = useGameStore((s) => s.holdMino);
  const holdActivated = useGameStore((s) => s.holdActivated);
  const tane = useGameStore((s) => s.tane);
  const nextChoices = useGameStore((s) => s.nextChoices);
  const holdChoices = useGameStore((s) => s.holdChoices);
  const ren = useGameStore((s) => s.ren);
  const gameStatus = useGameStore((s) => s.gameStatus);
  const mode = useGameStore((s) => s.mode);
  const selectChoice = useGameStore((s) => s.selectChoice);
  const activateHold = useGameStore((s) => s.activateHold);
  const shuffle = useGameStore((s) => s.shuffle);

  const currentMino = minoQueue[0];

  const guideRecommendation = useMemo(() => {
    if (mode !== "guide") return null;
    return getGuideRecommendation({
      queue: minoQueue,
      holdMino,
      holdActivated,
      tane,
    });
  }, [mode, minoQueue, holdMino, holdActivated, tane]);

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
      <p className="text-xs text-text-dim mb-2 font-bold">配置候補</p>
      <div className="flex flex-nowrap gap-2 overflow-x-auto items-stretch">
        {nextChoices.map((nextTane) => {
          const isRecommended =
            mode === "guide" &&
            guideRecommendation !== null &&
            guideRecommendation !== "activateHold" &&
            !guideRecommendation.isHoldChoice &&
            guideRecommendation.nextTane === nextTane;
          return (
            <button
              type="button"
              key={`choice-${nextTane}`}
              onClick={() => selectChoice(nextTane, false)}
              className={`p-2 bg-bg-board border rounded-lg hover:border-accent transition-colors cursor-pointer shrink-0 ${
                isRecommended ? "border-emerald-400" : "border-border"
              }`}
              title={`${currentMino} → ${nextTane}`}
            >
              {isRecommended && (
                <p className="text-[10px] text-emerald-300 mb-1 font-bold">
                  おすすめ
                </p>
              )}
              <ChoicePreview
                mino={currentMino}
                currentTane={tane}
                nextTane={nextTane}
                size={CHOICE_PREVIEW_CELL_SIZE}
                placedCellsOverride={nextPlacements.get(nextTane)}
              />
            </button>
          );
        })}

        {holdActivated && holdChoices.length > 0 && (
          <div className="shrink-0 w-px bg-border/60 self-stretch" />
        )}
        {holdActivated &&
          holdChoices.map((nextTane) => {
            const isRecommended =
              mode === "guide" &&
              guideRecommendation !== null &&
              guideRecommendation !== "activateHold" &&
              guideRecommendation.isHoldChoice &&
              guideRecommendation.nextTane === nextTane;
            return (
              <button
                type="button"
                key={`hold-${nextTane}`}
                onClick={() => selectChoice(nextTane, true)}
                className={`p-2 bg-bg-board border rounded-lg hover:border-accent transition-colors cursor-pointer shrink-0 ${
                  isRecommended ? "border-emerald-400" : "border-accent/40"
                }`}
                title={`HOLD: ${holdMino} → ${nextTane}`}
              >
                {isRecommended && (
                  <p className="text-[10px] text-emerald-300 mb-1 font-bold">
                    おすすめ
                  </p>
                )}
                <ChoicePreview
                  mino={holdMino as MinoType}
                  currentTane={tane}
                  nextTane={nextTane}
                  size={CHOICE_PREVIEW_CELL_SIZE}
                  placedCellsOverride={holdPlacements.get(nextTane)}
                />
              </button>
            );
          })}

        {(!holdActivated || ren === 0) && (
          <div className="shrink-0 w-px bg-border/60 self-stretch" />
        )}
        {!holdActivated && (
          <button
            type="button"
            onClick={activateHold}
            className={`p-2 bg-bg-board border rounded-lg hover:border-accent transition-colors cursor-pointer shrink-0 flex items-center justify-center text-xs font-bold ${
              mode === "guide" && guideRecommendation === "activateHold"
                ? "border-emerald-400 text-emerald-300"
                : "border-border"
            }`}
            style={{
              width: `${CHOICE_BUTTON_SIZE}px`,
              height: `${CHOICE_BUTTON_SIZE}px`,
            }}
          >
            HOLD
          </button>
        )}
        {ren === 0 && (
          <button
            type="button"
            onClick={shuffle}
            className="p-2 bg-bg-board border border-border rounded-lg
							hover:border-accent transition-colors cursor-pointer shrink-0
							flex items-center justify-center text-xs font-bold"
            style={{
              width: `${CHOICE_BUTTON_SIZE}px`,
              height: `${CHOICE_BUTTON_SIZE}px`,
            }}
          >
            Shuffle
          </button>
        )}
      </div>
    </div>
  );
}
