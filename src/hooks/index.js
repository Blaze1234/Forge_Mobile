import { useAppStore, ACTIONS, generateId } from '../store/AppContext';

export function useProjects() {
  const { state, dispatch } = useAppStore();
  return {
    projects:      state.projects,
    addProject:    (data) => dispatch({ type: ACTIONS.ADD_PROJECT,    payload: data }),
    updateProject: (data) => dispatch({ type: ACTIONS.UPDATE_PROJECT, payload: data }),
    deleteProject: (id)   => dispatch({ type: ACTIONS.DELETE_PROJECT, payload: { id } }),
  };
}

export function useTasks(projectId = null) {
  const { state, dispatch } = useAppStore();
  const tasks = projectId ? state.tasks.filter(t => t.projectId === projectId) : state.tasks;
  return {
    tasks,
    allTasks:   state.tasks,
    addTask:    (data) => dispatch({ type: ACTIONS.ADD_TASK,    payload: data }),
    updateTask: (data) => dispatch({ type: ACTIONS.UPDATE_TASK, payload: data }),
    deleteTask: (id)   => dispatch({ type: ACTIONS.DELETE_TASK, payload: { id } }),
  };
}

export function useNotes(projectId) {
  const { state, dispatch } = useAppStore();
  const notes = state.notes.filter(n => n.projectId === projectId && !n.taskId);
  return {
    notes,
    addNote:    (data) => dispatch({ type: ACTIONS.ADD_NOTE,    payload: { projectId, ...data } }),
    updateNote: (data) => dispatch({ type: ACTIONS.UPDATE_NOTE, payload: data }),
    deleteNote: (id)   => dispatch({ type: ACTIONS.DELETE_NOTE, payload: { id } }),
  };
}

export function useTaskNotes(taskId) {
  const { state, dispatch } = useAppStore();
  const notes = state.notes.filter(n => n.taskId === taskId);
  return {
    notes,
    addNote:    (data) => dispatch({ type: ACTIONS.ADD_NOTE,    payload: { taskId, ...data } }),
    updateNote: (data) => dispatch({ type: ACTIONS.UPDATE_NOTE, payload: data }),
    deleteNote: (id)   => dispatch({ type: ACTIONS.DELETE_NOTE, payload: { id } }),
  };
}

export function useTimer(projectId) {
  const { state, dispatch } = useAppStore();
  const isRunning = state.activeTimer?.projectId === projectId;
  return {
    isRunning,
    activeTimer: state.activeTimer,
    startTimer:  () => dispatch({ type: ACTIONS.START_TIMER, payload: { projectId } }),
    stopTimer:   () => dispatch({ type: ACTIONS.STOP_TIMER }),
    totalMs:     state.timeEntries.filter(e => e.projectId === projectId).reduce((s, e) => s + (e.stoppedAt - e.startedAt), 0),
  };
}

export function useStats(projectId) {
  const { state } = useAppStore();
  const tasks = state.tasks.filter(t => t.projectId === projectId);
  const done  = tasks.filter(t => t.taskStatus === 'completed-it').length;
  return { total: tasks.length, done, progress: tasks.length === 0 ? 0 : Math.round((done / tasks.length) * 100) };
}
