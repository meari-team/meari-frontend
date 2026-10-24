import Ionicons from '@expo/vector-icons/Ionicons';
import { useState } from 'react';
import { Modal, Pressable, StyleSheet, Text, View } from 'react-native';
import { canGoNextMonth, type YearMonth } from '@/lib/calendar';
import { colors, radius, spacing } from '@/theme';

type Props = {
  visible: boolean;
  value: YearMonth;
  today: string;
  onSelect: (month: YearMonth) => void;
  onClose: () => void;
};

// 상단 "2026. 10 ⌄"을 누르면 뜨는 연·월 고르기 (일정 때문에 앞으로 12개월까지)
export function MonthPicker({
  visible,
  value,
  today,
  onSelect,
  onClose,
}: Props) {
  const [year, setYear] = useState(value.year);
  // 열 때마다 지금 보고 있는 해에서 시작한다
  const [seen, setSeen] = useState(visible);
  if (visible !== seen) {
    setSeen(visible);
    if (visible) setYear(value.year);
  }
  const canNextYear = canGoNextMonth({ year, month: 12 }, today);

  return (
    <Modal
      visible={visible}
      transparent
      animationType="fade"
      onRequestClose={onClose}
    >
      <Pressable
        style={styles.backdrop}
        accessibilityRole="button"
        accessibilityLabel="닫기"
        onPress={onClose}
      >
        {/* 카드 안을 눌러도 닫히지 않게 한다 */}
        <Pressable style={styles.card} onPress={() => {}}>
          <View style={styles.yearRow}>
            <Pressable
              accessibilityRole="button"
              accessibilityLabel="이전 해"
              hitSlop={12}
              onPress={() => setYear((y) => y - 1)}
            >
              <Ionicons name="chevron-back" size={22} color={colors.text} />
            </Pressable>
            <Text style={styles.year}>{year}</Text>
            <Pressable
              accessibilityRole="button"
              accessibilityLabel="다음 해"
              accessibilityState={{ disabled: !canNextYear }}
              disabled={!canNextYear}
              hitSlop={12}
              onPress={() => setYear((y) => y + 1)}
            >
              <Ionicons
                name="chevron-forward"
                size={22}
                color={canNextYear ? colors.text : colors.disabled}
              />
            </Pressable>
          </View>
          <View style={styles.grid}>
            {Array.from({ length: 12 }, (_, i) => i + 1).map((month) => {
              const ym = { year, month };
              const enabled = canGoNextMonth(ym, today);
              const current = year === value.year && month === value.month;
              return (
                <Pressable
                  key={month}
                  testID={`pick-month-${month}`}
                  accessibilityRole="button"
                  accessibilityState={{ disabled: !enabled, selected: current }}
                  disabled={!enabled}
                  onPress={() => onSelect(ym)}
                  style={[styles.month, current && styles.monthCurrent]}
                >
                  <Text
                    style={[
                      styles.monthText,
                      current && styles.monthTextCurrent,
                      !enabled && styles.monthTextDisabled,
                    ]}
                  >
                    {month}월
                  </Text>
                </Pressable>
              );
            })}
          </View>
        </Pressable>
      </Pressable>
    </Modal>
  );
}

const styles = StyleSheet.create({
  backdrop: {
    flex: 1,
    justifyContent: 'center',
    padding: spacing.lg,
    backgroundColor: 'rgba(0,0,0,0.3)',
  },
  card: {
    gap: spacing.md,
    padding: spacing.lg,
    borderRadius: radius.md * 2,
    backgroundColor: colors.surface,
  },
  yearRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  year: { fontSize: 20, fontWeight: '700', color: colors.text },
  grid: { flexDirection: 'row', flexWrap: 'wrap', rowGap: spacing.sm },
  month: {
    width: '25%',
    alignItems: 'center',
    paddingVertical: spacing.sm + 4,
    borderRadius: radius.pill,
  },
  monthCurrent: { backgroundColor: colors.text },
  monthText: { fontSize: 16, color: colors.text },
  monthTextCurrent: { color: colors.surface, fontWeight: '700' },
  monthTextDisabled: { color: colors.disabled },
});
