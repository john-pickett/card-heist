import React, { useEffect, useState } from 'react';
import {
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';
import { useSneakInStore } from '../store/sneakInStore';
import {
  AreaId,
  AREA_ICONS,
  AREA_LABELS,
  CardSource,
  SneakInCard,
} from '../types/sneakin';

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
  const t = Math.floor((ms % 1000) / 100);
  return `${m}:${String(s).padStart(2, '0')}.${t}`;
}

interface Props {
  onGameEnd: () => void;
}

export function SneakInScreen({ onGameEnd }: Props) {
  const phase = useSneakInStore(s => s.phase);
  const hand = useSneakInStore(s => s.hand);
  const areas = useSneakInStore(s => s.areas);
  const selectedCard = useSneakInStore(s => s.selectedCard);
  const selectedSource = useSneakInStore(s => s.selectedSource);
  const startTime = useSneakInStore(s => s.startTime);
  const endTime = useSneakInStore(s => s.endTime);

  const initGame = useSneakInStore(s => s.initGame);
  const selectCard = useSneakInStore(s => s.selectCard);
  const deselect = useSneakInStore(s => s.deselect);
  const placeOnArea = useSneakInStore(s => s.placeOnArea);
  const returnToHand = useSneakInStore(s => s.returnToHand);

  // Force re-render every 100ms while the timer is running
  const [, tick] = useState(0);
  useEffect(() => {
    if (phase !== 'playing') return;
    const interval = setInterval(() => tick(n => n + 1), 100);
    return () => clearInterval(interval);
  }, [phase]);

  useEffect(() => {
    if (phase === 'done') onGameEnd();
  }, [phase]);

  const elapsedMs = startTime ? (endTime ?? Date.now()) - startTime : 0;
  const solvedCount = areas.filter(a => a.isSolved).length;

  const canPlaceOn = (areaId: AreaId): boolean => {
    const area = areas[areaId];
    return !!selectedCard && area.isUnlocked && area.cards.length < 3;
  };

  const handleCardTap = (card: SneakInCard, source: CardSource) => {
    selectCard(card, source);
  };

  const isSelected = (instanceId: string) =>
    selectedCard?.instanceId === instanceId;

  // Split areas into two rows of two
  const rows = [areas.slice(0, 2), areas.slice(2, 4)];

  return (
    <View style={styles.screen}>
      {/* ── Header ───────────────────────────────────────── */}
      <View style={styles.header}>
        <Text style={styles.title}>SNEAK IN</Text>
        <View style={styles.timerBadge}>
          <Text style={styles.timerText}>{formatTime(elapsedMs)}</Text>
        </View>
        <View style={styles.progressBadge}>
          <Text style={styles.progressText}>{solvedCount}/4</Text>
        </View>
        <TouchableOpacity style={styles.newGameBtn} onPress={() => initGame()}>
          <Text style={styles.newGameText}>New</Text>
        </TouchableOpacity>
      </View>

      {/* ── Areas 2×2 grid ───────────────────────────────── */}
      <View style={styles.areasGrid}>
        {rows.map((row, rowIdx) => (
          <View key={rowIdx} style={styles.areasRow}>
            {row.map(area => {
              const locked = !area.isUnlocked;
              const active = area.isUnlocked && !area.isSolved;
              const cardSum = area.cards.reduce(
                (s, sc) => s + parseInt(sc.card.rank, 10),
                0
              );
              const dropping = canPlaceOn(area.id);

              return (
                <View
                  key={area.id}
                  style={[
                    styles.areaCard,
                    active && styles.areaCardActive,
                    area.isSolved && styles.areaCardSolved,
                    locked && styles.areaCardLocked,
                    dropping && !area.isSolved && styles.areaCardDropTarget,
                  ]}
                >
                  {/* Icon — big and centered */}
                  <Text style={[styles.areaIcon, locked && styles.dimmed]}>
                    {AREA_ICONS[area.id]}
                  </Text>

                  {/* Label */}
                  <Text style={[styles.areaLabel, locked && styles.dimmed]}>
                    {AREA_LABELS[area.id].toUpperCase()}
                  </Text>

                  {/* Target / locked / solved badge */}
                  {locked ? (
                    <Text style={styles.lockedLabel}>LOCKED</Text>
                  ) : area.isSolved ? (
                    <Text style={styles.solvedBadge}>✓ DONE</Text>
                  ) : (
                    <View style={styles.targetRow}>
                      <Text style={styles.targetLabel}>≤ </Text>
                      <Text style={styles.targetValue}>{area.target}</Text>
                    </View>
                  )}

                  {/* Cards + drop zone */}
                  {!locked && (
                    <View style={styles.cardsZone}>
                      <View style={styles.cardsRow}>
                        {area.cards.map(sc => {
                          const red = RED_SUITS.has(sc.card.suit);
                          const sel = isSelected(sc.instanceId);
                          return (
                            <TouchableOpacity
                              key={sc.instanceId}
                              style={[styles.chip, sel && styles.chipSelected]}
                              onPress={() => handleCardTap(sc, area.id)}
                              activeOpacity={0.7}
                            >
                              <Text style={[styles.chipRank, red && styles.red]}>
                                {sc.card.rank}
                              </Text>
                              <Text style={[styles.chipSuit, red && styles.red]}>
                                {SUIT_SYMBOL[sc.card.suit]}
                              </Text>
                            </TouchableOpacity>
                          );
                        })}

                        {dropping && (
                          <TouchableOpacity
                            style={styles.dropZone}
                            onPress={() => placeOnArea(area.id)}
                            activeOpacity={0.7}
                          >
                            <Text style={styles.dropZoneText}>+</Text>
                          </TouchableOpacity>
                        )}
                      </View>

                      {area.cards.length > 0 && (
                        <Text
                          style={[
                            styles.sumText,
                            area.isSolved && styles.sumTextSolved,
                          ]}
                        >
                          {area.isSolved ? `${cardSum} ✓` : `${cardSum} of ${area.target}`}
                        </Text>
                      )}
                    </View>
                  )}
                </View>
              );
            })}
          </View>
        ))}
      </View>

      {/* ── Bottom dock: lifted card indicator + hand ─────── */}
      <View style={styles.dock}>
        {selectedCard ? (
          <View style={styles.liftedRow}>
            {/* The card being carried */}
            <View
              style={[
                styles.liftedChip,
                RED_SUITS.has(selectedCard.card.suit) && styles.liftedChipRed,
              ]}
            >
              <Text
                style={[
                  styles.liftedRank,
                  RED_SUITS.has(selectedCard.card.suit) && styles.red,
                ]}
              >
                {selectedCard.card.rank}
              </Text>
              <Text
                style={[
                  styles.liftedSuit,
                  RED_SUITS.has(selectedCard.card.suit) && styles.red,
                ]}
              >
                {SUIT_SYMBOL[selectedCard.card.suit]}
              </Text>
            </View>

            <Text style={styles.liftedHint}>Tap an unlocked area to place</Text>

            {/* Return to source */}
            <TouchableOpacity style={styles.returnBtn} onPress={deselect}>
              <Text style={styles.returnBtnText}>↩</Text>
            </TouchableOpacity>

            {/* "To Hand" — only shown when card came from an area */}
            {selectedSource !== 'hand' && (
              <TouchableOpacity style={styles.toHandBtn} onPress={returnToHand}>
                <Text style={styles.toHandBtnText}>Hand</Text>
              </TouchableOpacity>
            )}
          </View>
        ) : (
          <Text style={styles.dockHint}>
            {phase === 'idle'
              ? 'Pick a card to start the clock'
              : 'Tap a card to pick it up'}
          </Text>
        )}

        {/* Hand of cards */}
        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          contentContainerStyle={styles.handContent}
        >
          {hand.map(sc => {
            const red = RED_SUITS.has(sc.card.suit);
            const sel = isSelected(sc.instanceId);
            return (
              <TouchableOpacity
                key={sc.instanceId}
                style={[
                  styles.handCard,
                  sel && styles.handCardSelected,
                ]}
                onPress={() => handleCardTap(sc, 'hand')}
                activeOpacity={0.75}
              >
                <Text style={[styles.handRank, red && styles.red]}>
                  {sc.card.rank}
                </Text>
                <Text style={[styles.handSuit, red && styles.red]}>
                  {SUIT_SYMBOL[sc.card.suit]}
                </Text>
              </TouchableOpacity>
            );
          })}
          {hand.length === 0 && (
            <Text style={styles.emptyHand}>All cards placed</Text>
          )}
        </ScrollView>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  screen: {
    flex: 1,
    backgroundColor: '#2d6a4f',
  },

  // ── Header
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
  timerBadge: {
    backgroundColor: '#1b4332',
    borderRadius: 8,
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.15)',
  },
  timerText: {
    color: '#d8f3dc',
    fontSize: 15,
    fontWeight: '700',
    fontVariant: ['tabular-nums'],
  },
  progressBadge: {
    backgroundColor: '#1b4332',
    borderRadius: 8,
    paddingHorizontal: 8,
    paddingVertical: 4,
  },
  progressText: {
    color: 'rgba(255,255,255,0.65)',
    fontSize: 13,
    fontWeight: '700',
  },
  newGameBtn: {
    backgroundColor: 'rgba(255,255,255,0.12)',
    borderRadius: 8,
    paddingHorizontal: 10,
    paddingVertical: 4,
  },
  newGameText: {
    color: 'rgba(255,255,255,0.75)',
    fontSize: 12,
    fontWeight: '700',
  },

  // ── 2×2 Areas grid
  areasGrid: {
    flex: 1,
    padding: 8,
    gap: 8,
  },
  areasRow: {
    flex: 1,
    flexDirection: 'row',
    gap: 8,
  },
  areaCard: {
    flex: 1,
    backgroundColor: '#1b4332',
    borderRadius: 16,
    padding: 12,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1.5,
    borderColor: 'rgba(255,255,255,0.08)',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.3,
    shadowRadius: 4,
    elevation: 3,
  },
  // Spotlight: unlocked and unsolved
  areaCardActive: {
    borderColor: 'rgba(116,198,157,0.45)',
    shadowColor: '#b7e4c7',
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0.9,
    shadowRadius: 22,
    elevation: 18,
  },
  // Solved: gold border, spotlight off
  areaCardSolved: {
    borderColor: '#f4d03f',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.15,
    shadowRadius: 3,
    elevation: 2,
  },
  // Locked: very dimmed
  areaCardLocked: {
    opacity: 0.3,
    shadowOpacity: 0,
    elevation: 0,
  },
  // Drop target
  areaCardDropTarget: {
    borderColor: '#74c69d',
    borderStyle: 'dashed',
  },

  // Icon — large, centered
  areaIcon: {
    fontSize: 52,
    textAlign: 'center',
    marginBottom: 6,
  },
  areaLabel: {
    color: 'rgba(255,255,255,0.5)',
    fontSize: 9,
    fontWeight: '800',
    letterSpacing: 1,
    textAlign: 'center',
    marginBottom: 4,
  },
  dimmed: {
    opacity: 0.5,
  },
  lockedLabel: {
    color: 'rgba(255,255,255,0.35)',
    fontSize: 10,
    fontWeight: '600',
    letterSpacing: 0.5,
  },
  solvedBadge: {
    color: '#f4d03f',
    fontSize: 11,
    fontWeight: '800',
    letterSpacing: 0.5,
  },
  targetRow: {
    flexDirection: 'row',
    alignItems: 'baseline',
  },
  targetLabel: {
    color: 'rgba(255,255,255,0.4)',
    fontSize: 13,
    fontWeight: '700',
  },
  targetValue: {
    color: '#ffffff',
    fontSize: 26,
    fontWeight: '900',
    lineHeight: 30,
  },

  // Cards zone
  cardsZone: {
    marginTop: 8,
    alignItems: 'center',
    gap: 4,
  },
  cardsRow: {
    flexDirection: 'row',
    gap: 5,
    flexWrap: 'wrap',
    justifyContent: 'center',
  },
  chip: {
    backgroundColor: '#ffffff',
    borderRadius: 7,
    width: 40,
    height: 50,
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.22,
    shadowRadius: 2,
    elevation: 2,
  },
  chipSelected: {
    borderWidth: 2.5,
    borderColor: '#f4d03f',
    transform: [{ translateY: -3 }],
  },
  chipRank: {
    fontSize: 15,
    fontWeight: '900',
    color: '#111111',
  },
  chipSuit: {
    fontSize: 12,
    color: '#111111',
    marginTop: -2,
  },
  dropZone: {
    width: 40,
    height: 50,
    borderRadius: 7,
    borderWidth: 2,
    borderColor: '#74c69d',
    borderStyle: 'dashed',
    alignItems: 'center',
    justifyContent: 'center',
  },
  dropZoneText: {
    color: '#74c69d',
    fontSize: 22,
    fontWeight: '300',
    lineHeight: 26,
  },
  sumText: {
    color: 'rgba(255,255,255,0.55)',
    fontSize: 11,
    fontWeight: '600',
    fontVariant: ['tabular-nums'],
  },
  sumTextSolved: {
    color: '#f4d03f',
    fontWeight: '800',
    fontSize: 12,
  },
  red: {
    color: '#c0392b',
  },

  // ── Dock
  dock: {
    backgroundColor: '#1b4332',
    borderTopWidth: 1,
    borderTopColor: 'rgba(255,255,255,0.1)',
    paddingTop: 8,
    paddingBottom: 10,
    gap: 8,
  },

  // Lifted card row
  liftedRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 12,
    gap: 8,
  },
  liftedChip: {
    backgroundColor: '#ffffff',
    borderRadius: 9,
    width: 50,
    height: 62,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 2.5,
    borderColor: '#f4d03f',
    shadowColor: '#f4d03f',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.4,
    shadowRadius: 4,
    elevation: 4,
  },
  liftedChipRed: {},
  liftedRank: {
    fontSize: 18,
    fontWeight: '900',
    color: '#111111',
  },
  liftedSuit: {
    fontSize: 15,
    color: '#111111',
    marginTop: -2,
  },
  liftedHint: {
    color: 'rgba(255,255,255,0.5)',
    fontSize: 11,
    flex: 1,
    fontStyle: 'italic',
  },
  returnBtn: {
    backgroundColor: 'rgba(255,255,255,0.1)',
    borderRadius: 8,
    paddingHorizontal: 10,
    paddingVertical: 7,
  },
  returnBtnText: {
    color: '#ffffff',
    fontSize: 17,
  },
  toHandBtn: {
    backgroundColor: '#40916c',
    borderRadius: 8,
    paddingHorizontal: 10,
    paddingVertical: 7,
  },
  toHandBtnText: {
    color: '#ffffff',
    fontSize: 12,
    fontWeight: '700',
  },
  dockHint: {
    color: 'rgba(255,255,255,0.35)',
    fontSize: 11,
    textAlign: 'center',
    paddingHorizontal: 12,
    fontStyle: 'italic',
  },

  // Hand
  handContent: {
    paddingHorizontal: 12,
    gap: 8,
    alignItems: 'center',
  },
  handCard: {
    backgroundColor: '#ffffff',
    borderRadius: 10,
    width: 54,
    height: 68,
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.25,
    shadowRadius: 3,
    elevation: 3,
  },
  handCardSelected: {
    borderWidth: 3,
    borderColor: '#f4d03f',
    transform: [{ translateY: -5 }],
  },
  handRank: {
    fontSize: 19,
    fontWeight: '900',
    color: '#111111',
  },
  handSuit: {
    fontSize: 15,
    color: '#111111',
    marginTop: -2,
  },
  emptyHand: {
    color: 'rgba(255,255,255,0.35)',
    fontSize: 12,
    fontStyle: 'italic',
    alignSelf: 'center',
  },
});
