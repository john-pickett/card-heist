import React, { useCallback, useEffect, useRef, useState } from 'react';
import {
  Animated,
  Image,
  LayoutChangeEvent,
  StyleSheet,
  Text,
  TouchableOpacity,
  useWindowDimensions,
  View,
} from 'react-native';
import { useAudioPlayer } from 'expo-audio';
import { EscapeDiscardModal } from '../components/EscapeDiscardModal';
import { EscapeHelpModal } from '../components/EscapeHelpModal';
import { useEscapeStore } from '../store/escapeStore';
import { useInventoryStore } from '../store/inventoryStore';
import { useSettingsStore } from '../store/settingsStore';
import {
  ESCAPE_EXIT_POSITION,
  ESCAPE_PATH_LENGTH,
  ESCAPE_POLICE_ALERT_THRESHOLD,
} from '../constants/escapeBalance';
import { ActTutorialOverlay } from '../components/ActTutorialOverlay';
import theme from '../theme';

const SUIT_SYMBOL: Record<string, string> = {
  spades: '♠',
  hearts: '♥',
  diamonds: '♦',
  clubs: '♣',
};
const RED_SUITS = new Set(['hearts', 'diamonds']);

interface Props {
  totalScore: number;
  onPlayAgain: () => void;
  onHome: () => void;
  showTutorial: boolean;
  onDismissTutorial: () => void;
}

