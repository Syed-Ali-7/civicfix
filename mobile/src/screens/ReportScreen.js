import React, { useState } from "react";
import {
  View,
  StyleSheet,
  Image,
  ScrollView,
  ActivityIndicator,
} from "react-native";
import {
  Button,
  TextInput,
  Text,
  Snackbar,
  HelperText,
} from "react-native-paper";
import MapView, { Marker } from "react-native-maps";
import * as ImagePicker from "expo-image-picker";
import * as Location from "expo-location";
import api, { API_BASE_URL } from "../utils/api";
import { useAuth } from "../context/AuthContext";

const ReportScreen = ({ navigation }) => {
  const { token } = useAuth();

  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [photo, setPhoto] = useState(null);
  const [coords, setCoords] = useState(null);
  const [address, setAddress] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [successMessage, setSuccessMessage] = useState("");
  const [permissionError, setPermissionError] = useState("");
  const [uploadStatus, setUploadStatus] = useState(""); // For detailed upload progress

  const requestLocation = async () => {
    const { status } = await Location.requestForegroundPermissionsAsync();
    if (status !== "granted") {
      throw new Error("Location permission is required to submit an issue");
    }

    const location = await Location.getCurrentPositionAsync({
      accuracy: Location.Accuracy.High,
    });

    return {
      latitude: location.coords.latitude,
      longitude: location.coords.longitude,
    };
  };

  const checkPermissions = async (type) => {
    try {
      if (type === "gallery") {
        const { status } =
          await ImagePicker.requestMediaLibraryPermissionsAsync();
        if (status !== "granted") {
          setPermissionError(
            "Please enable gallery access in your device settings to select photos"
          );
          return false;
        }
      } else {
        const { status } = await ImagePicker.requestCameraPermissionsAsync();
        if (status !== "granted") {
          setPermissionError(
            "Please enable camera access in your device settings to take photos"
          );
          return false;
        }
      }
      return true;
    } catch (err) {
      setError("Error checking permissions: " + err.message);
      return false;
    }
  };

  const handlePickImage = async (type) => {
    try {
      setError(null);
      setPermissionError(null);

      const hasPermission = await checkPermissions(type);
      if (!hasPermission) return;

      // Keep options minimal to avoid native enum/casting issues on Android.
      // `mediaTypes` caused a Kotlin cast error in some expo versions; it's
      // unnecessary for camera and can be omitted. For gallery we use
      // `selectionLimit: 1` below via the same options object.
      // Configure image picker to ensure EXIF data is preserved
      const options = {
        mediaTypes: ImagePicker.MediaTypeOptions.Images,
        allowsEditing: false, // Disable editing to preserve EXIF
        quality: 1, // Preserve original quality
        exif: true,
        base64: false,
        selectionLimit: 1,
      };

      const result =
        type === "gallery"
          ? await ImagePicker.launchImageLibraryAsync(options)
          : await ImagePicker.launchCameraAsync(options);

      if (!result.canceled && result.assets && result.assets.length > 0) {
        const selectedPhoto = result.assets[0];

        // Basic client-side validation
        if (!selectedPhoto.exif) {
          setError(
            "Selected image lacks required metadata. Please take a new photo with your device camera."
          );
          return;
        }

        setPhoto(selectedPhoto);
      }
    } catch (err) {
      setError("Failed to capture image: " + err.message);
    }
  };

  const handleSubmit = async () => {
    if (!title || !description) {
      setError("Please provide a title and description");
      return;
    }

    try {
      setLoading(true);
      setError(null);
      setUploadStatus("Getting location...");

      const locationCoords = coords || (await requestLocation());
      setCoords(locationCoords);
      setUploadStatus("Uploading photo...");

      // Create FormData for file upload
      const formData = new FormData();
      formData.append("title", title);
      formData.append("description", description);
      formData.append("latitude", locationCoords.latitude.toString());
      formData.append("longitude", locationCoords.longitude.toString());

      // Add photo if available
      if (photo && photo.uri) {
        const filename = photo.uri.split("/").pop();
        const match = /\.(\w+)$/.exec(filename);
        const type = match ? `image/${match[1]}` : `image/jpeg`;

        formData.append("image", {
          uri: photo.uri,
          name: filename,
          type: type,
        });
      }

      setUploadStatus("Processing (validating photo, getting address...)");

      // Use axios instance so Authorization header is automatically applied
      // (AuthContext calls setAuthToken when logging in). Axios handles multipart
      // uploads reliably on React Native when using FormData.
      let issueData;
      try {
        // The 'Content-Type' header is explicitly set to 'multipart/form-data'
        // to ensure the server correctly interprets the request. Axios
        // typically handles this, but being explicit can resolve edge cases.
        // Note: timeout is 30s to allow geocoding retries on backend
        const axiosResponse = await api.post("/api/issues", formData, {
          headers: {
            "Content-Type": "multipart/form-data",
            ...(token ? { Authorization: `Bearer ${token}` } : {}),
          },
        });
        issueData = axiosResponse.data;
      } catch (axiosErr) {
        // If axiosErr.response exists, map common server messages to UI
        if (axiosErr.response) {
          const status = axiosErr.response.status;
          const data = axiosErr.response.data || {};
          if (status === 401) {
            // Clear session if possible and prompt re-login
            setError(
              "Authentication failed: Invalid or expired token. Please log in again."
            );
            return;
          }
          // Try to surface validation or other server messages
          const msg =
            data.message ||
            (data.errors && data.errors[0] && data.errors[0].msg) ||
            `Failed to submit issue (status ${status})`;
          throw new Error(msg);
        }
        throw axiosErr;
      }

      // Update address from response
      if (issueData.address) {
        setAddress(issueData.address);
      }

      setTitle("");
      setDescription("");
      setPhoto(null);
      setCoords(null);
      setAddress(null);
      setSuccessMessage("Issue reported successfully!");
      setUploadStatus("");

      // Navigate to the newly created issue's detail so the user can see the
      // uploaded photo immediately. The backend returns the created issue in
      // the response; use its id when available.
      try {
        const newId = issueData?.id || issueData?.data?.id;
        if (newId) {
          // Wait a moment before navigating to show success message
          setTimeout(() => {
            navigation.navigate("IssueDetail", { issueId: newId });
          }, 500);
        }
      } catch (navErr) {
        // swallow navigation errors — not critical
      }
    } catch (err) {
      setError(err.message || "Failed to submit issue");
      setUploadStatus("");
    } finally {
      setLoading(false);
    }
  };

  return (
    <ScrollView contentContainerStyle={styles.container}>
      <Text variant="headlineSmall" style={styles.title}>
        Report a Civic Issue
      </Text>
      <Text variant="bodyMedium" style={styles.subtitle}>
        Capture the scene, add details, and we’ll route it to the right team.
      </Text>

      <View style={styles.photoSection}>
        {photo ? (
          <Image
            source={{ uri: photo.uri }}
            style={[
              styles.previewImage,
              photo && photo.width && photo.height
                ? { aspectRatio: photo.width / photo.height, height: undefined }
                : {},
            ]}
            resizeMode="contain"
          />
        ) : (
          <View style={styles.placeholderContainer}>
            <Text style={styles.placeholderIcon}>📸</Text>
            <Text style={styles.placeholderText}>
              Take a clear photo of the issue
            </Text>
            <Text style={styles.placeholderSubText}>
              This helps our team better understand and address the problem
            </Text>
          </View>
        )}

        <View style={styles.buttonGroup}>
          <Button
            mode="outlined"
            onPress={() => handlePickImage("camera")}
            style={styles.photoButton}
            icon="camera"
          >
            {photo ? "Retake Photo" : "Capture Photo"}
          </Button>
          <Button
            mode="outlined"
            onPress={() => handlePickImage("gallery")}
            style={styles.photoButton}
            icon="image"
          >
            Gallery
          </Button>
        </View>
        {permissionError && (
          <Text style={styles.permissionError}>{permissionError}</Text>
        )}
      </View>

      <TextInput
        label="Title"
        value={title}
        onChangeText={setTitle}
        mode="outlined"
        style={styles.input}
      />

      <TextInput
        label="Description"
        value={description}
        onChangeText={setDescription}
        multiline
        numberOfLines={4}
        mode="outlined"
        style={[styles.input, styles.description]}
      />

      {coords && (
        <View style={styles.locationSection}>
          <Text style={styles.locationLabel}>Location:</Text>
          <Text style={styles.locationText}>
            📍 {coords.latitude.toFixed(4)}, {coords.longitude.toFixed(4)}
          </Text>
          {address && <Text style={styles.addressText}>📍 {address}</Text>}
          {!address && loading && (
            <Text style={styles.addressLoading}>🔄 Fetching address...</Text>
          )}
        </View>
      )}

      {error && <HelperText type="error">{error}</HelperText>}

      {uploadStatus && (
        <View style={styles.uploadStatusBox}>
          <Text style={styles.uploadStatusText}>⏳ {uploadStatus}</Text>
        </View>
      )}

      {coords && (
        <MapView
          style={styles.map}
          initialRegion={{
            latitude: coords.latitude,
            longitude: coords.longitude,
            latitudeDelta: 0.0922,
            longitudeDelta: 0.0421,
          }}
          onPress={(e) => setCoords(e.nativeEvent.coordinate)}
        >
          <Marker
            draggable
            coordinate={coords}
            onDragEnd={(e) => setCoords(e.nativeEvent.coordinate)}
          />
        </MapView>
      )}

      <Button
        mode="contained"
        onPress={handleSubmit}
        loading={loading}
        disabled={loading}
        style={styles.submitButton}
      >
        {loading ? "Submitting..." : "Submit Issue"}
      </Button>

      <Snackbar
        visible={!!successMessage}
        onDismiss={() => setSuccessMessage("")}
        duration={3000}
      >
        {successMessage}
      </Snackbar>
    </ScrollView>
  );
};

