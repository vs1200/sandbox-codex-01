import { MINO_COLORS, type MinoType } from "../../logic/types";

/**
 * 現在のミノの形状データ（4列エリア内のセル位置）
 * row 0-1 の列3-6 の相対位置を返す
 */
function getMinoShape(mino: MinoType): number[] {
  const col = (c: number) => c; // 0-based in 4-col area
  switch (mino) {
    case "i":
      return [col(0), col(1), col(2), col(3)]; // row 0: all 4 cols
    case "o":
      return [col(1), col(2), col(1) + 4, col(2) + 4]; // row 0: col 1,2 + row 1: col 1,2
    case "j":
      return [col(0), col(0) + 4, col(1) + 4, col(2) + 4]; // row 0: col 0 + row 1: col 0,1,2
    case "l":
      return [col(2), col(0) + 4, col(1) + 4, col(2) + 4]; // row 0: col 2 + row 1: col 0,1,2
    case "s":
      return [col(1), col(2), col(0) + 4, col(1) + 4]; // row 0: col 1,2 + row 1: col 0,1
    case "z":
      return [col(0), col(1), col(1) + 4, col(2) + 4]; // row 0: col 0,1 + row 1: col 1,2
    case "t":
      return [col(1), col(0) + 4, col(1) + 4, col(2) + 4]; // row 0: col 1 + row 1: col 0,1,2
  }
}

interface MinoPreviewProps {
  mino: MinoType;
  size?: number;
}

export function MinoPreview({ mino, size = 16 }: MinoPreviewProps) {
  const shape = getMinoShape(mino);
  const color = MINO_COLORS[mino];

  return (
    <div
      className="grid gap-px"
      style={{
        gridTemplateColumns: `repeat(4, ${size}px)`,
        gridTemplateRows: `repeat(2, ${size}px)`,
      }}
    >
      {Array.from({ length: 8 }, (_, i) => (
        <div
          key={i}
          className="rounded-sm"
          style={{
            width: size,
            height: size,
            backgroundColor: shape.includes(i) ? color : "transparent",
          }}
        />
      ))}
    </div>
  );
}
