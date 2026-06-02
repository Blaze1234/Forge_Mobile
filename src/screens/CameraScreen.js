import React, { useState, useRef, useEffect } from 'react';
import { View, Text, TouchableOpacity, StyleSheet, Alert, ActivityIndicator, ScrollView, TextInput } from 'react-native';
import { CameraView, useCameraPermissions } from 'expo-camera';
import * as ImagePicker from 'expo-image-picker';
import { Image } from 'react-native';
import { colors, spacing, radius, typography } from '../theme';
import { uploadPhoto } from '../store/supabase';
import { useProjects } from '../hooks';
import { useAppStore, ACTIONS, generateId } from '../store/AppContext';

// ── OCR: extract text from image using Google ML Kit via Expo ──────────────────
// We use the TextRecognition from expo-modules — included via bare workflow
// For managed workflow we use a fetch-based approach with Supabase Edge Function
// or fall back to manual text entry
async function recognizeText(uri) {
  try {
    // Try to dynamically load expo-text-recognition if available
    const { default: TextRecognition } = await import('@react-native-ml-kit/text-recognition');
    const result = await TextRecognition.recognize(uri);
    return result.text;
  } catch {
    // Not available in Expo Go — return null to show manual input
    return null;
  }
}

export default function CameraScreen({ navigation, route }) {
  const { projectId, taskId, noteId, mode = 'photo' } = route?.params ?? {};
  const [permission, requestPermission] = useCameraPermissions();
  const [step, setStep]       = useState('capture');   // 'capture' | 'preview' | 'scan-result'
  const [imageUri, setImageUri] = useState(null);
  const [scannedText, setScannedText] = useState('');
  const [isScanning, setIsScanning]   = useState(false);
  const [isUploading, setIsUploading] = useState(false);
  const [noteTitle, setNoteTitle]     = useState('Scanned Note');
  const cameraRef = useRef(null);

  const { projects } = useProjects();
  const { state, dispatch } = useAppStore();
  const [targetProjectId, setTargetProjectId] = useState(projectId ?? projects[0]?.id ?? null);
  const [targetTaskId, setTargetTaskId]       = useState(taskId ?? null);

  useEffect(() => {
    if (!permission?.granted) requestPermission();
  }, []);

  const takePicture = async () => {
    if (!cameraRef.current) return;
    try {
      const photo = await cameraRef.current.takePictureAsync({ quality: 0.8, base64: false });
      setImageUri(photo.uri);
      setStep('preview');
    } catch (e) {
      Alert.alert('Error', 'Could not take photo. ' + e.message);
    }
  };

  const pickFromLibrary = async () => {
    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ImagePicker.MediaTypeOptions.Images,
      quality: 0.8,
    });
    if (!result.canceled && result.assets[0]) {
      setImageUri(result.assets[0].uri);
      setStep('preview');
    }
  };

  // Upload photo and attach to note/task
  const handleAttachPhoto = async () => {
    if (!imageUri) return;
    setIsUploading(true);
    try {
      const url = await uploadPhoto(imageUri);
      if (!url) throw new Error('Upload failed');

      if (noteId) {
        // Attach to existing note
        const note = state.notes.find(n => n.id === noteId);
        if (note) {
          dispatch({ type: ACTIONS.UPDATE_NOTE, payload: { id: noteId, photos: [...(note.photos ?? []), url] } });
        }
      } else if (taskId) {
        // Create a new task note with the photo
        dispatch({ type: ACTIONS.ADD_NOTE, payload: { taskId, title: 'Photo', text: '', photos: [url] } });
      } else if (targetProjectId) {
        // Create a new project note with the photo
        dispatch({ type: ACTIONS.ADD_NOTE, payload: { projectId: targetProjectId, title: 'Photo', text: '', photos: [url] } });
      }

      Alert.alert('Done!', 'Photo attached successfully.', [{ text: 'OK', onPress: () => navigation.goBack() }]);
    } catch (e) {
      Alert.alert('Upload failed', e.message);
    } finally {
      setIsUploading(false);
    }
  };

  // Scan handwritten note
  const handleScanText = async () => {
    if (!imageUri) return;
    setIsScanning(true);
    const text = await recognizeText(imageUri);
    setIsScanning(false);
    if (text) {
      setScannedText(text);
      setStep('scan-result');
    } else {
      // ML Kit not available — show manual input
      setScannedText('');
      setStep('scan-result');
      Alert.alert(
        'Text recognition unavailable',
        'ML Kit is not available in Expo Go. You can type the text manually below, or build a standalone app to enable on-device OCR.',
        [{ text: 'OK' }]
      );
    }
  };

  // Save scanned/typed text as a note
  const handleSaveNote = async () => {
    if (!scannedText.trim() && !imageUri) return;
    setIsUploading(true);
    try {
      let photoUrl = null;
      if (imageUri) photoUrl = await uploadPhoto(imageUri);

      const payload = {
        title: noteTitle || 'Scanned Note',
        text:  scannedText,
        photos: photoUrl ? [photoUrl] : [],
      };

      if (taskId) {
        dispatch({ type: ACTIONS.ADD_NOTE, payload: { taskId, ...payload } });
      } else {
        dispatch({ type: ACTIONS.ADD_NOTE, payload: { projectId: targetProjectId, ...payload } });
      }

      Alert.alert('Saved!', 'Note saved successfully.', [{ text: 'OK', onPress: () => navigation.goBack() }]);
    } catch (e) {
      Alert.alert('Error', e.message);
    } finally {
      setIsUploading(false);
    }
  };

  if (!permission) return <View style={styles.container}><ActivityIndicator /></View>;

  if (!permission.granted) {
    return (
      <View style={[styles.container, { alignItems: 'center', justifyContent: 'center', padding: 32 }]}>
        <Text style={{ fontSize: 40, marginBottom: 16 }}>📷</Text>
        <Text style={[typography.h2, { textAlign: 'center', marginBottom: 8 }]}>Camera Access Needed</Text>
        <Text style={{ color: colors.textMuted, textAlign: 'center', marginBottom: 24 }}>
          Forge needs camera access to take photos and scan handwritten notes.
        </Text>
        <TouchableOpacity onPress={requestPermission} style={{ backgroundColor: colors.accent, paddingHorizontal: 24, paddingVertical: 12, borderRadius: radius.md }}>
          <Text style={{ color: colors.white, fontWeight: '600' }}>Grant Access</Text>
        </TouchableOpacity>
      </View>
    );
  }

  // ── Scan result / manual text entry ─────────────────────────────────────────
  if (step === 'scan-result') {
    return (
      <ScrollView style={styles.container} contentContainerStyle={{ padding: spacing.lg }}>
        <Text style={[typography.h2, { marginBottom: spacing.sm }]}>Scanned Note</Text>

        {imageUri && (
          <Image source={{ uri: imageUri }} style={{ width: '100%', height: 200, borderRadius: radius.md, marginBottom: spacing.md, resizeMode: 'cover' }} />
        )}

        <Text style={styles.label}>Note Title</Text>
        <TextInput
          style={styles.input}
          value={noteTitle}
          onChangeText={setNoteTitle}
          placeholder="Title"
          placeholderTextColor={colors.textPlaceholder}
        />

        <Text style={styles.label}>Text {scannedText ? '(edit if needed)' : '(type manually)'}</Text>
        <TextInput
          style={[styles.input, { height: 200, textAlignVertical: 'top' }]}
          value={scannedText}
          onChangeText={setScannedText}
          placeholder="Type your note here..."
          placeholderTextColor={colors.textPlaceholder}
          multiline
          autoFocus={!scannedText}
        />

        <View style={{ flexDirection: 'row', gap: spacing.sm }}>
          <TouchableOpacity
            onPress={() => { setStep('preview'); setScannedText(''); }}
            style={[styles.btn, { flex: 1, backgroundColor: colors.bgAlt }]}
          >
            <Text style={{ color: colors.textMuted, fontWeight: '500', textAlign: 'center' }}>Retake</Text>
          </TouchableOpacity>
          <TouchableOpacity
            onPress={handleSaveNote}
            disabled={isUploading}
            style={[styles.btn, { flex: 2, backgroundColor: colors.accent }]}
          >
            {isUploading ? <ActivityIndicator color={colors.white} /> : (
              <Text style={{ color: colors.white, fontWeight: '600', textAlign: 'center' }}>Save Note</Text>
            )}
          </TouchableOpacity>
        </View>
      </ScrollView>
    );
  }

  // ── Preview ──────────────────────────────────────────────────────────────────
  if (step === 'preview') {
    return (
      <View style={styles.container}>
        <Image source={{ uri: imageUri }} style={{ flex: 1, resizeMode: 'contain' }} />
        <View style={styles.previewActions}>
          <TouchableOpacity onPress={() => setStep('capture')} style={[styles.btn, { flex: 1, backgroundColor: colors.bgAlt }]}>
            <Text style={{ color: colors.textPrimary, fontWeight: '500', textAlign: 'center' }}>Retake</Text>
          </TouchableOpacity>

          {mode === 'scan' ? (
            <TouchableOpacity onPress={handleScanText} disabled={isScanning} style={[styles.btn, { flex: 2, backgroundColor: colors.accent }]}>
              {isScanning ? <ActivityIndicator color={colors.white} /> : (
                <Text style={{ color: colors.white, fontWeight: '600', textAlign: 'center' }}>✦ Scan Text</Text>
              )}
            </TouchableOpacity>
          ) : (
            <TouchableOpacity onPress={handleAttachPhoto} disabled={isUploading} style={[styles.btn, { flex: 2, backgroundColor: colors.accent }]}>
              {isUploading ? <ActivityIndicator color={colors.white} /> : (
                <Text style={{ color: colors.white, fontWeight: '600', textAlign: 'center' }}>Attach Photo</Text>
              )}
            </TouchableOpacity>
          )}
        </View>
      </View>
    );
  }

  // ── Capture ──────────────────────────────────────────────────────────────────
  return (
    <View style={styles.container}>
      <CameraView ref={cameraRef} style={{ flex: 1 }} facing="back">
        <View style={styles.cameraOverlay}>
          {/* Mode indicator */}
          <View style={{ alignItems: 'center', paddingTop: 60 }}>
            <View style={{ backgroundColor: 'rgba(0,0,0,0.5)', borderRadius: radius.full, paddingHorizontal: 16, paddingVertical: 8 }}>
              <Text style={{ color: colors.white, fontSize: 13, fontWeight: '500' }}>
                {mode === 'scan' ? '✦ Scan Handwritten Note' : '📷 Take Photo'}
              </Text>
            </View>
          </View>

          {/* Viewfinder guide for scan mode */}
          {mode === 'scan' && (
            <View style={{ flex: 1, alignItems: 'center', justifyContent: 'center' }}>
              <View style={{ width: 280, height: 180, borderWidth: 2, borderColor: 'rgba(255,255,255,0.6)', borderRadius: radius.md }} />
              <Text style={{ color: 'rgba(255,255,255,0.7)', marginTop: 10, fontSize: 12 }}>Align handwritten text in the frame</Text>
            </View>
          )}

          {/* Controls */}
          <View style={styles.cameraControls}>
            <TouchableOpacity onPress={pickFromLibrary} style={styles.cameraBtn}>
              <Text style={{ fontSize: 28 }}>🖼</Text>
              <Text style={{ color: colors.white, fontSize: 11, marginTop: 2 }}>Library</Text>
            </TouchableOpacity>

            <TouchableOpacity onPress={takePicture} style={styles.shutterBtn} />

            <TouchableOpacity onPress={() => navigation.goBack()} style={styles.cameraBtn}>
              <Text style={{ fontSize: 28 }}>✕</Text>
              <Text style={{ color: colors.white, fontSize: 11, marginTop: 2 }}>Cancel</Text>
            </TouchableOpacity>
          </View>
        </View>
      </CameraView>
    </View>
  );
}

const styles = StyleSheet.create({
  container:        { flex: 1, backgroundColor: colors.bgPage },
  cameraOverlay:    { flex: 1, justifyContent: 'space-between' },
  cameraControls:   { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-around', paddingHorizontal: 40, paddingBottom: 50, paddingTop: 20, backgroundColor: 'rgba(0,0,0,0.3)' },
  cameraBtn:        { alignItems: 'center' },
  shutterBtn:       { width: 72, height: 72, borderRadius: 36, backgroundColor: colors.white, borderWidth: 4, borderColor: 'rgba(255,255,255,0.5)' },
  previewActions:   { flexDirection: 'row', gap: spacing.sm, padding: spacing.lg, backgroundColor: colors.bgPage },
  btn:              { paddingVertical: 14, borderRadius: radius.md, alignItems: 'center', justifyContent: 'center' },
  label:            { fontSize: 12, fontWeight: '500', color: colors.textMuted, marginBottom: 5 },
  input:            { backgroundColor: colors.bgInput, borderWidth: 1, borderColor: colors.borderMed, borderRadius: radius.md, padding: spacing.md, fontSize: 14, color: colors.textPrimary, marginBottom: spacing.md },
});
