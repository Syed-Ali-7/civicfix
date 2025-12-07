import React, { useState } from 'react';
import { View, StyleSheet } from 'react-native';
import { Avatar, Button, Text, Divider, Snackbar } from 'react-native-paper';
import { useAuth } from '../context/AuthContext';

const ProfileScreen = () => {
  const { user, logout } = useAuth();
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState('');

  const handleLogout = async () => {
    try {
      setLoading(true);
      await logout();
    } catch (error) {
      setMessage(error.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <Avatar.Text
          size={80}
          label={user?.name?.[0]?.toUpperCase() || '?'}
          style={styles.avatar}
        />
        <Text variant="headlineSmall" style={styles.name}>
          {user?.name}
        </Text>
        <Text variant="bodyMedium" style={styles.email}>
          {user?.email}
        </Text>
        <Text variant="bodySmall" style={styles.role}>
          Role · {user?.role || 'citizen'}
        </Text>
      </View>

      <Divider style={styles.divider} />

      <View style={styles.section}>
        <Text variant="titleMedium" style={styles.sectionTitle}>
          Quick Actions
        </Text>
        <Button mode="contained" onPress={handleLogout} loading={loading} style={styles.button}>
          Sign Out
        </Button>
      </View>

      <View style={styles.section}>
        <Text variant="titleSmall" style={styles.sectionTitle}>
          Coming Soon
        </Text>
        <Text style={styles.caption}>
          Manage notification preferences, saved locations, and more right from this space.
        </Text>
      </View>

      <Snackbar visible={!!message} onDismiss={() => setMessage('')} duration={3000}>
        {message}
      </Snackbar>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f8fafc',
    paddingHorizontal: 24,
    paddingTop: 80,
  },
  header: {
    alignItems: 'center',
    gap: 8,
    marginBottom: 24,
  },
  avatar: {
    backgroundColor: '#2563eb',
  },
  name: {
    fontWeight: '700',
  },
  email: {
    color: '#475569',
  },
  role: {
    color: '#94a3b8',
  },
  divider: {
    marginVertical: 16,
  },
  section: {
    marginBottom: 24,
  },
  sectionTitle: {
    fontWeight: '600',
    marginBottom: 12,
  },
  button: {
    borderRadius: 12,
  },
  caption: {
    color: '#64748b',
    lineHeight: 20,
  },
});

export default ProfileScreen;

