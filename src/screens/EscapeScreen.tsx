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
import { ActTutorialOverlay } from '../components/ActTutorialOverlay';

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
  const {
    phase,
    deck,
    playerHand,
    playerPosition,
    policePosition,
    selectedIds,
    errorMessage,
    policeMessage,
    policeLastPlay,
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
  } = useEscapeStore();

  const fanfarePlayer  = useAudioPlayer(require('../../assets/sounds/fanfare.wav'));
  const stingPlayer    = useAudioPlayer(require('../../assets/sounds/police-sting.wav'));
  const winPlayer      = useAudioPlayer(require('../../assets/sounds/win-fanfare.wav'));
  const losePlayer     = useAudioPlayer(require('../../assets/sounds/lose-fanfare.wav'));

  // Play fanfare on successful meld; Zustand set() is synchronous so
  // lastMeldType is already updated by the time layMeld() returns.
  const handleLayMeld = useCallback(() => {
    layMeld();
    if (useEscapeStore.getState().lastMeldType !== null) {
      fanfarePlayer.seekTo(0);
      fanfarePlayer.play();
    }
  }, [layMeld, fanfarePlayer]);

  // Police sting: fires when police reveal a mid-game meld (phase goes to
  // police_reveal, not directly to lost — that path gets the lose fanfare).
  useEffect(() => {
    if (phase === 'police_reveal' && policeLastPlay && policeLastPlay.length >= 3) {
      stingPlayer.seekTo(0);
      stingPlayer.play();
    }
  }, [phase, policeLastPlay]); // eslint-disable-line react-hooks/exhaustive-deps

  // Win / lose fanfares
  useEffect(() => {
    if (phase === 'won') {
      winPlayer.seekTo(0);
      winPlayer.play();
    } else if (phase === 'lost') {
      losePlayer.seekTo(0);
      losePlayer.play();
    }
  }, [phase]); // eslint-disable-line react-hooks/exhaustive-deps

  const [helpVisible, setHelpVisible] = useState(false);
  const [discardModalVisible, setDiscardModalVisible] = useState(false);

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

  // Police turn driver
  useEffect(() => {
    if (phase === 'police_thinking') {
      const t = setTimeout(runPoliceTurn, 900);
      return () => clearTimeout(t);
    }
    if (phase === 'police_reveal') {
      const t = setTimeout(endPoliceTurn, 1400);
      return () => clearTimeout(t);
    }
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

  // Step X positions: step 1 = left (0), step 6 = right (trackWidth)
  // stepLeft(step) = ((step - 1) / 5) * trackWidth, then flip: ((6 - step) / 5) * trackWidth
  function stepLeft(step: number): number {
    if (trackWidth === 0) return 0;
    return ((6 - step) / 5) * trackWidth;
  }

  const stepPositions = [1, 2, 3, 4, 5, 6].map(stepLeft);

  const playerTokenLeft = playerAnim.interpolate({
    inputRange: [1, 2, 3, 4, 5, 6],
    outputRange: stepPositions,
  });
  const policeTokenLeft = policeAnim.interpolate({
    inputRange: [1, 2, 3, 4, 5, 6],
    outputRange: stepPositions,
  });

  const isPlayerTurn = phase === 'player_turn';
  const buttonsDisabled = !isPlayerTurn;

  // ── Won ────────────────────────────────────────────────────────────────────
  if (phase === 'won') {
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

  // ── Lost ───────────────────────────────────────────────────────────────────
  if (phase === 'lost') {
    return (
      <View style={styles.screen}>
        <Text style={[styles.heading, styles.headingRed]}>CAUGHT!</Text>
        <Text style={styles.subheading}>Dropped the bags. You keep 33%.</Text>
        <View style={styles.panel}>
          <Text style={styles.panelLabel}>You escape with:</Text>
          <Text style={[styles.goldAmount, styles.goldAmountRed]}>{Math.round(totalScore * 0.33)} gold</Text>
          <Text style={styles.pctLabel}>(33% of campaign score)</Text>
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
    : policeMessage
    ? policeMessage
    : errorMessage
    ? errorMessage
    : isPlayerTurn
    ? `Step ${playerPosition} of 6 — reach EXIT (step 1) to escape`
    : 'Police are thinking...';

  const statusColor = infoMessage
    ? '#1abc9c'
    : policeMessage
    ? '#f4d03f'
    : errorMessage
    ? '#e74c3c'
    : 'rgba(255,255,255,0.65)';
  const tutorialParagraph =
    'In Escape, you are racing to the exit while police pressure builds every turn. ' +
    'Select cards to lay melds or discard strategically to move your position and protect your total gold, because getting caught means losing most of the haul.';

  // ── Game Board ─────────────────────────────────────────────────────────────
  return (
    <View style={styles.screen}>
      {/* Header */}
      <View style={styles.header}>
        <Text style={styles.headerTitle}>ACT 3: ESCAPE</Text>
        <View style={[styles.turnBadge, isPlayerTurn ? styles.turnBadgePlayer : styles.turnBadgePolice]}>
          <Text style={styles.turnBadgeText}>{isPlayerTurn ? 'YOUR TURN' : 'POLICE TURN'}</Text>
        </View>
        <Text style={styles.headerScore}>{totalScore} gold</Text>
        <TouchableOpacity style={styles.helpBtn} onPress={() => setHelpVisible(true)} hitSlop={8}>
          <Text style={styles.helpBtnText}>?</Text>
        </TouchableOpacity>
      </View>

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
          {[1, 2, 3, 4, 5, 6].map(step => {
            const left = stepLeft(step) - CIRCLE_SIZE / 2 + TOKEN_SIZE / 2;
            const isExit = step === 1;
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
                  {isExit ? 'EXIT' : step === 6 ? 'START' : `${step}`}
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
            <Text style={styles.tokenText}>🏃</Text>
          </Animated.View>
        </View>
      </View>

      {/* Police play area */}
      {policeLastPlay && (
        <View style={styles.policePlayArea}>
          <Text style={styles.policePlayLabel}>
            {policeLastPlay.length >= 3 ? 'Police melded:' : 'Police discarded:'}
          </Text>
          <View style={styles.fanContainer}>
            {policeLastPlay.map((ec, i) => {
              const isRed = RED_SUITS.has(ec.card.suit);
              return (
                <View
                  key={ec.instanceId}
                  style={[styles.fanCard, { left: i * 18, zIndex: i }]}
                >
                  <Text style={[styles.fanRank, isRed && styles.redText]}>{ec.card.rank}</Text>
                  <Text style={[styles.fanSuit, isRed && styles.redText]}>{SUIT_SYMBOL[ec.card.suit]}</Text>
                </View>
              );
            })}
          </View>
        </View>
      )}

      {/* Status area */}
      <View style={styles.statusArea}>
        <Text style={[styles.statusText, { color: statusColor }]}>{statusText}</Text>
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

      {/* Action buttons */}
      <View style={styles.actionRow}>
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
      </View>
    </View>
  );
}

const TOKEN_SIZE = 36;
const CIRCLE_SIZE = 28;

const styles = StyleSheet.create({
  screen: {
    flex: 1,
    backgroundColor: '#2d6a4f',
    paddingTop: 52,
    paddingHorizontal: 16,
  },

  // Header
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 16,
    gap: 8,
  },
  headerTitle: {
    color: '#f4d03f',
    fontSize: 16,
    fontWeight: '900',
    letterSpacing: 1.5,
    flex: 1,
  },
  turnBadge: {
    borderRadius: 8,
    paddingHorizontal: 8,
    paddingVertical: 4,
  },
  turnBadgePlayer: {
    backgroundColor: '#40916c',
  },
  turnBadgePolice: {
    backgroundColor: '#c0392b',
  },
  turnBadgeText: {
    color: '#fff',
    fontSize: 10,
    fontWeight: '900',
    letterSpacing: 1,
  },
  headerScore: {
    color: '#f4d03f',
    fontSize: 13,
    fontWeight: '800',
  },

  // Help button
  helpBtn: {
    width: 28,
    height: 28,
    borderRadius: 14,
    backgroundColor: 'rgba(255,255,255,0.12)',
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.2)',
  },
  helpBtnText: {
    color: 'rgba(255,255,255,0.7)',
    fontSize: 14,
    fontWeight: '800',
  },

  // Path track
  trackContainer: {
    marginBottom: 12,
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
    backgroundColor: 'rgba(255,255,255,0.2)',
  },
  stepCircle: {
    position: 'absolute',
    top: 40 - CIRCLE_SIZE / 2,
    width: CIRCLE_SIZE,
    height: CIRCLE_SIZE,
    borderRadius: CIRCLE_SIZE / 2,
    backgroundColor: '#1b4332',
    borderWidth: 2,
    borderColor: 'rgba(255,255,255,0.25)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  stepCircleExit: {
    backgroundColor: '#f4d03f',
    borderColor: '#f4d03f',
  },
  stepLabel: {
    color: 'rgba(255,255,255,0.5)',
    fontSize: 7,
    fontWeight: '900',
    letterSpacing: 0.3,
  },
  stepLabelExit: {
    color: '#1b4332',
    fontSize: 6,
    fontWeight: '900',
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
    fontSize: 22,
  },

  // Police play area
  policePlayArea: {
    marginBottom: 6,
  },
  policePlayLabel: {
    color: '#f4d03f',
    fontSize: 10,
    fontWeight: '700',
    letterSpacing: 0.5,
    marginBottom: 4,
  },
  fanContainer: {
    height: 62,
    position: 'relative',
  },
  fanCard: {
    position: 'absolute',
    top: 0,
    width: 42,
    height: 60,
    backgroundColor: '#fff',
    borderRadius: 6,
    borderWidth: 1,
    borderColor: '#ddd',
    paddingHorizontal: 4,
    paddingVertical: 3,
    justifyContent: 'space-between',
  },
  fanRank: {
    color: '#1a1a1a',
    fontSize: 13,
    fontWeight: '900',
    lineHeight: 15,
  },
  fanSuit: {
    color: '#1a1a1a',
    fontSize: 12,
    lineHeight: 14,
    textAlign: 'right',
  },

  // Status
  statusArea: {
    height: 36,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 6,
    paddingHorizontal: 8,
  },
  statusText: {
    fontSize: 12,
    fontWeight: '700',
    textAlign: 'center',
    letterSpacing: 0.3,
  },

  // Hand label row
  handLabelRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    height: 28,
    marginBottom: 8,
  },
  handLabel: {
    color: 'rgba(255,255,255,0.5)',
    fontSize: 10,
    fontWeight: '900',
    letterSpacing: 1.5,
  },
  deckBtn: {
    color: '#f4d03f',
    fontSize: 11,
    fontWeight: '700',
    letterSpacing: 0.5,
  },

  // 2×4 card grid
  handGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
    marginBottom: 12,
  },
  miniCard: {
    backgroundColor: '#fff',
    borderRadius: 8,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 2,
    borderColor: 'transparent',
    shadowColor: '#000',
    shadowOpacity: 0.2,
    shadowRadius: 4,
    shadowOffset: { width: 0, height: 2 },
    elevation: 3,
  },
  miniCardSelected: {
    borderColor: '#f4d03f',
    transform: [{ translateY: -6 }],
    shadowOpacity: 0.45,
    shadowRadius: 8,
    elevation: 8,
  },
  miniRank: {
    color: '#1a1a1a',
    fontSize: 18,
    fontWeight: '900',
    lineHeight: 22,
  },
  miniSuit: {
    color: '#1a1a1a',
    fontSize: 16,
    lineHeight: 20,
  },
  redText: { color: '#c0392b' },

  // Action buttons
  actionRow: {
    flexDirection: 'row',
    gap: 12,
    paddingBottom: 24,
  },
  btn: {
    flex: 1,
    borderRadius: 14,
    paddingVertical: 14,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.15)',
    minHeight: 56,
  },
  btnMeld: {
    backgroundColor: '#40916c',
  },
  btnDiscard: {
    backgroundColor: '#2d6a4f',
    borderColor: '#40916c',
  },
  btnDisabled: {
    opacity: 0.35,
  },
  btnGreen: {
    backgroundColor: '#40916c',
  },
  btnSecondary: {
    backgroundColor: 'transparent',
    borderColor: 'rgba(255,255,255,0.3)',
  },
  btnText: {
    color: '#ffffff',
    fontSize: 13,
    fontWeight: '800',
    letterSpacing: 0.5,
  },
  btnTextSecondary: {
    color: 'rgba(255,255,255,0.75)',
    fontWeight: '600',
  },
  btnSub: {
    color: 'rgba(255,255,255,0.6)',
    fontSize: 10,
    marginTop: 2,
  },

  // Result screens
  heading: {
    color: '#f4d03f',
    fontSize: 26,
    fontWeight: '900',
    letterSpacing: 2,
    marginBottom: 8,
    textAlign: 'center',
  },
  headingGold: { color: '#f4d03f' },
  headingRed:  { color: '#e74c3c' },
  subheading: {
    color: 'rgba(255,255,255,0.75)',
    fontSize: 13,
    fontWeight: '700',
    letterSpacing: 1,
    marginBottom: 6,
    textAlign: 'center',
  },
  panel: {
    backgroundColor: '#1b4332',
    borderRadius: 16,
    padding: 24,
    width: '100%',
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.1)',
    alignItems: 'center',
    marginBottom: 20,
    marginTop: 12,
  },
  panelLabel: {
    color: 'rgba(255,255,255,0.5)',
    fontSize: 11,
    fontWeight: '800',
    letterSpacing: 1.5,
    marginBottom: 6,
    textTransform: 'uppercase',
  },
  goldAmount: {
    color: '#f4d03f',
    fontSize: 36,
    fontWeight: '900',
    marginBottom: 4,
  },
  goldAmountRed: {
    color: '#e74c3c',
  },
  pctLabel: {
    color: 'rgba(255,255,255,0.45)',
    fontSize: 12,
    fontStyle: 'italic',
  },
  buttonRow: {
    flexDirection: 'row',
    gap: 12,
    width: '100%',
  },
  snapTrack: {
    height: 54,
    position: 'relative',
    justifyContent: 'center',
    marginBottom: 8,
  },
  snapLine: {
    height: 2,
    backgroundColor: 'rgba(255,255,255,0.25)',
    marginHorizontal: 10,
  },
  snapNode: {
    position: 'absolute',
    width: 22,
    height: 22,
    borderRadius: 11,
    alignItems: 'center',
    justifyContent: 'center',
    top: 16,
  },
  snapNodeExit: {
    left: 2,
    backgroundColor: '#f4d03f',
  },
  snapNodeMiddle: {
    left: '48%',
    marginLeft: -11,
    backgroundColor: '#1b4332',
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.3)',
  },
  snapNodeStart: {
    right: 2,
    backgroundColor: '#1b4332',
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.3)',
  },
  snapNodeText: {
    color: 'rgba(255,255,255,0.6)',
    fontSize: 7,
    fontWeight: '900',
  },
  snapNodeExitText: {
    color: '#1b4332',
    fontSize: 7,
    fontWeight: '900',
  },
  snapPlayer: {
    position: 'absolute',
    left: '40%',
    top: 2,
    fontSize: 16,
  },
  snapPolice: {
    position: 'absolute',
    left: '58%',
    top: 28,
    fontSize: 16,
  },
  snapHand: {
    flexDirection: 'row',
    justifyContent: 'center',
    gap: 6,
  },
  snapHandCard: {
    backgroundColor: '#ffffff',
    borderRadius: 7,
    paddingHorizontal: 8,
    paddingVertical: 8,
    minWidth: 36,
    alignItems: 'center',
  },
  snapHandRank: {
    color: '#111111',
    fontSize: 11,
    fontWeight: '900',
  },
  tutorialImage: {
    width: '100%',
    height: '100%',
  },
});
