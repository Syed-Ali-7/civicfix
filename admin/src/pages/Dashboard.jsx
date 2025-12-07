import React, { useState, useEffect } from "react";
import {
  Box,
  Typography,
  Button,
  CircularProgress,
  Alert,
  Chip,
  Paper,
  IconButton,
  Tooltip,
  Stack,
  TextField,
} from "@mui/material";
import { DataGrid } from "@mui/x-data-grid";
import {
  Visibility as ViewIcon,
  Delete as DeleteIcon,
} from "@mui/icons-material";
import { useNavigate } from "react-router-dom";
import { issuesAPI } from "../api/api";

const Dashboard = () => {
  const navigate = useNavigate();
  const [issues, setIssues] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [search, setSearch] = useState("");

  useEffect(() => {
    fetchIssues();
  }, []);

  const fetchIssues = async () => {
    try {
      setLoading(true);
      const response = await issuesAPI.getAll();
      const issuesData = (
        Array.isArray(response) ? response : response.issues || []
      ).map((issue, index) => ({
        ...issue,
        index: index + 1,
        created_at: issue.created_at || issue.createdAt,
      }));
      setIssues(issuesData);
      setError("");
    } catch (err) {
      setError(
        err.response?.data?.message || err.message || "Failed to fetch issues"
      );
    } finally {
      setLoading(false);
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

  const [filterReviewOnly, setFilterReviewOnly] = useState(false);

  const columns = [
    {
      field: "thumb",
      headerName: "",
      width: 80,
      sortable: false,
      filterable: false,
      renderCell: (params) => (
        <img
          src={
            params.row.photo_url ||
            params.row.resolved_photo_url ||
            "https://images.unsplash.com/photo-1529429617124-aee711fa4eec?auto=format&fit=crop&w=200&q=60"
          }
          alt="thumb"
          style={{ width: 56, height: 40, objectFit: "cover", borderRadius: 6 }}
        />
      ),
    },
    {
      field: "index",
      headerName: "#",
      width: 60,
      headerAlign: "center",
      align: "center",
      sortable: false,
      filterable: false,
    },
    {
      field: "id",
      headerName: "ID",
      width: 80,
      headerAlign: "center",
      align: "center",
    },
    {
      field: "title",
      headerName: "Title",
      // Reduce the title column width so it doesn't take up too much space
      // and allow the actions column to remain visible.
      width: 220,
      flex: 0,
    },
    {
      field: "status",
      headerName: "Status",
      width: 130,
      headerAlign: "center",
      align: "center",
      renderCell: (params) => (
        <Chip
          label={params.value}
          color={getStatusColor(params.value)}
          size="small"
        />
      ),
    },
    {
      field: "needs_review",
      headerName: "Review Status",
      width: 130,
      headerAlign: "center",
      align: "center",
      renderCell: (params) =>
        params.value ? (
          <Chip
            label="Needs Review"
            color="error"
            size="small"
            variant="outlined"
          />
        ) : (
          <Chip
            label="Verified"
            color="success"
            size="small"
            variant="outlined"
          />
        ),
    },
    {
      field: "created_at",
      headerName: "Created Date",
      width: 150,
      headerAlign: "center",
      align: "center",
      renderCell: (params) => {
        const dateValue = params.row.created_at || params.row.createdAt;
        if (!dateValue) return "";

        try {
          const date = new Date(dateValue);
          if (isNaN(date.getTime())) return "";
          return date.toLocaleString("en-US", {
            year: "numeric",
            month: "short",
            day: "numeric",
            hour: "2-digit",
            minute: "2-digit",
          });
        } catch (error) {
          return "";
        }
      },
    },
    {
      field: "actions",
      headerName: "Actions",
      // Make actions wider so both View and Delete buttons fit comfortably
      // without wrapping or being hidden.
      width: 180,
      headerAlign: "center",
      align: "center",
      sortable: false,
      renderCell: (params) => (
        <Box sx={{ display: "flex", gap: 1 }}>
          <Button
            variant="contained"
            size="small"
            startIcon={<ViewIcon />}
            onClick={() => navigate(`/issue/${params.row.id}`)}
          >
            View
          </Button>
          <Button
            variant="outlined"
            color="error"
            size="small"
            startIcon={<DeleteIcon />}
            onClick={async (e) => {
              // Prevent row click propagation
              e.stopPropagation();
              const id = params.row.id;
              const ok = window.confirm(
                "Are you sure you want to delete this issue? This action cannot be undone."
              );
              if (!ok) return;
              try {
                setLoading(true);
                await issuesAPI.delete(id);
                // refresh list
                await fetchIssues();
                setError("");
              } catch (err) {
                setError(
                  err.response?.data?.message ||
                    err.message ||
                    "Failed to delete issue"
                );
              } finally {
                setLoading(false);
              }
            }}
          >
            Delete
          </Button>
        </Box>
      ),
    },
  ];

  const filteredIssues = issues.filter((issue) => {
    if (filterReviewOnly && !issue.needs_review) {
      return false;
    }
    if (!search) return true;
    const q = search.toLowerCase();
    return (
      (issue.title || "").toLowerCase().includes(q) ||
      (issue.description || "").toLowerCase().includes(q) ||
      (issue.status || "").toLowerCase().includes(q) ||
      (issue.address || "").toLowerCase().includes(q)
    );
  });

  if (loading) {
    return (
      <Box sx={{ display: "flex", justifyContent: "center", mt: 4 }}>
        <CircularProgress />
      </Box>
    );
  }

  return (
    <Box sx={{ p: 3 }}>
      <Stack
        direction="row"
        alignItems="center"
        justifyContent="space-between"
        sx={{ mb: 2 }}
      >
        <Typography variant="h4" component="h1">
          Issues Dashboard
        </Typography>
        <Stack direction="row" spacing={1} alignItems="center">
          <TextField
            size="small"
            placeholder="Search issues..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
          <Button
            variant={filterReviewOnly ? "contained" : "outlined"}
            color={filterReviewOnly ? "error" : "inherit"}
            size="small"
            onClick={() => setFilterReviewOnly(!filterReviewOnly)}
          >
            {filterReviewOnly
              ? `Needs Review (${issues.filter((i) => i.needs_review).length})`
              : "Show Needs Review"}
          </Button>
          <Tooltip title="Refresh">
            <IconButton onClick={fetchIssues}>
              <svg
                width="20"
                height="20"
                viewBox="0 0 24 24"
                fill="none"
                xmlns="http://www.w3.org/2000/svg"
              >
                <path
                  d="M21 12a9 9 0 10-2.53 6.06"
                  stroke="#374151"
                  strokeWidth="1.5"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                />
              </svg>
            </IconButton>
          </Tooltip>
        </Stack>
      </Stack>

      {error && (
        <Alert severity="error" sx={{ mb: 2 }}>
          {error}
        </Alert>
      )}

      <Paper sx={{ p: 2, borderRadius: 2, boxShadow: 2 }}>
        <Box sx={{ height: 640, width: "100%" }}>
          <DataGrid
            rows={filteredIssues || []}
            columns={columns}
            pageSize={10}
            rowsPerPageOptions={[10, 25, 50]}
            disableSelectionOnClick
            getRowId={(row) => row.id || row._id}
            initialState={{
              sorting: {
                sortModel: [{ field: "created_at", sort: "desc" }],
              },
            }}
            sx={{
              "& .MuiDataGrid-root": {
                border: "none",
              },
              "& .MuiDataGrid-cell": {
                borderBottom: "1px solid #f0f0f0",
              },
              "& .MuiDataGrid-columnHeaders": {
                backgroundColor: "#f8f9fa",
                borderBottom: "2px solid #e0e0e0",
              },
              "& .MuiDataGrid-row:hover": {
                backgroundColor: "#fbfdff",
              },
            }}
          />
        </Box>
      </Paper>
    </Box>
  );
};

export default Dashboard;
