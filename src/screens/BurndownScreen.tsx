import React, { useEffect, useState } from 'react';
import { Pressable, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { GameColumn } from '../components/GameColumn';
import { HelpModal } from '../components/HelpModal';
import { QueenModal } from '../components/QueenModal';
import { useGameStore } from '../store/gameStore';
import { ColumnId, GameCard } from '../types/game';
import { bestAceResolution } from '../utils/subsetSum';
import theme from '../theme';

interface BurndownScreenProps {
  onGameEnd: () => void;
}

function formatDelta(d: number): string {
  if (d === 0) return '0';
  return d > 0 ? `+${d}` : `${d}`;
}

export function BurndownScreen({ onGameEnd }: BurndownScreenProps) {
  const phase = useGameStore(s => s.phase);
  const columns = useGameStore(s => s.columns);
  const drawPile = useGameStore(s => s.drawPile);
  const selectedInstanceIds = useGameStore(s => s.selectedInstanceIds);
  const activeColumnId = useGameStore(s => s.activeColumnId);
  const hotfixUsed = useGameStore(s => s.hotfixUsed);
  const pendingQueen = useGameStore(s => s.pendingQueen);
  const startTime = useGameStore(s => s.startTime);
  const totalDelta = useGameStore(s => s.totalDelta);

  const clearSelection = useGameStore(s => s.clearSelection);
  const toggleCardSelection = useGameStore(s => s.toggleCardSelection);
  const confirmSelection = useGameStore(s => s.confirmSelection);
  const activateFaceCard = useGameStore(s => s.activateFaceCard);
  const resolveQueenKeep = useGameStore(s => s.resolveQueenKeep);
  const resolveQueenMove = useGameStore(s => s.resolveQueenMove);
  const activateHotfix = useGameStore(s => s.activateHotfix);
  const cancelHotfix = useGameStore(s => s.cancelHotfix);
  const applyHotfix = useGameStore(s => s.applyHotfix);

  const [elapsed, setElapsed] = useState(0);
  const [helpVisible, setHelpVisible] = useState(false);

  // Navigate when game ends
  useEffect(() => {
    if (phase === 'won' || phase === 'lost') {
      onGameEnd();
    }
  }, [phase]);

  // Timer
  useEffect(() => {
    if ((phase !== 'playing' && phase !== 'hotfix' && phase !== 'queen') || startTime === null) return;
    const id = setInterval(() => {
      setElapsed(Math.floor((Date.now() - startTime) / 1000));
    }, 1000);
    return () => clearInterval(id);
  }, [phase, startTime]);

  const formatTime = (s: number) => {
    const m = Math.floor(s / 60);
    const sec = s % 60;
    return `${m}:${sec.toString().padStart(2, '0')}`;
  };

  const activeCol = columns.find(c => c.id === activeColumnId);
  const selectedCards = activeCol
    ? activeCol.cards.filter(gc => selectedInstanceIds.includes(gc.instanceId))
    : [];

  // Optimal sum using best Ace resolution — what will actually be recorded on confirm
  const displaySum = selectedCards.length > 0
    ? bestAceResolution(selectedCards, activeCol?.budget ?? 0)
    : 0;
  const playDelta = activeCol ? displaySum - activeCol.budget : 0;

  const canConfirm = selectedCards.length > 0 && phase === 'playing';

  const handleCardPress = (gc: GameCard, columnId: ColumnId) => {
    if (phase === 'hotfix') {
      applyHotfix(gc.instanceId, columnId);
    } else if (!gc.resolved) {
      activateFaceCard(gc.instanceId, columnId);
    } else {
      toggleCardSelection(gc.instanceId, columnId);
    }
  };

  const deltaColor = totalDelta === 0 ? theme.colors.greenLight : totalDelta > 0 ? theme.colors.orange : theme.colors.errorRed;

  // Split 4 columns into two rows of two
  const row1 = columns.slice(0, 2);
  const row2 = columns.slice(2, 4);

  return (
    <View style={styles.screen}>
      {/* Header */}
      <View style={styles.header}>
        <Text style={styles.title}>BURNDOWN</Text>
        <Text style={styles.timer}>{formatTime(elapsed)}</Text>
        <View style={[styles.deltaBadge, { borderColor: deltaColor }]}>
          <Text style={[styles.deltaText, { color: deltaColor }]}>
            Δ {formatDelta(totalDelta)}
          </Text>
        </View>
        <View style={styles.drawPileInfo}>
          <Text style={styles.drawPileText}>Draw: {drawPile.length}</Text>
        </View>
        <TouchableOpacity style={styles.helpBtn} onPress={() => setHelpVisible(true)} hitSlop={8}>
          <Text style={styles.helpBtnText}>?</Text>
        </TouchableOpacity>
      </View>

      {/* 2×2 grid — Pressable background deselects on empty-space tap */}
      <Pressable style={styles.gridArea} onPress={clearSelection}>
        <View style={styles.gridRow} pointerEvents="box-none">
          {row1.map(col => (
            <GameColumn
              key={col.id}
              column={col}
              selectedInstanceIds={selectedInstanceIds}
              phase={phase}
              isActiveColumn={activeColumnId === col.id}
              onCardPress={(gc) => handleCardPress(gc, col.id)}
            />
          ))}
        </View>
        <View style={styles.gridRow} pointerEvents="box-none">
          {row2.map(col => (
            <GameColumn
              key={col.id}
              column={col}
              selectedInstanceIds={selectedInstanceIds}
              phase={phase}
              isActiveColumn={activeColumnId === col.id}
              onCardPress={(gc) => handleCardPress(gc, col.id)}
            />
          ))}
        </View>
      </Pressable>

      {/* Bottom bar */}
      <View style={styles.bottomBar}>
        {selectedCards.length > 0 && (
          <Text style={styles.playInfo}>
            {displaySum} pts
            {'  '}
            <Text style={{ color: playDelta <= 0 ? theme.colors.greenLight : theme.colors.orange }}>
              (Δ {formatDelta(playDelta)} this play)
            </Text>
          </Text>
        )}

        <View style={styles.bottomActions}>
          {canConfirm && (
            <TouchableOpacity style={[styles.btn, styles.confirmBtn]} onPress={confirmSelection}>
              <Text style={styles.btnText}>CONFIRM</Text>
            </TouchableOpacity>
          )}

          {phase === 'hotfix' ? (
            <TouchableOpacity style={[styles.btn, styles.cancelBtn]} onPress={cancelHotfix}>
              <Text style={styles.btnText}>CANCEL HOTFIX</Text>
            </TouchableOpacity>
          ) : (
            !hotfixUsed && phase === 'playing' && (
              <TouchableOpacity style={[styles.btn, styles.hotfixBtn]} onPress={activateHotfix}>
                <Text style={styles.btnText}>HOTFIX</Text>
              </TouchableOpacity>
            )
          )}
        </View>

        {phase === 'hotfix' && (
          <Text style={styles.hotfixHint}>Tap any card to swap it out</Text>
        )}
      </View>

      <HelpModal visible={helpVisible} onClose={() => setHelpVisible(false)} />

      <QueenModal
        visible={phase === 'queen'}
        sourceColumnId={pendingQueen?.sourceColumnId ?? null}
        onKeep={resolveQueenKeep}
        onMove={resolveQueenMove}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  screen: {
    flex: 1,
    backgroundColor: theme.colors.bgPrimary,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: theme.spacing.md,
    paddingTop: theme.spacing.ten,
    paddingBottom: theme.spacing.sm,
    gap: theme.spacing.sm,
  },
  title: {
    color: theme.colors.textPrimary,
    fontSize: theme.fontSizes.lg,
    fontWeight: theme.fontWeights.black,
    letterSpacing: 2,
    flex: 1,
  },
  timer: {
    color: theme.colors.textGreen,
    fontSize: theme.fontSizes.subtitle,
    fontWeight: theme.fontWeights.bold,
    fontVariant: ['tabular-nums'],
  },
  deltaBadge: {
    borderRadius: theme.radii.r8,
    paddingHorizontal: theme.spacing.seven,
    paddingVertical: theme.spacing.three,
    borderWidth: theme.borderWidths.medium,
  },
  deltaText: {
    fontSize: theme.fontSizes.md,
    fontWeight: theme.fontWeights.heavy,
    fontVariant: ['tabular-nums'],
  },
  drawPileInfo: {
    backgroundColor: theme.colors.bgPanel,
    borderRadius: theme.radii.r8,
    paddingHorizontal: theme.spacing.seven,
    paddingVertical: theme.spacing.three,
    borderWidth: theme.borderWidths.thin,
    borderColor: theme.colors.borderMedium,
  },
  drawPileText: {
    color: theme.colors.text70,
    fontSize: theme.fontSizes.s,
    fontWeight: theme.fontWeights.medium,
  },
  helpBtn: {
    width: 28,
    height: 28,
    borderRadius: theme.radii.lg,
    backgroundColor: theme.colors.borderMedium,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: theme.borderWidths.thin,
    borderColor: theme.colors.borderBright,
  },
  helpBtnText: {
    color: theme.colors.textPrimary,
    fontSize: theme.fontSizes.base,
    fontWeight: theme.fontWeights.heavy,
    lineHeight: 18,
  },
  gridArea: {
    flex: 1,
    paddingHorizontal: theme.spacing.six,
    paddingTop: theme.spacing.two,
  },
  gridRow: {
    flex: 1,
    flexDirection: 'row',
    marginBottom: theme.spacing.six,
  },
  bottomBar: {
    paddingHorizontal: theme.spacing.lg,
    paddingVertical: theme.spacing.ten,
    backgroundColor: theme.colors.bgPanel,
    borderTopWidth: 1,
    borderTopColor: theme.colors.borderFaint,
    minHeight: 64,
    justifyContent: 'center',
  },
  playInfo: {
    color: theme.colors.textGreen,
    fontSize: theme.fontSizes.m,
    fontWeight: theme.fontWeights.medium,
    textAlign: 'center',
    marginBottom: theme.spacing.sm,
  },
  bottomActions: {
    flexDirection: 'row',
    gap: theme.spacing.ten,
    justifyContent: 'center',
  },
  btn: {
    borderRadius: theme.radii.md,
    paddingVertical: theme.spacing.ten,
    paddingHorizontal: theme.spacing.xl,
    alignItems: 'center',
    justifyContent: 'center',
  },
  confirmBtn: {
    backgroundColor: theme.colors.greenSuccess,
  },
  hotfixBtn: {
    backgroundColor: theme.colors.orange,
  },
  cancelBtn: {
    backgroundColor: theme.colors.gray,
  },
  btnText: {
    color: theme.colors.textPrimary,
    fontSize: theme.fontSizes.m,
    fontWeight: theme.fontWeights.heavy,
    letterSpacing: 0.5,
  },
  hotfixHint: {
    color: theme.colors.text50,
    fontSize: theme.fontSizes.sm,
    textAlign: 'center',
    marginTop: theme.spacing.six,
    fontStyle: 'italic',
  },
});