const styles = StyleSheet.create({
  container: {
    flexGrow: 1,
    backgroundColor: "#f8fafc",
    paddingHorizontal: 16,
    paddingTop: 48,
    paddingBottom: 64,
  },
  title: {
    fontWeight: "700",
  },
  subtitle: {
    color: "#64748b",
    marginTop: 8,
    marginBottom: 24,
  },
  photoSection: {
    alignItems: "center",
    marginBottom: 24,
    gap: 12,
    width: "100%",
  },
  previewImage: {
    width: "100%",
    height: undefined,
    maxHeight: 600,
    borderRadius: 16,
    backgroundColor: "#00000000",
  },
  placeholderContainer: {
    width: "100%",
    height: 200,
    backgroundColor: "#e2e8f0",
    borderRadius: 16,
    justifyContent: "center",
    alignItems: "center",
    padding: 16,
  },
  placeholderIcon: {
    fontSize: 40,
    marginBottom: 12,
  },
  placeholderText: {
    fontSize: 16,
    fontWeight: "600",
    color: "#475569",
    textAlign: "center",
    marginBottom: 8,
  },
  placeholderSubText: {
    fontSize: 14,
    color: "#64748b",
    textAlign: "center",
  },
  photoButton: {
    flex: 1,
    marginHorizontal: 4,
  },
  buttonGroup: {
    flexDirection: "row",
    justifyContent: "space-around",
    width: "100%",
  },
  permissionError: {
    color: "#ef4444",
    fontSize: 14,
    marginTop: 8,
    textAlign: "center",
  },
  input: {
    marginBottom: 16,
  },
  description: {
    minHeight: 120,
  },
  submitButton: {
    marginTop: 8,
  },
  locationSection: {
    marginBottom: 16,
    padding: 12,
    backgroundColor: "#f1f5f9",
    borderRadius: 8,
  },
  locationLabel: {
    fontSize: 12,
    fontWeight: "600",
    color: "#64748b",
    marginBottom: 4,
  },
  locationText: {
    color: "#2563eb",
    marginBottom: 4,
    fontSize: 14,
  },
  addressText: {
    color: "#1e293b",
    fontSize: 14,
    marginTop: 4,
  },
  addressLoading: {
    color: "#64748b",
    fontSize: 12,
    fontStyle: "italic",
    marginTop: 4,
  },
  uploadStatusBox: {
    marginBottom: 16,
    padding: 12,
    backgroundColor: "#e3f2fd",
    borderRadius: 8,
  },
  uploadStatusText: {
    color: "#1565c0",
    fontStyle: "italic",
    fontSize: 14,
  },

  map: {
    height: 200,
    marginBottom: 16,
  },
});

export default ReportScreen;
