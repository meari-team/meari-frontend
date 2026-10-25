// 타자 효과 계산 (화면과 분리해 테스트한다)

// 30ms마다 몇 글자씩. 긴 답도 약 3.6초(120번) 안에 끝나도록 한 번에 여러 글자를 낸다
export const TYPE_TICK_MS = 30;
export const charsPerTick = (length: number) =>
  Math.max(1, Math.ceil(length / 120));

// 한글 한 음절·이모지를 한 글자로 센다
export const splitChars = (text: string) => Array.from(text);

// 타자로 보여 줄 메시지: 보내기 직전에 이미 있던 메시지가 아닌, 목록 맨 끝의 AI 답장
export function shouldType(
  message: { id: string; role: string },
  isLast: boolean,
  before: ReadonlySet<string> | null,
): boolean {
  return (
    before !== null &&
    message.role === 'ASSISTANT' &&
    isLast &&
    !before.has(message.id)
  );
}
