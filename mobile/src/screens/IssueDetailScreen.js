import React, { useState, useEffect } from "react";
import {
  View,
  StyleSheet,
  ScrollView,
  Image,
  ActivityIndicator,
  Modal,
} from "react-native";
import { Text, Button, Chip, Card, Snackbar } from "react-native-paper";
import { useRoute } from "@react-navigation/native";
import * as Location from "expo-location";
import * as ImagePicker from "expo-image-picker";
import api, { API_BASE_URL } from "../utils/api";

const STATUS_COLORS = {
  Open: "#f97316",
  Resolved: "#22c55e",
  Escalated: "#ef4444",
  Closed: "#16a34a",
  Reopened: "#dc2626",
};

const distanceMeters = (a, b) => {
  const toRad = (deg) => (deg * Math.PI) / 180;
  const earth = 6371000;

  const dLat = toRad(b.latitude - a.latitude);
  const dLon = toRad(b.longitude - a.longitude);
  const lat1 = toRad(a.latitude);
  const lat2 = toRad(b.latitude);

  const hav =
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos(lat1) * Math.cos(lat2) * Math.sin(dLon / 2) * Math.sin(dLon / 2);
  const c = 2 * Math.atan2(Math.sqrt(hav), Math.sqrt(1 - hav));
  return earth * c;
};

