import { useEffect, useState } from 'react';
import { AccessibilityInfo } from 'react-native';
import {
  charsPerTick,
  splitChars,
  TYPE_TICK_MS,
} from '@/features/past-self/typewriter-logic';

// 새로 받은 답장을 한 글자씩 쳐지듯 보여 준다. enabled가 false면 처음부터 전체를 보여 준다.
// 동작 줄이기(접근성)를 켠 사람에게는 바로 전체를 보여 준다. finish()로 남은 글자를 한 번에
export function useTypewriter(
  text: string,
  enabled: boolean,
  onTick?: () => void,
) {
  const chars = splitChars(text);
  const total = chars.length;
  const [shown, setShown] = useState(enabled ? 0 : total);
  const [skipped, setSkipped] = useState(false);

  useEffect(() => {
    if (!enabled) return;
    let cancelled = false;
    void AccessibilityInfo.isReduceMotionEnabled().then((reduce) => {
      if (reduce && !cancelled) setSkipped(true);
    });
    const step = charsPerTick(total);
    let n = 0;
    const timer = setInterval(() => {
      n = Math.min(total, n + step);
      setShown(n);
      onTick?.();
      if (n >= total) clearInterval(timer);
    }, TYPE_TICK_MS);
    return () => {
      cancelled = true;
      clearInterval(timer);
    };
    // onTick은 스크롤용이라 바뀌어도 다시 시작하지 않는다
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [enabled, total]);

  const done = !enabled || skipped || shown >= total;
  return {
    text: done ? text : chars.slice(0, shown).join(''),
    done,
    finish: () => setSkipped(true),
  };
}
