import React from 'react';
import {
  View,
  Text,
  StyleSheet,
  SafeAreaView,
  StatusBar,
  TouchableOpacity,
  Dimensions,
  Image,
} from 'react-native';
import { useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { useTheme } from '@/hooks/useTheme';
import { COLORS } from '@/constants/colors';
import { Button } from '@/components/ui';
import { useAuthStore } from '@/store/authStore';

const { height } = Dimensions.get('window');

export default function WelcomeScreen() {
  const router = useRouter();
  const { colors, isDark } = useTheme();
  const { signInWithGoogle, isLoading } = useAuthStore();

  const handleGoogle = async () => {
    try {
      await signInWithGoogle();
    } catch (error: any) {
      // Google OAuth opens browser; handle redirect in layout
    }
  };

  return (
    <SafeAreaView style={[styles.safe, { backgroundColor: colors.bg }]}>
      <StatusBar
        barStyle={isDark ? 'light-content' : 'dark-content'}
        backgroundColor={colors.bg}
      />

      {/* Background decoration */}
      <View style={[styles.bgBlob, { backgroundColor: COLORS.primaryMuted }]} />

      <View style={styles.container}>
        {/* Logo & Brand */}
        <View style={styles.hero}>
          <Image 
            source={require('../../../assets/images/logo.png')} 
            style={{ width: 180, height: 60, resizeMode: 'contain', marginBottom: 16 }} 
          />

          <Text style={[styles.tagline, { color: colors.textSecondary }]}>
            Smart money management{'\n'}for modern lives
          </Text>

          {/* Trust badges */}
          <View style={styles.badges}>
            {['256-bit Encrypted', 'Bank-Level Security', 'No Hidden Fees'].map(
              (badge) => (
                <View
                  key={badge}
                  style={[
                    styles.badge,
                    {
                      backgroundColor: isDark
                        ? COLORS.dark.bgMuted
                        : COLORS.light.bgMuted,
                      borderColor: isDark
                        ? COLORS.dark.border
                        : COLORS.light.border,
                    },
                  ]}
                >
                  <Ionicons
                    name="checkmark-circle"
                    size={12}
                    color={COLORS.accent}
                  />
                  <Text
                    style={[styles.badgeText, { color: colors.textSecondary }]}
                  >
                    {badge}
                  </Text>
                </View>
              )
            )}
          </View>
        </View>

        {/* CTA Section */}
        <View style={styles.cta}>
          {/* Google Button */}
          <TouchableOpacity
            style={[
              styles.googleBtn,
              {
                backgroundColor: isDark
                  ? COLORS.dark.bgCard
                  : COLORS.light.bgCard,
                borderColor: isDark
                  ? COLORS.dark.border
                  : COLORS.light.border,
              },
            ]}
            onPress={handleGoogle}
            activeOpacity={0.8}
            disabled={isLoading}
          >
            {/* Google Logo */}
            <Ionicons name="logo-google" size={20} color={colors.text} />
            <Text style={[styles.googleText, { color: colors.text }]}>
              Continue with Google
            </Text>
          </TouchableOpacity>

          {/* Divider */}
          <View style={styles.divider}>
            <View
              style={[
                styles.dividerLine,
                {
                  backgroundColor: isDark
                    ? COLORS.dark.border
                    : COLORS.light.border,
                },
              ]}
            />
            <Text style={[styles.dividerText, { color: colors.textMuted }]}>
              or
            </Text>
            <View
              style={[
                styles.dividerLine,
                {
                  backgroundColor: isDark
                    ? COLORS.dark.border
                    : COLORS.light.border,
                },
              ]}
            />
          </View>

          {/* Email buttons */}
          <View style={styles.emailButtons}>
            <Button
              size="lg"
              onPress={() => router.push('/(auth)/login')}
            >
              Log In
            </Button>
            <Button
              size="lg"
              variant="outline"
              onPress={() => router.push('/(auth)/signup')}
            >
              Create Account
            </Button>
          </View>

          <Text style={[styles.terms, { color: colors.textMuted }]}>
            By continuing, you agree to our{' '}
            <Text style={{ color: COLORS.primary }}>Terms of Service</Text> and{' '}
            <Text style={{ color: COLORS.primary }}>Privacy Policy</Text>
          </Text>
        </View>
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1 },
  bgBlob: {
    position: 'absolute',
    top: -height * 0.15,
    right: -80,
    width: 320,
    height: 320,
    borderRadius: 160,
    opacity: 0.35,
  },
  container: {
    flex: 1,
    paddingHorizontal: 24,
    justifyContent: 'space-between',
    paddingBottom: 32,
    paddingTop: 32,
  },
  hero: {
    alignItems: 'center',
    paddingTop: height * 0.06,
    gap: 16,
  },
  tagline: {
    fontSize: 17,
    textAlign: 'center',
    lineHeight: 26,
    letterSpacing: -0.3,
  },
  badges: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
    justifyContent: 'center',
    marginTop: 8,
  },
  badge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: 20,
    borderWidth: 1,
  },
  badgeText: {
    fontSize: 11,
    fontWeight: '500',
  },
  cta: {
    gap: 14,
  },
  googleBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 10,
    borderRadius: 14,
    borderWidth: 1.5,
    paddingVertical: 16,
    paddingHorizontal: 20,
  },
  googleText: {
    fontSize: 15,
    fontWeight: '600',
    letterSpacing: -0.2,
  },
  divider: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    marginVertical: 2,
  },
  dividerLine: {
    flex: 1,
    height: 1,
  },
  dividerText: {
    fontSize: 13,
    fontWeight: '500',
  },
  emailButtons: {
    gap: 12,
  },
  terms: {
    fontSize: 11,
    textAlign: 'center',
    lineHeight: 18,
    marginTop: 4,
  },
});
