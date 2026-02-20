import React from 'react';
import {
  Modal,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';
import { useReckoningStore } from '../../store/reckoningStore';

const SUIT_SYMBOL: Record<string, string> = {
  spades: '♠',
  hearts: '♥',
  diamonds: '♦',
  clubs: '♣',
};

export function AceModal() {
  const phase = useReckoningStore((s) => s.phase);
  const pendingAce = useReckoningStore((s) => s.pendingAce);
  const chooseAceValue = useReckoningStore((s) => s.chooseAceValue);

  const visible = phase === 'ace' && pendingAce != null;

  if (!visible || !pendingAce) return null;

  const symbol = SUIT_SYMBOL[pendingAce.card.suit] ?? '';
  const vaultNum = pendingAce.targetVaultId + 1;

  return (
    <Modal
      visible={visible}
      transparent
      animationType="fade"
      statusBarTranslucent
    >
      <View style={styles.backdrop}>
        <View style={styles.sheet}>
          <Text style={styles.title}>Ace of {pendingAce.card.suit}</Text>
          <Text style={styles.subtitle}>Going to Vault {vaultNum}</Text>

          <View style={styles.cardDisplay}>
            <Text style={styles.cardRank}>A</Text>
            <Text style={styles.cardSuit}>{symbol}</Text>
          </View>

          <Text style={styles.prompt}>Choose ace value:</Text>

          <View style={styles.buttons}>
            <TouchableOpacity
              style={[styles.btn, styles.btnOne]}
              onPress={() => chooseAceValue(1)}
            >
              <Text style={styles.btnText}>1</Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={[styles.btn, styles.btnEleven]}
              onPress={() => chooseAceValue(11)}
            >
              <Text style={styles.btnText}>11</Text>
            </TouchableOpacity>
          </View>
        </View>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  backdrop: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.6)',
    justifyContent: 'flex-end',
  },
  sheet: {
    backgroundColor: '#1b4332',
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    padding: 28,
    paddingBottom: 40,
    alignItems: 'center',
    borderTopWidth: 1,
    borderColor: 'rgba(255,255,255,0.15)',
  },
  title: {
    color: '#ffffff',
    fontSize: 22,
    fontWeight: '900',
    letterSpacing: 0.5,
  },
  subtitle: {
    color: 'rgba(255,255,255,0.55)',
    fontSize: 14,
    marginTop: 4,
    marginBottom: 20,
  },
  cardDisplay: {
    backgroundColor: '#ffffff',
    borderRadius: 12,
    width: 80,
    height: 110,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 20,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 3 },
    shadowOpacity: 0.25,
    shadowRadius: 5,
    elevation: 5,
  },
  cardRank: {
    fontSize: 32,
    fontWeight: '900',
    color: '#1b4332',
  },
  cardSuit: {
    fontSize: 24,
    color: '#1b4332',
    marginTop: -4,
  },
  prompt: {
    color: 'rgba(255,255,255,0.7)',
    fontSize: 14,
    marginBottom: 16,
  },
  buttons: {
    flexDirection: 'row',
    gap: 16,
  },
  btn: {
    width: 80,
    paddingVertical: 16,
    borderRadius: 12,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.2)',
  },
  btnOne: {
    backgroundColor: '#2d6a4f',
  },
  btnEleven: {
    backgroundColor: '#40916c',
  },
  btnText: {
    color: '#ffffff',
    fontSize: 24,
    fontWeight: '900',
  },
});
