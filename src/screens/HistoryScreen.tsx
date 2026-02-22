import React from 'react';
import { ScrollView, StyleSheet, Text, View } from 'react-native';
import { computeStats, useHistoryStore } from '../store/historyStore';
import theme from '../theme';

function fmtMs(ms: number | null): string {
  if (ms === null) return '—';
  const s = Math.floor(ms / 1000);
  const rem = Math.floor((ms % 1000) / 10);
  return `${s}.${rem.toString().padStart(2, '0')}s`;
}

function fmtTime(ms: number): string {
  const totalSec = Math.floor(ms / 1000);
  const h = Math.floor(totalSec / 3600);
  const m = Math.floor((totalSec % 3600) / 60);
  const s = totalSec % 60;
  if (h > 0) return `${h}h ${m}m ${s}s`;
  if (m > 0) return `${m}m ${s}s`;
  return `${s}s`;
}

function fmtDate(iso: string | null): string {
  if (!iso) return '—';
  const d = new Date(iso);
  return d.toLocaleDateString(undefined, { month: 'short', day: 'numeric', year: 'numeric' });
}

function fmtPct(rate: number): string {
  return `${Math.round(rate * 100)}%`;
}

function StatRow({ label, value }: { label: string; value: string | number }) {
  return (
    <View style={styles.statRow}>
      <Text style={styles.statLabel}>{label}</Text>
      <Text style={styles.statValue}>{value}</Text>
    </View>
  );
}

function Section({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <View style={styles.section}>
      <Text style={styles.sectionTitle}>{title}</Text>
      {children}
    </View>
  );
}

export function HistoryScreen() {
  const records = useHistoryStore(s => s.records);
  const stats = computeStats(records);
  const { overall, act1, act2, act3 } = stats;

  if (records.length === 0) {
    return (
      <View style={styles.emptyContainer}>
        <Text style={styles.headerTitle}>HEIST DOSSIER</Text>
        <Text style={styles.emptyText}>No heists on record yet.</Text>
        <Text style={styles.emptySubText}>Complete a campaign to see your stats.</Text>
      </View>
    );
  }

  return (
    <ScrollView style={styles.scroll} contentContainerStyle={styles.scrollContent}>
      <Text style={styles.headerTitle}>HEIST DOSSIER</Text>
      <Text style={styles.headerSub}>{overall.totalHeists} heist{overall.totalHeists !== 1 ? 's' : ''} on record</Text>

      <Section title="Campaign Overview">
        <StatRow label="Escaped with loot" value={`${overall.wins} / ${overall.totalHeists}`} />
        <StatRow label="Busted" value={overall.losses} />
        <StatRow label="Win rate" value={fmtPct(overall.winRate)} />
        <StatRow label="Current streak" value={overall.currentStreak} />
        <StatRow label="Best streak" value={overall.bestStreak} />
        <StatRow label="Highest gold (one run)" value={overall.highestGold} />
        <StatRow label="Lowest gold (wins only)" value={overall.lowestWinGold ?? '—'} />
        <StatRow label="Total gold looted" value={overall.totalGold} />
        <StatRow label="First heist" value={fmtDate(overall.firstDate)} />
        <StatRow label="Last played" value={fmtDate(overall.lastDate)} />
        <StatRow label="Total play time" value={fmtTime(overall.totalPlayMs)} />
      </Section>

      <Section title="Act 1 — Sneak In">
        <StatRow label="Best time" value={fmtMs(act1.bestMs)} />
        <StatRow label="Worst time" value={fmtMs(act1.worstMs)} />
        <StatRow label="Average time" value={fmtMs(act1.avgMs)} />
        <StatRow label="Timeouts" value={act1.totalTimeouts} />
        <StatRow label="Excellent (≤15s)"  value={act1.tierExcellent} />
        <StatRow label="Superb (≤30s)"     value={act1.tierSuperb} />
        <StatRow label="Great (≤60s)"      value={act1.tierGreat} />
        <StatRow label="Solid (≤90s)"      value={act1.tierSolid} />
        <StatRow label="Not Bad (≤120s)"   value={act1.tierNotBad} />
        <StatRow label="Time Ran Out"      value={act1.tierTimeout} />
        <StatRow label="Total card moves" value={act1.totalMoves} />
      </Section>

      <Section title="Act 2 — Vault Cracking">
        <StatRow label="Highest score" value={act2.highestScore ?? '—'} />
        <StatRow label="Lowest score" value={act2.lowestScore ?? '—'} />
        <StatRow label="Average score" value={act2.avgScore !== null ? Math.round(act2.avgScore) : '—'} />
        <StatRow label="Exact hits (2×)" value={act2.totalExactHits} />
        <StatRow label="Busts" value={act2.totalBusts} />
        <StatRow label="Ace as 1" value={act2.totalAceOnes} />
        <StatRow label="Ace as 11" value={act2.totalAceElevens} />
      </Section>

      <Section title="Act 3 — Escape">
        <StatRow label="Runs played" value={act3.plays} />
        <StatRow label="Escaped" value={`${act3.wins} / ${act3.plays}`} />
        <StatRow label="Win rate" value={fmtPct(act3.winRate)} />
        <View style={styles.divider} />
        <StatRow label="Player matches" value={act3.totalPlayerMelds} />
        <StatRow label="  — Sets" value={act3.totalPlayerSets} />
        <StatRow label="  — Runs" value={act3.totalPlayerRuns} />
        <StatRow label="Player cards drawn" value={act3.totalPlayerCardsDrawn} />
        <StatRow label="Best match run (one game)" value={act3.mostMelds} />
        <StatRow label="Most cards drawn (one game)" value={act3.mostCardsDrawn} />
        <View style={styles.divider} />
        <StatRow label="Police matches" value={act3.totalPoliceMelds} />
        <StatRow label="Police cards drawn" value={act3.totalPoliceCardsDrawn} />
        <View style={styles.divider} />
        <StatRow label="Total turns" value={act3.totalTurns} />
        <StatRow label="Average turns/run" value={act3.avgTurns !== null ? act3.avgTurns.toFixed(1) : '—'} />
      </Section>
    </ScrollView>
  );
}

