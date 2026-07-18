import type { NativeStackScreenProps } from '@react-navigation/native-stack';
import { WorkVolumeUnit, type GeoPoint, type ReportDraft } from '@spectech/shared-types';
import * as Crypto from 'expo-crypto';
import * as ImagePicker from 'expo-image-picker';
import * as Location from 'expo-location';
import React, { useState } from 'react';
import {
  ActivityIndicator,
  Alert,
  Image,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from 'react-native';
import { useAuth } from '@/context/AuthContext';
import { useReportQueue } from '@/hooks/useReportQueue';
import type { RootStackParamList } from '@/navigation/types';

type Props = NativeStackScreenProps<RootStackParamList, 'ReportSubmission'>;

const UNIT_LABELS: Record<WorkVolumeUnit, string> = {
  [WorkVolumeUnit.HOURS]: 'Hours',
  [WorkVolumeUnit.CUBIC_METERS]: 'm³',
  [WorkVolumeUnit.TONS]: 'Tons',
  [WorkVolumeUnit.TRIPS]: 'Trips',
};

export default function ReportSubmissionScreen({ route, navigation }: Props) {
  const { dealId } = route.params;
  const { token } = useAuth();
  const { enqueue, sync } = useReportQueue(token);

  const [value, setValue] = useState('');
  const [unit, setUnit] = useState<WorkVolumeUnit>(WorkVolumeUnit.HOURS);
  const [engineHours, setEngineHours] = useState('');
  const [notes, setNotes] = useState('');
  const [photoUri, setPhotoUri] = useState<string | null>(null);
  const [gps, setGps] = useState<GeoPoint | null>(null);
  const [isCapturingLocation, setIsCapturingLocation] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handlePickPhoto = async () => {
    const permission = await ImagePicker.requestCameraPermissionsAsync();
    if (!permission.granted) {
      Alert.alert('Camera permission required', 'Enable camera access to attach a photo.');
      return;
    }
    const result = await ImagePicker.launchCameraAsync({ quality: 0.7 });
    if (!result.canceled && result.assets.length > 0) {
      setPhotoUri(result.assets[0].uri);
    }
  };

  const handleCaptureLocation = async () => {
    setIsCapturingLocation(true);
    try {
      const permission = await Location.requestForegroundPermissionsAsync();
      if (!permission.granted) {
        Alert.alert('Location permission required', 'Enable location access to tag this report.');
        return;
      }
      const position = await Location.getCurrentPositionAsync({});
      setGps({ lat: position.coords.latitude, lng: position.coords.longitude });
    } finally {
      setIsCapturingLocation(false);
    }
  };

  const handleSubmit = async () => {
    const numericValue = Number(value);
    if (!value || Number.isNaN(numericValue) || numericValue < 0) {
      Alert.alert('Invalid work volume', 'Enter a non-negative number.');
      return;
    }
    if (!gps) {
      Alert.alert('GPS required', 'Capture the current location before submitting.');
      return;
    }

    setIsSubmitting(true);
    try {
      // capturedAt is set here, at the moment of submission on-device — not
      // at sync time — because the whole point of the offline queue is that
      // sync may happen hours or days later; the report must record when the
      // work actually happened.
      const draft: ReportDraft = {
        clientReportId: Crypto.randomUUID(),
        dealId,
        capturedAt: new Date().toISOString(),
        gps,
        photoUrls: photoUri ? [photoUri] : [],
        workVolume: { value: numericValue, unit },
        engineHours: engineHours ? Number(engineHours) : undefined,
        notes: notes || undefined,
      };

      await enqueue(draft);
      sync().catch(() => {
        // Best-effort: submission has already succeeded locally regardless
        // of whether this opportunistic sync attempt reaches the server.
      });

      Alert.alert('Report queued', 'It will sync automatically or from the Pending screen.', [
        { text: 'OK', onPress: () => navigation.navigate('PendingReports') },
      ]);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <ScrollView style={styles.container} contentContainerStyle={styles.content}>
      <Text style={styles.label}>Work volume</Text>
      <TextInput
        style={styles.input}
        keyboardType="decimal-pad"
        value={value}
        onChangeText={setValue}
        placeholder="0"
      />
      <View style={styles.chipRow}>
        {Object.values(WorkVolumeUnit).map((option) => (
          <TouchableOpacity
            key={option}
            style={[styles.chip, unit === option && styles.chipSelected]}
            onPress={() => setUnit(option)}
          >
            <Text style={[styles.chipText, unit === option && styles.chipTextSelected]}>
              {UNIT_LABELS[option]}
            </Text>
          </TouchableOpacity>
        ))}
      </View>

      <Text style={styles.label}>Engine hours (optional)</Text>
      <TextInput
        style={styles.input}
        keyboardType="decimal-pad"
        value={engineHours}
        onChangeText={setEngineHours}
        placeholder="0"
      />

      <Text style={styles.label}>Notes (optional)</Text>
      <TextInput
        style={[styles.input, styles.notesInput]}
        value={notes}
        onChangeText={setNotes}
        multiline
        placeholder="Anything worth flagging..."
      />

      <TouchableOpacity style={styles.secondaryButton} onPress={handlePickPhoto}>
        <Text style={styles.secondaryButtonText}>
          {photoUri ? 'Retake photo' : 'Take photo'}
        </Text>
      </TouchableOpacity>
      {photoUri ? <Image source={{ uri: photoUri }} style={styles.photoPreview} /> : null}

      <TouchableOpacity style={styles.secondaryButton} onPress={handleCaptureLocation}>
        {isCapturingLocation ? (
          <ActivityIndicator />
        ) : (
          <Text style={styles.secondaryButtonText}>
            {gps ? 'Recapture GPS' : 'Capture GPS'}
          </Text>
        )}
      </TouchableOpacity>
      {gps ? (
        <Text style={styles.gpsText}>
          {gps.lat.toFixed(6)}, {gps.lng.toFixed(6)}
        </Text>
      ) : null}

      <TouchableOpacity
        style={[styles.submitButton, isSubmitting && styles.buttonDisabled]}
        onPress={handleSubmit}
        disabled={isSubmitting}
      >
        {isSubmitting ? (
          <ActivityIndicator color="#fff" />
        ) : (
          <Text style={styles.submitButtonText}>Submit report</Text>
        )}
      </TouchableOpacity>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#fff' },
  content: { padding: 16, paddingBottom: 48 },
  label: { fontSize: 14, color: '#444', marginTop: 16, marginBottom: 6 },
  input: {
    borderWidth: 1,
    borderColor: '#ccc',
    borderRadius: 8,
    paddingHorizontal: 12,
    paddingVertical: 10,
    fontSize: 16,
  },
  notesInput: { minHeight: 80, textAlignVertical: 'top' },
  chipRow: { flexDirection: 'row', flexWrap: 'wrap', marginTop: 8, gap: 8 },
  chip: {
    borderWidth: 1,
    borderColor: '#1a5276',
    borderRadius: 20,
    paddingHorizontal: 14,
    paddingVertical: 8,
  },
  chipSelected: { backgroundColor: '#1a5276' },
  chipText: { color: '#1a5276', fontSize: 14 },
  chipTextSelected: { color: '#fff' },
  secondaryButton: {
    marginTop: 16,
    borderWidth: 1,
    borderColor: '#1a5276',
    borderRadius: 8,
    paddingVertical: 12,
    alignItems: 'center',
  },
  secondaryButtonText: { color: '#1a5276', fontSize: 15, fontWeight: '600' },
  photoPreview: { width: '100%', height: 180, borderRadius: 8, marginTop: 12 },
  gpsText: { marginTop: 8, color: '#444', textAlign: 'center' },
  submitButton: {
    marginTop: 32,
    backgroundColor: '#1a5276',
    borderRadius: 8,
    paddingVertical: 16,
    alignItems: 'center',
  },
  buttonDisabled: { opacity: 0.6 },
  submitButtonText: { color: '#fff', fontSize: 16, fontWeight: '700' },
});
