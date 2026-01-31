import { z } from "zod";

export const loginSchema = z.object({
  username: z.string().min(3).max(30),
  password: z.string().min(6).max(100)
});

export const setupSchema = z.object({
  setupKey: z.string().min(4),
  username: z.string().min(3).max(30),
  displayName: z.string().min(2).max(50),
  password: z.string().min(8).max(100)
});

export const createUserSchema = z.object({
  username: z.string().min(3).max(30),
  displayName: z.string().min(2).max(50),
  role: z.enum(["ADMIN", "USER", "MOD"]),
  tags: z.array(z.enum(["BREAKING_NEWS", "CANDIDATE", "PRESIDENT"]))
});

export const updateProfileSchema = z.object({
  displayName: z.string().min(2).max(50),
  bio: z.string().max(240).optional(),
  avatarUrl: z.string().url().optional().or(z.literal(""))
});

export const changePasswordSchema = z.object({
  password: z.string().min(8).max(100)
});

export const postSchema = z.object({
  text: z.string().max(1000).optional().or(z.literal(""))
});
