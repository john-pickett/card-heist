import React, { useState } from 'react';
import { ScrollView, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import * as Haptics from 'expo-haptics';
import {
  MARKET_ACT_ORDER,
  MARKET_ITEMS,
  MARKET_UNLOCK_HEISTS,
  PREMIUM_UNLOCK_TIER_1,
  PREMIUM_UNLOCK_TIER_2,
} from '../data/marketItems';
import { useCardSound } from '../hooks/useCardSound';
import { useHistoryStore } from '../store/historyStore';
import { useInventoryStore } from '../store/inventoryStore';
import theme from '../theme';

const itemsByAct = MARKET_ACT_ORDER.map(act => ({
  act,
  items: MARKET_ITEMS.filter(item => item.act === act && item.goldUnlock === undefined),
}));

const PREMIUM_TIERS = [
  { key: 'tier1', goldUnlock: PREMIUM_UNLOCK_TIER_1, label: '2,000' },
  { key: 'tier2', goldUnlock: PREMIUM_UNLOCK_TIER_2, label: '5,000' },
];

export function MarketScreen() {
  const lifetimeGold = useHistoryStore(s => s.lifetimeGold);
  const spentGold = useHistoryStore(s => s.spentGold);
  const spendGold = useHistoryStore(s => s.spendGold);
  const unlockedPremiumTiers = useHistoryStore(s => s.unlockedPremiumTiers);
  const unlockPremiumTier = useHistoryStore(s => s.unlockPremiumTier);
  const heistCount = useHistoryStore(s => s.records.length);
  const addItem = useInventoryStore(s => s.addItem);
  const inventoryItems = useInventoryStore(s => s.items);
  const { playPurchase } = useCardSound();

  const [tab, setTab] = useState<'standard' | 'premium'>('standard');

  const availableGold = lifetimeGold - spentGold;
  const isUnlocked = heistCount >= MARKET_UNLOCK_HEISTS;
  const heistsRemaining = Math.max(0, MARKET_UNLOCK_HEISTS - heistCount);
  const allPremiumTiersUnlocked = PREMIUM_TIERS.every(tier => unlockedPremiumTiers.includes(tier.key));

  function getOwnedQuantity(itemId: string): number {
    return inventoryItems.find(e => e.itemId === itemId)?.quantity ?? 0;
  }

  function handleBuy(itemId: string, cost: number) {
    spendGold(cost);
    addItem(itemId);
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    playPurchase();
  }

  return (
    <View style={styles.screen}>
      <Text style={styles.title}>BLACK MARKET</Text>

      {!isUnlocked ? (
        <View style={styles.lockedCard}>
          <Text style={styles.lockedIcon}>🚪</Text>
          <Text style={styles.lockedMessage}>
            The shadowy people running the black market don't know you yet. This door will open
            after {MARKET_UNLOCK_HEISTS} heist{MARKET_UNLOCK_HEISTS === 1 ? '' : 's'}.
          </Text>
          <Text style={styles.lockedProgress}>
            {heistsRemaining} heist{heistsRemaining === 1 ? '' : 's'} to go
          </Text>
        </View>
      ) : (
        <>
          <View style={styles.tabRow}>
            <TouchableOpacity
              style={[styles.tabButton, tab === 'standard' && styles.tabButtonActive]}
              onPress={() => setTab('standard')}
              activeOpacity={0.7}
            >
              <Text style={[styles.tabLabel, tab === 'standard' && styles.tabLabelActive]}>
                Standard
              </Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={[styles.tabButton, tab === 'premium' && styles.tabButtonActive]}
              onPress={() => setTab('premium')}
              activeOpacity={0.7}
            >
              <Text style={[styles.tabLabel, tab === 'premium' && styles.tabLabelActive]}>
                Premium
              </Text>
            </TouchableOpacity>
          </View>

          {tab === 'standard' ? (
            <ScrollView
              style={styles.marketScroll}
              contentContainerStyle={styles.marketScrollContent}
              showsVerticalScrollIndicator={false}
            >
              {itemsByAct.map(section => (
                <View key={section.act} style={styles.section}>
                  <Text style={styles.sectionTitle}>{section.act}</Text>
                  {section.items.map(item => {
                    const canAfford = item.cost !== null && availableGold >= item.cost;
                    const disabled = item.cost === null || !canAfford;
                    const owned = getOwnedQuantity(item.id);
                    return (
                      <View key={item.id} style={styles.itemCard}>
                        <View style={styles.itemHeader}>
                          <Text style={styles.itemIcon}>{item.icon}</Text>
                          <View style={styles.itemTitleWrap}>
                            <Text style={styles.itemTitle}>{item.title}</Text>
                            <Text style={styles.itemCost}>
                              {item.cost === null ? 'Cost: TBD' : `${item.cost} Gold`}
                            </Text>
                          </View>
                          <View style={styles.buyColumn}>
                            <TouchableOpacity
                              style={[styles.buyButton, disabled && styles.buyButtonDisabled]}
                              onPress={() => item.cost !== null && handleBuy(item.id, item.cost)}
                              disabled={disabled}
                              activeOpacity={0.7}
                            >
                              <Text style={[styles.buyButtonText, disabled && styles.buyButtonTextDisabled]}>
                                BUY
                              </Text>
                            </TouchableOpacity>
                            {owned > 0 && (
                              <Text style={styles.ownedLabel}>Owned: {owned}</Text>
                            )}
                          </View>
                        </View>
                        <Text style={styles.itemFlavor}>{item.flavor}</Text>
                        <Text style={styles.itemEffect}>{item.effect}</Text>
                      </View>
                    );
                  })}
                </View>
              ))}
            </ScrollView>
          ) : (
            <ScrollView
              style={styles.marketScroll}
              contentContainerStyle={styles.marketScrollContent}
              showsVerticalScrollIndicator={false}
            >
              {!allPremiumTiersUnlocked && (
                <View style={styles.premiumExplainer}>
                  <Text style={styles.premiumExplainerText}>
                    These items unlock after spending enough gold at the black market.
                  </Text>
                  <Text style={styles.premiumExplainerGold}>
                    You've spent{' '}
                    <Text style={styles.premiumExplainerGoldAmount}>
                      {spentGold.toLocaleString()} gold
                    </Text>
                    {' '}so far.
                  </Text>
                </View>
              )}

              {PREMIUM_TIERS.map(tier => {
                const tierItems = MARKET_ITEMS.filter(item => item.premiumTierId === tier.key);
                const thresholdMet = spentGold >= tier.goldUnlock;
                const tierUnlocked = unlockedPremiumTiers.includes(tier.key);
                const goldToGo = Math.max(0, tier.goldUnlock - spentGold);
                const actSections = MARKET_ACT_ORDER.map(act => ({
                  act,
                  items: tierItems.filter(item => item.act === act),
                })).filter(s => s.items.length > 0);

                return (
                  <View key={tier.key} style={styles.section}>
                    <Text style={styles.sectionTitle}>Tier — {tier.label} Gold</Text>

                    {!tierUnlocked && (
                      <View style={styles.tierUnlockRow}>
                        <View style={styles.tierUnlockInfo}>
                          {thresholdMet ? (
                            <Text style={styles.tierUnlockReady}>
                              You've met the spending threshold — unlock this tier to buy.
                            </Text>
                          ) : (
                            <Text style={styles.tierUnlockPending}>
                              Spend {goldToGo.toLocaleString()} more gold to unlock.
                            </Text>
                          )}
                        </View>
                        <TouchableOpacity
                          style={[styles.unlockButton, !thresholdMet && styles.unlockButtonDisabled]}
                          onPress={() => unlockPremiumTier(tier.key)}
                          disabled={!thresholdMet}
                          activeOpacity={0.7}
                        >
                          <Text style={[styles.unlockButtonText, !thresholdMet && styles.unlockButtonTextDisabled]}>
                            UNLOCK
                          </Text>
                        </TouchableOpacity>
                      </View>
                    )}

                    {actSections.map(({ act, items }) => (
                      <View key={act} style={styles.actGroup}>
                        <Text style={styles.actGroupTitle}>{act}</Text>
                        {items.map(item => {
                          const canAfford = tierUnlocked && item.cost !== null && availableGold >= item.cost;
                          const disabled = !tierUnlocked || item.cost === null || !canAfford;
                          const owned = getOwnedQuantity(item.id);
                          return (
                            <View key={item.id} style={styles.itemCard}>
                              <View style={styles.itemHeader}>
                                <Text style={styles.itemIcon}>{item.icon}</Text>
                                <View style={styles.itemTitleWrap}>
                                  <Text style={styles.itemTitle}>{item.title}</Text>
                                  <Text style={styles.itemCost}>
                                    {item.cost === null ? 'Cost: TBD' : `${item.cost} Gold`}
                                  </Text>
                                </View>
                                <View style={styles.buyColumn}>
                                  <TouchableOpacity
                                    style={[styles.buyButton, disabled && styles.buyButtonDisabled]}
                                    onPress={() => item.cost !== null && handleBuy(item.id, item.cost)}
                                    disabled={disabled}
                                    activeOpacity={0.7}
                                  >
                                    <Text style={[styles.buyButtonText, disabled && styles.buyButtonTextDisabled]}>
                                      BUY
                                    </Text>
                                  </TouchableOpacity>
                                  {owned > 0 && (
                                    <Text style={styles.ownedLabel}>Owned: {owned}</Text>
                                  )}
                                </View>
                              </View>
                              <Text style={styles.itemFlavor}>{item.flavor}</Text>
                              <Text style={styles.itemEffect}>{item.effect}</Text>
                            </View>
                          );
                        })}
                      </View>
                    ))}
                  </View>
                );
              })}
            </ScrollView>
          )}
        </>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  screen: {
    flex: 1,
    backgroundColor: theme.colors.bgPrimary,
    alignItems: 'center',
    paddingTop: theme.spacing.fourteen,
    paddingHorizontal: theme.spacing.xxl,
  },
  title: {
    color: theme.colors.textPrimary,
    fontSize: theme.fontSizes.xl,
    fontWeight: theme.fontWeights.black,
    letterSpacing: 3,
    marginBottom: theme.spacing.fourteen,
    textAlign: 'center',
  },
  tabRow: {
    flexDirection: 'row',
    gap: theme.spacing.sm,
    marginBottom: theme.spacing.eighteen,
    width: '100%',
  },
  tabButton: {
    flex: 1,
    paddingVertical: theme.spacing.sm,
    borderRadius: theme.radii.md,
    alignItems: 'center',
    backgroundColor: theme.colors.bgOverlaySoft,
    borderWidth: theme.borderWidths.thin,
    borderColor: theme.colors.borderSubtle,
  },
  tabButtonActive: {
    backgroundColor: theme.colors.gold,
    borderColor: theme.colors.gold,
  },
  tabLabel: {
    color: theme.colors.textSoft,
    fontSize: theme.fontSizes.md,
    fontWeight: theme.fontWeights.heavy,
    letterSpacing: 0.5,
  },
  tabLabelActive: {
    color: theme.colors.bgDeep,
  },
  lockedCard: {
    width: '100%',
    backgroundColor: theme.colors.bgOverlaySoft,
    borderRadius: theme.radii.xl,
    paddingVertical: theme.spacing.twentyEight,
    paddingHorizontal: theme.spacing.xl,
    alignItems: 'center',
    borderWidth: theme.borderWidths.thin,
    borderColor: theme.colors.borderSubtle,
    gap: theme.spacing.ten,
    marginBottom: theme.spacing.xl,
  },
  lockedIcon: {
    fontSize: theme.fontSizes.hero2,
  },
  lockedMessage: {
    color: theme.colors.text85,
    fontSize: theme.fontSizes.base,
    lineHeight: 21,
    textAlign: 'center',
  },
  lockedProgress: {
    color: theme.colors.textSoft,
    fontSize: theme.fontSizes.md,
    fontWeight: theme.fontWeights.heavy,
    letterSpacing: 0.2,
  },
  marketScroll: {
    width: '100%',
    flex: 1,
  },
  marketScrollContent: {
    paddingBottom: theme.spacing.xxl,
    gap: theme.spacing.xl,
  },
  section: {
    gap: theme.spacing.sm,
  },
  sectionTitle: {
    color: theme.colors.textPrimary,
    fontSize: theme.fontSizes.subtitle,
    fontWeight: theme.fontWeights.black,
    textTransform: 'uppercase',
    letterSpacing: 1.2,
  },
  itemCard: {
    width: '100%',
    backgroundColor: theme.colors.bgOverlaySoft,
    borderRadius: theme.radii.lg,
    borderWidth: theme.borderWidths.thin,
    borderColor: theme.colors.borderSubtle,
    paddingVertical: theme.spacing.lg,
    paddingHorizontal: theme.spacing.lg,
    gap: theme.spacing.sm,
  },
  itemHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: theme.spacing.md,
  },
  itemIcon: {
    fontSize: theme.fontSizes.xxl2,
  },
  itemTitleWrap: {
    flex: 1,
    gap: theme.spacing.two,
  },
  itemTitle: {
    color: theme.colors.textPrimary,
    fontSize: theme.fontSizes.basePlus,
    fontWeight: theme.fontWeights.heavy,
  },
  itemCost: {
    color: theme.colors.gold,
    fontSize: theme.fontSizes.m,
    fontWeight: theme.fontWeights.bold,
    letterSpacing: 0.4,
  },
  itemFlavor: {
    color: theme.colors.text75,
    fontSize: theme.fontSizes.md,
    fontStyle: 'italic',
  },
  itemEffect: {
    color: theme.colors.text85,
    fontSize: theme.fontSizes.m,
    lineHeight: 19,
  },
  buyColumn: {
    alignItems: 'center',
    gap: theme.spacing.two,
  },
  ownedLabel: {
    color: theme.colors.textSoft,
    fontSize: theme.fontSizes.xs,
    fontWeight: theme.fontWeights.bold,
    letterSpacing: 0.2,
  },
  buyButton: {
    backgroundColor: theme.colors.gold,
    borderRadius: theme.radii.md,
    paddingVertical: theme.spacing.six,
    paddingHorizontal: theme.spacing.md,
    alignItems: 'center',
    justifyContent: 'center',
    minWidth: 52,
  },
  buyButtonDisabled: {
    backgroundColor: theme.colors.bgOverlaySoft,
    borderWidth: theme.borderWidths.thin,
    borderColor: theme.colors.borderSubtle,
  },
  buyButtonText: {
    color: theme.colors.bgDeep,
    fontSize: theme.fontSizes.sm,
    fontWeight: theme.fontWeights.black,
    letterSpacing: 1,
  },
  buyButtonTextDisabled: {
    color: theme.colors.textDisabled,
  },
  // Premium explainer
  premiumExplainer: {
    width: '100%',
    backgroundColor: theme.colors.bgOverlaySoft,
    borderRadius: theme.radii.lg,
    borderWidth: theme.borderWidths.thin,
    borderColor: theme.colors.borderSubtle,
    paddingVertical: theme.spacing.md,
    paddingHorizontal: theme.spacing.lg,
    gap: theme.spacing.xs,
  },
  premiumExplainerText: {
    color: theme.colors.text75,
    fontSize: theme.fontSizes.md,
    lineHeight: 19,
  },
  premiumExplainerGold: {
    color: theme.colors.text85,
    fontSize: theme.fontSizes.md,
  },
  premiumExplainerGoldAmount: {
    color: theme.colors.gold,
    fontWeight: theme.fontWeights.heavy,
  },
  // Act grouping within an unlocked tier
  actGroup: {
    gap: theme.spacing.sm,
  },
  actGroupTitle: {
    color: theme.colors.textMuted,
    fontSize: theme.fontSizes.s,
    fontWeight: theme.fontWeights.heavy,
    textTransform: 'uppercase',
    letterSpacing: 1.2,
  },
  // Premium tier unlock row
  tierUnlockRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: theme.spacing.md,
    backgroundColor: theme.colors.bgOverlaySoft,
    borderRadius: theme.radii.lg,
    borderWidth: theme.borderWidths.thin,
    borderColor: theme.colors.borderSubtle,
    paddingVertical: theme.spacing.md,
    paddingHorizontal: theme.spacing.lg,
  },
  tierUnlockInfo: {
    flex: 1,
  },
  tierUnlockReady: {
    color: theme.colors.greenPastel,
    fontSize: theme.fontSizes.md,
    lineHeight: 18,
  },
  tierUnlockPending: {
    color: theme.colors.textSoft,
    fontSize: theme.fontSizes.md,
    lineHeight: 18,
  },
  unlockButton: {
    backgroundColor: theme.colors.gold,
    borderRadius: theme.radii.md,
    paddingVertical: theme.spacing.six,
    paddingHorizontal: theme.spacing.md,
    alignItems: 'center',
    justifyContent: 'center',
    minWidth: 72,
  },
  unlockButtonDisabled: {
    backgroundColor: theme.colors.bgOverlaySoft,
    borderWidth: theme.borderWidths.thin,
    borderColor: theme.colors.borderSubtle,
  },
  unlockButtonText: {
    color: theme.colors.bgDeep,
    fontSize: theme.fontSizes.sm,
    fontWeight: theme.fontWeights.black,
    letterSpacing: 1,
  },
  unlockButtonTextDisabled: {
    color: theme.colors.textDisabled,
  },
});
