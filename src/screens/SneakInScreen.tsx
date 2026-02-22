import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import {
  Animated,
  Image,
  PanResponder,
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';
import { useSneakInStore } from '../store/sneakInStore';
import { useInventoryStore } from '../store/inventoryStore';
import {
  AreaId,
  AREA_ICONS,
  AREA_LABELS,
  CardSource,
  SneakInCard,
} from '../types/sneakin';
import { SneakInHelpModal } from '../components/SneakInHelpModal';
import { useCardSound } from '../hooks/useCardSound';
import { ActTutorialOverlay } from '../components/ActTutorialOverlay';
import theme from '../theme';

const SUIT_SYMBOL: Record<string, string> = {
  spades: '♠',
  hearts: '♥',
  diamonds: '♦',
  clubs: '♣',
};
const RED_SUITS = new Set(['hearts', 'diamonds']);
const AREA_IDS: AreaId[] = [0, 1, 2, 3];

type DropRect = { x: number; y: number; width: number; height: number };

type ActiveDrag = {
  card: SneakInCard;
  source: CardSource;
  startX: number; // card top-left in screen-container local coords
  startY: number;
  width: number;
  height: number;
};

const TOTAL_TIME_MS = 120_000;

function formatTime(ms: number): string {
  const totalSec = Math.floor(ms / 1000);
  const m = Math.floor(totalSec / 60);
  const s = totalSec % 60;
  const t = Math.floor((ms % 1000) / 100);
  return `${m}:${String(s).padStart(2, '0')}.${t}`;
}

function pointInRect(x: number, y: number, rect: DropRect): boolean {
  return x >= rect.x && x <= rect.x + rect.width && y >= rect.y && y <= rect.y + rect.height;
}

// ---------------------------------------------------------------------------
// DraggableCard — writes directly to a screen-level dragPan ValueXY so the
// ghost card (rendered at the screen root) can float above everything.
// ---------------------------------------------------------------------------

interface DraggableCardProps {
  card: SneakInCard;
  source: CardSource;
  style: object;
  isDragging: boolean; // true → hide this card (ghost is shown instead)
  dragPan: Animated.ValueXY; // screen-level pan shared with ghost
  onDragStart: (
    card: SneakInCard,
    source: CardSource,
    screenX: number,
    screenY: number,
    w: number,
    h: number,
  ) => void;
  onDragEnd: (dropX: number, dropY: number) => void;
  children: React.ReactNode;
}

function DraggableCard({
  card,
  source,
  style,
  isDragging,
  dragPan,
  onDragStart,
  onDragEnd,
  children,
}: DraggableCardProps) {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const cardRef = useRef<any>(null);

  const panResponder = useMemo(
    () =>
      PanResponder.create({
        onStartShouldSetPanResponder: () => true,
        onStartShouldSetPanResponderCapture: () => true,
        onMoveShouldSetPanResponder: () => true,
        onMoveShouldSetPanResponderCapture: () => true,
        onPanResponderGrant: () => {
          cardRef.current?.measureInWindow(
            (x: number, y: number, w: number, h: number) => {
              dragPan.setValue({ x: 0, y: 0 });
              onDragStart(card, source, x, y, w, h);
            },
          );
        },
        onPanResponderMove: Animated.event([null, { dx: dragPan.x, dy: dragPan.y }], {
          useNativeDriver: false,
        }),
        onPanResponderRelease: (_: unknown, g: { moveX: number; moveY: number }) => {
          onDragEnd(g.moveX, g.moveY);
        },
        onPanResponderTerminate: () => {
          onDragEnd(-1, -1); // -1 signals a cancelled drag
        },
        onPanResponderTerminationRequest: () => false, // never yield the gesture
      }),
    // dragPan is a stable ref — intentionally omitted from deps.
    // onDragStart is stable (empty useCallback deps).
    // onDragEnd is stable (only depends on dragPan + zustand stable fns).
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [card.instanceId, source, onDragStart, onDragEnd],
  );

  return (
    <Animated.View
      ref={cardRef}
      {...panResponder.panHandlers}
      style={[style, isDragging && { opacity: 0 }]}
    >
      {children}
    </Animated.View>
  );
}

// ---------------------------------------------------------------------------
// Screen
// ---------------------------------------------------------------------------

interface Props {
  onGameEnd: () => void;
  showTutorial: boolean;
  onDismissTutorial: () => void;
}

export function SneakInScreen({ onGameEnd, showTutorial, onDismissTutorial }: Props) {
  const phase = useSneakInStore(s => s.phase);
  const hand = useSneakInStore(s => s.hand);
  const areas = useSneakInStore(s => s.areas);
  const startTime = useSneakInStore(s => s.startTime);
  const endTime = useSneakInStore(s => s.endTime);
  const timeBonusMs = useSneakInStore(s => s.timeBonusMs);
  const insideTipHint = useSneakInStore(s => s.insideTipHint);
  const moveCard = useSneakInStore(s => s.moveCard);
  const returnAreaToHand = useSneakInStore(s => s.returnAreaToHand);
  const returnAllToHand = useSneakInStore(s => s.returnAllToHand);
  const timeoutGame = useSneakInStore(s => s.timeoutGame);
  const { activateFalseAlarm, activateInsideTip, clearInsideTipHint } = useSneakInStore.getState();

  const inventoryItems = useInventoryStore(s => s.items);
  const { removeItem } = useInventoryStore.getState();

  const falseAlarmQty = inventoryItems.find(e => e.itemId === 'false-alarm')?.quantity ?? 0;
  const insideTipQty = inventoryItems.find(e => e.itemId === 'inside-tip')?.quantity ?? 0;
  const hasFalseAlarm = falseAlarmQty > 0;
  const hasInsideTip = insideTipQty > 0;
  const showBuffToolbar = hasFalseAlarm || hasInsideTip;

  const [helpVisible, setHelpVisible] = useState(false);
  const [pickingHintArea, setPickingHintArea] = useState(false);
  const { playTap } = useCardSound();

  // --- Screen-level drag state ---
  const dragPan = useRef(new Animated.ValueXY()).current;
  const [activeDrag, setActiveDrag] = useState<ActiveDrag | null>(null);
  // Ref so onDragEnd callback (inside useMemo) always sees the latest value
  const activeDragRef = useRef<ActiveDrag | null>(null);
  useEffect(() => {
    activeDragRef.current = activeDrag;
  }, [activeDrag]);

  // Offset of the screen root view in window coords — used to convert
  // measureInWindow (window-relative) to local position for the ghost card.
  const screenRef = useRef<View>(null);
  const screenOffsetRef = useRef({ x: 0, y: 0 });

  // --- Drop-target measurement ---
  const areaRefs = useRef<Partial<Record<AreaId, View | null>>>({});
  const handDropRef = useRef<View | null>(null);
  const dockRef = useRef<View | null>(null);

  const [areaRects, setAreaRects] = useState<Partial<Record<AreaId, DropRect>>>({});
  const [handRect, setHandRect] = useState<DropRect | null>(null);
  const [dockRect, setDockRect] = useState<DropRect | null>(null);

  const measureDropTargets = useCallback(() => {
    AREA_IDS.forEach(id => {
      const ref = areaRefs.current[id];
      if (!ref) return;
      ref.measureInWindow((x, y, width, height) => {
        if (width <= 0 || height <= 0) return;
        setAreaRects(prev => ({ ...prev, [id]: { x, y, width, height } }));
      });
    });

    if (handDropRef.current) {
      handDropRef.current.measureInWindow((x, y, width, height) => {
        if (width <= 0 || height <= 0) return;
        setHandRect({ x, y, width, height });
      });
    }

    if (dockRef.current) {
      dockRef.current.measureInWindow((x, y, width, height) => {
        if (width <= 0 || height <= 0) return;
        setDockRect({ x, y, width, height });
      });
    }
  }, []);

  const scheduleMeasure = useCallback(() => {
    requestAnimationFrame(() => {
      measureDropTargets();
    });
  }, [measureDropTargets]);

  const effectiveTotalMs = TOTAL_TIME_MS + timeBonusMs;
  const warningThresholdMs = effectiveTotalMs * (30_000 / 120_000);
  const dangerThresholdMs  = effectiveTotalMs * (10_000 / 120_000);

  // Force re-render every 100 ms while the timer is running; also check for timeout.
  const [, tick] = useState(0);
  useEffect(() => {
    if (phase !== 'playing') return;
    const interval = setInterval(() => {
      tick(n => n + 1);
      if (startTime && Date.now() - startTime >= effectiveTotalMs) {
        timeoutGame();
      }
    }, 100);
    return () => clearInterval(interval);
  }, [phase, startTime, timeoutGame, effectiveTotalMs]);

  useEffect(() => {
    scheduleMeasure();
  }, [areas, hand, scheduleMeasure]);

  const elapsedMs = startTime ? (endTime ?? Date.now()) - startTime : 0;
  const remainingMs = Math.max(0, effectiveTotalMs - elapsedMs);
  const solvedCount = areas.filter(a => a.isSolved).length;

  // Keep resolveDropTarget in a ref so handleDragEnd stays stable even when
  // measured rects update mid-drag.
  const resolveDropTarget = useCallback(
    (dropX: number, dropY: number): CardSource | null => {
      for (const id of AREA_IDS) {
        const rect = areaRects[id];
        const area = areas[id];
        if (!rect) continue;
        if (!area.isUnlocked || area.cards.length >= 3) continue;
        if (pointInRect(dropX, dropY, rect)) return id;
      }
      if (dockRect && pointInRect(dropX, dropY, dockRect)) return 'hand';
      if (handRect && pointInRect(dropX, dropY, handRect)) return 'hand';
      return null;
    },
    [areaRects, areas, dockRect, handRect],
  );
  const resolveDropTargetRef = useRef(resolveDropTarget);
  useEffect(() => {
    resolveDropTargetRef.current = resolveDropTarget;
  }, [resolveDropTarget]);

  // Stable: only depends on dragPan (stable) and zustand's moveCard (stable)
  const handleDragStart = useCallback(
    (
      card: SneakInCard,
      source: CardSource,
      screenX: number,
      screenY: number,
      w: number,
      h: number,
    ) => {
      const { x: ox, y: oy } = screenOffsetRef.current;
      setActiveDrag({
        card,
        source,
        startX: screenX - ox,
        startY: screenY - oy,
        width: w,
        height: h,
      });
    },
    [],
  );

  const handleDragEnd = useCallback(
    (dropX: number, dropY: number) => {
      const drag = activeDragRef.current;
      if (!drag) return;
      setActiveDrag(null);
      dragPan.setValue({ x: 0, y: 0 });
      if (dropX < 0) return; // terminated / cancelled
      const target = resolveDropTargetRef.current(dropX, dropY);
      if (target !== null && target !== drag.source) {
        moveCard(drag.card, drag.source, target);
        if (typeof target === 'number') playTap();
      }
    },
    [dragPan, moveCard, playTap],
  );

  const hasAnyReturnable = areas.some(a => a.isUnlocked && a.cards.length > 0);

  const rows = [areas.slice(0, 2), areas.slice(2, 4)];
  const tutorialParagraph =
    'Drag cards from your hand into unlocked areas and match each target sum to crack every zone. Each zone requires two or three cards (no more and no less!).' +
    ' You can move cards back and forth to fix mistakes, but the timer never stops, so solve all four quickly to lock in the best bonus.';

  useEffect(() => {
    if (phase === 'done' || phase === 'timeout') onGameEnd();
  }, [phase, onGameEnd]);

  return (
    <View
      ref={screenRef}
      style={styles.screen}
      onLayout={() => {
        screenRef.current?.measureInWindow((x, y) => {
          screenOffsetRef.current = { x, y };
        });
        scheduleMeasure();
      }}
    >
      {/* Header */}
      <View style={styles.header}>
        <Text style={styles.title}>SNEAK IN</Text>
        <View style={[
          styles.timerBadge,
          remainingMs <= warningThresholdMs && styles.timerBadgeWarning,
          remainingMs <= dangerThresholdMs && styles.timerBadgeDanger,
        ]}>
          <Text style={[
            styles.timerText,
            remainingMs <= warningThresholdMs && styles.timerTextWarning,
            remainingMs <= dangerThresholdMs && styles.timerTextDanger,
          ]}>
            {formatTime(remainingMs)}
          </Text>
        </View>
        <View style={styles.progressBadge}>
          <Text style={styles.progressText}>{solvedCount}/4</Text>
        </View>
        <TouchableOpacity style={styles.helpBtn} onPress={() => setHelpVisible(true)}>
          <Text style={styles.helpBtnText}>Help</Text>
        </TouchableOpacity>
      </View>

      {showBuffToolbar && (
        <View style={styles.buffToolbar}>
          {hasFalseAlarm && (
            <TouchableOpacity
              style={styles.buffToolbarBtn}
              onPress={() => {
                activateFalseAlarm();
                removeItem('false-alarm');
              }}
            >
              <Text style={styles.buffToolbarBtnText}>
                {'🚨 +1:00'}
                <Text style={styles.buffToolbarBtnQtyText}> x{falseAlarmQty}</Text>
              </Text>
            </TouchableOpacity>
          )}
          {hasInsideTip && (
            <TouchableOpacity
              style={styles.buffToolbarBtn}
              onPress={() => setPickingHintArea(true)}
            >
              <Text style={styles.buffToolbarBtnText}>
                {'🕵️ Hint'}
                <Text style={styles.buffToolbarBtnQtyText}> x{insideTipQty}</Text>
              </Text>
            </TouchableOpacity>
          )}
        </View>
      )}

      {/* Areas grid */}
      <View style={styles.areasGrid} onLayout={scheduleMeasure}>
        {rows.map((row, rowIdx) => (
          <View key={rowIdx} style={styles.areasRow}>
            {row.map(area => {
              const locked = !area.isUnlocked;
              const active = area.isUnlocked && !area.isSolved;
              const cardSum = area.cards.reduce(
                (s, sc) => s + parseInt(sc.card.rank, 10),
                0,
              );
              const isDragTarget =
                activeDrag !== null &&
                area.isUnlocked &&
                !area.isSolved &&
                area.cards.length < 3 &&
                activeDrag.source !== area.id;

              return (
                <View
                  key={area.id}
                  ref={node => {
                    areaRefs.current[area.id] = node;
                  }}
                  onLayout={scheduleMeasure}
                  style={[
                    styles.areaCard,
                    active && styles.areaCardActive,
                    area.isSolved && styles.areaCardSolved,
                    locked && styles.areaCardLocked,
                    isDragTarget && styles.areaCardDropTarget,
                  ]}
                >
                  {area.isUnlocked && area.cards.length > 0 && !activeDrag && (
                    <TouchableOpacity
                      style={styles.areaReturnBtn}
                      onPress={() => returnAreaToHand(area.id)}
                      hitSlop={8}
                    >
                      <Text style={styles.areaReturnBtnText}>↩</Text>
                    </TouchableOpacity>
                  )}

                  <Text style={[styles.areaIcon, locked && styles.dimmed]}>
                    {AREA_ICONS[area.id]}
                  </Text>

                  <Text style={[styles.areaLabel, locked && styles.dimmed]}>
                    {AREA_LABELS[area.id].toUpperCase()}
                  </Text>
                  {insideTipHint?.areaId === area.id && !area.isSolved && (
                    <Text style={styles.areaHintLabel}>💡</Text>
                  )}

                  {locked ? (
                    <Text style={styles.lockedLabel}>LOCKED</Text>
                  ) : area.isSolved ? (
                    <Text style={styles.solvedBadge}>✓ DONE</Text>
                  ) : (
                    <View style={styles.targetRow}>
                      <Text style={styles.targetValue}>{area.target}</Text>
                    </View>
                  )}

                  {!locked && (
                    <>
                      <View style={styles.cardsZone}>
                        <View style={styles.cardsRow}>
                          {area.cards.map(sc => {
                            const red = RED_SUITS.has(sc.card.suit);
                            return (
                              <DraggableCard
                                key={sc.instanceId}
                                card={sc}
                                source={area.id}
                                style={styles.chip}
                                isDragging={activeDrag?.card.instanceId === sc.instanceId}
                                dragPan={dragPan}
                                onDragStart={handleDragStart}
                                onDragEnd={handleDragEnd}
                              >
                                <Text style={[styles.chipRank, red && styles.red]}>
                                  {sc.card.rank}
                                </Text>
                                <Text style={[styles.chipSuit, red && styles.red]}>
                                  {SUIT_SYMBOL[sc.card.suit]}
                                </Text>
                              </DraggableCard>
                            );
                          })}
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

                      {area.failedCombos.length > 0 && (
                        <View style={styles.failedCombosSection}>
                          <Text style={styles.failedCombosLabel}>Tried</Text>
                          {area.failedCombos.map((combo, idx) => (
                            <View key={idx} style={styles.failedComboRow}>
                              {combo.map(sc => {
                                const red = RED_SUITS.has(sc.card.suit);
                                return (
                                  <View key={sc.instanceId} style={styles.failedChip}>
                                    <Text style={[styles.failedChipText, red && styles.failedChipRed]}>
                                      {sc.card.rank}
                                    </Text>
                                  </View>
                                );
                              })}
                              <Text style={styles.failedComboSum}>
                                ={combo.reduce((s, sc) => s + parseInt(sc.card.rank, 10), 0)}
                              </Text>
                            </View>
                          ))}
                        </View>
                      )}
                    </>
                  )}
                </View>
              );
            })}
          </View>
        ))}
      </View>

      {/* Dock / hand */}
      <View ref={dockRef} style={styles.dock} onLayout={scheduleMeasure}>
        <Text style={styles.dockHint}>
          {phase === 'idle'
            ? 'Drag a card into an unlocked area to start the clock'
            : 'Drag cards between areas or back to your hand'}
        </Text>

        {(phase === 'playing' || phase === 'idle') && (
          <View style={styles.toolbar}>
            {insideTipHint && (
              <TouchableOpacity style={styles.toolbarBtn} onPress={clearInsideTipHint}>
                <Text style={styles.toolbarBtnText}>✕ hint</Text>
              </TouchableOpacity>
            )}
            <TouchableOpacity
              style={[styles.toolbarBtn, (!hasAnyReturnable || !!activeDrag) && styles.toolbarBtnDisabled]}
              disabled={!hasAnyReturnable || !!activeDrag}
              onPress={returnAllToHand}
            >
              <Text style={[styles.toolbarBtnText, (!hasAnyReturnable || !!activeDrag) && styles.toolbarBtnTextDisabled]}>
                ↩ Return All
              </Text>
            </TouchableOpacity>
          </View>
        )}

        <View ref={handDropRef} onLayout={scheduleMeasure} style={styles.handDropZone}>
          <ScrollView
            horizontal
            showsHorizontalScrollIndicator={false}
            contentContainerStyle={styles.handContent}
          >
            {hand.map(sc => {
              const red = RED_SUITS.has(sc.card.suit);
              const isHinted = insideTipHint?.card.instanceId === sc.instanceId;
              return (
                <DraggableCard
                  key={sc.instanceId}
                  card={sc}
                  source="hand"
                  style={[styles.handCard, isHinted && styles.handCardHinted]}
                  isDragging={activeDrag?.card.instanceId === sc.instanceId}
                  dragPan={dragPan}
                  onDragStart={handleDragStart}
                  onDragEnd={handleDragEnd}
                >
                  <Text style={[styles.handRank, red && styles.red]}>
                    {sc.card.rank}
                  </Text>
                  <Text style={[styles.handSuit, red && styles.red]}>
                    {SUIT_SYMBOL[sc.card.suit]}
                  </Text>
                </DraggableCard>
              );
            })}
            {hand.length === 0 && (
              <Text style={styles.emptyHand}>All cards placed</Text>
            )}
          </ScrollView>
        </View>
      </View>

      {pickingHintArea && (
        <View style={styles.hintPickerOverlay}>
          <Text style={styles.hintPickerTitle}>Choose an area to reveal a hint:</Text>
          {AREA_IDS.map(areaId => (
            <TouchableOpacity
              key={areaId}
              style={styles.hintPickerCard}
              onPress={() => {
                activateInsideTip(areaId);
                removeItem('inside-tip');
                setPickingHintArea(false);
              }}
            >
              <Text style={styles.hintPickerCardIcon}>{AREA_ICONS[areaId]}</Text>
              <Text style={styles.hintPickerCardLabel}>{AREA_LABELS[areaId]}</Text>
            </TouchableOpacity>
          ))}
          <TouchableOpacity
            style={[styles.hintPickerCard, styles.hintPickerCancel]}
            onPress={() => setPickingHintArea(false)}
          >
            <Text style={styles.hintPickerCancelText}>Cancel</Text>
          </TouchableOpacity>
        </View>
      )}

      <SneakInHelpModal visible={helpVisible} onClose={() => setHelpVisible(false)} />

      {/* Ghost card — rendered last so it paints above everything */}
      {activeDrag &&
        (() => {
          const { card, startX, startY, width, height } = activeDrag;
          const red = RED_SUITS.has(card.card.suit);
          const isHandCard = activeDrag.source === 'hand';
          return (
            <Animated.View
              pointerEvents="none"
              style={[
                styles.ghostCard,
                isHandCard ? styles.ghostHandCard : styles.ghostChip,
                {
                  left: startX,
                  top: startY,
                  width,
                  height,
                  transform: dragPan.getTranslateTransform(),
                },
              ]}
            >
              <Text style={[isHandCard ? styles.handRank : styles.chipRank, red && styles.red]}>
                {card.card.rank}
              </Text>
              <Text style={[isHandCard ? styles.handSuit : styles.chipSuit, red && styles.red]}>
                {SUIT_SYMBOL[card.card.suit]}
              </Text>
            </Animated.View>
          );
        })()}

      {showTutorial && (
        <ActTutorialOverlay
          title="Act 1 Tutorial: Sneak In"
          paragraph={tutorialParagraph}
          onDismiss={onDismissTutorial}
        >
          <Image
            source={require('../../assets/images/sneakin.png')}
            style={styles.tutorialImage}
            resizeMode="contain"
          />
        </ActTutorialOverlay>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  screen: {
    flex: 1,
    backgroundColor: theme.colors.bgPrimary,
    overflow: 'visible',
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
  timerBadge: {
    backgroundColor: theme.colors.bgPanel,
    borderRadius: theme.radii.r8,
    paddingHorizontal: theme.spacing.ten,
    paddingVertical: theme.spacing.xs,
    borderWidth: theme.borderWidths.thin,
    borderColor: theme.colors.borderMedium,
  },
  timerBadgeWarning: {
    backgroundColor: theme.colors.timerWarningBg,
    borderColor: theme.colors.gold,
  },
  timerBadgeDanger: {
    backgroundColor: theme.colors.timerDangerBg,
    borderColor: theme.colors.errorRed,
  },
  timerText: {
    color: theme.colors.textGreen,
    fontSize: theme.fontSizes.base,
    fontWeight: theme.fontWeights.bold,
    fontVariant: ['tabular-nums'],
  },
  timerTextWarning: {
    color: theme.colors.gold,
  },
  timerTextDanger: {
    color: theme.colors.errorRed,
  },
  progressBadge: {
    backgroundColor: theme.colors.bgPanel,
    borderRadius: theme.radii.r8,
    paddingHorizontal: theme.spacing.sm,
    paddingVertical: theme.spacing.xs,
  },
  progressText: {
    color: theme.colors.textMuted,
    fontSize: theme.fontSizes.md,
    fontWeight: theme.fontWeights.bold,
  },
  helpBtn: {
    backgroundColor: theme.colors.borderLight,
    borderRadius: theme.radii.r8,
    paddingHorizontal: theme.spacing.ten,
    paddingVertical: theme.spacing.xs,
  },
  helpBtnText: {
    color: theme.colors.text75,
    fontSize: theme.fontSizes.s,
    fontWeight: theme.fontWeights.bold,
  },
  areasGrid: {
    flex: 1,
    padding: theme.spacing.sm,
    gap: theme.spacing.sm,
    overflow: 'visible',
  },
  buffToolbar: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: theme.spacing.md,
    paddingBottom: theme.spacing.xs,
    gap: theme.spacing.sm,
  },
  buffToolbarBtn: {
    backgroundColor: theme.colors.bgPanel,
    borderRadius: theme.radii.r8,
    paddingHorizontal: theme.spacing.md,
    paddingVertical: theme.spacing.xs,
    borderWidth: theme.borderWidths.thin,
    borderColor: theme.colors.borderMedium,
  },
  buffToolbarBtnText: {
    color: theme.colors.textPrimary,
    fontSize: theme.fontSizes.s,
    fontWeight: theme.fontWeights.bold,
  },
  buffToolbarBtnQtyText: {
    color: theme.colors.text70,
    fontSize: theme.fontSizes.s,
    fontWeight: theme.fontWeights.medium,
  },
  areasRow: {
    flex: 1,
    flexDirection: 'row',
    gap: theme.spacing.sm,
    overflow: 'visible',
  },
  areaCard: {
    flex: 1,
    backgroundColor: theme.colors.bgPanel,
    borderRadius: theme.radii.xl,
    padding: theme.spacing.md,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: theme.borderWidths.medium,
    borderColor: theme.colors.borderSubtle,
    shadowColor: theme.colors.shadow,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.3,
    shadowRadius: 4,
    elevation: 3,
    overflow: 'visible',
  },
  areaCardActive: {
    borderColor: theme.colors.areaGlowBorder,
    shadowColor: theme.colors.areaGlowShadow,
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0.9,
    shadowRadius: 22,
    elevation: 18,
  },
  areaCardSolved: {
    borderColor: theme.colors.gold,
    shadowColor: theme.colors.shadow,
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.15,
    shadowRadius: 3,
    elevation: 2,
  },
  areaCardLocked: {
    opacity: 0.3,
    shadowOpacity: 0,
    elevation: 0,
  },
  areaCardDropTarget: {
    borderColor: theme.colors.textSoft,
    borderWidth: theme.borderWidths.thick,
  },
  areaIcon: {
    fontSize: theme.fontSizes.giant2,
    textAlign: 'center',
    marginBottom: theme.spacing.six,
  },
  areaLabel: {
    color: theme.colors.text50,
    fontSize: theme.fontSizes.xs,
    fontWeight: theme.fontWeights.heavy,
    letterSpacing: 1,
    textAlign: 'center',
    marginBottom: theme.spacing.xs,
  },
  dimmed: {
    opacity: 0.5,
  },
  lockedLabel: {
    color: theme.colors.textFaint,
    fontSize: theme.fontSizes.caption,
    fontWeight: theme.fontWeights.medium,
    letterSpacing: 0.5,
  },
  solvedBadge: {
    color: theme.colors.gold,
    fontSize: theme.fontSizes.sm,
    fontWeight: theme.fontWeights.heavy,
    letterSpacing: 0.5,
  },
  targetRow: {
    flexDirection: 'row',
    alignItems: 'baseline',
  },
  targetValue: {
    color: theme.colors.textPrimary,
    fontSize: theme.fontSizes.xxl,
    fontWeight: theme.fontWeights.black,
    lineHeight: 30,
  },
  cardsZone: {
    marginTop: theme.spacing.sm,
    alignItems: 'center',
    gap: theme.spacing.xs,
    overflow: 'visible',
  },
  cardsRow: {
    flexDirection: 'row',
    gap: theme.spacing.five,
    flexWrap: 'wrap',
    justifyContent: 'center',
    overflow: 'visible',
  },
  chip: {
    backgroundColor: theme.colors.cardFace,
    borderRadius: theme.radii.sm,
    width: 40,
    height: 50,
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: theme.colors.shadow,
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.22,
    shadowRadius: 2,
    elevation: 2,
  },
  chipRank: {
    fontSize: theme.fontSizes.base,
    fontWeight: theme.fontWeights.black,
    color: theme.colors.cardText,
  },
  chipSuit: {
    fontSize: theme.fontSizes.s,
    color: theme.colors.cardText,
    marginTop: -2,
  },
  sumText: {
    color: theme.colors.textSoft,
    fontSize: theme.fontSizes.sm,
    fontWeight: theme.fontWeights.medium,
    fontVariant: ['tabular-nums'],
  },
  sumTextSolved: {
    color: theme.colors.gold,
    fontWeight: theme.fontWeights.heavy,
    fontSize: theme.fontSizes.s,
  },
  red: {
    color: theme.colors.red,
  },
  dock: {
    backgroundColor: theme.colors.bgPanel,
    borderTopWidth: 1,
    borderTopColor: theme.colors.borderFaint,
    paddingTop: theme.spacing.sm,
    paddingBottom: theme.spacing.ten,
    gap: theme.spacing.sm,
    overflow: 'visible',
    zIndex: 5,
  },
  dockHint: {
    color: theme.colors.textDim,
    fontSize: theme.fontSizes.sm,
    textAlign: 'center',
    paddingHorizontal: theme.spacing.md,
    fontStyle: 'italic',
  },
  handDropZone: {
    minHeight: 76,
    overflow: 'visible',
  },
  handContent: {
    paddingHorizontal: theme.spacing.md,
    gap: theme.spacing.sm,
    alignItems: 'center',
    overflow: 'visible',
  },
  handCard: {
    backgroundColor: theme.colors.cardFace,
    borderRadius: theme.radii.md,
    width: 54,
    height: 68,
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: theme.colors.shadow,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.25,
    shadowRadius: 3,
    elevation: 3,
  },
  handRank: {
    fontSize: theme.fontSizes.lgPlus,
    fontWeight: theme.fontWeights.black,
    color: theme.colors.cardText,
  },
  handSuit: {
    fontSize: theme.fontSizes.base,
    color: theme.colors.cardText,
    marginTop: -2,
  },
  emptyHand: {
    color: theme.colors.textFaint,
    fontSize: theme.fontSizes.s,
    fontStyle: 'italic',
    alignSelf: 'center',
  },
  // Ghost card — absolute overlay, always on top
  ghostCard: {
    position: 'absolute',
    zIndex: 9999,
    elevation: 50,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: theme.colors.cardFace,
  },
  ghostHandCard: {
    borderRadius: theme.radii.md,
    shadowColor: theme.colors.shadow,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.4,
    shadowRadius: 8,
  },
  ghostChip: {
    borderRadius: theme.radii.sm,
    shadowColor: theme.colors.shadow,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.35,
    shadowRadius: 5,
  },
  snapGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: theme.spacing.six,
    justifyContent: 'center',
  },
  snapArea: {
    width: '47%',
    backgroundColor: theme.colors.bgPanel,
    borderRadius: theme.radii.r8,
    borderWidth: theme.borderWidths.thin,
    borderColor: theme.colors.borderFaint,
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: theme.spacing.sm,
    gap: theme.spacing.two,
  },
  snapAreaIcon: {
    fontSize: theme.fontSizes.lg,
  },
  snapAreaTarget: {
    color: theme.colors.gold,
    fontSize: theme.fontSizes.s,
    fontWeight: theme.fontWeights.heavy,
  },
  tutorialImage: {
    width: '100%',
    height: '100%',
  },

  // Dock toolbar
  toolbar: {
    flexDirection: 'row',
    paddingHorizontal: theme.spacing.md,
    justifyContent: 'flex-end',
    gap: theme.spacing.sm,
  },
  toolbarBtn: {
    backgroundColor: theme.colors.greenSuccess,
    borderRadius: theme.radii.r8,
    paddingHorizontal: theme.spacing.fourteen,
    paddingVertical: theme.spacing.five,
    borderWidth: theme.borderWidths.thin,
    borderColor: theme.colors.borderStrong,
  },
  toolbarBtnDisabled: {
    backgroundColor: theme.colors.borderGhost,
    borderColor: theme.colors.borderSubtle,
  },
  toolbarBtnText: { color: theme.colors.textPrimary, fontSize: theme.fontSizes.s, fontWeight: theme.fontWeights.bold },
  toolbarBtnTextDisabled: { color: theme.colors.textDisabled },

  // Per-area return button
  areaReturnBtn: {
    position: 'absolute',
    top: 6,
    right: 6,
    backgroundColor: theme.colors.borderFaint,
    borderRadius: theme.radii.r6,
    width: 24,
    height: 24,
    alignItems: 'center',
    justifyContent: 'center',
  },
  areaReturnBtnText: { color: theme.colors.text70, fontSize: theme.fontSizes.md },

  // Failed combos history
  failedCombosSection: {
    marginTop: theme.spacing.six,
    alignItems: 'center',
    gap: theme.spacing.three,
  },
  failedCombosLabel: {
    color: theme.colors.textDisabled,
    fontSize: theme.fontSizes.tiny,
    fontWeight: theme.fontWeights.bold,
    letterSpacing: 0.8,
    textTransform: 'uppercase',
  },
  failedComboRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: theme.spacing.three,
  },
  failedChip: {
    backgroundColor: theme.colors.borderSubtle,
    borderRadius: theme.radii.xs,
    borderWidth: theme.borderWidths.thin,
    borderColor: theme.colors.borderStrong,
    borderStyle: 'dashed',
    width: 26,
    height: 30,
    alignItems: 'center',
    justifyContent: 'center',
    opacity: 0.5,
  },
  failedChipText: { fontSize: theme.fontSizes.sm, fontWeight: theme.fontWeights.heavy, color: theme.colors.textPrimary },
  failedChipRed: { color: theme.colors.dangerMuted },
  failedComboSum: {
    color: theme.colors.textDisabled,
    fontSize: theme.fontSizes.caption,
    fontWeight: theme.fontWeights.medium,
    marginLeft: theme.spacing.two,
  },

  // Hint card highlight (gold border)
  handCardHinted: {
    borderWidth: 2,
    borderColor: theme.colors.gold,
    shadowColor: theme.colors.gold,
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0.6,
    shadowRadius: 6,
    elevation: 6,
  },

  // Small 💡 label under hinted area name
  areaHintLabel: {
    color: theme.colors.gold,
    fontSize: theme.fontSizes.sm,
    marginTop: theme.spacing.two,
  },

  // Full-screen overlay for Inside Tip area picker
  hintPickerOverlay: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: 'rgba(0,0,0,0.78)',
    zIndex: 200,
    alignItems: 'center',
    justifyContent: 'center',
    gap: theme.spacing.sm,
    padding: theme.spacing.md,
  },
  hintPickerTitle: {
    color: theme.colors.textPrimary,
    fontSize: theme.fontSizes.md,
    fontWeight: theme.fontWeights.bold,
    marginBottom: theme.spacing.sm,
    textAlign: 'center',
  },
  hintPickerCard: {
    backgroundColor: theme.colors.bgPanel,
    borderRadius: theme.radii.xl,
    paddingHorizontal: theme.spacing.md,
    paddingVertical: theme.spacing.ten,
    width: '100%',
    flexDirection: 'row',
    alignItems: 'center',
    gap: theme.spacing.sm,
    borderWidth: theme.borderWidths.medium,
    borderColor: theme.colors.borderMedium,
  },
  hintPickerCardIcon: {
    fontSize: theme.fontSizes.lg,
  },
  hintPickerCardLabel: {
    color: theme.colors.textPrimary,
    fontSize: theme.fontSizes.base,
    fontWeight: theme.fontWeights.bold,
  },
  hintPickerCancel: {
    borderColor: theme.colors.borderSubtle,
    justifyContent: 'center',
    marginTop: theme.spacing.sm,
  },
  hintPickerCancelText: {
    color: theme.colors.textMuted,
    fontSize: theme.fontSizes.base,
    fontWeight: theme.fontWeights.medium,
  },

});
