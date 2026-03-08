import React from 'react';
import { ScrollView, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { Act1Record, Act2Record } from '../types/history';
import { MarketAct } from '../types/market';
import theme from '../theme';

type Act2VaultResult = {
  id: number;
  target: number;
  sum: number;
  result: 'exact' | 'busted' | 'under';
  gold: number;
};

type UsedBuff = {
  itemId: string;
  icon: string;
  title: string;
  act: MarketAct;
  quantity: number;
};

interface Props {
  totalScore: number;
  totalGoldWon: number;
  won: boolean;
  act1Record: Act1Record | null;
  act1Gold: number;
  act2Record: Act2Record | null;
  act2Gold: number;
  act2VaultResults: Act2VaultResult[];
  buffsUsed: UsedBuff[];
  onPlayAgain: () => void;
  onHome: () => void;
}

function formatElapsed(ms: number | null): string {
  if (ms === null) return 'Time ran out';
  const totalSec = Math.floor(ms / 1000);
  const minutes = Math.floor(totalSec / 60);
  const seconds = totalSec % 60;
  const tenths = Math.floor((ms % 1000) / 100);
  return `${minutes}:${String(seconds).padStart(2, '0')}.${tenths}`;
}

function vaultResultLabel(result: Act2VaultResult['result']): string {
  if (result === 'exact') return '🎯 Exact';
  if (result === 'busted') return '💥 Busted';
  return '🪙 Under';
}

export function GameOverScreen({
  totalScore,
  totalGoldWon,
  won,
  act1Record,
  act1Gold,
  act2Record,
  act2Gold,
  act2VaultResults,
  buffsUsed,
  onPlayAgain,
  onHome,
}: Props) {
  const solvedAllAreas = act1Record ? !act1Record.timedOut : false;

  return (
    <View style={styles.screen}>
      <ScrollView contentContainerStyle={styles.scroll} showsVerticalScrollIndicator={false}>
        <Text style={[styles.heading, won ? styles.headingGold : styles.headingRed]}>
          {won ? 'ESCAPED! 🏁' : 'CAUGHT! 🚨'}
        </Text>
        <Text style={styles.subheading}>
          {won
            ? 'You slipped past the police and kept the full haul.'
            : 'The police got too close. You dropped bags to get away with part of the haul.'}
        </Text>

        <View style={styles.payoutPanel}>
          <Text style={styles.panelLabel}>Heist payout</Text>
          <Text style={[styles.goldAmount, !won && styles.goldAmountRed]}>{totalGoldWon} gold</Text>
          <Text style={styles.panelNote}>
            {won ? '🏆 100% kept' : `🧯 33% kept from ${totalScore} total potential`}
          </Text>
        </View>

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>🧩 Act One: Sneak In</Text>
          <View style={styles.statRow}>
            <Text style={styles.statLabel}>Time</Text>
            <Text style={styles.statValue}>{act1Record ? formatElapsed(act1Record.elapsedMs) : '—'}</Text>
          </View>
          <View style={styles.statRow}>
            <Text style={styles.statLabel}>Solved all 4 areas</Text>
            <Text style={styles.statValue}>{solvedAllAreas ? '✅ Yes (4/4)' : '❌ No'}</Text>
          </View>
          <View style={styles.statRow}>
            <Text style={styles.statLabel}>Gold from Act One</Text>
            <Text style={styles.statGold}>+{act1Gold}</Text>
          </View>
        </View>

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>🏦 Act Two: Vaults</Text>
          <View style={styles.vaultHeaderRow}>
            <Text style={[styles.vaultHeaderCell, styles.vaultCellId]}>Vault</Text>
            <Text style={[styles.vaultHeaderCell, styles.vaultCellResult]}>Result</Text>
            <Text style={[styles.vaultHeaderCell, styles.vaultCellGold]}>Gold</Text>
          </View>
          {act2VaultResults.map(vault => (
            <View key={vault.id} style={styles.vaultRow}>
              <Text style={[styles.vaultCell, styles.vaultCellId]}>
                #{vault.id} ({vault.sum}/{vault.target})
              </Text>
              <Text style={[styles.vaultCell, styles.vaultCellResult]}>{vaultResultLabel(vault.result)}</Text>
              <Text style={[styles.vaultCell, styles.vaultCellGold]}>{vault.gold}</Text>
            </View>
          ))}
          <View style={styles.statRow}>
            <Text style={styles.statLabel}>Exact hits</Text>
            <Text style={styles.statValue}>{act2Record?.exactHits ?? 0}</Text>
          </View>
          <View style={styles.statRow}>
            <Text style={styles.statLabel}>Gold from Act Two</Text>
            <Text style={styles.statGold}>+{act2Gold}</Text>
          </View>
        </View>

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>🏃 Act Three: Escape</Text>
          <View style={styles.statRow}>
            <Text style={styles.statLabel}>Escaped successfully</Text>
            <Text style={styles.statValue}>{won ? '✅ Yes' : '❌ No'}</Text>
          </View>
        </View>

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>🧰 Buffs Used</Text>
          {buffsUsed.length === 0 ? (
            <Text style={styles.noBuffs}>No buffs were consumed this run.</Text>
          ) : (
            <View style={styles.buffList}>
              {buffsUsed.map(buff => (
                <View key={buff.itemId} style={styles.buffChip}>
                  <Text style={styles.buffText}>
                    {buff.icon} {buff.title} x{buff.quantity}
                  </Text>
                  <Text style={styles.buffAct}>{buff.act}</Text>
                </View>
              ))}
            </View>
          )}
        </View>
      </ScrollView>

      <View style={styles.buttonRow}>
        <TouchableOpacity style={[styles.btn, styles.btnGreen]} onPress={onPlayAgain}>
          <Text style={styles.btnText}>Play Again</Text>
        </TouchableOpacity>
        <TouchableOpacity style={[styles.btn, styles.btnSecondary]} onPress={onHome}>
          <Text style={[styles.btnText, styles.btnTextSecondary]}>Home</Text>
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
    paddingHorizontal: theme.spacing.lg,
    paddingTop: theme.spacing.xxl,
    paddingBottom: theme.spacing.twentyEight,
  },
  heading: {
    fontSize: theme.fontSizes.xxl,
    fontWeight: theme.fontWeights.black,
    letterSpacing: 2,
    textAlign: 'center',
    marginBottom: theme.spacing.sm,
  },
  headingGold: {
    color: theme.colors.gold,
  },
  headingRed: {
    color: theme.colors.errorRed,
  },
  subheading: {
    color: theme.colors.textMuted,
    fontSize: theme.fontSizes.md,
    textAlign: 'center',
    marginBottom: theme.spacing.lg,
  },
  payoutPanel: {
    backgroundColor: theme.colors.bgPanel,
    borderWidth: theme.borderWidths.thin,
    borderColor: theme.colors.borderStrong,
    borderRadius: theme.radii.r12,
    padding: theme.spacing.lg,
    alignItems: 'center',
    marginBottom: theme.spacing.xl,
  },
  panelLabel: {
    color: theme.colors.textMuted,
    fontSize: theme.fontSizes.md,
    marginBottom: theme.spacing.xs,
  },
  goldAmount: {
    color: theme.colors.gold,
    fontSize: theme.fontSizes.display,
    fontWeight: theme.fontWeights.black,
    lineHeight: 50,
  },
  goldAmountRed: {
    color: theme.colors.errorRed,
  },
  panelNote: {
    color: theme.colors.textSoft,
    fontSize: theme.fontSizes.sm,
    marginTop: theme.spacing.xs,
  },
  section: {
    backgroundColor: theme.colors.bgPanel,
    borderWidth: theme.borderWidths.thin,
    borderColor: theme.colors.borderFaint,
    borderRadius: theme.radii.r12,
    padding: theme.spacing.md,
    marginBottom: theme.spacing.md,
    gap: theme.spacing.xs,
  },
  sectionTitle: {
    color: theme.colors.gold,
    fontSize: theme.fontSizes.base,
    fontWeight: theme.fontWeights.heavy,
    marginBottom: theme.spacing.xs,
  },
  statRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: theme.spacing.md,
  },
  statLabel: {
    color: theme.colors.text75,
    fontSize: theme.fontSizes.sm,
  },
  statValue: {
    color: theme.colors.textPrimary,
    fontSize: theme.fontSizes.base,
    fontWeight: theme.fontWeights.bold,
  },
  statGold: {
    color: theme.colors.gold,
    fontSize: theme.fontSizes.base,
    fontWeight: theme.fontWeights.black,
  },
  vaultHeaderRow: {
    flexDirection: 'row',
    borderBottomWidth: theme.borderWidths.thin,
    borderBottomColor: theme.colors.borderSubtle,
    paddingBottom: theme.spacing.xs,
    marginBottom: theme.spacing.xs,
  },
  vaultHeaderCell: {
    color: theme.colors.text50,
    fontSize: theme.fontSizes.xs,
    fontWeight: theme.fontWeights.heavy,
    textTransform: 'uppercase',
    letterSpacing: 0.8,
  },
  vaultRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: theme.spacing.five,
  },
  vaultCell: {
    color: theme.colors.textPrimary,
    fontSize: theme.fontSizes.sm,
  },
  vaultCellId: {
    flex: 1.3,
  },
  vaultCellResult: {
    flex: 1.2,
  },
  vaultCellGold: {
    flex: 0.6,
    textAlign: 'right',
    fontWeight: theme.fontWeights.bold,
  },
  noBuffs: {
    color: theme.colors.textSoft,
    fontSize: theme.fontSizes.sm,
  },
  buffList: {
    gap: theme.spacing.xs,
  },
  buffChip: {
    backgroundColor: theme.colors.bgOverlaySoft,
    borderRadius: theme.radii.md,
    borderWidth: theme.borderWidths.thin,
    borderColor: theme.colors.borderLight,
    paddingHorizontal: theme.spacing.sm,
    paddingVertical: theme.spacing.xs,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  buffText: {
    color: theme.colors.textPrimary,
    fontSize: theme.fontSizes.sm,
    fontWeight: theme.fontWeights.bold,
    flex: 1,
  },
  buffAct: {
    color: theme.colors.text60,
    fontSize: theme.fontSizes.xs,
    marginLeft: theme.spacing.sm,
  },
  buttonRow: {
    flexDirection: 'row',
    gap: theme.spacing.sm,
    paddingHorizontal: theme.spacing.lg,
    paddingBottom: theme.spacing.xl,
  },
  btn: {
    flex: 1,
    borderRadius: theme.radii.md,
    paddingVertical: theme.spacing.md,
    alignItems: 'center',
    borderWidth: theme.borderWidths.thin,
  },
  btnGreen: {
    backgroundColor: theme.colors.greenPrimary,
    borderColor: theme.colors.greenPrimary,
  },
  btnSecondary: {
    backgroundColor: theme.colors.borderLight,
    borderColor: theme.colors.borderLight,
  },
  btnText: {
    color: theme.colors.textPrimary,
    fontSize: theme.fontSizes.md,
    fontWeight: theme.fontWeights.bold,
  },
  btnTextSecondary: {
    color: theme.colors.text75,
  },
});
