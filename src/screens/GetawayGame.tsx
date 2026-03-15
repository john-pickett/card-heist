import React, { useCallback, useEffect, useRef, useState } from 'react';
import {
  Animated,
  Easing,
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  TouchableWithoutFeedback,
  View,
} from 'react-native';
import theme from '../theme';
import {
  GetawayGrid,
  GridCell as GridCellData,
  GETAWAY_REWARDS,
  RANK_STEPS,
  SUIT_DIRECTION,
  buildGetawayGrid,
  computeGetawayReward,
  isFaceCard,
  isChoiceCard,
  isWildcard,
} from '../data/getawayDeck';
import { Suit } from '../types/card';
import { useHistoryStore } from '../store/historyStore';

// ─── Cell dimensions ─────────────────────────────────────────────────────────
const CELL_W = 80;
const CELL_H = 110;
const CELL_GAP = 6;

const SUIT_SYMBOLS: Record<Suit, string> = {
  spades: '♠',
  hearts: '♥',
  diamonds: '♦',
  clubs: '♣',
};

const SUIT_COLORS: Record<Suit, string> = {
  spades: '#1a1a2e',
  clubs: '#1a1a2e',
  hearts: '#c0392b',
  diamonds: '#c0392b',
};

const DIRECTION_ARROWS: Record<Suit, string> = {
  spades: '→',
  hearts: '↓',
  diamonds: '←',
  clubs: '↑',
};

// ─── GridCellTile ─────────────────────────────────────────────────────────────

interface GridCellTileProps {
  cellData: GridCellData | null;
  isCurrent: boolean;
  isHighlighted: boolean;
  isDeadEnd: boolean;
  isExit: boolean;
  onPress: () => void;
}

function GridCellTile({
  cellData,
  isCurrent,
  isHighlighted,
  isDeadEnd,
  isExit,
  onPress,
}: GridCellTileProps) {
  const flipAnim = useRef(new Animated.Value(cellData?.isFlipped ? 1 : 0)).current;
  const pulseAnim = useRef(new Animated.Value(0)).current;
  const flashAnim = useRef(new Animated.Value(0)).current;
  const pulseLoop = useRef<Animated.CompositeAnimation | null>(null);

  const prevFlipped = useRef(cellData?.isFlipped ?? false);

  useEffect(() => {
    const isNowFlipped = cellData?.isFlipped ?? false;
    if (isNowFlipped !== prevFlipped.current) {
      prevFlipped.current = isNowFlipped;
      Animated.timing(flipAnim, {
        toValue: isNowFlipped ? 1 : 0,
        duration: 280,
        easing: Easing.inOut(Easing.ease),
        useNativeDriver: true,
      }).start();
    }
  }, [cellData?.isFlipped]);

  useEffect(() => {
    if (isHighlighted) {
      pulseLoop.current = Animated.loop(
        Animated.sequence([
          Animated.timing(pulseAnim, { toValue: 1, duration: 500, useNativeDriver: true }),
          Animated.timing(pulseAnim, { toValue: 0, duration: 500, useNativeDriver: true }),
        ]),
      );
      pulseLoop.current.start();
    } else {
      pulseLoop.current?.stop();
      pulseAnim.setValue(0);
    }
    return () => { pulseLoop.current?.stop(); };
  }, [isHighlighted]);

  useEffect(() => {
    if (isDeadEnd) {
      Animated.sequence([
        Animated.timing(flashAnim, { toValue: 1, duration: 100, useNativeDriver: true }),
        Animated.timing(flashAnim, { toValue: 0, duration: 150, useNativeDriver: true }),
      ]).start();
    }
  }, [isDeadEnd]);

  const frontRotateY = flipAnim.interpolate({ inputRange: [0, 1], outputRange: ['180deg', '360deg'] });
  const backRotateY  = flipAnim.interpolate({ inputRange: [0, 1], outputRange: ['0deg',   '180deg'] });

  const highlightOpacity = pulseAnim.interpolate({ inputRange: [0, 1], outputRange: [0.3, 1] });
  const flashOpacity = flashAnim.interpolate({ inputRange: [0, 1], outputRange: [0, 1] });

  // Exit cell
  if (isExit) {
    return (
      <TouchableWithoutFeedback onPress={onPress}>
        <View style={[cellStyles.cell, cellStyles.exitCell, isCurrent && cellStyles.currentBorder]}>
          <Text style={cellStyles.exitEmoji}>🚪</Text>
          <Text style={cellStyles.exitLabel}>EXIT</Text>
        </View>
      </TouchableWithoutFeedback>
    );
  }

  const card = cellData?.card;
  const isFlipped = cellData?.isFlipped ?? false;
  const isInActivePath = cellData?.isInActivePath ?? false;
  const isChoiceCardType = card ? isChoiceCard(card) : false;
  const suit = card?.suit;
  const rank = card?.rank;
  const suitSymbol = suit ? SUIT_SYMBOLS[suit] : '';
  const suitColor = suit ? SUIT_COLORS[suit] : '#000';
  const dirArrow = suit ? DIRECTION_ARROWS[suit] : '';
  const steps = rank ? RANK_STEPS[rank] : null;
  const stepLabel = steps !== null ? `${steps}` : rank === 'A' ? '★' : '?';

  return (
    <TouchableWithoutFeedback onPress={onPress}>
      <View style={cellStyles.wrapper}>
        {/* Back face */}
        <Animated.View
          style={[
            cellStyles.cell,
            cellStyles.backFace,
            { transform: [{ perspective: 800 }, { rotateY: backRotateY }] },
          ]}
        >
          <Text style={cellStyles.backMark}>?</Text>
        </Animated.View>

        {/* Front face */}
        <Animated.View
          style={[
            cellStyles.cell,
            cellStyles.frontFace,
            isCurrent && cellStyles.currentBorder,
            !isInActivePath && isFlipped && cellStyles.deadPathFace,
            { transform: [{ perspective: 800 }, { rotateY: frontRotateY }] },
          ]}
        >
          {/* Top-left: suit + step */}
          <View style={cellStyles.cornerTL}>
            <Text style={[cellStyles.cornerSuit, { color: suitColor }]}>{suitSymbol}</Text>
            <Text style={[cellStyles.cornerStep, { color: suitColor }]}>{stepLabel}</Text>
          </View>

          {/* Center: direction arrow */}
          <Text style={[cellStyles.centerArrow, { color: suitColor }]}>{dirArrow}</Text>

          {/* Choice card badge */}
          {isChoiceCardType && (
            <View style={cellStyles.choiceBadge}>
              <Text style={cellStyles.choiceBadgeText}>{rank === 'A' ? '★' : rank}</Text>
            </View>
          )}
        </Animated.View>

        {/* Highlight overlay */}
        {isHighlighted && (
          <Animated.View
            pointerEvents="none"
            style={[cellStyles.highlightOverlay, { opacity: highlightOpacity }]}
          />
        )}

        {/* Dead-end flash overlay */}
        {isDeadEnd && (
          <Animated.View
            pointerEvents="none"
            style={[cellStyles.deadEndOverlay, { opacity: flashOpacity }]}
          />
        )}
      </View>
    </TouchableWithoutFeedback>
  );
}

