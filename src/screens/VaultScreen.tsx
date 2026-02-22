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
import { useReckoningStore } from '../store/vaultStore';
import { useInventoryStore } from '../store/inventoryStore';
import { useCardSound } from '../hooks/useCardSound';
import { ActTutorialOverlay } from '../components/ActTutorialOverlay';
import { VaultCard } from '../types/vault';
import theme from '../theme';

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
  const { playTap, playLootGain, playLootLoss } = useCardSound();

  // Store reads
  const phase = useReckoningStore((s) => s.phase);
  const deck = useReckoningStore((s) => s.deck);
  const currentCard = useReckoningStore((s) => s.currentCard);
  const vaults = useReckoningStore((s) => s.vaults);
  const preBuffPhase = useReckoningStore((s) => s.preBuffPhase);

  const initGame = useReckoningStore((s) => s.initGame);
  const flipCard = useReckoningStore((s) => s.flipCard);
  const assignCard = useReckoningStore((s) => s.assignCard);
  const standVault = useReckoningStore((s) => s.standVault);
  const activateInsideSwitch = useReckoningStore((s) => s.activateInsideSwitch);
  const cancelInsideSwitch = useReckoningStore((s) => s.cancelInsideSwitch);
  const completeSwitchMove = useReckoningStore((s) => s.completeSwitchMove);
  const activateBurnEvidence = useReckoningStore((s) => s.activateBurnEvidence);
  const cancelBurnEvidence = useReckoningStore((s) => s.cancelBurnEvidence);
  const burnVaultCard = useReckoningStore((s) => s.burnVaultCard);
  const burnCurrentCard = useReckoningStore((s) => s.burnCurrentCard);

  // Inventory
  const inventoryItems = useInventoryStore((s) => s.items);
  const removeItem = useInventoryStore((s) => s.removeItem);
  const hasInsideSwitch = inventoryItems.some(
    (e) => e.itemId === 'inside-switch' && e.quantity > 0,
  );
  const hasBurnEvidence = inventoryItems.some(
    (e) => e.itemId === 'burn-evidence' && e.quantity > 0,
  );

  // Running score from vaults already in play
  const runningScore = useMemo(() => {
    return vaults.reduce((total, v) => {
      if (v.isBusted) return total;
      if (v.sum === v.target) return total + v.sum * 2;
      return total + v.sum;
    }, 0);
  }, [vaults]);

  // Auto-draw: when returning to dealing after assigning/ace/buff phases
  const prevPhaseRef = useRef('idle');
  useEffect(() => {
    const prev = prevPhaseRef.current;
    prevPhaseRef.current = phase;
    const fromBuffPhase = prev === 'switch' || prev === 'burn';
    if (
      (prev === 'assigning' || prev === 'ace' || fromBuffPhase) &&
      phase === 'dealing' &&
      deck.length > 0
    ) {
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
    } else if ((phase === 'switch' || phase === 'burn') && currentCard !== null) {
      // Card was in-hand when buff was activated — keep it visible
      flipAnim.setValue(1);
    } else {
      flipAnim.setValue(0);
    }
  }, [phase, currentCard]); // eslint-disable-line react-hooks/exhaustive-deps

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

  // Drag refs and state (for assigning current card)
  const screenRef = useRef<View>(null);
  const screenOffsetRef = useRef({ x: 0, y: 0 });
  const dragPan = useRef(new Animated.ValueXY()).current;
  const cardRef = useRef<any>(null);
  const vaultColumnRefs = useRef<(any | null)[]>([null, null, null]);
  const [vaultRects, setVaultRects] = useState<Record<number, DropRect>>({});
  const [isDragging, setIsDragging] = useState(false);
  const [dragOrigin, setDragOrigin] = useState({ x: 0, y: 0 });

  // Switch drag state
  const switchPan = useRef(new Animated.ValueXY()).current;
  const [isSwitchDragging, setIsSwitchDragging] = useState(false);
  const [switchDragOrigin, setSwitchDragOrigin] = useState({ x: 0, y: 0 });
  const [switchDragCard, setSwitchDragCard] = useState<VaultCard | null>(null);
  const switchFromVaultIdRef = useRef<0 | 1 | 2 | null>(null);
  const switchDragInstanceIdRef = useRef<string | null>(null);

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

  const prevVaultsRef = useRef(vaults);
  useEffect(() => {
    const prevVaults = prevVaultsRef.current;
    if (prevVaults !== vaults) {
      for (const vault of vaults) {
        const prev = prevVaults.find((v) => v.id === vault.id);
        if (!prev) continue;

        const bustedNow = !prev.isBusted && vault.isBusted;
        if (bustedNow) {
          playLootLoss();
          continue;
        }

        const hitExactNow = prev.sum !== prev.target && vault.sum === vault.target;
        const stoodNow = !prev.isStood && vault.isStood;
        if (hitExactNow || stoodNow) {
          playLootGain();
        }
      }
    }
    prevVaultsRef.current = vaults;
  }, [vaults, playLootGain, playLootLoss]);

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
          setVaultRects((prev) => ({ ...prev, [idx]: { x, y, width, height } }));
        });
      });
    });
  }, []);

  const handleDragEnd = useCallback(
    (dropX: number, dropY: number) => {
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
    },
    [vaultRects, vaults, assignCard, playTap], // eslint-disable-line react-hooks/exhaustive-deps
  );

  const handleDragEndRef = useRef(handleDragEnd);
  useEffect(() => {
    handleDragEndRef.current = handleDragEnd;
  }, [handleDragEnd]);

  const panResponder = useMemo(
    () =>
      PanResponder.create({
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
        onPanResponderMove: Animated.event([null, { dx: dragPan.x, dy: dragPan.y }], {
          useNativeDriver: false,
        }),
        onPanResponderRelease: (_: unknown, g: { moveX: number; moveY: number }) => {
          handleDragEndRef.current(g.moveX, g.moveY);
        },
        onPanResponderTerminate: () => {
          setIsDragging(false);
          dragPan.setValue({ x: 0, y: 0 });
        },
        onPanResponderTerminationRequest: () => false,
      }),
    [hasCard], // eslint-disable-line react-hooks/exhaustive-deps
  );

  // ── Switch drag callbacks ──────────────────────────────────────────────────

  const onSwitchCardDragStart = useCallback(
    (vaultId: 0 | 1 | 2, instanceId: string, pageX: number, pageY: number, card: VaultCard) => {
      switchFromVaultIdRef.current = vaultId;
      switchDragInstanceIdRef.current = instanceId;
      switchPan.setValue({ x: 0, y: 0 });
      const { x: ox, y: oy } = screenOffsetRef.current;
      setSwitchDragOrigin({ x: pageX - ox, y: pageY - oy });
      setSwitchDragCard(card);
      setIsSwitchDragging(true);
    },
    [], // eslint-disable-line react-hooks/exhaustive-deps
  );

  const onSwitchCardDragMove = useCallback(
    (dx: number, dy: number) => {
      switchPan.setValue({ x: dx, y: dy });
    },
    [], // eslint-disable-line react-hooks/exhaustive-deps
  );

  const handleSwitchDragEnd = useCallback(
    (finalX: number, finalY: number) => {
      const fromVaultId = switchFromVaultIdRef.current;
      const instanceId = switchDragInstanceIdRef.current;

      setIsSwitchDragging(false);
      switchPan.setValue({ x: 0, y: 0 });
      setSwitchDragCard(null);
      switchFromVaultIdRef.current = null;
      switchDragInstanceIdRef.current = null;

      if (fromVaultId === null || !instanceId) return;

      for (const vault of vaults) {
        if (vault.id === fromVaultId) continue;
        if (vault.isBusted || vault.isStood) continue;
        const rect = vaultRects[vault.id];
        if (!rect) continue;
        if (pointInRect(finalX, finalY, rect)) {
          completeSwitchMove(fromVaultId, instanceId, vault.id as 0 | 1 | 2);
          removeItem('inside-switch');
          return;
        }
      }
      // No valid target — player can try again (phase stays 'switch')
    },
    [vaults, vaultRects, completeSwitchMove, removeItem],
  );

  const handleSwitchDragEndRef = useRef(handleSwitchDragEnd);
  useEffect(() => {
    handleSwitchDragEndRef.current = handleSwitchDragEnd;
  }, [handleSwitchDragEnd]);

  const onSwitchCardDragEnd = useCallback((finalX: number, finalY: number) => {
    handleSwitchDragEndRef.current(finalX, finalY);
  }, []);

  // ── Derived state ─────────────────────────────────────────────────────────

  const showToolbar =
    hasInsideSwitch || hasBurnEvidence || phase === 'switch' || phase === 'burn';
  const inBuffMode = phase === 'switch' || phase === 'burn';

  const switchIsRed = switchDragCard ? RED_SUITS.has(switchDragCard.card.suit) : false;
  const switchSymbol = switchDragCard ? (SUIT_SYMBOL[switchDragCard.card.suit] ?? '') : '';

  // Show current card during buff phases if it was active during activation
  const showCurrentCard =
    (phase === 'assigning' ||
      ((phase === 'switch' || phase === 'burn') && currentCard !== null)) &&
    currentCard !== null;

  const canBurnCurrentCard = phase === 'burn' && currentCard !== null;

  const assignHint = inBuffMode
    ? phase === 'burn'
      ? 'Tap 🔥 on a card to destroy it'
      : 'Drag a card to a different vault'
    : isDragging
    ? 'Drop on a vault'
    : hasCard
    ? 'Tap a vault — or drag to assign'
    : deck.length === 0
    ? 'Deck empty — stand remaining vaults'
    : 'Tap FLIP CARD to draw';

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

      {/* Buff toolbar */}
      {showToolbar && (
        <View style={styles.toolbar}>
          {inBuffMode ? (
            <TouchableOpacity
              style={styles.toolbarCancelBtn}
              onPress={phase === 'switch' ? cancelInsideSwitch : cancelBurnEvidence}
            >
              <Text style={styles.toolbarCancelText}>✕ Cancel</Text>
            </TouchableOpacity>
          ) : (
            <>
              {hasInsideSwitch && (
                <TouchableOpacity
                  style={[
                    styles.toolbarBtn,
                    !(phase === 'dealing' || phase === 'assigning') && styles.toolbarBtnDisabled,
                  ]}
                  onPress={
                    phase === 'dealing' || phase === 'assigning'
                      ? activateInsideSwitch
                      : undefined
                  }
                  activeOpacity={phase === 'dealing' || phase === 'assigning' ? 0.75 : 1}
                >
                  <Text style={styles.toolbarBtnText}>🧰 Switch</Text>
                </TouchableOpacity>
              )}
              {hasBurnEvidence && (
                <TouchableOpacity
                  style={[
                    styles.toolbarBtn,
                    !(phase === 'dealing' || phase === 'assigning') && styles.toolbarBtnDisabled,
                  ]}
                  onPress={
                    phase === 'dealing' || phase === 'assigning'
                      ? activateBurnEvidence
                      : undefined
                  }
                  activeOpacity={phase === 'dealing' || phase === 'assigning' ? 0.75 : 1}
                >
                  <Text style={styles.toolbarBtnText}>🔥 Burn</Text>
                </TouchableOpacity>
              )}
            </>
          )}
        </View>
      )}

      {/* Vaults */}
      <View style={styles.vaultsRow} onLayout={measureVaultRects}>
        {vaults.map((vault) => {
          const vaultTerminal = vault.isBusted || vault.isStood;
          const isAssignable = hasCard && !vaultTerminal && !inBuffMode;
          return (
            <VaultColumn
              key={vault.id}
              ref={(node) => {
                vaultColumnRefs.current[vault.id] = node;
              }}
              vault={vault}
              isAssignable={isAssignable}
              isDragTarget={isDragging && !vaultTerminal && !inBuffMode}
              onAssign={() => {
                assignCard(vault.id);
                playTap();
              }}
              onStand={() => standVault(vault.id)}
              isSwitchMode={phase === 'switch'}
              isBurnMode={phase === 'burn'}
              onBurnCard={(vid, instanceId) => {
                burnVaultCard(vid, instanceId);
                removeItem('burn-evidence');
              }}
              onSwitchCardDragStart={onSwitchCardDragStart}
              onSwitchCardDragMove={onSwitchCardDragMove}
              onSwitchCardDragEnd={onSwitchCardDragEnd}
            />
          );
        })}
      </View>

      {/* Bottom bar */}
      <View style={styles.bottomBar}>
        <View style={styles.cardSlotArea}>
          <View
            style={styles.cardSlot}
            pointerEvents={hasCard || canBurnCurrentCard ? 'box-none' : 'none'}
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
              {showCurrentCard && currentCard && (
                <>
                  <Text style={[styles.cardRank, isRed && styles.red]}>
                    {currentCard.rank}
                  </Text>
                  <Text style={[styles.cardSuit, isRed && styles.red]}>{symbol}</Text>
                </>
              )}
            </Animated.View>

            {/* Burn overlay on current card */}
            {canBurnCurrentCard && (
              <TouchableOpacity
                style={[styles.cardFaceAbsolute, styles.burnCardOverlay]}
                onPress={() => {
                  burnCurrentCard();
                  removeItem('burn-evidence');
                }}
                activeOpacity={0.75}
              >
                <Text style={styles.burnCardBadge}>🔥</Text>
              </TouchableOpacity>
            )}
          </View>

          <Text style={styles.assignHint}>{assignHint}</Text>
        </View>

        <TouchableOpacity
          style={[styles.flipBtn, (!canFlip || inBuffMode) && styles.flipBtnDisabled]}
          onPress={canFlip && !inBuffMode ? flipCard : undefined}
          activeOpacity={canFlip && !inBuffMode ? 0.75 : 1}
        >
          <Text style={styles.flipBtnText}>
            {deck.length === 0 ? 'DECK EMPTY' : 'FLIP CARD'}
          </Text>
        </TouchableOpacity>
      </View>

      {/* Ghost card for current card drag */}
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

      {/* Ghost card for switch drag */}
      {isSwitchDragging && switchDragCard && (
        <Animated.View
          pointerEvents="none"
          style={[
            styles.ghostCard,
            {
              left: switchDragOrigin.x,
              top: switchDragOrigin.y,
              width: 72,
              height: 95,
              transform: switchPan.getTranslateTransform(),
            },
          ]}
        >
          <Text style={[styles.cardRank, switchIsRed && styles.red]}>
            {switchDragCard.card.rank}
          </Text>
          <Text style={[styles.cardSuit, switchIsRed && styles.red]}>{switchSymbol}</Text>
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
    backgroundColor: theme.colors.bgPrimary,
    overflow: 'visible',
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: theme.spacing.md,
    paddingTop: theme.spacing.ten,
    paddingBottom: theme.spacing.sm,
    gap: theme.spacing.ten,
  },
  title: {
    color: theme.colors.textPrimary,
    fontSize: theme.fontSizes.lg,
    fontWeight: theme.fontWeights.black,
    letterSpacing: 2,
    flex: 1,
  },
  drawBadge: {
    backgroundColor: theme.colors.bgPanel,
    borderRadius: theme.radii.r8,
    paddingHorizontal: theme.spacing.sm,
    paddingVertical: theme.spacing.three,
    borderWidth: theme.borderWidths.thin,
    borderColor: theme.colors.borderMedium,
  },
  drawText: {
    color: theme.colors.text70,
    fontSize: theme.fontSizes.s,
    fontWeight: theme.fontWeights.medium,
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
  toolbar: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: theme.spacing.md,
    paddingBottom: theme.spacing.xs,
    gap: theme.spacing.sm,
  },
  toolbarBtn: {
    backgroundColor: theme.colors.bgPanel,
    borderRadius: theme.radii.r8,
    paddingHorizontal: theme.spacing.md,
    paddingVertical: theme.spacing.xs,
    borderWidth: theme.borderWidths.thin,
    borderColor: theme.colors.borderMedium,
  },
  toolbarBtnDisabled: {
    opacity: 0.4,
  },
  toolbarBtnText: {
    color: theme.colors.textPrimary,
    fontSize: theme.fontSizes.s,
    fontWeight: theme.fontWeights.bold,
  },
  toolbarCancelBtn: {
    backgroundColor: theme.colors.bgPanel,
    borderRadius: theme.radii.r8,
    paddingHorizontal: theme.spacing.md,
    paddingVertical: theme.spacing.xs,
    borderWidth: theme.borderWidths.thin,
    borderColor: theme.colors.errorRed,
  },
  toolbarCancelText: {
    color: theme.colors.errorRed,
    fontSize: theme.fontSizes.s,
    fontWeight: theme.fontWeights.bold,
  },
  vaultsRow: {
    flex: 1,
    flexDirection: 'row',
    paddingHorizontal: theme.spacing.six,
    paddingTop: theme.spacing.xs,
    paddingBottom: theme.spacing.xs,
  },
  bottomBar: {
    backgroundColor: theme.colors.bgPanel,
    borderTopWidth: 1,
    borderTopColor: theme.colors.borderFaint,
    paddingHorizontal: theme.spacing.lg,
    paddingTop: theme.spacing.md,
    paddingBottom: theme.spacing.lg,
    alignItems: 'center',
    gap: theme.spacing.ten,
  },
  cardSlotArea: {
    alignItems: 'center',
    gap: theme.spacing.six,
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
    backgroundColor: theme.colors.cardBack,
    borderRadius: theme.radii.md,
    padding: theme.spacing.five,
  },
  vaultBackOuter: {
    flex: 1,
    borderWidth: theme.borderWidths.medium,
    borderColor: theme.colors.text75,
    borderRadius: theme.radii.r5,
    padding: theme.spacing.two,
  },
  vaultBackInner: {
    flex: 1,
    borderWidth: theme.borderWidths.thin,
    borderColor: theme.colors.text40,
    borderRadius: theme.radii.xs,
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
    fontSize: theme.fontSizes.s,
    color: theme.colors.textPrimary,
    lineHeight: 16,
  },
  cardDisplay: {
    backgroundColor: theme.colors.cardFace,
    borderRadius: theme.radii.md,
    width: 72,
    height: 95,
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: theme.colors.shadow,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.25,
    shadowRadius: 4,
    elevation: 4,
  },
  cardRank: {
    fontSize: theme.fontSizes.xxl2,
    fontWeight: theme.fontWeights.black,
    color: theme.colors.cardText,
  },
  cardSuit: {
    fontSize: theme.fontSizes.title,
    color: theme.colors.cardText,
    marginTop: -2,
  },
  red: {
    color: theme.colors.red,
  },
  assignHint: {
    color: theme.colors.textSoft,
    fontSize: theme.fontSizes.s,
    fontStyle: 'italic',
  },
  burnCardOverlay: {
    width: 72,
    height: 95,
    borderRadius: theme.radii.md,
    backgroundColor: 'rgba(230, 126, 34, 0.35)',
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 2,
    borderColor: theme.colors.orange,
  },
  burnCardBadge: {
    fontSize: 28,
  },
  flipBtn: {
    backgroundColor: theme.colors.greenPrimary,
    borderRadius: theme.radii.r12,
    paddingVertical: theme.spacing.fourteen,
    paddingHorizontal: theme.spacing.forty,
    alignItems: 'center',
    borderWidth: theme.borderWidths.thin,
    borderColor: theme.colors.borderMedium,
  },
  flipBtnDisabled: {
    backgroundColor: theme.colors.borderFaint,
    borderColor: theme.colors.borderSubtle,
  },
  flipBtnText: {
    color: theme.colors.textPrimary,
    fontSize: theme.fontSizes.subtitle,
    fontWeight: theme.fontWeights.heavy,
    letterSpacing: 1,
  },
  ghostCard: {
    position: 'absolute',
    zIndex: 9999,
    elevation: 50,
    backgroundColor: theme.colors.cardFace,
    borderRadius: theme.radii.md,
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: theme.colors.shadow,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.4,
    shadowRadius: 8,
  },
  snapTopRow: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    gap: theme.spacing.ten,
    marginBottom: theme.spacing.sm,
  },
  snapPile: {
    width: 34,
    height: 46,
    borderRadius: theme.radii.sm,
    backgroundColor: theme.colors.cardBack,
    borderWidth: theme.borderWidths.thin,
    borderColor: theme.colors.borderBright,
  },
  snapCard: {
    width: 34,
    height: 46,
    borderRadius: theme.radii.sm,
    backgroundColor: theme.colors.cardFace,
    alignItems: 'center',
    justifyContent: 'center',
  },
  snapCardRank: {
    fontSize: theme.fontSizes.s,
    fontWeight: theme.fontWeights.black,
    color: theme.colors.cardText,
  },
  snapCardSuit: {
    fontSize: theme.fontSizes.caption,
    color: theme.colors.cardText,
    marginTop: -2,
  },
  snapVaultRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    gap: theme.spacing.six,
  },
  snapVault: {
    flex: 1,
    backgroundColor: theme.colors.bgPanel,
    borderRadius: theme.radii.r8,
    borderWidth: theme.borderWidths.thin,
    borderColor: theme.colors.borderFaint,
    alignItems: 'center',
    paddingVertical: theme.spacing.sm,
  },
  snapVaultLabel: {
    color: theme.colors.textDim,
    fontSize: theme.fontSizes.caption,
    fontWeight: theme.fontWeights.bold,
    textTransform: 'uppercase',
  },
  snapVaultTarget: {
    color: theme.colors.gold,
    fontSize: theme.fontSizes.m,
    fontWeight: theme.fontWeights.black,
  },
  tutorialImage: {
    width: '100%',
    height: '100%',
  },
});
