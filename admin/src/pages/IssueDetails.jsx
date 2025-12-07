import React, { useState, useEffect } from "react";
import { useParams, useNavigate } from "react-router-dom";
import {
  Box,
  Typography,
  Card,
  CardContent,
  TextField,
  Button,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  CircularProgress,
  Alert,
  Chip,
  CardMedia,
} from "@mui/material";
import {
  ArrowBack as BackIcon,
  CloudUpload as UploadIcon,
} from "@mui/icons-material";
import { issuesAPI } from "../api/api";

const IssueDetails = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const [issue, setIssue] = useState(null);
  const [status, setStatus] = useState("");
  const [loading, setLoading] = useState(true);
  const [updating, setUpdating] = useState(false);
  const [error, setError] = useState("");
  const [selectedFile, setSelectedFile] = useState(null);
  const [previewUrl, setPreviewUrl] = useState("");

  useEffect(() => {
    fetchIssue();
  }, [id]);

  const fetchIssue = async () => {
    try {
      setLoading(true);
      const response = await issuesAPI.getById(id);
      setIssue(response.issue || response);
      setStatus(response.issue?.status || response.status || "Open");
      setError("");
    } catch (err) {
      setError(err.response?.data?.message || "Failed to fetch issue");
    } finally {
      setLoading(false);
    }
  };

  const handleStatusChange = async () => {
    if (status === issue.status) return;

    try {
      setUpdating(true);
      await issuesAPI.updateStatus(id, status);
      setIssue({ ...issue, status });
      setError("");
    } catch (err) {
      setError(err.response?.data?.message || "Failed to update status");
    } finally {
      setUpdating(false);
    }
  };

  const handleFileSelect = (event) => {
    const file = event.target.files[0];
    if (file) {
      setSelectedFile(file);
      setPreviewUrl(URL.createObjectURL(file));
    }
  };

  const handleImageUpload = async () => {
    if (!selectedFile) return;

    try {
      setUpdating(true);
      // Include current status so backend can store this as a resolved
      // photo when appropriate.
      await issuesAPI.uploadImage(id, selectedFile, { status });
      // Refresh issue data
      await fetchIssue();
      setSelectedFile(null);
      setPreviewUrl("");
      setError("");
    } catch (err) {
      const errorMsg =
        err.response?.data?.message ||
        err.response?.data?.errors?.[0]?.msg ||
        err.message ||
        "Failed to upload image";
      setError(errorMsg);
    } finally {
      setUpdating(false);
    }
  };

  const getStatusColor = (status) => {
    switch (status) {
      case "Open":
        return "warning";
      case "In Progress":
        return "info";
      case "Resolved":
        return "success";
      default:
        return "default";
    }
  };

  if (loading) {
    return (
      <Box sx={{ display: "flex", justifyContent: "center", mt: 4 }}>
        <CircularProgress />
      </Box>
    );
  }

  if (!issue) {
    return (
      <Box sx={{ p: 3 }}>
        <Alert severity="error">Issue not found</Alert>
      </Box>
    );
  }

  return (
    <Box sx={{ p: 3 }}>
      <Box sx={{ display: "flex", alignItems: "center", mb: 3 }}>
        <Button
          startIcon={<BackIcon />}
          onClick={() => navigate("/")}
          sx={{ mr: 2 }}
        >
          Back to Dashboard
        </Button>
        <Typography variant="h4" component="h1">
          Issue Details
        </Typography>
      </Box>

      {error && (
        <Alert severity="error" sx={{ mb: 2 }}>
          {error}
        </Alert>
      )}

      {issue.needs_review && (
        <Alert severity="warning" sx={{ mb: 2 }}>
          ⚠️ <strong>This issue requires manual review.</strong> The photo
          metadata could not be verified. Please review the image and location
          details carefully before proceeding.
        </Alert>
      )}

      <Card>
        <CardContent>
          <Typography variant="h5" gutterBottom>
            {issue.title}
          </Typography>

          <Box sx={{ mb: 2 }}>
            <Typography variant="subtitle2" color="text.secondary" gutterBottom>
              Status
            </Typography>
            <Chip label={issue.status} color={getStatusColor(issue.status)} />
          </Box>

          <Box sx={{ mb: 2 }}>
            <Typography variant="subtitle2" color="text.secondary" gutterBottom>
              Review Status
            </Typography>
            <Chip
              label={issue.needs_review ? "Needs Manual Review" : "Verified"}
              color={issue.needs_review ? "error" : "success"}
              variant={issue.needs_review ? "filled" : "outlined"}
            />
          </Box>

          <Box sx={{ mb: 3 }}>
            <Typography variant="subtitle2" color="text.secondary" gutterBottom>
              Description
            </Typography>
            <Typography variant="body1">{issue.description}</Typography>
          </Box>

          {issue.address && (
            <Box sx={{ mb: 3 }}>
              <Typography
                variant="subtitle2"
                color="text.secondary"
                gutterBottom
              >
                Address
              </Typography>
              <Typography variant="body1">{issue.address}</Typography>
            </Box>
          )}

          <Box sx={{ mb: 3 }}>
            <Typography variant="subtitle2" color="text.secondary" gutterBottom>
              Location
            </Typography>
            <Typography variant="body2" color="text.secondary">
              Latitude: {issue.latitude}, Longitude: {issue.longitude}
            </Typography>
          </Box>

          <Box sx={{ mb: 3 }}>
            <Typography variant="subtitle2" color="text.secondary" gutterBottom>
              Created Date
            </Typography>
            <Typography variant="body2" color="text.secondary">
              {new Date(issue.created_at || issue.createdAt).toLocaleString()}
            </Typography>
          </Box>

          {issue.photo_url && (
            <Box sx={{ mb: 3 }}>
              <Typography
                variant="subtitle2"
                color="text.secondary"
                gutterBottom
              >
                Issue Image
              </Typography>
              <CardMedia
                component="img"
                image={issue.photo_url}
                alt="Issue"
                sx={{
                  width: "100%",
                  height: "auto",
                  borderRadius: 1,
                  objectFit: "contain",
                }}
              />
            </Box>
          )}
          {issue.resolved_photo_url && (
            <Box sx={{ mb: 3 }}>
              <Typography
                variant="subtitle2"
                color="text.secondary"
                gutterBottom
              >
                Resolved Image
              </Typography>
              <CardMedia
                component="img"
                image={issue.resolved_photo_url}
                alt="Resolved"
                sx={{
                  width: "100%",
                  height: "auto",
                  borderRadius: 1,
                  objectFit: "contain",
                }}
              />
            </Box>
          )}

          <Box sx={{ mb: 3 }}>
            <Typography variant="subtitle2" color="text.secondary" gutterBottom>
              Update Status
            </Typography>
            <Box sx={{ display: "flex", gap: 2, alignItems: "center" }}>
              <FormControl sx={{ minWidth: 200 }}>
                <InputLabel>Status</InputLabel>
                <Select
                  value={status}
                  onChange={(e) => setStatus(e.target.value)}
                  label="Status"
                >
                  <MenuItem value="Open">Open</MenuItem>
                  <MenuItem value="In Progress">In Progress</MenuItem>
                  <MenuItem value="Resolved">Resolved</MenuItem>
                </Select>
              </FormControl>
              <Button
                variant="contained"
                onClick={handleStatusChange}
                disabled={updating || status === issue.status}
              >
                {updating ? <CircularProgress size={20} /> : "Update Status"}
              </Button>
            </Box>
          </Box>

          {status === "Resolved" && (
            <Box>
              <Typography
                variant="subtitle2"
                color="text.secondary"
                gutterBottom
              >
                Upload Resolution Image
              </Typography>
              <Box
                sx={{
                  display: "flex",
                  gap: 2,
                  alignItems: "center",
                  flexWrap: "wrap",
                }}
              >
                <Button
                  variant="outlined"
                  component="label"
                  startIcon={<UploadIcon />}
                >
                  Select Image
                  <input
                    type="file"
                    hidden
                    accept="image/*"
                    onChange={handleFileSelect}
                  />
                </Button>
                {selectedFile && (
                  <>
                    <Typography variant="body2" color="text.secondary">
                      {selectedFile.name}
                    </Typography>
                    <Button
                      variant="contained"
                      onClick={handleImageUpload}
                      disabled={updating}
                    >
                      {updating ? <CircularProgress size={20} /> : "Upload"}
                    </Button>
                  </>
                )}
              </Box>
              {previewUrl && (
                <Box sx={{ mt: 2 }}>
                  <Typography
                    variant="subtitle2"
                    color="text.secondary"
                    gutterBottom
                  >
                    Preview
                  </Typography>
                  <CardMedia
                    component="img"
                    image={previewUrl}
                    alt="Preview"
                    sx={{
                      width: "100%",
                      height: "auto",
                      borderRadius: 1,
                      objectFit: "contain",
                      maxWidth: 300,
                    }}
                  />
                </Box>
              )}
            </Box>
          )}
        </CardContent>
      </Card>
    </Box>
  );
};

export default IssueDetails;
