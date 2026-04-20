import { useMemo } from "react";
import { computePlacedMinoCells } from "../../logic/placement";
import { getTaneCells } from "../../logic/tane";
import { MINO_COLORS, type MinoType, PLAY_AREA_START } from "../../logic/types";

interface ChoicePreviewProps {
  mino: MinoType;
  currentTane: number;
  nextTane: number;
  size?: number;
  /** 親側で一括計算した配置セル。指定があればこれを優先使用する。 */
  placedCellsOverride?: ReadonlySet<number>;
}

/**
 * 配置プレビュー: 選択時に配置されるミノ 4 セルと、現在のタネを同時に表示する。
 *
 * 表示内容:
 * - ミノ色: 配置されるミノ 4 セル（ライン消し前の pre-clear 盤面のうちミノ部分）
 * - 薄いグレー: currentTane のセル（下敷きとなる既存ブロック）
 * - 黒: 空きセル
 *
 * 参考実装の PNG 画像（{mino}{cur}{next}.png）を動的描画で再現する。
 */
export function ChoicePreview({
  mino,
  currentTane,
  nextTane,
  size = 12,
  placedCellsOverride,
}: ChoicePreviewProps) {
  const preview = useMemo(() => {
    const currentCells = new Set(getTaneCells(currentTane));
    const placedCells =
      placedCellsOverride ??
      computePlacedMinoCells(mino, currentTane, nextTane);
    // フォールバック: 位置確定できなかった場合は nextTane で代替表示
    const minoCells =
      placedCells.size > 0 ? placedCells : new Set(getTaneCells(nextTane));
    const minoColor = MINO_COLORS[mino];

    const rows = 4;
    const cols = 4;
    const startRow = 16;
    const grid: { color: string }[] = [];

    for (let r = 0; r < rows; r++) {
      for (let c = 0; c < cols; c++) {
        const cellNum = (startRow + r) * 10 + (PLAY_AREA_START + c);
        let color = "#111118";

        if (minoCells.has(cellNum)) {
          color = minoColor;
        } else if (currentCells.has(cellNum)) {
          color = "#4a4a55";
        }

        grid.push({ color });
      }
    }

    return grid;
  }, [mino, currentTane, nextTane, placedCellsOverride]);

  return (
    <div
      className="grid rounded overflow-hidden border border-border/50"
      style={{
        gridTemplateColumns: `repeat(4, ${size}px)`,
        gridTemplateRows: `repeat(4, ${size}px)`,
        gap: "1px",
        backgroundColor: "#222230",
      }}
    >
      {preview.map((cell, i) => (
        <div key={i} style={{ backgroundColor: cell.color }} />
      ))}
    </div>
  );
}
