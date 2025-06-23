"use server";

import { z } from "zod";
import { auth, db } from "@/lib/firebase";
import { addDoc, collection, doc, serverTimestamp, updateDoc, increment, getDoc } from "firebase/firestore";
import { revalidatePath } from "next/cache";
import { updateProfile as updateFirebaseProfile } from "firebase/auth";
import type { Profile } from "@/lib/types";

const postSchema = z.object({
  content: z.string().min(1).max(2000),
  imageUrl: z.string().url().optional().or(z.literal('')),
});

export async function createPost(values: z.infer<typeof postSchema>, authorId: string) {
  if (!authorId) {
    return { success: false, error: "You must be logged in to post." };
  }

  const validatedFields = postSchema.safeParse(values);
  if (!validatedFields.success) {
    return {
      success: false,
      error: "Invalid fields.",
    };
  }
  
  const { content, imageUrl } = validatedFields.data;

  try {
    const profileRef = doc(db, "profiles", authorId);
    const profileSnap = await getDoc(profileRef);
    if (!profileSnap.exists()) {
      return { success: false, error: "User profile not found." };
    }
    const profileData = profileSnap.data() as Profile;

    await addDoc(collection(db, "posts"), {
      authorId: authorId,
      authorName: profileData.name,
      authorPhotoURL: profileData.photoURL,
      content,
      imageUrl: imageUrl || null,
      auraPoints: 0,
      commentCount: 0,
      createdAt: serverTimestamp(),
    });
  } catch (error) {
    return { success: false, error: "Failed to create post in database." };
  }

  revalidatePath("/");
  return { success: true };
}


const profileSchema = z.object({
  name: z.string().min(2, "Name must be at least 2 characters."),
  bio: z.string().max(500, "Bio cannot exceed 500 characters.").optional(),
  photoURL: z.string().url("Please enter a valid URL.").optional().or(z.literal('')),
});

export async function updateUserProfile(values: z.infer<typeof profileSchema>) {
    const user = auth.currentUser;

    if (!user) {
        return { success: false, error: "User not found." };
    }

    const validatedFields = profileSchema.safeParse(values);
    if (!validatedFields.success) {
        return {
            success: false,
            error: "Invalid fields.",
        };
    }

    const { name, bio, photoURL } = validatedFields.data;

    try {
        const profileRef = doc(db, "profiles", user.uid);
        
        await updateFirebaseProfile(user, {
            displayName: name,
            photoURL: photoURL || user.photoURL,
        });
        
        await updateDoc(profileRef, {
            name,
            bio: bio || "",
            photoURL: photoURL || user.photoURL,
        });

    } catch (error) {
        return { success: false, error: "Failed to update profile." };
    }

    revalidatePath("/profile");
    revalidatePath("/");
    return { success: true };
}

export async function addAuraPoints(postId: string, points: number, userId?: string) {
  if (!userId) {
    return { success: false, error: "You must be logged in to add aura points." };
  }
  if (!postId) {
    return { success: false, error: "Invalid post ID." };
  }
  if (points <= 0) {
    return { success: false, error: "Aura points must be positive." };
  }

  try {
    const postRef = doc(db, "posts", postId);
    await updateDoc(postRef, {
      auraPoints: increment(points),
    });
  } catch (error) {
    console.error("Error adding aura points:", error);
    return { success: false, error: "Failed to update aura points in database." };
  }

  revalidatePath("/");
  return { success: true };
}

const commentSchema = z.object({
  content: z.string().min(1, "Comment cannot be empty.").max(1000),
  postId: z.string(),
});

export async function addComment(values: z.infer<typeof commentSchema>, authorId: string) {
  if (!authorId) {
    return { success: false, error: "You must be logged in to comment." };
  }
  
  const validatedFields = commentSchema.safeParse(values);
  if (!validatedFields.success) {
    return { success: false, error: "Invalid comment." };
  }

  const { content, postId } = validatedFields.data;

  try {
    const profileRef = doc(db, "profiles", authorId);
    const profileSnap = await getDoc(profileRef);
    if (!profileSnap.exists()) {
      return { success: false, error: "User profile not found." };
    }
    const profileData = profileSnap.data() as Profile;

    const postRef = doc(db, "posts", postId);
    
    // Add the comment to a top-level collection
    await addDoc(collection(db, "comments"), {
      postId,
      authorId: authorId,
      authorName: profileData.name,
      authorPhotoURL: profileData.photoURL,
      content,
      createdAt: serverTimestamp(),
    });

    // Increment comment count on the post
    await updateDoc(postRef, {
      commentCount: increment(1),
    });

  } catch (error) {
    console.error("Error adding comment:", error);
    return { success: false, error: "Failed to add comment." };
  }

  revalidatePath("/");
  return { success: true };
}
