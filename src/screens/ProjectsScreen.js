import React, { useState } from 'react';
import { View, Text, ScrollView, TouchableOpacity, TextInput, Modal, Alert, StyleSheet } from 'react-native';
import { useProjects } from '../hooks';
import { Card, ProgressBar, Button, EmptyState, SegmentedControl } from '../components';
import { colors, spacing, radius, typography } from '../theme';
import { useStats } from '../hooks';

const PROJECT_COLORS = ['#2563eb','#16a34a','#dc2626','#7c3aed','#d97706','#0891b2','#db2777','#65a30d'];

function AddProjectModal({ visible, onClose, onAdd }) {
  const [name, setName] = useState('');
  const [desc, setDesc] = useState('');
  const [color, setColor] = useState('#2563eb');
  const [type, setType]   = useState('work');

  const submit = () => {
    if (!name.trim()) return;
    onAdd({ name: name.trim(), description: desc.trim(), color, type, status: 'working-on-it', statusComment: '' });
    setName(''); setDesc(''); setColor('#2563eb'); setType('work');
    onClose();
  };

  return (
    <Modal visible={visible} animationType="slide" presentationStyle="pageSheet" onRequestClose={onClose}>
      <View style={styles.modalContainer}>
        <View style={styles.modalHeader}>
          <Text style={styles.modalTitle}>New Project</Text>
          <TouchableOpacity onPress={onClose}><Text style={{ fontSize: 16, color: colors.accent }}>Cancel</Text></TouchableOpacity>
        </View>

        <ScrollView style={{ flex: 1 }} contentContainerStyle={{ padding: spacing.lg }}>
          <Text style={styles.label}>Name *</Text>
          <TextInput style={styles.input} value={name} onChangeText={setName} placeholder="Project name" placeholderTextColor={colors.textPlaceholder} autoFocus />

          <Text style={styles.label}>Description</Text>
          <TextInput style={[styles.input, { height: 80 }]} value={desc} onChangeText={setDesc} placeholder="What is this project about?" placeholderTextColor={colors.textPlaceholder} multiline />

          <Text style={styles.label}>Type</Text>
          <SegmentedControl
            options={[{ label: 'Work', value: 'work' }, { label: 'Personal', value: 'personal' }]}
            value={type} onChange={setType}
          />

          <View style={{ height: spacing.md }} />
          <Text style={styles.label}>Color</Text>
          <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 10, marginBottom: spacing.lg }}>
            {PROJECT_COLORS.map(c => (
              <TouchableOpacity key={c} onPress={() => setColor(c)} style={{ width: 32, height: 32, borderRadius: 16, backgroundColor: c, borderWidth: color === c ? 3 : 0, borderColor: colors.white, ...( color === c ? { shadowColor: c, shadowOpacity: 0.6, shadowRadius: 4, elevation: 4 } : {}) }} />
            ))}
          </View>

          <Button label="Create Project" onPress={submit} />
        </ScrollView>
      </View>
    </Modal>
  );
}

function ProjectRow({ project, onPress, onDelete }) {
  const stats = useStats(project.id);
  return (
    <Card onPress={onPress} style={{ marginBottom: spacing.sm }}>
      <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8, marginBottom: 8 }}>
        <View style={{ width: 10, height: 10, borderRadius: 5, backgroundColor: project.color }} />
        <Text style={{ fontSize: 14, fontWeight: '600', color: colors.textPrimary, flex: 1 }} numberOfLines={1}>{project.name}</Text>
        <View style={{ backgroundColor: colors.accentLight, borderRadius: radius.sm, paddingHorizontal: 7, paddingVertical: 2 }}>
          <Text style={{ fontSize: 10, fontWeight: '600', color: colors.accent, textTransform: 'uppercase' }}>{project.type ?? 'work'}</Text>
        </View>
      </View>
      {project.description ? <Text style={{ fontSize: 12, color: colors.textFaint, marginBottom: 8 }} numberOfLines={1}>{project.description}</Text> : null}
      <ProgressBar value={stats.progress} color={project.color} />
      <Text style={{ fontSize: 11, color: colors.textFaint, marginTop: 4, textAlign: 'right' }}>{stats.done}/{stats.total} done</Text>
    </Card>
  );
}

export default function ProjectsScreen({ navigation }) {
  const { projects, addProject, deleteProject } = useProjects();
  const [showAdd, setShowAdd] = useState(false);

  const handleDelete = (project) => {
    Alert.alert('Delete Project', `Delete "${project.name}"? This removes all tasks and notes.`, [
      { text: 'Cancel', style: 'cancel' },
      { text: 'Delete', style: 'destructive', onPress: () => deleteProject(project.id) },
    ]);
  };

  return (
    <View style={{ flex: 1, backgroundColor: colors.bgPage }}>
      <ScrollView contentContainerStyle={{ padding: spacing.lg, paddingBottom: 40 }}>
        <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginBottom: spacing.lg }}>
          <Text style={typography.h1}>Projects</Text>
          <Button label="+ Add" size="sm" onPress={() => setShowAdd(true)} />
        </View>

        {projects.length === 0 ? (
          <EmptyState icon="📂" title="No projects yet" subtitle="Tap + Add to create your first project" />
        ) : (
          projects.map(p => (
            <ProjectRow
              key={p.id} project={p}
              onPress={() => navigation.navigate('ProjectDetail', { projectId: p.id })}
              onDelete={() => handleDelete(p)}
            />
          ))
        )}
      </ScrollView>

      <AddProjectModal visible={showAdd} onClose={() => setShowAdd(false)} onAdd={addProject} />
    </View>
  );
}

const styles = StyleSheet.create({
  modalContainer: { flex: 1, backgroundColor: colors.bgPage },
  modalHeader: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', padding: spacing.lg, borderBottomWidth: 1, borderBottomColor: colors.border },
  modalTitle: { fontSize: 17, fontWeight: '600', color: colors.textPrimary },
  label: { fontSize: 12, fontWeight: '500', color: colors.textMuted, marginBottom: 5 },
  input: { backgroundColor: colors.bgInput, borderWidth: 1, borderColor: colors.borderMed, borderRadius: radius.md, padding: spacing.md, fontSize: 14, color: colors.textPrimary, marginBottom: spacing.md },
});
