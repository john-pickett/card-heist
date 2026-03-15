import React from 'react';
import { StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import theme from '../theme';

interface Props {
  onBack: () => void;
}

export function HideoutCrewScreen({ onBack }: Props) {
  return (
    <View style={styles.screen}>
      <TouchableOpacity style={styles.backBtn} onPress={onBack} activeOpacity={0.7}>
        <Text style={styles.backArrow}>‹</Text>
        <Text style={styles.backLabel}>Hideout</Text>
      </TouchableOpacity>

      <Text style={styles.title}>CREW</Text>

      <View style={styles.placeholderCard}>
        <Text style={styles.placeholderBody}>
          Coming soon — hire and manage your crew. Each member brings a passive perk to your runs, from better odds to extra time on the clock.
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
  backBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    alignSelf: 'flex-start',
    marginBottom: theme.spacing.xl,
    paddingVertical: theme.spacing.xs,
  },
  backArrow: {
    color: theme.colors.greenPastel,
    fontSize: theme.fontSizes.xxl,
    fontWeight: theme.fontWeights.bold,
    marginRight: theme.spacing.xs,
    lineHeight: 28,
  },
  backLabel: {
    color: theme.colors.greenPastel,
    fontSize: theme.fontSizes.base,
    fontWeight: theme.fontWeights.bold,
  },
  title: {
    color: theme.colors.textPrimary,
    fontSize: theme.fontSizes.xl,
    fontWeight: theme.fontWeights.black,
    letterSpacing: 3,
    marginBottom: theme.spacing.xl,
    textAlign: 'center',
  },
  placeholderCard: {
    width: '100%',
    borderRadius: theme.radii.lg,
    borderWidth: theme.borderWidths.thin,
    borderColor: theme.colors.borderLight,
    backgroundColor: theme.colors.bgPanel,
    paddingVertical: theme.spacing.xxl,
    paddingHorizontal: theme.spacing.lg,
    alignItems: 'center',
    justifyContent: 'center',
    minHeight: 180,
  },
  placeholderBody: {
    color: theme.colors.text72,
    fontSize: theme.fontSizes.base,
    textAlign: 'center',
    lineHeight: 22,
    maxWidth: 280,
  },
});
