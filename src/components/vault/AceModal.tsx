import React from 'react';
import {
  Modal,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';
import { useReckoningStore } from '../../store/vaultStore';
import theme from '../../theme';

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
    backgroundColor: theme.colors.overlayTutorial,
    justifyContent: 'flex-end',
  },
  sheet: {
    backgroundColor: theme.colors.bgPanel,
    borderTopLeftRadius: theme.radii.xxl,
    borderTopRightRadius: theme.radii.xxl,
    padding: 28,
    paddingBottom: 40,
    alignItems: 'center',
    borderTopWidth: 1,
    borderColor: theme.colors.borderMedium,
  },
  title: {
    color: theme.colors.textPrimary,
    fontSize: theme.fontSizes.xl,
    fontWeight: theme.fontWeights.black,
    letterSpacing: 0.5,
  },
  subtitle: {
    color: theme.colors.textSoft,
    fontSize: 14,
    marginTop: 4,
    marginBottom: theme.spacing.xl,
  },
  cardDisplay: {
    backgroundColor: theme.colors.cardFace,
    borderRadius: 12,
    width: 80,
    height: 110,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: theme.spacing.xl,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 3 },
    shadowOpacity: 0.25,
    shadowRadius: 5,
    elevation: 5,
  },
  cardRank: {
    fontSize: 32,
    fontWeight: theme.fontWeights.black,
    color: theme.colors.bgPanel,
  },
  cardSuit: {
    fontSize: 24,
    color: theme.colors.bgPanel,
    marginTop: -4,
  },
  prompt: {
    color: 'rgba(255,255,255,0.7)',
    fontSize: 14,
    marginBottom: theme.spacing.lg,
  },
  buttons: {
    flexDirection: 'row',
    gap: theme.spacing.lg,
  },
  btn: {
    width: 80,
    paddingVertical: theme.spacing.lg,
    borderRadius: 12,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: theme.colors.borderStrong,
  },
  btnOne: {
    backgroundColor: theme.colors.bgPrimary,
  },
  btnEleven: {
    backgroundColor: theme.colors.greenPrimary,
  },
  btnText: {
    color: theme.colors.textPrimary,
    fontSize: 24,
    fontWeight: theme.fontWeights.black,
  },
});
