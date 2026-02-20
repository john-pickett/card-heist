import React from 'react';
import { StyleSheet, Text, TouchableOpacity, View } from 'react-native';

interface Props {
  title: string;
  paragraph: string;
  onDismiss: () => void;
  children: React.ReactNode;
}

export function ActTutorialOverlay({ title, paragraph, onDismiss, children }: Props) {
  return (
    <View style={styles.overlay}>
      <View style={styles.card}>
        <Text style={styles.title}>{title}</Text>
        <Text style={styles.paragraph}>{paragraph}</Text>

        <View style={styles.screenshotFrame}>
          <Text style={styles.screenshotLabel}>Board Snapshot</Text>
          <View style={styles.snapshotArea}>{children}</View>
        </View>

        <TouchableOpacity style={styles.button} onPress={onDismiss}>
          <Text style={styles.buttonText}>Got It</Text>
        </TouchableOpacity>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  overlay: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: 'rgba(0,0,0,0.6)',
    alignItems: 'center',
    justifyContent: 'center',
    zIndex: 12000,
    elevation: 12000,
    paddingHorizontal: 20,
  },
  card: {
    width: '100%',
    height: '80%',
    backgroundColor: '#1b4332',
    borderRadius: 16,
    borderWidth: 2,
    borderColor: '#ffffff',
    padding: 16,
    gap: 10,
  },
  title: {
    color: '#f4d03f',
    fontSize: 18,
    fontWeight: '900',
    letterSpacing: 1,
  },
  paragraph: {
    color: 'rgba(255,255,255,0.85)',
    fontSize: 13,
    lineHeight: 19,
  },
  screenshotFrame: {
    flex: 1,
    backgroundColor: '#2d6a4f',
    borderRadius: 12,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.15)',
    padding: 10,
    gap: 6,
  },
  screenshotLabel: {
    color: 'rgba(255,255,255,0.55)',
    fontSize: 11,
    fontWeight: '700',
    textTransform: 'uppercase',
    letterSpacing: 0.8,
  },
  snapshotArea: {
    flex: 1,
    backgroundColor: '#163228',
    borderRadius: 10,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.1)',
    padding: 8,
    alignItems: 'center',
    justifyContent: 'center',
  },
  button: {
    marginTop: 4,
    alignSelf: 'center',
    backgroundColor: '#40916c',
    borderRadius: 12,
    paddingVertical: 12,
    paddingHorizontal: 28,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.18)',
  },
  buttonText: {
    color: '#ffffff',
    fontSize: 15,
    fontWeight: '800',
    letterSpacing: 0.4,
  },
});
