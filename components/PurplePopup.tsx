import React from 'react';
import { View, Text, Modal, TouchableOpacity, StyleSheet } from 'react-native';

type PopupProps = {
  visible: boolean;
  onClose: () => void;
  onContinue: () => void;
};

export default function PurplePopup({ visible, onClose, onContinue }: PopupProps) {
  return (
    <Modal visible={visible} transparent animationType="fade">
      <View style={styles.overlay}>
        <View style={styles.popup}>
          <Text style={styles.title}>Success 🎉</Text>

          <Text style={styles.msg}>
            Account created successfully! Please verify your Aadhaar to continue.
          </Text>

          <TouchableOpacity style={styles.btn} onPress={onContinue}>
            <Text style={styles.btnText}>Continue to Verification</Text>
          </TouchableOpacity>

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
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: 'rgba(0,0,0,0.7)',
  },

  popup: {
    width: '85%',
    backgroundColor: 'rgba(241, 223, 237, 1)',  // SAME as login background
    padding: 25,
    borderRadius: 20,
    alignItems: 'center',
    borderWidth: 1.5,
    borderColor: '#df1fcfff',  // bright pink border
  },

  title: {
    fontSize: 22,
    fontWeight: '800',
    color: '#050007ff',   // white text like login
    marginBottom: 10,
  },

  msg: {
    fontSize: 16,
    color: 'black',   // light text same as login subtitle
    textAlign: 'center',
    marginBottom: 22,
    lineHeight: 22,
  },

  btn: {
    backgroundColor: '#8b1757ff',  // SAME as login button
    paddingVertical: 12,
    borderRadius: 12,
    width: '100%',
    alignItems: 'center',
    marginBottom: 12,
  },

  btnText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '700',
  },

  cancelText: {
    color: '#df1fcfff',  // pink, matching your footer link color
    fontSize: 15,
    fontWeight: '600',
  },
});
