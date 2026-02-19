import React from 'react';
import { ScrollView, StyleSheet, Text, View } from 'react-native';
import { GameCard, GameColumn as GameColumnType } from '../types/game';
import { CARD_HEIGHT, CARD_WIDTH, MiniCard } from './MiniCard';

const CASCADE_OFFSET = 42;

interface GameColumnProps {
  column: GameColumnType;
  selectedInstanceIds: string[];
  phase: string;
  isActiveColumn: boolean;
  onCardPress: (gc: GameCard) => void;
}

export function GameColumn({
  column,
  selectedInstanceIds,
  phase,
  isActiveColumn,
  onCardPress,
}: GameColumnProps) {
  const isHotfixPhase = phase === 'hotfix';
  // In hotfix mode, any non-cleared column is a valid target
  const isHotfixTarget = isHotfixPhase && !column.cleared;

  const stackHeight =
    column.cards.length === 0
      ? CARD_HEIGHT
      : CASCADE_OFFSET * (column.cards.length - 1) + CARD_HEIGHT;

  return (
    <View style={styles.wrapper}>
      {/* Header */}
      <View style={styles.header}>
        <Text style={styles.columnId}>{column.id}</Text>
        <View style={styles.budgetBadge}>
          <Text style={styles.budgetText}>target {column.budget}</Text>
        </View>
      </View>

      {/* Card cascade */}
      <ScrollView
        style={styles.scroll}
        contentContainerStyle={{ minHeight: stackHeight + 16 }}
        showsVerticalScrollIndicator={false}
      >
        <View style={[styles.cardStack, { height: stackHeight }]}>
          {column.cards.map((gc, index) => {
            const isSelected = selectedInstanceIds.includes(gc.instanceId);
            // In hotfix mode, dim cleared columns (non-targets)
            const dimmed = isHotfixPhase && !isHotfixTarget;

            return (
              <View
                key={gc.instanceId}
                style={[
                  styles.cardWrapper,
                  { top: index * CASCADE_OFFSET },
                  dimmed && styles.dimmed,
                ]}
              >
                <MiniCard
                  gameCard={gc}
                  isSelected={isSelected}
                  isHotfixMode={isHotfixTarget}
                  onPress={() => !dimmed && onCardPress(gc)}
                />
              </View>
            );
          })}

          {column.cards.length === 0 && (
            <View style={styles.emptyPlaceholder}>
              <Text style={styles.emptyText}>empty</Text>
            </View>
          )}
        </View>
      </ScrollView>

      {/* Status badge */}
      {column.cleared && (
        <View style={[styles.statusBadge, styles.clearedBadge]}>
          <Text style={styles.statusText}>CLEARED</Text>
        </View>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  wrapper: {
    flex: 1,
    marginHorizontal: 4,
    alignItems: 'center',
  },
  header: {
    alignItems: 'center',
    marginBottom: 6,
  },
  columnId: {
    color: '#ffffff',
    fontSize: 14,
    fontWeight: '800',
    letterSpacing: 0.5,
  },
  budgetBadge: {
    backgroundColor: '#1b4332',
    borderRadius: 8,
    paddingHorizontal: 7,
    paddingVertical: 2,
    marginTop: 2,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.2)',
  },
  budgetText: {
    color: '#d8f3dc',
    fontSize: 11,
    fontWeight: '700',
  },
  scroll: {
    width: CARD_WIDTH + 8,
    flex: 1,
  },
  cardStack: {
    width: CARD_WIDTH,
    alignSelf: 'center',
    position: 'relative',
  },
  cardWrapper: {
    position: 'absolute',
    left: 0,
    right: 0,
  },
  emptyPlaceholder: {
    width: CARD_WIDTH,
    height: CARD_HEIGHT,
    borderRadius: 8,
    borderWidth: 1,
    borderStyle: 'dashed',
    borderColor: 'rgba(255,255,255,0.3)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  emptyText: {
    color: 'rgba(255,255,255,0.3)',
    fontSize: 12,
  },
  dimmed: {
    opacity: 0.35,
  },
  statusBadge: {
    borderRadius: 6,
    paddingHorizontal: 8,
    paddingVertical: 3,
    marginTop: 6,
  },
  clearedBadge: {
    backgroundColor: '#27ae60',
  },
  statusText: {
    color: '#ffffff',
    fontSize: 10,
    fontWeight: '800',
    letterSpacing: 0.5,
  },
});
