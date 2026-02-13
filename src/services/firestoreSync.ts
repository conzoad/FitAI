import { doc, setDoc, getDoc, collection, getDocs } from 'firebase/firestore';
import { db } from '../config/firebase';
import { useProfileStore } from '../stores/useProfileStore';
import { useDiaryStore } from '../stores/useDiaryStore';
import { useWorkoutStore } from '../stores/useWorkoutStore';
import { useChatStore } from '../stores/useChatStore';
import type { UserProfile, DailyEntry, WorkoutSession, WorkoutProgram, ChatMessage } from '../models/types';

// ── Debounce helper ──

function debounce<T extends (...args: any[]) => void>(fn: T, ms: number): T {
  let timer: ReturnType<typeof setTimeout>;
  return ((...args: any[]) => {
    clearTimeout(timer);
    timer = setTimeout(() => fn(...args), ms);
  }) as unknown as T;
}

// ── Save functions ──

async function saveProfile(uid: string, profile: UserProfile): Promise<void> {
  try {
    await setDoc(doc(db, 'users', uid), profile);
  } catch (e) {
    console.warn('[Sync] saveProfile error:', e);
  }
}

async function saveDiaryEntry(uid: string, date: string, entry: DailyEntry): Promise<void> {
  try {
    await setDoc(doc(db, 'users', uid, 'diary', date), entry);
  } catch (e) {
    console.warn('[Sync] saveDiaryEntry error:', e);
  }
}

async function saveWorkoutSessions(uid: string, date: string, sessions: WorkoutSession[]): Promise<void> {
  try {
    await setDoc(doc(db, 'users', uid, 'workouts', date), { sessions });
  } catch (e) {
    console.warn('[Sync] saveWorkoutSessions error:', e);
  }
}

async function saveWorkoutPrograms(uid: string, programs: WorkoutProgram[]): Promise<void> {
  try {
    await setDoc(doc(db, 'users', uid, 'settings', 'programs'), { programs });
  } catch (e) {
    console.warn('[Sync] saveWorkoutPrograms error:', e);
  }
}

async function saveChatMessages(uid: string, messages: ChatMessage[]): Promise<void> {
  try {
    await setDoc(doc(db, 'users', uid, 'settings', 'chat'), { messages });
  } catch (e) {
    console.warn('[Sync] saveChatMessages error:', e);
  }
}

// ── Load functions ──

async function loadProfile(uid: string): Promise<UserProfile | null> {
  try {
    const snap = await getDoc(doc(db, 'users', uid));
    return snap.exists() ? (snap.data() as UserProfile) : null;
  } catch (e) {
    console.warn('[Sync] loadProfile error:', e);
    return null;
  }
}

async function loadDiary(uid: string): Promise<Record<string, DailyEntry>> {
  try {
    const snap = await getDocs(collection(db, 'users', uid, 'diary'));
    const entries: Record<string, DailyEntry> = {};
    snap.forEach((d) => {
      const data = d.data() as DailyEntry;
      entries[d.id] = data;
    });
    return entries;
  } catch (e) {
    console.warn('[Sync] loadDiary error:', e);
    return {};
  }
}

async function loadWorkouts(uid: string): Promise<{
  sessions: Record<string, WorkoutSession[]>;
  programs: WorkoutProgram[];
}> {
  try {
    const sessionsSnap = await getDocs(collection(db, 'users', uid, 'workouts'));
    const sessions: Record<string, WorkoutSession[]> = {};
    sessionsSnap.forEach((d) => {
      const data = d.data() as { sessions: WorkoutSession[] };
      sessions[d.id] = data.sessions || [];
    });

    const programsSnap = await getDoc(doc(db, 'users', uid, 'settings', 'programs'));
    const programs: WorkoutProgram[] = programsSnap.exists()
      ? (programsSnap.data() as { programs: WorkoutProgram[] }).programs || []
      : [];

    return { sessions, programs };
  } catch (e) {
    console.warn('[Sync] loadWorkouts error:', e);
    return { sessions: {}, programs: [] };
  }
}

async function loadChatMessages(uid: string): Promise<ChatMessage[]> {
  try {
    const snap = await getDoc(doc(db, 'users', uid, 'settings', 'chat'));
    return snap.exists()
      ? (snap.data() as { messages: ChatMessage[] }).messages || []
      : [];
  } catch (e) {
    console.warn('[Sync] loadChatMessages error:', e);
    return [];
  }
}

