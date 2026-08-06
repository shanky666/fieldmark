import React, { useState } from 'react';
import { View, Text, StyleSheet, TextInput, TouchableOpacity, Image, Alert, ActivityIndicator, ScrollView } from 'react-native';
import * as ImagePicker from 'expo-image-picker';
import { StackNavigationProp } from '@react-navigation/stack';
import { useTranslation } from 'react-i18next';
import * as FileSystem from 'expo-file-system';

import { COLORS } from '../../constants/colors';
import { apiClient } from '../../api/client';
import { useAuthStore } from '../../store/auth';
import { WorkerStackParamList } from '../../navigation/WorkerNavigator';

type NewGrievanceNavigationProp = StackNavigationProp<WorkerStackParamList, 'NewGrievance'>;

interface NewGrievanceProps {
  navigation: NewGrievanceNavigationProp;
}

export default function NewGrievance({ navigation }: NewGrievanceProps) {
  const { t } = useTranslation();
  const { userProfile } = useAuthStore();

  const [subject, setSubject] = useState('');
  const [message, setMessage] = useState('');
  const [photoUri, setPhotoUri] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);

  const selectPhoto = async () => {
    try {
      const permission = await ImagePicker.requestMediaLibraryPermissionsAsync();
      if (!permission.granted) {
        Alert.alert("Permission Denied", "Photo access is required to attach images.");
        return;
      }

      const result = await ImagePicker.launchImageLibraryAsync({
        mediaTypes: ImagePicker.MediaTypeOptions.Images,
        allowsEditing: true,
        quality: 0.8
      });

      if (!result.canceled && result.assets?.[0]?.uri) {
        setPhotoUri(result.assets[0].uri);
      }
    } catch (e) {
      Alert.alert("Error", "Failed to select photo.");
    }
  };

  const handleSend = async () => {
    if (!subject || !message) {
      Alert.alert(t('common.error'), "Please write a subject and message.");
      return;
    }

    setSubmitting(true);
    try {
      let attachmentUrl = null;

      // If attachment exists, upload first
      if (photoUri) {
        const presignRes = await apiClient.post('/api/s3/presign/', {
          filename: 'grievance.jpg',
          content_type: 'image/jpeg'
        });
        const { upload_url, s3_key } = presignRes.data;

        const uploadRes = await FileSystem.uploadAsync(upload_url, photoUri, {
          httpMethod: 'PUT',
          headers: { 'Content-Type': 'image/jpeg' },
          uploadType: FileSystem.FileSystemUploadType.BINARY_CONTENT
        });

        if (uploadRes.status === 200 || uploadRes.status === 201) {
          attachmentUrl = s3_key;
        }
      }

      // Post grievance message
      await apiClient.post('/api/grievances/', {
        subject,
        message,
        attachment_url: attachmentUrl
      });

      Alert.alert(t('common.success'), "Grievance message sent successfully.");
      navigation.goBack();
    } catch (error) {
      console.error("Grievance submission failed", error);
      Alert.alert(t('common.error'), "Failed to submit grievance. Please try again.");
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity style={styles.backBtn} onPress={() => navigation.goBack()}>
          <Text style={styles.backText}>← {t('common.back')}</Text>
        </TouchableOpacity>
        <Text style={styles.headerTitle}>{t('grievances.newTitle')}</Text>
      </View>

      <ScrollView contentContainerStyle={styles.scroll}>
        <View style={styles.card}>
          {/* Recipient */}
          <Text style={styles.inputLabel}>Routing Recipient</Text>
          <View style={styles.recipientBox}>
            <Text style={styles.recipientText}>
              Zone Supervisor (or default Support Coordinator)
            </Text>
          </View>

          {/* Subject */}
          <Text style={styles.inputLabel}>{t('grievances.subject')}</Text>
          <TextInput
            style={styles.input}
            placeholder="Subject heading"
            placeholderTextColor={COLORS.lightText}
            value={subject}
            onChangeText={setSubject}
          />

          {/* Message */}
          <Text style={styles.inputLabel}>{t('grievances.message')}</Text>
          <TextInput
            style={[styles.input, styles.textArea]}
            placeholder="Write your explanation here..."
            placeholderTextColor={COLORS.lightText}
            multiline
            numberOfLines={5}
            value={message}
            onChangeText={setMessage}
          />

          {/* Photo Attachment */}
          <Text style={styles.inputLabel}>Attachment (Optional)</Text>
          <TouchableOpacity style={styles.attachBtn} onPress={selectPhoto}>
            <Text style={styles.attachBtnText}>📸 {t('grievances.attachPhoto')}</Text>
          </TouchableOpacity>

          {photoUri && (
            <View style={styles.previewContainer}>
              <Image source={{ uri: photoUri }} style={styles.previewImage} />
              <TouchableOpacity style={styles.removePhoto} onPress={() => setPhotoUri(null)}>
                <Text style={styles.removePhotoText}>✕ Remove</Text>
              </TouchableOpacity>
            </View>
          )}

          <TouchableOpacity
            style={[styles.sendBtn, (!subject || !message) && styles.btnDisabled]}
            disabled={submitting || !subject || !message}
            onPress={handleSend}
          >
            {submitting ? (
              <ActivityIndicator size="small" color="#ffffff" />
            ) : (
              <Text style={styles.sendBtnText}>{t('grievances.send')}</Text>
            )}
          </TouchableOpacity>
        </View>
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f0faf0',
    paddingTop: 44,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 20,
    marginBottom: 16,
  },
  backBtn: {
    paddingVertical: 8,
    paddingRight: 12,
    minHeight: 44,
  },
  backText: {
    color: COLORS.primary,
    fontSize: 14,
    fontWeight: 'bold',
  },
  headerTitle: {
    fontSize: 16,
    fontWeight: 'bold',
    color: COLORS.primary,
    marginLeft: 8,
  },
  scroll: {
    paddingHorizontal: 20,
    paddingBottom: 40,
  },
  card: {
    backgroundColor: COLORS.white,
    borderRadius: 16,
    padding: 20,
    borderWidth: 1,
    borderColor: COLORS.border,
    shadowColor: '#000',
    shadowOpacity: 0.02,
    shadowOffset: { width: 0, height: 2 },
    shadowRadius: 4,
    elevation: 2,
  },
  inputLabel: {
    fontSize: 11,
    fontWeight: 'bold',
    color: COLORS.lightText,
    marginTop: 12,
    marginBottom: 6,
    textTransform: 'uppercase',
  },
  recipientBox: {
    backgroundColor: COLORS.secondary,
    borderWidth: 1,
    borderColor: COLORS.primary + '22',
    borderRadius: 8,
    padding: 12,
    marginBottom: 6,
  },
  recipientText: {
    fontSize: 13,
    color: COLORS.primary,
    fontWeight: '500',
  },
  input: {
    height: 44,
    borderWidth: 1,
    borderColor: COLORS.border,
    borderRadius: 8,
    paddingHorizontal: 12,
    fontSize: 14,
    color: COLORS.darkText,
    backgroundColor: COLORS.lightGray,
  },
  textArea: {
    height: 100,
    textAlignVertical: 'top',
    paddingVertical: 10,
  },
  attachBtn: {
    borderWidth: 1,
    borderColor: COLORS.primary,
    borderStyle: 'dashed',
    borderRadius: 8,
    paddingVertical: 10,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: COLORS.secondary + '33',
    minHeight: 44,
  },
  attachBtnText: {
    color: COLORS.primary,
    fontSize: 13,
    fontWeight: 'bold',
  },
  previewContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    marginTop: 12,
    backgroundColor: COLORS.lightGray,
    padding: 8,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: COLORS.border,
  },
  previewImage: {
    width: 60,
    height: 60,
    borderRadius: 6,
  },
  removePhoto: {
    paddingVertical: 6,
    paddingHorizontal: 10,
    borderRadius: 6,
    backgroundColor: '#fff1f2',
    borderWidth: 1,
    borderColor: '#fda4af',
  },
  removePhotoText: {
    color: COLORS.danger,
    fontSize: 11,
    fontWeight: 'bold',
  },
  sendBtn: {
    backgroundColor: COLORS.primary,
    height: 48,
    borderRadius: 8,
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 24,
    minHeight: 44,
  },
  btnDisabled: {
    backgroundColor: '#a8dba8',
  },
  sendBtnText: {
    color: '#ffffff',
    fontWeight: 'bold',
    fontSize: 14,
  },
});
