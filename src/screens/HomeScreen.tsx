import React from 'react';
import { StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import theme from '../theme';

interface Props {
  onStartGame: () => void;
}

export function HomeScreen({ onStartGame }: Props) {
  return (
    <View style={styles.screen}>
      <Text style={styles.title}>CARD HEIST</Text>

      <View style={styles.introBox}>
        <Text style={styles.introTitle}>Welcome to the crew.</Text>
        <Text style={styles.introText}>
          Tonight is all precision and nerve: slip past security, crack the vaults, and race out
          before the heat closes in. Each act raises the pressure, so expect smart card play,
          tight decisions, and one final push to get away clean.
        </Text>
      </View>

      <TouchableOpacity style={styles.startBtn} onPress={onStartGame}>
        <Text style={styles.startBtnText}>START HEIST</Text>
      </TouchableOpacity>

      <View style={styles.panel}>
        <Text style={styles.actTitle}>ACT 1 — SNEAK IN</Text>
        <Text style={styles.actDesc}>
          Place your cards to crack security codes and unlock each area of the bank.
        </Text>

        <View style={styles.divider} />

        <Text style={styles.actTitle}>ACT 2 — CRACK THE VAULTS</Text>
        <Text style={styles.actDesc}>
          Assign drawn cards to three vaults. Hit targets exactly for double points.
        </Text>

        <View style={styles.divider} />

        <Text style={styles.actTitle}>ACT 3 — ESCAPE</Text>
        <Text style={styles.actDesc}>
          Combine your scores from both acts and make your getaway.
        </Text>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  screen: {
    flex: 1,
    backgroundColor: theme.colors.bgPrimary,
    paddingHorizontal: theme.spacing.xl,
    paddingTop: theme.spacing.fourteen,
    alignItems: 'center',
  },
  title: {
    color: theme.colors.gold,
    fontSize: theme.fontSizes.hero,
    fontWeight: theme.fontWeights.black,
    letterSpacing: 4,
    marginBottom: theme.spacing.lg,
  },
  introBox: {
    width: '100%',
    backgroundColor: theme.colors.bgStory,
    borderRadius: theme.radii.lg,
    paddingVertical: theme.spacing.fourteen,
    paddingHorizontal: theme.spacing.lg,
    borderWidth: theme.borderWidths.thin,
    borderColor: theme.colors.borderLight,
    marginBottom: theme.spacing.eighteen,
  },
  introTitle: {
    color: theme.colors.gold,
    fontSize: theme.fontSizes.subtitle,
    fontWeight: theme.fontWeights.heavy,
    marginBottom: theme.spacing.six,
  },
  introText: {
    color: theme.colors.textBody,
    fontSize: theme.fontSizes.md,
    lineHeight: 19,
  },
  panel: {
    backgroundColor: theme.colors.bgPanel,
    borderRadius: theme.radii.xl,
    padding: theme.spacing.xl,
    width: '100%',
    borderWidth: theme.borderWidths.thin,
    borderColor: theme.colors.borderFaint,
    marginBottom: theme.spacing.xxxl,
  },
  actTitle: {
    color: theme.colors.gold,
    fontSize: theme.fontSizes.md,
    fontWeight: theme.fontWeights.heavy,
    letterSpacing: 1,
    marginBottom: theme.spacing.six,
  },
  actDesc: {
    color: theme.colors.textMuted,
    fontSize: theme.fontSizes.md,
    lineHeight: 19,
  },
  divider: {
    height: 1,
    backgroundColor: theme.colors.borderFaint,
    marginVertical: theme.spacing.fourteen,
  },
  startBtn: {
    backgroundColor: theme.colors.greenPrimary,
    borderRadius: theme.radii.lg,
    paddingVertical: theme.spacing.lg,
    paddingHorizontal: theme.spacing.xl,
    borderWidth: theme.borderWidths.thin,
    borderColor: theme.colors.borderMedium,
    marginBottom: theme.spacing.xl
  },
  startBtnText: {
    color: theme.colors.textPrimary,
    fontSize: theme.fontSizes.basePlus,
    fontWeight: theme.fontWeights.black,
    letterSpacing: 2,
  },
});
