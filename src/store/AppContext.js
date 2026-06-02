import React, { createContext, useContext, useReducer, useEffect, useRef } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { pullSince, pullAll, upsertMany, pushMeta, TABLES } from './supabase';

const STORAGE_KEY = 'forge-mobile-state';
const CURSOR_KEY  = 'forge-mobile-cursor';

// ── Generate ID ────────────────────────────────────────────────────────────────
export const generateId = () => Math.random().toString(36).slice(2, 10);

// ── Actions ────────────────────────────────────────────────────────────────────
export const ACTIONS = {
  ADD_PROJECT:    'ADD_PROJECT',
  UPDATE_PROJECT: 'UPDATE_PROJECT',
  DELETE_PROJECT: 'DELETE_PROJECT',
  ADD_TASK:       'ADD_TASK',
  UPDATE_TASK:    'UPDATE_TASK',
  DELETE_TASK:    'DELETE_TASK',
  ADD_NOTE:       'ADD_NOTE',
  UPDATE_NOTE:    'UPDATE_NOTE',
  DELETE_NOTE:    'DELETE_NOTE',
  ADD_FILE:       'ADD_FILE',
  DELETE_FILE:    'DELETE_FILE',
  ADD_FOLDER:     'ADD_FOLDER',
  DELETE_FOLDER:  'DELETE_FOLDER',
  START_TIMER:    'START_TIMER',
  STOP_TIMER:     'STOP_TIMER',
  APPLY_SYNC:     'APPLY_SYNC',
  SET_LOADED:     'SET_LOADED',
};

// ── Reducer ────────────────────────────────────────────────────────────────────
function reducer(state, action) {
  switch (action.type) {
    case ACTIONS.ADD_PROJECT: {
      const p = { id: generateId(), createdAt: Date.now(), updatedAt: Date.now(), status: 'working-on-it', statusComment: '', type: 'work', ...action.payload };
      return { ...state, projects: [...state.projects, p] };
    }
    case ACTIONS.UPDATE_PROJECT:
      return { ...state, projects: state.projects.map(p => p.id === action.payload.id ? { ...p, ...action.payload, updatedAt: Date.now() } : p) };
    case ACTIONS.DELETE_PROJECT:
      return {
        ...state,
        projects: state.projects.filter(p => p.id !== action.payload.id),
        tasks:    state.tasks.filter(t => t.projectId !== action.payload.id),
        notes:    state.notes.filter(n => n.projectId !== action.payload.id),
      };

    case ACTIONS.ADD_TASK: {
      const t = { id: generateId(), createdAt: Date.now(), updatedAt: Date.now(), taskStatus: 'working-on-it', priority: 'medium', miniNote: '', statusComment: '', ...action.payload };
      return { ...state, tasks: [...state.tasks, t] };
    }
    case ACTIONS.UPDATE_TASK:
      return { ...state, tasks: state.tasks.map(t => t.id === action.payload.id ? { ...t, ...action.payload, updatedAt: Date.now() } : t) };
    case ACTIONS.DELETE_TASK:
      return { ...state, tasks: state.tasks.filter(t => t.id !== action.payload.id) };

    case ACTIONS.ADD_NOTE: {
      const n = { id: generateId(), createdAt: Date.now(), updatedAt: Date.now(), title: 'New Note', text: '', photos: [], ...action.payload };
      return { ...state, notes: [...state.notes, n] };
    }
    case ACTIONS.UPDATE_NOTE:
      return { ...state, notes: state.notes.map(n => n.id === action.payload.id ? { ...n, ...action.payload, updatedAt: Date.now() } : n) };
    case ACTIONS.DELETE_NOTE:
      return { ...state, notes: state.notes.filter(n => n.id !== action.payload.id) };

    case ACTIONS.ADD_FILE: {
      const f = { id: generateId(), createdAt: Date.now(), updatedAt: Date.now(), ...action.payload };
      return { ...state, files: [...state.files, f] };
    }
    case ACTIONS.DELETE_FILE:
      return { ...state, files: state.files.filter(f => f.id !== action.payload.id) };

    case ACTIONS.ADD_FOLDER: {
      const f = { id: generateId(), createdAt: Date.now(), ...action.payload };
      return { ...state, folders: [...state.folders, f] };
    }
    case ACTIONS.DELETE_FOLDER:
      return { ...state, folders: state.folders.filter(f => f.id !== action.payload.id), files: state.files.filter(f => f.folderId !== action.payload.id) };

    case ACTIONS.START_TIMER: {
      let entries = [...state.timeEntries];
      if (state.activeTimer) {
        entries.push({ id: generateId(), projectId: state.activeTimer.projectId, startedAt: state.activeTimer.startedAt, stoppedAt: Date.now(), updatedAt: Date.now() });
      }
      return { ...state, timeEntries: entries, activeTimer: { projectId: action.payload.projectId, startedAt: Date.now() } };
    }
    case ACTIONS.STOP_TIMER: {
      if (!state.activeTimer) return state;
      const entry = { id: generateId(), projectId: state.activeTimer.projectId, startedAt: state.activeTimer.startedAt, stoppedAt: Date.now(), updatedAt: Date.now() };
      return { ...state, timeEntries: [...state.timeEntries, entry], activeTimer: null };
    }

    case ACTIONS.APPLY_SYNC: {
      const { pulled = {}, deletions = [] } = action.payload;
      const DELETED_MAP = { forge_projects: 'projects', forge_tasks: 'tasks', forge_notes: 'notes', forge_files: 'files', forge_folders: 'folders', forge_time_entries: 'timeEntries' };
      const merge = (existing, incoming) => {
        if (!incoming?.length) return existing;
        const map = Object.fromEntries(existing.map(r => [r.id, r]));
        for (const r of incoming) {
          const cur = map[r.id];
          if (!cur || (r.updatedAt ?? 0) >= (cur.updatedAt ?? 0)) map[r.id] = r;
        }
        return Object.values(map);
      };
      let next = { ...state };
      for (const d of deletions) {
        const slice = DELETED_MAP[d.table_name];
        if (slice) next[slice] = next[slice].filter(r => r.id !== d.record_id);
      }
      return {
        ...next,
        projects:    merge(next.projects,    pulled.projects),
        tasks:       merge(next.tasks,       pulled.tasks),
        notes:       merge(next.notes,       pulled.notes),
        files:       merge(next.files,       pulled.files),
        folders:     merge(next.folders,     pulled.folders),
        timeEntries: merge(next.timeEntries, pulled.timeEntries),
      };
    }

    case ACTIONS.SET_LOADED:
      return { ...state, loaded: true };

    default: return state;
  }
}

