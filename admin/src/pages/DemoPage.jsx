import React, { useEffect, useMemo, useState } from "react";
import {
  Alert,
  Box,
  Button,
  Card,
  CardActions,
  CardContent,
  Chip,
  FormControl,
  Grid,
  InputLabel,
  MenuItem,
  Select,
  Snackbar,
  Stack,
  Step,
  StepLabel,
  Stepper,
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableRow,
  Typography,
} from "@mui/material";
import RefreshIcon from "@mui/icons-material/Refresh";
import FastForwardIcon from "@mui/icons-material/FastForward";
import BoltIcon from "@mui/icons-material/Bolt";
import EngineeringIcon from "@mui/icons-material/Engineering";
import SupervisorAccountIcon from "@mui/icons-material/SupervisorAccount";
import AdminPanelSettingsIcon from "@mui/icons-material/AdminPanelSettings";
import api, { adminAPI, issuesAPI } from "../api/api";

const truncate = (text, max = 30) => {
  const value = text || "";
  return value.length > max ? `${value.slice(0, max)}...` : value;
};

const formatDate = (value) => {
  if (!value) return "-";
  const d = new Date(value);
  if (Number.isNaN(d.getTime())) return "-";
  return d.toLocaleString("en-GB", {
    day: "2-digit",
    month: "short",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });
};

const severityChip = (severity) => (
  <Chip
    size="small"
    color={(severity || "low").toLowerCase() === "high" ? "error" : "success"}
    label={(severity || "low").toLowerCase() === "high" ? "High" : "Low"}
  />
);

const timelineSteps = [
  {
    label: "Level 0 - Field Engineer",
    subtext: "Initial assignment - SLA starts",
    icon: <EngineeringIcon fontSize="small" />,
  },
  {
    label: "Level 1 - Zonal Officer",
    subtext: "Day 5 (high) / Day 10 (low) - SLA 70% elapsed",
    icon: <SupervisorAccountIcon fontSize="small" />,
  },
  {
    label: "Level 2 - Supervisor",
    subtext: "Day 7 (high) / Day 15 (low) - SLA fully breached",
    icon: <AdminPanelSettingsIcon fontSize="small" />,
  },
];

