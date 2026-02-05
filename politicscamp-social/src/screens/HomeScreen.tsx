import { useCallback, useEffect, useState } from "react";
import { View, Text, StyleSheet, FlatList, Pressable, RefreshControl } from "react-native";
import { useNavigation } from "@react-navigation/native";
import { NativeStackNavigationProp } from "@react-navigation/native-stack";
import { PostCard } from "../components/PostCard";
import { Post, Profile } from "../types";
import { colors } from "../theme/colors";
import { spacing } from "../theme/spacing";
import { fetchPosts, toggleLike, toggleBreaking } from "../lib/posts";
import { RootStackParamList } from "../../App";
import { StatusBanner } from "../components/StatusBanner";

interface FeedScreenProps {
  viewer: Profile;
  context: { refreshProfile: () => void };
}

export function HomeScreen({ viewer }: FeedScreenProps) {
  const navigation = useNavigation<NativeStackNavigationProp<RootStackParamList>>();
  const [posts, setPosts] = useState<Post[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const loadPosts = useCallback(async () => {
    try {
      setError(null);
      const data = await fetchPosts({ viewerId: viewer.id });
      setPosts(data);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to load posts");
    } finally {
      setLoading(false);
    }
  }, [viewer.id]);

  useEffect(() => {
    loadPosts();
  }, [loadPosts]);

  const handleToggleLike = async (post: Post) => {
    await toggleLike(post, viewer.id);
    loadPosts();
  };

  const handleToggleBreaking = async (post: Post) => {
    await toggleBreaking(post.id, !post.is_breaking);
    loadPosts();
  };

  return (
    <View style={styles.container}>
      <View style={styles.headerRow}>
        <Text style={styles.title}>Latest Updates</Text>
        <Pressable style={styles.newPostButton} onPress={() => navigation.navigate("NewPost")}>
          <Text style={styles.newPostText}>New Post</Text>
        </Pressable>
      </View>
      <StatusBanner message={error} tone="error" />
      <FlatList
        data={posts}
        keyExtractor={(item) => item.id}
        renderItem={({ item }) => (
          <PostCard
            post={item}
            viewer={viewer}
            onToggleLike={handleToggleLike}
            onToggleBreaking={viewer.is_admin ? handleToggleBreaking : undefined}
            onOpenComments={(post) => navigation.navigate("Comments", { postId: post.id })}
          />
        )}
        refreshControl={<RefreshControl refreshing={loading} onRefresh={loadPosts} />}
        contentContainerStyle={styles.listContent}
        ListEmptyComponent={!loading ? <Text style={styles.emptyText}>No posts yet.</Text> : null}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    padding: spacing.md,
    backgroundColor: colors.grayLight
  },
  headerRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: spacing.md
  },
  title: {
    fontSize: 20,
    fontWeight: "700",
    color: colors.blue
  },
  newPostButton: {
    backgroundColor: colors.red,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.xs,
    borderRadius: 10
  },
  newPostText: {
    color: colors.white,
    fontWeight: "600"
  },
  listContent: {
    paddingBottom: spacing.xl
  },
  emptyText: {
    textAlign: "center",
    color: colors.gray,
    marginTop: spacing.lg
  }
});
