import React, { useState } from 'react';
import { View, Text, ScrollView, TouchableOpacity, StyleSheet, RefreshControl } from 'react-native';
import { useProjects, useStats, useTimer } from '../hooks';
import { useAppStore } from '../store/AppContext';
import { Card, ProgressBar, SegmentedControl, Button, EmptyState } from '../components';
import { colors, spacing, radius, typography } from '../theme';

function ProjectCard({ project, onPress }) {
  const stats = useStats(project.id);
  const { isRunning } = useTimer(project.id);

  return (
    <Card onPress={onPress} style={{ marginBottom: spacing.sm }}>
      <View style={{ flexDirection: 'row', alignItems: 'flex-start', justifyContent: 'space-between', marginBottom: 10 }}>
        <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8, flex: 1 }}>
          <View style={{ width: 10, height: 10, borderRadius: 5, backgroundColor: project.color }} />
          <Text style={{ fontSize: 14, fontWeight: '600', color: colors.textPrimary, flex: 1 }} numberOfLines={1}>
            {project.name}
          </Text>
        </View>
        {isRunning && (
          <View style={{ backgroundColor: colors.successLight, borderRadius: radius.sm, paddingHorizontal: 7, paddingVertical: 2 }}>
            <Text style={{ fontSize: 11, color: colors.success, fontWeight: '600' }}>● Live</Text>
          </View>
        )}
      </View>

      {project.description ? (
        <Text style={{ fontSize: 12, color: colors.textFaint, marginBottom: 10 }} numberOfLines={2}>{project.description}</Text>
      ) : null}

      <ProgressBar value={stats.progress} color={project.color} />
      <Text style={{ fontSize: 11, color: colors.textFaint, marginTop: 5, textAlign: 'right' }}>
        {stats.done}/{stats.total} tasks complete
      </Text>

      {project.statusComment ? (
        <Text style={{ fontSize: 11, color: colors.textMuted, fontStyle: 'italic', marginTop: 6 }}>
          "{project.statusComment}"
        </Text>
      ) : null}
    </Card>
  );
}

export default function DashboardScreen({ navigation }) {
  const { projects } = useProjects();
  const [type, setType] = useState('work');
  const [refreshing, setRefreshing] = useState(false);

  const visible = projects.filter(p => (p.type ?? 'work') === type);

  const onRefresh = async () => {
    setRefreshing(true);
    setTimeout(() => setRefreshing(false), 1000);
  };

  return (
    <ScrollView
      style={styles.container}
      contentContainerStyle={{ padding: spacing.lg, paddingBottom: 40 }}
      refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} />}
    >
      {/* Header */}
      <View style={{ marginBottom: spacing.lg }}>
        <Text style={typography.h1}>Dashboard</Text>
        <Text style={{ fontSize: 13, color: colors.textFaint, marginTop: 3 }}>{projects.length} projects total</Text>
      </View>

      {/* Toggle */}
      <SegmentedControl
        options={[{ label: 'Work', value: 'work' }, { label: 'Personal', value: 'personal' }]}
        value={type}
        onChange={setType}
      />

      <View style={{ height: spacing.lg }} />

      {/* Projects */}
      {visible.length === 0 ? (
        <EmptyState icon="📁" title={`No ${type} projects`} subtitle="Add a project from the Projects tab" />
      ) : (
        visible.map(p => (
          <ProjectCard
            key={p.id}
            project={p}
            onPress={() => navigation.navigate('ProjectDetail', { projectId: p.id })}
          />
        ))
      )}
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.bgPage },
});