const cellStyles = StyleSheet.create({
  wrapper: {
    width: CELL_W,
    height: CELL_H,
  },
  cell: {
    position: 'absolute',
    width: CELL_W,
    height: CELL_H,
    borderRadius: theme.radii.lg,
    borderWidth: theme.borderWidths.thin,
    alignItems: 'center',
    justifyContent: 'center',
    backfaceVisibility: 'hidden',
  },
  backFace: {
    backgroundColor: theme.colors.bgDeep,
    borderColor: theme.colors.borderMedium,
  },
  frontFace: {
    backgroundColor: theme.colors.cardFace,
    borderColor: theme.colors.cardBorder,
  },
  deadPathFace: {
    opacity: 0.35,
  },
  currentBorder: {
    borderColor: theme.colors.greenPrimary,
    borderWidth: theme.borderWidths.thick,
  },
  exitCell: {
    backgroundColor: '#163a28',
    borderColor: theme.colors.greenPrimary,
    borderWidth: theme.borderWidths.medium,
  },
  exitEmoji: {
    fontSize: 26,
    marginBottom: 2,
  },
  exitLabel: {
    color: theme.colors.greenPastel,
    fontSize: theme.fontSizes.caption,
    fontWeight: theme.fontWeights.black,
    letterSpacing: 1,
  },
  backMark: {
    color: theme.colors.greenPastel,
    fontSize: 28,
    fontWeight: theme.fontWeights.black,
  },
  cornerTL: {
    position: 'absolute',
    top: 6,
    left: 7,
    alignItems: 'center',
  },
  cornerSuit: {
    fontSize: 13,
    fontWeight: theme.fontWeights.heavy,
    lineHeight: 15,
  },
  cornerStep: {
    fontSize: 11,
    fontWeight: theme.fontWeights.black,
    lineHeight: 13,
  },
  centerArrow: {
    fontSize: 28,
    fontWeight: theme.fontWeights.black,
  },
  choiceBadge: {
    position: 'absolute',
    bottom: 5,
    right: 6,
    backgroundColor: '#f4d03f22',
    borderRadius: 6,
    paddingHorizontal: 4,
    paddingVertical: 1,
    borderWidth: 1,
    borderColor: theme.colors.gold,
  },
  choiceBadgeText: {
    color: theme.colors.gold,
    fontSize: 10,
    fontWeight: theme.fontWeights.black,
  },
  highlightOverlay: {
    position: 'absolute',
    width: CELL_W,
    height: CELL_H,
    borderRadius: theme.radii.lg,
    borderWidth: 2,
    borderColor: theme.colors.gold,
    backgroundColor: 'rgba(244,208,63,0.15)',
  },
  deadEndOverlay: {
    position: 'absolute',
    width: CELL_W,
    height: CELL_H,
    borderRadius: theme.radii.lg,
    borderWidth: 2,
    borderColor: theme.colors.errorRed,
    backgroundColor: 'rgba(231,76,60,0.3)',
  },
});

