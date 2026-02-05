import { useCallback, useEffect, useState } from "react";
import {
  View,
  Text,
  TextInput,
  StyleSheet,
  Pressable,
  ScrollView,
  ActivityIndicator
} from "react-native";
import { Profile } from "../types";
import { colors } from "../theme/colors";
import { spacing } from "../theme/spacing";
import { StatusBanner } from "../components/StatusBanner";
import { fetchProfile, updateProfile } from "../lib/profile";
import { supabase } from "../lib/supabase";
import { fetchAllowSignups, updateAllowSignups } from "../lib/config";
import {
  getSessions,
  removeSession,
  saveSession,
  setActiveSessionId,
  StoredSession
} from "../lib/sessionStore";

interface ProfileScreenProps {
  viewer: Profile;
  context: { refreshProfile: () => void };
}

export function ProfileScreen({ viewer, context }: ProfileScreenProps) {
  const [profile, setProfile] = useState<Profile>(viewer);
  const [role, setRole] = useState(viewer.role);
  const [bio, setBio] = useState(viewer.bio ?? "");
  const [party, setParty] = useState(viewer.party);
  const [message, setMessage] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);
  const [followFirst, setFollowFirst] = useState("");
  const [followLast, setFollowLast] = useState("");
  const [following, setFollowing] = useState<Profile[]>([]);
  const [allowSignups, setAllowSignups] = useState(false);
  const [sessions, setSessions] = useState<StoredSession[]>([]);

  const loadProfile = useCallback(async () => {
    const { data } = await fetchProfile(viewer.id);
    if (data) {
      setProfile(data);
      setRole(data.role);
      setBio(data.bio ?? "");
      setParty(data.party);
    }
  }, [viewer.id]);

  const loadFollowing = useCallback(async () => {
    const { data } = await supabase
      .from("follows")
      .select("following:profiles(*)")
      .eq("follower_id", viewer.id);
    const mapped = (data ?? []).map((row) => row.following) as Profile[];
    setFollowing(mapped.filter(Boolean));
  }, [viewer.id]);

  const loadConfig = useCallback(async () => {
    const { data } = await fetchAllowSignups();
    setAllowSignups(data?.value === "true");
  }, []);

  const loadSessions = useCallback(async () => {
    const data = await getSessions();
    setSessions(data);
  }, []);

  useEffect(() => {
    loadProfile();
    loadFollowing();
    loadConfig();
    loadSessions();
  }, [loadProfile, loadFollowing, loadConfig, loadSessions]);

  const handleSave = async () => {
    setSaving(true);
    setMessage(null);
    try {
      const { error } = await updateProfile(viewer.id, {
        role: role.trim(),
        bio: bio.trim() || null,
        party
      });
      if (error) throw error;
      await loadProfile();
      context.refreshProfile();
      setMessage("Profile updated.");
    } catch (error) {
      setMessage(error instanceof Error ? error.message : "Failed to update profile");
    } finally {
      setSaving(false);
    }
  };

  const handleFollow = async () => {
    setMessage(null);
    const first = followFirst.trim();
    const last = followLast.trim();
    if (!first || !last) {
      setMessage("Enter first and last name to follow.");
      return;
    }
    const { data: target } = await supabase
      .from("profiles")
      .select("id")
      .eq("first_name", first)
      .eq("last_name", last)
      .single();
    if (!target) {
      setMessage("No matching profile found.");
      return;
    }
    if (target.id === viewer.id) {
      setMessage("You cannot follow yourself.");
      return;
    }
    const { error } = await supabase
      .from("follows")
      .insert({ follower_id: viewer.id, following_id: target.id });
    if (error) {
      setMessage(error.message);
    } else {
      setFollowFirst("");
      setFollowLast("");
      loadFollowing();
    }
  };

  const handleUnfollow = async (targetId: string) => {
    await supabase
      .from("follows")
      .delete()
      .eq("follower_id", viewer.id)
      .eq("following_id", targetId);
    loadFollowing();
  };

  const handleToggleSignups = async () => {
    const updated = !allowSignups;
    await updateAllowSignups(updated);
    setAllowSignups(updated);
  };

  const handleSwitchAccount = async (session: StoredSession) => {
    await supabase.auth.setSession({
      access_token: session.session.access_token,
      refresh_token: session.session.refresh_token
    });
    await saveSession(session.session);
    await setActiveSessionId(session.session.user.id);
    context.refreshProfile();
  };

  const handleSignOut = async () => {
    await removeSession(viewer.id);
    await supabase.auth.signOut();
  };

  return (
    <ScrollView contentContainerStyle={styles.container}>
      <Text style={styles.title}>Profile</Text>
      <StatusBanner message={message} tone="info" />
      <View style={styles.section}>
        <Text style={styles.label}>Name</Text>
        <Text style={styles.value}>
          {profile.first_name} {profile.last_name}
        </Text>
        <Text style={styles.label}>Party</Text>
        <View style={styles.partyRow}>
          {["liberty", "freedom"].map((option) => (
            <Pressable
              key={option}
              style={[
                styles.partyButton,
                option !== "freedom" && styles.partyButtonSpacer,
                party === option && styles.partyActive
              ]}
              onPress={() => setParty(option as "liberty" | "freedom")}
            >
              <Text style={[styles.partyText, party === option && styles.partyTextActive]}>{option}</Text>
            </Pressable>
          ))}
        </View>
        <Text style={styles.label}>Role</Text>
        <TextInput style={styles.input} value={role} onChangeText={setRole} />
        <Text style={styles.label}>Bio</Text>
        <TextInput style={[styles.input, styles.bioInput]} value={bio} onChangeText={setBio} multiline />
        <Pressable style={styles.primaryButton} onPress={handleSave} disabled={saving}>
          {saving ? <ActivityIndicator color={colors.white} /> : <Text style={styles.primaryText}>Save</Text>}
        </Pressable>
      </View>
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Follow Members</Text>
        <View style={styles.row}>
          <TextInput
            style={[styles.input, styles.followInput, styles.followInputSpacer]}
            placeholder="First name"
            value={followFirst}
            onChangeText={setFollowFirst}
          />
          <TextInput
            style={[styles.input, styles.followInput]}
            placeholder="Last name"
            value={followLast}
            onChangeText={setFollowLast}
          />
        </View>
        <Pressable style={styles.secondaryButton} onPress={handleFollow}>
          <Text style={styles.secondaryText}>Follow</Text>
        </Pressable>
        <View style={styles.followList}>
          {following.length === 0 ? <Text style={styles.emptyText}>Not following anyone.</Text> : null}
          {following.map((member) => (
            <View key={member.id} style={[styles.followItem, styles.followItemSpacer]}>
              <Text style={styles.followName}>
                {member.first_name} {member.last_name}
              </Text>
              <Pressable style={styles.unfollowButton} onPress={() => handleUnfollow(member.id)}>
                <Text style={styles.unfollowText}>Unfollow</Text>
              </Pressable>
            </View>
          ))}
        </View>
      </View>
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Account Switching</Text>
        {sessions.length === 0 ? <Text style={styles.emptyText}>No saved sessions.</Text> : null}
        {sessions.map((session) => (
          <Pressable
            key={session.id}
            style={styles.accountButton}
            onPress={() => handleSwitchAccount(session)}
          >
            <Text style={styles.accountText}>{session.session.user.email}</Text>
          </Pressable>
        ))}
        <Pressable style={styles.signOutButton} onPress={handleSignOut}>
          <Text style={styles.signOutText}>Sign Out</Text>
        </Pressable>
      </View>
      {viewer.is_admin ? (
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Admin Controls</Text>
          <Pressable style={styles.secondaryButton} onPress={handleToggleSignups}>
            <Text style={styles.secondaryText}>
              {allowSignups ? "Disable Signups" : "Enable Signups"}
            </Text>
          </Pressable>
        </View>
      ) : null}
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    padding: spacing.lg,
    backgroundColor: colors.white
  },
  title: {
    fontSize: 22,
    fontWeight: "700",
    color: colors.blue,
    marginBottom: spacing.md
  },
  section: {
    marginBottom: spacing.lg
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: "700",
    color: colors.red,
    marginBottom: spacing.sm
  },
  label: {
    fontSize: 12,
    color: colors.gray,
    marginBottom: spacing.xs
  },
  value: {
    fontSize: 16,
    fontWeight: "600",
    color: colors.grayDark,
    marginBottom: spacing.sm
  },
  input: {
    borderWidth: 1,
    borderColor: colors.grayLight,
    borderRadius: 8,
    padding: spacing.sm,
    marginBottom: spacing.sm
  },
  bioInput: {
    minHeight: 80,
    textAlignVertical: "top"
  },
  primaryButton: {
    backgroundColor: colors.blue,
    paddingVertical: spacing.sm,
    borderRadius: 10,
    alignItems: "center"
  },
  primaryText: {
    color: colors.white,
    fontWeight: "700"
  },
  row: {
    flexDirection: "row"
  },
  followInput: {
    flex: 1
  },
  followInputSpacer: {
    marginRight: spacing.sm
  },
  secondaryButton: {
    backgroundColor: colors.red,
    paddingVertical: spacing.sm,
    borderRadius: 10,
    alignItems: "center",
    marginBottom: spacing.sm
  },
  secondaryText: {
    color: colors.white,
    fontWeight: "700"
  },
  followList: {},
  followItem: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    borderWidth: 1,
    borderColor: colors.grayLight,
    borderRadius: 8,
    padding: spacing.sm
  },
  followItemSpacer: {
    marginBottom: spacing.sm
  },
  followName: {
    color: colors.grayDark,
    fontWeight: "600"
  },
  unfollowButton: {
    backgroundColor: colors.grayLight,
    paddingHorizontal: spacing.sm,
    paddingVertical: spacing.xs,
    borderRadius: 8
  },
  unfollowText: {
    color: colors.grayDark
  },
  emptyText: {
    color: colors.gray,
    marginBottom: spacing.sm
  },
  accountButton: {
    borderWidth: 1,
    borderColor: colors.blue,
    borderRadius: 8,
    padding: spacing.sm,
    marginBottom: spacing.sm
  },
  accountText: {
    color: colors.blue
  },
  signOutButton: {
    borderWidth: 1,
    borderColor: colors.red,
    borderRadius: 8,
    padding: spacing.sm,
    alignItems: "center"
  },
  signOutText: {
    color: colors.red,
    fontWeight: "700"
  },
  partyRow: {
    flexDirection: "row",
    marginBottom: spacing.sm
  },
  partyButton: {
    flex: 1,
    paddingVertical: spacing.sm,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: colors.red,
    alignItems: "center"
  },
  partyActive: {
    backgroundColor: colors.red
  },
  partyText: {
    color: colors.red,
    fontWeight: "600"
  },
  partyTextActive: {
    color: colors.white
  },
  partyButtonSpacer: {
    marginRight: spacing.sm
  }
});
