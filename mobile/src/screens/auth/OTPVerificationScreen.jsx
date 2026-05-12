import React, { useEffect, useMemo, useState } from 'react';
import {
  View,
  StyleSheet,
  KeyboardAvoidingView,
  Platform,
} from 'react-native';
import { Button, HelperText, Text, TextInput } from 'react-native-paper';
import { useAuth } from '../../context/AuthContext';

const RESEND_SECONDS = 30;

const OTPVerificationScreen = ({ route, navigation }) => {
  const { name, email } = route.params || {};
  const { requestEmailOtp, verifyEmailOtp } = useAuth();
  const [otp, setOtp] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [resendSeconds, setResendSeconds] = useState(RESEND_SECONDS);
  const canResend = resendSeconds <= 0;

  useEffect(() => {
    const timer = setInterval(() => {
      setResendSeconds((prev) => (prev > 0 ? prev - 1 : 0));
    }, 1000);

    return () => clearInterval(timer);
  }, []);

  useEffect(() => {
    if (!email) {
      setError('Please restart verification.');
    }
  }, [email]);

  const otpValue = useMemo(() => otp.replace(/\D/g, '').slice(0, 6), [otp]);

  const handleVerify = async () => {
    if (otpValue.length !== 6) {
      setError('Please enter the 6 digit OTP.');
      return;
    }

    try {
      setLoading(true);
      setError('');
      await verifyEmailOtp({
        name,
        email,
        otp: otpValue,
      });
      navigation.reset({ index: 0, routes: [{ name: 'HomeTab' }] });
    } catch (err) {
      setError(err?.message || 'Invalid or expired OTP.');
    } finally {
      setLoading(false);
    }
  };

  const handleResend = async () => {
    if (!email || !canResend) return;

    try {
      setLoading(true);
      setError('');
      await requestEmailOtp({ name, email });
      setResendSeconds(RESEND_SECONDS);
    } catch (err) {
      setError(err?.message || 'Failed to resend OTP.');
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
          Verify OTP
        </Text>
        <Text style={styles.subtitle}>
          Code sent to {email || 'your email'}
        </Text>

        <TextInput
          label="6 digit OTP"
          value={otpValue}
          onChangeText={setOtp}
          mode="outlined"
          keyboardType="number-pad"
          maxLength={6}
          autoFocus
          style={styles.input}
        />

        {error ? <HelperText type="error">{error}</HelperText> : null}

        <Button
          mode="contained"
          onPress={handleVerify}
          loading={loading}
          disabled={otpValue.length !== 6 || loading}
          style={styles.button}
        >
          Verify
        </Button>

        <Button
          mode="text"
          onPress={handleResend}
          disabled={!canResend || loading}
          style={styles.resendButton}
        >
          {canResend ? 'Resend OTP' : `Resend in ${resendSeconds}s`}
        </Button>
      </View>
    </KeyboardAvoidingView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f8fafc',
  },
  inner: {
    flex: 1,
    paddingHorizontal: 24,
    paddingTop: 90,
  },
  title: {
    fontWeight: '700',
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
  resendButton: {
    marginTop: 16,
  },
});

export default OTPVerificationScreen;