// ─── Checkpoint type ──────────────────────────────────────────────────────────

interface Checkpoint {
  position: [number, number];
  validTargets: [number, number][];
  triedTargets: Set<string>;
}

// ─── Main Game ────────────────────────────────────────────────────────────────

type Phase = 'intro' | 'playing' | 'complete' | 'failed';

interface Props {
  onBack: () => void;
}

function posKey(r: number, c: number): string {
  return `${r},${c}`;
}

export function GetawayGame({ onBack }: Props) {
  const addBonusGold = useHistoryStore(s => s.addBonusGold);

  const [phase, setPhase] = useState<Phase>('intro');
  const [grid, setGrid] = useState<GetawayGrid>([]);
  const [playerPos, setPlayerPos] = useState<[number, number]>([0, 0]);
  const [visitedPath, setVisitedPath] = useState<[number, number][]>([[0, 0]]);
  const [checkpoints, setCheckpoints] = useState<Checkpoint[]>([]);
  const [backtracks, setBacktracks] = useState(0);
  const [awaitingChoice, setAwaitingChoice] = useState<[number, number][] | null>(null);
  const [isAnimating, setIsAnimating] = useState(false);
  const [deadEndCell, setDeadEndCell] = useState<[number, number] | null>(null);
  const [reward, setReward] = useState(0);
  const [winCellCount, setWinCellCount] = useState(0);
  const [winBacktracks, setWinBacktracks] = useState(0);
  const [winFaceCount, setWinFaceCount] = useState(0);

  // Use refs for values needed inside async callbacks to avoid stale closures
  const gridRef = useRef<GetawayGrid>([]);
  const visitedPathRef = useRef<[number, number][]>([[0, 0]]);
  const checkpointsRef = useRef<Checkpoint[]>([]);
  const backtrackRef = useRef(0);
  const isAnimatingRef = useRef(false);
  const playerPosRef = useRef<[number, number]>([0, 0]);

  function syncGrid(g: GetawayGrid) { gridRef.current = g; setGrid(g); }
  function syncVisited(v: [number, number][]) { visitedPathRef.current = v; setVisitedPath(v); }
  function syncCheckpoints(c: Checkpoint[]) { checkpointsRef.current = c; setCheckpoints(c); }
  function syncPos(p: [number, number]) { playerPosRef.current = p; setPlayerPos(p); }

  const startGame = useCallback(() => {
    const newGrid = buildGetawayGrid();
    const startVisited: [number, number][] = [[0, 0]];
    gridRef.current = newGrid;
    visitedPathRef.current = startVisited;
    checkpointsRef.current = [];
    backtrackRef.current = 0;
    isAnimatingRef.current = false;
    playerPosRef.current = [0, 0];
    setGrid(newGrid);
    setVisitedPath(startVisited);
    setCheckpoints([]);
    setBacktracks(0);
    setAwaitingChoice(null);
    setIsAnimating(false);
    setDeadEndCell(null);
    setReward(0);
    setWinCellCount(0);
    setWinBacktracks(0);
    setWinFaceCount(0);
    setPlayerPos([0, 0]);
    setPhase('playing');

    // Process starting cell
    setTimeout(() => processLanding(newGrid, [0, 0], startVisited, []), 600);
  }, []);

  // ── Immutably update a single grid cell ─────────────────────────────────
  function updateGridCell(
    g: GetawayGrid,
    r: number,
    c: number,
    patch: Partial<{ isFlipped: boolean; isInActivePath: boolean }>,
  ): GetawayGrid {
    return g.map((row, ri) =>
      row.map((cell, ci) => {
        if (ri !== r || ci !== c || cell === null) return cell;
        return { ...cell, ...patch };
      }),
    );
  }

  // ── Compute valid targets for a choice card ──────────────────────────────
  function computeValidTargets(
    g: GetawayGrid,
    r: number,
    c: number,
    visited: Set<string>,
  ): [number, number][] {
    const cell = g[r][c];
    if (!cell) return [];
    const { card } = cell;
    const targets: [number, number][] = [];

    if (isWildcard(card.rank)) {
      // Ace: 1 step in all 4 directions
      for (const [dr, dc] of Object.values(SUIT_DIRECTION) as [number,number][]) {
        const nr = r + dr, nc = c + dc;
        if (inBoundsCheck(nr, nc) && !visited.has(posKey(nr, nc))) {
          targets.push([nr, nc]);
        }
      }
    } else if (isFaceCard(card.rank)) {
      // Face card: 1/2/3 steps in suit direction
      const [dr, dc] = SUIT_DIRECTION[card.suit];
      for (const s of [1, 2, 3]) {
        const nr = r + dr * s, nc = c + dc * s;
        if (inBoundsCheck(nr, nc) && !visited.has(posKey(nr, nc))) {
          targets.push([nr, nc]);
        }
      }
    }
    return targets;
  }

  function inBoundsCheck(r: number, c: number): boolean {
    return r >= 0 && r <= 3 && c >= 0 && c <= 3;
  }

  // ── Trigger dead end ─────────────────────────────────────────────────────
  function triggerDeadEnd(
    g: GetawayGrid,
    deadCell: [number, number],
    cps: Checkpoint[],
    bt: number,
    visited: [number, number][],
  ) {
    setDeadEndCell(deadCell);
    const newBt = bt + 1;
    backtrackRef.current = newBt;
    setBacktracks(newBt);

    setTimeout(() => {
      setDeadEndCell(null);

      if (cps.length === 0) {
        setPhase('failed');
        return;
      }

      // Pop last checkpoint
      const updatedCps = [...cps];
      const cp = { ...updatedCps[updatedCps.length - 1] };
      cp.triedTargets = new Set(cp.triedTargets);

      // Mark dead cell's path as tried
      cp.triedTargets.add(posKey(deadCell[0], deadCell[1]));

      const remaining = cp.validTargets.filter(t => !cp.triedTargets.has(posKey(t[0], t[1])));

      if (remaining.length === 0) {
        // This checkpoint is exhausted too — recurse
        updatedCps.pop();
        syncCheckpoints(updatedCps);
        triggerDeadEnd(g, cp.position, updatedCps, newBt, visited);
        return;
      }

      // Restore path to checkpoint
      const cpIdx = visited.findIndex(([r, c]) => r === cp.position[0] && c === cp.position[1]);
      const trimmedPath = visited.slice(0, cpIdx + 1);

      // Dim cells that were trimmed
      let newGrid = g;
      for (let i = cpIdx + 1; i < visited.length; i++) {
        const [tr, tc] = visited[i];
        newGrid = updateGridCell(newGrid, tr, tc, { isInActivePath: false });
      }

      updatedCps[updatedCps.length - 1] = cp;
      syncCheckpoints(updatedCps);
      syncGrid(newGrid);
      syncVisited(trimmedPath);
      syncPos(cp.position);
      setAwaitingChoice(remaining);
    }, 350);
  }

  // ── Process landing on a cell ────────────────────────────────────────────
  function processLanding(
    g: GetawayGrid,
    pos: [number, number],
    visited: [number, number][],
    cps: Checkpoint[],
  ) {
    const [r, c] = pos;

    // Exit check
    if (r === 3 && c === 3) {
      const visitedSet = new Set(visited.map(([vr, vc]) => posKey(vr, vc)));
      const faceCount = visited.filter(([vr, vc]) => {
        const cell = g[vr][vc];
        return cell && isChoiceCard(cell.card);
      }).length;
      const bt = backtrackRef.current;
      const earned = computeGetawayReward(visited.length, bt, faceCount);
      addBonusGold(earned);
      setReward(earned);
      setWinCellCount(visited.length);
      setWinBacktracks(bt);
      setWinFaceCount(faceCount);
      isAnimatingRef.current = false;
      setIsAnimating(false);
      setPhase('complete');
      return;
    }

    const cell = g[r][c];
    if (!cell) return;

    const { card } = cell;
    const visitedSet = new Set(visited.map(([vr, vc]) => posKey(vr, vc)));

    if (isChoiceCard(card)) {
      // Face card or Ace — compute valid targets and wait for player
      const targets = computeValidTargets(g, r, c, visitedSet);
      if (targets.length === 0) {
        isAnimatingRef.current = false;
        setIsAnimating(false);
        triggerDeadEnd(g, pos, cps, backtrackRef.current, visited);
        return;
      }
      // Push checkpoint
      const newCp: Checkpoint = { position: pos, validTargets: targets, triedTargets: new Set() };
      const newCps = [...cps, newCp];
      syncCheckpoints(newCps);
      setAwaitingChoice(targets);
      isAnimatingRef.current = false;
      setIsAnimating(false);
    } else {
      // Number card — auto-execute after delay
      const steps = RANK_STEPS[card.rank]!;
      const [dr, dc] = SUIT_DIRECTION[card.suit];
      const nr = r + dr * steps, nc = c + dc * steps;

      setTimeout(() => {
        if (!inBoundsCheck(nr, nc) || visitedSet.has(posKey(nr, nc))) {
          triggerDeadEnd(g, pos, cps, backtrackRef.current, visited);
          return;
        }
        executeMove(g, pos, [nr, nc], visited, cps);
      }, 700);
    }
  }

  // ── Execute a move to a target cell ─────────────────────────────────────
  function executeMove(
    g: GetawayGrid,
    _fromPos: [number, number],
    target: [number, number],
    visited: [number, number][],
    cps: Checkpoint[],
  ) {
    const [nr, nc] = target;
    isAnimatingRef.current = true;
    setIsAnimating(true);
    setAwaitingChoice(null);

    // Flip and activate the target cell (unless it's the exit)
    let newGrid = g;
    if (!(nr === 3 && nc === 3)) {
      newGrid = updateGridCell(g, nr, nc, { isFlipped: true, isInActivePath: true });
    }

    const newVisited = [...visited, target];
    syncGrid(newGrid);
    syncVisited(newVisited);
    syncPos(target);

    setTimeout(() => {
      processLanding(newGrid, target, newVisited, cps);
    }, 150);
  }

  // ── Handle player tapping a highlighted choice cell ──────────────────────
  const handleCellPress = useCallback((r: number, c: number) => {
    if (isAnimatingRef.current) return;

    const highlighted = awaitingChoice;
    if (!highlighted) return;

    const isValid = highlighted.some(([hr, hc]) => hr === r && hc === c);
    if (!isValid) return;

    const cps = checkpointsRef.current;
    if (cps.length === 0) return;

    // Mark this target as tried in the current checkpoint
    const updatedCps = [...cps];
    const cp = { ...updatedCps[updatedCps.length - 1] };
    cp.triedTargets = new Set(cp.triedTargets);
    cp.triedTargets.add(posKey(r, c));
    updatedCps[updatedCps.length - 1] = cp;
    syncCheckpoints(updatedCps);

    isAnimatingRef.current = true;
    setIsAnimating(true);

    executeMove(gridRef.current, playerPosRef.current, [r, c], visitedPathRef.current, updatedCps);
  }, [awaitingChoice]);

  // ─── Render ───────────────────────────────────────────────────────────────

  if (phase === 'intro') {
    return (
      <View style={styles.screen}>
        <TouchableOpacity style={styles.backBtn} onPress={onBack} activeOpacity={0.7}>
          <Text style={styles.backArrow}>‹</Text>
          <Text style={styles.backLabel}>Relax</Text>
        </TouchableOpacity>
        <ScrollView style={styles.scroll} contentContainerStyle={styles.introContent} showsVerticalScrollIndicator={false}>
          <Text style={styles.title}>THE{'\n'}GETAWAY</Text>

          <View style={styles.storyCard}>
            <Text style={styles.storyLead}>Your route is already laid out.</Text>
            <Text style={styles.storyText}>
              The city is a grid. Every block tells you where to go next — if you know how to read it.
              Spades take you right, hearts push you down, diamonds pull you left, clubs send you up.
              The number tells you how far. Get to the exit before the trail runs cold.
            </Text>
            <Text style={styles.storyText}>
              Face cards give you a choice of distance. Aces give you a choice of direction.
              Use them wisely — they're your only way to steer around dead ends.
            </Text>
          </View>

          <View style={styles.ruleCard}>
            <Text style={styles.ruleTitle}>Card Rules</Text>
            <View style={styles.ruleRow}><Text style={styles.ruleSuit}>♠ Spades</Text><Text style={styles.ruleDesc}>Move right</Text></View>
            <View style={styles.ruleRow}><Text style={styles.ruleSuit}>♥ Hearts</Text><Text style={styles.ruleDesc}>Move down</Text></View>
            <View style={styles.ruleRow}><Text style={styles.ruleSuit}>♦ Diamonds</Text><Text style={styles.ruleDesc}>Move left</Text></View>
            <View style={styles.ruleRow}><Text style={styles.ruleSuit}>♣ Clubs</Text><Text style={styles.ruleDesc}>Move up</Text></View>
            <View style={[styles.ruleRow, styles.ruleDivider]}>
              <Text style={styles.ruleSuit}>2–4</Text><Text style={styles.ruleDesc}>1 step</Text>
            </View>
            <View style={styles.ruleRow}><Text style={styles.ruleSuit}>5–7</Text><Text style={styles.ruleDesc}>2 steps</Text></View>
            <View style={styles.ruleRow}><Text style={styles.ruleSuit}>8–10</Text><Text style={styles.ruleDesc}>3 steps</Text></View>
            <View style={styles.ruleRow}><Text style={styles.ruleSuit}>J / Q / K</Text><Text style={styles.ruleDesc}>Your choice: 1, 2, or 3 steps</Text></View>
            <View style={styles.ruleRow}><Text style={[styles.ruleSuit, { color: theme.colors.gold }]}>★ Ace</Text><Text style={styles.ruleDesc}>Wildcard — any direction, 1 step</Text></View>
          </View>

          <View style={styles.tierCard}>
            <Text style={styles.tierTitle}>Scoring</Text>
            <View style={styles.ruleRow}><Text style={styles.tierVal}>+100</Text><Text style={styles.ruleDesc}>Base reward for reaching the exit</Text></View>
            <View style={styles.ruleRow}><Text style={styles.tierNeg}>−5</Text><Text style={styles.ruleDesc}>Per extra cell visited beyond 7</Text></View>
            <View style={styles.ruleRow}><Text style={styles.tierNeg}>−10</Text><Text style={styles.ruleDesc}>Per backtrack used</Text></View>
            <View style={styles.ruleRow}><Text style={styles.tierVal}>+25</Text><Text style={styles.ruleDesc}>Bonus for zero backtracks</Text></View>
            <View style={styles.ruleRow}><Text style={styles.tierVal}>+10</Text><Text style={styles.ruleDesc}>Per face card / Ace on your path</Text></View>
          </View>
        </ScrollView>

        <View style={styles.footer}>
          <TouchableOpacity style={styles.startBtn} onPress={startGame} activeOpacity={0.8}>
            <Text style={styles.startBtnText}>Start Run</Text>
          </TouchableOpacity>
        </View>
      </View>
    );
  }

  if (phase === 'complete') {
    const tierLabel =
      winBacktracks === 0 ? 'CLEAN GETAWAY'
      : winBacktracks <= 2 ? 'CLOSE CALL'
      : 'BARELY MADE IT';
    return (
      <View style={styles.screen}>
        <ScrollView style={styles.scroll} contentContainerStyle={styles.completeContent} showsVerticalScrollIndicator={false}>
          <Text style={styles.title}>MADE IT{'\n'}OUT</Text>

          <View style={styles.resultCard}>
            <Text style={styles.tierBadge}>{tierLabel}</Text>
            <View style={styles.statRow}>
              <View style={styles.statBox}>
                <Text style={styles.statNum}>{winCellCount}</Text>
                <Text style={styles.statLbl}>cells visited</Text>
              </View>
              <View style={styles.statBox}>
                <Text style={styles.statNum}>{winBacktracks}</Text>
                <Text style={styles.statLbl}>backtracks</Text>
              </View>
              <View style={styles.statBox}>
                <Text style={styles.statNum}>{winFaceCount}</Text>
                <Text style={styles.statLbl}>choice cards</Text>
              </View>
            </View>
          </View>

          <View style={styles.rewardCard}>
            <Text style={styles.rewardLabel}>Gold earned</Text>
            <Text style={styles.rewardAmount}>+{reward}</Text>
            <Text style={styles.rewardNote}>Added to your balance</Text>
          </View>
        </ScrollView>
        <View style={styles.footer}>
          <TouchableOpacity style={styles.startBtn} onPress={startGame} activeOpacity={0.8}>
            <Text style={styles.startBtnText}>Run Again</Text>
          </TouchableOpacity>
          <TouchableOpacity style={styles.secondaryBtn} onPress={onBack} activeOpacity={0.7}>
            <Text style={styles.secondaryBtnText}>Back to Relax</Text>
          </TouchableOpacity>
        </View>
      </View>
    );
  }

  if (phase === 'failed') {
    return (
      <View style={styles.screen}>
        <ScrollView style={styles.scroll} contentContainerStyle={styles.completeContent} showsVerticalScrollIndicator={false}>
          <Text style={styles.title}>CAUGHT</Text>

          <View style={styles.resultCard}>
            <Text style={[styles.tierBadge, { color: theme.colors.errorRed }]}>THE COPS CLOSE IN</Text>
            <Text style={styles.failBody}>
              Every path is blocked. You ran out of moves.{'\n'}Better luck next time.
            </Text>
          </View>
        </ScrollView>
        <View style={styles.footer}>
          <TouchableOpacity style={styles.startBtn} onPress={startGame} activeOpacity={0.8}>
            <Text style={styles.startBtnText}>Try Again</Text>
          </TouchableOpacity>
          <TouchableOpacity style={styles.secondaryBtn} onPress={onBack} activeOpacity={0.7}>
            <Text style={styles.secondaryBtnText}>Back to Relax</Text>
          </TouchableOpacity>
        </View>
      </View>
    );
  }

  // Playing phase
  const visitedSet = new Set(visitedPath.map(([r, c]) => posKey(r, c)));
  const [pr, pc] = playerPos;
  const highlightSet = new Set((awaitingChoice ?? []).map(([r, c]) => posKey(r, c)));
  const currentCard = grid[pr]?.[pc];
  const isChoicePending = awaitingChoice !== null;

  return (
    <View style={styles.screen}>
      {/* Header */}
      <View style={styles.playHeader}>
        <TouchableOpacity style={styles.backBtn} onPress={onBack} activeOpacity={0.7}>
          <Text style={styles.backArrow}>‹</Text>
          <Text style={styles.backLabel}>Relax</Text>
        </TouchableOpacity>
        <View style={styles.statPill}>
          <Text style={styles.statPillLabel}>CELLS</Text>
          <Text style={styles.statPillVal}>{visitedPath.length}</Text>
        </View>
        <View style={styles.statPill}>
          <Text style={styles.statPillLabel}>WRONG</Text>
          <Text style={styles.statPillVal}>{backtracks}</Text>
        </View>
      </View>

      {/* Grid */}
      <View style={styles.gridArea}>
        <View style={styles.grid}>
          {Array.from({ length: 4 }, (_, r) =>
            Array.from({ length: 4 }, (_, c) => {
              const key = posKey(r, c);
              const cellData = grid[r]?.[c] ?? null;
              const isExit = r === 3 && c === 3;
              return (
                <GridCellTile
                  key={key}
                  cellData={cellData}
                  isCurrent={r === pr && c === pc}
                  isHighlighted={highlightSet.has(key)}
                  isDeadEnd={deadEndCell !== null && deadEndCell[0] === r && deadEndCell[1] === c}
                  isExit={isExit}
                  onPress={() => handleCellPress(r, c)}
                />
              );
            }),
          )}
        </View>
      </View>

      {/* Choice prompt */}
      <View style={styles.choicePrompt}>
        {isChoicePending ? (
          <Text style={styles.choiceText}>
            {currentCard?.card && isWildcard(currentCard.card.rank)
              ? '★ Ace — choose any direction (1 step)'
              : `${currentCard?.card ? SUIT_SYMBOLS[currentCard.card.suit] : ''} Face card — tap your distance`}
          </Text>
        ) : (
          <Text style={styles.choiceTextMuted}>
            {isAnimating ? 'Moving…' : ' '}
          </Text>
        )}
      </View>
    </View>
  );
}

