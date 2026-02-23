import React, { useState } from 'react';
import { ScrollView, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { runSimulation, runSweep, SimulationResult, SweepEntry } from '../utils/escapeSimulation';
import theme from '../theme';

interface Props {
  onBack: () => void;
  onResetHeistData: () => Promise<void>;
  onLaunchAct: (act: 'act1' | 'act2' | 'act3') => void;
}

type SimPreset = 100 | 1000 | 10000;

function SimStatRow({ label, value }: { label: string; value: string }) {
  return (
    <View style={styles.statRow}>
      <Text style={styles.statLabel}>{label}</Text>
      <Text style={styles.statValue}>{value}</Text>
    </View>
  );
}

export function DevelopmentScreen({ onBack, onResetHeistData, onLaunchAct }: Props) {
  const [resetMessage, setResetMessage] = useState<string | null>(null);

  const [simRunCount, setSimRunCount] = useState<SimPreset>(1000);
  const [simRunning, setSimRunning] = useState(false);
  const [simResult, setSimResult] = useState<SimulationResult | null>(null);

  const [sweepRunning, setSweepRunning] = useState(false);
  const [sweepResults, setSweepResults] = useState<SweepEntry[] | null>(null);

  const handleResetHeistData = async () => {
    try {
      await onResetHeistData();
      setResetMessage('All heist data cleared. Game state is now reset.');
    } catch {
      setResetMessage('Could not reset heist data right now. Please try again.');
    }
  };

  const handleRunSimulation = () => {
    setSimRunning(true);
    setSimResult(null);
    setTimeout(() => {
      setSimResult(runSimulation(simRunCount));
      setSimRunning(false);
    }, 16);
  };

  const handleRunSweep = () => {
    setSweepRunning(true);
    setSweepResults(null);
    setTimeout(() => {
      setSweepResults(runSweep(1000));
      setSweepRunning(false);
    }, 16);
  };

  const pct = (v: number) => `${Math.round(v * 100)}%`;
  const ci = (r: SimulationResult) =>
    `${Math.round(r.ciLow * 100)}% – ${Math.round(r.ciHigh * 100)}%`;

  const PRESETS: SimPreset[] = [100, 1000, 10000];

  return (
    <ScrollView style={styles.screen} contentContainerStyle={styles.content}>
      <Text style={styles.title}>DEVELOPMENT</Text>

      <TouchableOpacity style={styles.backButton} onPress={onBack} activeOpacity={0.85}>
        <Text style={styles.backButtonText}>Back to Settings</Text>
      </TouchableOpacity>

      <View style={[styles.panel, styles.panelSpaced]}>
        <Text style={styles.settingTitle}>Jump to Act</Text>
        <Text style={styles.settingDesc}>
          Start directly in a specific act for faster testing. Use the in-game Back to Dev button to return here.
        </Text>

        <View style={styles.jumpRow}>
          <TouchableOpacity style={styles.jumpBtn} onPress={() => onLaunchAct('act1')}>
            <Text style={styles.resetBtnText}>Act 1</Text>
          </TouchableOpacity>
          <TouchableOpacity style={styles.jumpBtn} onPress={() => onLaunchAct('act2')}>
            <Text style={styles.resetBtnText}>Act 2</Text>
          </TouchableOpacity>
          <TouchableOpacity style={styles.jumpBtn} onPress={() => onLaunchAct('act3')}>
            <Text style={styles.resetBtnText}>Act 3</Text>
          </TouchableOpacity>
        </View>
      </View>

      <View style={[styles.panel, styles.panelSpaced]}>
        <Text style={styles.settingTitle}>Reset Heist Data</Text>
        <Text style={styles.settingDesc}>
          Clear all heist progression and inventory as if the game were freshly installed.
        </Text>

        <TouchableOpacity style={[styles.resetBtn, styles.dangerBtn]} onPress={handleResetHeistData}>
          <Text style={styles.resetBtnText}>Reset All Heist Data</Text>
        </TouchableOpacity>

        {resetMessage && <Text style={styles.message}>{resetMessage}</Text>}
      </View>

      <View style={[styles.panel, styles.panelSpaced]}>
        <Text style={styles.settingTitle}>Escape Simulation</Text>
        <Text style={styles.settingDesc}>
          Run a simulation of Act 3 using optimal play.
        </Text>

        <View style={styles.presetRow}>
          {PRESETS.map(p => (
            <TouchableOpacity
              key={p}
              style={[styles.presetBtn, simRunCount === p && styles.presetBtnActive]}
              onPress={() => setSimRunCount(p)}
            >
              <Text style={[styles.presetBtnText, simRunCount === p && styles.presetBtnTextActive]}>
                {p.toLocaleString()}
              </Text>
            </TouchableOpacity>
          ))}
        </View>

        <TouchableOpacity
          style={[styles.resetBtn, simRunning && styles.btnDisabled]}
          onPress={handleRunSimulation}
          disabled={simRunning}
        >
          <Text style={styles.resetBtnText}>Run Simulation</Text>
        </TouchableOpacity>

        {simRunning && (
          <Text style={styles.runningText}>Running {simRunCount.toLocaleString()} games…</Text>
        )}

        {simResult && (
          <View style={styles.resultsBox}>
            <SimStatRow label="Escape rate" value={pct(simResult.escapePct)} />
            <SimStatRow label="Capture rate" value={pct(simResult.capturePct)} />
            <SimStatRow label="95% CI" value={ci(simResult)} />
            <SimStatRow label="Margin of error" value={`±${Math.round(simResult.marginOfError * 100)}%`} />
            <SimStatRow label="Avg turns/game" value={simResult.avgTurns.toFixed(1)} />
            <SimStatRow label="Avg player melds" value={simResult.avgPlayerMelds.toFixed(1)} />
            <SimStatRow label="Avg police melds" value={simResult.avgPoliceMelds.toFixed(1)} />
            <SimStatRow label="Sample size" value={simResult.n.toLocaleString()} />
            {simResult.infiniteLoopGuards > 0 && (
              <SimStatRow label="Loop guards" value={String(simResult.infiniteLoopGuards)} />
            )}
          </View>
        )}
      </View>

      <View style={[styles.panel, styles.panelSpaced]}>
        <Text style={styles.settingTitle}>Parameter Sweep</Text>
        <Text style={styles.settingDesc}>
          Run 8 configs × 1,000 games to find the 50–60% capture rate sweet spot.
        </Text>

        <TouchableOpacity
          style={[styles.resetBtn, sweepRunning && styles.btnDisabled]}
          onPress={handleRunSweep}
          disabled={sweepRunning}
        >
          <Text style={styles.resetBtnText}>Run Sweep</Text>
        </TouchableOpacity>

        {sweepRunning && (
          <Text style={styles.runningText}>Running 8,000 games…</Text>
        )}

        {sweepResults && (
          <View style={styles.resultsBox}>
            <View style={styles.sweepRow}>
              <Text style={[styles.sweepLabel, styles.sweepHeader]}>Config</Text>
              <Text style={[styles.sweepValue, styles.sweepHeader]}>Capture</Text>
              <Text style={[styles.sweepValue, styles.sweepHeader]}>Escape</Text>
            </View>
            {sweepResults.map(entry => {
              const capPct = entry.result.capturePct;
              const isTarget = capPct >= 0.50 && capPct <= 0.65;
              const isExtreme = capPct < 0.30 || capPct > 0.70;
              const captureStyle = isTarget
                ? styles.sweepValueTarget
                : isExtreme
                  ? styles.sweepValueExtreme
                  : undefined;
              return (
                <View key={entry.label} style={styles.sweepRow}>
                  <Text style={styles.sweepLabel}>{entry.label}</Text>
                  <Text style={[styles.sweepValue, captureStyle]}>{pct(capPct)}</Text>
                  <Text style={styles.sweepValue}>{pct(entry.result.escapePct)}</Text>
                </View>
              );
            })}
          </View>
        )}
      </View>
    </ScrollView>
  );
}

const { colors: c, spacing: s, fontSizes: f, fontWeights: w, radii: r, borderWidths: b } = theme;

const styles = StyleSheet.create({
  screen: {
    flex: 1,
    backgroundColor: c.bgPrimary,
  },
  content: {
    paddingTop: s.fourteen,
    paddingHorizontal: s.xl,
    paddingBottom: s.xl,
  },
  title: {
    color: c.textPrimary,
    fontSize: f.xl,
    fontWeight: w.black,
    letterSpacing: 3,
    marginBottom: s.xl,
    textAlign: 'center',
  },
  backButton: {
    alignSelf: 'flex-start',
    backgroundColor: c.bgPanel,
    borderRadius: r.md,
    borderWidth: b.thin,
    borderColor: c.borderLight,
    paddingVertical: s.ten,
    paddingHorizontal: s.fourteen,
  },
  backButtonText: {
    color: c.textPrimary,
    fontSize: f.md,
    fontWeight: w.bold,
  },
  panel: {
    backgroundColor: c.bgPanel,
    borderRadius: r.lg,
    borderWidth: b.thin,
    borderColor: c.borderLight,
    padding: s.lg,
    gap: s.ten,
  },
  panelSpaced: {
    marginTop: s.md,
  },
  settingTitle: {
    color: c.gold,
    fontSize: f.base,
    fontWeight: w.heavy,
  },
  settingDesc: {
    color: c.text72,
    fontSize: f.md,
    lineHeight: 18,
  },
  resetBtn: {
    marginTop: s.xs,
    alignSelf: 'flex-start',
    backgroundColor: c.greenPrimary,
    borderRadius: r.md,
    paddingVertical: s.ten,
    paddingHorizontal: s.fourteen,
    borderWidth: b.thin,
    borderColor: c.borderStrong,
  },
  dangerBtn: {
    backgroundColor: c.red,
  },
  btnDisabled: {
    opacity: 0.5,
  },
  resetBtnText: {
    color: c.textPrimary,
    fontSize: f.md,
    fontWeight: w.heavy,
  },
  message: {
    marginTop: s.xs,
    color: c.text78,
    fontSize: f.s,
  },
  presetRow: {
    flexDirection: 'row',
    gap: s.sm,
  },
  jumpRow: {
    flexDirection: 'row',
    gap: s.sm,
    flexWrap: 'wrap',
  },
  jumpBtn: {
    backgroundColor: c.bgDeep,
    borderRadius: r.md,
    borderWidth: b.thin,
    borderColor: c.borderLight,
    paddingVertical: s.ten,
    paddingHorizontal: s.fourteen,
    minWidth: 84,
    alignItems: 'center',
  },
  presetBtn: {
    backgroundColor: c.bgDeep,
    borderRadius: r.md,
    borderWidth: b.thin,
    borderColor: c.borderLight,
    paddingVertical: s.seven,
    paddingHorizontal: s.md,
  },
  presetBtnActive: {
    backgroundColor: c.greenPrimary,
    borderColor: c.borderStrong,
  },
  presetBtnText: {
    color: c.text60,
    fontSize: f.md,
    fontWeight: w.bold,
  },
  presetBtnTextActive: {
    color: c.textPrimary,
  },
  resultsBox: {
    backgroundColor: c.bgDeep,
    borderRadius: r.md,
    borderWidth: b.thin,
    borderColor: c.borderLight,
    padding: s.md,
    gap: s.seven,
    marginTop: s.xs,
  },
  statRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  statLabel: {
    color: c.text72,
    fontSize: f.md,
  },
  statValue: {
    color: c.textPrimary,
    fontSize: f.md,
    fontWeight: w.bold,
  },
  runningText: {
    color: c.text60,
    fontSize: f.md,
    fontStyle: 'italic',
  },
  sweepRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingVertical: 2,
  },
  sweepHeader: {
    fontWeight: w.heavy,
    color: c.textPrimary,
  },
  sweepLabel: {
    color: c.text72,
    fontSize: f.md,
    width: 120,
  },
  sweepValue: {
    color: c.textPrimary,
    fontSize: f.md,
    fontWeight: w.bold,
    width: 50,
    textAlign: 'right',
  },
  sweepValueTarget: {
    color: c.greenPastel,
  },
  sweepValueExtreme: {
    color: c.dangerMuted,
  },
});
