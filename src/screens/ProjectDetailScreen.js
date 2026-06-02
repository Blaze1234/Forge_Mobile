import React, { useState } from 'react';
import { View, Text, ScrollView, TouchableOpacity, TextInput, Alert, Modal, StyleSheet, Image } from 'react-native';
import { useTasks, useNotes, useTimer, useStats } from '../hooks';
import { Card, Button, PriorityBadge, StatusBadge, ProgressBar, EmptyState, SectionHeader } from '../components';
import { colors, spacing, radius, typography } from '../theme';
import { useProjects } from '../hooks';

const PRIORITIES    = ['low','medium','high','critical'];
const TASK_STATUSES = ['on-hold','working-on-it','completed-it'];
const STATUS_LABELS = { 'on-hold': 'On Hold', 'working-on-it': 'Working On It', 'completed-it': 'Completed' };

// ── Note card ──────────────────────────────────────────────────────────────────
function NoteCard({ note, onEdit, onDelete }) {
  return (
    <Card style={{ marginBottom: spacing.sm }}>
      <View style={{ flexDirection: 'row', alignItems: 'flex-start', justifyContent: 'space-between', marginBottom: 6 }}>
        <Text style={{ fontSize: 14, fontWeight: '600', color: colors.textPrimary, flex: 1 }}>{note.title || 'Untitled'}</Text>
        <View style={{ flexDirection: 'row', gap: 10 }}>
          <TouchableOpacity onPress={() => onEdit(note)}><Text style={{ fontSize: 13, color: colors.accent }}>Edit</Text></TouchableOpacity>
          <TouchableOpacity onPress={() => onDelete(note.id)}><Text style={{ fontSize: 13, color: colors.danger }}>Delete</Text></TouchableOpacity>
        </View>
      </View>

      {note.photos?.length > 0 && (
        <ScrollView horizontal showsHorizontalScrollIndicator={false} style={{ marginBottom: 8 }}>
          {note.photos.map((url, i) => (
            <Image key={i} source={{ uri: url }} style={{ width: 120, height: 90, borderRadius: radius.md, marginRight: 8, resizeMode: 'cover' }} />
          ))}
        </ScrollView>
      )}

      {note.text ? <Text style={{ fontSize: 13, color: colors.textSecondary, lineHeight: 20 }}>{note.text}</Text> : (
        <Text style={{ fontSize: 12, color: colors.textPlaceholder, fontStyle: 'italic' }}>Empty — tap Edit to add content.</Text>
      )}
    </Card>
  );
}

// ── Task card ──────────────────────────────────────────────────────────────────
function TaskCard({ task, onToggle, onEdit }) {
  const done = task.taskStatus === 'completed-it';
  return (
    <Card onPress={() => onEdit(task)} style={{ marginBottom: spacing.sm }}>
      <View style={{ flexDirection: 'row', alignItems: 'flex-start', gap: 10 }}>
        <TouchableOpacity onPress={() => onToggle(task)} style={{ paddingTop: 2 }}>
          <View style={{ width: 20, height: 20, borderRadius: 10, borderWidth: 2, borderColor: done ? colors.success : colors.borderMed, backgroundColor: done ? colors.success : 'transparent', alignItems: 'center', justifyContent: 'center' }}>
            {done && <Text style={{ color: colors.white, fontSize: 12, fontWeight: '700' }}>✓</Text>}
          </View>
        </TouchableOpacity>
        <View style={{ flex: 1 }}>
          <Text style={{ fontSize: 14, fontWeight: '500', color: done ? colors.textFaint : colors.textPrimary, textDecorationLine: done ? 'line-through' : 'none', marginBottom: 6 }}>
            {task.title}
          </Text>
          <View style={{ flexDirection: 'row', gap: 6, flexWrap: 'wrap' }}>
            <StatusBadge status={task.taskStatus} />
            <PriorityBadge priority={task.priority} />
          </View>
          {task.statusComment ? <Text style={{ fontSize: 11, color: colors.textFaint, fontStyle: 'italic', marginTop: 4 }}>"{task.statusComment}"</Text> : null}
        </View>
      </View>
    </Card>
  );
}

