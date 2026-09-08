import * as ImagePicker from 'expo-image-picker';
import { Alert } from 'react-native';

export type PickedImage = {
  uri: string;
  base64DataUri: string;
};

async function ensureLibraryPermission() {
  const current = await ImagePicker.getMediaLibraryPermissionsAsync();
  if (current.granted) return true;
  const asked = await ImagePicker.requestMediaLibraryPermissionsAsync();
  if (!asked.granted) {
    Alert.alert('Permission needed', 'Photo library access is required to attach images.');
    return false;
  }
  return true;
}

async function ensureCameraPermission() {
  const current = await ImagePicker.getCameraPermissionsAsync();
  if (current.granted) return true;
  const asked = await ImagePicker.requestCameraPermissionsAsync();
  if (!asked.granted) {
    Alert.alert('Permission needed', 'Camera access is required to capture photos.');
    return false;
  }
  return true;
}

function toPicked(asset: ImagePicker.ImagePickerAsset | undefined): PickedImage | null {
  if (!asset?.uri || !asset.base64) return null;
  const mime = asset.mimeType || 'image/jpeg';
  return {
    uri: asset.uri,
    base64DataUri: `data:${mime};base64,${asset.base64}`,
  };
}

export async function pickImageFromLibrary(): Promise<PickedImage | null> {
  if (!(await ensureLibraryPermission())) return null;
  const result = await ImagePicker.launchImageLibraryAsync({
    mediaTypes: ['images'],
    quality: 0.7,
    base64: true,
    allowsEditing: true,
  });
  if (result.canceled) return null;
  return toPicked(result.assets?.[0]);
}

export async function captureImageFromCamera(): Promise<PickedImage | null> {
  if (!(await ensureCameraPermission())) return null;
  const result = await ImagePicker.launchCameraAsync({
    mediaTypes: ['images'],
    quality: 0.7,
    base64: true,
    allowsEditing: true,
  });
  if (result.canceled) return null;
  return toPicked(result.assets?.[0]);
}

export function promptPickImage(onPicked: (img: PickedImage) => void) {
  Alert.alert('Attach photo', 'Choose image source', [
    {
      text: 'Camera',
      onPress: async () => {
        const img = await captureImageFromCamera();
        if (img) onPicked(img);
      },
    },
    {
      text: 'Gallery',
      onPress: async () => {
        const img = await pickImageFromLibrary();
        if (img) onPicked(img);
      },
    },
    { text: 'Cancel', style: 'cancel' },
  ]);
}
