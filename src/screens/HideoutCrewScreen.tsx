import React, { useState } from 'react';
import {
  Image,
  Modal,
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';
import { crewMembers } from '../data/crew';
import { useCrewStore, isCrewAvailable } from '../store/crewStore';
import { useHistoryStore } from '../store/historyStore';
import { CrewMember, CrewMemberId } from '../types/crew';
import { HideoutSubBar } from '../components/HideoutSubBar';
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
  const [selectedMember, setSelectedMember] = useState<CrewMember | null>(null);

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
      <HideoutSubBar title="CREW" onBack={onBack} />

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
            <TouchableOpacity
              key={member.id}
              style={styles.card}
              activeOpacity={0.9}
              onPress={() => setSelectedMember(member)}
            >
              <View style={styles.cardHeader}>
                <View style={styles.headerMain}>
                  <Image source={member.imageSource} style={styles.thumbnail} resizeMode="cover" />
                  <View style={styles.nameBlock}>
                    <Text style={styles.nickname}>{member.nickname}</Text>
                    <Text style={styles.fullName}>{member.fullName}</Text>
                  </View>
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
            </TouchableOpacity>
          );
        })}

        <View style={styles.goldRow}>
          <Text style={styles.goldLabel}>Your gold: </Text>
          <Text style={styles.goldAmount}>◆ {availableGold.toLocaleString()}</Text>
        </View>
      </ScrollView>

      <Modal
        visible={selectedMember !== null}
        transparent
        animationType="fade"
        onRequestClose={() => setSelectedMember(null)}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalCard}>
            {selectedMember ? (
              <>
                <View style={styles.modalTopBar}>
                  <View style={styles.modalHeaderText}>
                    <Text style={styles.modalEyebrow}>Crew Dossier</Text>
                    <Text style={styles.modalTitle}>{selectedMember.nickname}</Text>
                    <Text style={styles.modalFullName}>{selectedMember.fullName}</Text>
                  </View>
                  <TouchableOpacity
                    style={styles.modalCloseBtn}
                    onPress={() => setSelectedMember(null)}
                    hitSlop={12}
                  >
                    <Text style={styles.modalCloseText}>✕</Text>
                  </TouchableOpacity>
                </View>

                <ScrollView
                  style={styles.modalScroll}
                  contentContainerStyle={styles.modalScrollContent}
                  showsVerticalScrollIndicator={false}
                >
                  <View style={styles.portraitFrame}>
                    <Image
                      source={selectedMember.imageSource}
                      style={styles.portrait}
                      resizeMode="cover"
                    />
                  </View>

                  <View style={styles.infoBand}>
                    <Text style={styles.modalFlavorText}>{selectedMember.flavorText}</Text>
                    <Text style={styles.modalEffectLabel}>Specialty</Text>
                    <Text style={styles.modalEffect}>{selectedMember.effect}</Text>
                  </View>

                  <Text style={styles.bioHeading}>Full Bio</Text>
                  <Text style={styles.bioText}>{selectedMember.bio}</Text>
                </ScrollView>
              </>
            ) : null}
          </View>
        </View>
      </Modal>
    </View>
  );
}

const styles = StyleSheet.create({
  screen: {
    flex: 1,
    backgroundColor: theme.colors.bgPrimary,
    paddingTop: theme.spacing.fourteen,
    paddingHorizontal: theme.spacing.xl,
  },
  list: {
    flex: 1,
  },
  listContent: {
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
  headerMain: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    gap: theme.spacing.md,
  },
  thumbnail: {
    width: 56,
    height: 56,
    borderRadius: theme.radii.md,
    borderWidth: theme.borderWidths.thin,
    borderColor: theme.colors.borderBright,
    backgroundColor: theme.colors.bgDeep,
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
  modalOverlay: {
    flex: 1,
    backgroundColor: theme.colors.overlayDark,
    justifyContent: 'center',
    paddingHorizontal: theme.spacing.xl,
    paddingVertical: theme.spacing.forty,
  },
  modalCard: {
    width: '100%',
    flexShrink: 1,
    backgroundColor: theme.colors.bgPanel,
    borderRadius: theme.radii.xxl,
    borderWidth: theme.borderWidths.thin,
    borderColor: theme.colors.borderBright,
    overflow: 'hidden',
    maxHeight: '88%',
    ...theme.shadows.heavy,
  },
  modalTopBar: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    paddingHorizontal: theme.spacing.xl,
    paddingTop: theme.spacing.xl,
    paddingBottom: theme.spacing.lg,
    backgroundColor: theme.colors.bgDeep,
    borderBottomWidth: theme.borderWidths.thin,
    borderBottomColor: theme.colors.borderMedium,
  },
  modalHeaderText: {
    flex: 1,
    gap: theme.spacing.two,
  },
  modalEyebrow: {
    color: theme.colors.gold,
    fontSize: theme.fontSizes.sm,
    fontWeight: theme.fontWeights.black,
    letterSpacing: 1.4,
    textTransform: 'uppercase',
  },
  modalTitle: {
    color: theme.colors.textPrimary,
    fontSize: theme.fontSizes.xxl,
    fontWeight: theme.fontWeights.black,
    letterSpacing: 0.5,
  },
  modalFullName: {
    color: theme.colors.textMuted,
    fontSize: theme.fontSizes.md,
  },
  modalCloseBtn: {
    width: 36,
    height: 36,
    borderRadius: 18,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: theme.colors.bgOverlaySoft,
    borderWidth: theme.borderWidths.thin,
    borderColor: theme.colors.borderLight,
  },
  modalCloseText: {
    color: theme.colors.textPrimary,
    fontSize: theme.fontSizes.base,
    fontWeight: theme.fontWeights.bold,
  },
  modalScroll: {
    flexShrink: 1,
  },
  modalScrollContent: {
    padding: theme.spacing.xl,
    paddingBottom: theme.spacing.lg,
    gap: theme.spacing.lg,
  },
  portraitFrame: {
    alignSelf: 'center',
    width: '76%',
    maxWidth: 260,
    maxHeight: 320,
    borderRadius: theme.radii.xl,
    overflow: 'hidden',
    borderWidth: theme.borderWidths.medium,
    borderColor: theme.colors.goldDim,
    backgroundColor: theme.colors.bgDeep,
  },
  portrait: {
    width: '100%',
    height: '100%',
    aspectRatio: 0.82,
  },
  infoBand: {
    backgroundColor: 'rgba(244,208,63,0.08)',
    borderRadius: theme.radii.lg,
    borderWidth: theme.borderWidths.thin,
    borderColor: 'rgba(244,208,63,0.25)',
    padding: theme.spacing.lg,
    gap: theme.spacing.sm,
  },
  modalFlavorText: {
    color: theme.colors.textGreen,
    fontSize: theme.fontSizes.base,
    fontStyle: 'italic',
    lineHeight: 21,
  },
  modalEffectLabel: {
    color: theme.colors.gold,
    fontSize: theme.fontSizes.sm,
    fontWeight: theme.fontWeights.black,
    letterSpacing: 1,
    textTransform: 'uppercase',
  },
  modalEffect: {
    color: theme.colors.textPrimary,
    fontSize: theme.fontSizes.base,
    fontWeight: theme.fontWeights.bold,
    lineHeight: 21,
  },
  bioHeading: {
    color: theme.colors.textPrimary,
    fontSize: theme.fontSizes.lg,
    fontWeight: theme.fontWeights.black,
    letterSpacing: 0.5,
  },
  bioText: {
    color: theme.colors.text85,
    fontSize: theme.fontSizes.base,
    lineHeight: 23,
  },
});
