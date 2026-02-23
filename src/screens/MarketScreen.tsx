import React from 'react';
import { ScrollView, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import * as Haptics from 'expo-haptics';
import { MARKET_ACT_ORDER, MARKET_ITEMS, MARKET_UNLOCK_HEISTS } from '../data/marketItems';
import { useCardSound } from '../hooks/useCardSound';
import { useHistoryStore } from '../store/historyStore';
import { useInventoryStore } from '../store/inventoryStore';
import theme from '../theme';

const itemsByAct = MARKET_ACT_ORDER.map(act => ({
  act,
  items: MARKET_ITEMS.filter(item => item.act === act),
}));

export function MarketScreen() {
  const lifetimeGold = useHistoryStore(s => s.lifetimeGold);
  const spentGold = useHistoryStore(s => s.spentGold);
  const spendGold = useHistoryStore(s => s.spendGold);
  const heistCount = useHistoryStore(s => s.records.length);
  const addItem = useInventoryStore(s => s.addItem);
  const inventoryItems = useInventoryStore(s => s.items);
  const { playPurchase } = useCardSound();

  const availableGold = lifetimeGold - spentGold;
  const isUnlocked = heistCount >= MARKET_UNLOCK_HEISTS;
  const heistsRemaining = Math.max(0, MARKET_UNLOCK_HEISTS - heistCount);

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
    marginBottom: theme.spacing.eighteen,
    textAlign: 'center',
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
});
