import React from 'react';
import { View, Text, Modal, TouchableOpacity, StyleSheet } from 'react-native';

type PopupProps = {
  visible: boolean;
  title: string;
  message: string;
  onClose: () => void;
  onContinue?: () => void;
  continueText?: string;
};

export default function CustomPopup({ visible, title, message, onClose, onContinue, continueText }: PopupProps) {
  return (
    <Modal visible={visible} transparent animationType="fade">
      <View style={styles.overlay}>
        <View style={styles.popup}>
          <Text style={styles.title}>{title}</Text>
          <Text style={styles.message}>{message}</Text>

          {onContinue && (
            <TouchableOpacity
              style={styles.button}
              onPress={() => {
                onClose();        // close popup first
                onContinue();     // then run continue callback
              }}
            >
              <Text style={styles.buttonText}>{continueText || 'Continue'}</Text>
            </TouchableOpacity>
          )}

          <TouchableOpacity onPress={onClose}>
            <Text style={styles.cancelText}>Close</Text>
          </TouchableOpacity>
        </View>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.6)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  popup: {
    width: '85%',
    backgroundColor: 'rgba(241, 223, 237, 1)',
    padding: 25,
    borderRadius: 20,
    alignItems: 'center',
    borderWidth: 1.5,
    borderColor: '#df1fcfff',
  },
  title: {
    fontSize: 22,
    fontWeight: '800',
    color: '#55074eff',
    marginBottom: 12,
    textAlign: 'center',
  },
  message: {
    fontSize: 16,
    color: '#4a2c5a',
    textAlign: 'center',
    marginBottom: 20,
    lineHeight: 22,
  },
  button: {
    backgroundColor: '#8b1757ff',
    paddingVertical: 12,
    borderRadius: 12,
    width: '100%',
    alignItems: 'center',
    marginBottom: 12,
  },
  buttonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '700',
  },
  cancelText: {
    color: '#df1fcfff',
    fontSize: 15,
    fontWeight: '600',
  },
});
