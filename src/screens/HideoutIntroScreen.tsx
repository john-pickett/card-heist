import React from 'react';
import { ScrollView, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import theme from '../theme';

interface Props {
  availableGold: number;
  price: number;
  onPurchase: () => void;
}

export function HideoutIntroScreen({ availableGold, price, onPurchase }: Props) {
  const canAfford = availableGold >= price;

  return (
    <View style={styles.screen}>
      <ScrollView
        style={styles.scroll}
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
      >
        <Text style={styles.title}>THE HIDEOUT</Text>
        <Text style={styles.subtitle}>Word on the street</Text>

        <View style={styles.storyCard}>
          <Text style={styles.storyLead}>Your fence mentions it the third time you meet.</Text>
          <Text style={styles.storyText}>
            A building your contacts have held for years — no deed under any name you'd recognize,
            no address that shows up in any system. A disused print shop on a dead-end block,
            its back rooms long converted into something quieter. A place to lie low between jobs,
            plan the next run without looking over your shoulder, and bring in crew you actually trust.
          </Text>
          <Text style={styles.storyText}>
            "You've earned it," she says. "Price is {price.toLocaleString()} gold. One-time. No negotiation."
          </Text>
        </View>

        <View style={styles.hintCard}>
          <Text style={styles.hintTitle}>Safe house acquisition</Text>
          <Text style={styles.hintText}>
            Costs {price.toLocaleString()} gold. You have {availableGold.toLocaleString()} gold.
          </Text>
          {!canAfford && (
            <Text style={styles.hintWarning}>
              You need {(price - availableGold).toLocaleString()} more gold to secure the hideout.
            </Text>
          )}
        </View>
      </ScrollView>

      <View style={styles.footer}>
        <TouchableOpacity
          style={[styles.continueBtn, !canAfford && styles.continueBtnDisabled]}
          onPress={onPurchase}
          activeOpacity={0.8}
          disabled={!canAfford}
        >
          <Text style={[styles.continueBtnText, !canAfford && styles.continueBtnTextDisabled]}>
            {canAfford ? `Pay ${price.toLocaleString()} Gold` : `Need ${price.toLocaleString()} Gold`}
          </Text>
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
  hintWarning: {
    color: theme.colors.gold,
    fontSize: theme.fontSizes.sm,
    fontWeight: theme.fontWeights.bold,
    marginTop: theme.spacing.sm,
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
  continueBtnDisabled: {
    backgroundColor: theme.colors.bgOverlaySoft,
    borderColor: theme.colors.borderSubtle,
  },
  continueBtnText: {
    color: theme.colors.textPrimary,
    fontSize: theme.fontSizes.subtitle,
    fontWeight: theme.fontWeights.heavy,
    letterSpacing: 0.5,
  },
  continueBtnTextDisabled: {
    color: theme.colors.textMuted,
  },
});
