import { doc, setDoc, getDoc, collection, getDocs } from 'firebase/firestore';
import { db } from '../config/firebase';
import { useProfileStore } from '../stores/useProfileStore';
import { useDiaryStore } from '../stores/useDiaryStore';
import { useWorkoutStore } from '../stores/useWorkoutStore';
import { useChatStore } from '../stores/useChatStore';
import { useFoodLibraryStore } from '../stores/useFoodLibraryStore';
import { useExercisePrefsStore } from '../stores/useExercisePrefsStore';
import type { UserProfile, DailyEntry, WorkoutSession, WorkoutProgram, ChatMessage, SavedFoodItem, Exercise, ScheduledWorkout } from '../models/types';

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
    console.log('[Sync] Saving profile for uid:', uid);
    await setDoc(doc(db, 'users', uid), profile);
    console.log('[Sync] Profile saved OK');
  } catch (e) {
    console.warn('[Sync] saveProfile error:', e);
  }
}

async function saveDiaryEntry(uid: string, date: string, entry: DailyEntry): Promise<void> {
  try {
    console.log('[Sync] Saving diary entry for date:', date);
    await setDoc(doc(db, 'users', uid, 'diary', date), entry);
    console.log('[Sync] Diary entry saved OK:', date);
  } catch (e) {
    console.warn('[Sync] saveDiaryEntry error:', e);
  }
}

async function saveWorkoutSessions(uid: string, date: string, sessions: WorkoutSession[]): Promise<void> {
  try {
    console.log('[Sync] Saving workout sessions for date:', date);
    await setDoc(doc(db, 'users', uid, 'workouts', date), { sessions });
    console.log('[Sync] Workout sessions saved OK:', date);
  } catch (e) {
    console.warn('[Sync] saveWorkoutSessions error:', e);
  }
}

async function saveWorkoutPrograms(uid: string, programs: WorkoutProgram[]): Promise<void> {
  try {
    console.log('[Sync] Saving workout programs, count:', programs.length);
    await setDoc(doc(db, 'users', uid, 'settings', 'programs'), { programs });
    console.log('[Sync] Workout programs saved OK');
  } catch (e) {
    console.warn('[Sync] saveWorkoutPrograms error:', e);
  }
}

async function saveChatMessages(uid: string, messages: ChatMessage[]): Promise<void> {
  try {
    console.log('[Sync] Saving chat messages, count:', messages.length);
    await setDoc(doc(db, 'users', uid, 'settings', 'chat'), { messages });
    console.log('[Sync] Chat messages saved OK');
  } catch (e) {
    console.warn('[Sync] saveChatMessages error:', e);
  }
}

async function saveFoodLibrary(uid: string, items: Record<string, SavedFoodItem>): Promise<void> {
  try {
    console.log('[Sync] Saving food library, count:', Object.keys(items).length);
    await setDoc(doc(db, 'users', uid, 'settings', 'foodLibrary'), { items });
    console.log('[Sync] Food library saved OK');
  } catch (e) {
    console.warn('[Sync] saveFoodLibrary error:', e);
  }
}

async function saveExercisePrefs(uid: string, data: { favorites: string[]; colorTags: Record<string, string>; customExercises: Exercise[] }): Promise<void> {
  try {
    console.log('[Sync] Saving exercise prefs');
    await setDoc(doc(db, 'users', uid, 'settings', 'exercisePrefs'), data);
    console.log('[Sync] Exercise prefs saved OK');
  } catch (e) {
    console.warn('[Sync] saveExercisePrefs error:', e);
  }
}