// ── Initial load (on login) ──

export async function loadFromFirestoreIfEmpty(uid: string): Promise<void> {
  // Profile
  const profile = useProfileStore.getState().profile;
  if (!profile.isOnboarded) {
    const remote = await loadProfile(uid);
    if (remote && remote.isOnboarded) {
      useProfileStore.setState({ profile: remote });
    }
  }

  // Diary
  const diary = useDiaryStore.getState().entries;
  if (Object.keys(diary).length === 0) {
    const remoteDiary = await loadDiary(uid);
    if (Object.keys(remoteDiary).length > 0) {
      useDiaryStore.setState({ entries: remoteDiary });
    }
  }

  // Workouts
  const workoutState = useWorkoutStore.getState();
  if (Object.keys(workoutState.sessions).length === 0 && workoutState.programs.length === 0) {
    const remote = await loadWorkouts(uid);
    if (Object.keys(remote.sessions).length > 0 || remote.programs.length > 0) {
      useWorkoutStore.setState({
        sessions: remote.sessions,
        programs: remote.programs,
      });
    }
  }

  // Chat
  const chat = useChatStore.getState().messages;
  if (chat.length === 0) {
    const remoteMsgs = await loadChatMessages(uid);
    if (remoteMsgs.length > 0) {
      useChatStore.setState({ messages: remoteMsgs });
    }
  }
}

// ── Sync listeners ──

export function startSyncListeners(uid: string): () => void {
  const unsubscribers: (() => void)[] = [];

  // Profile sync (debounce 2s)
  const debouncedSaveProfile = debounce((profile: UserProfile) => {
    if (profile.isOnboarded) saveProfile(uid, profile);
  }, 2000);

  unsubscribers.push(
    useProfileStore.subscribe((state) => {
      debouncedSaveProfile(state.profile);
    })
  );

  // Diary sync (debounce 2s)
  let prevDiaryKeys = Object.keys(useDiaryStore.getState().entries).join(',');
  const debouncedSaveDiary = debounce((entries: Record<string, DailyEntry>) => {
    const currentKeys = Object.keys(entries);
    for (const date of currentKeys) {
      saveDiaryEntry(uid, date, entries[date]);
    }
  }, 2000);

  unsubscribers.push(
    useDiaryStore.subscribe((state) => {
      const newKeys = Object.keys(state.entries).join(',');
      if (newKeys !== prevDiaryKeys) {
        prevDiaryKeys = newKeys;
        debouncedSaveDiary(state.entries);
      } else {
        debouncedSaveDiary(state.entries);
      }
    })
  );

  // Workout sessions sync (debounce 2s) - only completed sessions
  let prevSessionsRef = useWorkoutStore.getState().sessions;
  const debouncedSaveSessions = debounce((sessions: Record<string, WorkoutSession[]>) => {
    for (const date of Object.keys(sessions)) {
      saveWorkoutSessions(uid, date, sessions[date]);
    }
  }, 2000);

  // Programs sync (debounce 2s)
  let prevProgramsLen = useWorkoutStore.getState().programs.length;
  const debouncedSavePrograms = debounce((programs: WorkoutProgram[]) => {
    saveWorkoutPrograms(uid, programs);
  }, 2000);

  unsubscribers.push(
    useWorkoutStore.subscribe((state) => {
      // Only sync when sessions reference changes (not activeWorkout changes)
      if (state.sessions !== prevSessionsRef) {
        prevSessionsRef = state.sessions;
        debouncedSaveSessions(state.sessions);
      }
      if (state.programs.length !== prevProgramsLen) {
        prevProgramsLen = state.programs.length;
        debouncedSavePrograms(state.programs);
      }
    })
  );

  // Chat sync (debounce 3s)
  let prevMsgCount = useChatStore.getState().messages.length;
  const debouncedSaveChat = debounce((messages: ChatMessage[]) => {
    saveChatMessages(uid, messages);
  }, 3000);

  unsubscribers.push(
    useChatStore.subscribe((state) => {
      if (state.messages.length !== prevMsgCount) {
        prevMsgCount = state.messages.length;
        debouncedSaveChat(state.messages);
      }
    })
  );

  return () => {
    unsubscribers.forEach((unsub) => unsub());
  };
}
