import { PLAY_AREA_START } from "./types";

/**
 * タネ値からntj（十の位）とnti（一の位）を計算する
 */
export function parseTane(tane: number): { ntj: number; nti: number } {
  return {
    ntj: Math.floor(tane / 10),
    nti: tane % 10,
  };
}

/**
 * タネパターンに基づいてプレイエリアの充填セル位置を返す
 * セル番号は row * 10 + col 形式
 */
export function getTaneCells(tane: number): number[] {
  const { ntj, nti } = parseTane(tane);
  const cells: number[] = [];
  const col = (offset: number) => PLAY_AREA_START + offset;

  switch (ntj) {
    case 1:
      // 1列に3段積み
      {
        const c = col(nti - 1);
        cells.push(17 * 10 + c, 18 * 10 + c, 19 * 10 + c);
      }
      break;

    case 2:
    case 3:
    case 4:
    case 5: {
      // 1セル（中段 row18）+ 2セル（最下段 row19）
      // ntj=2→col3(offset0), ntj=3→col4(offset1), ntj=4→col5(offset2), ntj=5→col6(offset3)
      const midCol = col(ntj - 2);
      cells.push(18 * 10 + midCol);

      const pairs: [number, number][] = [
        [0, 1],
        [0, 2],
        [0, 3],
        [1, 2],
        [1, 3],
        [2, 3],
      ];
      const pair = pairs[nti - 1];
      cells.push(19 * 10 + col(pair[0]), 19 * 10 + col(pair[1]));
      break;
    }

    case 6: {
      // 2セル（中段 row18）+ 1セル（最下段 row19）
      const patterns: [number, number, number][] = [
        [0, 1, 0],
        [0, 1, 1],
        [1, 2, 1],
        [1, 2, 2],
        [2, 3, 2],
        [2, 3, 3],
        [1, 2, 0],
        [1, 2, 3],
      ];
      const p = patterns[nti - 1];
      cells.push(18 * 10 + col(p[0]), 18 * 10 + col(p[1]), 19 * 10 + col(p[2]));
      break;
    }

    case 7:
      // 最下段に3セル（1つ空き）
      for (let i = 0; i < 4; i++) {
        if (i !== nti - 1) {
          cells.push(19 * 10 + col(i));
        }
      }
      break;
  }

  return cells;
}

/**
 * 初期タネをランダムに選択する
 */
export function getRandomInitialTane(): number {
  const initials = [21, 23, 53, 56, 61, 66, 71, 74];
  return initials[Math.floor(Math.random() * initials.length)];
}
