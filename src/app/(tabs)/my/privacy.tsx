import Ionicons from '@expo/vector-icons/Ionicons';
import { StyleSheet, Text, View } from 'react-native';
import { Screen } from '@/components/Screen';
import { Section } from '@/components/Section';
import {
  PRIVACY_EFFECTIVE_DATE,
  PRIVACY_SECTIONS,
} from '@/features/my/privacy';
import { colors, radius, spacing } from '@/theme';

// 개인정보 처리방침 (시연용 초안). 내용은 features/my/privacy.ts
export default function PrivacyScreen() {
  return (
    <Screen edges={[]}>
      <View style={styles.notice} testID="privacy-draft-notice">
        <Ionicons
          name="document-text-outline"
          size={18}
          color={colors.warning}
        />
        <Text style={styles.noticeText}>
          메이커톤 시연용 초안이에요. 정식 출시 전에 전문가 검토를 거쳐 다시
          알려 드릴게요.
        </Text>
      </View>

      <Text style={styles.lead}>
        메아리는 일기와 사진이 아주 민감한 정보라는 걸 알고 있어요. 꼭 필요한
        만큼만 모으고, 내가 확정한 기록만 AI 기억으로 쓰며, 언제든 지울 수 있게
        만들었어요.
      </Text>

      {PRIVACY_SECTIONS.map((s) => (
        <Section key={s.title} title={s.title}>
          {s.body ? <Text style={styles.body}>{s.body}</Text> : null}
          {s.items ? (
            <View style={styles.list}>
              {s.items.map((item) => (
                <View key={item} style={styles.item}>
                  <Text style={styles.bullet}>•</Text>
                  <Text style={styles.itemText}>{item}</Text>
                </View>
              ))}
            </View>
          ) : null}
        </Section>
      ))}

      <Text style={styles.footer}>시행일 {PRIVACY_EFFECTIVE_DATE}</Text>
    </Screen>
  );
}

const styles = StyleSheet.create({
  notice: {
    flexDirection: 'row',
    gap: spacing.sm,
    padding: spacing.md,
    borderRadius: radius.md,
    backgroundColor: colors.warningSoft,
  },
  noticeText: { flex: 1, fontSize: 13, lineHeight: 19, color: colors.warning },
  lead: { fontSize: 15, lineHeight: 23, color: colors.text },
  body: { fontSize: 14, lineHeight: 21, color: colors.text },
  list: { gap: spacing.xs + 2 },
  item: { flexDirection: 'row', gap: spacing.sm },
  bullet: { fontSize: 14, lineHeight: 21, color: colors.textMuted },
  itemText: { flex: 1, fontSize: 14, lineHeight: 21, color: colors.text },
  footer: {
    fontSize: 12,
    color: colors.textMuted,
    textAlign: 'center',
    marginBottom: spacing.md,
  },
});
