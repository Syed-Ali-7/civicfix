import React, { useEffect, useMemo, useState } from "react";
import {
  Alert,
  Box,
  Button,
  Chip,
  CircularProgress,
  Dialog,
  DialogActions,
  DialogContent,
  DialogTitle,
  IconButton,
  Paper,
  Snackbar,
  Stack,
  Typography,
} from "@mui/material";
import { DataGrid } from "@mui/x-data-grid";
import VisibilityIcon from "@mui/icons-material/Visibility";
import DeleteIcon from "@mui/icons-material/Delete";
import { adminAPI, issuesAPI, default as api } from "../api/api";

const designationLabels = {
  supervisor: "Supervisor",
};

const levelMeta = {
  1: { color: "primary", label: "Level 1" },
  2: { color: "error", label: "Level 2" },
};

const statusColor = (status) => {
  switch (status) {
    case "Open":
      return "warning";
    case "Resolved":
      return "success";
    case "Escalated":
      return "error";
    default:
      return "default";
  }
};

const formatDateTime = (value) => {
  if (!value) return "";
  const d = new Date(value);
  if (Number.isNaN(d.getTime())) return "";
  return d.toLocaleString("en-GB", {
    day: "2-digit",
    month: "short",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });
};

const formatRemainingTime = (hours) => {
  if (typeof hours !== "number") return "-";
  if (hours < 0) return "Overdue";

  const days = Math.floor(hours / 24);
  const remainingHours = hours % 24;

  if (days > 0 && remainingHours > 0) {
    return `${days}d ${remainingHours}h remaining`;
  }
  if (days > 0) {
    return `${days}d remaining`;
  }
  return `${hours}h remaining`;
};

const SeverityChip = ({ value }) => {
  const severity = (value || "low").toLowerCase();
  return severity === "high" ? (
    <Chip size="small" color="error" label="High" />
  ) : (
    <Chip size="small" color="success" label="Low" />
  );
};

const SlaCell = ({ row }) => {
  const deadlineText = formatDateTime(row.sla_deadline);
  if (!deadlineText) return "";

  if (row.is_overdue) {
    return (
      <Typography sx={{ color: "error.main", fontWeight: 700 }}>
        {deadlineText} (Overdue)
      </Typography>
    );
  }

  if (
    typeof row.time_remaining_hours === "number" &&
    row.time_remaining_hours < 24 &&
    row.time_remaining_hours >= 0
  ) {
    return (
      <Typography sx={{ color: "warning.main", fontWeight: 600 }}>
        {deadlineText} {`⚠️ ${row.time_remaining_hours}h left`}
      </Typography>
    );
  }

  return deadlineText;
};

