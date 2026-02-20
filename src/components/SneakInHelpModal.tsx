import React from 'react';
import { Modal, ScrollView, StyleSheet, Text, TouchableOpacity, View } from 'react-native';

interface SneakInHelpModalProps {
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
        body: 'Place two or three cards into each security area so each total exactly matches its target number.',
      },
    ],
  },
  {
    heading: 'How To Move Cards',
    rows: [
      {
        label: 'Drag cards',
        body: 'Drag from your hand to an unlocked area, from one area to another, or back to your hand.',
      },
      {
        label: 'Drop rules',
        body: 'You can only drop into unlocked areas with space (max 3 cards per area).',
      },
    ],
  },
  {
    heading: 'Unlocking Areas',
    rows: [
      {
        label: '',
        body: 'Only the first area starts unlocked. Solving an area unlocks the next one in order.',
      },
    ],
  },
  {
    heading: 'Solving',
    rows: [
      {
        label: '',
        body: 'An area is solved when it has two or three cards and their values add up exactly to that area target.',
      },
    ],
  },
  {
    heading: 'Timer',
    rows: [
      {
        label: '',
        body: 'The clock starts when you place your first card into an area and stops when all four areas are solved.',
      },
    ],
  },
];

export function SneakInHelpModal({ visible, onClose }: SneakInHelpModalProps) {
  return (
    <Modal visible={visible} transparent animationType="slide">
      <View style={styles.overlay}>
        <View style={styles.sheet}>
          <View style={styles.titleRow}>
            <Text style={styles.title}>Sneak In Rules</Text>
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