async function saveSchedule(uid: string, schedule: Record<string, ScheduledWorkout>): Promise<void> {
  try {
    console.log('[Sync] Saving schedule, count:', Object.keys(schedule).length);
    await setDoc(doc(db, 'users', uid, 'settings', 'schedule'), { schedule });
    console.log('[Sync] Schedule saved OK');
  } catch (e) {
    console.warn('[Sync] saveSchedule error:', e);
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

async function loadFoodLibrary(uid: string): Promise<Record<string, SavedFoodItem>> {
  try {
    const snap = await getDoc(doc(db, 'users', uid, 'settings', 'foodLibrary'));
    return snap.exists()
      ? (snap.data() as { items: Record<string, SavedFoodItem> }).items || {}
      : {};
  } catch (e) {
    console.warn('[Sync] loadFoodLibrary error:', e);
    return {};
  }
}

async function loadExercisePrefs(uid: string): Promise<{ favorites: string[]; colorTags: Record<string, string>; customExercises: Exercise[] } | null> {
  try {
    const snap = await getDoc(doc(db, 'users', uid, 'settings', 'exercisePrefs'));
    if (!snap.exists()) return null;
    const data = snap.data() as { favorites?: string[]; colorTags?: Record<string, string>; customExercises?: Exercise[] };
    return {
      favorites: data.favorites || [],
      colorTags: data.colorTags || {},
      customExercises: data.customExercises || [],
    };
  } catch (e) {
    console.warn('[Sync] loadExercisePrefs error:', e);
    return null;
  }
}

async function loadSchedule(uid: string): Promise<Record<string, ScheduledWorkout>> {
  try {
    const snap = await getDoc(doc(db, 'users', uid, 'settings', 'schedule'));
    return snap.exists()
      ? (snap.data() as { schedule: Record<string, ScheduledWorkout> }).schedule || {}
      : {};
  } catch (e) {
    console.warn('[Sync] loadSchedule error:', e);
    return {};
  }
}

// ── Initial load (on login) ──

export async function loadFromFirestoreIfEmpty(uid: string): Promise<void> {
  console.log('[Sync] loadFromFirestoreIfEmpty started, uid:', uid);

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

  // Food Library
  const foodLib = useFoodLibraryStore.getState().items;
  if (Object.keys(foodLib).length === 0) {
    const remoteLib = await loadFoodLibrary(uid);
    if (Object.keys(remoteLib).length > 0) {
      useFoodLibraryStore.setState({ items: remoteLib });
    }
  }

  // Exercise Prefs
  const exercisePrefs = useExercisePrefsStore.getState();
  if (exercisePrefs.favorites.length === 0 && exercisePrefs.customExercises.length === 0 && Object.keys(exercisePrefs.colorTags).length === 0) {
    const remotePrefs = await loadExercisePrefs(uid);
    if (remotePrefs) {
      useExercisePrefsStore.setState(remotePrefs);
    }
  }

  // Schedule
  const schedule = useWorkoutStore.getState().schedule;
  if (Object.keys(schedule).length === 0) {
    const remoteSchedule = await loadSchedule(uid);
    if (Object.keys(remoteSchedule).length > 0) {
      useWorkoutStore.setState({ schedule: remoteSchedule });
    }
  }
}

// ── Sync listeners ──

export function startSyncListeners(uid: string): () => void {
  console.log('[Sync] startSyncListeners called, uid:', uid);
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

  // Schedule sync (debounce 2s)
  let prevScheduleRef = useWorkoutStore.getState().schedule;
  const debouncedSaveSchedule = debounce((schedule: Record<string, ScheduledWorkout>) => {
    saveSchedule(uid, schedule);
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
      if (state.schedule !== prevScheduleRef) {
        prevScheduleRef = state.schedule;
        debouncedSaveSchedule(state.schedule);
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

  // Food Library sync (debounce 2s)
  let prevLibSize = Object.keys(useFoodLibraryStore.getState().items).length;
  const debouncedSaveLibrary = debounce((items: Record<string, SavedFoodItem>) => {
    saveFoodLibrary(uid, items);
  }, 2000);

  unsubscribers.push(
    useFoodLibraryStore.subscribe((state) => {
      const newSize = Object.keys(state.items).length;
      if (newSize !== prevLibSize) {
        prevLibSize = newSize;
        debouncedSaveLibrary(state.items);
      }
    })
  );

  // Exercise Prefs sync (debounce 2s)
  let prevExPrefsRef = JSON.stringify({
    favorites: useExercisePrefsStore.getState().favorites,
    colorTags: useExercisePrefsStore.getState().colorTags,
    customExercises: useExercisePrefsStore.getState().customExercises,
  });
  const debouncedSaveExPrefs = debounce((data: { favorites: string[]; colorTags: Record<string, string>; customExercises: Exercise[] }) => {
    saveExercisePrefs(uid, data);
  }, 2000);

  unsubscribers.push(
    useExercisePrefsStore.subscribe((state) => {
      const newRef = JSON.stringify({
        favorites: state.favorites,
        colorTags: state.colorTags,
        customExercises: state.customExercises,
      });
      if (newRef !== prevExPrefsRef) {
        prevExPrefsRef = newRef;
        debouncedSaveExPrefs({
          favorites: state.favorites,
          colorTags: state.colorTags,
          customExercises: state.customExercises,
        });
      }
    })
  );

  return () => {
    unsubscribers.forEach((unsub) => unsub());
  };
}