const INITIAL_STATE = {
  projects: [], tasks: [], notes: [], files: [], folders: [],
  timeEntries: [], activeTimer: null, loaded: false,
};

// ── Context ────────────────────────────────────────────────────────────────────
const AppContext = createContext(null);

export function AppProvider({ children }) {
  const [state, dispatch] = useReducer(reducer, INITIAL_STATE);
  const pushTimer = useRef(null);
  const prevState = useRef(null);

  // Load from AsyncStorage on mount, then pull from Supabase
  useEffect(() => {
    (async () => {
      try {
        const saved = await AsyncStorage.getItem(STORAGE_KEY);
        if (saved) {
          const parsed = JSON.parse(saved);
          dispatch({ type: ACTIONS.APPLY_SYNC, payload: { pulled: parsed } });
        }
      } catch {}
      dispatch({ type: ACTIONS.SET_LOADED });
      await syncPull();
    })();
  }, []);

  // Persist to AsyncStorage on every change
  useEffect(() => {
    if (!state.loaded) return;
    const { loaded, activeTimer, ...toSave } = state;
    AsyncStorage.setItem(STORAGE_KEY, JSON.stringify(toSave)).catch(() => {});
  }, [state]);

  // Debounced push to Supabase on data changes
  useEffect(() => {
    if (!state.loaded) return;
    const prev = prevState.current;
    prevState.current = state;
    if (!prev) return;
    const changed = prev.projects !== state.projects || prev.tasks !== state.tasks ||
      prev.notes !== state.notes || prev.files !== state.files ||
      prev.folders !== state.folders || prev.timeEntries !== state.timeEntries;
    if (!changed) return;
    clearTimeout(pushTimer.current);
    pushTimer.current = setTimeout(() => syncPush(state), 2000);
  }, [state]);

  async function syncPull() {
    try {
      const cursor = parseInt(await AsyncStorage.getItem(CURSOR_KEY) ?? '0');
      const SLICE_TABLE = { projects: TABLES.projects, tasks: TABLES.tasks, notes: TABLES.notes, files: TABLES.files, folders: TABLES.folders, timeEntries: TABLES.timeEntries };
      const pulled = {};
      let newCursor = cursor;
      for (const [slice, table] of Object.entries(SLICE_TABLE)) {
        const records = await pullSince(table, cursor);
        if (records.length) pulled[slice] = records;
        for (const r of records) { const ts = r.updatedAt ?? 0; if (ts > newCursor) newCursor = ts; }
      }
      if (Object.keys(pulled).length) dispatch({ type: ACTIONS.APPLY_SYNC, payload: { pulled } });
      if (newCursor > cursor) await AsyncStorage.setItem(CURSOR_KEY, String(newCursor));
    } catch (e) { console.warn('[sync] pull error:', e); }
  }

  async function syncPush(s) {
    try {
      await Promise.all([
        upsertMany(TABLES.projects,    s.projects ?? []),
        upsertMany(TABLES.tasks,       s.tasks ?? []),
        upsertMany(TABLES.notes,       s.notes ?? []),
        upsertMany(TABLES.files,       s.files ?? []),
        upsertMany(TABLES.folders,     s.folders ?? []),
        upsertMany(TABLES.timeEntries, s.timeEntries ?? []),
      ]);
    } catch (e) { console.warn('[sync] push error:', e); }
  }

  return <AppContext.Provider value={{ state, dispatch }}>{children}</AppContext.Provider>;
}

export function useAppStore() {
  const ctx = useContext(AppContext);
  if (!ctx) throw new Error('useAppStore must be inside AppProvider');
  return ctx;
}
