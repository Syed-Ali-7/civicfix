import React from 'react';
import { ScrollView, View, StyleSheet, Dimensions } from 'react-native';
import { Text, Card } from 'react-native-paper';
import { BarChart } from 'react-native-chart-kit';

const { width: SCREEN_WIDTH } = Dimensions.get('window');

const StatsDashboardScreen = () => {
  const chartData = {
    labels: ['2020', '2021', '2022', '2023', '2024'],
    datasets: [
      {
        data: [1555, 1481, 1856, 2161, 2385],
      },
    ],
  };

  return (
    <ScrollView style={styles.page} contentContainerStyle={styles.content}>
      {/* Header */}
      <Card style={styles.headerCard}>
        <Card.Content>
          <View style={styles.headerRow}>
            <View style={styles.headerTextBlock}>
              <Text style={styles.headerTitle}>India Road Safety</Text>
              <Text style={styles.headerSubtitle}>Pothole Crisis — Verified Data</Text>
            </View>
            <Text style={styles.headerSource}>Source: MoRTH 2024</Text>
          </View>
        </Card.Content>
      </Card>

      {/* Section 1: Key Statistics */}
      <Text style={styles.sectionLabel}>NATIONAL STATISTICS</Text>
      <View style={styles.gridRow}>
        <Card style={styles.statCard}>
          <Card.Content>
            <Text style={styles.statNumber}>2,385</Text>
            <Text style={styles.statLabel}>Deaths in 2024</Text>
            <Text style={styles.statSub}>Highest in 5 years</Text>
          </Card.Content>
        </Card>
        <Card style={styles.statCard}>
          <Card.Content>
            <Text style={styles.statNumber}>9,438</Text>
            <Text style={styles.statLabel}>Deaths (2020–2024)</Text>
            <Text style={styles.statSub}>Parliament data</Text>
          </Card.Content>
        </Card>
      </View>
      <View style={styles.gridRow}>
        <Card style={styles.statCard}>
          <Card.Content>
            <Text style={styles.statNumber}>53%</Text>
            <Text style={styles.statLabel}>Rise in Deaths</Text>
            <Text style={styles.statSub}>2020 to 2024</Text>
          </Card.Content>
        </Card>
        <Card style={styles.statCard}>
          <Card.Content>
            <Text style={styles.statNumber}>23,056</Text>
            <Text style={styles.statLabel}>Accidents Reported</Text>
            <Text style={styles.statSub}>Across 5 years</Text>
          </Card.Content>
        </Card>
      </View>

      <Text style={styles.sourceTextSmall}>
        Source: Ministry of Road Transport & Highways (MoRTH)
      </Text>

      {/* Section 2: Year Wise Trend */}
      <Text style={styles.sectionLabel}>YEAR-WISE POTHOLE DEATHS</Text>
      <Card style={styles.chartCard}>
        <Card.Content>
          <View style={styles.chartWrapper}>
            <BarChart
              data={chartData}
              width={SCREEN_WIDTH - 56}
              height={220}
              withInnerLines
              showValuesOnTopOfBars
              chartConfig={{
                backgroundColor: '#ffffff',
                backgroundGradientFrom: '#ffffff',
                backgroundGradientTo: '#ffffff',
                decimalPlaces: 0,
                color: () => '#C0392B',
                propsForBackgroundLines: { stroke: '#e6e6e6' },
              }}
              style={{ borderRadius: 12, alignSelf: 'center' }}
              fromZero
            />
          </View>
          <Text style={styles.chartSource}>
            Source: Ministry of Road Transport & Highways (MoRTH), Parliament Reply by Minister Nitin Gadkari, Feb 2025
          </Text>
        </Card.Content>
      </Card>

      {/* Section 3: How CivicFix Addresses This */}
      <Text style={styles.sectionLabel}>HOW CIVICFIX ADDRESSES THIS</Text>
      <Card style={styles.featureCard}>
        <Card.Content style={styles.featureContent}>
          <View style={styles.featureBar} />
          <View style={styles.featureText}>
            <Text style={styles.featureTitle}>AI-Powered Detection</Text>
            <Text style={styles.featureBody}>
              Every submitted photo is verified by our MobileNetV2 model ensuring only genuine potholes are reported.
            </Text>
          </View>
        </Card.Content>
      </Card>
      <Card style={styles.featureCard}>
        <Card.Content style={styles.featureContent}>
          <View style={styles.featureBar} />
          <View style={styles.featureText}>
            <Text style={styles.featureTitle}>Severity Based Priority</Text>
            <Text style={styles.featureBody}>
              Issues are automatically classified as High or Low severity. High severity potholes receive a 7-day resolution target.
            </Text>
          </View>
        </Card.Content>
      </Card>
      <Card style={styles.featureCard}>
        <Card.Content style={styles.featureContent}>
          <View style={styles.featureBar} />
          <View style={styles.featureText}>
            <Text style={styles.featureTitle}>Automated Escalation</Text>
            <Text style={styles.featureBody}>
              If an issue is not resolved within the deadline, it is automatically escalated to the supervising authority.
            </Text>
          </View>
        </Card.Content>
      </Card>
      <Card style={styles.featureCard}>
        <Card.Content style={styles.featureContent}>
          <View style={styles.featureBar} />
          <View style={styles.featureText}>
            <Text style={styles.featureTitle}>Resolution Verification</Text>
            <Text style={styles.featureBody}>
              Officers must upload a resolution photo before an issue can be closed, preventing false or incomplete resolutions.
            </Text>
          </View>
        </Card.Content>
      </Card>

      {/* Section 4: Data Sources */}
      <Text style={styles.sectionLabel}>DATA SOURCES</Text>
      <View style={styles.sourcesList}>
        {[
          { title: 'Ministry of Road Transport & Highways', desc: 'Road Accidents in India Report, 2024', meta: 'morth.nic.in' },
          { title: 'Parliament of India', desc: 'Written Reply by Minister Nitin Gadkari', meta: 'February 2025' },
          { title: 'Outlook India', desc: 'Pothole Deaths Report, February 2026', meta: '' },
        ].map((s, i) => (
          <View key={i} style={styles.sourceRow}>
            <View style={styles.sourceTextBlock}>
              <Text style={styles.sourceTitle}>{s.title}</Text>
              <Text style={styles.sourceDesc}>{s.desc}</Text>
            </View>
            <Text style={styles.sourceMeta}>{s.meta}</Text>
          </View>
        ))}
      </View>

    </ScrollView>
  );
};

