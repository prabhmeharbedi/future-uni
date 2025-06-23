"use client";

import { useState } from "react";
import Image from "next/image";
import { formatDistanceToNow } from "date-fns";
import type { Post } from "@/lib/types";
import { Button } from "@/components/ui/button";
import { Heart, MessageCircle, Send, Bookmark, MoreHorizontal } from "lucide-react";
import { UserAvatar } from "@/components/UserAvatar";
import { useAuth } from "@/hooks/use-auth";
import { likePost } from "@/lib/actions";
import { cn } from "@/lib/utils";
import { useToast } from "@/hooks/use-toast";

interface PostCardProps {
  post: Post;
}

export function PostCard({ post }: PostCardProps) {
  const { user } = useAuth();
  const { toast } = useToast();
  
  const [isLiked, setIsLiked] = useState(false);
  const [likeCount, setLikeCount] = useState(post.likes);

  const handleLikeClick = async () => {
    if (!user) {
       toast({
        variant: "destructive",
        title: "You must be logged in to like a post.",
      });
      return;
    }
    
    // To keep the UI snappy, we update the state immediately
    // and then revert it if the server call fails.
    if (!isLiked) {
      setIsLiked(true);
      setLikeCount((prev) => prev + 1);
      const result = await likePost(post.id, user.uid);
      if (!result.success) {
        // Revert state on failure
        setIsLiked(false);
        setLikeCount((prev) => prev - 1);
        toast({
          variant: "destructive",
          title: "Failed to like post.",
          description: result.error,
        });
      }
    }
  };

  return (
    <div className="rounded-md border bg-card text-card-foreground">
      {/* Card Header */}
      <div className="flex items-center p-4">
        <UserAvatar name={post.authorName} imageUrl={post.authorPhotoURL} className="h-8 w-8" />
        <p className="font-semibold text-sm ml-3">{post.authorName}</p>
        <Button variant="ghost" size="icon" className="ml-auto h-8 w-8">
            <MoreHorizontal className="h-4 w-4" />
        </Button>
      </div>

      {/* Card Image */}
      {post.imageUrl && (
        <div className="relative aspect-square w-full">
          <Image
            src={post.imageUrl}
            alt="Post image"
            fill
            className="object-cover"
            sizes="(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 33vw"
            data-ai-hint="social media post"
          />
        </div>
      )}

      {/* Card Actions */}
      <div className="p-4">
        <div className="flex items-center space-x-4">
          <Button variant="ghost" size="icon" onClick={handleLikeClick}>
            <Heart className={cn("h-6 w-6", isLiked && "text-red-500 fill-red-500")} />
          </Button>
          <Button variant="ghost" size="icon">
            <MessageCircle className="h-6 w-6" />
          </Button>
          <Button variant="ghost" size="icon">
            <Send className="h-6 w-6" />
          </Button>
          <Button variant="ghost" size="icon" className="ml-auto">
            <Bookmark className="h-6 w-6" />
          </Button>
        </div>
      </div>

      {/* Card Footer */}
      <div className="px-4 pb-4 space-y-2">
        <p className="font-semibold text-sm">{likeCount.toLocaleString()} likes</p>
        <div>
          <span className="font-semibold text-sm mr-2">{post.authorName}</span>
          <span className="text-sm">{post.content}</span>
        </div>
        <p className="text-xs text-muted-foreground uppercase">
          {formatDistanceToNow(post.createdAt.toDate(), { addSuffix: true })}
        </p>
      </div>
    </div>
  );
}
