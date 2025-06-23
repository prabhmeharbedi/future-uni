import type { Timestamp } from "firebase/firestore";

export interface Profile {
  uid: string;
  name: string;
  bio: string;
  photoURL: string;
}

export interface Post {
  id: string;
  authorId: string;
  authorName: string;
  authorPhotoURL: string;
  content: string;
  imageUrl?: string;
  auraPoints: number;
  commentCount?: number;
  createdAt: Timestamp;
}

export interface Comment {
  id: string;
  postId: string;
  authorId: string;
  authorName:string;
  authorPhotoURL: string;
  content: string;
  createdAt: Timestamp;
}
