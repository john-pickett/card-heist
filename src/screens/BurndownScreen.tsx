import React, { useEffect, useState } from 'react';
import { Pressable, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { GameColumn } from '../components/GameColumn';
import { HelpModal } from '../components/HelpModal';
import { QueenModal } from '../components/QueenModal';
import { useGameStore } from '../store/gameStore';
import { ColumnId, GameCard } from '../types/game';
import { bestAceResolution } from '../utils/subsetSum';

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

  const deltaColor = totalDelta === 0 ? '#2ecc71' : totalDelta > 0 ? '#e67e22' : '#e74c3c';

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
            <Text style={{ color: playDelta <= 0 ? '#2ecc71' : '#e67e22' }}>
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
    backgroundColor: '#2d6a4f',
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 12,
    paddingTop: 10,
    paddingBottom: 8,
    gap: 8,
  },
  title: {
    color: '#ffffff',
    fontSize: 18,
    fontWeight: '900',
    letterSpacing: 2,
    flex: 1,
  },
  timer: {
    color: '#d8f3dc',
    fontSize: 16,
    fontWeight: '700',
    fontVariant: ['tabular-nums'],
  },
  deltaBadge: {
    borderRadius: 8,
    paddingHorizontal: 7,
    paddingVertical: 3,
    borderWidth: 1.5,
  },
  deltaText: {
    fontSize: 13,
    fontWeight: '800',
    fontVariant: ['tabular-nums'],
  },
  drawPileInfo: {
    backgroundColor: '#1b4332',
    borderRadius: 8,
    paddingHorizontal: 7,
    paddingVertical: 3,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.15)',
  },
  drawPileText: {
    color: 'rgba(255,255,255,0.7)',
    fontSize: 12,
    fontWeight: '600',
  },
  helpBtn: {
    width: 28,
    height: 28,
    borderRadius: 14,
    backgroundColor: 'rgba(255,255,255,0.15)',
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.25)',
  },
  helpBtnText: {
    color: '#ffffff',
    fontSize: 15,
    fontWeight: '800',
    lineHeight: 18,
  },
  gridArea: {
    flex: 1,
    paddingHorizontal: 6,
    paddingTop: 2,
  },
  gridRow: {
    flex: 1,
    flexDirection: 'row',
    marginBottom: 6,
  },
  bottomBar: {
    paddingHorizontal: 16,
    paddingVertical: 10,
    backgroundColor: '#1b4332',
    borderTopWidth: 1,
    borderTopColor: 'rgba(255,255,255,0.1)',
    minHeight: 64,
    justifyContent: 'center',
  },
  playInfo: {
    color: '#d8f3dc',
    fontSize: 14,
    fontWeight: '600',
    textAlign: 'center',
    marginBottom: 8,
  },
  bottomActions: {
    flexDirection: 'row',
    gap: 10,
    justifyContent: 'center',
  },
  btn: {
    borderRadius: 10,
    paddingVertical: 10,
    paddingHorizontal: 20,
    alignItems: 'center',
    justifyContent: 'center',
  },
  confirmBtn: {
    backgroundColor: '#27ae60',
  },
  hotfixBtn: {
    backgroundColor: '#e67e22',
  },
  cancelBtn: {
    backgroundColor: '#7f8c8d',
  },
  btnText: {
    color: '#ffffff',
    fontSize: 14,
    fontWeight: '800',
    letterSpacing: 0.5,
  },
  hotfixHint: {
    color: 'rgba(255,255,255,0.5)',
    fontSize: 11,
    textAlign: 'center',
    marginTop: 6,
    fontStyle: 'italic',
  },
});
