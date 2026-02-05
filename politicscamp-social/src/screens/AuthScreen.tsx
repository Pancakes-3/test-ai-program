import { useEffect, useMemo, useState } from "react";
import {
  View,
  Text,
  TextInput,
  StyleSheet,
  Pressable,
  ActivityIndicator,
  ScrollView
} from "react-native";
import { supabase } from "../lib/supabase";
import { colors } from "../theme/colors";
import { spacing } from "../theme/spacing";
import { StatusBanner } from "../components/StatusBanner";
import { fetchAllowSignups } from "../lib/config";
import { saveSession } from "../lib/sessionStore";

interface AuthScreenProps {
  onAuthSuccess: () => void;
}

const partyOptions = ["liberty", "freedom"] as const;

export function AuthScreen({ onAuthSuccess }: AuthScreenProps) {
  const [mode, setMode] = useState<"login" | "signup">("login");
  const [firstName, setFirstName] = useState("");
  const [lastName, setLastName] = useState("");
  const [password, setPassword] = useState("");
  const [party, setParty] = useState<(typeof partyOptions)[number]>("liberty");
  const [role, setRole] = useState("");
  const [bio, setBio] = useState("");
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState<string | null>(null);
  const [allowSignups, setAllowSignups] = useState(false);

  useEffect(() => {
    let active = true;
    fetchAllowSignups()
      .then(({ data, error }) => {
        if (!active) return;
        if (error) {
          setMessage(error.message);
          return;
        }
        setAllowSignups(data?.value === "true");
      })
      .catch((error: Error) => {
        if (active) setMessage(error.message);
      });
    return () => {
      active = false;
    };
  }, []);

  const email = useMemo(() => {
    const normalizedFirst = firstName.trim().toLowerCase().replace(/\s+/g, "");
    const normalizedLast = lastName.trim().toLowerCase().replace(/\s+/g, "");
    if (!normalizedFirst || !normalizedLast) return "";
    return `${normalizedFirst}.${normalizedLast}@politicscamp.local`;
  }, [firstName, lastName]);

  const handleLogin = async () => {
    setLoading(true);
    setMessage(null);
    try {
      const { data, error } = await supabase.auth.signInWithPassword({
        email,
        password
      });
      if (error) throw error;
      if (data.session) {
        await saveSession(data.session);
      }
      onAuthSuccess();
    } catch (error) {
      setMessage(error instanceof Error ? error.message : "Login failed");
    } finally {
      setLoading(false);
    }
  };

  const handleSignup = async () => {
    setLoading(true);
    setMessage(null);
    try {
      if (!allowSignups) {
        setMessage("Signups are currently disabled.");
        return;
      }
      const { data, error } = await supabase.auth.signUp({
        email,
        password
      });
      if (error) throw error;
      if (!data.user) throw new Error("No user returned from sign up.");

      const { error: profileError } = await supabase.from("profiles").insert({
        id: data.user.id,
        first_name: firstName.trim(),
        last_name: lastName.trim(),
        party,
        role: role.trim(),
        bio: bio.trim() || null,
        avatar_url: null
      });
      if (profileError) throw profileError;

      if (data.session) {
        await saveSession(data.session);
      }
      onAuthSuccess();
    } catch (error) {
      setMessage(error instanceof Error ? error.message : "Signup failed");
    } finally {
      setLoading(false);
    }
  };

  return (
    <ScrollView contentContainerStyle={styles.container}>
      <Text style={styles.title}>Politics Camp Social</Text>
      <Text style={styles.subtitle}>Private camp-only social network</Text>
      <StatusBanner message={message} tone="error" />
      <View style={styles.toggleRow}>
        <Pressable
          style={[styles.toggleButton, styles.toggleButtonSpacer, mode === "login" && styles.toggleActive]}
          onPress={() => setMode("login")}
        >
          <Text style={[styles.toggleText, mode === "login" && styles.toggleTextActive]}>Login</Text>
        </Pressable>
        <Pressable
          style={[styles.toggleButton, mode === "signup" && styles.toggleActive]}
          onPress={() => setMode("signup")}
          disabled={!allowSignups}
        >
          <Text style={[styles.toggleText, mode === "signup" && styles.toggleTextActive]}>Sign Up</Text>
        </Pressable>
      </View>
      {!allowSignups && mode === "signup" ? (
        <StatusBanner message="Signups are disabled by admin." tone="info" />
      ) : null}
      <TextInput
        style={styles.input}
        placeholder="First name"
        value={firstName}
        onChangeText={setFirstName}
        autoCapitalize="words"
      />
      <TextInput
        style={styles.input}
        placeholder="Last name"
        value={lastName}
        onChangeText={setLastName}
        autoCapitalize="words"
      />
      <TextInput
        style={styles.input}
        placeholder="Password"
        value={password}
        onChangeText={setPassword}
        secureTextEntry
      />
      {mode === "signup" ? (
        <>
          <TextInput
            style={styles.input}
            placeholder="Role (senator, member of house, etc.)"
            value={role}
            onChangeText={setRole}
          />
          <TextInput
            style={styles.input}
            placeholder="Bio (optional)"
            value={bio}
            onChangeText={setBio}
          />
          <View style={styles.partyRow}>
            {partyOptions.map((option) => (
              <Pressable
                key={option}
                style={[styles.partyButton, option !== partyOptions[partyOptions.length - 1] && styles.partyButtonSpacer, party === option && styles.partyActive]}
                onPress={() => setParty(option)}
              >
                <Text style={[styles.partyText, party === option && styles.partyTextActive]}>{option}</Text>
              </Pressable>
            ))}
          </View>
        </>
      ) : null}
      <Text style={styles.generatedEmail}>Login ID: {email || "first.last@politicscamp.local"}</Text>
      <Pressable
        onPress={mode === "login" ? handleLogin : handleSignup}
        style={styles.primaryButton}
        disabled={loading}
      >
        {loading ? (
          <ActivityIndicator color={colors.white} />
        ) : (
          <Text style={styles.primaryButtonText}>
            {mode === "login" ? "Login" : "Create Account"}
          </Text>
        )}
      </Pressable>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    padding: spacing.lg,
    paddingTop: spacing.xl,
    backgroundColor: colors.white,
    flexGrow: 1
  },
  title: {
    fontSize: 26,
    fontWeight: "700",
    color: colors.blue
  },
  subtitle: {
    fontSize: 14,
    color: colors.grayDark,
    marginBottom: spacing.lg
  },
  toggleRow: {
    flexDirection: "row",
    marginBottom: spacing.md
  },
  toggleButton: {
    flex: 1,
    paddingVertical: spacing.sm,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: colors.blue,
    alignItems: "center"
  },
  toggleActive: {
    backgroundColor: colors.blue
  },
  toggleText: {
    color: colors.blue,
    fontWeight: "600"
  },
  toggleTextActive: {
    color: colors.white
  },
  toggleButtonSpacer: {
    marginRight: spacing.sm
  },
  input: {
    borderWidth: 1,
    borderColor: colors.grayLight,
    borderRadius: 8,
    padding: spacing.sm,
    marginBottom: spacing.sm
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
  },
  generatedEmail: {
    fontSize: 12,
    color: colors.gray,
    marginBottom: spacing.md
  },
  primaryButton: {
    backgroundColor: colors.blue,
    paddingVertical: spacing.sm,
    borderRadius: 10,
    alignItems: "center"
  },
  primaryButtonText: {
    color: colors.white,
    fontWeight: "700"
  }
});
