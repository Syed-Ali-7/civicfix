import React, { useState } from 'react';
import { View, StyleSheet, KeyboardAvoidingView, Platform, TouchableOpacity } from 'react-native';
import { Button, TextInput, Text, HelperText } from 'react-native-paper';
import { useNavigation } from '@react-navigation/native';
import { useAuth } from '../context/AuthContext';

const LoginScreen = () => {
  const navigation = useNavigation();
  const { login } = useAuth();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  const handleLogin = async () => {
    const trimmedEmail = email.trim();
    const trimmedPassword = password.trim();
    
    if (!trimmedEmail || !trimmedPassword) {
      setError('Email and password are required');
      return;
    }

    if (!trimmedEmail.includes('@')) {
      setError('Please enter a valid email address');
      return;
    }

    try {
      setLoading(true);
      setError(null);
      await login({ email: trimmedEmail, password: trimmedPassword });
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
          Welcome Back 👋
        </Text>
        <Text variant="bodyMedium" style={styles.subtitle}>
          Log in to report and track civic issues in your community.
        </Text>

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

        {error && <HelperText type="error">{error}</HelperText>}

        <Button mode="contained" onPress={handleLogin} loading={loading} style={styles.button}>
          Sign In
        </Button>

        <View style={styles.footerRow}>
          <Text>New here?</Text>
          <TouchableOpacity onPress={() => navigation.navigate('Signup')}>
            <Text style={styles.link}> Create an account</Text>
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
    paddingTop: 120,
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

export default LoginScreen;

