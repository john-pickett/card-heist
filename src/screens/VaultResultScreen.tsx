import React from 'react';
import { ScrollView, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { useReckoningStore } from '../store/reckoningStore';

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
            const statusColor = isBusted ? '#e74c3c' : isExact ? '#f4d03f' : '#d8f3dc';
            const scoreColor = isBusted ? '#e74c3c' : isExact ? '#f4d03f' : '#ffffff';

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
    backgroundColor: '#2d6a4f',
  },
  scroll: {
    padding: 24,
    alignItems: 'center',
  },
  heading: {
    color: '#ffffff',
    fontSize: 22,
    fontWeight: '900',
    letterSpacing: 1.5,
    marginBottom: 28,
    textAlign: 'center',
  },
  table: {
    width: '100%',
    backgroundColor: '#1b4332',
    borderRadius: 12,
    overflow: 'hidden',
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.1)',
    marginBottom: 24,
  },
  tableHeader: {
    flexDirection: 'row',
    backgroundColor: 'rgba(0,0,0,0.25)',
    paddingVertical: 10,
    paddingHorizontal: 12,
  },
  tableHeaderText: {
    color: 'rgba(255,255,255,0.5)',
    fontSize: 11,
    fontWeight: '700',
    letterSpacing: 0.5,
    textTransform: 'uppercase',
  },
  tableRow: {
    flexDirection: 'row',
    paddingVertical: 12,
    paddingHorizontal: 12,
    borderTopWidth: 1,
    borderTopColor: 'rgba(255,255,255,0.07)',
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
    color: '#ffffff',
    fontSize: 14,
    fontWeight: '600',
    fontVariant: ['tabular-nums'],
  },
  totalRow: {
    alignItems: 'center',
    marginBottom: 32,
  },
  totalLabel: {
    color: 'rgba(255,255,255,0.5)',
    fontSize: 11,
    fontWeight: '700',
    letterSpacing: 1.5,
    textTransform: 'uppercase',
    marginBottom: 4,
  },
  totalScore: {
    color: '#ffffff',
    fontSize: 64,
    fontWeight: '900',
    fontVariant: ['tabular-nums'],
    lineHeight: 72,
  },
  perfectScore: {
    color: '#f4d03f',
  },
  perfectNote: {
    color: '#f4d03f',
    fontSize: 15,
    fontWeight: '700',
    marginTop: 4,
  },
  maxNote: {
    color: 'rgba(255,255,255,0.35)',
    fontSize: 12,
    marginTop: 6,
  },
  actions: {
    flexDirection: 'row',
    gap: 12,
    width: '100%',
  },
  btn: {
    flex: 1,
    borderRadius: 10,
    paddingVertical: 14,
    alignItems: 'center',
  },
  playAgainBtn: {
    backgroundColor: '#27ae60',
  },
  homeBtn: {
    backgroundColor: 'transparent',
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.3)',
  },
  btnText: {
    color: '#ffffff',
    fontSize: 15,
    fontWeight: '700',
  },
  homeBtnText: {
    color: 'rgba(255,255,255,0.75)',
    fontWeight: '500',
  },
});
