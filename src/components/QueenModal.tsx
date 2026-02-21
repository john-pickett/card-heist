import React from 'react';
import { Modal, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { ColumnId } from '../types/game';
import theme from '../theme';

const COLUMN_IDS: ColumnId[] = ['Mon', 'Tue', 'Wed', 'Thu'];

interface QueenModalProps {
  visible: boolean;
  sourceColumnId: ColumnId | null;
  onKeep: () => void;
  onMove: (targetId: ColumnId) => void;
}

export function QueenModal({ visible, sourceColumnId, onKeep, onMove }: QueenModalProps) {
  const moveTargets = COLUMN_IDS.filter(id => id !== sourceColumnId);

  return (
    <Modal visible={visible} transparent animationType="fade">
      <View style={styles.overlay}>
        <View style={styles.modal}>
          <Text style={styles.title}>Queen — Delegation</Text>
          <Text style={styles.subtitle}>
            This Queen can be delegated. Choose where to assign her.
          </Text>
          <Text style={styles.note}>Either way, she becomes a 10-pt card and the receiving column gains +10 budget.</Text>

          <TouchableOpacity style={[styles.btn, styles.keepBtn]} onPress={onKeep}>
            <Text style={styles.btnText}>Keep in {sourceColumnId}</Text>
          </TouchableOpacity>

          <Text style={styles.divider}>— or move to —</Text>

          {moveTargets.map(target => (
            <TouchableOpacity
              key={target}
              style={[styles.btn, styles.moveBtn]}
              onPress={() => onMove(target)}
            >
              <Text style={[styles.btnText, styles.moveBtnText]}>Move to {target}</Text>
            </TouchableOpacity>
          ))}
        </View>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: theme.colors.overlayDark,
    alignItems: 'center',
    justifyContent: 'center',
  },
  modal: {
    backgroundColor: theme.colors.bgPanel,
    borderRadius: theme.radii.lg,
    padding: theme.spacing.xxl,
    width: 300,
    borderWidth: 1,
    borderColor: theme.colors.borderMedium,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.4,
    shadowRadius: 8,
    elevation: 10,
  },
  title: {
    color: theme.colors.textPrimary,
    fontSize: 20,
    fontWeight: theme.fontWeights.heavy,
    textAlign: 'center',
    marginBottom: theme.spacing.sm,
  },
  subtitle: {
    color: theme.colors.textGreen,
    fontSize: theme.fontSizes.md,
    textAlign: 'center',
    marginBottom: theme.spacing.xs,
  },
  note: {
    color: 'rgba(255,255,255,0.5)',
    fontSize: theme.fontSizes.sm,
    textAlign: 'center',
    marginBottom: theme.spacing.xl,
    fontStyle: 'italic',
  },
  btn: {
    borderRadius: theme.radii.md,
    paddingVertical: theme.spacing.md,
    paddingHorizontal: theme.spacing.lg,
    alignItems: 'center',
    marginBottom: 10,
  },
  keepBtn: {
    backgroundColor: theme.colors.bgPrimary,
    borderWidth: 1,
    borderColor: theme.colors.borderStrong,
  },
  moveBtn: {
    backgroundColor: 'transparent',
    borderWidth: 1,
    borderColor: theme.colors.borderBright,
  },
  btnText: {
    color: theme.colors.textPrimary,
    fontSize: theme.fontSizes.base,
    fontWeight: theme.fontWeights.bold,
  },
  moveBtnText: {
    color: theme.colors.textGreen,
    fontWeight: theme.fontWeights.normal,
  },
  divider: {
    color: theme.colors.textFaint,
    fontSize: theme.fontSizes.sm,
    textAlign: 'center',
    marginBottom: 10,
  },
});
