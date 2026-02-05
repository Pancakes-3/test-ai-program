import { useState } from "react";
import { View, Text, TextInput, StyleSheet, Pressable, ActivityIndicator } from "react-native";
import { useNavigation } from "@react-navigation/native";
import { NativeStackNavigationProp } from "@react-navigation/native-stack";
import { colors } from "../theme/colors";
import { spacing } from "../theme/spacing";
import { Profile } from "../types";
import { createPost } from "../lib/posts";
import { StatusBanner } from "../components/StatusBanner";
import { RootStackParamList } from "../../App";

interface NewPostScreenProps {
  viewer: Profile;
  context: { refreshProfile: () => void };
}

export function NewPostScreen({ viewer }: NewPostScreenProps) {
  const navigation = useNavigation<NativeStackNavigationProp<RootStackParamList>>();
  const [content, setContent] = useState("");
  const [isBreaking, setIsBreaking] = useState(false);
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState<string | null>(null);

  const handleSubmit = async () => {
    setLoading(true);
    setMessage(null);
    try {
      await createPost(viewer.id, content.trim(), viewer.is_admin ? isBreaking : false);
      navigation.goBack();
    } catch (error) {
      setMessage(error instanceof Error ? error.message : "Failed to create post");
    } finally {
      setLoading(false);
    }
  };

  return (
    <View style={styles.container}>
      <Text style={styles.title}>Share an update</Text>
      <StatusBanner message={message} tone="error" />
      <TextInput
        style={styles.input}
        placeholder="What is happening in camp?"
        value={content}
        onChangeText={setContent}
        multiline
      />
      <View style={styles.mediaPlaceholder}>
        <Text style={styles.mediaText}>Media placeholder (logic only)</Text>
      </View>
      {viewer.is_admin ? (
        <Pressable
          onPress={() => setIsBreaking((prev) => !prev)}
          style={[styles.breakingToggle, isBreaking && styles.breakingActive]}
        >
          <Text style={[styles.breakingText, isBreaking && styles.breakingTextActive]}>
            {isBreaking ? "Breaking News ON" : "Mark as Breaking News"}
          </Text>
        </Pressable>
      ) : null}
      <Pressable
        style={[styles.submitButton, !content.trim() && styles.submitDisabled]}
        onPress={handleSubmit}
        disabled={!content.trim() || loading}
      >
        {loading ? <ActivityIndicator color={colors.white} /> : <Text style={styles.submitText}>Post</Text>}
      </Pressable>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    padding: spacing.lg,
    backgroundColor: colors.white
  },
  title: {
    fontSize: 22,
    fontWeight: "700",
    color: colors.blue,
    marginBottom: spacing.md
  },
  input: {
    borderWidth: 1,
    borderColor: colors.grayLight,
    borderRadius: 10,
    padding: spacing.md,
    minHeight: 120,
    textAlignVertical: "top",
    marginBottom: spacing.md
  },
  mediaPlaceholder: {
    backgroundColor: colors.grayLight,
    borderRadius: 10,
    padding: spacing.md,
    alignItems: "center",
    marginBottom: spacing.md
  },
  mediaText: {
    color: colors.gray
  },
  breakingToggle: {
    borderWidth: 1,
    borderColor: colors.red,
    padding: spacing.sm,
    borderRadius: 8,
    marginBottom: spacing.md
  },
  breakingActive: {
    backgroundColor: colors.red
  },
  breakingText: {
    color: colors.red,
    fontWeight: "600",
    textAlign: "center"
  },
  breakingTextActive: {
    color: colors.white
  },
  submitButton: {
    backgroundColor: colors.blue,
    borderRadius: 10,
    paddingVertical: spacing.sm,
    alignItems: "center"
  },
  submitDisabled: {
    opacity: 0.5
  },
  submitText: {
    color: colors.white,
    fontWeight: "700"
  }
});
