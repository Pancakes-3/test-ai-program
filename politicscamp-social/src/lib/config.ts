import { supabase } from "./supabase";

export async function fetchAllowSignups() {
  return supabase
    .from("app_config")
    .select("value")
    .eq("key", "allow_signups")
    .single<{ value: string }>();
}

export async function updateAllowSignups(allow: boolean) {
  return supabase
    .from("app_config")
    .update({ value: allow ? "true" : "false" })
    .eq("key", "allow_signups");
}
