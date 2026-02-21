import React from 'react';
import { ScrollView, StyleSheet, Text, View } from 'react-native';
import { MARKET_ACT_ORDER, MARKET_ITEMS, MARKET_UNLOCK_HEISTS } from '../data/marketItems';
import { useHistoryStore } from '../store/historyStore';
import theme from '../theme';

const itemsByAct = MARKET_ACT_ORDER.map(act => ({
  act,
  items: MARKET_ITEMS.filter(item => item.act === act),
}));

export function MarketScreen() {
  const lifetimeGold = useHistoryStore(s => s.lifetimeGold);
  const heistCount = useHistoryStore(s => s.records.length);
  const isUnlocked = heistCount >= MARKET_UNLOCK_HEISTS;
  const heistsRemaining = Math.max(0, MARKET_UNLOCK_HEISTS - heistCount);

  return (
    <View style={styles.screen}>
      <Text style={styles.title}>BLACK MARKET</Text>

      {!isUnlocked ? (
        <View style={styles.lockedCard}>
          <Text style={styles.lockedIcon}>🚪</Text>
          <Text style={styles.lockedMessage}>
            The shadowy people running the black market don't know you yet. This door will open
            after 5 heists.
          </Text>
          <Text style={styles.lockedProgress}>
            {heistsRemaining} heist{heistsRemaining === 1 ? '' : 's'} to go
          </Text>
        </View>
      ) : (
        <ScrollView
          style={styles.marketScroll}
          contentContainerStyle={styles.marketScrollContent}
          showsVerticalScrollIndicator={false}
        >
          {itemsByAct.map(section => (
            <View key={section.act} style={styles.section}>
              <Text style={styles.sectionTitle}>{section.act}</Text>
              {section.items.map(item => (
                <View key={item.id} style={styles.itemCard}>
                  <View style={styles.itemHeader}>
                    <Text style={styles.itemIcon}>{item.icon}</Text>
                    <View style={styles.itemTitleWrap}>
                      <Text style={styles.itemTitle}>{item.title}</Text>
                      <Text style={styles.itemCost}>
                        {item.cost === null ? 'Cost: TBD' : `${item.cost} Gold`}
                      </Text>
                    </View>
                  </View>
                  <Text style={styles.itemFlavor}>{item.flavor}</Text>
                  <Text style={styles.itemEffect}>{item.effect}</Text>
                </View>
              ))}
            </View>
          ))}
        </ScrollView>
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
});