export function EscapeScreen({
  totalScore,
  onPlayAgain,
  onHome,
  showTutorial,
  onDismissTutorial,
}: Props) {
  const WIN_SUMMARY_DELAY_MS = 800;
  const {
    phase,
    deck,
    playerHand,
    playerPosition,
    policePosition,
    selectedIds,
    policeAlertLevel,
    errorMessage,
    policeMessage,
    turnLog,
    outOfPlay,
    infoMessage,
    initGame,
    toggleSelect,
    layMeld,
    discard,
    runPoliceTurn,
    endPoliceTurn,
    clearError,
    clearInfo,
    activateFalseTrail,
  } = useEscapeStore();

  const falseTrailQty = useInventoryStore(
    s => s.items.find(i => i.itemId === 'false-trail')?.quantity ?? 0,
  );
  const hasFalseTrail = falseTrailQty > 0;
  const removeItem = useInventoryStore(s => s.removeItem);

  const fanfarePlayer  = useAudioPlayer(require('../../assets/sounds/fanfare.wav'));
  const winPlayer      = useAudioPlayer(require('../../assets/sounds/win-fanfare.wav'));
  const losePlayer     = useAudioPlayer(require('../../assets/sounds/lose-fanfare.wav'));
  const notifyPlayer   = useAudioPlayer(require('../../assets/sounds/notify.wav'));
  const soundEnabled   = useSettingsStore(s => s.soundEnabled);

  // Play fanfare on successful meld; Zustand set() is synchronous so
  // lastMeldType is already updated by the time layMeld() returns.
  const handleLayMeld = useCallback(() => {
    layMeld();
    if (soundEnabled && useEscapeStore.getState().lastMeldType !== null) {
      fanfarePlayer.seekTo(0);
      fanfarePlayer.play();
    }
  }, [layMeld, fanfarePlayer, soundEnabled]);

  // Your-turn notification: play after the police finish their turn
  const prevPhaseRef = useRef(phase);
  useEffect(() => {
    const prev = prevPhaseRef.current;
    prevPhaseRef.current = phase;
    if (soundEnabled && phase === 'player_turn' && (prev === 'awaiting_continue' || prev === 'police_thinking')) {
      notifyPlayer.seekTo(0);
      notifyPlayer.play();
    }
  }, [phase]); // eslint-disable-line react-hooks/exhaustive-deps

  // Win / lose fanfares
  useEffect(() => {
    if (phase === 'won') {
      if (soundEnabled) { winPlayer.seekTo(0); winPlayer.play(); }
    } else if (phase === 'lost') {
      if (soundEnabled) { losePlayer.seekTo(0); losePlayer.play(); }
    }
  }, [phase]); // eslint-disable-line react-hooks/exhaustive-deps

  const [helpVisible, setHelpVisible] = useState(false);
  const [discardModalVisible, setDiscardModalVisible] = useState(false);
  const [lostConfirmed, setLostConfirmed] = useState(false);
  const [showWinSummary, setShowWinSummary] = useState(false);

  useEffect(() => {
    if (phase === 'lost') setLostConfirmed(false);
  }, [phase]);

  useEffect(() => {
    if (phase !== 'won') {
      setShowWinSummary(false);
      return;
    }
    setShowWinSummary(false);
    const t = setTimeout(() => setShowWinSummary(true), WIN_SUMMARY_DELAY_MS);
    return () => clearTimeout(t);
  }, [phase]);

  const { width: screenWidth } = useWindowDimensions();
  // 4 cards per row, 3 gaps of 8px, 16px padding each side
  const cardW = Math.floor((screenWidth - 32 - 24) / 4);
  const cardH = Math.floor(cardW * 1.2);

  // Track path track width for token positioning
  const [trackWidth, setTrackWidth] = useState(0);
  const playerAnim = useRef(new Animated.Value(playerPosition)).current;
  const policeAnim  = useRef(new Animated.Value(policePosition)).current;

  // Initialize on mount
  useEffect(() => { initGame(); }, []);

  // Reset Act 3 state and silence any lingering audio when leaving the screen.
  useEffect(() => {
    return () => {
      [fanfarePlayer, winPlayer, losePlayer, notifyPlayer].forEach(player => {
        try {
          player.pause();
        } catch {
          // Expo may dispose the native audio object before this cleanup runs.
        }
      });
      useEscapeStore.getState().initGame();
    };
  }, [fanfarePlayer, winPlayer, losePlayer, notifyPlayer]);

  // Police turn driver
  useEffect(() => {
    if (phase === 'police_thinking') {
      const t = setTimeout(runPoliceTurn, 900);
      return () => clearTimeout(t);
    }
    // No auto-advance for 'awaiting_continue' — player taps Continue
  }, [phase]);

  // Auto-clear error
  useEffect(() => {
    if (!errorMessage) return;
    const t = setTimeout(clearError, 2000);
    return () => clearTimeout(t);
  }, [errorMessage]);

  // Auto-clear infoMessage
  useEffect(() => {
    if (!infoMessage) return;
    const t = setTimeout(clearInfo, 3000);
    return () => clearTimeout(t);
  }, [infoMessage]);

  // Animate player token
  useEffect(() => {
    Animated.timing(playerAnim, {
      toValue: playerPosition,
      duration: 350,
      useNativeDriver: false,
    }).start();
  }, [playerPosition]);

  // Animate police token
  useEffect(() => {
    Animated.timing(policeAnim, {
      toValue: policePosition,
      duration: 350,
      useNativeDriver: false,
    }).start();
  }, [policePosition]);

  const steps = Array.from({ length: ESCAPE_PATH_LENGTH }, (_, i) => i + 1);
  const stepDenominator = Math.max(1, ESCAPE_PATH_LENGTH - 1);

  // Step positions: EXIT (step 1) is left, highest step is right.
  function stepLeft(step: number): number {
    if (trackWidth === 0) return 0;
    return ((ESCAPE_PATH_LENGTH - step) / stepDenominator) * trackWidth;
  }

  const stepPositions = steps.map(stepLeft);

  const playerTokenLeft = playerAnim.interpolate({
    inputRange: steps,
    outputRange: stepPositions,
  });
  const policeTokenLeft = policeAnim.interpolate({
    inputRange: steps,
    outputRange: stepPositions,
  });

  const isPlayerTurn = phase === 'player_turn';
  const buttonsDisabled = !isPlayerTurn;

  // ── Won ────────────────────────────────────────────────────────────────────
  if (phase === 'won' && showWinSummary) {
    return (
      <View style={styles.screen}>
        <Text style={[styles.heading, styles.headingGold]}>ESCAPED!</Text>
        <Text style={styles.subheading}>You slipped past the police.</Text>
        <View style={styles.panel}>
          <Text style={styles.panelLabel}>You escape with:</Text>
          <Text style={styles.goldAmount}>{totalScore} gold</Text>
          <Text style={styles.pctLabel}>(100% of campaign score)</Text>
        </View>
        <View style={styles.buttonRow}>
          <TouchableOpacity style={[styles.btn, styles.btnGreen]} onPress={onPlayAgain}>
            <Text style={styles.btnText}>Play Again</Text>
          </TouchableOpacity>
          <TouchableOpacity style={[styles.btn, styles.btnSecondary]} onPress={onHome}>
            <Text style={[styles.btnText, styles.btnTextSecondary]}>Home</Text>
          </TouchableOpacity>
        </View>
      </View>
    );
  }

  // ── Lost (confirmed) ───────────────────────────────────────────────────────
  if (phase === 'lost' && lostConfirmed) {
    return (
      <View style={styles.screen}>
        <Text style={[styles.heading, styles.headingRed]}>CAUGHT!</Text>
        <Text style={styles.subheading}>The police got too close, and you had to drop two of your bags to run. You managed to keep a portion of your loot.</Text>
        <View style={styles.panel}>
          <Text style={styles.panelLabel}>You escape with:</Text>
          <Text style={[styles.goldAmount, styles.goldAmountRed]}>{Math.round(totalScore * 0.33)} gold</Text>
          {/* <Text style={styles.pctLabel}>(1/3 of campaign score)</Text> */}
        </View>
        <View style={styles.buttonRow}>
          <TouchableOpacity style={[styles.btn, styles.btnGreen]} onPress={onPlayAgain}>
            <Text style={styles.btnText}>Play Again</Text>
          </TouchableOpacity>
          <TouchableOpacity style={[styles.btn, styles.btnSecondary]} onPress={onHome}>
            <Text style={[styles.btnText, styles.btnTextSecondary]}>Home</Text>
          </TouchableOpacity>
        </View>
      </View>
    );
  }

  // ── Status message ─────────────────────────────────────────────────────────
  const statusText = infoMessage
    ? infoMessage
    : phase === 'won'
    ? 'You made it to the exit.'
    : phase === 'police_thinking'
    ? 'Police are moving...'
    : policeMessage
    ? policeMessage
    : errorMessage
    ? errorMessage
    : `Step ${playerPosition} of ${ESCAPE_PATH_LENGTH} — reach EXIT (step ${ESCAPE_EXIT_POSITION}) to escape`;

  const statusColor = infoMessage
    ? theme.colors.successTeal
    : phase === 'lost'
    ? theme.colors.errorRed
    : policeMessage
    ? theme.colors.gold
    : errorMessage
    ? theme.colors.errorRed
    : theme.colors.textMuted;

  const tutorialParagraph =
    'In Escape, you are racing to the exit while police pressure builds every turn. ' +
    'Select cards to lay melds or discard strategically to move your position and protect your total gold, because getting caught means losing most of the haul.';

  const showContinue = phase === 'awaiting_continue' || (phase === 'lost' && !lostConfirmed);
  const alertSegmentsFilled = Math.min(ESCAPE_POLICE_ALERT_THRESHOLD, policeAlertLevel);
  const alertLevelColor =
    alertSegmentsFilled >= 3
      ? theme.colors.red
      : alertSegmentsFilled === 2
      ? theme.colors.orange
      : alertSegmentsFilled === 1
      ? theme.colors.gold
      : theme.colors.borderFaint;

  // ── Game Board ─────────────────────────────────────────────────────────────
  return (
    <View style={styles.screen}>
      {/* Header */}
      <View style={styles.header}>
        <Text style={styles.headerTitle}>ESCAPE</Text>
        <View style={styles.scoreBadge}>
          <Text style={styles.scoreText}>Gold: {totalScore}</Text>
        </View>
        <TouchableOpacity style={styles.helpBtn} onPress={() => setHelpVisible(true)} hitSlop={8}>
          <Text style={styles.helpBtnText}>Help</Text>
        </TouchableOpacity>
      </View>

      {hasFalseTrail && (
        <View style={styles.buffToolbar}>
          <TouchableOpacity
            style={[styles.toolbarBtn, !isPlayerTurn && styles.toolbarBtnDisabled]}
            onPress={isPlayerTurn ? () => { activateFalseTrail(); removeItem('false-trail'); } : undefined}
            activeOpacity={isPlayerTurn ? 0.75 : 1}
          >
            <Text style={styles.toolbarBtnText}>
              {'🧭 False Trail'}
              <Text style={styles.toolbarBtnQtyText}> x{falseTrailQty}</Text>
            </Text>
          </TouchableOpacity>
        </View>
      )}

      {/* Path Track */}
      <View style={styles.trackContainer}>
        <View
          style={styles.track}
          onLayout={(e: LayoutChangeEvent) => {
            const w = e.nativeEvent.layout.width;
            setTrackWidth(w - TOKEN_SIZE);
          }}
        >
          {/* Connecting line */}
          <View style={styles.trackLine} />

          {/* Step circles */}
          {steps.map(step => {
            const left = stepLeft(step) - CIRCLE_SIZE / 2 + TOKEN_SIZE / 2;
            const isExit = step === ESCAPE_EXIT_POSITION;
            return (
              <View
                key={step}
                style={[
                  styles.stepCircle,
                  isExit && styles.stepCircleExit,
                  { left },
                ]}
              >
                <Text style={[styles.stepLabel, isExit && styles.stepLabelExit]}>
                  {isExit ? 'EXIT' : `${step}`}
                </Text>
              </View>
            );
          })}

          {/* Police token */}
          <Animated.View style={[styles.token, styles.policeToken, { left: policeTokenLeft }]}>
            <Text style={styles.tokenText}>👮</Text>
          </Animated.View>

          {/* Player token */}
          <Animated.View style={[styles.token, styles.playerToken, { left: playerTokenLeft }]}>
            <Text style={styles.tokenText}>💰</Text>
          </Animated.View>
        </View>
      </View>

      <View style={styles.alertMeterWrap}>
        <View style={styles.alertMeterHeader}>
          <Text style={styles.alertMeterLabel}>ALERT</Text>
          <Text style={[styles.alertMeterValue, { color: alertLevelColor }]}>
            {alertSegmentsFilled}/{ESCAPE_POLICE_ALERT_THRESHOLD}
          </Text>
        </View>
        <View style={styles.alertMeterRow}>
          {[0, 1, 2].map(idx => {
            const filled = idx < alertSegmentsFilled;
            return (
              <View
                key={idx}
                style={[
                  styles.alertMeterSegment,
                  filled && { backgroundColor: alertLevelColor, borderColor: alertLevelColor },
                ]}
              />
            );
          })}
        </View>
      </View>

      {/* Recent Police Activity */}
      {turnLog.length > 0 && (
        <View style={styles.turnLogPanel}>
          <Text style={styles.turnLogTitle}>POLICE ACTIVITY</Text>
          {[...turnLog].slice(-2).reverse().map((entry, i) => (
            <View key={entry.turn} style={[styles.turnLogRow, i > 0 && styles.turnLogRowOld]}>
              <View style={styles.turnLogActions}>
                {(entry.policeEvents ?? [entry.policeAction]).map((event, eventIdx) => (
                  <Text
                    key={`${entry.turn}-p-${eventIdx}`}
                    style={styles.turnLogActionPolice}
                    numberOfLines={2}
                  >
                    👮 {event}
                  </Text>
                ))}
              </View>
            </View>
          ))}
        </View>
      )}

      <View style={styles.bottomDock}>
        {/* Status area */}
        <View style={styles.statusArea}>
          <Text style={[styles.statusText, { color: statusColor }]}>{statusText}</Text>
        </View>

        {/* Action buttons */}
        <View style={styles.actionRow}>
          {showContinue ? (
            <TouchableOpacity
              style={[styles.btn, styles.btnContinue]}
              onPress={() => {
                if (phase === 'awaiting_continue') endPoliceTurn();
                else setLostConfirmed(true);
              }}
            >
              <Text style={styles.btnText}>Continue</Text>
            </TouchableOpacity>
          ) : (
            <>
              <TouchableOpacity
                style={[
                  styles.btn,
                  styles.btnMeld,
                  (buttonsDisabled || selectedIds.length < 3) && styles.btnDisabled,
                ]}
                onPress={handleLayMeld}
                disabled={buttonsDisabled || selectedIds.length < 3}
              >
                <Text style={styles.btnText}>LAY MELD</Text>
                {selectedIds.length >= 3 && (
                  <Text style={styles.btnSub}>{selectedIds.length} cards</Text>
                )}
              </TouchableOpacity>

              <TouchableOpacity
                style={[
                  styles.btn,
                  styles.btnDiscard,
                  (buttonsDisabled || selectedIds.length === 0) && styles.btnDisabled,
                ]}
                onPress={discard}
                disabled={buttonsDisabled || selectedIds.length === 0}
              >
                <Text style={styles.btnText}>DISCARD</Text>
                {selectedIds.length > 0 && (
                  <Text style={styles.btnSub}>{selectedIds.length} cards</Text>
                )}
              </TouchableOpacity>
            </>
          )}
        </View>

        {/* Hand label row */}
        <View style={styles.handLabelRow}>
          <Text style={styles.handLabel}>MY HAND</Text>
          <TouchableOpacity onPress={() => setDiscardModalVisible(true)}>
            <Text style={styles.deckBtn}>DECK: {deck.length} →</Text>
          </TouchableOpacity>
        </View>

        {/* 2×4 card grid */}
        <View style={styles.handGrid}>
          {playerHand.map(ec => {
            const selected = selectedIds.includes(ec.instanceId);
            const isRed = RED_SUITS.has(ec.card.suit);
            return (
              <TouchableOpacity
                key={ec.instanceId}
                onPress={() => toggleSelect(ec.instanceId)}
                disabled={buttonsDisabled}
                activeOpacity={0.75}
              >
                <View style={[
                  styles.miniCard,
                  selected && styles.miniCardSelected,
                  { width: cardW, height: cardH },
                ]}>
                  <Text style={[styles.miniRank, isRed && styles.redText]}>
                    {ec.card.rank}
                  </Text>
                  <Text style={[styles.miniSuit, isRed && styles.redText]}>
                    {SUIT_SYMBOL[ec.card.suit]}
                  </Text>
                </View>
              </TouchableOpacity>
            );
          })}
        </View>
      </View>

      <EscapeHelpModal visible={helpVisible} onClose={() => setHelpVisible(false)} />
      <EscapeDiscardModal
        visible={discardModalVisible}
        onClose={() => setDiscardModalVisible(false)}
        outOfPlay={outOfPlay}
        deckCount={deck.length}
      />
      {showTutorial && (
        <ActTutorialOverlay
          title="Act 3 Tutorial: Escape"
          paragraph={tutorialParagraph}
          onDismiss={onDismissTutorial}
        >
          <Image
            source={require('../../assets/images/escape.png')}
            style={styles.tutorialImage}
            resizeMode="contain"
          />
        </ActTutorialOverlay>
      )}

    </View>
  );
}

