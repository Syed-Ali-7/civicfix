import React from "react";
import { API_BASE_URL } from "../utils/api";
import { StyleSheet } from "react-native";
import { Card, Text, Chip } from "react-native-paper";

const STATUS_COLORS = {
  Open: "#f97316",
  "In Progress": "#eab308",
  Resolved: "#22c55e",
};

const IssueCard = ({ issue, onPress }) => {
  const statusColor = STATUS_COLORS[issue.status] || "#64748b";
  const normalizeUrl = (url) => {
    if (!url) return url;
    try {
      const apiBase = API_BASE_URL.replace(/\/$/, "");
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

  const thumbnail =
    (issue.photo_url && normalizeUrl(issue.photo_url)) ||
    "https://images.unsplash.com/photo-1529429617124-aee711fa4eec?auto=format&fit=crop&w=800&q=60";

  return (
    <Card style={styles.card} onPress={onPress}>
      <Card.Cover
        source={{ uri: thumbnail }}
        style={styles.image}
        resizeMode="contain"
      />
      <Card.Content style={styles.content}>
        <Text variant="titleMedium" style={styles.title}>
          {issue.title}
        </Text>
        <Text variant="bodyMedium" style={styles.description} numberOfLines={2}>
          {issue.description}
        </Text>
        <Chip
          style={[styles.statusChip, { backgroundColor: `${statusColor}22` }]}
          textStyle={{ color: statusColor }}
        >
          {issue.status}
        </Chip>
        {issue.address ? (
          <Text variant="bodySmall" style={styles.meta}>
            📍 {issue.address}
          </Text>
        ) : (
          <Text variant="bodySmall" style={styles.meta}>
            📍 {Number(issue.latitude).toFixed(4)},{" "}
            {Number(issue.longitude).toFixed(4)}
          </Text>
        )}
        <Text variant="bodySmall" style={styles.meta}>
          Reported{" "}
          {new Date(issue.created_at || issue.createdAt).toLocaleString()}
        </Text>
      </Card.Content>
    </Card>
  );
};

const styles = StyleSheet.create({
  card: {
    marginBottom: 16,
    borderRadius: 16,
    overflow: "hidden",
  },
  image: {
    height: 160,
  },
  content: {
    gap: 8,
    paddingVertical: 12,
  },
  title: {
    fontWeight: "600",
  },
  description: {
    color: "#475569",
  },
  statusChip: {
    alignSelf: "flex-start",
  },
  meta: {
    color: "#94a3b8",
  },
});

export default IssueCard;