const styles = StyleSheet.create({
  page: { backgroundColor: '#F5F6FA', flex: 1 },
  content: { paddingHorizontal: 20, paddingTop: 20, paddingBottom: 40 },
  headerCard: { backgroundColor: '#C0392B', borderRadius: 12, marginBottom: 28, elevation: 3 },
  headerRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-end' },
  headerTextBlock: { paddingVertical: 18 },
  headerTitle: { color: '#ffffff', fontSize: 22, fontWeight: '700' },
  headerSubtitle: { color: '#ffffff', fontSize: 13, marginTop: 6 },
  headerSource: { color: '#ffffff', fontSize: 11, fontStyle: 'italic', marginRight: 8 },
  sectionLabel: { fontSize: 13, color: '#6c757d', letterSpacing: 1.5, marginBottom: 12, marginTop: 4 },
  gridRow: { flexDirection: 'row', justifyContent: 'space-between', gap: 12, marginBottom: 12 },
  statCard: { backgroundColor: '#ffffff', borderRadius: 12, flex: 1, marginRight: 12, paddingVertical: 14, elevation: 3, borderBottomWidth: 3, borderBottomColor: '#C0392B' },
  statNumber: { color: '#C0392B', fontSize: 30, fontWeight: '700' },
  statLabel: { color: '#1A1A2E', fontSize: 13, marginTop: 8, fontWeight: '500' },
  statSub: { color: '#6C757D', fontSize: 11, marginTop: 4 },
  sourceTextSmall: { color: '#6C757D', fontSize: 12, marginBottom: 20 },
  chartCard: { backgroundColor: '#ffffff', borderRadius: 12, paddingVertical: 12, marginBottom: 20, elevation: 3 },
  chartWrapper: { alignItems: 'center', paddingHorizontal: 8 },
  chartSource: { color: '#6C757D', fontSize: 12, fontStyle: 'italic', marginTop: 8 },
  featureCard: { backgroundColor: '#ffffff', borderRadius: 12, marginBottom: 12, elevation: 3 },
  featureContent: { flexDirection: 'row', alignItems: 'flex-start', gap: 12 },
  featureBar: { width: 4, backgroundColor: '#C0392B', borderRadius: 2, marginRight: 12 },
  featureText: { flex: 1 },
  featureTitle: { color: '#1A1A2E', fontSize: 15, fontWeight: '600', marginBottom: 6 },
  featureBody: { color: '#6C757D', fontSize: 13, lineHeight: 20 },
  sourcesList: { marginTop: 8, marginBottom: 40 },
  sourceRow: { paddingVertical: 12, borderBottomWidth: 1, borderBottomColor: '#e9ecef', flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  sourceTextBlock: { flex: 1 },
  sourceTitle: { color: '#1A1A2E', fontSize: 13, fontWeight: '500' },
  sourceDesc: { color: '#6C757D', fontSize: 12 },
  sourceMeta: { color: '#C0392B', fontSize: 11, marginLeft: 12 },
});

export default StatsDashboardScreen;
