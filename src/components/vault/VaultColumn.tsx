import React, { useEffect, useMemo, useRef } from 'react';
import {
  PanResponder,
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';
import { Vault, VaultCard } from '../../types/vault';
import theme from '../../theme';

const SUIT_SYMBOL: Record<string, string> = {
  spades: '♠',
  hearts: '♥',
  diamonds: '♦',
  clubs: '♣',
};
const RED_SUITS = new Set(['hearts', 'diamonds']);

// ---------------------------------------------------------------------------
// SwitchCardTile — per-card tile with PanResponder for switch drag mode
// ---------------------------------------------------------------------------

interface SwitchCardTileProps {
  vc: VaultCard;
  vaultId: 0 | 1 | 2;
  vaultIsStood: boolean;
  onSwitchCardDragStart?: (
    vaultId: 0 | 1 | 2,
    instanceId: string,
    pageX: number,
    pageY: number,
    card: VaultCard,
  ) => void;
  onSwitchCardDragMove?: (dx: number, dy: number) => void;
  onSwitchCardDragEnd?: (finalX: number, finalY: number) => void;
}

function SwitchCardTile({
  vc,
  vaultId,
  vaultIsStood,
  onSwitchCardDragStart,
  onSwitchCardDragMove,
  onSwitchCardDragEnd,
}: SwitchCardTileProps) {
  const tileRef = useRef<View>(null);

  const dragStartRef = useRef(onSwitchCardDragStart);
  const dragMoveRef = useRef(onSwitchCardDragMove);
  const dragEndRef = useRef(onSwitchCardDragEnd);

  useEffect(() => { dragStartRef.current = onSwitchCardDragStart; }, [onSwitchCardDragStart]);
  useEffect(() => { dragMoveRef.current = onSwitchCardDragMove; }, [onSwitchCardDragMove]);
  useEffect(() => { dragEndRef.current = onSwitchCardDragEnd; }, [onSwitchCardDragEnd]);

  const panResponder = useMemo(() => PanResponder.create({
    onStartShouldSetPanResponder: () => !vaultIsStood,
    onMoveShouldSetPanResponder: () => !vaultIsStood,
    onPanResponderGrant: () => {
      tileRef.current?.measureInWindow((x, y) => {
        dragStartRef.current?.(vaultId, vc.instanceId, x, y, vc);
      });
    },
    onPanResponderMove: (_, gs) => {
      dragMoveRef.current?.(gs.dx, gs.dy);
    },
    onPanResponderRelease: (_, gs) => {
      dragEndRef.current?.(gs.moveX, gs.moveY);
    },
    onPanResponderTerminate: (_, gs) => {
      dragEndRef.current?.(gs.moveX ?? 0, gs.moveY ?? 0);
    },
    onPanResponderTerminationRequest: () => false,
  }), [vaultId, vc.instanceId, vaultIsStood]); // eslint-disable-line react-hooks/exhaustive-deps

  const isRed = RED_SUITS.has(vc.card.suit);
  const symbol = SUIT_SYMBOL[vc.card.suit] ?? '';
  const displayRank =
    vc.card.rank === 'A' && vc.aceValue != null ? `A(${vc.aceValue})` : vc.card.rank;

  return (
    <View
      ref={tileRef}
      style={[styles.cardTile, vaultIsStood && styles.cardTileDimmed]}
      {...(vaultIsStood ? {} : panResponder.panHandlers)}
    >
      <Text style={[styles.cardRank, isRed && styles.red]}>{displayRank}</Text>
      <Text style={[styles.cardSuit, isRed && styles.red]}>{symbol}</Text>
      {vaultIsStood ? (
        <Text style={styles.lockBadge}>🔒</Text>
      ) : (
        <Text style={styles.dragHandle}>⠿</Text>
      )}
    </View>
  );
}

// ---------------------------------------------------------------------------
// VaultColumn
// ---------------------------------------------------------------------------

interface VaultColumnProps {
  vault: Vault;
  isAssignable: boolean;
  isDragTarget: boolean;
  onAssign: () => void;
  onStand: () => void;
  isSwitchMode?: boolean;
  isBurnMode?: boolean;
  onBurnCard?: (vaultId: 0 | 1 | 2, instanceId: string) => void;
  onSwitchCardDragStart?: (
    vaultId: 0 | 1 | 2,
    instanceId: string,
    pageX: number,
    pageY: number,
    card: VaultCard,
  ) => void;
  onSwitchCardDragMove?: (dx: number, dy: number) => void;
  onSwitchCardDragEnd?: (finalX: number, finalY: number) => void;
}

export const VaultColumn = React.forwardRef<View, VaultColumnProps>(
  (
    {
      vault,
      isAssignable,
      isDragTarget,
      onAssign,
      onStand,
      isSwitchMode,
      isBurnMode,
      onBurnCard,
      onSwitchCardDragStart,
      onSwitchCardDragMove,
      onSwitchCardDragEnd,
    },
    ref,
  ) => {
    const isTerminal = vault.isBusted || vault.isStood;
    const isExact = !vault.isBusted && vault.sum === vault.target;

    const sumColor = vault.isBusted
      ? theme.colors.errorRed
      : isExact
      ? theme.colors.gold
      : vault.sum >= vault.target - 2
      ? theme.colors.orange
      : theme.colors.textPrimary;

    const buffModeActive = isSwitchMode || isBurnMode;

    return (
      <TouchableOpacity
        ref={ref as any}
        style={[
          styles.column,
          isAssignable && styles.columnAssignable,
          isDragTarget && styles.columnDragTarget,
          isExact && styles.columnExact,
          isTerminal && !isExact && styles.columnTerminal,
          isBurnMode && styles.columnBurnMode,
          isSwitchMode && !vault.isStood && !vault.isBusted && styles.columnSwitchMode,
        ]}
        onPress={isAssignable ? onAssign : undefined}
        activeOpacity={isAssignable ? 0.75 : 1}
      >
        {/* Header */}
        <View style={styles.header}>
          <Text style={styles.vaultLabel}>Vault {vault.id + 1}</Text>
          <View style={styles.targetBadge}>
            <Text style={styles.targetText}>{vault.target}</Text>
          </View>
        </View>

        {/* Sum badge */}
        <View style={styles.sumRow}>
          <Text style={[styles.sumText, { color: sumColor }]}>{vault.sum}</Text>
          {isExact && <Text style={styles.exactBadge}>×2</Text>}
        </View>

        {/* Cards */}
        <ScrollView
          style={styles.cardsScroll}
          showsVerticalScrollIndicator={false}
          scrollEnabled={!buffModeActive}
        >
          {vault.cards.map((vc) => {
            const isRed = RED_SUITS.has(vc.card.suit);
            const symbol = SUIT_SYMBOL[vc.card.suit] ?? '';
            const displayRank =
              vc.card.rank === 'A' && vc.aceValue != null
                ? `A(${vc.aceValue})`
                : vc.card.rank;

            if (isBurnMode) {
              return (
                <TouchableOpacity
                  key={vc.instanceId}
                  style={styles.cardTile}
                  onPress={() => onBurnCard?.(vault.id, vc.instanceId)}
                  activeOpacity={0.7}
                >
                  <Text style={[styles.cardRank, isRed && styles.red]}>{displayRank}</Text>
                  <Text style={[styles.cardSuit, isRed && styles.red]}>{symbol}</Text>
                  <View style={styles.burnBadge}>
                    <Text style={styles.burnBadgeText}>🔥</Text>
                  </View>
                </TouchableOpacity>
              );
            }

            if (isSwitchMode) {
              return (
                <SwitchCardTile
                  key={vc.instanceId}
                  vc={vc}
                  vaultId={vault.id}
                  vaultIsStood={vault.isStood}
                  onSwitchCardDragStart={onSwitchCardDragStart}
                  onSwitchCardDragMove={onSwitchCardDragMove}
                  onSwitchCardDragEnd={onSwitchCardDragEnd}
                />
              );
            }

            return (
              <View key={vc.instanceId} style={styles.cardTile}>
                <Text style={[styles.cardRank, isRed && styles.red]}>{displayRank}</Text>
                <Text style={[styles.cardSuit, isRed && styles.red]}>{symbol}</Text>
              </View>
            );
          })}
        </ScrollView>

        {/* Stand button */}
        {!isTerminal && !buffModeActive && (
          <TouchableOpacity
            style={styles.standBtn}
            onPress={onStand}
            hitSlop={4}
          >
            <Text style={styles.standBtnText}>STAND</Text>
          </TouchableOpacity>
        )}

        {/* Terminal overlays */}
        {vault.isBusted && (
          <View style={[styles.overlay, styles.bustedOverlay]}>
            <Text style={styles.overlayText}>BUST</Text>
          </View>
        )}
        {vault.isStood && !vault.isBusted && isExact && (
          <View style={[styles.overlay, styles.exactOverlay]}>
            <Text style={styles.exactOverlayLabel}>EXACT ×2</Text>
            <Text style={styles.exactOverlayScore}>{vault.sum * 2}</Text>
          </View>
        )}
        {vault.isStood && !vault.isBusted && !isExact && (
          <View style={[styles.overlay, styles.stoodOverlay]}>
            <Text style={styles.overlayText}>STOOD</Text>
          </View>
        )}
      </TouchableOpacity>
    );
  },
);

const styles = StyleSheet.create({
  column: {
    flex: 1,
    backgroundColor: theme.colors.bgPanel,
    borderRadius: theme.radii.md,
    marginHorizontal: 3,
    padding: theme.spacing.sm,
    borderWidth: 2,
    borderColor: theme.colors.borderFaint,
    overflow: 'hidden',
  },
  columnAssignable: {
    borderColor: theme.colors.greenPrimary,
    borderWidth: 2,
    shadowColor: '#40916c',
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0.6,
    shadowRadius: 6,
    elevation: 4,
  },
  columnDragTarget: {
    borderColor: theme.colors.textMuted,
    borderWidth: 2.5,
  },
  columnExact: {
    borderColor: theme.colors.gold,
    borderWidth: 2,
    shadowColor: '#f4d03f',
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0.5,
    shadowRadius: 6,
    elevation: 4,
  },
  columnTerminal: {
    opacity: 0.72,
  },
  columnBurnMode: {
    borderColor: theme.colors.orange,
    borderWidth: 2,
  },
  columnSwitchMode: {
    borderColor: theme.colors.gold,
    borderWidth: 2,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: theme.spacing.xs,
  },
  vaultLabel: {
    color: 'rgba(255,255,255,0.7)',
    fontSize: theme.fontSizes.sm,
    fontWeight: theme.fontWeights.bold,
    letterSpacing: 0.5,
  },
  targetBadge: {
    backgroundColor: theme.colors.bgPrimary,
    borderRadius: 6,
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderWidth: 1,
    borderColor: theme.colors.textDisabled,
  },
  targetText: {
    color: theme.colors.textPrimary,
    fontSize: theme.fontSizes.md,
    fontWeight: theme.fontWeights.heavy,
  },
  sumRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: theme.spacing.xs,
    marginBottom: 6,
  },
  sumText: {
    fontSize: theme.fontSizes.xl,
    fontWeight: theme.fontWeights.black,
    fontVariant: ['tabular-nums'],
  },
  exactBadge: {
    color: theme.colors.gold,
    fontSize: theme.fontSizes.md,
    fontWeight: theme.fontWeights.heavy,
  },
  cardsScroll: {
    flex: 1,
    marginBottom: theme.spacing.xs,
  },
  cardTile: {
    backgroundColor: theme.colors.cardFace,
    borderRadius: 6,
    marginBottom: theme.spacing.xs,
    paddingHorizontal: theme.spacing.sm,
    paddingVertical: 5,
    flexDirection: 'row',
    alignItems: 'center',
    gap: theme.spacing.xs,
  },
  cardTileDimmed: {
    opacity: 0.5,
  },
  cardRank: {
    fontSize: theme.fontSizes.md,
    fontWeight: theme.fontWeights.heavy,
    color: theme.colors.cardText,
  },
  cardSuit: {
    fontSize: theme.fontSizes.md,
    color: theme.colors.cardText,
  },
  red: {
    color: theme.colors.red,
  },
  burnBadge: {
    marginLeft: 'auto',
  },
  burnBadgeText: {
    fontSize: theme.fontSizes.sm,
  },
  dragHandle: {
    marginLeft: 'auto',
    color: theme.colors.textMuted,
    fontSize: theme.fontSizes.md,
  },
  lockBadge: {
    marginLeft: 'auto',
    fontSize: theme.fontSizes.sm,
  },
  standBtn: {
    backgroundColor: theme.colors.bgPrimary,
    borderRadius: 6,
    paddingVertical: 6,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: theme.colors.borderStrong,
    marginTop: 2,
  },
  standBtnText: {
    color: theme.colors.textPrimary,
    fontSize: theme.fontSizes.sm,
    fontWeight: theme.fontWeights.heavy,
    letterSpacing: 0.5,
  },
  overlay: {
    ...StyleSheet.absoluteFillObject,
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: theme.radii.md,
  },
  bustedOverlay: {
    backgroundColor: 'rgba(231, 76, 60, 0.45)',
  },
  stoodOverlay: {
    backgroundColor: 'rgba(0,0,0,0.35)',
  },
  exactOverlay: {
    backgroundColor: 'rgba(244, 208, 63, 0.22)',
  },
  overlayText: {
    color: theme.colors.textPrimary,
    fontSize: theme.fontSizes.lg,
    fontWeight: theme.fontWeights.black,
    letterSpacing: 2,
    textShadowColor: 'rgba(0,0,0,0.5)',
    textShadowOffset: { width: 0, height: 1 },
    textShadowRadius: 3,
  },
  exactOverlayLabel: {
    color: theme.colors.gold,
    fontSize: theme.fontSizes.md,
    fontWeight: theme.fontWeights.black,
    letterSpacing: 1.5,
    textShadowColor: 'rgba(0,0,0,0.4)',
    textShadowOffset: { width: 0, height: 1 },
    textShadowRadius: 2,
  },
  exactOverlayScore: {
    color: theme.colors.gold,
    fontSize: 38,
    fontWeight: theme.fontWeights.black,
    fontVariant: ['tabular-nums'],
    textShadowColor: 'rgba(0,0,0,0.4)',
    textShadowOffset: { width: 0, height: 1 },
    textShadowRadius: 2,
    marginTop: 2,
  },
});