// ─── Styles ───────────────────────────────────────────────────────────────────
const styles = StyleSheet.create({
  screen: {
    flex: 1,
    backgroundColor: theme.colors.bgPrimary,
  },
  scroll: {
    flex: 1,
  },
  backBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: theme.spacing.xs,
    paddingHorizontal: theme.spacing.xl,
    paddingTop: theme.spacing.fourteen,
  },
  backArrow: {
    color: theme.colors.greenPastel,
    fontSize: theme.fontSizes.xxl,
    fontWeight: theme.fontWeights.bold,
    marginRight: theme.spacing.xs,
    lineHeight: 28,
  },
  backLabel: {
    color: theme.colors.greenPastel,
    fontSize: theme.fontSizes.base,
    fontWeight: theme.fontWeights.bold,
  },

  // Intro
  introContent: {
    paddingHorizontal: theme.spacing.xl,
    paddingTop: theme.spacing.lg,
    paddingBottom: theme.spacing.xxl,
    alignItems: 'center',
  },
  title: {
    color: theme.colors.textPrimary,
    fontSize: theme.fontSizes.xl,
    fontWeight: theme.fontWeights.black,
    letterSpacing: 3,
    marginBottom: theme.spacing.xl,
    textAlign: 'center',
    lineHeight: 30,
  },
  storyCard: {
    width: '100%',
    backgroundColor: theme.colors.bgStory,
    borderRadius: theme.radii.xl,
    borderWidth: theme.borderWidths.thin,
    borderColor: theme.colors.borderLight,
    paddingHorizontal: theme.spacing.lg,
    paddingVertical: theme.spacing.lg,
    marginBottom: theme.spacing.lg,
  },
  storyLead: {
    color: theme.colors.gold,
    fontSize: theme.fontSizes.basePlus,
    fontWeight: theme.fontWeights.heavy,
    marginBottom: theme.spacing.sm,
  },
  storyText: {
    color: theme.colors.text85,
    fontSize: theme.fontSizes.base,
    lineHeight: 22,
    marginBottom: theme.spacing.sm,
  },
  ruleCard: {
    width: '100%',
    backgroundColor: theme.colors.bgOverlaySoft,
    borderRadius: theme.radii.lg,
    borderWidth: theme.borderWidths.thin,
    borderColor: theme.colors.borderSubtle,
    paddingHorizontal: theme.spacing.lg,
    paddingVertical: theme.spacing.md,
    marginBottom: theme.spacing.lg,
  },
  ruleTitle: {
    color: theme.colors.greenPastel,
    fontSize: theme.fontSizes.m,
    fontWeight: theme.fontWeights.heavy,
    textTransform: 'uppercase',
    letterSpacing: 1,
    marginBottom: theme.spacing.sm,
  },
  ruleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: theme.spacing.xs,
    gap: theme.spacing.md,
  },
  ruleDivider: {
    marginTop: theme.spacing.sm,
    paddingTop: theme.spacing.sm,
    borderTopWidth: theme.borderWidths.thin,
    borderTopColor: theme.colors.borderSubtle,
  },
  ruleSuit: {
    color: theme.colors.text85,
    fontSize: theme.fontSizes.base,
    fontWeight: theme.fontWeights.heavy,
    width: 72,
  },
  ruleDesc: {
    color: theme.colors.text72,
    fontSize: theme.fontSizes.md,
    flex: 1,
  },
  tierCard: {
    width: '100%',
    backgroundColor: theme.colors.bgOverlaySoft,
    borderRadius: theme.radii.lg,
    borderWidth: theme.borderWidths.thin,
    borderColor: theme.colors.borderSubtle,
    paddingHorizontal: theme.spacing.lg,
    paddingVertical: theme.spacing.md,
  },
  tierTitle: {
    color: theme.colors.greenPastel,
    fontSize: theme.fontSizes.m,
    fontWeight: theme.fontWeights.heavy,
    textTransform: 'uppercase',
    letterSpacing: 1,
    marginBottom: theme.spacing.sm,
  },
  tierVal: {
    color: theme.colors.gold,
    fontSize: theme.fontSizes.base,
    fontWeight: theme.fontWeights.heavy,
    width: 40,
  },
  tierNeg: {
    color: theme.colors.dangerMuted,
    fontSize: theme.fontSizes.base,
    fontWeight: theme.fontWeights.heavy,
    width: 40,
  },
  footer: {
    paddingHorizontal: theme.spacing.xl,
    paddingTop: theme.spacing.md,
    paddingBottom: theme.spacing.xxl,
    borderTopWidth: theme.borderWidths.thin,
    borderTopColor: theme.colors.borderSubtle,
    backgroundColor: theme.colors.bgPrimary,
    gap: theme.spacing.sm,
  },
  startBtn: {
    backgroundColor: theme.colors.greenPrimary,
    borderRadius: theme.radii.lg,
    paddingVertical: theme.spacing.lg,
    alignItems: 'center',
    borderWidth: theme.borderWidths.thin,
    borderColor: theme.colors.borderMedium,
  },
  startBtnText: {
    color: theme.colors.textPrimary,
    fontSize: theme.fontSizes.subtitle,
    fontWeight: theme.fontWeights.heavy,
    letterSpacing: 0.5,
  },
  secondaryBtn: {
    paddingVertical: theme.spacing.md,
    alignItems: 'center',
  },
  secondaryBtnText: {
    color: theme.colors.textMuted,
    fontSize: theme.fontSizes.base,
    fontWeight: theme.fontWeights.bold,
  },

  // Playing
  playHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingRight: theme.spacing.xl,
    paddingTop: theme.spacing.fourteen,
    borderBottomWidth: theme.borderWidths.thin,
    borderBottomColor: theme.colors.borderSubtle,
    paddingBottom: theme.spacing.sm,
  },
  statPill: {
    marginLeft: theme.spacing.xl,
    alignItems: 'center',
  },
  statPillLabel: {
    color: theme.colors.textMuted,
    fontSize: theme.fontSizes.caption,
    textTransform: 'uppercase',
    letterSpacing: 0.5,
    fontWeight: theme.fontWeights.bold,
  },
  statPillVal: {
    color: theme.colors.textPrimary,
    fontSize: theme.fontSizes.lg,
    fontWeight: theme.fontWeights.black,
  },
  gridArea: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  grid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    width: CELL_W * 4 + CELL_GAP * 3,
    gap: CELL_GAP,
  },
  choicePrompt: {
    paddingHorizontal: theme.spacing.xl,
    paddingVertical: theme.spacing.md,
    minHeight: 44,
    alignItems: 'center',
    justifyContent: 'center',
    borderTopWidth: theme.borderWidths.thin,
    borderTopColor: theme.colors.borderSubtle,
  },
  choiceText: {
    color: theme.colors.gold,
    fontSize: theme.fontSizes.base,
    fontWeight: theme.fontWeights.heavy,
    textAlign: 'center',
  },
  choiceTextMuted: {
    color: theme.colors.textMuted,
    fontSize: theme.fontSizes.base,
    textAlign: 'center',
  },

  // Complete / Failed
  completeContent: {
    paddingHorizontal: theme.spacing.xl,
    paddingTop: theme.spacing.forty,
    paddingBottom: theme.spacing.xxl,
    alignItems: 'center',
  },
  resultCard: {
    width: '100%',
    backgroundColor: theme.colors.bgPanel,
    borderRadius: theme.radii.xl,
    borderWidth: theme.borderWidths.thin,
    borderColor: theme.colors.borderMedium,
    paddingVertical: theme.spacing.xxl,
    paddingHorizontal: theme.spacing.lg,
    alignItems: 'center',
    marginBottom: theme.spacing.lg,
  },
  tierBadge: {
    color: theme.colors.gold,
    fontSize: theme.fontSizes.md,
    fontWeight: theme.fontWeights.black,
    letterSpacing: 2,
    textTransform: 'uppercase',
    marginBottom: theme.spacing.lg,
  },
  statRow: {
    flexDirection: 'row',
    gap: theme.spacing.xl,
  },
  statBox: {
    alignItems: 'center',
  },
  statNum: {
    color: theme.colors.textPrimary,
    fontSize: theme.fontSizes.display,
    fontWeight: theme.fontWeights.black,
    lineHeight: 48,
  },
  statLbl: {
    color: theme.colors.textMuted,
    fontSize: theme.fontSizes.caption,
    textTransform: 'uppercase',
    letterSpacing: 0.5,
    fontWeight: theme.fontWeights.bold,
  },
  failBody: {
    color: theme.colors.text72,
    fontSize: theme.fontSizes.base,
    textAlign: 'center',
    lineHeight: 22,
  },
  rewardCard: {
    width: '100%',
    backgroundColor: theme.colors.bgOverlaySoft,
    borderRadius: theme.radii.lg,
    borderWidth: theme.borderWidths.thin,
    borderColor: theme.colors.borderSubtle,
    paddingVertical: theme.spacing.lg,
    paddingHorizontal: theme.spacing.lg,
    alignItems: 'center',
  },
  rewardLabel: {
    color: theme.colors.greenPastel,
    fontSize: theme.fontSizes.m,
    fontWeight: theme.fontWeights.heavy,
    textTransform: 'uppercase',
    letterSpacing: 1,
    marginBottom: theme.spacing.xs,
  },
  rewardAmount: {
    color: theme.colors.gold,
    fontSize: theme.fontSizes.h1,
    fontWeight: theme.fontWeights.black,
  },
  rewardNote: {
    color: theme.colors.textMuted,
    fontSize: theme.fontSizes.md,
    marginTop: theme.spacing.xs,
  },
});
