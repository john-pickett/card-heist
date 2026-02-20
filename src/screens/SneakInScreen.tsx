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

const TOTAL_TIME_MS = 60_000;

function formatTime(ms: number): string {
  const totalSec = Math.floor(ms / 1000);
  const m = Math.floor(totalSec / 60);
  const s = totalSec % 60;
  const t = Math.floor((ms % 1000) / 100);
  return `${m}:${String(s).padStart(2, '0')}.${t}`;
}

type TimingGrade = 'great' | 'good' | 'ok' | 'bad';
type TimingRating = { grade: TimingGrade; label: string; bonus: number };

function getTimingRating(elapsedMs: number, timedOut: boolean): TimingRating {
  if (timedOut) return { grade: 'bad', label: 'Oof, Bad', bonus: 0 };
  const s = Math.floor(elapsedMs / 1000);
  if (s <= 15) return { grade: 'great', label: 'Great', bonus: 20 };
  if (s <= 35) return { grade: 'good', label: 'Good', bonus: 10 };
  return { grade: 'ok', label: 'Not Great', bonus: 0 };
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
  const moveCard = useSneakInStore(s => s.moveCard);
  const timeoutGame = useSneakInStore(s => s.timeoutGame);
  const [helpVisible, setHelpVisible] = useState(false);
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

  // Force re-render every 100 ms while the timer is running; also check for timeout.
  const [, tick] = useState(0);
  useEffect(() => {
    if (phase !== 'playing') return;
    const interval = setInterval(() => {
      tick(n => n + 1);
      if (startTime && Date.now() - startTime >= TOTAL_TIME_MS) {
        timeoutGame();
      }
    }, 100);
    return () => clearInterval(interval);
  }, [phase, startTime, timeoutGame]);

  useEffect(() => {
    scheduleMeasure();
  }, [areas, hand, scheduleMeasure]);

  const elapsedMs = startTime ? (endTime ?? Date.now()) - startTime : 0;
  const remainingMs = Math.max(0, TOTAL_TIME_MS - elapsedMs);
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

  const rows = [areas.slice(0, 2), areas.slice(2, 4)];
  const tutorialParagraph =
    'Drag cards from your hand into unlocked areas and match each target sum to crack every zone. Each zone requires two or three cards (no more and no less!).' +
    ' You can move cards back and forth to fix mistakes, but the timer never stops, so solve all four quickly to lock in the best bonus.';

  // ── Result screen — rendered after all hooks ─────────────────────────────────
  if (phase === 'done' || phase === 'timeout') {
    const timedOut = phase === 'timeout';
    const rating = getTimingRating(elapsedMs, timedOut);
    const gradeColors: Record<TimingGrade, string> = {
      great: '#f4d03f',
      good: '#95d5b2',
      ok: 'rgba(255,255,255,0.55)',
      bad: '#e74c3c',
    };
    return (
      <View style={styles.resultScreen}>
        <Text style={[styles.resultHeading, timedOut && styles.resultHeadingRed]}>
          {timedOut ? "TIME'S UP!" : 'SNEAK IN COMPLETE!'}
        </Text>

        <View style={styles.resultTimeBlock}>
          <Text style={styles.resultTimeLabel}>
            {timedOut ? 'TIME LIMIT REACHED' : 'YOUR TIME'}
          </Text>
          <Text style={styles.resultTimeValue}>{formatTime(elapsedMs)}</Text>
        </View>

        <View style={styles.resultRatingBlock}>
          <Text style={[styles.resultGrade, { color: gradeColors[rating.grade] }]}>
            {rating.label}
          </Text>
          <Text style={styles.resultBonus}>
            {rating.bonus > 0 ? `+${rating.bonus} point bonus` : 'No time bonus'}
          </Text>
        </View>

        <TouchableOpacity style={styles.resultContinueBtn} onPress={onGameEnd}>
          <Text style={styles.resultContinueBtnText}>CONTINUE →</Text>
        </TouchableOpacity>
      </View>
    );
  }

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
          remainingMs <= 15000 && styles.timerBadgeWarning,
          remainingMs <= 5000  && styles.timerBadgeDanger,
        ]}>
          <Text style={[
            styles.timerText,
            remainingMs <= 15000 && styles.timerTextWarning,
            remainingMs <= 5000  && styles.timerTextDanger,
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
                  <Text style={[styles.areaIcon, locked && styles.dimmed]}>
                    {AREA_ICONS[area.id]}
                  </Text>

                  <Text style={[styles.areaLabel, locked && styles.dimmed]}>
                    {AREA_LABELS[area.id].toUpperCase()}
                  </Text>

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

        <View ref={handDropRef} onLayout={scheduleMeasure} style={styles.handDropZone}>
          <ScrollView
            horizontal
            showsHorizontalScrollIndicator={false}
            contentContainerStyle={styles.handContent}
          >
            {hand.map(sc => {
              const red = RED_SUITS.has(sc.card.suit);
              return (
                <DraggableCard
                  key={sc.instanceId}
                  card={sc}
                  source="hand"
                  style={styles.handCard}
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
    backgroundColor: '#2d6a4f',
    overflow: 'visible',
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
  timerBadge: {
    backgroundColor: '#1b4332',
    borderRadius: 8,
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.15)',
  },
  timerBadgeWarning: {
    backgroundColor: '#7b4a00',
    borderColor: '#f4d03f',
  },
  timerBadgeDanger: {
    backgroundColor: '#6b1a1a',
    borderColor: '#e74c3c',
  },
  timerText: {
    color: '#d8f3dc',
    fontSize: 15,
    fontWeight: '700',
    fontVariant: ['tabular-nums'],
  },
  timerTextWarning: {
    color: '#f4d03f',
  },
  timerTextDanger: {
    color: '#e74c3c',
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
  helpBtn: {
    backgroundColor: 'rgba(255,255,255,0.12)',
    borderRadius: 8,
    paddingHorizontal: 10,
    paddingVertical: 4,
  },
  helpBtnText: {
    color: 'rgba(255,255,255,0.75)',
    fontSize: 12,
    fontWeight: '700',
  },
  areasGrid: {
    flex: 1,
    padding: 8,
    gap: 8,
    overflow: 'visible',
  },
  areasRow: {
    flex: 1,
    flexDirection: 'row',
    gap: 8,
    overflow: 'visible',
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
    overflow: 'visible',
  },
  areaCardActive: {
    borderColor: 'rgba(116,198,157,0.45)',
    shadowColor: '#b7e4c7',
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0.9,
    shadowRadius: 22,
    elevation: 18,
  },
  areaCardSolved: {
    borderColor: '#f4d03f',
    shadowColor: '#000',
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
    borderColor: 'rgba(255,255,255,0.55)',
    borderWidth: 2,
  },
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
  targetValue: {
    color: '#ffffff',
    fontSize: 26,
    fontWeight: '900',
    lineHeight: 30,
  },
  cardsZone: {
    marginTop: 8,
    alignItems: 'center',
    gap: 4,
    overflow: 'visible',
  },
  cardsRow: {
    flexDirection: 'row',
    gap: 5,
    flexWrap: 'wrap',
    justifyContent: 'center',
    overflow: 'visible',
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
  dock: {
    backgroundColor: '#1b4332',
    borderTopWidth: 1,
    borderTopColor: 'rgba(255,255,255,0.1)',
    paddingTop: 8,
    paddingBottom: 10,
    gap: 8,
    overflow: 'visible',
    zIndex: 5,
  },
  dockHint: {
    color: 'rgba(255,255,255,0.45)',
    fontSize: 11,
    textAlign: 'center',
    paddingHorizontal: 12,
    fontStyle: 'italic',
  },
  handDropZone: {
    minHeight: 76,
    overflow: 'visible',
  },
  handContent: {
    paddingHorizontal: 12,
    gap: 8,
    alignItems: 'center',
    overflow: 'visible',
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
  // Ghost card — absolute overlay, always on top
  ghostCard: {
    position: 'absolute',
    zIndex: 9999,
    elevation: 50,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#ffffff',
  },
  ghostHandCard: {
    borderRadius: 10,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.4,
    shadowRadius: 8,
  },
  ghostChip: {
    borderRadius: 7,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.35,
    shadowRadius: 5,
  },
  snapGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 6,
    justifyContent: 'center',
  },
  snapArea: {
    width: '47%',
    backgroundColor: '#1b4332',
    borderRadius: 8,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.1)',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 8,
    gap: 2,
  },
  snapAreaIcon: {
    fontSize: 18,
  },
  snapAreaTarget: {
    color: '#f4d03f',
    fontSize: 12,
    fontWeight: '800',
  },
  tutorialImage: {
    width: '100%',
    height: '100%',
  },

  // ── Result overlay ──────────────────────────────────────────────────────────
  resultScreen: {
    flex: 1,
    backgroundColor: '#2d6a4f',
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 32,
    gap: 0,
  },
  resultHeading: {
    color: '#f4d03f',
    fontSize: 26,
    fontWeight: '900',
    letterSpacing: 2,
    textAlign: 'center',
    marginBottom: 32,
  },
  resultHeadingRed: {
    color: '#e74c3c',
  },
  resultTimeBlock: {
    alignItems: 'center',
    marginBottom: 28,
  },
  resultTimeLabel: {
    color: 'rgba(255,255,255,0.45)',
    fontSize: 11,
    fontWeight: '700',
    letterSpacing: 1.5,
    textTransform: 'uppercase',
    marginBottom: 6,
  },
  resultTimeValue: {
    color: '#ffffff',
    fontSize: 52,
    fontWeight: '900',
    fontVariant: ['tabular-nums'],
    lineHeight: 58,
  },
  resultRatingBlock: {
    alignItems: 'center',
    backgroundColor: '#1b4332',
    borderRadius: 16,
    paddingVertical: 20,
    paddingHorizontal: 40,
    width: '100%',
    marginBottom: 32,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.1)',
  },
  resultGrade: {
    fontSize: 28,
    fontWeight: '900',
    letterSpacing: 1,
    marginBottom: 6,
  },
  resultBonus: {
    color: 'rgba(255,255,255,0.55)',
    fontSize: 14,
    fontWeight: '600',
  },
  resultContinueBtn: {
    backgroundColor: '#40916c',
    borderRadius: 14,
    paddingVertical: 16,
    paddingHorizontal: 48,
  },
  resultContinueBtnText: {
    color: '#ffffff',
    fontSize: 15,
    fontWeight: '900',
    letterSpacing: 1,
  },
});
