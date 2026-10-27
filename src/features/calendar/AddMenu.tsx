import Ionicons from '@expo/vector-icons/Ionicons';
import { router, type Href } from 'expo-router';
import { useEffect, useState } from 'react';
import {
  Animated,
  BackHandler,
  Easing,
  Pressable,
  StyleSheet,
  Text,
  View,
} from 'react-native';
import { diaryActionOf } from '@/lib/calendar';
import { colors, radius, spacing } from '@/theme';

// 캘린더 + 버튼. 누르면 위로 두 가지가 펼쳐진다: 일정 추가 / 이날 일기 쓰기(상태에 따라 이어 쓰기·보기)
// 배경을 누르거나 다시 누르면(×) 닫힌다
export function AddMenu({
  date,
  today,
  entryStatus,
  onAddSchedule,
}: {
  date: string;
  today: string;
  entryStatus?: string;
  onAddSchedule: () => void;
}) {
  const [open, setOpen] = useState(false);
  const [progress] = useState(() => new Animated.Value(0));

  useEffect(() => {
    Animated.timing(progress, {
      toValue: open ? 1 : 0,
      duration: open ? 220 : 160,
      easing: open ? Easing.out(Easing.back(1.6)) : Easing.in(Easing.quad),
      useNativeDriver: true,
    }).start();
  }, [open, progress]);

  // 안드로이드 뒤로 가기는 메뉴부터 닫는다
  useEffect(() => {
    if (!open) return;
    const sub = BackHandler.addEventListener('hardwareBackPress', () => {
      setOpen(false);
      return true;
    });
    return () => sub.remove();
  }, [open]);

  const diary = diaryActionOf(date, today, entryStatus);
  const choose = (action: () => void) => {
    setOpen(false);
    action();
  };

  // 아래(+에 가까운) 항목부터 조금씩 늦게 떠오른다
  const itemStyle = (index: number) => {
    const start = index * 0.15;
    const t = progress.interpolate({
      inputRange: [start, Math.min(1, start + 0.85)],
      outputRange: [0, 1],
      extrapolate: 'clamp',
    });
    return {
      opacity: t,
      transform: [
        {
          translateY: t.interpolate({
            inputRange: [0, 1],
            outputRange: [18, 0],
          }),
        },
        {
          scale: t.interpolate({ inputRange: [0, 1], outputRange: [0.85, 1] }),
        },
      ],
    };
  };

  return (
    <>
      <Animated.View
        pointerEvents={open ? 'auto' : 'none'}
        style={[styles.backdrop, { opacity: progress }]}
      >
        <Pressable
          style={StyleSheet.absoluteFill}
          accessibilityLabel="추가 메뉴 닫기"
          onPress={() => setOpen(false)}
        />
      </Animated.View>

      <View style={styles.anchor} pointerEvents="box-none">
        <View style={styles.items} pointerEvents={open ? 'box-none' : 'none'}>
          <Animated.View style={itemStyle(1)}>
            <MenuItem
              testID="add-diary"
              icon="create-outline"
              label={diary.label}
              disabled={diary.kind === 'future'}
              onPress={() =>
                diary.kind !== 'future' &&
                choose(() => router.push(diary.href as Href))
              }
            />
          </Animated.View>
          <Animated.View style={itemStyle(0)}>
            <MenuItem
              testID="add-schedule"
              icon="calendar-outline"
              label="일정 추가"
              onPress={() => choose(onAddSchedule)}
            />
          </Animated.View>
        </View>

        <Pressable
          testID="add-fab"
          accessibilityRole="button"
          accessibilityLabel={open ? '추가 메뉴 닫기' : '추가 메뉴 열기'}
          accessibilityState={{ expanded: open }}
          onPress={() => setOpen((v) => !v)}
          style={({ pressed }) => [styles.fab, pressed && styles.pressed]}
        >
          <Animated.View
            style={{
              transform: [
                {
                  rotate: progress.interpolate({
                    inputRange: [0, 1],
                    outputRange: ['0deg', '45deg'],
                  }),
                },
              ],
            }}
          >
            <Ionicons name="add" size={30} color={colors.primaryText} />
          </Animated.View>
        </Pressable>
      </View>
    </>
  );
}

function MenuItem({
  icon,
  label,
  onPress,
  disabled = false,
  testID,
}: {
  icon: 'create-outline' | 'calendar-outline';
  label: string;
  onPress: () => void;
  disabled?: boolean;
  testID?: string;
}) {
  return (
    <Pressable
      testID={testID}
      accessibilityRole="button"
      accessibilityLabel={label}
      accessibilityState={{ disabled }}
      disabled={disabled}
      onPress={onPress}
      style={({ pressed }) => [styles.item, pressed && styles.pressed]}
    >
      <View style={styles.label}>
        <Text style={[styles.labelText, disabled && styles.disabledText]}>
          {label}
        </Text>
      </View>
      <View style={[styles.mini, disabled && styles.miniDisabled]}>
        <Ionicons
          name={icon}
          size={21}
          color={disabled ? colors.disabled : colors.primary}
        />
      </View>
    </Pressable>
  );
}

const FAB = 58;
const MINI = 46;

const shadow = {
  shadowColor: '#000',
  shadowOpacity: 0.12,
  shadowRadius: 8,
  shadowOffset: { width: 0, height: 2 },
  elevation: 4,
};

const styles = StyleSheet.create({
  backdrop: {
    ...StyleSheet.absoluteFill,
    backgroundColor: 'rgba(31, 29, 26, 0.32)',
  },
  anchor: {
    position: 'absolute',
    right: spacing.lg,
    bottom: spacing.md,
    alignItems: 'flex-end',
  },
  items: {
    alignItems: 'flex-end',
    gap: spacing.sm + 4,
    marginBottom: spacing.md,
    // 미니 버튼을 + 버튼 가운데에 맞춘다
    marginRight: (FAB - MINI) / 2,
  },
  item: { flexDirection: 'row', alignItems: 'center', gap: spacing.sm + 2 },
  label: {
    backgroundColor: colors.surface,
    borderRadius: radius.pill,
    paddingVertical: spacing.sm,
    paddingHorizontal: spacing.md,
    ...shadow,
  },
  labelText: { fontSize: 15, fontWeight: '600', color: colors.text },
  disabledText: { color: colors.textMuted, fontWeight: '500' },
  mini: {
    width: MINI,
    height: MINI,
    borderRadius: MINI / 2,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: colors.surface,
    ...shadow,
  },
  miniDisabled: { backgroundColor: colors.surfaceMuted },
  fab: {
    width: FAB,
    height: FAB,
    borderRadius: FAB / 2,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: colors.primary,
    shadowColor: '#000',
    shadowOpacity: 0.18,
    shadowRadius: 10,
    shadowOffset: { width: 0, height: 4 },
    elevation: 6,
  },
  pressed: { opacity: 0.7 },
});