const BG = theme.colors.bgPrimary;
const SECTION_BG = theme.colors.bgPanel;
const LABEL_COLOR = theme.colors.textMuted;
const VALUE_COLOR = theme.colors.textPrimary;
const TITLE_COLOR = theme.colors.goldDim;

const styles = StyleSheet.create({
  scroll: {
    flex: 1,
    backgroundColor: BG,
  },
  scrollContent: {
    paddingTop: theme.spacing.fourteen,
    paddingBottom: theme.spacing.xxxl,
    paddingHorizontal: theme.spacing.lg,
    gap: theme.spacing.lg,
  },
  headerTitle: {
    color: VALUE_COLOR,
    fontSize: theme.fontSizes.xl,
    fontWeight: theme.fontWeights.black,
    letterSpacing: 3,
    textAlign: 'center',
    marginBottom: theme.spacing.xs,
  },
  headerSub: {
    color: LABEL_COLOR,
    fontSize: theme.fontSizes.md,
    textAlign: 'center',
    marginBottom: theme.spacing.xs,
  },
  emptyContainer: {
    flex: 1,
    backgroundColor: BG,
    alignItems: 'center',
    paddingTop: theme.spacing.fourteen,
    paddingHorizontal: theme.spacing.xl,
  },
  emptyText: {
    color: VALUE_COLOR,
    fontSize: theme.fontSizes.subtitle,
    fontWeight: theme.fontWeights.bold,
    marginTop: theme.spacing.xxl,
  },
  emptySubText: {
    color: LABEL_COLOR,
    fontSize: theme.fontSizes.md,
    marginTop: theme.spacing.sm,
    textAlign: 'center',
  },
  section: {
    backgroundColor: SECTION_BG,
    borderRadius: theme.radii.lg,
    padding: theme.spacing.lg,
    gap: theme.spacing.ten,
  },
  sectionTitle: {
    color: TITLE_COLOR,
    fontSize: theme.fontSizes.s,
    fontWeight: theme.fontWeights.black,
    letterSpacing: 2,
    textTransform: 'uppercase',
    marginBottom: theme.spacing.xs,
  },
  statRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  statLabel: {
    color: LABEL_COLOR,
    fontSize: theme.fontSizes.md,
    flex: 1,
  },
  statValue: {
    color: VALUE_COLOR,
    fontSize: theme.fontSizes.md,
    fontWeight: theme.fontWeights.bold,
    textAlign: 'right',
  },
  divider: {
    height: 1,
    backgroundColor: theme.colors.borderFaint,
    marginVertical: theme.spacing.two,
  },
  tierRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginTop: theme.spacing.two,
  },
  tierItem: {
    flex: 1,
    alignItems: 'center',
    gap: theme.spacing.two,
  },
  tierDot: {
    fontSize: theme.fontSizes.subtitle,
  },
  tierLabel: {
    color: LABEL_COLOR,
    fontSize: theme.fontSizes.caption,
    textAlign: 'center',
  },
  tierCount: {
    color: VALUE_COLOR,
    fontSize: theme.fontSizes.base,
    fontWeight: theme.fontWeights.bold,
  },
});
