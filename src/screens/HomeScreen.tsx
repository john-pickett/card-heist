import React from 'react';
import { StyleSheet, Text, TouchableOpacity, View } from 'react-native';

interface Props {
  onStartGame: () => void;
}

export function HomeScreen({ onStartGame }: Props) {
  return (
    <View style={styles.screen}>
      <Text style={styles.title}>BANK HEIST</Text>

      <View style={styles.panel}>
        <Text style={styles.actTitle}>ACT 1 — SNEAK IN</Text>
        <Text style={styles.actDesc}>
          Place your cards to crack security codes and unlock each area of the bank.
        </Text>

        <View style={styles.divider} />

        <Text style={styles.actTitle}>ACT 2 — CRACK THE VAULTS</Text>
        <Text style={styles.actDesc}>
          Assign drawn cards to three vaults. Hit targets exactly for double points.
        </Text>

        <View style={styles.divider} />

        <Text style={styles.actTitle}>ACT 3 — ESCAPE</Text>
        <Text style={styles.actDesc}>
          Combine your scores from both acts and make your getaway.
        </Text>
      </View>

      <TouchableOpacity style={styles.startBtn} onPress={onStartGame}>
        <Text style={styles.startBtnText}>START HEIST</Text>
      </TouchableOpacity>
    </View>
  );
}

const styles = StyleSheet.create({
  screen: {
    flex: 1,
    backgroundColor: '#2d6a4f',
    paddingHorizontal: 20,
    paddingTop: 40,
    alignItems: 'center',
  },
  title: {
    color: '#f4d03f',
    fontSize: 34,
    fontWeight: '900',
    letterSpacing: 4,
    marginBottom: 32,
  },
  panel: {
    backgroundColor: '#1b4332',
    borderRadius: 16,
    padding: 20,
    width: '100%',
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.1)',
    marginBottom: 32,
  },
  actTitle: {
    color: '#f4d03f',
    fontSize: 13,
    fontWeight: '800',
    letterSpacing: 1,
    marginBottom: 6,
  },
  actDesc: {
    color: 'rgba(255,255,255,0.65)',
    fontSize: 13,
    lineHeight: 19,
  },
  divider: {
    height: 1,
    backgroundColor: 'rgba(255,255,255,0.1)',
    marginVertical: 14,
  },
  startBtn: {
    backgroundColor: '#40916c',
    borderRadius: 14,
    paddingVertical: 16,
    paddingHorizontal: 48,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.15)',
  },
  startBtnText: {
    color: '#ffffff',
    fontSize: 17,
    fontWeight: '900',
    letterSpacing: 2,
  },
});