const TOKEN_SIZE = 36;
const CIRCLE_SIZE = 28;

const styles = StyleSheet.create({
  screen: {
    flex: 1,
    backgroundColor: theme.colors.bgPrimary,
    paddingHorizontal: theme.spacing.lg,
  },

  // Header
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingTop: theme.spacing.ten,
    marginBottom: theme.spacing.lg,
    gap: theme.spacing.sm,
  },
  headerTitle: {
    color: theme.colors.textPrimary,
    fontSize: theme.fontSizes.lg,
    fontWeight: theme.fontWeights.black,
    letterSpacing: 2,
    flex: 1,
  },
  turnBadge: {
    borderRadius: theme.radii.r8,
    paddingHorizontal: theme.spacing.sm,
    paddingVertical: theme.spacing.xs,
  },
  turnBadgePlayer: {
    backgroundColor: theme.colors.greenPrimary,
  },
  turnBadgePolice: {
    backgroundColor: theme.colors.red,
  },
  turnBadgeText: {
    color: theme.colors.textPrimary,
    fontSize: theme.fontSizes.caption,
    fontWeight: theme.fontWeights.black,
    letterSpacing: 1,
  },
  scoreBadge: {
    backgroundColor: theme.colors.greenPrimary,
    borderRadius: theme.radii.r8,
    paddingHorizontal: theme.spacing.sm,
    paddingVertical: theme.spacing.three,
    borderWidth: theme.borderWidths.thin,
    borderColor: theme.colors.borderStrong,
  },
  scoreText: {
    color: theme.colors.textPrimary,
    fontSize: theme.fontSizes.s,
    fontWeight: theme.fontWeights.bold,
  },

  // Help button
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
  
  // Path track
  trackContainer: {
    marginBottom: theme.spacing.md,
  },
  track: {
    height: 80,
    marginHorizontal: TOKEN_SIZE / 2,
    position: 'relative',
  },
  trackLine: {
    position: 'absolute',
    top: 40 - 1,
    left: 0,
    right: 0,
    height: 2,
    backgroundColor: theme.colors.borderStrong,
  },
  stepCircle: {
    position: 'absolute',
    top: 40 - CIRCLE_SIZE / 2,
    width: CIRCLE_SIZE,
    height: CIRCLE_SIZE,
    borderRadius: CIRCLE_SIZE / 2,
    backgroundColor: theme.colors.bgPanel,
    borderWidth: theme.borderWidths.thick,
    borderColor: theme.colors.borderBright,
    alignItems: 'center',
    justifyContent: 'center',
  },
  stepCircleExit: {
    backgroundColor: theme.colors.gold,
    borderColor: theme.colors.gold,
  },
  stepLabel: {
    color: theme.colors.text50,
    fontSize: theme.fontSizes.xxs,
    fontWeight: theme.fontWeights.black,
    letterSpacing: 0.3,
  },
  stepLabelExit: {
    color: theme.colors.bgPanel,
    fontSize: theme.fontSizes.xxxs,
    fontWeight: theme.fontWeights.black,
  },
  token: {
    position: 'absolute',
    width: TOKEN_SIZE,
    height: TOKEN_SIZE,
    alignItems: 'center',
    justifyContent: 'center',
  },
  playerToken: {
    top: 40 - TOKEN_SIZE / 2 - 14,
  },
  policeToken: {
    top: 40 + TOKEN_SIZE / 2 - 14,
  },
  tokenText: {
    fontSize: theme.fontSizes.xl,
  },

  // Turn log
  alertMeterWrap: {
    backgroundColor: theme.colors.bgPanel,
    borderRadius: theme.radii.r8,
    borderWidth: theme.borderWidths.thin,
    borderColor: theme.colors.borderFaint,
    paddingHorizontal: theme.spacing.sm,
    paddingVertical: theme.spacing.xs,
    marginBottom: theme.spacing.six,
  },
  alertMeterHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: theme.spacing.xs,
  },
  alertMeterLabel: {
    color: theme.colors.text50,
    fontSize: theme.fontSizes.caption,
    fontWeight: theme.fontWeights.black,
    letterSpacing: 1,
  },
  alertMeterValue: {
    fontSize: theme.fontSizes.caption,
    fontWeight: theme.fontWeights.black,
    letterSpacing: 0.5,
  },
  alertMeterRow: {
    flexDirection: 'row',
    gap: theme.spacing.xs,
  },
  alertMeterSegment: {
    flex: 1,
    height: 10,
    borderRadius: theme.radii.r8,
    backgroundColor: theme.colors.bgPrimary,
    borderWidth: theme.borderWidths.thin,
    borderColor: theme.colors.borderFaint,
  },

  // Turn log
  turnLogPanel: {
    backgroundColor: theme.colors.bgPanel,
    borderRadius: theme.radii.r8,
    paddingHorizontal: theme.spacing.sm,
    paddingVertical: theme.spacing.xs,
    marginBottom: theme.spacing.six,
    borderWidth: theme.borderWidths.thin,
    borderColor: theme.colors.borderFaint,
  },
  turnLogTitle: {
    color: theme.colors.text50,
    fontSize: theme.fontSizes.caption,
    fontWeight: theme.fontWeights.black,
    letterSpacing: 1,
    marginBottom: 2,
  },
  turnLogRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: theme.spacing.xs,
    paddingVertical: 2,
  },
  turnLogRowOld: {
    opacity: 0.45,
  },
  turnLogActions: {
    flex: 1,
  },
  turnLogActionYou: {
    color: theme.colors.textPrimary,
    fontSize: theme.fontSizes.caption,
    lineHeight: 14,
  },
  turnLogActionPolice: {
    color: theme.colors.gold,
    fontSize: theme.fontSizes.caption,
    lineHeight: 14,
  },

  // Status
  bottomDock: {
    marginTop: 'auto',
    paddingBottom: theme.spacing.xxl,
  },
  statusArea: {
    height: 36,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: theme.spacing.six,
    paddingHorizontal: theme.spacing.sm,
  },
  statusText: {
    fontSize: theme.fontSizes.s,
    fontWeight: theme.fontWeights.bold,
    textAlign: 'center',
    letterSpacing: 0.3,
  },

  // Hand label row
  handLabelRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    height: 28,
    marginBottom: theme.spacing.sm,
  },
  handLabel: {
    color: theme.colors.text50,
    fontSize: theme.fontSizes.caption,
    fontWeight: theme.fontWeights.black,
    letterSpacing: 1.5,
  },
  deckBtn: {
    color: theme.colors.gold,
    fontSize: theme.fontSizes.sm,
    fontWeight: theme.fontWeights.bold,
    letterSpacing: 0.5,
  },

  // 2×4 card grid
  handGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: theme.spacing.sm,
    marginBottom: theme.spacing.md,
  },
  miniCard: {
    backgroundColor: theme.colors.cardFace,
    borderRadius: theme.radii.r8,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: theme.borderWidths.thick,
    borderColor: 'transparent',
    shadowColor: theme.colors.shadow,
    shadowOpacity: 0.2,
    shadowRadius: 4,
    shadowOffset: { width: 0, height: 2 },
    elevation: 3,
  },
  miniCardSelected: {
    borderColor: theme.colors.gold,
    transform: [{ translateY: -6 }],
    shadowOpacity: 0.45,
    shadowRadius: 8,
    elevation: 8,
  },
  miniRank: {
    color: theme.colors.cardTextDark,
    fontSize: theme.fontSizes.lg,
    fontWeight: theme.fontWeights.black,
    lineHeight: 22,
  },
  miniSuit: {
    color: theme.colors.cardTextDark,
    fontSize: theme.fontSizes.subtitle,
    lineHeight: 20,
  },
  redText: { color: theme.colors.red },

  // Action buttons
  actionRow: {
    flexDirection: 'row',
    gap: theme.spacing.md,
    marginBottom: theme.spacing.sm,
  },
  btn: {
    flex: 1,
    borderRadius: theme.radii.lg,
    paddingVertical: theme.spacing.fourteen,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: theme.borderWidths.thin,
    borderColor: theme.colors.borderMedium,
    minHeight: 56,
  },
  btnMeld: {
    backgroundColor: theme.colors.greenPrimary,
  },
  btnDiscard: {
    backgroundColor: theme.colors.bgPrimary,
    borderColor: theme.colors.greenPrimary,
  },
  btnContinue: {
    backgroundColor: theme.colors.bgPanel,
    borderColor: theme.colors.gold,
  },
  btnDisabled: {
    opacity: 0.35,
  },
  btnGreen: {
    backgroundColor: theme.colors.greenPrimary,
  },
  btnSecondary: {
    backgroundColor: 'transparent',
    borderColor: theme.colors.borderBright,
  },
  btnText: {
    color: theme.colors.textPrimary,
    fontSize: theme.fontSizes.md,
    fontWeight: theme.fontWeights.heavy,
    letterSpacing: 0.5,
  },
  btnTextSecondary: {
    color: theme.colors.text75,
    fontWeight: theme.fontWeights.medium,
  },
  btnSub: {
    color: theme.colors.text60,
    fontSize: theme.fontSizes.caption,
    marginTop: theme.spacing.two,
  },

  // Buff toolbar
  buffToolbar: {
    flexDirection: 'row',
    gap: theme.spacing.sm,
    marginBottom: theme.spacing.sm,
  },
  toolbarBtn: {
    borderRadius: theme.radii.lg,
    paddingVertical: theme.spacing.sm,
    paddingHorizontal: theme.spacing.md,
    backgroundColor: theme.colors.bgPanel,
    borderWidth: theme.borderWidths.thin,
    borderColor: theme.colors.borderBright,
    alignItems: 'center',
    justifyContent: 'center',
  },
  toolbarBtnDisabled: {
    opacity: 0.35,
  },
  toolbarBtnText: {
    color: theme.colors.textPrimary,
    fontSize: theme.fontSizes.sm,
    fontWeight: theme.fontWeights.heavy,
    letterSpacing: 0.3,
  },
  toolbarBtnQtyText: {
    color: theme.colors.text60,
    fontSize: theme.fontSizes.sm,
    fontWeight: theme.fontWeights.medium,
    letterSpacing: 0.2,
  },

  // Result screens
  heading: {
    color: theme.colors.gold,
    fontSize: theme.fontSizes.xxl,
    fontWeight: theme.fontWeights.black,
    letterSpacing: 2,
    marginBottom: theme.spacing.sm,
    textAlign: 'center',
  },
  headingGold: { color: theme.colors.gold },
  headingRed:  { color: theme.colors.errorRed },
  subheading: {
    color: theme.colors.text75,
    fontSize: theme.fontSizes.md,
    fontWeight: theme.fontWeights.bold,
    letterSpacing: 1,
    marginBottom: theme.spacing.six,
    textAlign: 'center',
  },
  panel: {
    backgroundColor: theme.colors.bgPanel,
    borderRadius: theme.radii.xl,
    padding: theme.spacing.xxl,
    width: '100%',
    borderWidth: theme.borderWidths.thin,
    borderColor: theme.colors.borderFaint,
    alignItems: 'center',
    marginBottom: theme.spacing.xl,
    marginTop: theme.spacing.md,
  },
  panelLabel: {
    color: theme.colors.text50,
    fontSize: theme.fontSizes.sm,
    fontWeight: theme.fontWeights.heavy,
    letterSpacing: 1.5,
    marginBottom: theme.spacing.six,
    textTransform: 'uppercase',
  },
  goldAmount: {
    color: theme.colors.gold,
    fontSize: theme.fontSizes.hero2,
    fontWeight: theme.fontWeights.black,
    marginBottom: theme.spacing.xs,
  },
  goldAmountRed: {
    color: theme.colors.errorRed,
  },
  pctLabel: {
    color: theme.colors.textDim,
    fontSize: theme.fontSizes.s,
    fontStyle: 'italic',
  },
  buttonRow: {
    flexDirection: 'row',
    gap: theme.spacing.md,
    width: '100%',
  },
  snapTrack: {
    height: 54,
    position: 'relative',
    justifyContent: 'center',
    marginBottom: theme.spacing.sm,
  },
  snapLine: {
    height: 2,
    backgroundColor: theme.colors.borderBright,
    marginHorizontal: theme.spacing.ten,
  },
  snapNode: {
    position: 'absolute',
    width: 22,
    height: 22,
    borderRadius: theme.radii.r11,
    alignItems: 'center',
    justifyContent: 'center',
    top: 16,
  },
  snapNodeExit: {
    left: 2,
    backgroundColor: theme.colors.gold,
  },
  snapNodeMiddle: {
    left: '48%',
    marginLeft: -11,
    backgroundColor: theme.colors.bgPanel,
    borderWidth: theme.borderWidths.thin,
    borderColor: theme.colors.borderBright,
  },
  snapNodeStart: {
    right: 2,
    backgroundColor: theme.colors.bgPanel,
    borderWidth: theme.borderWidths.thin,
    borderColor: theme.colors.borderBright,
  },
  snapNodeText: {
    color: theme.colors.text60,
    fontSize: theme.fontSizes.xxs,
    fontWeight: theme.fontWeights.black,
  },
  snapNodeExitText: {
    color: theme.colors.bgPanel,
    fontSize: theme.fontSizes.xxs,
    fontWeight: theme.fontWeights.black,
  },
  snapPlayer: {
    position: 'absolute',
    left: '40%',
    top: 2,
    fontSize: theme.fontSizes.subtitle,
  },
  snapPolice: {
    position: 'absolute',
    left: '58%',
    top: 28,
    fontSize: theme.fontSizes.subtitle,
  },
  snapHand: {
    flexDirection: 'row',
    justifyContent: 'center',
    gap: theme.spacing.six,
  },
  snapHandCard: {
    backgroundColor: theme.colors.cardFace,
    borderRadius: theme.radii.sm,
    paddingHorizontal: theme.spacing.sm,
    paddingVertical: theme.spacing.sm,
    minWidth: 36,
    alignItems: 'center',
  },
  snapHandRank: {
    color: theme.colors.cardText,
    fontSize: theme.fontSizes.sm,
    fontWeight: theme.fontWeights.black,
  },
  tutorialImage: {
    width: '100%',
    height: '100%',
  },
});