const Dashboard = () => {
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [issues, setIssues] = useState([]);
  const [counts, setCounts] = useState({
    level_1_count: 0,
    level_2_count: 0,
  });
  const [levelFilter, setLevelFilter] = useState("all");
  const [snackbar, setSnackbar] = useState({
    open: false,
    severity: "success",
    message: "",
  });
  // RESOLUTION FLOW
  const [resolveDialogOpen, setResolveDialogOpen] = useState(false);
  const [resolveIssue, setResolveIssue] = useState(null);
  const [resolutionFile, setResolutionFile] = useState(null);
  const [resolutionPreview, setResolutionPreview] = useState("");
  const [submittingResolution, setSubmittingResolution] = useState(false);

  // VIEW ISSUE
  const [viewDialogOpen, setViewDialogOpen] = useState(false);
  const [viewIssue, setViewIssue] = useState(null);

  // SUPERVISOR DELETE
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [deleteIssue, setDeleteIssue] = useState(null);
  const [deletingIssue, setDeletingIssue] = useState(false);

  const designation = localStorage.getItem("designation") || "";
  const isSupervisor = designation === "supervisor";

  const fetchIssues = async () => {
    try {
      setLoading(true);
      const response = await issuesAPI.getAll();
      const payload = Array.isArray(response)
        ? { issues: response }
        : { issues: response.issues || [], ...response };

      const nextIssues = payload.issues || [];
      setIssues(nextIssues);

      setCounts({
        level_1_count: nextIssues.filter((i) => i.escalation_level === 1).length,
        level_2_count: nextIssues.filter((i) => i.escalation_level === 2).length,
      });
      setError("");
    } catch (err) {
      setError(err.response?.data?.message || "Failed to fetch issues");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchIssues();
  }, []);

  // RESOLUTION FLOW
  const handleOpenResolveDialog = (issue) => {
    setResolveIssue(issue);
    setResolutionFile(null);
    setResolutionPreview("");
    setResolveDialogOpen(true);
  };

  const handleCloseResolveDialog = () => {
    setResolveDialogOpen(false);
    setResolveIssue(null);
    setResolutionFile(null);
    setResolutionPreview("");
  };

  const handleResolutionFileChange = (event) => {
    const file = event.target.files?.[0] || null;
    setResolutionFile(file);
    if (file) {
      const previewUrl = URL.createObjectURL(file);
      setResolutionPreview(previewUrl);
    } else {
      setResolutionPreview("");
    }
  };

  const handleSubmitResolution = async () => {
    if (!resolveIssue || !resolutionFile) return;

    try {
      setSubmittingResolution(true);
      const formData = new FormData();
      formData.append("status", "Resolved");
      formData.append("image", resolutionFile);
      const response = await api.patch(`/issues/${resolveIssue.id}`, formData);
      const updated = response.data;

      if (designation === "supervisor") {
        setIssues((prev) =>
          prev.map((issue) => (issue.id === resolveIssue.id ? { ...issue, ...updated } : issue))
        );
      } else {
        setIssues((prev) => prev.filter((issue) => issue.id !== resolveIssue.id));
      }

      handleCloseResolveDialog();

      setSnackbar({
        open: true,
        severity: "success",
        message: "Issue resolved successfully",
      });
    } catch (err) {
      setSnackbar({
        open: true,
        severity: "error",
        message: err.response?.data?.message || "Failed to update issue",
      });
    } finally {
      setSubmittingResolution(false);
    }
  };

  // VIEW ISSUE
  const handleOpenViewDialog = (issue) => {
    setViewIssue(issue);
    setViewDialogOpen(true);
  };

  const handleCloseViewDialog = () => {
    setViewDialogOpen(false);
    setViewIssue(null);
  };

  // SUPERVISOR DELETE
  const handleOpenDeleteDialog = (issue) => {
    setDeleteIssue(issue);
    setDeleteDialogOpen(true);
  };

  const handleCloseDeleteDialog = () => {
    setDeleteDialogOpen(false);
    setDeleteIssue(null);
  };

  const handleConfirmDelete = async () => {
    if (!deleteIssue) return;

    try {
      setDeletingIssue(true);
      await issuesAPI.delete(deleteIssue.id);
      setIssues((prev) => prev.filter((issue) => issue.id !== deleteIssue.id));
      handleCloseDeleteDialog();
      setSnackbar({
        open: true,
        severity: "success",
        message: "Issue deleted successfully",
      });
    } catch (err) {
      const apiMessage = err.response?.data?.message;
      setSnackbar({
        open: true,
        severity: "error",
        message:
          err.response?.status === 403
            ? "Only supervisors can delete issues"
            : apiMessage || "Failed to delete issue",
      });
    } finally {
      setDeletingIssue(false);
    }
  };

  const handleTriggerEscalation = async () => {
    try {
      const result = await adminAPI.triggerEscalation();
      setSnackbar({
        open: true,
        severity: "success",
        message: `Escalation check complete - ${result.escalated_count || 0} issues escalated`,
      });
      await fetchIssues();
    } catch (err) {
      setSnackbar({
        open: true,
        severity: "error",
        message: err.response?.data?.message || "Failed to trigger escalation",
      });
    }
  };

  // ROLE BASED VIEW: filter supervisor list by selected escalation level card
  const filteredIssues = useMemo(() => {
    if (designation !== "supervisor") {
      return issues;
    }

    if (levelFilter === "all") {
      return issues;
    }

    return issues.filter(
      (issue) => Number(issue.escalation_level) === Number(levelFilter)
    );
  }, [designation, issues, levelFilter]);

  const nearDeadlineCount = useMemo(
    () =>
      issues.filter(
        (i) =>
          i.status !== "Resolved" &&
          typeof i.time_remaining_hours === "number" &&
          i.time_remaining_hours < 24 &&
          i.time_remaining_hours >= 0
      ).length,
    [issues]
  );

  const level2Count = useMemo(
    () => (designation === "supervisor" ? counts.level_2_count : 0),
    [designation, counts]
  );

  const pageTitle = useMemo(() => {
    if (designation === "supervisor") return "All Issues - Full Overview";
    return "Issues Dashboard";
  }, [designation]);

  const baseColumns = [
    {
      field: "id",
      headerName: "ID",
      minWidth: 120,
      flex: 0.8,
    },
    {
      field: "description",
      headerName: "Description",
      minWidth: 250,
      flex: 1.4,
      valueGetter: (value, rowOrParams) => {
        const row = rowOrParams?.row || rowOrParams || {};
        return row.description || row.title || value || "";
      },
    },
    {
      field: "severity",
      headerName: "Severity",
      minWidth: 120,
      flex: 0.6,
      renderCell: (params) => <SeverityChip value={params.value} />,
    },
    {
      field: "sla_deadline",
      headerName: "SLA Deadline",
      minWidth: 220,
      flex: 1,
      renderCell: (params) => <SlaCell row={params.row} />,
    },
    {
      field: "status",
      headerName: "Status",
      minWidth: 150,
      flex: 0.8,
      renderCell: (params) => (
        <Chip size="small" color={statusColor(params.value)} label={params.value} />
      ),
    },
  ];

  const actionColumn = {
    field: "action",
    headerName: "Action",
    minWidth: 230,
    flex: 0.8,
    sortable: false,
    renderCell: (params) => (
      <Stack direction="row" spacing={1} alignItems="center">
        {/* VIEW ISSUE */}
        <IconButton
          size="small"
          color="primary"
          onClick={() => handleOpenViewDialog(params.row)}
        >
          <VisibilityIcon fontSize="small" />
        </IconButton>

        <Button
          size="small"
          variant="contained"
          color="success"
          disabled={params.row.status === "Resolved"}
          onClick={() => handleOpenResolveDialog(params.row)}
        >
          Mark Resolved
        </Button>

        {/* SUPERVISOR DELETE */}
        {isSupervisor && (
          <IconButton
            size="small"
            color="error"
            onClick={() => handleOpenDeleteDialog(params.row)}
          >
            <DeleteIcon fontSize="small" />
          </IconButton>
        )}
      </Stack>
    ),
  };

  const columns = useMemo(() => {
    if (designation === "supervisor") {
      return [
        ...baseColumns.slice(0, 4),
        {
          field: "escalation_level",
          headerName: "Current Level",
          minWidth: 170,
          flex: 0.8,
          renderCell: (params) => {
            const meta = levelMeta[params.value] || { color: "default", label: "Unknown" };
            return <Chip size="small" color={meta.color} label={meta.label} />;
          },
        },
        baseColumns[4],
        actionColumn,
      ];
    }

    return [...baseColumns, actionColumn];
  }, [designation, isSupervisor]);

  if (loading) {
    return (
      <Box sx={{ display: "flex", justifyContent: "center", mt: 8 }}>
        <CircularProgress />
      </Box>
    );
  }

  return (
    <Box sx={{ p: 3 }}>
      <Stack
        direction={{ xs: "column", md: "row" }}
        justifyContent="space-between"
        alignItems={{ xs: "flex-start", md: "center" }}
        spacing={2}
        sx={{ mb: 2 }}
      >
        <Typography variant="h4" component="h1">
          {pageTitle}
        </Typography>

        {designation === "supervisor" && (
          <Button variant="contained" color="error" onClick={handleTriggerEscalation}>
            Trigger Escalation
          </Button>
        )}
      </Stack>

      {error && (
        <Alert severity="error" sx={{ mb: 2 }}>
          {error}
        </Alert>
      )}

      {designation === "supervisor" && level2Count > 0 && (
        <Alert severity="error" sx={{ mb: 2 }}>
          {level2Count} issues at Level 2 - Immediate action required
        </Alert>
      )}

      {designation === "supervisor" && (
        <Stack direction={{ xs: "column", sm: "row" }} spacing={1.5} sx={{ mb: 2 }}>
          {[
            { key: "all", label: "Total Issues", value: issues.length },
            { key: 1, label: "Level 1", value: counts.level_1_count },
            { key: 2, label: "Level 2", value: counts.level_2_count },
          ].map((card) => (
            <Paper
              key={String(card.key)}
              onClick={() => setLevelFilter(card.key)}
              sx={{
                p: 1.5,
                minWidth: 140,
                cursor: "pointer",
                border: levelFilter === card.key ? "2px solid #1976d2" : "1px solid #e0e0e0",
              }}
            >
              <Typography variant="body2" color="text.secondary">
                {card.label}
              </Typography>
              <Typography variant="h6" sx={{ fontWeight: 700 }}>
                {card.value}
              </Typography>
            </Paper>
          ))}
        </Stack>
      )}

      <Paper sx={{ p: 1.5 }}>
        <Box sx={{ height: 660, width: "100%" }}>
          <DataGrid
            rows={filteredIssues}
            columns={columns}
            getRowId={(row) => row.id}
            disableRowSelectionOnClick
            pageSizeOptions={[10, 25, 50]}
            initialState={{
              pagination: {
                paginationModel: { pageSize: 10, page: 0 },
              },
            }}
            sx={{
              "& .row-level-1": {
                borderLeft: "4px solid #ed6c02",
              },
              "& .row-level-2": {
                borderLeft: "4px solid #d32f2f",
              },
            }}
            getRowClassName={(params) => {
              if (params.row.escalation_level === 1) return "row-level-1";
              if (params.row.escalation_level === 2) return "row-level-2";
              return "";
            }}
          />
        </Box>
      </Paper>

      <Snackbar
        open={snackbar.open}
        autoHideDuration={3000}
        onClose={() => setSnackbar((prev) => ({ ...prev, open: false }))}
      >
        <Alert
          severity={snackbar.severity}
          onClose={() => setSnackbar((prev) => ({ ...prev, open: false }))}
          sx={{ width: "100%" }}
        >
          {snackbar.message}
        </Alert>
      </Snackbar>

      {/* RESOLUTION FLOW */}
      <Dialog
        open={resolveDialogOpen}
        onClose={handleCloseResolveDialog}
        maxWidth="sm"
        fullWidth
      >
        <DialogTitle>{`Resolve Issue #${resolveIssue?.id || ""}`}</DialogTitle>
        <DialogContent>
          <Stack spacing={2} sx={{ mt: 1 }}>
            <Typography>
              Please upload a photo showing the resolved issue
            </Typography>
            <Button variant="outlined" component="label">
              Upload Resolution Photo
              <input
                hidden
                type="file"
                accept="image/*"
                onChange={handleResolutionFileChange}
              />
            </Button>
            {resolutionFile && (
              <Typography variant="body2">Selected: {resolutionFile.name}</Typography>
            )}
            {resolutionPreview && (
              <Box
                component="img"
                src={resolutionPreview}
                alt="Resolution preview"
                sx={{ width: "100%", maxHeight: 260, objectFit: "cover", borderRadius: 1 }}
              />
            )}
          </Stack>
        </DialogContent>
        <DialogActions>
          <Button onClick={handleCloseResolveDialog}>Cancel</Button>
          <Button
            variant="contained"
            onClick={handleSubmitResolution}
            disabled={!resolutionFile || submittingResolution}
          >
            Submit Resolution
          </Button>
        </DialogActions>
      </Dialog>

      {/* VIEW ISSUE */}
      <Dialog open={viewDialogOpen} onClose={handleCloseViewDialog} maxWidth="md" fullWidth>
        <DialogTitle>{`Issue Details #${viewIssue?.id || ""}`}</DialogTitle>
        <DialogContent>
          {viewIssue && (
            <Stack spacing={1.2} sx={{ mt: 1 }}>
              <Typography><strong>Issue ID:</strong> {viewIssue.id}</Typography>
              <Typography><strong>Description:</strong> {viewIssue.description || "-"}</Typography>
              <Typography>
                <strong>Location:</strong> {viewIssue.latitude}, {viewIssue.longitude}
                {viewIssue.address ? ` (${viewIssue.address})` : ""}
              </Typography>
              <Typography>
                <strong>Reported Date:</strong> {formatDateTime(viewIssue.created_at)}
              </Typography>
              <Typography component="div">
                <strong>Severity:</strong>{" "}
                <SeverityChip value={viewIssue.severity} />
              </Typography>
              <Typography>
                <strong>SLA Deadline:</strong> {formatDateTime(viewIssue.sla_deadline) || "-"}
              </Typography>
              <Typography component="div">
                <strong>Status:</strong>{" "}
                <Chip
                  size="small"
                  color={statusColor(viewIssue.status)}
                  label={viewIssue.status}
                />
              </Typography>
              <Typography>
                <strong>Escalation:</strong> Level {viewIssue.escalation_level ?? 0} - {viewIssue.escalation_label || "Field Engineer"}
              </Typography>
              <Typography>
                <strong>Assigned Officer:</strong> {viewIssue.assigned_to_name || "Unassigned"}
              </Typography>
              <Typography>
                <strong>SLA State:</strong>{" "}
                {viewIssue.is_overdue
                  ? "Overdue"
                  : typeof viewIssue.time_remaining_hours === "number"
                  ? formatRemainingTime(viewIssue.time_remaining_hours)
                  : "-"}
              </Typography>
              {viewIssue.photo_url && (
                <Box>
                  <Typography sx={{ mb: 0.5 }}><strong>Issue Photo:</strong></Typography>
                  <Box
                    component="img"
                    src={viewIssue.photo_url}
                    alt="Issue"
                    sx={{ width: "100%", maxHeight: 320, objectFit: "contain", borderRadius: 1, backgroundColor: "#f5f5f5" }}
                  />
                </Box>
              )}
              {viewIssue.resolved_photo_url && (
                <Box>
                  <Typography sx={{ mb: 0.5 }}><strong>Resolved Photo:</strong></Typography>
                  <Box
                    component="img"
                    src={viewIssue.resolved_photo_url}
                    alt="Resolved"
                    sx={{ width: "100%", maxHeight: 320, objectFit: "contain", borderRadius: 1, backgroundColor: "#f5f5f5" }}
                  />
                </Box>
              )}
              {viewIssue.rejection_photo_url && (
                <Box>
                  <Typography sx={{ mb: 0.5 }}><strong>Reopened Issue Photo:</strong></Typography>
                  <Box
                    component="img"
                    src={viewIssue.rejection_photo_url}
                    alt="Reopened issue"
                    sx={{ width: "100%", maxHeight: 320, objectFit: "contain", borderRadius: 1, backgroundColor: "#f5f5f5" }}
                  />
                </Box>
              )}
            </Stack>
          )}
        </DialogContent>
        <DialogActions>
          <Button onClick={handleCloseViewDialog}>Close</Button>
        </DialogActions>
      </Dialog>

      {/* SUPERVISOR DELETE */}
      <Dialog open={deleteDialogOpen} onClose={handleCloseDeleteDialog} maxWidth="xs" fullWidth>
        <DialogTitle>Delete Issue</DialogTitle>
        <DialogContent>
          <Typography>
            Are you sure you want to delete Issue #{deleteIssue?.id || ""}? This action cannot be undone.
          </Typography>
        </DialogContent>
        <DialogActions>
          <Button onClick={handleCloseDeleteDialog}>Cancel</Button>
          <Button
            color="error"
            variant="contained"
            onClick={handleConfirmDelete}
            disabled={deletingIssue}
          >
            Delete
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
};

export default Dashboard;
