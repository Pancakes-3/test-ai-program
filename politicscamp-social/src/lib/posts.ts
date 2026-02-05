import { supabase } from "./supabase";
import { Post } from "../types";
import { extractMentions } from "./mentions";

interface FetchPostsOptions {
  viewerId: string;
  onlyBreaking?: boolean;
  onlyFollowing?: boolean;
}

export async function fetchPosts({ viewerId, onlyBreaking, onlyFollowing }: FetchPostsOptions) {
  let followingIds: string[] = [];
  if (onlyFollowing) {
    const { data: follows } = await supabase
      .from("follows")
      .select("following_id")
      .eq("follower_id", viewerId);
    followingIds = (follows ?? []).map((follow) => follow.following_id);
    if (followingIds.length === 0) {
      return [] as Post[];
    }
  }

  let query = supabase
    .from("posts")
    .select("*, author:profiles(*), likes(count), comments(count)")
    .order("created_at", { ascending: false });

  if (onlyBreaking) query = query.eq("is_breaking", true);
  if (onlyFollowing) query = query.in("author_id", followingIds);

  const { data, error } = await query;
  if (error) throw error;

  const posts = (data ?? []).map((row) => ({
    ...row,
    like_count: row.likes?.[0]?.count ?? 0,
    comment_count: row.comments?.[0]?.count ?? 0
  })) as Post[];

  if (posts.length === 0) return posts;

  const { data: likes } = await supabase
    .from("likes")
    .select("post_id")
    .eq("user_id", viewerId)
    .in(
      "post_id",
      posts.map((post) => post.id)
    );

  const likedSet = new Set(likes?.map((like) => like.post_id));
  return posts.map((post) => ({
    ...post,
    has_liked: likedSet.has(post.id)
  }));
}

export async function toggleLike(post: Post, viewerId: string) {
  if (post.has_liked) {
    return supabase.from("likes").delete().eq("post_id", post.id).eq("user_id", viewerId);
  }
  return supabase.from("likes").insert({ post_id: post.id, user_id: viewerId });
}

export async function toggleBreaking(postId: string, isBreaking: boolean) {
  return supabase.from("posts").update({ is_breaking: isBreaking }).eq("id", postId);
}

export async function createPost(authorId: string, content: string, isBreaking: boolean) {
  const { data, error } = await supabase
    .from("posts")
    .insert({ author_id: authorId, content, is_breaking: isBreaking })
    .select("*")
    .single();

  if (error) throw error;

  const mentions = extractMentions(content);
  if (mentions.length > 0) {
    const { data: profiles } = await supabase
      .from("profiles")
      .select("id, first_name, last_name")
      .in(
        "first_name",
        mentions.map((mention) => mention.firstName)
      );

    const mentionRows = (profiles ?? [])
      .filter((profile) =>
        mentions.some(
          (mention) =>
            mention.firstName.toLowerCase() === profile.first_name.toLowerCase() &&
            mention.lastName.toLowerCase() === profile.last_name.toLowerCase()
        )
      )
      .map((profile) => ({
        post_id: data.id,
        mentioned_user_id: profile.id
      }));

    if (mentionRows.length > 0) {
      await supabase.from("mentions").insert(mentionRows);
    }
  }

  return data;
}

export async function fetchComments(postId: string) {
  const { data, error } = await supabase
    .from("comments")
    .select("*, author:profiles(*)")
    .eq("post_id", postId)
    .order("created_at", { ascending: true });
  if (error) throw error;
  return data ?? [];
}

export async function addComment(postId: string, authorId: string, content: string) {
  return supabase.from("comments").insert({ post_id: postId, author_id: authorId, content });
}
