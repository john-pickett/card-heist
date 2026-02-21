import React from 'react';
import { ScrollView, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import theme from '../theme';

interface Props {
  act1Gold: number;
  act2Gold: number;
  cumulativeGold: number;
  onContinue: () => void;
}

export function Act2BridgeScreen({
  act1Gold,
  act2Gold,
  cumulativeGold,
  onContinue,
}: Props) {
  return (
    <View style={styles.screen}>
      <ScrollView
        style={styles.scroll}
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
      >
        <Text style={styles.heading}>ACT 2 COMPLETE</Text>
        <Text style={styles.subheading}>CRACK THE VAULTS</Text>

        <View style={styles.storyBox}>
          <Text style={styles.storyTitle}>The vaults are open.</Text>
          <Text style={styles.storyText}>
            Cash is in hand and alarms are waking up the city. You are carrying{' '}
            <Text style={styles.storyGold}>{cumulativeGold} gold</Text> into the final stretch.
            One clean getaway keeps the haul. One mistake leaves it behind.
          </Text>
        </View>

        <View style={styles.panel}>
          <View style={styles.row}>
            <Text style={styles.label}>Act 1 gold</Text>
            <Text style={styles.value}>{act1Gold}</Text>
          </View>
          <View style={styles.row}>
            <Text style={styles.label}>Act 2 gold</Text>
            <Text style={styles.value}>{act2Gold}</Text>
          </View>
          <View style={styles.row}>
            <Text style={styles.label}>Run total so far</Text>
            <Text style={styles.bonus}>{cumulativeGold} gold</Text>
          </View>
        </View>

        <View style={styles.expectBox}>
          <Text style={styles.expectTitle}>What comes next</Text>
          <Text style={styles.expectText}>
            Act 3 is all escape. Your total gold becomes your stake, and your route decisions
            determine whether you keep the full payout or lose part of the take.
          </Text>
        </View>
      </ScrollView>

      <View style={styles.footer}>
        <TouchableOpacity style={styles.continueBtn} onPress={onContinue}>
          <Text style={styles.continueBtnText}>Continue to Act 3 →</Text>
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
    alignItems: 'center',
    paddingTop: theme.spacing.sixty,
    paddingHorizontal: theme.spacing.xxl,
    paddingBottom: theme.spacing.xxl,
  },
  footer: {
    paddingHorizontal: theme.spacing.xxl,
    paddingTop: theme.spacing.md,
    paddingBottom: theme.spacing.xxl,
    backgroundColor: theme.colors.bgPrimary,
    borderTopWidth: 1,
    borderTopColor: theme.colors.borderSubtle,
  },
  heading: {
    color: theme.colors.gold,
    fontSize: theme.fontSizes.h1,
    fontWeight: theme.fontWeights.black,
    letterSpacing: 2,
    marginBottom: theme.spacing.six,
  },
  subheading: {
    color: theme.colors.text50,
    fontSize: theme.fontSizes.md,
    fontWeight: theme.fontWeights.bold,
    letterSpacing: 2,
    marginBottom: theme.spacing.fourteen,
  },
  storyBox: {
    width: '100%',
    backgroundColor: theme.colors.bgStory,
    borderRadius: theme.radii.lg,
    paddingVertical: theme.spacing.md,
    paddingHorizontal: theme.spacing.fourteen,
    borderWidth: theme.borderWidths.thin,
    borderColor: theme.colors.borderLight,
    marginBottom: theme.spacing.fourteen,
  },
  storyTitle: {
    color: theme.colors.gold,
    fontSize: theme.fontSizes.base,
    fontWeight: theme.fontWeights.heavy,
    marginBottom: theme.spacing.xs,
  },
  storyText: {
    color: theme.colors.textBody,
    fontSize: theme.fontSizes.md,
    lineHeight: 19,
  },
  storyGold: {
    color: theme.colors.gold,
    fontWeight: theme.fontWeights.black,
  },
  panel: {
    backgroundColor: theme.colors.bgPanel,
    borderRadius: theme.radii.xl,
    padding: theme.spacing.xl,
    width: '100%',
    borderWidth: theme.borderWidths.thin,
    borderColor: theme.colors.borderFaint,
    gap: theme.spacing.fourteen,
    marginBottom: theme.spacing.fourteen,
  },
  row: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  label: {
    color: theme.colors.textMuted,
    fontSize: theme.fontSizes.base,
    fontWeight: theme.fontWeights.medium,
  },
  value: {
    color: theme.colors.textPrimary,
    fontSize: theme.fontSizes.title,
    fontWeight: theme.fontWeights.black,
  },
  bonus: {
    color: theme.colors.gold,
    fontSize: theme.fontSizes.title,
    fontWeight: theme.fontWeights.black,
  },
  expectBox: {
    width: '100%',
    backgroundColor: theme.colors.bgOverlaySoft,
    borderRadius: theme.radii.lg,
    paddingVertical: theme.spacing.md,
    paddingHorizontal: theme.spacing.fourteen,
    borderWidth: theme.borderWidths.thin,
    borderColor: theme.colors.borderFaint,
  },
  expectTitle: {
    color: theme.colors.gold,
    fontSize: theme.fontSizes.m,
    fontWeight: theme.fontWeights.heavy,
    marginBottom: theme.spacing.sm,
  },
  expectText: {
    color: theme.colors.text76,
    fontSize: theme.fontSizes.md,
    lineHeight: 18,
  },
  continueBtn: {
    backgroundColor: theme.colors.greenPrimary,
    borderRadius: theme.radii.lg,
    paddingVertical: theme.spacing.lg,
    alignItems: 'center',
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
