import React, { useState } from 'react';
import {
  View, Text, StyleSheet, ScrollView, TouchableOpacity,
  TextInput, KeyboardAvoidingView, Platform, Alert, Image,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import { useTheme } from '@/hooks/useTheme';
import { COLORS } from '@/constants/colors';
import { useAuthStore } from '@/store/authStore';
import { ScreenWrapper } from '@/components/ScreenWrapper';
import { supabase } from '@/lib/supabase';
import * as ImagePicker from 'expo-image-picker';
import { decode } from 'base64-arraybuffer';

export default function EditProfileScreen() {
  const { colors, isDark } = useTheme();
  const router = useRouter();
  const { user } = useAuthStore();

  const [fullName, setFullName] = useState(user?.user_metadata?.full_name ?? '');
  const [avatarUrl, setAvatarUrl] = useState(user?.user_metadata?.avatar_url ?? null);
  const [isSaving, setIsSaving] = useState(false);

  const avatarLetter = (fullName[0] ?? user?.email?.[0] ?? '?').toUpperCase();

  const handlePickImage = async () => {
    try {
      const result = await ImagePicker.launchImageLibraryAsync({
        mediaTypes: ImagePicker.MediaTypeOptions.Images,
        allowsEditing: true,
        aspect: [1, 1],
        quality: 0.5,
        base64: true,
      });

      if (!result.canceled && result.assets[0].base64) {
        setIsSaving(true);
        const base64Str = result.assets[0].base64;
        const fileExt = result.assets[0].uri.split('.').pop() || 'jpg';
        const fileName = `${user?.id}-${Date.now()}.${fileExt}`;

        // Upload to Supabase storage
        const { error: uploadError } = await supabase.storage
          .from('avatars')
          .upload(fileName, decode(base64Str), {
            contentType: `image/${fileExt === 'jpg' ? 'jpeg' : fileExt}`,
          });

        if (uploadError) {
          Alert.alert('Upload Error', uploadError.message);
          setIsSaving(false);
          return;
        }

        const { data: { publicUrl } } = supabase.storage
          .from('avatars')
          .getPublicUrl(fileName);

        setAvatarUrl(publicUrl);
        setIsSaving(false);
      }
    } catch (err: any) {
      setIsSaving(false);
      Alert.alert('Error', err.message);
    }
  };

  const handleSave = async () => {
    if (!fullName.trim()) {
      Alert.alert('Invalid Name', 'Please enter your name.');
      return;
    }
    setIsSaving(true);
    const { error } = await supabase.auth.updateUser({
      data: { 
        full_name: fullName.trim(),
        avatar_url: avatarUrl,
      },
    });
    setIsSaving(false);

    if (error) {
      Alert.alert('Error', error.message);
    } else {
      Alert.alert('Saved!', 'Your profile has been updated.', [
        { text: 'OK', onPress: () => router.back() },
      ]);
    }
  };

  return (
    <ScreenWrapper withBottomInset>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.back()} style={styles.backBtn}>
          <Ionicons name="arrow-back" size={24} color={colors.text} />
        </TouchableOpacity>
        <Text style={[styles.headerTitle, { color: colors.text }]}>Edit Profile</Text>
        <View style={{ width: 40 }} />
      </View>

      <KeyboardAvoidingView style={{ flex: 1 }} behavior="padding">
        <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={styles.scroll}>

          {/* Avatar */}
          <View style={styles.avatarSection}>
            <TouchableOpacity onPress={handlePickImage} disabled={isSaving}>
              {avatarUrl ? (
                <Image source={{ uri: avatarUrl }} style={styles.avatar} />
              ) : (
                <View style={[styles.avatar, { backgroundColor: `${COLORS.primary}20` }]}>
                  <Text style={[styles.avatarLetter, { color: COLORS.primary }]}>{avatarLetter}</Text>
                </View>
              )}
              <View style={[styles.editIconBadge, { backgroundColor: COLORS.primary, borderColor: isDark ? COLORS.dark.bgCard : '#FFF' }]}>
                <Ionicons name="camera" size={14} color="#FFF" />
              </View>
            </TouchableOpacity>
            <Text style={[styles.avatarHint, { color: colors.textMuted }]}>
              Tap to change profile picture
            </Text>
          </View>

          {/* Name */}
          <Text style={[styles.label, { color: colors.textSecondary }]}>DISPLAY NAME</Text>
          <TextInput
            style={[styles.input, {
              color: colors.text,
              borderColor: colors.border,
              backgroundColor: isDark ? COLORS.dark.bgMuted : COLORS.light.bgMuted,
            }]}
            placeholder="Your full name"
            placeholderTextColor={colors.textMuted}
            value={fullName}
            onChangeText={setFullName}
            autoCorrect={false}
          />

          {/* Email (read-only) */}
          <Text style={[styles.label, { color: colors.textSecondary }]}>EMAIL</Text>
          <View style={[styles.readOnly, {
            borderColor: colors.border,
            backgroundColor: isDark ? COLORS.dark.bgMuted : COLORS.light.bgMuted,
          }]}>
            <Text style={[styles.readOnlyText, { color: colors.textMuted }]}>{user?.email}</Text>
            <Ionicons name="lock-closed-outline" size={16} color={colors.textMuted} />
          </View>
          <Text style={[styles.hint, { color: colors.textMuted }]}>
            Email cannot be changed — it's managed by your login provider.
          </Text>

          <TouchableOpacity
            onPress={handleSave}
            disabled={isSaving}
            style={[styles.saveBtn, { backgroundColor: COLORS.primary }]}
          >
            <Text style={styles.saveBtnText}>{isSaving ? 'Saving…' : 'Save Changes'}</Text>
          </TouchableOpacity>

          <View style={{ height: 40 }} />
        </ScrollView>
      </KeyboardAvoidingView>
    </ScreenWrapper>
  );
}

const styles = StyleSheet.create({
  header: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingHorizontal: 16, paddingVertical: 12 },
  backBtn: { padding: 8 },
  headerTitle: { fontSize: 18, fontWeight: '700' },
  scroll: { paddingHorizontal: 20 },
  avatarSection: { alignItems: 'center', paddingVertical: 28, gap: 12 },
  avatar: { width: 80, height: 80, borderRadius: 24, alignItems: 'center', justifyContent: 'center' },
  avatarLetter: { fontSize: 32, fontWeight: '800' },
  editIconBadge: { position: 'absolute', bottom: 0, right: 0, width: 28, height: 28, borderRadius: 14, alignItems: 'center', justifyContent: 'center', borderWidth: 3 },
  avatarHint: { fontSize: 12, textAlign: 'center' },
  label: { fontSize: 11, fontWeight: '700', letterSpacing: 0.5, marginBottom: 8, marginTop: 4 },
  input: { borderWidth: 1.5, borderRadius: 12, paddingHorizontal: 14, paddingVertical: 13, fontSize: 15, marginBottom: 16 },
  readOnly: { borderWidth: 1.5, borderRadius: 12, paddingHorizontal: 14, paddingVertical: 13, flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginBottom: 6 },
  readOnlyText: { fontSize: 15 },
  hint: { fontSize: 12, marginBottom: 24 },
  saveBtn: { padding: 16, borderRadius: 14, alignItems: 'center' },
  saveBtnText: { color: '#FFF', fontWeight: '800', fontSize: 16 },
});
