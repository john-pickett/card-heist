import React from 'react';
import { ScrollView, StyleSheet, Text, TouchableOpacity, View } from 'react-native';

interface Props {
  act1Gold: number;
  act2Gold: number;
  cumulativeGold: number;
  onContinue: () => void;
}

export function Act2BridgeScreen({
  act1Gold,
  act2Gold,
  cumulativeGold,
  onContinue,
}: Props) {
  return (
    <View style={styles.screen}>
      <ScrollView
        style={styles.scroll}
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
      >
        <Text style={styles.heading}>ACT 2 COMPLETE</Text>
        <Text style={styles.subheading}>CRACK THE VAULTS</Text>

        <View style={styles.storyBox}>
          <Text style={styles.storyTitle}>The vaults are open.</Text>
          <Text style={styles.storyText}>
            Cash is in hand and alarms are waking up the city. You are carrying{' '}
            <Text style={styles.storyGold}>{cumulativeGold} gold</Text> into the final stretch.
            One clean getaway keeps the haul. One mistake leaves it behind.
          </Text>
        </View>

        <View style={styles.panel}>
          <View style={styles.row}>
            <Text style={styles.label}>Act 1 gold</Text>
            <Text style={styles.value}>{act1Gold}</Text>
          </View>
          <View style={styles.row}>
            <Text style={styles.label}>Act 2 gold</Text>
            <Text style={styles.value}>{act2Gold}</Text>
          </View>
          <View style={styles.row}>
            <Text style={styles.label}>Run total so far</Text>
            <Text style={styles.bonus}>{cumulativeGold} gold</Text>
          </View>
        </View>

        <View style={styles.expectBox}>
          <Text style={styles.expectTitle}>What comes next</Text>
          <Text style={styles.expectText}>
            Act 3 is all escape. Your total gold becomes your stake, and your route decisions
            determine whether you keep the full payout or lose part of the take.
          </Text>
        </View>
      </ScrollView>

      <View style={styles.footer}>
        <TouchableOpacity style={styles.continueBtn} onPress={onContinue}>
          <Text style={styles.continueBtnText}>Continue to Act 3 →</Text>
        </TouchableOpacity>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  screen: {
    flex: 1,
    backgroundColor: '#2d6a4f',
  },
  scroll: {
    flex: 1,
  },
  scrollContent: {
    alignItems: 'center',
    paddingTop: 60,
    paddingHorizontal: 24,
    paddingBottom: 24,
  },
  footer: {
    paddingHorizontal: 24,
    paddingTop: 12,
    paddingBottom: 24,
    backgroundColor: '#2d6a4f',
    borderTopWidth: 1,
    borderTopColor: 'rgba(255,255,255,0.08)',
  },
  heading: {
    color: '#f4d03f',
    fontSize: 28,
    fontWeight: '900',
    letterSpacing: 2,
    marginBottom: 6,
  },
  subheading: {
    color: 'rgba(255,255,255,0.5)',
    fontSize: 13,
    fontWeight: '700',
    letterSpacing: 2,
    marginBottom: 14,
  },
  storyBox: {
    width: '100%',
    backgroundColor: 'rgba(0,0,0,0.15)',
    borderRadius: 14,
    paddingVertical: 12,
    paddingHorizontal: 14,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.12)',
    marginBottom: 14,
  },
  storyTitle: {
    color: '#f4d03f',
    fontSize: 15,
    fontWeight: '800',
    marginBottom: 4,
  },
  storyText: {
    color: 'rgba(255,255,255,0.8)',
    fontSize: 13,
    lineHeight: 19,
  },
  storyGold: {
    color: '#f4d03f',
    fontWeight: '900',
  },
  panel: {
    backgroundColor: '#1b4332',
    borderRadius: 16,
    padding: 20,
    width: '100%',
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.1)',
    gap: 14,
    marginBottom: 14,
  },
  row: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  label: {
    color: 'rgba(255,255,255,0.65)',
    fontSize: 15,
    fontWeight: '600',
  },
  value: {
    color: '#ffffff',
    fontSize: 20,
    fontWeight: '900',
  },
  bonus: {
    color: '#f4d03f',
    fontSize: 20,
    fontWeight: '900',
  },
  expectBox: {
    width: '100%',
    backgroundColor: 'rgba(0,0,0,0.12)',
    borderRadius: 14,
    paddingVertical: 12,
    paddingHorizontal: 14,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.1)',
  },
  expectTitle: {
    color: '#f4d03f',
    fontSize: 14,
    fontWeight: '800',
    marginBottom: 8,
  },
  expectText: {
    color: 'rgba(255,255,255,0.76)',
    fontSize: 13,
    lineHeight: 18,
  },
  continueBtn: {
    backgroundColor: '#40916c',
    borderRadius: 14,
    paddingVertical: 16,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.15)',
  },
  continueBtnText: {
    color: '#ffffff',
    fontSize: 16,
    fontWeight: '800',
    letterSpacing: 0.5,
  },
});
