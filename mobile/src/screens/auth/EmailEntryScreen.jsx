import React, { useMemo, useState } from 'react';
import {
  View,
  StyleSheet,
  KeyboardAvoidingView,
  Platform,
  Image,
} from 'react-native';
import { Button, HelperText, Text, TextInput } from 'react-native-paper';
import { useAuth } from '../../context/AuthContext';

const isValidEmail = (value) => /\S+@\S+\.\S+/.test(value);

const EmailEntryScreen = ({ navigation }) => {
  const { checkUserExists, requestEmailOtp } = useAuth();
  const [email, setEmail] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const trimmedEmail = useMemo(() => email.trim().toLowerCase(), [email]);
  const isValid = isValidEmail(trimmedEmail);

  const handleContinue = async () => {
    setError('');

    if (!isValid) {
      setError('Please enter a valid email address.');
      return;
    }

    try {
      setLoading(true);
      const exists = await checkUserExists({ email: trimmedEmail });
      if (exists) {
        await requestEmailOtp({ email: trimmedEmail });
        navigation.navigate('OTPVerification', { email: trimmedEmail });
      } else {
        navigation.navigate('NameEntry', { email: trimmedEmail });
      }
    } catch (err) {
      setError(err?.message || 'Failed to continue. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <KeyboardAvoidingView
      style={styles.container}
      behavior={Platform.OS === 'ios' ? 'padding' : undefined}
    >
      <View style={styles.inner}>
        <View style={styles.brandRow}>
          <Image
            source={require('../../../assets/icon.png')}
            style={styles.logo}
          />
          <View>
            <Text style={styles.brandName}>CivicFix</Text>
            <Text style={styles.brandTagline}>Smarter streets. Safer journeys.</Text>
          </View>
        </View>

        <Text variant="headlineSmall" style={styles.title}>
          Enter your email
        </Text>
        <Text variant="bodyMedium" style={styles.subtitle}>
          We&apos;ll confirm whether you already have an account
        </Text>

        <TextInput
          label="Email address"
          value={email}
          onChangeText={setEmail}
          mode="outlined"
          keyboardType="email-address"
          autoCapitalize="none"
          style={styles.input}
        />

        {error ? <HelperText type="error">{error}</HelperText> : null}

        <Button
          mode="contained"
          onPress={handleContinue}
          loading={loading}
          disabled={!isValid || loading}
          style={styles.button}
        >
          Continue
        </Button>
      </View>
    </KeyboardAvoidingView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f7f7fb',
  },
  inner: {
    flex: 1,
    paddingHorizontal: 24,
    paddingTop: 72,
  },
  brandRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 16,
    marginBottom: 28,
    paddingVertical: 8,
  },
  logo: {
    width: 56,
    height: 56,
    borderRadius: 16,
  },
  brandName: {
    fontSize: 24,
    fontWeight: '800',
    color: '#111827',
    letterSpacing: 0.4,
  },
  brandTagline: {
    marginTop: 4,
    color: '#475569',
    fontSize: 13,
    fontWeight: '500',
  },
  title: {
    fontWeight: '700',
    color: '#0f172a',
  },
  subtitle: {
    marginTop: 6,
    marginBottom: 24,
    color: '#64748b',
  },
  input: {
    marginBottom: 12,
  },
  button: {
    marginTop: 8,
    paddingVertical: 4,
  },
});

export default EmailEntryScreen;
