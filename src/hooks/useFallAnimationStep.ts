import { useEffect, useState } from "react";
import { type AnimationState, FALL_STEP_MS } from "../logic/types";

/**
 * 落下アニメーションのステップ進行を管理するカスタム hook。
 * `animation.phase === "placing"` の間 `step` を 0 → frames.length - 1 へ
 * `FALL_STEP_MS` 間隔で 1 ずつ進める。
 *
 * @returns step 現在の落下ステップ (0 始まり)
 * @returns isLanded 着地フレーム以降か (= 最終フレーム到達後)
 */
export function useFallAnimationStep(animation: AnimationState | null): {
  step: number;
  isLanded: boolean;
} {
  const [step, setStep] = useState(0);

  // placing 中の prevTane が key。新しい placing が始まる度にリセット。
  const placingKey = animation?.phase === "placing" ? animation.prevTane : null;
  const target =
    animation?.frames && animation.frames.length > 0
      ? animation.frames.length - 1
      : 0;

  useEffect(() => {
    if (placingKey === null) {
      setStep(0);
      return;
    }
    setStep(0);
    if (target <= 0) return;
    let i = 0;
    const id = window.setInterval(() => {
      i += 1;
      setStep(i);
      if (i >= target) {
        window.clearInterval(id);
      }
    }, FALL_STEP_MS);
    return () => window.clearInterval(id);
  }, [placingKey, target]);

  const isLanded = animation?.phase === "placing" && step >= target;
  return { step, isLanded };
}
