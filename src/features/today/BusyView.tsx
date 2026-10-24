import { useEffect, useState } from 'react';
import { StateView } from '@/components/StateView';

// AI 작업 중 로딩. 수 초 걸리므로 문구를 바꿔 가며 기다림을 덜 지루하게 한다
export function BusyView({ messages }: { messages: string[] }) {
  const [i, setI] = useState(0);
  useEffect(() => {
    const id = setInterval(() => setI((n) => (n + 1) % messages.length), 2500);
    return () => clearInterval(id);
  }, [messages.length]);
  return <StateView status="loading" message={messages[i]} />;
}

export const ANALYZE_MESSAGES = [
  '사진을 보고 있어요…',
  '어떤 하루였는지 살펴보는 중이에요…',
  '궁금한 점을 정리하고 있어요…',
];

export const GENERATE_MESSAGES = [
  '일기를 쓰고 있어요…',
  '오늘의 장면을 문장으로 옮기는 중이에요…',
  '거의 다 됐어요…',
];
