import React from 'react';
import { StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { useSneakInStore } from '../store/sneakInStore';
import { AREA_LABELS } from '../types/sneakin';

const SUIT_SYMBOL: Record<string, string> = {
  spades: '♠',
  hearts: '♥',
  diamonds: '♦',
  clubs: '♣',
};
const RED_SUITS = new Set(['hearts', 'diamonds']);

function formatTime(ms: number): string {
  const totalSec = Math.floor(ms / 1000);
  const m = Math.floor(totalSec / 60);
  const s = totalSec % 60;
  const cents = Math.floor((ms % 1000) / 10);
  return `${m}:${String(s).padStart(2, '0')}.${String(cents).padStart(2, '0')}`;
}

interface Props {
  onPlayAgain: () => void;
  onHome: () => void;
}

export function SneakInResultScreen({ onPlayAgain, onHome }: Props) {
  const areas = useSneakInStore(s => s.areas);
  const startTime = useSneakInStore(s => s.startTime);
  const endTime = useSneakInStore(s => s.endTime);
  const initGame = useSneakInStore(s => s.initGame);

  const elapsed = startTime && endTime ? endTime - startTime : 0;

  const handlePlayAgain = () => {
    initGame();
    onPlayAgain();
  };

  return (
    <View style={styles.screen}>
      <Text style={styles.heading}>HEIST COMPLETE!</Text>
      <Text style={styles.subheading}>All four areas cracked.</Text>

      {/* Final time */}
      <View style={styles.timeBlock}>
        <Text style={styles.timeLabel}>FINAL TIME</Text>
        <Text style={styles.timeValue}>{formatTime(elapsed)}</Text>
      </View>

      {/* Area breakdown */}
      <View style={styles.breakdown}>
        {areas.map(area => {
          const sum = area.cards.reduce(
            (s, sc) => s + parseInt(sc.card.rank, 10),
            0
          );
          return (
            <View key={area.id} style={styles.areaRow}>
              <View style={styles.areaRowLeft}>
                <Text style={styles.areaName}>{AREA_LABELS[area.id]}</Text>
                <Text style={styles.areaTarget}>target {area.target}</Text>
              </View>
              <View style={styles.areaRowRight}>
                {area.cards.map((sc, i) => {
                  const red = RED_SUITS.has(sc.card.suit);
                  return (
                    <React.Fragment key={sc.instanceId}>
                      {i > 0 && <Text style={styles.plus}>+</Text>}
                      <View style={styles.miniChip}>
                        <Text style={[styles.miniChipRank, red && styles.red]}>
                          {sc.card.rank}
                        </Text>
                        <Text style={[styles.miniChipSuit, red && styles.red]}>
                          {SUIT_SYMBOL[sc.card.suit]}
                        </Text>
                      </View>
                    </React.Fragment>
                  );
                })}
                <Text style={styles.equals}>= {sum}</Text>
              </View>
            </View>
          );
        })}
      </View>

      {/* Actions */}
      <View style={styles.actions}>
        <TouchableOpacity
          style={[styles.btn, styles.playAgainBtn]}
          onPress={handlePlayAgain}
        >
          <Text style={styles.btnText}>Play Again</Text>
        </TouchableOpacity>
        <TouchableOpacity
          style={[styles.btn, styles.homeBtn]}
          onPress={onHome}
        >
          <Text style={[styles.btnText, styles.homeBtnText]}>Home</Text>
        </TouchableOpacity>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  screen: {
    flex: 1,
    backgroundColor: '#2d6a4f',
    padding: 24,
    alignItems: 'center',
    justifyContent: 'center',
  },
  heading: {
    color: '#f4d03f',
    fontSize: 26,
    fontWeight: '900',
    letterSpacing: 1.5,
    textAlign: 'center',
    marginBottom: 6,
  },
  subheading: {
    color: 'rgba(255,255,255,0.55)',
    fontSize: 14,
    marginBottom: 28,
    textAlign: 'center',
  },

  // Time display
  timeBlock: {
    alignItems: 'center',
    marginBottom: 32,
  },
  timeLabel: {
    color: 'rgba(255,255,255,0.45)',
    fontSize: 11,
    fontWeight: '700',
    letterSpacing: 1.5,
    textTransform: 'uppercase',
    marginBottom: 4,
  },
  timeValue: {
    color: '#ffffff',
    fontSize: 56,
    fontWeight: '900',
    fontVariant: ['tabular-nums'],
    lineHeight: 62,
  },

  // Area breakdown table
  breakdown: {
    width: '100%',
    backgroundColor: '#1b4332',
    borderRadius: 14,
    overflow: 'hidden',
    marginBottom: 28,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.1)',
  },
  areaRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 10,
    paddingHorizontal: 14,
    borderTopWidth: 1,
    borderTopColor: 'rgba(255,255,255,0.07)',
    gap: 12,
  },
  areaRowLeft: {
    flex: 1,
    gap: 2,
  },
  areaName: {
    color: '#ffffff',
    fontSize: 13,
    fontWeight: '700',
  },
  areaTarget: {
    color: 'rgba(255,255,255,0.4)',
    fontSize: 11,
  },
  areaRowRight: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  miniChip: {
    backgroundColor: '#ffffff',
    borderRadius: 5,
    width: 34,
    height: 42,
    alignItems: 'center',
    justifyContent: 'center',
  },
  miniChipRank: {
    fontSize: 12,
    fontWeight: '900',
    color: '#111111',
  },
  miniChipSuit: {
    fontSize: 10,
    color: '#111111',
    marginTop: -2,
  },
  plus: {
    color: 'rgba(255,255,255,0.4)',
    fontSize: 13,
    fontWeight: '600',
  },
  equals: {
    color: '#f4d03f',
    fontSize: 13,
    fontWeight: '800',
    marginLeft: 2,
  },
  red: {
    color: '#c0392b',
  },

  // Actions
  actions: {
    flexDirection: 'row',
    gap: 12,
    width: '100%',
  },
  btn: {
    flex: 1,
    borderRadius: 12,
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
    color: 'rgba(255,255,255,0.7)',
    fontWeight: '500',
  },
});
