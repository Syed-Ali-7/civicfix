import React, { useEffect, useRef } from 'react';
import { Provider as PaperProvider } from 'react-native-paper';
import { LogBox } from 'react-native';
import { AuthProvider } from './src/context/AuthContext';
import { useAuth } from './src/context/AuthContext';
import AppNavigator from './src/navigation/AppNavigator';
import * as Notifications from 'expo-notifications';
import api from './src/utils/api';

// Local-only notifications (polling). No remote push used in Expo Go.
Notifications.setNotificationHandler({
  handleNotification: async () => ({
    shouldShowAlert: true,
    shouldPlaySound: true,
    shouldSetBadge: true,
  }),
});

LogBox.ignoreLogs([
  'expo-notifications: Android Push notifications (remote notifications) functionality provided by expo-notifications was removed from Expo Go',
  '`expo-notifications` functionality is not fully supported in Expo Go',
]);

const NotificationBootstrap = () => {
  const { token } = useAuth();
  const previousStatusesRef = useRef(new Map());
  const hasInitializedRef = useRef(false);

  useEffect(() => {
    const requestPermissions = async () => {
      try {
        await Notifications.requestPermissionsAsync();
      } catch (error) {
        console.warn('Notification permission request failed', error?.message || error);
      }
    };

    requestPermissions();
  }, []);

  useEffect(() => {
    if (!token) {
      previousStatusesRef.current = new Map();
      hasInitializedRef.current = false;
      return undefined;
    }

    let intervalId;

    const scheduleLocalNotification = async (title, body, issueId) => {
      await Notifications.scheduleNotificationAsync({
        content: {
          title,
          body,
          data: { issueId, screen: 'IssueDetail' },
        },
        trigger: null,
      });
    };

    const pollIssues = async () => {
      try {
        const { data } = await api.get('/api/issues', {
          headers: { Authorization: `Bearer ${token}` },
        });

        const issues = Array.isArray(data) ? data : data?.issues || [];
        const nextStatuses = new Map();

        for (const issue of issues) {
          if (!issue?.id) continue;
          const currentStatus = issue.status;
          const previousStatus = previousStatusesRef.current.get(issue.id);

          if (
            hasInitializedRef.current &&
            previousStatus &&
            previousStatus !== currentStatus
          ) {
            if (currentStatus === 'Escalated') {
              await scheduleLocalNotification(
                'Issue Update',
                'Your pothole report has been escalated to a senior officer for faster resolution.',
                issue.id
              );
            }

            if (currentStatus === 'Resolved') {
              await scheduleLocalNotification(
                'Issue Resolved',
                'Your pothole report has been resolved. Please confirm if the issue is fixed.',
                issue.id
              );
            }
          }

          nextStatuses.set(issue.id, currentStatus);
        }

        previousStatusesRef.current = nextStatuses;
        if (!hasInitializedRef.current) {
          hasInitializedRef.current = true;
        }
      } catch (error) {
        console.warn('Issue polling failed', error?.message || error);
      }
    };

    pollIssues();
    intervalId = setInterval(pollIssues, 30000);

    return () => {
      if (intervalId) clearInterval(intervalId);
    };
  }, [token]);

  return null;
};

export default function App() {
  return (
    <PaperProvider>
      <AuthProvider>
        <NotificationBootstrap />
        <AppNavigator />
      </AuthProvider>
    </PaperProvider>
  );
}
