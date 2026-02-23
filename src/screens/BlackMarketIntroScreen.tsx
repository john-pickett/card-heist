import React from 'react';
import { ScrollView, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import theme from '../theme';

interface Props {
  onContinue: () => void;
}

export function BlackMarketIntroScreen({ onContinue }: Props) {
  return (
    <View style={styles.screen}>
      <ScrollView
        style={styles.scroll}
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
      >
        <Text style={styles.title}>BLACK MARKET</Text>
        <Text style={styles.subtitle}>Invitation Received</Text>

        <View style={styles.storyCard}>
          <Text style={styles.storyLead}>A note finds you before dawn.</Text>
          <Text style={styles.storyText}>
            It is tucked under your door, folded into a perfect square, sealed with black wax and
            no name. Inside: a hand-drawn key, an address that does not exist on any map you own,
            and a time written in green ink. When you arrive, the building is just a shuttered
            tailor shop. You knock anyway. A slot opens. Someone asks, "How many jobs?" You answer,
            "Five." The lock clicks before you finish the word.
          </Text>
          <Text style={styles.storyText}>
            Downstairs, behind bolts, curtains, and one suspiciously polite bodyguard, the real
            market hums to life. Tables of tools. People trading favors like currency. Every seller
            seems to know your face, but nobody says from where. A voice in the back laughs and
            says, "Took you long enough." Whatever this place is, you are in now.
          </Text>
        </View>

        <View style={styles.hintCard}>
          <Text style={styles.hintTitle}>Access granted</Text>
          <Text style={styles.hintText}>
            Spend your gold here between heists to stock up on tools for future runs.
          </Text>
        </View>
      </ScrollView>

      <View style={styles.footer}>
        <TouchableOpacity style={styles.continueBtn} onPress={onContinue} activeOpacity={0.8}>
          <Text style={styles.continueBtnText}>Continue to Market</Text>
        </TouchableOpacity>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  screen: {
    flex: 1,
    backgroundColor: theme.colors.bgPrimary,
  },
  scroll: {
    flex: 1,
  },
  scrollContent: {
    paddingTop: theme.spacing.forty,
    paddingBottom: theme.spacing.xxl,
    paddingHorizontal: theme.spacing.xxl,
    alignItems: 'center',
  },
  title: {
    color: theme.colors.gold,
    fontSize: theme.fontSizes.h1,
    fontWeight: theme.fontWeights.black,
    letterSpacing: 2,
    textAlign: 'center',
  },
  subtitle: {
    color: theme.colors.textMuted,
    fontSize: theme.fontSizes.md,
    fontWeight: theme.fontWeights.bold,
    letterSpacing: 1.5,
    marginTop: theme.spacing.xs,
    marginBottom: theme.spacing.xl,
    textTransform: 'uppercase',
  },
  storyCard: {
    width: '100%',
    backgroundColor: theme.colors.bgStory,
    borderRadius: theme.radii.xl,
    borderWidth: theme.borderWidths.thin,
    borderColor: theme.colors.borderLight,
    paddingHorizontal: theme.spacing.lg,
    paddingVertical: theme.spacing.lg,
    marginBottom: theme.spacing.lg,
  },
  storyLead: {
    color: theme.colors.gold,
    fontSize: theme.fontSizes.basePlus,
    fontWeight: theme.fontWeights.heavy,
    marginBottom: theme.spacing.sm,
  },
  storyText: {
    color: theme.colors.text85,
    fontSize: theme.fontSizes.base,
    lineHeight: 22,
    marginBottom: theme.spacing.md,
  },
  hintCard: {
    width: '100%',
    backgroundColor: theme.colors.bgOverlaySoft,
    borderRadius: theme.radii.lg,
    borderWidth: theme.borderWidths.thin,
    borderColor: theme.colors.borderSubtle,
    paddingHorizontal: theme.spacing.lg,
    paddingVertical: theme.spacing.md,
  },
  hintTitle: {
    color: theme.colors.greenPastel,
    fontSize: theme.fontSizes.m,
    fontWeight: theme.fontWeights.heavy,
    marginBottom: theme.spacing.xs,
    textTransform: 'uppercase',
    letterSpacing: 1,
  },
  hintText: {
    color: theme.colors.text78,
    fontSize: theme.fontSizes.md,
    lineHeight: 18,
  },
  footer: {
    paddingHorizontal: theme.spacing.xxl,
    paddingTop: theme.spacing.md,
    paddingBottom: theme.spacing.xxl,
    borderTopWidth: theme.borderWidths.thin,
    borderTopColor: theme.colors.borderSubtle,
    backgroundColor: theme.colors.bgPrimary,
  },
  continueBtn: {
    backgroundColor: theme.colors.greenPrimary,
    borderRadius: theme.radii.lg,
    paddingVertical: theme.spacing.lg,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: theme.borderWidths.thin,
    borderColor: theme.colors.borderMedium,
  },
  continueBtnText: {
    color: theme.colors.textPrimary,
    fontSize: theme.fontSizes.subtitle,
    fontWeight: theme.fontWeights.heavy,
    letterSpacing: 0.5,
  },
});
