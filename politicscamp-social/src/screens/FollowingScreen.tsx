import { useCallback, useEffect, useState } from "react";
import { View, Text, StyleSheet, FlatList, RefreshControl } from "react-native";
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

export function FollowingScreen({ viewer }: FeedScreenProps) {
  const navigation = useNavigation<NativeStackNavigationProp<RootStackParamList>>();
  const [posts, setPosts] = useState<Post[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const loadPosts = useCallback(async () => {
    try {
      setError(null);
      const data = await fetchPosts({ viewerId: viewer.id, onlyFollowing: true });
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
      <Text style={styles.title}>Following</Text>
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
        ListEmptyComponent={!loading ? <Text style={styles.emptyText}>No posts from followed members.</Text> : null}
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
  title: {
    fontSize: 20,
    fontWeight: "700",
    color: colors.blue,
    marginBottom: spacing.md
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
