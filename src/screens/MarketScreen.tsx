import React from 'react';
import { StyleSheet, Text, View } from 'react-native';
import { useHistoryStore } from '../store/historyStore';

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
    backgroundColor: '#2d6a4f',
    alignItems: 'center',
    paddingTop: 60,
    paddingHorizontal: 24,
  },
  title: {
    color: '#ffffff',
    fontSize: 22,
    fontWeight: '900',
    letterSpacing: 3,
    marginBottom: 24,
    textAlign: 'center',
  },
  walletCard: {
    width: '100%',
    backgroundColor: '#1b4332',
    borderRadius: 20,
    paddingVertical: 28,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.12)',
    marginBottom: 20,
    gap: 4,
  },
  walletLabel: {
    color: 'rgba(255,255,255,0.45)',
    fontSize: 11,
    fontWeight: '700',
    letterSpacing: 2,
    textTransform: 'uppercase',
  },
  walletAmount: {
    color: '#f4d03f',
    fontSize: 64,
    fontWeight: '900',
    fontVariant: ['tabular-nums'],
    lineHeight: 72,
  },
  walletUnit: {
    color: 'rgba(255,255,255,0.45)',
    fontSize: 14,
    fontWeight: '600',
    letterSpacing: 1,
  },
  shopPlaceholder: {
    width: '100%',
    backgroundColor: 'rgba(0,0,0,0.12)',
    borderRadius: 16,
    paddingVertical: 28,
    paddingHorizontal: 20,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.08)',
    gap: 10,
  },
  shopIcon: {
    fontSize: 36,
  },
  shopTitle: {
    color: 'rgba(255,255,255,0.55)',
    fontSize: 15,
    fontWeight: '800',
    letterSpacing: 0.5,
  },
  shopText: {
    color: 'rgba(255,255,255,0.4)',
    fontSize: 13,
    lineHeight: 19,
    textAlign: 'center',
  },
});
