import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  SafeAreaView,
  KeyboardAvoidingView,
  Platform,
  ScrollView,
  TouchableOpacity,
  StatusBar,
  Alert,
  Image,
} from 'react-native';
import { useRouter } from 'expo-router';
import { useForm, Controller } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { Ionicons } from '@expo/vector-icons';
import { useTheme } from '@/hooks/useTheme';
import { COLORS } from '@/constants/colors';
import { Button, Input } from '@/components/ui';
import { useAuthStore } from '@/store/authStore';
import { signupSchema, SignupFormData } from '@/schemas/auth';

export default function SignupScreen() {
  const router = useRouter();
  const { colors, isDark } = useTheme();
  const { signUpWithEmail, isLoading } = useAuthStore();
  const [showPassword, setShowPassword] = useState(false);

  const {
    control,
    handleSubmit,
    formState: { errors },
  } = useForm<SignupFormData>({
    resolver: zodResolver(signupSchema),
    defaultValues: { full_name: '', email: '', password: '' },
  });

  const onSubmit = async (data: SignupFormData) => {
    try {
      await signUpWithEmail(data.email, data.password, data.full_name);
      Alert.alert(
        '🎉 Account Created!',
        'Welcome to Finora! Please check your email to verify your account.',
        [{ text: 'Continue', onPress: () => router.replace('/(tabs)/home') }]
      );
    } catch (error: any) {
      Alert.alert(
        'Signup Failed',
        error?.message ?? 'Something went wrong. Please try again.'
      );
    }
  };

  return (
    <SafeAreaView style={[styles.safe, { backgroundColor: colors.bg }]}>
      <StatusBar
        barStyle={isDark ? 'light-content' : 'dark-content'}
        backgroundColor={colors.bg}
      />

      <KeyboardAvoidingView
        behavior="padding"
        style={styles.kav}
      >
        <ScrollView
          contentContainerStyle={styles.scroll}
          keyboardShouldPersistTaps="handled"
          showsVerticalScrollIndicator={false}
        >
          {/* Back */}
          <TouchableOpacity onPress={() => router.back()} style={styles.backBtn}>
            <Ionicons name="arrow-back" size={22} color={colors.text} />
          </TouchableOpacity>

          {/* Header */}
          <View style={styles.header}>
            <Image 
              source={require('../../../assets/images/logo.png')} 
              style={[styles.logoSmall, { resizeMode: 'contain' }]} 
            />
            <Text style={[styles.title, { color: colors.text, marginTop: 8 }]}>
              Create account
            </Text>
            <Text style={[styles.subtitle, { color: colors.textSecondary }]}>
              Start managing money the smart way
            </Text>
          </View>

          {/* Form */}
          <View style={styles.form}>
            <Controller
              control={control}
              name="full_name"
              render={({ field: { value, onChange, onBlur } }) => (
                <Input
                  label="Full name"
                  placeholder="Muazzam Ali"
                  autoCapitalize="words"
                  autoComplete="name"
                  value={value}
                  onChangeText={onChange}
                  onBlur={onBlur}
                  leftIcon="person-outline"
                  error={errors.full_name?.message}
                />
              )}
            />

            <Controller
              control={control}
              name="email"
              render={({ field: { value, onChange, onBlur } }) => (
                <Input
                  label="Email address"
                  placeholder="you@example.com"
                  keyboardType="email-address"
                  autoCapitalize="none"
                  autoComplete="email"
                  value={value}
                  onChangeText={onChange}
                  onBlur={onBlur}
                  leftIcon="mail-outline"
                  error={errors.email?.message}
                />
              )}
            />

            <Controller
              control={control}
              name="password"
              render={({ field: { value, onChange, onBlur } }) => (
                <Input
                  label="Password"
                  placeholder="Min 8 chars, uppercase, number, special"
                  secureTextEntry={!showPassword}
                  autoComplete="new-password"
                  value={value}
                  onChangeText={onChange}
                  onBlur={onBlur}
                  leftIcon="lock-closed-outline"
                  rightIcon={showPassword ? 'eye-off-outline' : 'eye-outline'}
                  onRightIconPress={() => setShowPassword((v) => !v)}
                  error={errors.password?.message}
                />
              )}
            />

            {/* Password hints */}
            <View style={styles.passwordHints}>
              {[
                'At least 8 characters',
                'One uppercase & lowercase',
                'One number & special char',
              ].map((hint) => (
                <View key={hint} style={styles.hint}>
                  <Ionicons
                    name="ellipse"
                    size={4}
                    color={colors.textMuted}
                  />
                  <Text style={[styles.hintText, { color: colors.textMuted }]}>
                    {hint}
                  </Text>
                </View>
              ))}
            </View>

            <Button size="lg" loading={isLoading} onPress={handleSubmit(onSubmit)}>
              Create Account
            </Button>
          </View>

          {/* Footer */}
          <View style={styles.footer}>
            <Text style={[styles.footerText, { color: colors.textSecondary }]}>
              Already have an account?{' '}
            </Text>
            <TouchableOpacity onPress={() => router.replace('/(auth)/login')}>
              <Text style={[styles.footerLink, { color: COLORS.primary }]}>
                Log in
              </Text>
            </TouchableOpacity>
          </View>
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1 },
  kav: { flex: 1 },
  scroll: {
    flexGrow: 1,
    paddingHorizontal: 24,
    paddingBottom: 40,
  },
  backBtn: {
    marginTop: 8,
    width: 40,
    height: 40,
    alignItems: 'center',
    justifyContent: 'center',
  },
  header: {
    alignItems: 'center',
    marginTop: 24,
    marginBottom: 36,
    gap: 10,
  },
  logoSmall: {
    width: 140,
    height: 48,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 4,
  },
  logoLetter: {
    fontSize: 24,
    fontWeight: '800',
    color: '#FFFFFF',
  },
  title: {
    fontSize: 28,
    fontWeight: '800',
    letterSpacing: -0.8,
  },
  subtitle: {
    fontSize: 15,
    letterSpacing: -0.2,
  },
  form: {
    gap: 16,
  },
  passwordHints: {
    gap: 4,
    marginTop: -4,
    paddingLeft: 4,
  },
  hint: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  hintText: {
    fontSize: 11,
    fontWeight: '400',
  },
  footer: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    marginTop: 32,
  },
  footerText: {
    fontSize: 14,
  },
  footerLink: {
    fontSize: 14,
    fontWeight: '700',
  },
});
