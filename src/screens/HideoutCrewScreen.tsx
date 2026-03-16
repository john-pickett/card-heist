import React from 'react';
import { ScrollView, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { crewMembers } from '../data/crew';
import { useCrewStore, isCrewAvailable } from '../store/crewStore';
import { useHistoryStore } from '../store/historyStore';
import { CrewMemberId } from '../types/crew';
import theme from '../theme';

interface Props {
  onBack: () => void;
}

export function HideoutCrewScreen({ onBack }: Props) {
  const unlockedIds = useCrewStore(s => s.unlockedIds);
  const consecutiveHeists = useCrewStore(s => s.consecutiveHeists);
  const purchaseCrew = useCrewStore(s => s.purchaseCrew);
  const lifetimeGold = useHistoryStore(s => s.lifetimeGold);
  const spentGold = useHistoryStore(s => s.spentGold);
  const spendGold = useHistoryStore(s => s.spendGold);

  const availableGold = lifetimeGold - spentGold;

  function handleHire(id: CrewMemberId, cost: number) {
    purchaseCrew(id);
    spendGold(cost);
  }

  function getStatusLabel(id: CrewMemberId): string {
    const count = consecutiveHeists[id] ?? 0;
    if (count >= 2) return 'Resting';
    if (count === 1) return 'Available — 1 heist in';
    return 'Available';
  }

  return (
    <View style={styles.screen}>
      <TouchableOpacity style={styles.backBtn} onPress={onBack} activeOpacity={0.7}>
        <Text style={styles.backArrow}>‹</Text>
        <Text style={styles.backLabel}>Hideout</Text>
      </TouchableOpacity>

      <Text style={styles.title}>CREW</Text>

      <ScrollView
        style={styles.list}
        contentContainerStyle={styles.listContent}
        showsVerticalScrollIndicator={false}
      >
        {crewMembers.map((member) => {
          const isUnlocked = unlockedIds.includes(member.id);
          const canAfford = availableGold >= member.cost;
          const available = isCrewAvailable(member.id, unlockedIds, consecutiveHeists);

          return (
            <View key={member.id} style={styles.card}>
              <View style={styles.cardHeader}>
                <View style={styles.nameBlock}>
                  <Text style={styles.nickname}>{member.nickname}</Text>
                  <Text style={styles.fullName}>{member.fullName}</Text>
                </View>
                {isUnlocked ? (
                  <View style={styles.hiredBadge}>
                    <Text style={styles.hiredBadgeText}>✓ HIRED</Text>
                  </View>
                ) : (
                  <TouchableOpacity
                    style={[styles.hireBtn, !canAfford && styles.hireBtnDisabled]}
                    onPress={() => handleHire(member.id, member.cost)}
                    disabled={!canAfford}
                    activeOpacity={0.75}
                  >
                    <Text style={[styles.hireBtnText, !canAfford && styles.hireBtnTextDisabled]}>
                      HIRE
                    </Text>
                    <Text style={[styles.hireBtnCost, !canAfford && styles.hireBtnTextDisabled]}>
                      ◆ {member.cost.toLocaleString()}
                    </Text>
                  </TouchableOpacity>
                )}
              </View>

              <Text style={styles.flavorText}>{member.flavorText}</Text>
              <Text style={styles.effect}>{member.effect}</Text>

              {isUnlocked && (
                <Text style={[
                  styles.statusLabel,
                  available ? styles.statusAvailable : styles.statusResting,
                ]}>
                  {getStatusLabel(member.id)}
                </Text>
              )}
            </View>
          );
        })}

        <View style={styles.goldRow}>
          <Text style={styles.goldLabel}>Your gold: </Text>
          <Text style={styles.goldAmount}>◆ {availableGold.toLocaleString()}</Text>
        </View>
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  screen: {
    flex: 1,
    backgroundColor: theme.colors.bgPrimary,
    paddingTop: theme.spacing.fourteen,
  },
  backBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    alignSelf: 'flex-start',
    marginBottom: theme.spacing.xl,
    paddingVertical: theme.spacing.xs,
    paddingHorizontal: theme.spacing.xl,
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
  title: {
    color: theme.colors.textPrimary,
    fontSize: theme.fontSizes.xl,
    fontWeight: theme.fontWeights.black,
    letterSpacing: 3,
    marginBottom: theme.spacing.xl,
    textAlign: 'center',
  },
  list: {
    flex: 1,
  },
  listContent: {
    paddingHorizontal: theme.spacing.xl,
    paddingBottom: theme.spacing.xxl,
    gap: theme.spacing.md,
  },
  card: {
    backgroundColor: theme.colors.bgPanel,
    borderRadius: theme.radii.xl,
    borderWidth: theme.borderWidths.thin,
    borderColor: theme.colors.borderMedium,
    padding: theme.spacing.lg,
    gap: theme.spacing.sm,
  },
  cardHeader: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    justifyContent: 'space-between',
    gap: theme.spacing.md,
  },
  nameBlock: {
    flex: 1,
    gap: theme.spacing.two,
  },
  nickname: {
    color: theme.colors.textPrimary,
    fontSize: theme.fontSizes.lg,
    fontWeight: theme.fontWeights.black,
    letterSpacing: 0.5,
  },
  fullName: {
    color: theme.colors.textMuted,
    fontSize: theme.fontSizes.md,
  },
  hiredBadge: {
    backgroundColor: 'rgba(149,213,178,0.15)',
    borderRadius: theme.radii.sm,
    borderWidth: theme.borderWidths.thin,
    borderColor: theme.colors.greenPastel,
    paddingHorizontal: theme.spacing.sm,
    paddingVertical: theme.spacing.two,
  },
  hiredBadgeText: {
    color: theme.colors.greenPastel,
    fontSize: theme.fontSizes.sm,
    fontWeight: theme.fontWeights.black,
    letterSpacing: 0.5,
  },
  hireBtn: {
    backgroundColor: theme.colors.gold,
    borderRadius: theme.radii.sm,
    paddingHorizontal: theme.spacing.md,
    paddingVertical: theme.spacing.sm,
    alignItems: 'center',
    gap: theme.spacing.two,
  },
  hireBtnDisabled: {
    backgroundColor: theme.colors.bgOverlaySoft,
    borderWidth: theme.borderWidths.thin,
    borderColor: theme.colors.borderSubtle,
  },
  hireBtnText: {
    color: theme.colors.bgDeep,
    fontSize: theme.fontSizes.sm,
    fontWeight: theme.fontWeights.black,
    letterSpacing: 0.5,
  },
  hireBtnCost: {
    color: theme.colors.bgDeep,
    fontSize: theme.fontSizes.sm,
    fontWeight: theme.fontWeights.bold,
  },
  hireBtnTextDisabled: {
    color: theme.colors.textSoft,
  },
  flavorText: {
    color: theme.colors.text72,
    fontSize: theme.fontSizes.md,
    fontStyle: 'italic',
    lineHeight: 18,
  },
  effect: {
    color: theme.colors.text85,
    fontSize: theme.fontSizes.base,
    lineHeight: 20,
  },
  statusLabel: {
    fontSize: theme.fontSizes.sm,
    fontWeight: theme.fontWeights.bold,
    marginTop: theme.spacing.two,
  },
  statusAvailable: {
    color: theme.colors.greenPastel,
  },
  statusResting: {
    color: theme.colors.textSoft,
  },
  goldRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'flex-end',
    marginTop: theme.spacing.sm,
  },
  goldLabel: {
    color: theme.colors.textMuted,
    fontSize: theme.fontSizes.md,
  },
  goldAmount: {
    color: theme.colors.gold,
    fontSize: theme.fontSizes.md,
    fontWeight: theme.fontWeights.heavy,
  },
});