const DemoPage = () => {
  const designation = localStorage.getItem("designation") || "";
  const [issues, setIssues] = useState([]);
  const [selectedIssueId, setSelectedIssueId] = useState("");
  const [loading, setLoading] = useState(false);
  const [lastAction, setLastAction] = useState(null);
  const [snackbar, setSnackbar] = useState({
    open: false,
    severity: "success",
    message: "",
  });

  const selectedIssue = useMemo(
    () => issues.find((i) => i.id === selectedIssueId) || null,
    [issues, selectedIssueId]
  );

  const fetchIssues = async () => {
    try {
      setLoading(true);
      const response = await issuesAPI.getAll();
      const payload = Array.isArray(response)
        ? response
        : response.issues || [];
      setIssues(payload);

      if (!selectedIssueId && payload.length > 0) {
        setSelectedIssueId(payload[0].id);
      }
    } catch (err) {
      setSnackbar({
        open: true,
        severity: "error",
        message: err.response?.data?.message || "Failed to fetch issues",
      });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchIssues();
  }, []);

  const refreshSelectedIssue = async () => {
    await fetchIssues();
  };

  const capturePreviousState = () => {
    if (!selectedIssue) return null;
    return {
      escalation_level: selectedIssue.escalation_level,
      escalation_label: selectedIssue.escalation_label,
      assigned_to: selectedIssue.assigned_to,
      escalated: selectedIssue.escalated,
      escalated_at: selectedIssue.escalated_at,
      status: selectedIssue.status,
      severity: selectedIssue.severity,
      created_at: selectedIssue.created_at,
      sla_deadline: selectedIssue.sla_deadline,
    };
  };

  // DEMO CONTROLS
  const handleDemoAction = async (type, action) => {
    if (!selectedIssueId) return;

    try {
      const previousState = capturePreviousState();
      setLoading(true);
      const result = await action();
      setLastAction({ type, issueId: selectedIssueId, previousState });
      setSnackbar({
        open: true,
        severity: "success",
        message: result,
      });
      await refreshSelectedIssue();
    } catch (err) {
      setSnackbar({
        open: true,
        severity: "error",
        message: err.response?.data?.message || "Demo action failed",
      });
    } finally {
      setLoading(false);
    }
  };

  const handleUndo = async () => {
    if (!lastAction) return;

    try {
      setLoading(true);
      await api.post("/demo/undo", {
        issueId: lastAction.issueId,
        previousState: lastAction.previousState,
      });
      setSnackbar({
        open: true,
        severity: "success",
        message: "Last action undone successfully",
      });
      setLastAction(null);
      await refreshSelectedIssue();
    } catch (err) {
      setSnackbar({
        open: true,
        severity: "error",
        message: err.response?.data?.message || "Undo failed",
      });
    } finally {
      setLoading(false);
    }
  };

  if (designation !== "supervisor") {
    return (
      <Box sx={{ p: 3 }}>
        <Alert severity="error">Only supervisors can access Demo Controls.</Alert>
      </Box>
    );
  }

  return (
    <Box sx={{ p: 3 }}>
      {/* DEMO CONTROLS */}
      <Typography variant="h4" sx={{ mb: 0.5 }}>
        Demo Control Panel
      </Typography>
      <Typography variant="subtitle1" color="text.secondary" sx={{ mb: 2 }}>
        For demonstration purposes only
      </Typography>

      <Alert severity="warning" sx={{ mb: 3 }}>
        These controls simulate time-based escalation for demo purposes. Do not use in production.
      </Alert>

      {/* DEMO CONTROLS */}
      <Card sx={{ mb: 3 }}>
        <CardContent>
          <Typography variant="h6" sx={{ mb: 2 }}>
            Select Issue to Demo
          </Typography>

          <Stack direction={{ xs: "column", md: "row" }} spacing={2} alignItems={{ xs: "stretch", md: "center" }}>
            <FormControl fullWidth>
              <InputLabel id="demo-issue-select-label">Issue</InputLabel>
              <Select
                labelId="demo-issue-select-label"
                label="Issue"
                value={selectedIssueId}
                onChange={(e) => setSelectedIssueId(e.target.value)}
              >
                {issues.map((issue) => (
                  <MenuItem key={issue.id} value={issue.id}>
                    <Stack direction="row" spacing={1} alignItems="center" sx={{ width: "100%" }}>
                      <Typography variant="body2">{`Issue #${issue.id} - ${truncate(issue.description)}`}</Typography>
                      {severityChip(issue.severity)}
                    </Stack>
                  </MenuItem>
                ))}
              </Select>
            </FormControl>
            <Button
              variant="outlined"
              startIcon={<RefreshIcon />}
              onClick={refreshSelectedIssue}
              disabled={loading}
            >
              Refresh
            </Button>
          </Stack>

          {selectedIssue && (
            <Stack spacing={0.8} sx={{ mt: 2 }}>
              <Typography><strong>Current Status:</strong> {selectedIssue.status}</Typography>
              <Typography><strong>Escalation Level:</strong> {selectedIssue.escalation_level ?? 0}</Typography>
              <Typography><strong>Assigned To:</strong> {selectedIssue.assigned_to_name || "Unassigned"}</Typography>
              <Typography><strong>SLA Deadline:</strong> {formatDate(selectedIssue.sla_deadline)}</Typography>
            </Stack>
          )}
        </CardContent>
      </Card>

      {/* DEMO CONTROLS */}
      <Grid container spacing={2} sx={{ mb: 3 }}>
        <Grid item xs={12} md={6} lg={3}>
          <Card>
            <CardContent>
              <Typography variant="h6" color="primary">Reset Issue</Typography>
              <Typography variant="body2" color="text.secondary" sx={{ mt: 1 }}>
                Resets issue to fresh Level 0 state assigned to Field Engineer
              </Typography>
            </CardContent>
            <CardActions>
              <Button
                fullWidth
                variant="contained"
                color="primary"
                startIcon={<RefreshIcon />}
                disabled={!selectedIssueId || loading}
                onClick={() =>
                  handleDemoAction("reset", async () => {
                    await api.post("/demo/reset-issue", { issueId: selectedIssueId });
                    return "Issue reset to Level 0 - Field Engineer";
                  })
                }
              >
                Reset Issue
              </Button>
            </CardActions>
          </Card>
        </Grid>

        <Grid item xs={12} md={6} lg={3}>
          <Card>
            <CardContent>
              <Typography variant="h6" color="warning.main">Simulate Day 5</Typography>
              <Typography variant="body2" color="text.secondary" sx={{ mt: 1 }}>
                Simulates Day 5 breach - triggers Level 1 escalation to Zonal Officer
              </Typography>
            </CardContent>
            <CardActions>
              <Button
                fullWidth
                variant="contained"
                color="warning"
                startIcon={<FastForwardIcon />}
                disabled={!selectedIssueId || loading}
                onClick={() =>
                  handleDemoAction("day5", async () => {
                    await api.post("/demo/simulate-breach", { issueId: selectedIssueId, day: 5 });
                    return "Day 5 simulated - run escalation to see effect";
                  })
                }
              >
                Simulate Day 5
              </Button>
            </CardActions>
          </Card>
        </Grid>

        <Grid item xs={12} md={6} lg={3}>
          <Card>
            <CardContent>
              <Typography variant="h6" color="error.main">Simulate Day 7</Typography>
              <Typography variant="body2" color="text.secondary" sx={{ mt: 1 }}>
                Simulates Day 7 breach - triggers Level 2 escalation to Supervisor
              </Typography>
            </CardContent>
            <CardActions>
              <Button
                fullWidth
                variant="contained"
                color="error"
                startIcon={<FastForwardIcon />}
                disabled={!selectedIssueId || loading}
                onClick={() =>
                  handleDemoAction("day7", async () => {
                    await api.post("/demo/simulate-breach", { issueId: selectedIssueId, day: 7 });
                    return "Day 7 simulated - run escalation to see effect";
                  })
                }
              >
                Simulate Day 7
              </Button>
            </CardActions>
          </Card>
        </Grid>

        <Grid item xs={12} md={6} lg={3}>
          <Card>
            <CardContent>
              <Typography variant="h6" color="secondary.main">Run Escalation Now</Typography>
              <Typography variant="body2" color="text.secondary" sx={{ mt: 1 }}>
                Immediately runs the hourly SLA escalation check
              </Typography>
            </CardContent>
            <CardActions>
              <Button
                fullWidth
                variant="contained"
                color="secondary"
                startIcon={<BoltIcon />}
                disabled={loading}
                onClick={async () => {
                  try {
                    setLoading(true);
                    const result = await adminAPI.triggerEscalation();
                    setSnackbar({
                      open: true,
                      severity: "success",
                      message: `Escalation complete - ${result.escalated_count || 0} issues updated`,
                    });
                    await refreshSelectedIssue();
                  } catch (err) {
                    setSnackbar({
                      open: true,
                      severity: "error",
                      message: err.response?.data?.message || "Failed to run escalation",
                    });
                  } finally {
                    setLoading(false);
                  }
                }}
              >
                Run Escalation
              </Button>
            </CardActions>
          </Card>
        </Grid>
      </Grid>

      {/* DEMO CONTROLS */}
      <Card sx={{ mb: 3 }}>
        <CardContent>
          <Typography variant="h6" sx={{ mb: 2 }}>Escalation Journey</Typography>
          <Stepper
            alternativeLabel
            activeStep={Math.max(0, Math.min(2, Number(selectedIssue?.escalation_level || 0)))}
            sx={{
              "& .MuiStepIcon-root": { color: "grey.400" },
              "& .MuiStepIcon-root.Mui-active": { color: "primary.main" },
              "& .MuiStepIcon-root.Mui-completed": { color: "success.main" },
            }}
          >
            {timelineSteps.map((step) => (
              <Step
                key={step.label}
                completed={Number(selectedIssue?.escalation_level || 0) > timelineSteps.indexOf(step)}
              >
                <StepLabel icon={step.icon}>
                  <Typography variant="body2" sx={{ fontWeight: 600 }}>{step.label}</Typography>
                  <Typography variant="caption" color="text.secondary">{step.subtext}</Typography>
                </StepLabel>
              </Step>
            ))}
          </Stepper>
        </CardContent>
      </Card>

      {/* DEMO CONTROLS */}
      <Card sx={{ mb: 3 }}>
        <CardContent>
          <Typography variant="h6" sx={{ mb: 2 }}>How SLA Works in CivicFix</Typography>
          <Table size="small">
            <TableHead>
              <TableRow>
                <TableCell>Severity</TableCell>
                <TableCell>SLA</TableCell>
                <TableCell>Day 5/10</TableCell>
                <TableCell>Day 7/15</TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              <TableRow>
                <TableCell>High</TableCell>
                <TableCell>7 days</TableCell>
                <TableCell>{"-> Zonal Officer"}</TableCell>
                <TableCell>{"-> Supervisor"}</TableCell>
              </TableRow>
              <TableRow>
                <TableCell>Low</TableCell>
                <TableCell>15 days</TableCell>
                <TableCell>{"-> Zonal Officer"}</TableCell>
                <TableCell>{"-> Supervisor"}</TableCell>
              </TableRow>
            </TableBody>
          </Table>
        </CardContent>
      </Card>

      {/* DEMO CONTROLS */}
      <Button
        fullWidth
        color="warning"
        variant="outlined"
        disabled={!lastAction || loading}
        onClick={handleUndo}
      >
        ↩ Undo Last Action
      </Button>

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
    </Box>
  );
};

export default DemoPage;
