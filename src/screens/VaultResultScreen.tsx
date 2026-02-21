import React from 'react';
import { ScrollView, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { useReckoningStore } from '../store/vaultStore';
import theme from '../theme';

interface VaultResultScreenProps {
  onPlayAgain: () => void;
  onHome: () => void;
}

export function VaultResultScreen({ onPlayAgain, onHome }: VaultResultScreenProps) {
  const vaults = useReckoningStore((s) => s.vaults);
  const finalScore = useReckoningStore((s) => s.finalScore) ?? 0;
  const initGame = useReckoningStore((s) => s.initGame);

  const handlePlayAgain = () => {
    initGame();
    onPlayAgain();
  };

  const maxPossible = 13 + 18 + 21; // all 3 targets
  const isMaxScore = finalScore >= (13 + 18 + 21) * 2;

  return (
    <View style={styles.screen}>
      <ScrollView contentContainerStyle={styles.scroll} showsVerticalScrollIndicator={false}>
        <Text style={styles.heading}>RECKONING COMPLETE</Text>

        {/* Vault breakdown */}
        <View style={styles.table}>
          <View style={styles.tableHeader}>
            <Text style={[styles.col, styles.colVault, styles.tableHeaderText]}>Vault</Text>
            <Text style={[styles.col, styles.colTarget, styles.tableHeaderText]}>Target</Text>
            <Text style={[styles.col, styles.colSum, styles.tableHeaderText]}>Sum</Text>
            <Text style={[styles.col, styles.colStatus, styles.tableHeaderText]}>Status</Text>
            <Text style={[styles.col, styles.colScore, styles.tableHeaderText]}>Score</Text>
          </View>

          {vaults.map((vault) => {
            const isBusted = vault.isBusted;
            const isExact = !isBusted && vault.sum === vault.target;
            const score = isBusted ? 0 : isExact ? vault.sum * 2 : vault.sum;

            const statusLabel = isBusted ? 'BUSTED' : isExact ? 'EXACT ×2' : 'UNDER';
            const statusColor = isBusted ? theme.colors.errorRed : isExact ? theme.colors.gold : theme.colors.textGreen;
            const scoreColor = isBusted ? theme.colors.errorRed : isExact ? theme.colors.gold : theme.colors.textPrimary;

            return (
              <View key={vault.id} style={styles.tableRow}>
                <Text style={[styles.col, styles.colVault, styles.cellText]}>
                  {vault.id + 1}
                </Text>
                <Text style={[styles.col, styles.colTarget, styles.cellText]}>
                  {vault.target}
                </Text>
                <Text style={[styles.col, styles.colSum, styles.cellText]}>
                  {vault.sum}
                </Text>
                <Text style={[styles.col, styles.colStatus, styles.cellText, { color: statusColor }]}>
                  {statusLabel}
                </Text>
                <Text style={[styles.col, styles.colScore, styles.cellText, { color: scoreColor }]}>
                  {score}
                </Text>
              </View>
            );
          })}
        </View>

        {/* Total score */}
        <View style={styles.totalRow}>
          <Text style={styles.totalLabel}>FINAL SCORE</Text>
          <Text style={[styles.totalScore, isMaxScore && styles.perfectScore]}>
            {finalScore}
          </Text>
          {isMaxScore && (
            <Text style={styles.perfectNote}>Perfect Reckoning!</Text>
          )}
          <Text style={styles.maxNote}>Max possible: {maxPossible * 2}</Text>
        </View>

        {/* Actions */}
        <View style={styles.actions}>
          <TouchableOpacity style={[styles.btn, styles.playAgainBtn]} onPress={handlePlayAgain}>
            <Text style={styles.btnText}>Play Again</Text>
          </TouchableOpacity>
          <TouchableOpacity style={[styles.btn, styles.homeBtn]} onPress={onHome}>
            <Text style={[styles.btnText, styles.homeBtnText]}>Home</Text>
          </TouchableOpacity>
        </View>
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  screen: {
    flex: 1,
    backgroundColor: theme.colors.bgPrimary,
  },
  scroll: {
    padding: theme.spacing.xxl,
    alignItems: 'center',
  },
  heading: {
    color: theme.colors.textPrimary,
    fontSize: theme.fontSizes.xl,
    fontWeight: theme.fontWeights.black,
    letterSpacing: 1.5,
    marginBottom: theme.spacing.twentyEight,
    textAlign: 'center',
  },
  table: {
    width: '100%',
    backgroundColor: theme.colors.bgPanel,
    borderRadius: theme.radii.r12,
    overflow: 'hidden',
    borderWidth: theme.borderWidths.thin,
    borderColor: theme.colors.borderFaint,
    marginBottom: theme.spacing.xxl,
  },
  tableHeader: {
    flexDirection: 'row',
    backgroundColor: theme.colors.bgDarkOverlay,
    paddingVertical: theme.spacing.ten,
    paddingHorizontal: theme.spacing.md,
  },
  tableHeaderText: {
    color: theme.colors.text50,
    fontSize: theme.fontSizes.sm,
    fontWeight: theme.fontWeights.bold,
    letterSpacing: 0.5,
    textTransform: 'uppercase',
  },
  tableRow: {
    flexDirection: 'row',
    paddingVertical: theme.spacing.md,
    paddingHorizontal: theme.spacing.md,
    borderTopWidth: 1,
    borderTopColor: theme.colors.borderUltraSubtle,
  },
  col: {
    textAlign: 'center',
  },
  colVault: {
    flex: 0.8,
  },
  colTarget: {
    flex: 1,
  },
  colSum: {
    flex: 1,
  },
  colStatus: {
    flex: 1.6,
  },
  colScore: {
    flex: 1,
  },
  cellText: {
    color: theme.colors.textPrimary,
    fontSize: theme.fontSizes.m,
    fontWeight: theme.fontWeights.medium,
    fontVariant: ['tabular-nums'],
  },
  totalRow: {
    alignItems: 'center',
    marginBottom: theme.spacing.xxxl,
  },
  totalLabel: {
    color: theme.colors.text50,
    fontSize: theme.fontSizes.sm,
    fontWeight: theme.fontWeights.bold,
    letterSpacing: 1.5,
    textTransform: 'uppercase',
    marginBottom: theme.spacing.xs,
  },
  totalScore: {
    color: theme.colors.textPrimary,
    fontSize: theme.fontSizes.massive,
    fontWeight: theme.fontWeights.black,
    fontVariant: ['tabular-nums'],
    lineHeight: 72,
  },
  perfectScore: {
    color: theme.colors.gold,
  },
  perfectNote: {
    color: theme.colors.gold,
    fontSize: theme.fontSizes.base,
    fontWeight: theme.fontWeights.bold,
    marginTop: theme.spacing.xs,
  },
  maxNote: {
    color: theme.colors.textFaint,
    fontSize: theme.fontSizes.s,
    marginTop: theme.spacing.six,
  },
  actions: {
    flexDirection: 'row',
    gap: theme.spacing.md,
    width: '100%',
  },
  btn: {
    flex: 1,
    borderRadius: theme.radii.md,
    paddingVertical: theme.spacing.fourteen,
    alignItems: 'center',
  },
  playAgainBtn: {
    backgroundColor: theme.colors.greenSuccess,
  },
  homeBtn: {
    backgroundColor: 'transparent',
    borderWidth: theme.borderWidths.thin,
    borderColor: theme.colors.borderBright,
  },
  btnText: {
    color: theme.colors.textPrimary,
    fontSize: theme.fontSizes.base,
    fontWeight: theme.fontWeights.bold,
  },
  homeBtnText: {
    color: theme.colors.text75,
    fontWeight: theme.fontWeights.normal,
  },
});
