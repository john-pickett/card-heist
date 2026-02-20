import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import {
  Animated,
  Image,
  PanResponder,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';
import { AceModal } from '../components/vault/AceModal';
import { ReckoningHelpModal } from '../components/vault/VaultHelpModal';
import { VaultColumn } from '../components/vault/VaultColumn';
import { useReckoningStore } from '../store/reckoningStore';
import { useCardSound } from '../hooks/useCardSound';
import { ActTutorialOverlay } from '../components/ActTutorialOverlay';

const SUIT_SYMBOL: Record<string, string> = {
  spades: '♠',
  hearts: '♥',
  diamonds: '♦',
  clubs: '♣',
};
const RED_SUITS = new Set(['hearts', 'diamonds']);

type DropRect = { x: number; y: number; width: number; height: number };

function pointInRect(x: number, y: number, r: DropRect): boolean {
  return x >= r.x && x <= r.x + r.width && y >= r.y && y <= r.y + r.height;
}

interface VaultScreenProps {
  onGameEnd: () => void;
  showTutorial: boolean;
  onDismissTutorial: () => void;
}

export function VaultScreen({ onGameEnd, showTutorial, onDismissTutorial }: VaultScreenProps) {
  const [helpVisible, setHelpVisible] = useState(false);
  const { playTap } = useCardSound();
  const phase = useReckoningStore((s) => s.phase);
  const deck = useReckoningStore((s) => s.deck);
  const currentCard = useReckoningStore((s) => s.currentCard);
  const vaults = useReckoningStore((s) => s.vaults);

  const initGame = useReckoningStore((s) => s.initGame);
  const flipCard = useReckoningStore((s) => s.flipCard);
  const assignCard = useReckoningStore((s) => s.assignCard);
  const standVault = useReckoningStore((s) => s.standVault);

  // Running score from vaults already in play
  const runningScore = useMemo(() => {
    return vaults.reduce((total, v) => {
      if (v.isBusted) return total;
      if (v.sum === v.target) return total + v.sum * 2;
      return total + v.sum;
    }, 0);
  }, [vaults]);

  // Auto-draw: when a card has been assigned and we return to dealing, flip next card automatically
  const prevPhaseRef = useRef('idle');
  useEffect(() => {
    const prev = prevPhaseRef.current;
    prevPhaseRef.current = phase;
    if ((prev === 'assigning' || prev === 'ace') && phase === 'dealing' && deck.length > 0) {
      const id = setTimeout(flipCard, 300);
      return () => clearTimeout(id);
    }
  }, [phase]); // eslint-disable-line react-hooks/exhaustive-deps

  // Flip animation
  const flipAnim = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    if (phase === 'assigning' && currentCard !== null) {
      flipAnim.setValue(0);
      Animated.timing(flipAnim, {
        toValue: 1,
        duration: 350,
        useNativeDriver: true,
      }).start();
    } else {
      flipAnim.setValue(0);
    }
  }, [phase, currentCard]);

  const backScaleX = flipAnim.interpolate({
    inputRange: [0, 0.5],
    outputRange: [1, 0],
    extrapolate: 'clamp',
  });

  const frontScaleX = flipAnim.interpolate({
    inputRange: [0.5, 1],
    outputRange: [0, 1],
    extrapolate: 'clamp',
  });

  // Opacity snaps at midpoint so shadows/elevation don't ghost through
  const backOpacity = flipAnim.interpolate({
    inputRange: [0, 0.49, 0.5],
    outputRange: [1, 1, 0],
    extrapolate: 'clamp',
  });

  const frontOpacity = flipAnim.interpolate({
    inputRange: [0.49, 0.5, 1],
    outputRange: [0, 1, 1],
    extrapolate: 'clamp',
  });

  // Drag refs and state
  const screenRef = useRef<View>(null);
  const screenOffsetRef = useRef({ x: 0, y: 0 });
  const dragPan = useRef(new Animated.ValueXY()).current;
  const cardRef = useRef<any>(null);
  const vaultColumnRefs = useRef<(any | null)[]>([null, null, null]);
  const [vaultRects, setVaultRects] = useState<Record<number, DropRect>>({});
  const [isDragging, setIsDragging] = useState(false);
  const [dragOrigin, setDragOrigin] = useState({ x: 0, y: 0 });

  useEffect(() => {
    if (phase === 'idle') {
      initGame();
    }
  }, []);

  useEffect(() => {
    if (phase === 'done') {
      onGameEnd();
    }
  }, [phase]);

  const canFlip = phase === 'dealing' && currentCard === null;
  const hasCard = currentCard !== null && phase === 'assigning';

  const isRed = currentCard ? RED_SUITS.has(currentCard.suit) : false;
  const symbol = currentCard ? (SUIT_SYMBOL[currentCard.suit] ?? '') : '';
  const tutorialParagraph =
    'Flip from the draw pile, then assign each card to one of the three vaults without busting its target. ' +
    'Exact hits pay double and auto-lock that vault, so balance risk across all columns to maximize gold before the deck or vaults run out.';

  const measureVaultRects = useCallback(() => {
    requestAnimationFrame(() => {
      vaultColumnRefs.current.forEach((ref, idx) => {
        ref?.measureInWindow((x: number, y: number, width: number, height: number) => {
          if (width <= 0) return;
          setVaultRects(prev => ({ ...prev, [idx]: { x, y, width, height } }));
        });
      });
    });
  }, []);

  const handleDragEnd = useCallback((dropX: number, dropY: number) => {
    setIsDragging(false);
    dragPan.setValue({ x: 0, y: 0 });
    for (const vault of vaults) {
      const rect = vaultRects[vault.id];
      if (!rect || vault.isBusted || vault.isStood) continue;
      if (pointInRect(dropX, dropY, rect)) {
        assignCard(vault.id);
        playTap();
        return;
      }
    }
  }, [vaultRects, vaults, assignCard, playTap]);

  const handleDragEndRef = useRef(handleDragEnd);
  useEffect(() => { handleDragEndRef.current = handleDragEnd; }, [handleDragEnd]);

  const panResponder = useMemo(() => PanResponder.create({
    onStartShouldSetPanResponder: () => hasCard,
    onStartShouldSetPanResponderCapture: () => hasCard,
    onMoveShouldSetPanResponder: () => hasCard,
    onMoveShouldSetPanResponderCapture: () => hasCard,
    onPanResponderGrant: () => {
      cardRef.current?.measureInWindow((x: number, y: number) => {
        dragPan.setValue({ x: 0, y: 0 });
        const { x: ox, y: oy } = screenOffsetRef.current;
        setDragOrigin({ x: x - ox, y: y - oy });
        setIsDragging(true);
      });
    },
    onPanResponderMove: Animated.event(
      [null, { dx: dragPan.x, dy: dragPan.y }],
      { useNativeDriver: false },
    ),
    onPanResponderRelease: (_: unknown, g: { moveX: number; moveY: number }) => {
      handleDragEndRef.current(g.moveX, g.moveY);
    },
    onPanResponderTerminate: () => {
      setIsDragging(false);
      dragPan.setValue({ x: 0, y: 0 });
    },
    onPanResponderTerminationRequest: () => false,
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }), [hasCard]);

  return (
    <View
      ref={screenRef}
      style={styles.screen}
      onLayout={() => {
        screenRef.current?.measureInWindow((x, y) => {
          screenOffsetRef.current = { x, y };
        });
      }}
    >
      {/* Header */}
      <View style={styles.header}>
        <Text style={styles.title}>CRACK THE VAULTS</Text>
        <View style={styles.drawBadge}>
          <Text style={styles.drawText}>Draw: {deck.length}</Text>
        </View>
        <View style={styles.scoreBadge}>
          <Text style={styles.scoreText}>Gold: {runningScore}</Text>
        </View>
        <TouchableOpacity style={styles.helpBtn} onPress={() => setHelpVisible(true)}>
          <Text style={styles.helpBtnText}>Help</Text>
        </TouchableOpacity>
      </View>

      {/* Vaults */}
      <View style={styles.vaultsRow} onLayout={measureVaultRects}>
        {vaults.map((vault) => {
          const vaultTerminal = vault.isBusted || vault.isStood;
          const isAssignable = hasCard && !vaultTerminal;
          return (
            <VaultColumn
              key={vault.id}
              ref={(node) => { vaultColumnRefs.current[vault.id] = node; }}
              vault={vault}
              isAssignable={isAssignable}
              isDragTarget={isDragging && !vaultTerminal}
              onAssign={() => { assignCard(vault.id); playTap(); }}
              onStand={() => standVault(vault.id)}
            />
          );
        })}
      </View>

      {/* Bottom bar */}
      <View style={styles.bottomBar}>
        <View style={styles.cardSlotArea}>
          <View
            style={styles.cardSlot}
            pointerEvents={hasCard ? 'box-none' : 'none'}
          >
            {/* Back face */}
            <Animated.View
              pointerEvents="none"
              style={[
                styles.cardDisplay,
                styles.cardFaceAbsolute,
                { opacity: backOpacity, transform: [{ scaleX: backScaleX }] },
                deck.length === 0 && !hasCard && { opacity: 0.35 },
              ]}
            >
              <View style={styles.vaultBack}>
                <View style={styles.vaultBackOuter}>
                  <View style={styles.vaultBackInner}>
                    <View style={styles.vaultBackPattern}>
                      {Array.from({ length: 25 }).map((_, i) => {
                        const row = Math.floor(i / 5);
                        const col = i % 5;
                        return (
                          <Text
                            key={i}
                            style={[
                              styles.vaultBackDiamond,
                              { opacity: (row + col) % 2 === 0 ? 0.85 : 0.2 },
                            ]}
                          >
                            ◆
                          </Text>
                        );
                      })}
                    </View>
                  </View>
                </View>
              </View>
            </Animated.View>

            {/* Front face */}
            <Animated.View
              ref={cardRef}
              {...panResponder.panHandlers}
              style={[
                styles.cardDisplay,
                styles.cardFaceAbsolute,
                { opacity: frontOpacity, transform: [{ scaleX: frontScaleX }] },
                isDragging && { opacity: 0 },
              ]}
            >
              {currentCard && (
                <>
                  <Text style={[styles.cardRank, isRed && styles.red]}>
                    {currentCard.rank}
                  </Text>
                  <Text style={[styles.cardSuit, isRed && styles.red]}>{symbol}</Text>
                </>
              )}
            </Animated.View>
          </View>

          <Text style={styles.assignHint}>
            {isDragging
              ? 'Drop on a vault'
              : hasCard
              ? 'Tap a vault — or drag to assign'
              : deck.length === 0
              ? 'Deck empty — stand remaining vaults'
              : 'Tap FLIP CARD to draw'}
          </Text>
        </View>

        <TouchableOpacity
          style={[styles.flipBtn, !canFlip && styles.flipBtnDisabled]}
          onPress={canFlip ? flipCard : undefined}
          activeOpacity={canFlip ? 0.75 : 1}
        >
          <Text style={styles.flipBtnText}>
            {deck.length === 0 ? 'DECK EMPTY' : 'FLIP CARD'}
          </Text>
        </TouchableOpacity>
      </View>

      {/* Ghost card — rendered above everything, pointer-events disabled */}
      {isDragging && currentCard && (
        <Animated.View
          pointerEvents="none"
          style={[
            styles.ghostCard,
            {
              left: dragOrigin.x,
              top: dragOrigin.y,
              width: 72,
              height: 95,
              transform: dragPan.getTranslateTransform(),
            },
          ]}
        >
          <Text style={[styles.cardRank, isRed && styles.red]}>{currentCard.rank}</Text>
          <Text style={[styles.cardSuit, isRed && styles.red]}>{symbol}</Text>
        </Animated.View>
      )}

      <AceModal />
      <ReckoningHelpModal visible={helpVisible} onClose={() => setHelpVisible(false)} />
      {showTutorial && (
        <ActTutorialOverlay
          title="Act 2 Tutorial: Crack the Vaults"
          paragraph={tutorialParagraph}
          onDismiss={onDismissTutorial}
        >
          <Image
            source={require('../../assets/images/vaults.png')}
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
    gap: 10,
  },
  title: {
    color: '#ffffff',
    fontSize: 18,
    fontWeight: '900',
    letterSpacing: 2,
    flex: 1,
  },
  drawBadge: {
    backgroundColor: '#1b4332',
    borderRadius: 8,
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.15)',
  },
  drawText: {
    color: 'rgba(255,255,255,0.7)',
    fontSize: 12,
    fontWeight: '600',
  },
  scoreBadge: {
    backgroundColor: '#40916c',
    borderRadius: 8,
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.2)',
  },
  scoreText: {
    color: '#ffffff',
    fontSize: 12,
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
  vaultsRow: {
    flex: 1,
    flexDirection: 'row',
    paddingHorizontal: 6,
    paddingTop: 4,
    paddingBottom: 4,
  },
  bottomBar: {
    backgroundColor: '#1b4332',
    borderTopWidth: 1,
    borderTopColor: 'rgba(255,255,255,0.1)',
    paddingHorizontal: 16,
    paddingTop: 12,
    paddingBottom: 16,
    alignItems: 'center',
    gap: 10,
  },
  cardSlotArea: {
    alignItems: 'center',
    gap: 6,
  },
  cardSlot: {
    width: 72,
    height: 95,
  },
  cardFaceAbsolute: {
    position: 'absolute',
    top: 0,
    left: 0,
  },
  vaultBack: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: '#9B1C1C',
    borderRadius: 10,
    padding: 5,
  },
  vaultBackOuter: {
    flex: 1,
    borderWidth: 1.5,
    borderColor: 'rgba(255,255,255,0.75)',
    borderRadius: 5,
    padding: 2,
  },
  vaultBackInner: {
    flex: 1,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.4)',
    borderRadius: 4,
    overflow: 'hidden',
  },
  vaultBackPattern: {
    flex: 1,
    flexDirection: 'row',
    flexWrap: 'wrap',
    alignContent: 'center',
    justifyContent: 'center',
    alignItems: 'center',
  },
  vaultBackDiamond: {
    width: '20%',
    textAlign: 'center',
    fontSize: 12,
    color: '#ffffff',
    lineHeight: 16,
  },
  cardDisplay: {
    backgroundColor: '#ffffff',
    borderRadius: 10,
    width: 72,
    height: 95,
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.25,
    shadowRadius: 4,
    elevation: 4,
  },
  cardRank: {
    fontSize: 24,
    fontWeight: '900',
    color: '#111111',
  },
  cardSuit: {
    fontSize: 20,
    color: '#111111',
    marginTop: -2,
  },
  red: {
    color: '#c0392b',
  },
  assignHint: {
    color: 'rgba(255,255,255,0.55)',
    fontSize: 12,
    fontStyle: 'italic',
  },
  flipBtn: {
    backgroundColor: '#40916c',
    borderRadius: 12,
    paddingVertical: 14,
    paddingHorizontal: 40,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.15)',
  },
  flipBtnDisabled: {
    backgroundColor: 'rgba(255,255,255,0.1)',
    borderColor: 'rgba(255,255,255,0.08)',
  },
  flipBtnText: {
    color: '#ffffff',
    fontSize: 16,
    fontWeight: '800',
    letterSpacing: 1,
  },
  ghostCard: {
    position: 'absolute',
    zIndex: 9999,
    elevation: 50,
    backgroundColor: '#ffffff',
    borderRadius: 10,
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.4,
    shadowRadius: 8,
  },
  snapTopRow: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    gap: 10,
    marginBottom: 8,
  },
  snapPile: {
    width: 34,
    height: 46,
    borderRadius: 7,
    backgroundColor: '#9b1c1c',
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.3)',
  },
  snapCard: {
    width: 34,
    height: 46,
    borderRadius: 7,
    backgroundColor: '#ffffff',
    alignItems: 'center',
    justifyContent: 'center',
  },
  snapCardRank: {
    fontSize: 12,
    fontWeight: '900',
    color: '#111111',
  },
  snapCardSuit: {
    fontSize: 10,
    color: '#111111',
    marginTop: -2,
  },
  snapVaultRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    gap: 6,
  },
  snapVault: {
    flex: 1,
    backgroundColor: '#1b4332',
    borderRadius: 8,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.1)',
    alignItems: 'center',
    paddingVertical: 8,
  },
  snapVaultLabel: {
    color: 'rgba(255,255,255,0.45)',
    fontSize: 10,
    fontWeight: '700',
    textTransform: 'uppercase',
  },
  snapVaultTarget: {
    color: '#f4d03f',
    fontSize: 14,
    fontWeight: '900',
  },
  tutorialImage: {
    width: '100%',
    height: '100%',
  },
});
