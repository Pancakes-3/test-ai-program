import { useCallback, useEffect, useState } from "react";
import { View, Text, TextInput, StyleSheet, FlatList, Pressable } from "react-native";
import { Profile } from "../types";
import { colors } from "../theme/colors";
import { spacing } from "../theme/spacing";
import { addComment, fetchComments } from "../lib/posts";
import { StatusBanner } from "../components/StatusBanner";

interface CommentsScreenProps {
  viewer: Profile;
  postId: string;
  context: { refreshProfile: () => void };
}

interface CommentWithAuthor {
  id: string;
  content: string;
  created_at: string;
  author: Profile;
}

export function CommentsScreen({ viewer, postId }: CommentsScreenProps) {
  const [comments, setComments] = useState<CommentWithAuthor[]>([]);
  const [content, setContent] = useState("");
  const [message, setMessage] = useState<string | null>(null);

  const loadComments = useCallback(async () => {
    try {
      setMessage(null);
      const data = await fetchComments(postId);
      setComments(data as CommentWithAuthor[]);
    } catch (error) {
      setMessage(error instanceof Error ? error.message : "Failed to load comments");
    }
  }, [postId]);

  useEffect(() => {
    loadComments();
  }, [loadComments]);

  const handleSubmit = async () => {
    try {
      await addComment(postId, viewer.id, content.trim());
      setContent("");
      loadComments();
    } catch (error) {
      setMessage(error instanceof Error ? error.message : "Failed to add comment");
    }
  };

  return (
    <View style={styles.container}>
      <StatusBanner message={message} tone="error" />
      <FlatList
        data={comments}
        keyExtractor={(item) => item.id}
        renderItem={({ item }) => (
          <View style={styles.commentCard}>
            <Text style={styles.commentAuthor}>
              {item.author?.first_name} {item.author?.last_name}
            </Text>
            <Text style={styles.commentText}>{item.content}</Text>
          </View>
        )}
        contentContainerStyle={styles.listContent}
        ListEmptyComponent={<Text style={styles.emptyText}>No comments yet.</Text>}
      />
      <View style={styles.inputRow}>
        <TextInput
          style={styles.input}
          placeholder="Write a comment"
          value={content}
          onChangeText={setContent}
        />
        <Pressable
          style={[styles.submitButton, styles.submitButtonSpacer, !content.trim() && styles.submitDisabled]}
          onPress={handleSubmit}
          disabled={!content.trim()}
        >
          <Text style={styles.submitText}>Send</Text>
        </Pressable>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    padding: spacing.md,
    backgroundColor: colors.white
  },
  listContent: {
    paddingBottom: spacing.lg
  },
  commentCard: {
    borderBottomWidth: 1,
    borderBottomColor: colors.grayLight,
    paddingVertical: spacing.sm
  },
  commentAuthor: {
    fontWeight: "700",
    color: colors.blue,
    marginBottom: spacing.xs
  },
  commentText: {
    color: colors.grayDark
  },
  emptyText: {
    textAlign: "center",
    color: colors.gray,
    marginTop: spacing.lg
  },
  inputRow: {
    flexDirection: "row",
    alignItems: "center",
    paddingTop: spacing.sm,
    borderTopWidth: 1,
    borderTopColor: colors.grayLight
  },
  submitButtonSpacer: {
    marginLeft: spacing.sm
  },
  input: {
    flex: 1,
    borderWidth: 1,
    borderColor: colors.grayLight,
    borderRadius: 8,
    padding: spacing.sm
  },
  submitButton: {
    backgroundColor: colors.blue,
    paddingVertical: spacing.sm,
    paddingHorizontal: spacing.md,
    borderRadius: 8
  },
  submitDisabled: {
    opacity: 0.5
  },
  submitText: {
    color: colors.white,
    fontWeight: "600"
  }
});
