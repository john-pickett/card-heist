import React from 'react';
import { ScrollView, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import theme from '../theme';

type TimingGrade = 'excellent' | 'superb' | 'great' | 'solid' | 'notbad' | 'timeout';
type TimingRating = { grade: TimingGrade; label: string; bonus: number };

function formatTime(ms: number): string {
  const totalSec = Math.floor(ms / 1000);
  const m = Math.floor(totalSec / 60);
  const s = totalSec % 60;
  const t = Math.floor((ms % 1000) / 100);
  return `${m}:${String(s).padStart(2, '0')}.${t}`;
}

function getTimingRating(elapsedMs: number, timedOut: boolean): TimingRating {
  if (timedOut) return { grade: 'timeout',   label: 'Time Ran Out', bonus: 0  };
  const s = Math.floor(elapsedMs / 1000);
  if (s <= 15) return { grade: 'excellent', label: 'Excellent',    bonus: 50 };
  if (s <= 30) return { grade: 'superb',    label: 'Superb',       bonus: 40 };
  if (s <= 60) return { grade: 'great',     label: 'Great',        bonus: 25 };
  if (s <= 90) return { grade: 'solid',     label: 'Solid',        bonus: 15 };
  return       { grade: 'notbad',    label: 'Not Bad',      bonus: 10 };
}

const GRADE_COLORS: Record<TimingGrade, string> = {
  excellent: theme.colors.goldBright,
  superb:    theme.colors.gold,
  great:     theme.colors.greenPastel,
  solid:     theme.colors.greenSoft,
  notbad:    theme.colors.textSoft,
  timeout:   theme.colors.errorRed,
};

interface Props {
  elapsedMs: number | null;
  timedOut: boolean;
  timingBonus: number;
  cumulativeGold: number;
  onContinue: () => void;
}

export function Act1BridgeScreen({ elapsedMs, timedOut, timingBonus, cumulativeGold, onContinue }: Props) {
  const rating = getTimingRating(elapsedMs ?? 0, timedOut);

  return (
    <View style={styles.screen}>
      <ScrollView
        style={styles.scroll}
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
      >
        <Text style={styles.heading}>ACT 1 COMPLETE</Text>
        <Text style={styles.subheading}>SNEAK IN</Text>

        {/* Performance summary */}
        <View style={styles.perfBlock}>
          <Text style={styles.perfTimeLabel}>{timedOut ? "TIME'S UP" : 'YOUR TIME'}</Text>
          <Text style={styles.perfTimeValue}>
            {timedOut ? '—' : formatTime(elapsedMs ?? 0)}
          </Text>
          <Text style={[styles.perfGrade, { color: GRADE_COLORS[rating.grade] }]}>
            {rating.label}
          </Text>
          <Text style={styles.perfBonus}>
            {timingBonus > 0 ? `+${timingBonus} point bonus` : 'No time bonus'}
          </Text>
        </View>

        <View style={styles.storyBox}>
          <Text style={styles.storyTitle}>You are inside the bank.</Text>
          <Text style={styles.storyText}>
            The outer security is down and the crew is moving deeper. You have banked{' '}
            <Text style={styles.storyGold}>{cumulativeGold} gold</Text> so far, and every decision
            from here carries more risk and bigger rewards.
          </Text>
        </View>

        <View style={styles.panel}>
          <View style={styles.row}>
            <Text style={styles.label}>Run gold so far</Text>
            <Text style={styles.bonus}>{cumulativeGold} gold</Text>
          </View>
        </View>

        <View style={styles.expectBox}>
          <Text style={styles.expectTitle}>What comes next</Text>
          <Text style={styles.expectText}>
            Act 2: Draw and assign cards across three vaults. Match each target exactly to maximize
            your payout.
          </Text>
          <Text style={styles.expectText}>
            Act 3: Escape with your combined gold. Pick your route and survive the fallout to keep
            the haul.
          </Text>
        </View>
      </ScrollView>

      <View style={styles.footer}>
        <TouchableOpacity style={styles.continueBtn} onPress={onContinue}>
          <Text style={styles.continueBtnText}>Continue to Act 2 →</Text>
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
    alignItems: 'center',
    paddingTop: theme.spacing.sixty,
    paddingHorizontal: theme.spacing.xxl,
    paddingBottom: theme.spacing.xxl,
  },
  footer: {
    paddingHorizontal: theme.spacing.xxl,
    paddingTop: theme.spacing.md,
    paddingBottom: theme.spacing.xxl,
    backgroundColor: theme.colors.bgPrimary,
    borderTopWidth: 1,
    borderTopColor: theme.colors.borderSubtle,
  },
  heading: {
    color: theme.colors.gold,
    fontSize: theme.fontSizes.h1,
    fontWeight: theme.fontWeights.black,
    letterSpacing: 2,
    marginBottom: theme.spacing.six,
  },
  subheading: {
    color: theme.colors.text50,
    fontSize: theme.fontSizes.md,
    fontWeight: theme.fontWeights.bold,
    letterSpacing: 2,
    marginBottom: theme.spacing.fourteen,
  },
  perfBlock: {
    alignItems: 'center',
    backgroundColor: theme.colors.bgPanel,
    borderRadius: theme.radii.xl,
    paddingVertical: theme.spacing.eighteen,
    paddingHorizontal: theme.spacing.xxxl,
    width: '100%',
    marginBottom: theme.spacing.fourteen,
    borderWidth: theme.borderWidths.thin,
    borderColor: theme.colors.borderFaint,
    gap: theme.spacing.xs,
  },
  perfTimeLabel: {
    color: theme.colors.textDim,
    fontSize: theme.fontSizes.sm,
    fontWeight: theme.fontWeights.bold,
    letterSpacing: 1.5,
    textTransform: 'uppercase',
  },
  perfTimeValue: {
    color: theme.colors.textPrimary,
    fontSize: theme.fontSizes.display,
    fontWeight: theme.fontWeights.black,
    fontVariant: ['tabular-nums'],
    lineHeight: 52,
  },
  perfGrade: {
    fontSize: theme.fontSizes.xl,
    fontWeight: theme.fontWeights.black,
    letterSpacing: 1,
  },
  perfBonus: {
    color: theme.colors.textSoft,
    fontSize: theme.fontSizes.md,
    fontWeight: theme.fontWeights.medium,
  },
  storyBox: {
    width: '100%',
    backgroundColor: theme.colors.bgStory,
    borderRadius: theme.radii.lg,
    paddingVertical: theme.spacing.md,
    paddingHorizontal: theme.spacing.fourteen,
    borderWidth: theme.borderWidths.thin,
    borderColor: theme.colors.borderLight,
    marginBottom: theme.spacing.fourteen,
  },
  storyTitle: {
    color: theme.colors.gold,
    fontSize: theme.fontSizes.base,
    fontWeight: theme.fontWeights.heavy,
    marginBottom: theme.spacing.xs,
  },
  storyText: {
    color: theme.colors.textBody,
    fontSize: theme.fontSizes.md,
    lineHeight: 19,
  },
  storyGold: {
    color: theme.colors.gold,
    fontWeight: theme.fontWeights.black,
  },
  panel: {
    backgroundColor: theme.colors.bgPanel,
    borderRadius: theme.radii.xl,
    padding: theme.spacing.xl,
    width: '100%',
    borderWidth: theme.borderWidths.thin,
    borderColor: theme.colors.borderFaint,
    gap: theme.spacing.fourteen,
    marginBottom: theme.spacing.fourteen,
  },
  row: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  label: {
    color: theme.colors.textMuted,
    fontSize: theme.fontSizes.base,
    fontWeight: theme.fontWeights.medium,
  },
  bonus: {
    color: theme.colors.gold,
    fontSize: theme.fontSizes.title,
    fontWeight: theme.fontWeights.black,
  },
  expectBox: {
    width: '100%',
    backgroundColor: theme.colors.bgOverlaySoft,
    borderRadius: theme.radii.lg,
    paddingVertical: theme.spacing.md,
    paddingHorizontal: theme.spacing.fourteen,
    borderWidth: theme.borderWidths.thin,
    borderColor: theme.colors.borderFaint,
    gap: theme.spacing.sm,
  },
  expectTitle: {
    color: theme.colors.gold,
    fontSize: theme.fontSizes.m,
    fontWeight: theme.fontWeights.heavy,
  },
  expectText: {
    color: theme.colors.text76,
    fontSize: theme.fontSizes.md,
    lineHeight: 18,
  },
  continueBtn: {
    backgroundColor: theme.colors.greenPrimary,
    borderRadius: theme.radii.lg,
    paddingVertical: theme.spacing.lg,
    alignItems: 'center',
    borderWidth: theme.borderWidths.thin,
    borderColor: theme.colors.borderMedium,
  },
  continueBtnText: {
    color: theme.colors.textPrimary,
    fontSize: theme.fontSizes.subtitle,
    fontWeight: theme.fontWeights.heavy,
    letterSpacing: 0.5,
  },
});
