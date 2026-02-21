import React from 'react';
import { ScrollView, StyleSheet, Text, TouchableOpacity, View } from 'react-native';

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
  excellent: '#ffe033',
  superb:    '#f4d03f',
  great:     '#95d5b2',
  solid:     '#74c69d',
  notbad:    'rgba(255,255,255,0.55)',
  timeout:   '#e74c3c',
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
    backgroundColor: '#2d6a4f',
  },
  scroll: {
    flex: 1,
  },
  scrollContent: {
    alignItems: 'center',
    paddingTop: 60,
    paddingHorizontal: 24,
    paddingBottom: 24,
  },
  footer: {
    paddingHorizontal: 24,
    paddingTop: 12,
    paddingBottom: 24,
    backgroundColor: '#2d6a4f',
    borderTopWidth: 1,
    borderTopColor: 'rgba(255,255,255,0.08)',
  },
  heading: {
    color: '#f4d03f',
    fontSize: 28,
    fontWeight: '900',
    letterSpacing: 2,
    marginBottom: 6,
  },
  subheading: {
    color: 'rgba(255,255,255,0.5)',
    fontSize: 13,
    fontWeight: '700',
    letterSpacing: 2,
    marginBottom: 14,
  },
  perfBlock: {
    alignItems: 'center',
    backgroundColor: '#1b4332',
    borderRadius: 16,
    paddingVertical: 18,
    paddingHorizontal: 32,
    width: '100%',
    marginBottom: 14,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.1)',
    gap: 4,
  },
  perfTimeLabel: {
    color: 'rgba(255,255,255,0.45)',
    fontSize: 11,
    fontWeight: '700',
    letterSpacing: 1.5,
    textTransform: 'uppercase',
  },
  perfTimeValue: {
    color: '#ffffff',
    fontSize: 44,
    fontWeight: '900',
    fontVariant: ['tabular-nums'],
    lineHeight: 52,
  },
  perfGrade: {
    fontSize: 22,
    fontWeight: '900',
    letterSpacing: 1,
  },
  perfBonus: {
    color: 'rgba(255,255,255,0.55)',
    fontSize: 13,
    fontWeight: '600',
  },
  storyBox: {
    width: '100%',
    backgroundColor: 'rgba(0,0,0,0.15)',
    borderRadius: 14,
    paddingVertical: 12,
    paddingHorizontal: 14,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.12)',
    marginBottom: 14,
  },
  storyTitle: {
    color: '#f4d03f',
    fontSize: 15,
    fontWeight: '800',
    marginBottom: 4,
  },
  storyText: {
    color: 'rgba(255,255,255,0.8)',
    fontSize: 13,
    lineHeight: 19,
  },
  storyGold: {
    color: '#f4d03f',
    fontWeight: '900',
  },
  panel: {
    backgroundColor: '#1b4332',
    borderRadius: 16,
    padding: 20,
    width: '100%',
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.1)',
    gap: 14,
    marginBottom: 14,
  },
  row: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  label: {
    color: 'rgba(255,255,255,0.65)',
    fontSize: 15,
    fontWeight: '600',
  },
  bonus: {
    color: '#f4d03f',
    fontSize: 20,
    fontWeight: '900',
  },
  expectBox: {
    width: '100%',
    backgroundColor: 'rgba(0,0,0,0.12)',
    borderRadius: 14,
    paddingVertical: 12,
    paddingHorizontal: 14,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.1)',
    gap: 8,
  },
  expectTitle: {
    color: '#f4d03f',
    fontSize: 14,
    fontWeight: '800',
  },
  expectText: {
    color: 'rgba(255,255,255,0.76)',
    fontSize: 13,
    lineHeight: 18,
  },
  continueBtn: {
    backgroundColor: '#40916c',
    borderRadius: 14,
    paddingVertical: 16,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.15)',
  },
  continueBtnText: {
    color: '#ffffff',
    fontSize: 16,
    fontWeight: '800',
    letterSpacing: 0.5,
  },
});
