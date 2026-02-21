import React from 'react';
import { Modal, ScrollView, StyleSheet, Text, TouchableOpacity, View } from 'react-native';

interface EscapeHelpModalProps {
  visible: boolean;
  onClose: () => void;
}

interface Section {
  heading: string;
  rows: { label: string; body: string }[];
}

const SECTIONS: Section[] = [
  {
    heading: 'Goal',
    rows: [
      {
        label: '',
        body: 'Move your token from step 4 to step 1 (EXIT) before the police catch up. The police start at step 6 and close in each turn.',
      },
    ],
  },
  {
    heading: 'Your Turn',
    rows: [
      {
        label: 'Lay a Match',
        body: 'Select 3 or 4 cards from your hand that form a valid match, then tap LAY MATCH. Your token advances 1 step toward EXIT.',
      },
      {
        label: 'Discard',
        body: 'Select 1 or more cards and tap DISCARD. Those cards are removed and replaced with new ones from the deck. Your position does not change, but the police still take their turn.',
      },
    ],
  },
  {
    heading: 'Valid Matches',
    rows: [
      {
        label: 'Set',
        body: '3 or 4 cards of the same rank. Example: 7♠ 7♥ 7♦.',
      },
      {
        label: 'Run',
        body: '3 or 4 consecutive ranks (any suit). Ace is low only. Example: A♣ 2♥ 3♦ or 9♦ 10♠ J♥.',
      },
    ],
  },
  {
    heading: 'Police Turn',
    rows: [
      {
        label: '',
        body: 'After every action you take, the police play automatically. If they can match, they advance 1 step toward you. If they cannot match, they discard their lowest card and draw.',
      },
    ],
  },
  {
    heading: 'Win / Lose',
    rows: [
      {
        label: 'Escape',
        body: 'Reach step 1 (EXIT). You keep 100% of your campaign score.',
      },
      {
        label: 'Caught',
        body: 'The police reach your step or pass it. You keep only 33% of your campaign score.',
      },
    ],
  },
  {
    heading: 'Tips',
    rows: [
      {
        label: '',
        body: 'Matches are the only way to advance — prioritize building them. Every 2nd discard you make draws the police 1 step closer, on top of their normal turn. A 4-card set advances you 2 steps.',
      },
    ],
  },
];

export function EscapeHelpModal({ visible, onClose }: EscapeHelpModalProps) {
  return (
    <Modal visible={visible} transparent animationType="slide">
      <View style={styles.overlay}>
        <View style={styles.sheet}>
          <View style={styles.titleRow}>
            <Text style={styles.title}>Act 3: Escape Rules</Text>
            <TouchableOpacity style={styles.closeBtn} onPress={onClose} hitSlop={12}>
              <Text style={styles.closeBtnText}>✕</Text>
            </TouchableOpacity>
          </View>

          <ScrollView
            style={styles.scroll}
            contentContainerStyle={styles.scrollContent}
            showsVerticalScrollIndicator={false}
          >
            {SECTIONS.map(section => (
              <View key={section.heading} style={styles.section}>
                <Text style={styles.sectionHeading}>{section.heading}</Text>
                {section.rows.map((row, i) => (
                  <View key={i} style={styles.row}>
                    {row.label ? (
                      <Text style={styles.rowLabel}>{row.label}</Text>
                    ) : null}
                    <Text style={[styles.rowBody, !row.label && styles.rowBodyFull]}>
                      {row.body}
                    </Text>
                  </View>
                ))}
              </View>
            ))}
          </ScrollView>

          <TouchableOpacity style={styles.doneBtn} onPress={onClose}>
            <Text style={styles.doneBtnText}>Got it</Text>
          </TouchableOpacity>
        </View>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.55)',
    justifyContent: 'flex-end',
  },
  sheet: {
    backgroundColor: '#1b4332',
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    height: '82%',
    paddingBottom: 24,
    borderTopWidth: 1,
    borderColor: 'rgba(255,255,255,0.12)',
  },
  titleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingTop: 20,
    paddingBottom: 12,
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(255,255,255,0.1)',
  },
  title: {
    flex: 1,
    color: '#ffffff',
    fontSize: 20,
    fontWeight: '800',
    letterSpacing: 0.5,
  },
  closeBtn: {
    padding: 4,
  },
  closeBtnText: {
    color: 'rgba(255,255,255,0.5)',
    fontSize: 18,
  },
  scroll: {
    flex: 1,
  },
  scrollContent: {
    paddingHorizontal: 20,
    paddingTop: 16,
    paddingBottom: 8,
  },
  section: {
    marginBottom: 20,
  },
  sectionHeading: {
    color: '#f4d03f',
    fontSize: 13,
    fontWeight: '800',
    letterSpacing: 1,
    textTransform: 'uppercase',
    marginBottom: 8,
  },
  row: {
    marginBottom: 8,
  },
  rowLabel: {
    color: '#ffffff',
    fontSize: 14,
    fontWeight: '700',
    marginBottom: 2,
  },
  rowBody: {
    color: 'rgba(255,255,255,0.75)',
    fontSize: 13,
    lineHeight: 19,
    paddingLeft: 8,
    borderLeftWidth: 2,
    borderLeftColor: 'rgba(255,255,255,0.15)',
  },
  rowBodyFull: {
    paddingLeft: 0,
    borderLeftWidth: 0,
  },
  doneBtn: {
    marginHorizontal: 20,
    marginTop: 8,
    backgroundColor: '#2d6a4f',
    borderRadius: 10,
    paddingVertical: 14,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.15)',
  },
  doneBtnText: {
    color: '#ffffff',
    fontSize: 15,
    fontWeight: '700',
  },
});
