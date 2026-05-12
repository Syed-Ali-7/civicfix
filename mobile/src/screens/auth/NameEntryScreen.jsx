import React, { useMemo, useState } from 'react';
import {
  View,
  StyleSheet,
  KeyboardAvoidingView,
  Platform,
} from 'react-native';
import { Button, HelperText, Text, TextInput } from 'react-native-paper';
import { useAuth } from '../../context/AuthContext';

const NameEntryScreen = ({ route, navigation }) => {
  const { email } = route.params || {};
  const { requestEmailOtp } = useAuth();
  const [name, setName] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const trimmedName = useMemo(() => name.trim(), [name]);
  const isValid = trimmedName.length > 1 && !!email;

  const handleContinue = async () => {
    setError('');

    if (!email) {
      setError('Please restart verification.');
      return;
    }

    if (!isValid) {
      setError('Please enter your full name.');
      return;
    }

    try {
      setLoading(true);
      await requestEmailOtp({ name: trimmedName, email });
      navigation.navigate('OTPVerification', {
        name: trimmedName,
        email,
      });
    } catch (err) {
      setError(err?.message || 'Failed to send OTP. Please try again.');
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
        <Text variant="headlineSmall" style={styles.title}>
          Complete your profile
        </Text>
        <Text variant="bodyMedium" style={styles.subtitle}>
          Tell us your name to finish sign up
        </Text>

        <TextInput
          label="Full name"
          value={name}
          onChangeText={setName}
          mode="outlined"
          autoCapitalize="words"
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

export default NameEntryScreen;