// ── Edit Note Modal ────────────────────────────────────────────────────────────
function NoteModal({ visible, note, onClose, onSave, onCamera, onScan }) {
  const [title, setTitle] = useState(note?.title ?? '');
  const [text,  setText]  = useState(note?.text  ?? '');

  React.useEffect(() => { setTitle(note?.title ?? ''); setText(note?.text ?? ''); }, [note]);

  const save = () => { onSave({ ...note, title: title || 'Untitled', text }); onClose(); };

  return (
    <Modal visible={visible} animationType="slide" presentationStyle="pageSheet" onRequestClose={onClose}>
      <View style={{ flex: 1, backgroundColor: colors.bgPage }}>
        <View style={styles.modalHeader}>
          <TouchableOpacity onPress={onClose}><Text style={{ fontSize: 16, color: colors.textMuted }}>Cancel</Text></TouchableOpacity>
          <Text style={styles.modalTitle}>{note?.id ? 'Edit Note' : 'New Note'}</Text>
          <TouchableOpacity onPress={save}><Text style={{ fontSize: 16, color: colors.accent, fontWeight: '600' }}>Save</Text></TouchableOpacity>
        </View>

        <ScrollView style={{ flex: 1, padding: spacing.lg }}>
          <TextInput style={[styles.input, { fontSize: 16, fontWeight: '600', marginBottom: spacing.md }]} value={title} onChangeText={setTitle} placeholder="Note title" placeholderTextColor={colors.textPlaceholder} />
          <TextInput style={[styles.input, { height: 200, textAlignVertical: 'top' }]} value={text} onChangeText={setText} placeholder="Write your note here…" placeholderTextColor={colors.textPlaceholder} multiline />

          {/* Photo options */}
          {note?.id && (
            <View style={{ gap: spacing.sm, marginTop: spacing.sm }}>
              <TouchableOpacity onPress={onCamera} style={[styles.photoBtn, { backgroundColor: colors.accentLight }]}>
                <Text style={{ fontSize: 18 }}>📷</Text>
                <Text style={{ fontSize: 14, fontWeight: '500', color: colors.accent }}>Attach Photo</Text>
              </TouchableOpacity>
              <TouchableOpacity onPress={onScan} style={[styles.photoBtn, { backgroundColor: colors.successLight }]}>
                <Text style={{ fontSize: 18 }}>✦</Text>
                <Text style={{ fontSize: 14, fontWeight: '500', color: colors.success }}>Scan Handwriting</Text>
              </TouchableOpacity>
            </View>
          )}

          {/* Existing photos */}
          {note?.photos?.length > 0 && (
            <>
              <Text style={[styles.label, { marginTop: spacing.md }]}>Attached Photos ({note.photos.length})</Text>
              <ScrollView horizontal showsHorizontalScrollIndicator={false}>
                {note.photos.map((url, i) => (
                  <Image key={i} source={{ uri: url }} style={{ width: 140, height: 100, borderRadius: radius.md, marginRight: 8, resizeMode: 'cover' }} />
                ))}
              </ScrollView>
            </>
          )}
        </ScrollView>
      </View>
    </Modal>
  );
}

