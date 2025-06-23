"use client";

import { useState } from "react";
import Image from "next/image";
import { formatDistanceToNow } from "date-fns";
import { doc, increment, updateDoc } from "firebase/firestore";
import { db } from "@/lib/firebase";
import type { Post } from "@/lib/types";
import {
  Card,
  CardContent,
  CardFooter,
  CardHeader,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Heart } from "lucide-react";
import { UserAvatar } from "@/components/UserAvatar";
import { useAuth } from "@/hooks/use-auth";

interface PostCardProps {
  post: Post;
}

export function PostCard({ post }: PostCardProps) {
  const { user } = useAuth();
  const [likes, setLikes] = useState(post.likes);
  const [isLiking, setIsLiking] = useState(false);

  const handleLike = async () => {
    if (!user || isLiking) return;

    setIsLiking(true);
    setLikes((prevLikes) => prevLikes + 1);

    const postRef = doc(db, "posts", post.id);
    try {
      await updateDoc(postRef, {
        likes: increment(1),
      });
    } catch (error) {
      console.error("Error updating likes:", error);
      setLikes((prevLikes) => prevLikes - 1); // Revert optimistic update on error
    } finally {
      setIsLiking(false);
    }
  };

  return (
    <Card className="mb-4">
      <CardHeader>
        <div className="flex items-center space-x-4">
          <UserAvatar name={post.authorName} imageUrl={post.authorPhotoURL} />
          <div>
            <p className="font-semibold">{post.authorName}</p>
            <p className="text-sm text-muted-foreground">
              {formatDistanceToNow(post.createdAt.toDate(), { addSuffix: true })}
            </p>
          </div>
        </div>
      </CardHeader>
      <CardContent>
        <p className="whitespace-pre-wrap">{post.content}</p>
        {post.imageUrl && (
          <div className="mt-4 relative aspect-video w-full overflow-hidden rounded-lg border">
            <Image
              src={post.imageUrl}
              alt="Post image"
              fill
              className="object-cover"
              sizes="(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 33vw"
            />
          </div>
        )}
      </CardContent>
      <CardFooter className="flex items-center justify-between">
        <div className="flex items-center space-x-2 text-muted-foreground">
          <Heart className="h-5 w-5" />
          <span>{likes}</span>
        </div>
        <Button onClick={handleLike} disabled={!user || isLiking} variant="outline" size="sm">
          <Heart className={`mr-2 h-4 w-4 ${isLiking ? 'text-red-500 fill-red-500' : ''}`} />
          Like
        </Button>
      </CardFooter>
    </Card>
  );
}
