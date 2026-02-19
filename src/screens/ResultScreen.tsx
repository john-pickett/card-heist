import React from 'react';
import { StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { useGameStore } from '../store/gameStore';

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

  const deltaColor = perfect ? '#2ecc71' : Math.abs(totalDelta) <= 5 ? '#f4d03f' : '#e74c3c';

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
    backgroundColor: '#2d6a4f',
    alignItems: 'center',
    justifyContent: 'center',
    padding: 24,
  },
  card: {
    backgroundColor: '#1b4332',
    borderRadius: 16,
    padding: 32,
    width: '100%',
    maxWidth: 340,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.15)',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 8,
  },
  heading: {
    fontSize: 24,
    fontWeight: '900',
    letterSpacing: 1.5,
    marginBottom: 24,
    textAlign: 'center',
  },
  perfect: {
    color: '#2ecc71',
  },
  complete: {
    color: '#ffffff',
  },
  label: {
    color: 'rgba(255,255,255,0.5)',
    fontSize: 11,
    fontWeight: '600',
    letterSpacing: 1,
    textTransform: 'uppercase',
    marginTop: 16,
  },
  deltaValue: {
    fontSize: 52,
    fontWeight: '900',
    marginTop: 4,
    fontVariant: ['tabular-nums'],
  },
  deltaNote: {
    color: 'rgba(255,255,255,0.45)',
    fontSize: 12,
    marginTop: 2,
    fontStyle: 'italic',
  },
  timeValue: {
    color: '#ffffff',
    fontSize: 28,
    fontWeight: '700',
    marginTop: 4,
    marginBottom: 8,
    fontVariant: ['tabular-nums'],
  },
  actions: {
    flexDirection: 'row',
    gap: 12,
    marginTop: 24,
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
