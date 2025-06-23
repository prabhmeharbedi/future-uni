"use server";

import { z } from "zod";
import { auth, db } from "@/lib/firebase";
import { addDoc, collection, doc, serverTimestamp, updateDoc, increment } from "firebase/firestore";
import { revalidatePath } from "next/cache";
import { updateProfile as updateFirebaseProfile } from "firebase/auth";

const postSchema = z.object({
  content: z.string().min(1).max(2000),
  imageUrl: z.string().url().optional().or(z.literal('')),
});

export async function createPost(values: z.infer<typeof postSchema>) {
  const user = auth.currentUser;

  if (!user) {
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
    await addDoc(collection(db, "posts"), {
      authorId: user.uid,
      authorName: user.displayName,
      authorPhotoURL: user.photoURL,
      content,
      imageUrl: imageUrl || null,
      likes: 0,
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

export async function clapForPost(postId: string, count: number) {
  const user = auth.currentUser;

  if (!user) {
    return { success: false, error: "You must be logged in to clap." };
  }
  if (!postId || count <= 0) {
    return { success: false, error: "Invalid clap request." };
  }

  try {
    const postRef = doc(db, "posts", postId);
    await updateDoc(postRef, {
      likes: increment(count),
    });
  } catch (error) {
    console.error("Error clapping for post:", error);
    return { success: false, error: "Failed to update claps in database." };
  }

  return { success: true };
}