// ── Edit Task Modal ────────────────────────────────────────────────────────────
function TaskModal({ visible, task, onClose, onSave, onDelete }) {
  const [title,   setTitle]   = useState('');
  const [status,  setStatus]  = useState('working-on-it');
  const [priority,setPriority]= useState('medium');
  const [comment, setComment] = useState('');
  const [note,    setNote]    = useState('');

  React.useEffect(() => {
    setTitle(task?.title ?? '');
    setStatus(task?.taskStatus ?? 'working-on-it');
    setPriority(task?.priority ?? 'medium');
    setComment(task?.statusComment ?? '');
    setNote(task?.miniNote ?? '');
  }, [task]);

  const save = () => {
    if (!title.trim()) return;
    onSave({ ...task, title, taskStatus: status, priority, statusComment: comment, miniNote: note });
    onClose();
  };

  return (
    <Modal visible={visible} animationType="slide" presentationStyle="pageSheet" onRequestClose={onClose}>
      <View style={{ flex: 1, backgroundColor: colors.bgPage }}>
        <View style={styles.modalHeader}>
          <TouchableOpacity onPress={onClose}><Text style={{ fontSize: 16, color: colors.textMuted }}>Cancel</Text></TouchableOpacity>
          <Text style={styles.modalTitle}>{task?.id ? 'Edit Task' : 'New Task'}</Text>
          <TouchableOpacity onPress={save}><Text style={{ fontSize: 16, color: colors.accent, fontWeight: '600' }}>Save</Text></TouchableOpacity>
        </View>

        <ScrollView style={{ flex: 1, padding: spacing.lg }}>
          <Text style={styles.label}>Title *</Text>
          <TextInput style={styles.input} value={title} onChangeText={setTitle} placeholder="Task title" placeholderTextColor={colors.textPlaceholder} autoFocus />

          <Text style={styles.label}>Status</Text>
          {TASK_STATUSES.map(s => (
            <TouchableOpacity key={s} onPress={() => setStatus(s)} style={[styles.optionRow, status === s && styles.optionActive]}>
              <Text style={{ color: status === s ? colors.accent : colors.textSecondary, fontWeight: status === s ? '600' : '400' }}>{STATUS_LABELS[s]}</Text>
              {status === s && <Text style={{ color: colors.accent }}>✓</Text>}
            </TouchableOpacity>
          ))}

          <Text style={[styles.label, { marginTop: spacing.md }]}>Priority</Text>
          {PRIORITIES.map(p => (
            <TouchableOpacity key={p} onPress={() => setPriority(p)} style={[styles.optionRow, priority === p && styles.optionActive]}>
              <Text style={{ color: priority === p ? colors.accent : colors.textSecondary, fontWeight: priority === p ? '600' : '400', textTransform: 'capitalize' }}>{p}</Text>
              {priority === p && <Text style={{ color: colors.accent }}>✓</Text>}
            </TouchableOpacity>
          ))}

          <Text style={[styles.label, { marginTop: spacing.md }]}>Status Comment</Text>
          <TextInput style={styles.input} value={comment} onChangeText={setComment} placeholder="e.g. Blocked on hardware…" placeholderTextColor={colors.textPlaceholder} />

          <Text style={styles.label}>Quick Note</Text>
          <TextInput style={[styles.input, { height: 80, textAlignVertical: 'top' }]} value={note} onChangeText={setNote} placeholder="Notes for this task…" placeholderTextColor={colors.textPlaceholder} multiline />

          {task?.id && (
            <TouchableOpacity onPress={() => { onDelete(task.id); onClose(); }} style={{ marginTop: spacing.md, padding: spacing.md, borderRadius: radius.md, backgroundColor: colors.dangerLight, alignItems: 'center' }}>
              <Text style={{ color: colors.danger, fontWeight: '600' }}>Delete Task</Text>
            </TouchableOpacity>
          )}
        </ScrollView>
      </View>
    </Modal>
  );
}

