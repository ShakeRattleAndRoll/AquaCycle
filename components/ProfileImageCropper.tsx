
import React from 'react';
import {
  Image,
  Modal,
  StatusBar,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';

type Props = {
  image: string | null;
  onCancel: () => void;
  onConfirm: (croppedImage: string) => void;
};

export default function ProfileImageCropper({
  image,
  onCancel,
  onConfirm,
}: Props) {
  if (!image) {
    return null;
  }

  return (
    <Modal
      visible={Boolean(image)}
      animationType="slide"
      transparent={false}
      statusBarTranslucent
      onRequestClose={onCancel}
    >
      <View style={styles.container}>
        <StatusBar barStyle="light-content" backgroundColor="#080818" />

        <TouchableOpacity
          style={styles.closeButton}
          onPress={onCancel}
        >
          <Text style={styles.closeText}>Cancel</Text>
        </TouchableOpacity>

        <Text style={styles.title}>Confirm Profile Picture</Text>
        <Text style={styles.subtitle}>
          Review your cropped image before uploading it.
        </Text>

        <View style={styles.previewContainer}>
          <Image source={{ uri: image }} style={styles.preview} />
        </View>

        <Text style={styles.note}>
          Your selected image is ready to use as your profile picture.
        </Text>

        <TouchableOpacity
          style={styles.confirmButton}
          onPress={() => onConfirm(image)}
        >
          <Text style={styles.confirmText}>Confirm and Upload</Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={styles.retakeButton}
          onPress={onCancel}
        >
          <Text style={styles.retakeText}>Choose Another Photo</Text>
        </TouchableOpacity>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#080818',
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 28,
  },
  closeButton: {
    position: 'absolute',
    top: 65,
    left: 24,
    padding: 10,
  },
  closeText: {
    color: '#FFFFFF',
    fontSize: 15,
  },
  title: {
    color: '#FFFFFF',
    fontSize: 23,
    fontWeight: '700',
    textAlign: 'center',
    marginBottom: 8,
  },
  subtitle: {
    color: '#A8A8BC',
    fontSize: 14,
    textAlign: 'center',
    lineHeight: 21,
    marginBottom: 30,
  },
  previewContainer: {
    width: 240,
    height: 240,
    borderRadius: 120,
    overflow: 'hidden',
    borderWidth: 3,
    borderColor: '#FACC15',
    backgroundColor: '#17172B',
    marginBottom: 24,
  },
  preview: {
    width: '100%',
    height: '100%',
  },
  note: {
    color: '#A8A8BC',
    fontSize: 13,
    textAlign: 'center',
    lineHeight: 20,
    marginBottom: 30,
  },
  confirmButton: {
    width: '100%',
    backgroundColor: '#FACC15',
    borderRadius: 12,
    paddingVertical: 15,
    alignItems: 'center',
    marginBottom: 12,
  },
  confirmText: {
    color: '#080818',
    fontSize: 15,
    fontWeight: '700',
  },
  retakeButton: {
    width: '100%',
    borderWidth: 1,
    borderColor: '#393950',
    borderRadius: 12,
    paddingVertical: 14,
    alignItems: 'center',
  },
  retakeText: {
    color: '#FFFFFF',
    fontSize: 14,
    fontWeight: '600',
  },
});
