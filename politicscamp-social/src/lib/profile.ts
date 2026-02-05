import { supabase } from "./supabase";
import { Profile } from "../types";

export async function fetchProfile(userId: string) {
  return supabase.from("profiles").select("*").eq("id", userId).single<Profile>();
}

export async function updateProfile(userId: string, updates: Partial<Profile>) {
  return supabase.from("profiles").update(updates).eq("id", userId);
}
