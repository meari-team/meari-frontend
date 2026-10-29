import { StyleSheet, Text, View } from 'react-native';
import { Screen } from '@/components/Screen';
import {
  PRIVACY_EFFECTIVE_DATE,
  PRIVACY_INTRO,
  PRIVACY_SECTIONS,
} from '@/features/my/privacy';
import { fonts, warm } from '@/theme';

// 개인정보 처리방침. 내용은 features/my/privacy.ts (조항별 문서)
export default function PrivacyScreen() {
  return (
    <Screen edges={[]} backgroundColor={warm.background}>
      <Text style={styles.intro} selectable>
        {PRIVACY_INTRO}
      </Text>

      {PRIVACY_SECTIONS.map((s) => (
        <View key={s.title} style={styles.section}>
          <Text style={styles.title}>{s.title}</Text>
          {s.body ? (
            <Text style={styles.body} selectable>
              {s.body}
            </Text>
          ) : null}
          {s.items ? (
            <View style={styles.list}>
              {s.items.map((item) => (
                <View key={item} style={styles.item}>
                  <Text style={styles.bullet}>·</Text>
                  <Text style={styles.itemText} selectable>
                    {item}
                  </Text>
                </View>
              ))}
            </View>
          ) : null}
          {s.note ? (
            <Text style={styles.note} selectable>
              {s.note}
            </Text>
          ) : null}
        </View>
      ))}

      <Text style={styles.footer}>시행일 {PRIVACY_EFFECTIVE_DATE}</Text>
    </Screen>
  );
}

const styles = StyleSheet.create({
  intro: {
    fontFamily: fonts.regular,
    fontSize: 14,
    lineHeight: 22,
    color: warm.ink,
  },
  // 조항마다 위에 얇은 줄
  section: {
    gap: 8,
    paddingTop: 16,
    borderTopWidth: 1,
    borderTopColor: warm.sand,
  },
  title: { fontFamily: fonts.semibold, fontSize: 15, color: warm.black },
  body: {
    fontFamily: fonts.regular,
    fontSize: 14,
    lineHeight: 22,
    color: warm.ink,
  },
  list: { gap: 6 },
  item: { flexDirection: 'row', gap: 6 },
  bullet: {
    fontFamily: fonts.bold,
    fontSize: 14,
    lineHeight: 22,
    color: warm.tan,
  },
  itemText: {
    flex: 1,
    fontFamily: fonts.regular,
    fontSize: 14,
    lineHeight: 22,
    color: warm.ink,
  },
  note: {
    fontFamily: fonts.regular,
    fontSize: 13,
    lineHeight: 20,
    color: warm.brown,
  },
  footer: {
    fontFamily: fonts.medium,
    fontSize: 12,
    color: warm.tan,
    textAlign: 'center',
    marginTop: 8,
    marginBottom: 16,
  },
});
