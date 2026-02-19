import React from 'react';
import { Modal, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { ColumnId } from '../types/game';

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
    backgroundColor: 'rgba(0,0,0,0.65)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  modal: {
    backgroundColor: '#1b4332',
    borderRadius: 14,
    padding: 24,
    width: 300,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.15)',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.4,
    shadowRadius: 8,
    elevation: 10,
  },
  title: {
    color: '#ffffff',
    fontSize: 20,
    fontWeight: '800',
    textAlign: 'center',
    marginBottom: 8,
  },
  subtitle: {
    color: '#d8f3dc',
    fontSize: 13,
    textAlign: 'center',
    marginBottom: 4,
  },
  note: {
    color: 'rgba(255,255,255,0.5)',
    fontSize: 11,
    textAlign: 'center',
    marginBottom: 20,
    fontStyle: 'italic',
  },
  btn: {
    borderRadius: 10,
    paddingVertical: 12,
    paddingHorizontal: 16,
    alignItems: 'center',
    marginBottom: 10,
  },
  keepBtn: {
    backgroundColor: '#2d6a4f',
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.2)',
  },
  moveBtn: {
    backgroundColor: 'transparent',
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.25)',
  },
  btnText: {
    color: '#ffffff',
    fontSize: 15,
    fontWeight: '700',
  },
  moveBtnText: {
    color: '#d8f3dc',
    fontWeight: '500',
  },
  divider: {
    color: 'rgba(255,255,255,0.35)',
    fontSize: 11,
    textAlign: 'center',
    marginBottom: 10,
  },
});
