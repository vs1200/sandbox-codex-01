import type { MinoType } from "./types";
import { MINO_TYPES } from "./types";

/**
 * 7-bag ランダマイザー
 * 7種のミノを1セットとしてシャッフルし、順番に配る
 */
export function generateBag(): MinoType[] {
  const bag = [...MINO_TYPES];
  for (let i = bag.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    const tmp = bag[i];
    bag[i] = bag[j];
    bag[j] = tmp;
  }
  return bag;
}

/**
 * ミノキューを必要に応じて補充する
 * キュー内のミノが7個未満になったら新しいバッグを追加
 */
export function refillQueue(queue: MinoType[]): MinoType[] {
  if (queue.length < 7) {
    return [...queue, ...generateBag()];
  }
  return queue;
}
