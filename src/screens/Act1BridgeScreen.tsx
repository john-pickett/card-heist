import React from 'react';
import { StyleSheet, Text, TouchableOpacity, View } from 'react-native';

interface Props {
  handRemaining: number;
  onContinue: () => void;
}

export function Act1BridgeScreen({ handRemaining, onContinue }: Props) {
  const bonus = handRemaining * 10;

  return (
    <View style={styles.screen}>
      <Text style={styles.heading}>ACT 1 COMPLETE</Text>
      <Text style={styles.subheading}>SNEAK IN</Text>

      <View style={styles.panel}>
        <View style={styles.row}>
          <Text style={styles.label}>Cards in hand</Text>
          <Text style={styles.value}>{handRemaining}</Text>
        </View>
        <View style={styles.row}>
          <Text style={styles.label}>Bonus (×10)</Text>
          <Text style={styles.bonus}>+{bonus}pts</Text>
        </View>
      </View>

      <TouchableOpacity style={styles.continueBtn} onPress={onContinue}>
        <Text style={styles.continueBtnText}>Continue to Act 2 →</Text>
      </TouchableOpacity>
    </View>
  );
}

const styles = StyleSheet.create({
  screen: {
    flex: 1,
    backgroundColor: '#2d6a4f',
    alignItems: 'center',
    paddingTop: 60,
    paddingHorizontal: 24,
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
    marginBottom: 36,
  },
  panel: {
    backgroundColor: '#1b4332',
    borderRadius: 16,
    padding: 20,
    width: '100%',
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.1)',
    gap: 14,
    marginBottom: 32,
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
  continueBtn: {
    backgroundColor: '#40916c',
    borderRadius: 14,
    paddingVertical: 16,
    paddingHorizontal: 36,
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
