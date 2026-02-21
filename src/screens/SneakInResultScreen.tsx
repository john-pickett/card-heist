import React from 'react';
import { ScrollView, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { useSneakInStore } from '../store/sneakInStore';
import { AREA_LABELS } from '../types/sneakin';
import theme from '../theme';

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
  const solution = useSneakInStore(s => s.solution);

  const elapsed = startTime && endTime ? endTime - startTime : 0;

  const handlePlayAgain = () => {
    initGame();
    onPlayAgain();
  };

  return (
    <View style={styles.screen}>
      <ScrollView contentContainerStyle={styles.scroll} showsVerticalScrollIndicator={false}>
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

      {/* One valid solution */}
      {solution && (
        <View style={styles.solutionBlock}>
          <Text style={styles.solutionTitle}>ONE VALID SOLUTION</Text>
          <View style={styles.solutionDivider} />
          {solution.map((entry, i) => (
            <View key={i} style={styles.solutionRow}>
              <Text style={styles.solutionArea}>{entry.areaName}</Text>
              <Text style={styles.solutionExpr}>
                {entry.cards.join(' + ')} = {entry.target}
              </Text>
            </View>
          ))}
        </View>
      )}

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
    justifyContent: 'center',
    flexGrow: 1,
  },
  heading: {
    color: theme.colors.gold,
    fontSize: theme.fontSizes.xxl,
    fontWeight: theme.fontWeights.black,
    letterSpacing: 1.5,
    textAlign: 'center',
    marginBottom: theme.spacing.six,
  },
  subheading: {
    color: theme.colors.textSoft,
    fontSize: theme.fontSizes.m,
    marginBottom: theme.spacing.twentyEight,
    textAlign: 'center',
  },

  // Time display
  timeBlock: {
    alignItems: 'center',
    marginBottom: theme.spacing.xxxl,
  },
  timeLabel: {
    color: theme.colors.textDim,
    fontSize: theme.fontSizes.sm,
    fontWeight: theme.fontWeights.bold,
    letterSpacing: 1.5,
    textTransform: 'uppercase',
    marginBottom: theme.spacing.xs,
  },
  timeValue: {
    color: theme.colors.textPrimary,
    fontSize: theme.fontSizes.giant,
    fontWeight: theme.fontWeights.black,
    fontVariant: ['tabular-nums'],
    lineHeight: 62,
  },

  // Area breakdown table
  breakdown: {
    width: '100%',
    backgroundColor: theme.colors.bgPanel,
    borderRadius: theme.radii.lg,
    overflow: 'hidden',
    marginBottom: theme.spacing.twentyEight,
    borderWidth: theme.borderWidths.thin,
    borderColor: theme.colors.borderFaint,
  },
  areaRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: theme.spacing.ten,
    paddingHorizontal: theme.spacing.fourteen,
    borderTopWidth: 1,
    borderTopColor: theme.colors.borderUltraSubtle,
    gap: theme.spacing.md,
  },
  areaRowLeft: {
    flex: 1,
    gap: theme.spacing.two,
  },
  areaName: {
    color: theme.colors.textPrimary,
    fontSize: theme.fontSizes.md,
    fontWeight: theme.fontWeights.bold,
  },
  areaTarget: {
    color: theme.colors.text40,
    fontSize: theme.fontSizes.sm,
  },
  areaRowRight: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: theme.spacing.xs,
  },
  miniChip: {
    backgroundColor: theme.colors.cardFace,
    borderRadius: theme.radii.r5,
    width: 34,
    height: 42,
    alignItems: 'center',
    justifyContent: 'center',
  },
  miniChipRank: {
    fontSize: theme.fontSizes.s,
    fontWeight: theme.fontWeights.black,
    color: theme.colors.cardText,
  },
  miniChipSuit: {
    fontSize: theme.fontSizes.caption,
    color: theme.colors.cardText,
    marginTop: -2,
  },
  plus: {
    color: theme.colors.text40,
    fontSize: theme.fontSizes.md,
    fontWeight: theme.fontWeights.medium,
  },
  equals: {
    color: theme.colors.gold,
    fontSize: theme.fontSizes.md,
    fontWeight: theme.fontWeights.heavy,
    marginLeft: theme.spacing.two,
  },
  red: {
    color: theme.colors.red,
  },

  // Solution block
  solutionBlock: {
    width: '100%',
    backgroundColor: theme.colors.bgPanel,
    borderRadius: theme.radii.lg,
    overflow: 'hidden',
    marginBottom: theme.spacing.xl,
    borderWidth: theme.borderWidths.thin,
    borderColor: theme.colors.borderFaint,
    paddingVertical: theme.spacing.ten,
    paddingHorizontal: theme.spacing.fourteen,
  },
  solutionTitle: {
    color: theme.colors.text40,
    fontSize: theme.fontSizes.caption,
    fontWeight: theme.fontWeights.heavy,
    letterSpacing: 1.5,
    textTransform: 'uppercase',
    marginBottom: theme.spacing.six,
  },
  solutionDivider: {
    height: 1,
    backgroundColor: theme.colors.borderSubtle,
    marginBottom: theme.spacing.sm,
  },
  solutionRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: theme.spacing.xs,
  },
  solutionArea: {
    color: theme.colors.text60,
    fontSize: theme.fontSizes.s,
    fontWeight: theme.fontWeights.medium,
    flex: 1,
  },
  solutionExpr: {
    color: theme.colors.text85,
    fontSize: theme.fontSizes.s,
    fontWeight: theme.fontWeights.bold,
    fontVariant: ['tabular-nums'],
  },

  // Actions
  actions: {
    flexDirection: 'row',
    gap: theme.spacing.md,
    width: '100%',
  },
  btn: {
    flex: 1,
    borderRadius: theme.radii.r12,
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
    color: theme.colors.text70,
    fontWeight: theme.fontWeights.normal,
  },
});
