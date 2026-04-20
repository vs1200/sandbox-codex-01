import { useEffect, useState } from "react";

/**
 * デザイン基準サイズ (designWidth × designHeight) に対して、
 * 親要素の現在サイズに収まるよう等比拡縮するためのスケール値を返す。
 *
 * @param fillRatio 0.0〜1.0 の係数。1.0 で完全フィット、< 1.0 で周囲に余白を残す。
 */
export function useFitScale(
  containerRef: React.RefObject<HTMLElement | null>,
  designWidth: number,
  designHeight: number,
  fillRatio = 1,
): number {
  const [scale, setScale] = useState(1);

  useEffect(() => {
    const el = containerRef.current;
    if (!el) return;

    const update = () => {
      const rect = el.getBoundingClientRect();
      if (rect.width <= 0 || rect.height <= 0) return;
      const s =
        Math.min(rect.width / designWidth, rect.height / designHeight) *
        fillRatio;
      setScale(s);
    };

    update();
    const ro = new ResizeObserver(update);
    ro.observe(el);
    return () => ro.disconnect();
  }, [containerRef, designWidth, designHeight, fillRatio]);

  return scale;
}
