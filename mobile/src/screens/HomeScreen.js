import React, { useCallback, useState, useMemo } from "react";
import {
  View,
  StyleSheet,
  FlatList,
  RefreshControl,
  ScrollView,
} from "react-native";
import {
  Text,
  ActivityIndicator,
  IconButton,
  Button,
  Chip,
} from "react-native-paper";
import { useFocusEffect } from "@react-navigation/native";
import IssueCard from "../components/IssueCard";
import api from "../utils/api";
import { useAuth } from "../context/AuthContext";

const STATUS_COLORS = {
  Open: "#f97316",
  "In Progress": "#eab308",
  Resolved: "#22c55e",
};

const HomeScreen = ({ navigation }) => {
  const { user } = useAuth();
  const [issues, setIssues] = useState([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState(null);
  const [selectedFilter, setSelectedFilter] = useState("All");
  const [sortBy, setSortBy] = useState("newest"); // 'newest', 'oldest', 'status'

  const fetchIssues = async (isRefreshing = false) => {
    try {
      if (!isRefreshing) {
        setLoading(true);
      }
      setError(null);
      const { data } = await api.get("/api/issues");
      setIssues(data);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  useFocusEffect(
    useCallback(() => {
      fetchIssues();
    }, [])
  );

  const onRefresh = () => {
    setRefreshing(true);
    fetchIssues(true);
  };

  // Filter and sort issues
  const filteredAndSortedIssues = useMemo(() => {
    let filtered = issues;

    // Apply filter
    if (selectedFilter !== "All") {
      filtered = issues.filter((issue) => issue.status === selectedFilter);
    }

    // Apply sorting
    const sorted = [...filtered].sort((a, b) => {
      switch (sortBy) {
        case "newest":
          return (
            new Date(b.created_at || b.createdAt) -
            new Date(a.created_at || a.createdAt)
          );
        case "oldest":
          return (
            new Date(a.created_at || a.createdAt) -
            new Date(b.created_at || b.createdAt)
          );
        case "status":
          const statusOrder = { Open: 1, "In Progress": 2, Resolved: 3 };
          return statusOrder[a.status] - statusOrder[b.status];
        default:
          return 0;
      }
    });

    return sorted;
  }, [issues, selectedFilter, sortBy]);

  if (loading && !refreshing && !issues.length) {
    return (
      <View style={styles.loaderContainer}>
        <ActivityIndicator animating color="#2563eb" size="large" />
        <Text style={styles.loaderText}>Loading latest reports...</Text>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <View>
          <Text variant="headlineSmall" style={styles.greeting}>
            Hello, {user?.name?.split(" ")[0] || "there"}
          </Text>
          <Text variant="bodyMedium" style={styles.caption}>
            Here’s what’s happening around your community today.
          </Text>
        </View>
        <IconButton
          icon="refresh"
          onPress={onRefresh}
          iconColor="#2563eb"
          size={24}
        />
      </View>

      {/* Filter Buttons */}
      <View style={styles.filterContainer}>
        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          style={styles.filterScroll}
        >
          {["All", "Open", "In Progress", "Resolved"].map((status) => (
            <Chip
              key={status}
              selected={selectedFilter === status}
              onPress={() => setSelectedFilter(status)}
              style={[
                styles.filterChip,
                selectedFilter === status && {
                  backgroundColor:
                    status === "All" ? "#2563eb" : STATUS_COLORS[status],
                },
              ]}
              textStyle={{
                color:
                  selectedFilter === status
                    ? "white"
                    : status === "All"
                    ? "#2563eb"
                    : STATUS_COLORS[status],
                fontWeight: selectedFilter === status ? "600" : "400",
              }}
            >
              {status}
            </Chip>
          ))}
        </ScrollView>
      </View>

      {/* Sort Options */}
      <View style={styles.sortContainer}>
        <Text variant="bodySmall" style={styles.sortLabel}>
          Sort by:
        </Text>
        <ScrollView horizontal showsHorizontalScrollIndicator={false}>
          {[
            { key: "newest", label: "Newest First" },
            { key: "oldest", label: "Oldest First" },
            { key: "status", label: "Status" },
          ].map((option) => (
            <Button
              key={option.key}
              mode={sortBy === option.key ? "contained" : "outlined"}
              onPress={() => setSortBy(option.key)}
              style={styles.sortButton}
              compact
            >
              {option.label}
            </Button>
          ))}
        </ScrollView>
      </View>

      {error ? (
        <View style={styles.errorBox}>
          <Text style={styles.errorText}>{error}</Text>
          <Text style={styles.retryLink} onPress={fetchIssues}>
            Tap to retry
          </Text>
        </View>
      ) : (
        <FlatList
          data={filteredAndSortedIssues}
          keyExtractor={(item) => item.id}
          renderItem={({ item }) => (
            <IssueCard
              issue={item}
              onPress={() =>
                navigation.navigate("IssueDetail", { issueId: item.id })
              }
            />
          )}
          contentContainerStyle={styles.list}
          refreshControl={
            <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
          }
          ListEmptyComponent={
            <View style={styles.emptyState}>
              <Text variant="titleMedium">
                {selectedFilter === "All"
                  ? "No issues reported yet."
                  : `No ${selectedFilter.toLowerCase()} issues found.`}
              </Text>
              <Text variant="bodyMedium" style={styles.caption}>
                {selectedFilter === "All"
                  ? "Be the first to highlight an issue in your area."
                  : "Try selecting a different filter."}
              </Text>
            </View>
          }
        />
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#f8fafc",
    paddingHorizontal: 16,
    paddingTop: 48,
  },
  header: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 16,
  },
  greeting: {
    fontWeight: "700",
  },
  caption: {
    color: "#64748b",
  },
  list: {
    paddingBottom: 24,
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
  errorBox: {
    backgroundColor: "#fee2e2",
    padding: 16,
    borderRadius: 12,
  },
  errorText: {
    color: "#b91c1c",
    fontWeight: "600",
  },
  retryLink: {
    marginTop: 8,
    color: "#2563eb",
    fontWeight: "600",
  },
  emptyState: {
    alignItems: "center",
    marginTop: 72,
    gap: 8,
  },
  filterContainer: {
    paddingHorizontal: 16,
    paddingVertical: 12,
    backgroundColor: "white",
    borderBottomWidth: 1,
    borderBottomColor: "#e5e7eb",
  },
  filterScroll: {
    flexDirection: "row",
  },
  filterChip: {
    marginRight: 8,
    borderWidth: 1,
    borderColor: "#d1d5db",
  },
  sortContainer: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 16,
    paddingVertical: 12,
    backgroundColor: "white",
    borderBottomWidth: 1,
    borderBottomColor: "#e5e7eb",
  },
  sortLabel: {
    marginRight: 12,
    color: "#6b7280",
    fontWeight: "500",
  },
  sortButton: {
    marginRight: 8,
  },
});

export default HomeScreen;
