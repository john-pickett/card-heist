import React from 'react';
import { ScrollView, StyleSheet, Text, View } from 'react-native';
import { computeStats, useHistoryStore } from '../store/historyStore';

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

const BG = '#2d6a4f';
const SECTION_BG = '#1b4332';
const LABEL_COLOR = 'rgba(255,255,255,0.65)';
const VALUE_COLOR = '#ffffff';
const TITLE_COLOR = '#d4af37';

const styles = StyleSheet.create({
  scroll: {
    flex: 1,
    backgroundColor: BG,
  },
  scrollContent: {
    paddingTop: 52,
    paddingBottom: 32,
    paddingHorizontal: 16,
    gap: 16,
  },
  headerTitle: {
    color: VALUE_COLOR,
    fontSize: 22,
    fontWeight: '900',
    letterSpacing: 3,
    textAlign: 'center',
    marginBottom: 4,
  },
  headerSub: {
    color: LABEL_COLOR,
    fontSize: 13,
    textAlign: 'center',
    marginBottom: 4,
  },
  emptyContainer: {
    flex: 1,
    backgroundColor: BG,
    alignItems: 'center',
    paddingTop: 60,
    paddingHorizontal: 20,
  },
  emptyText: {
    color: VALUE_COLOR,
    fontSize: 16,
    fontWeight: '700',
    marginTop: 24,
  },
  emptySubText: {
    color: LABEL_COLOR,
    fontSize: 13,
    marginTop: 8,
    textAlign: 'center',
  },
  section: {
    backgroundColor: SECTION_BG,
    borderRadius: 14,
    padding: 16,
    gap: 10,
  },
  sectionTitle: {
    color: TITLE_COLOR,
    fontSize: 12,
    fontWeight: '900',
    letterSpacing: 2,
    textTransform: 'uppercase',
    marginBottom: 4,
  },
  statRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  statLabel: {
    color: LABEL_COLOR,
    fontSize: 13,
    flex: 1,
  },
  statValue: {
    color: VALUE_COLOR,
    fontSize: 13,
    fontWeight: '700',
    textAlign: 'right',
  },
  divider: {
    height: 1,
    backgroundColor: 'rgba(255,255,255,0.1)',
    marginVertical: 2,
  },
  tierRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginTop: 2,
  },
  tierItem: {
    flex: 1,
    alignItems: 'center',
    gap: 2,
  },
  tierDot: {
    fontSize: 16,
  },
  tierLabel: {
    color: LABEL_COLOR,
    fontSize: 10,
    textAlign: 'center',
  },
  tierCount: {
    color: VALUE_COLOR,
    fontSize: 15,
    fontWeight: '700',
  },
});