// ── Main screen ────────────────────────────────────────────────────────────────
export default function ProjectDetailScreen({ navigation, route }) {
  const { projectId } = route.params;
  const { projects, deleteProject } = useProjects();
  const project = projects.find(p => p.id === projectId);
  const { tasks, addTask, updateTask, deleteTask } = useTasks(projectId);
  const { notes, addNote, updateNote, deleteNote } = useNotes(projectId);
  const { isRunning, startTimer, stopTimer, totalMs } = useTimer(projectId);
  const stats = useStats(projectId);

  const [tab, setTab] = useState('tasks');
  const [taskModal, setTaskModal] = useState({ visible: false, task: null });
  const [noteModal, setNoteModal] = useState({ visible: false, note: null });

  if (!project) return <View style={{ flex: 1, alignItems: 'center', justifyContent: 'center' }}><Text>Project not found</Text></View>;

  const formatMs = (ms) => {
    const h = Math.floor(ms / 3600000), m = Math.floor((ms % 3600000) / 60000);
    return h > 0 ? `${h}h ${m}m` : `${m}m`;
  };

  const handleSaveNote = (noteData) => {
    if (noteData.id) updateNote(noteData);
    else addNote({ title: noteData.title, text: noteData.text });
  };

  const handleDeleteNote = (id) => {
    Alert.alert('Delete Note', 'Delete this note?', [
      { text: 'Cancel', style: 'cancel' },
      { text: 'Delete', style: 'destructive', onPress: () => deleteNote(id) },
    ]);
  };

  const handleSaveTask = (taskData) => {
    if (taskData.id) updateTask(taskData);
    else addTask({ ...taskData, projectId });
  };

  const handleToggleTask = (task) => {
    updateTask({ id: task.id, taskStatus: task.taskStatus === 'completed-it' ? 'working-on-it' : 'completed-it' });
  };

  const handleDeleteProject = () => {
    Alert.alert('Delete Project', `Delete "${project.name}"? This removes all tasks and notes.`, [
      { text: 'Cancel', style: 'cancel' },
      { text: 'Delete', style: 'destructive', onPress: () => { deleteProject(projectId); navigation.goBack(); } },
    ]);
  };

  return (
    <View style={{ flex: 1, backgroundColor: colors.bgPage }}>
      {/* Header card */}
      <View style={styles.header}>
        <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8, marginBottom: 6 }}>
          <View style={{ width: 12, height: 12, borderRadius: 6, backgroundColor: project.color }} />
          <Text style={[typography.h2, { flex: 1 }]} numberOfLines={1}>{project.name}</Text>
        </View>

        <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8, marginBottom: 8 }}>
          <View style={{ flex: 1 }}>
            <ProgressBar value={stats.progress} color={project.color} />
            <Text style={{ fontSize: 11, color: colors.textFaint, marginTop: 3 }}>{stats.done}/{stats.total} tasks</Text>
          </View>
          <Text style={{ fontSize: 12, color: colors.textFaint }}>⏱ {formatMs(totalMs)}</Text>
        </View>

        {/* Controls */}
        <View style={{ flexDirection: 'row', gap: 8 }}>
          <TouchableOpacity
            onPress={isRunning ? stopTimer : startTimer}
            style={[styles.timerBtn, { backgroundColor: isRunning ? colors.dangerLight : colors.successLight, borderColor: isRunning ? colors.dangerMid : colors.success }]}
          >
            <Text style={{ fontSize: 13, fontWeight: '600', color: isRunning ? colors.danger : colors.success }}>
              {isRunning ? '⏹ Stop' : '▶ Start Timer'}
            </Text>
          </TouchableOpacity>
          <TouchableOpacity onPress={handleDeleteProject} style={[styles.timerBtn, { backgroundColor: colors.dangerLight, borderColor: colors.dangerMid }]}>
            <Text style={{ fontSize: 13, color: colors.danger }}>🗑</Text>
          </TouchableOpacity>
        </View>
      </View>

      {/* Tabs */}
      <View style={styles.tabs}>
        {['tasks','notes'].map(t => (
          <TouchableOpacity key={t} onPress={() => setTab(t)} style={[styles.tab, tab === t && styles.tabActive]}>
            <Text style={[styles.tabText, tab === t && styles.tabTextActive]}>{t.charAt(0).toUpperCase() + t.slice(1)}</Text>
          </TouchableOpacity>
        ))}
      </View>

      {/* Content */}
      <ScrollView style={{ flex: 1 }} contentContainerStyle={{ padding: spacing.md, paddingBottom: 40 }}>
        {tab === 'tasks' && (
          <>
            <SectionHeader
              title={`${tasks.length} Tasks`}
              action={<Button label="+ Add" size="sm" onPress={() => setTaskModal({ visible: true, task: null })} />}
            />
            {tasks.length === 0 ? <EmptyState icon="✅" title="No tasks yet" subtitle="Tap + Add to create a task" /> : (
              tasks.map(t => <TaskCard key={t.id} task={t} onToggle={handleToggleTask} onEdit={task => setTaskModal({ visible: true, task })} />)
            )}
          </>
        )}

        {tab === 'notes' && (
          <>
            <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: spacing.sm }}>
              <Text style={{ fontSize: 11, fontWeight: '600', color: colors.textFaint, textTransform: 'uppercase', letterSpacing: 0.8 }}>{notes.length} Notes</Text>
              <View style={{ flexDirection: 'row', gap: 8 }}>
                <Button label="+ Note" size="sm" variant="default" onPress={() => setNoteModal({ visible: true, note: { title: '', text: '', photos: [] } })} />
                <Button label="📷 Photo" size="sm" variant="default" onPress={() => navigation.navigate('Camera', { projectId, mode: 'photo' })} />
                <Button label="✦ Scan" size="sm" variant="success" onPress={() => navigation.navigate('Camera', { projectId, mode: 'scan' })} />
              </View>
            </View>

            {notes.length === 0 ? <EmptyState icon="📝" title="No notes yet" subtitle="Add a note or scan handwriting" /> : (
              [...notes].sort((a, b) => b.updatedAt - a.updatedAt).map(n => (
                <NoteCard
                  key={n.id} note={n}
                  onEdit={note => setNoteModal({ visible: true, note })}
                  onDelete={handleDeleteNote}
                />
              ))
            )}
          </>
        )}
      </ScrollView>

      {/* Modals */}
      <TaskModal
        visible={taskModal.visible}
        task={taskModal.task}
        onClose={() => setTaskModal({ visible: false, task: null })}
        onSave={handleSaveTask}
        onDelete={deleteTask}
      />
      <NoteModal
        visible={noteModal.visible}
        note={noteModal.note}
        onClose={() => setNoteModal({ visible: false, note: null })}
        onSave={handleSaveNote}
        onCamera={() => { setNoteModal(m => ({ ...m, visible: false })); navigation.navigate('Camera', { noteId: noteModal.note?.id, projectId, mode: 'photo' }); }}
        onScan={() => { setNoteModal(m => ({ ...m, visible: false })); navigation.navigate('Camera', { noteId: noteModal.note?.id, projectId, mode: 'scan' }); }}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  header: { backgroundColor: colors.bgCard, padding: spacing.lg, borderBottomWidth: 1, borderBottomColor: colors.border },
  timerBtn: { paddingHorizontal: 14, paddingVertical: 8, borderRadius: radius.md, borderWidth: 1 },
  tabs: { flexDirection: 'row', backgroundColor: colors.bgCard, borderBottomWidth: 1, borderBottomColor: colors.border },
  tab: { flex: 1, paddingVertical: 12, alignItems: 'center', borderBottomWidth: 2, borderBottomColor: 'transparent' },
  tabActive: { borderBottomColor: colors.accent },
  tabText: { fontSize: 14, fontWeight: '400', color: colors.textMuted },
  tabTextActive: { fontWeight: '600', color: colors.accent },
  modalHeader: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', padding: spacing.lg, borderBottomWidth: 1, borderBottomColor: colors.border, backgroundColor: colors.bgCard },
  modalTitle: { fontSize: 17, fontWeight: '600', color: colors.textPrimary },
  label: { fontSize: 12, fontWeight: '500', color: colors.textMuted, marginBottom: 5 },
  input: { backgroundColor: colors.bgInput, borderWidth: 1, borderColor: colors.borderMed, borderRadius: radius.md, padding: spacing.md, fontSize: 14, color: colors.textPrimary, marginBottom: spacing.md },
  optionRow: { flexDirection: 'row', justifyContent: 'space-between', padding: spacing.md, backgroundColor: colors.bgCard, borderRadius: radius.md, marginBottom: 4, borderWidth: 1, borderColor: colors.border },
  optionActive: { borderColor: colors.accent, backgroundColor: colors.accentLight },
  photoBtn: { flexDirection: 'row', alignItems: 'center', gap: 10, padding: spacing.md, borderRadius: radius.md },
});
