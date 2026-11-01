import { router } from 'expo-router';
import { Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { useEchoes } from '@/api/echo';
import { errorMessage } from '@/api/errors';
import { StateView } from '@/components/StateView';
import { echoSender } from '@/lib/echo';
import { fonts, warm } from '@/theme';

// 받은 메아리: 최근 것부터. 안 읽은 것은 점으로 표시하고, 눌러서 다시 열 수 있다
export default function EchoesScreen() {
  const echoes = useEchoes();

  if (echoes.isPending) return <StateView status="loading" />;
  if (echoes.isError) {
    return (
      <StateView
        status="error"
        message={errorMessage(echoes.error)}
        onRetry={() => void echoes.refetch()}
      />
    );
  }
  if (echoes.data.items.length === 0) {
    return (
      <StateView
        status="empty"
        message="아직 도착한 메아리가 없어요. 기억하고 싶은 날을 북마크하고 마이페이지에서 메아리 알림을 켜 보세요."
      />
    );
  }

  return (
    <ScrollView style={styles.screen} contentContainerStyle={styles.content}>
      {echoes.data.items.map((e) => (
        <Pressable
          key={e.id}
          accessibilityRole="button"
          testID={`echo-item-${e.entryDate}`}
          onPress={() =>
            router.push({
              pathname: '/past-self/echo/[echoId]',
              params: { echoId: e.id },
            })
          }
          style={({ pressed }) => [styles.row, pressed && styles.pressed]}
        >
          <View style={styles.head}>
            {!e.readAt ? <View style={styles.dot} /> : null}
            <Text style={styles.sender}>{echoSender(e.entryDate)}</Text>
            <Text style={styles.when}>{arrivedLabel(e.createdAt)}</Text>
          </View>
          <Text style={styles.preview} numberOfLines={2}>
            {e.preview}
          </Text>
        </Pressable>
      ))}
    </ScrollView>
  );
}

// 받은 날: "11월 1일"
const arrivedLabel = (iso: string) => {
  const d = new Date(iso);
  return `${d.getMonth() + 1}월 ${d.getDate()}일`;
};

const styles = StyleSheet.create({
  screen: { flex: 1, backgroundColor: warm.background },
  content: { paddingHorizontal: 20, paddingBottom: 30 },
  row: {
    gap: 6,
    paddingVertical: 18,
    borderBottomWidth: 1,
    borderBottomColor: warm.sand,
  },
  pressed: { opacity: 0.7 },
  head: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  dot: { width: 8, height: 8, borderRadius: 4, backgroundColor: warm.clay },
  sender: { flex: 1, fontFamily: fonts.bold, fontSize: 17, color: warm.black },
  when: { fontFamily: fonts.semibold, fontSize: 12, color: warm.tan },
  preview: {
    fontFamily: fonts.semibold,
    fontSize: 13,
    lineHeight: 19,
    color: warm.brown,
  },
});