const IssueDetailScreen = ({ navigation }) => {
  const route = useRoute();
  const { issueId } = route.params || {};
  const [issue, setIssue] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [submittingFeedback, setSubmittingFeedback] = useState(false);
  const [feedbackMessage, setFeedbackMessage] = useState("");
  const [feedbackModalVisible, setFeedbackModalVisible] = useState(false);
  const [selectedFeedbackImage, setSelectedFeedbackImage] = useState(null);

  useEffect(() => {
    fetchIssueDetails();
  }, [issueId]);

  const normalizeUrl = (url) => {
    if (!url) return url;
    try {
      // Replace localhost or 127.0.0.1 (backend may have used localhost when
      // generating upload URLs) with the mobile API base host so images are
      // reachable from the device/emulator.
      const apiBase = API_BASE_URL.replace(/\/$/, "");
      // If the URL points to the uploads path on any host, rewrite it to use
      // the configured API base. This covers cases where the backend built
      // the URL with localhost, a hostname, or a different LAN IP.
      const uploadsIndex = url.indexOf("/uploads/");
      if (uploadsIndex !== -1) {
        const path = url.substring(uploadsIndex);
        return apiBase + path;
      }
      return url.replace(
        /^(https?:\/\/)(localhost|127\.0\.0\.1|::1)(:\d+)?/,
        apiBase
      );
    } catch (e) {
      return url;
    }
  };

  const fetchIssueDetails = async () => {
    try {
      setLoading(true);
      setError(null);
      const { data } = await api.get(`/api/issues/${issueId}`);
      const issueData = data.issue || data;
      // Debug: Log the photo_url to verify it's in the response
      console.log(
        "Issue data:",
        JSON.stringify(
          {
            id: issueData.id,
            photo_url: issueData.photo_url,
            resolved_photo_url: issueData.resolved_photo_url,
          },
          null,
          2
        )
      );
      setIssue(issueData);
    } catch (err) {
      setError(err.message || "Failed to load issue details");
    } finally {
      setLoading(false);
    }
  };

  const getCurrentLocation = async () => {
    const { status } = await Location.requestForegroundPermissionsAsync();
    if (status !== "granted") {
      throw new Error("Location permission is required");
    }

    const current = await Location.getCurrentPositionAsync({
      accuracy: Location.Accuracy.High,
    });

    return {
      latitude: current.coords.latitude,
      longitude: current.coords.longitude,
    };
  };

  const pickFeedbackImage = async () => {
    const perm = await ImagePicker.requestMediaLibraryPermissionsAsync();
    if (perm.status !== "granted") {
      throw new Error("Gallery permission is required to upload rejection photo");
    }

    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ImagePicker.MediaTypeOptions.Images,
      allowsEditing: false,
      quality: 1,
    });

    if (result.canceled || !result.assets || !result.assets[0]) {
      return null;
    }

    return result.assets[0];
  };

  const openModal = () => {
    setFeedbackModalVisible(true);
  };

  const closeModal = () => {
    setFeedbackModalVisible(false);
  };

  const submitRejectedFeedback = async (image) => {
    setSubmittingFeedback(true);

    try {
      if (!image) {
        throw new Error("Please select an image before submitting feedback");
      }

      const userLocation = await getCurrentLocation();
      const issueLocation = {
        latitude: Number(issue.latitude),
        longitude: Number(issue.longitude),
      };

      const meters = distanceMeters(issueLocation, userLocation);
      if (meters > 100) {
        throw new Error("You must be near the issue location");
      }

      const filename = image.uri.split("/").pop() || `feedback-${Date.now()}.jpg`;
      const match = /\.(\w+)$/.exec(filename);
      const mime = match ? `image/${match[1]}` : "image/jpeg";

      const formData = new FormData();
      formData.append("status", "rejected");
      formData.append("latitude", String(userLocation.latitude));
      formData.append("longitude", String(userLocation.longitude));
      formData.append("image", {
        uri: image.uri,
        name: filename,
        type: mime,
      });

      await api.post(`/api/issues/${issueId}/feedback`, formData, {
        headers: { "Content-Type": "multipart/form-data" },
      });

      setSelectedFeedbackImage(null);
      setFeedbackMessage("Issue reopened and escalated.");
      await fetchIssueDetails();
    } catch (err) {
      setError(err.message || "Failed to submit rejection");
    } finally {
      setSubmittingFeedback(false);
    }
  };

  const handleCamera = async () => {
    try {
      const perm = await ImagePicker.requestCameraPermissionsAsync();
      if (perm.status !== "granted") {
        throw new Error("Camera permission is required to take a photo");
      }

      const result = await ImagePicker.launchCameraAsync({
        mediaTypes: ImagePicker.MediaTypeOptions.Images,
        allowsEditing: false,
        quality: 1,
      });

      if (result.canceled || !result.assets || !result.assets[0]) {
        setFeedbackMessage("Photo capture cancelled");
        return;
      }

      const image = result.assets[0];
      setSelectedFeedbackImage(image);
      closeModal();
      await submitRejectedFeedback(image);
    } catch (err) {
      setError(err.message || "Unable to capture photo");
    }
  };

  const handleGallery = async () => {
    try {
      const image = await pickFeedbackImage();
      if (!image) {
        setFeedbackMessage("Image selection cancelled");
        return;
      }

      setSelectedFeedbackImage(image);
      closeModal();
      await submitRejectedFeedback(image);
    } catch (err) {
      setError(err.message || "Unable to pick image from gallery");
    }
  };

  const handleConfirmFixed = async () => {
    try {
      setSubmittingFeedback(true);
      await api.post(`/api/issues/${issueId}/feedback`, { status: "confirmed" });
      setFeedbackMessage("Thank you. Issue marked as closed.");
      await fetchIssueDetails();
    } catch (err) {
      setError(err.message || "Failed to submit feedback");
    } finally {
      setSubmittingFeedback(false);
    }
  };

  if (loading) {
    return (
      <View style={styles.loaderContainer}>
        <ActivityIndicator animating color="#2563eb" size="large" />
        <Text style={styles.loaderText}>Loading issue details...</Text>
      </View>
    );
  }

  if (error || !issue) {
    return (
      <View style={styles.errorContainer}>
        <Text style={styles.errorText}>{error || "Issue not found"}</Text>
        <Button mode="contained" onPress={() => navigation.goBack()}>
          Go Back
        </Button>
      </View>
    );
  }

  const statusColor = STATUS_COLORS[issue.status] || "#64748b";

  return (
    <ScrollView style={styles.container} contentContainerStyle={styles.content}>
      {/* Header */}
      <View style={styles.header}>
        <Button
          mode="text"
          onPress={() => navigation.goBack()}
          icon="arrow-left"
          style={styles.backButton}
        >
          Back
        </Button>
        <Text variant="headlineMedium" style={styles.title}>
          {issue.title}
        </Text>
      </View>

      {/* Status Chip */}
      <View style={styles.statusContainer}>
        <Chip
          style={{ backgroundColor: `${statusColor}22` }}
          textStyle={{ color: statusColor, fontWeight: "600" }}
        >
          {issue.status}
        </Chip>
      </View>

      {/* Issue Photo */}
      {issue && issue.photo_url ? (
        <Card style={styles.photoCard}>
          <Card.Content style={styles.photoContent}>
            <Text variant="titleSmall" style={styles.photoLabel}>
              Issue Photo
            </Text>
            <Image
              source={{ uri: normalizeUrl(issue.photo_url) }}
              style={styles.issueImage}
              resizeMode="contain"
              onError={(e) =>
                console.log("Image load error:", e.nativeEvent.error)
              }
            />
          </Card.Content>
        </Card>
      ) : (
        <Card style={styles.photoCard}>
          <Card.Content style={styles.photoContent}>
            <Text variant="titleSmall" style={styles.photoLabel}>
              Issue Photo
            </Text>
            <View
              style={[
                styles.issueImage,
                {
                  backgroundColor: "#e0e0e0",
                  justifyContent: "center",
                  alignItems: "center",
                },
              ]}
            >
              <Text style={{ color: "#999" }}>No photo available</Text>
            </View>
          </Card.Content>
        </Card>
      )}

      {/* Description */}
      <Card style={styles.card}>
        <Card.Content>
          <Text variant="titleSmall" style={styles.sectionTitle}>
            Description
          </Text>
          <Text variant="bodyMedium" style={styles.descriptionText}>
            {issue.description}
          </Text>
        </Card.Content>
      </Card>

      {/* Location Info */}
      <Card style={styles.card}>
        <Card.Content>
          <Text variant="titleSmall" style={styles.sectionTitle}>
            Location
          </Text>
          {issue.address && (
            <Text variant="bodyMedium" style={styles.addressText}>
              📍 {issue.address}
            </Text>
          )}
          <Text variant="bodySmall" style={styles.coordinatesText}>
            {Number(issue.latitude).toFixed(4)},{" "}
            {Number(issue.longitude).toFixed(4)}
          </Text>
        </Card.Content>
      </Card>

      {/* Date Info */}
      <Card style={styles.card}>
        <Card.Content>
          <Text variant="titleSmall" style={styles.sectionTitle}>
            Reported
          </Text>
          <Text variant="bodyMedium" style={styles.dateText}>
            {new Date(issue.created_at || issue.createdAt).toLocaleString()}
          </Text>
        </Card.Content>
      </Card>

      {/* Resolved Photo (if status is Resolved) */}
      {issue.status === "Resolved" && issue.resolved_photo_url && (
        <Card style={styles.resolvedCard}>
          <Card.Content>
            <Text variant="titleSmall" style={styles.resolvedTitle}>
              ✓ Resolution Photo
            </Text>
            <Text variant="bodySmall" style={styles.resolvedSubtext}>
              This issue has been resolved
            </Text>
            <Image
              source={{ uri: normalizeUrl(issue.resolved_photo_url) }}
              style={styles.resolvedImage}
              resizeMode="contain"
            />
          </Card.Content>
        </Card>
      )}

      {/* Citizen feedback actions for resolved issues */}
      {issue.status === "Resolved" && (
        <Card style={styles.card}>
          <Card.Content>
            <Text variant="titleSmall" style={styles.sectionTitle}>
              Is this issue fixed?
            </Text>
            <View style={styles.feedbackButtonsRow}>
              <Button
                mode="contained"
                icon="check-circle"
                buttonColor="#16a34a"
                textColor="#ffffff"
                onPress={handleConfirmFixed}
                disabled={submittingFeedback}
                style={styles.feedbackButton}
              >
                Yes, Issue Fixed
              </Button>
              <Button
                mode="contained"
                icon="close-circle"
                buttonColor="#dc2626"
                textColor="#ffffff"
                onPress={openModal}
                disabled={submittingFeedback}
                loading={submittingFeedback}
                style={styles.feedbackButton}
              >
                No, Not Fixed
              </Button>
            </View>
          </Card.Content>
        </Card>
      )}

      {/* Additional Info */}
      {issue.needs_review && (
        <Card style={styles.warningCard}>
          <Card.Content>
            <Text variant="titleSmall" style={styles.warningTitle}>
              ⚠️ Under Review
            </Text>
            <Text variant="bodySmall" style={styles.warningText}>
              This issue is pending manual review by our team.
            </Text>
          </Card.Content>
        </Card>
      )}

      <Snackbar
        visible={!!feedbackMessage}
        onDismiss={() => setFeedbackMessage("")}
        duration={2500}
      >
        {feedbackMessage}
      </Snackbar>

      <Modal
        visible={feedbackModalVisible}
        transparent
        animationType="slide"
        onRequestClose={closeModal}
      >
        <View style={styles.modalBackdrop}>
          <View style={styles.modalSheet}>
            <Text variant="titleMedium" style={styles.modalTitle}>
              Upload Current Condition
            </Text>
            <Text variant="bodySmall" style={styles.modalSubtitle}>
              Add a recent photo to reopen this issue.
            </Text>

            <Button
              mode="contained"
              icon="camera"
              onPress={handleCamera}
              disabled={submittingFeedback}
              contentStyle={styles.modalButtonContent}
              style={[styles.modalActionButton, styles.cameraButton]}
            >
              Take Photo
            </Button>

            <Button
              mode="contained-tonal"
              icon="image"
              onPress={handleGallery}
              disabled={submittingFeedback}
              contentStyle={styles.modalButtonContent}
              style={styles.modalActionButton}
            >
              Choose from Gallery
            </Button>

            <Button
              mode="text"
              onPress={closeModal}
              disabled={submittingFeedback}
              style={styles.modalCancelButton}
            >
              Cancel
            </Button>
          </View>
        </View>
      </Modal>
    </ScrollView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#f8fafc",
  },
  content: {
    paddingHorizontal: 16,
    paddingTop: 16,
    paddingBottom: 64,
  },
  header: {
    marginBottom: 16,
  },
  backButton: {
    alignSelf: "flex-start",
    marginBottom: 8,
  },
  title: {
    fontWeight: "700",
    color: "#1e293b",
  },
  statusContainer: {
    marginBottom: 16,
  },
  card: {
    marginBottom: 12,
    borderRadius: 12,
  },
  photoCard: {
    marginBottom: 16,
    borderRadius: 12,
    overflow: "hidden",
  },
  photoContent: {
    padding: 0,
  },
  photoLabel: {
    paddingHorizontal: 16,
    paddingTop: 12,
    marginBottom: 8,
    fontWeight: "600",
    color: "#475569",
  },
  issueImage: {
    width: "100%",
    height: 300,
    borderRadius: 8,
  },
  sectionTitle: {
    fontWeight: "600",
    color: "#475569",
    marginBottom: 8,
  },
  descriptionText: {
    color: "#1e293b",
    lineHeight: 24,
  },
  addressText: {
    color: "#2563eb",
    fontWeight: "500",
    marginBottom: 4,
  },
  coordinatesText: {
    color: "#64748b",
    fontStyle: "italic",
  },
  dateText: {
    color: "#1e293b",
  },
  resolvedCard: {
    marginTop: 16,
    marginBottom: 12,
    backgroundColor: "#dcfce7",
    borderRadius: 12,
  },
  resolvedTitle: {
    fontWeight: "600",
    color: "#15803d",
    marginBottom: 4,
  },
  resolvedSubtext: {
    color: "#166534",
    marginBottom: 12,
  },
  resolvedImage: {
    width: "100%",
    height: 250,
    borderRadius: 8,
    backgroundColor: "#e2e8f0",
  },
  warningCard: {
    marginBottom: 12,
    backgroundColor: "#fef3c7",
    borderRadius: 12,
  },
  warningTitle: {
    fontWeight: "600",
    color: "#b45309",
    marginBottom: 4,
  },
  warningText: {
    color: "#92400e",
  },
  feedbackButtonsRow: {
    marginTop: 8,
    gap: 10,
  },
  feedbackButton: {
    borderRadius: 8,
  },
  modalBackdrop: {
    flex: 1,
    backgroundColor: "rgba(15, 23, 42, 0.45)",
    justifyContent: "flex-end",
  },
  modalSheet: {
    backgroundColor: "#ffffff",
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    paddingHorizontal: 18,
    paddingTop: 18,
    paddingBottom: 28,
  },
  modalTitle: {
    fontWeight: "700",
    color: "#0f172a",
    marginBottom: 4,
  },
  modalSubtitle: {
    color: "#475569",
    marginBottom: 14,
  },
  modalActionButton: {
    marginBottom: 10,
    borderRadius: 12,
  },
  modalButtonContent: {
    height: 52,
  },
  cameraButton: {
    backgroundColor: "#2563eb",
  },
  modalCancelButton: {
    marginTop: 4,
  },
  loaderContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    backgroundColor: "#f8fafc",
  },
  loaderText: {
    marginTop: 12,
    color: "#64748b",
  },
  errorContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    backgroundColor: "#f8fafc",
    paddingHorizontal: 16,
  },
  errorText: {
    color: "#dc2626",
    fontWeight: "600",
    marginBottom: 16,
    textAlign: "center",
  },
});

export default IssueDetailScreen;
