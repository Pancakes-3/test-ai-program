import * as SecureStore from "expo-secure-store";
import { Session } from "@supabase/supabase-js";

const SESSIONS_KEY = "pcs_sessions";
const ACTIVE_SESSION_KEY = "pcs_active_session";

export interface StoredSession {
  id: string;
  session: Session;
}

export async function saveSession(session: Session) {
  const sessions = await getSessions();
  const updated = sessions.filter((item) => item.session.user.id !== session.user.id);
  updated.push({ id: session.user.id, session });
  await SecureStore.setItemAsync(SESSIONS_KEY, JSON.stringify(updated));
  await SecureStore.setItemAsync(ACTIVE_SESSION_KEY, session.user.id);
}

export async function getSessions(): Promise<StoredSession[]> {
  const raw = await SecureStore.getItemAsync(SESSIONS_KEY);
  if (!raw) return [];
  try {
    return JSON.parse(raw) as StoredSession[];
  } catch {
    return [];
  }
}

export async function getActiveSessionId(): Promise<string | null> {
  return SecureStore.getItemAsync(ACTIVE_SESSION_KEY);
}

export async function setActiveSessionId(id: string) {
  await SecureStore.setItemAsync(ACTIVE_SESSION_KEY, id);
}

export async function removeSession(userId: string) {
  const sessions = await getSessions();
  const updated = sessions.filter((item) => item.session.user.id !== userId);
  await SecureStore.setItemAsync(SESSIONS_KEY, JSON.stringify(updated));
  const active = await getActiveSessionId();
  if (active === userId) {
    await SecureStore.deleteItemAsync(ACTIVE_SESSION_KEY);
  }
}
