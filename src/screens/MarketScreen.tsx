import React from 'react';
import { StyleSheet, Text, View } from 'react-native';
import { useHistoryStore } from '../store/historyStore';
import theme from '../theme';

export function MarketScreen() {
  const lifetimeGold = useHistoryStore(s => s.lifetimeGold);

  return (
    <View style={styles.screen}>
      <Text style={styles.title}>MARKET</Text>

      <View style={styles.walletCard}>
        <Text style={styles.walletLabel}>GOLD ON HAND</Text>
        <Text style={styles.walletAmount}>{lifetimeGold}</Text>
        <Text style={styles.walletUnit}>gold</Text>
      </View>

      <View style={styles.shopPlaceholder}>
        <Text style={styles.shopIcon}>🏪</Text>
        <Text style={styles.shopTitle}>Shop Coming Soon</Text>
        <Text style={styles.shopText}>
          Spend your gold on upgrades, perks, and advantages for future heists.
        </Text>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  screen: {
    flex: 1,
    backgroundColor: theme.colors.bgPrimary,
    alignItems: 'center',
    paddingTop: theme.spacing.sixty,
    paddingHorizontal: theme.spacing.xxl,
  },
  title: {
    color: theme.colors.textPrimary,
    fontSize: theme.fontSizes.xl,
    fontWeight: theme.fontWeights.black,
    letterSpacing: 3,
    marginBottom: theme.spacing.xxl,
    textAlign: 'center',
  },
  walletCard: {
    width: '100%',
    backgroundColor: theme.colors.bgPanel,
    borderRadius: theme.radii.xxl,
    paddingVertical: theme.spacing.twentyEight,
    alignItems: 'center',
    borderWidth: theme.borderWidths.thin,
    borderColor: theme.colors.borderLight,
    marginBottom: theme.spacing.xl,
    gap: theme.spacing.xs,
  },
  walletLabel: {
    color: theme.colors.textDim,
    fontSize: theme.fontSizes.sm,
    fontWeight: theme.fontWeights.bold,
    letterSpacing: 2,
    textTransform: 'uppercase',
  },
  walletAmount: {
    color: theme.colors.gold,
    fontSize: theme.fontSizes.massive,
    fontWeight: theme.fontWeights.black,
    fontVariant: ['tabular-nums'],
    lineHeight: 72,
  },
  walletUnit: {
    color: theme.colors.textDim,
    fontSize: theme.fontSizes.m,
    fontWeight: theme.fontWeights.medium,
    letterSpacing: 1,
  },
  shopPlaceholder: {
    width: '100%',
    backgroundColor: theme.colors.bgOverlaySoft,
    borderRadius: theme.radii.xl,
    paddingVertical: theme.spacing.twentyEight,
    paddingHorizontal: theme.spacing.xl,
    alignItems: 'center',
    borderWidth: theme.borderWidths.thin,
    borderColor: theme.colors.borderSubtle,
    gap: theme.spacing.ten,
  },
  shopIcon: {
    fontSize: theme.fontSizes.hero2,
  },
  shopTitle: {
    color: theme.colors.textSoft,
    fontSize: theme.fontSizes.base,
    fontWeight: theme.fontWeights.heavy,
    letterSpacing: 0.5,
  },
  shopText: {
    color: theme.colors.text40,
    fontSize: theme.fontSizes.md,
    lineHeight: 19,
    textAlign: 'center',
  },
});
