import React, { useState } from 'react';
import { View, StyleSheet, KeyboardAvoidingView, Platform, TouchableOpacity } from 'react-native';
import { Button, TextInput, Text, HelperText } from 'react-native-paper';
import { useNavigation } from '@react-navigation/native';
import { useAuth } from '../context/AuthContext';

const SignupScreen = () => {
  const navigation = useNavigation();
  const { register } = useAuth();
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  const handleSignup = async () => {
    const trimmedName = name.trim();
    const trimmedEmail = email.trim();
    const trimmedPassword = password.trim();
    const trimmedConfirmPassword = confirmPassword.trim();
    
    if (!trimmedName || !trimmedEmail || !trimmedPassword) {
      setError('All fields are required');
      return;
    }

    if (!trimmedEmail.includes('@')) {
      setError('Please enter a valid email address');
      return;
    }

    if (trimmedPassword.length < 8) {
      setError('Password must be at least 8 characters long');
      return;
    }

    if (trimmedPassword !== trimmedConfirmPassword) {
      setError('Passwords do not match');
      return;
    }

    try {
      setLoading(true);
      setError(null);
      await register({ name: trimmedName, email: trimmedEmail, password: trimmedPassword });
    } catch (err) {
      setError(err.message);
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
        <Text variant="headlineLarge" style={styles.title}>
          Join CivicFix 🌱
        </Text>
        <Text variant="bodyMedium" style={styles.subtitle}>
          Create an account to start reporting issues and making a difference.
        </Text>

        <TextInput
          label="Full Name"
          value={name}
          onChangeText={setName}
          mode="outlined"
          style={styles.input}
        />

        <TextInput
          label="Email"
          value={email}
          onChangeText={setEmail}
          autoCapitalize="none"
          keyboardType="email-address"
          mode="outlined"
          style={styles.input}
        />

        <TextInput
          label="Password"
          value={password}
          onChangeText={setPassword}
          secureTextEntry
          mode="outlined"
          style={styles.input}
        />

        <TextInput
          label="Confirm Password"
          value={confirmPassword}
          onChangeText={setConfirmPassword}
          secureTextEntry
          mode="outlined"
          style={styles.input}
        />

        {error && <HelperText type="error">{error}</HelperText>}

        <Button mode="contained" onPress={handleSignup} loading={loading} style={styles.button}>
          Create Account
        </Button>

        <View style={styles.footerRow}>
          <Text>Already have an account?</Text>
          <TouchableOpacity onPress={() => navigation.navigate('Login')}>
            <Text style={styles.link}> Log in</Text>
          </TouchableOpacity>
        </View>
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
    paddingTop: 80,
  },
  title: {
    fontWeight: '700',
  },
  subtitle: {
    marginTop: 8,
    marginBottom: 32,
    color: '#64748b',
  },
  input: {
    marginBottom: 16,
  },
  button: {
    marginTop: 8,
    paddingVertical: 4,
  },
  footerRow: {
    flexDirection: 'row',
    marginTop: 24,
    justifyContent: 'center',
  },
  link: {
    color: '#2563eb',
    fontWeight: '600',
  },
});

export default SignupScreen;

