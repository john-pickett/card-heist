import React from 'react';
import { StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { useGameStore } from '../store/gameStore';
import theme from '../theme';

interface ResultScreenProps {
  onPlayAgain: () => void;
  onHome: () => void;
}

export function ResultScreen({ onPlayAgain, onHome }: ResultScreenProps) {
  const totalDelta = useGameStore(s => s.totalDelta);
  const startTime = useGameStore(s => s.startTime);
  const endTime = useGameStore(s => s.endTime);
  const initGame = useGameStore(s => s.initGame);

  const elapsedMs = startTime != null && endTime != null ? endTime - startTime : 0;
  const elapsedSec = Math.floor(elapsedMs / 1000);
  const minutes = Math.floor(elapsedSec / 60);
  const seconds = elapsedSec % 60;
  const timeStr = `${minutes}:${seconds.toString().padStart(2, '0')}`;

  const perfect = totalDelta === 0;
  const formattedDelta = totalDelta > 0 ? `+${totalDelta}` : `${totalDelta}`;

  const deltaColor = perfect ? theme.colors.greenLight : Math.abs(totalDelta) <= 5 ? theme.colors.gold : theme.colors.errorRed;

  const handlePlayAgain = () => {
    initGame();
    onPlayAgain();
  };

  return (
    <View style={styles.screen}>
      <View style={styles.card}>
        <Text style={[styles.heading, perfect ? styles.perfect : styles.complete]}>
          {perfect ? 'PERFECT SPRINT!' : 'SPRINT COMPLETE'}
        </Text>

        <Text style={styles.label}>Budget Delta</Text>
        <Text style={[styles.deltaValue, { color: deltaColor }]}>
          {perfect ? '0' : formattedDelta}
        </Text>
        {perfect ? (
          <Text style={styles.deltaNote}>On budget — flawless execution!</Text>
        ) : (
          <Text style={styles.deltaNote}>
            {totalDelta < 0 ? 'Under budget' : 'Over budget'} by {Math.abs(totalDelta)} pts
          </Text>
        )}

        <Text style={styles.label}>Time</Text>
        <Text style={styles.timeValue}>{timeStr}</Text>

        <View style={styles.actions}>
          <TouchableOpacity style={[styles.btn, styles.playAgainBtn]} onPress={handlePlayAgain}>
            <Text style={styles.btnText}>Play Again</Text>
          </TouchableOpacity>
          <TouchableOpacity style={[styles.btn, styles.homeBtn]} onPress={onHome}>
            <Text style={[styles.btnText, styles.homeBtnText]}>Home</Text>
          </TouchableOpacity>
        </View>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  screen: {
    flex: 1,
    backgroundColor: theme.colors.bgPrimary,
    alignItems: 'center',
    justifyContent: 'center',
    padding: theme.spacing.xxl,
  },
  card: {
    backgroundColor: theme.colors.bgPanel,
    borderRadius: theme.radii.xl,
    padding: theme.spacing.xxxl,
    width: '100%',
    maxWidth: 340,
    alignItems: 'center',
    borderWidth: theme.borderWidths.thin,
    borderColor: theme.colors.borderMedium,
    shadowColor: theme.colors.shadow,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 8,
  },
  heading: {
    fontSize: theme.fontSizes.xxl2,
    fontWeight: theme.fontWeights.black,
    letterSpacing: 1.5,
    marginBottom: theme.spacing.xxl,
    textAlign: 'center',
  },
  perfect: {
    color: theme.colors.greenLight,
  },
  complete: {
    color: theme.colors.textPrimary,
  },
  label: {
    color: theme.colors.text50,
    fontSize: theme.fontSizes.sm,
    fontWeight: theme.fontWeights.medium,
    letterSpacing: 1,
    textTransform: 'uppercase',
    marginTop: theme.spacing.lg,
  },
  deltaValue: {
    fontSize: theme.fontSizes.giant2,
    fontWeight: theme.fontWeights.black,
    marginTop: theme.spacing.xs,
    fontVariant: ['tabular-nums'],
  },
  deltaNote: {
    color: theme.colors.textDim,
    fontSize: theme.fontSizes.s,
    marginTop: theme.spacing.two,
    fontStyle: 'italic',
  },
  timeValue: {
    color: theme.colors.textPrimary,
    fontSize: theme.fontSizes.h1,
    fontWeight: theme.fontWeights.bold,
    marginTop: theme.spacing.xs,
    marginBottom: theme.spacing.sm,
    fontVariant: ['tabular-nums'],
  },
  actions: {
    flexDirection: 'row',
    gap: theme.spacing.md,
    marginTop: theme.spacing.xxl,
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
    borderColor: theme.colors.textDisabled,
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
