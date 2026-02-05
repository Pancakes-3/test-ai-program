import { View, Text, StyleSheet, Pressable } from "react-native";
import { Post, Profile } from "../types";
import { colors } from "../theme/colors";
import { spacing } from "../theme/spacing";

interface PostCardProps {
  post: Post;
  viewer?: Profile | null;
  onToggleLike: (post: Post) => void;
  onToggleBreaking?: (post: Post) => void;
  onOpenComments?: (post: Post) => void;
}

export function PostCard({
  post,
  viewer,
  onToggleLike,
  onToggleBreaking,
  onOpenComments
}: PostCardProps) {
  const breakingTextStyle = post.is_breaking ? styles.breakingTextActive : styles.breakingText;

  return (
    <View style={styles.card}>
      <View style={styles.header}>
        <Text style={styles.author}>
          {post.author?.first_name} {post.author?.last_name}
        </Text>
        <Text style={styles.meta}>{post.author?.role}</Text>
      </View>
      <Text style={styles.content}>{post.content}</Text>
      <View style={styles.mediaPlaceholder}>
        <Text style={styles.mediaText}>Media placeholder</Text>
      </View>
      <View style={styles.actions}>
        <Pressable onPress={() => onToggleLike(post)} style={[styles.actionButton, styles.actionItem]}>
          <Text style={styles.actionText}>{post.has_liked ? "Unlike" : "Like"}</Text>
        </Pressable>
        <Pressable
          onPress={() => onOpenComments?.(post)}
          style={[styles.actionButton, styles.secondaryAction, styles.actionItem]}
        >
          <Text style={styles.actionText}>Comment</Text>
        </Pressable>
        <Text style={[styles.counts, styles.actionItem]}>❤️ {post.like_count ?? 0}</Text>
        <Text style={[styles.counts, styles.actionItem]}>💬 {post.comment_count ?? 0}</Text>
      </View>
      {viewer?.is_admin && onToggleBreaking ? (
        <Pressable
          onPress={() => onToggleBreaking(post)}
          style={[styles.breakingToggle, post.is_breaking && styles.breakingActive]}
        >
          <Text style={breakingTextStyle}>
            {post.is_breaking ? "Breaking News" : "Mark Breaking"}
          </Text>
        </Pressable>
      ) : null}
    </View>
  );
}

const styles = StyleSheet.create({
  card: {
    backgroundColor: colors.white,
    borderRadius: 12,
    padding: spacing.md,
    marginBottom: spacing.md,
    borderWidth: 1,
    borderColor: colors.grayLight
  },
  header: {
    marginBottom: spacing.sm
  },
  author: {
    fontSize: 16,
    fontWeight: "700",
    color: colors.black
  },
  meta: {
    fontSize: 12,
    color: colors.gray
  },
  content: {
    fontSize: 15,
    color: colors.grayDark,
    marginBottom: spacing.sm
  },
  mediaPlaceholder: {
    backgroundColor: colors.grayLight,
    borderRadius: 10,
    padding: spacing.md,
    alignItems: "center",
    marginBottom: spacing.sm
  },
  mediaText: {
    color: colors.gray
  },
  actions: {
    flexDirection: "row",
    alignItems: "center",
    flexWrap: "wrap"
  },
  actionItem: {
    marginRight: spacing.sm,
    marginBottom: spacing.xs
  },
  actionButton: {
    backgroundColor: colors.blue,
    paddingHorizontal: spacing.sm,
    paddingVertical: spacing.xs,
    borderRadius: 8
  },
  secondaryAction: {
    backgroundColor: colors.red
  },
  actionText: {
    color: colors.white,
    fontWeight: "600"
  },
  counts: {
    fontSize: 12,
    color: colors.grayDark
  },
  breakingToggle: {
    marginTop: spacing.sm,
    paddingVertical: spacing.xs,
    paddingHorizontal: spacing.sm,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: colors.red
  },
  breakingActive: {
    backgroundColor: colors.red
  },
  breakingText: {
    color: colors.red,
    fontWeight: "700"
  },
  breakingTextActive: {
    color: colors.white,
    fontWeight: "700"
  }
});
