"use client";

import { useState, useRef, useEffect, useTransition } from "react";
import Image from "next/image";
import { formatDistanceToNow } from "date-fns";
import type { Post } from "@/lib/types";
import { Button } from "@/components/ui/button";
import { Heart, MessageCircle, Send, MoreHorizontal } from "lucide-react";
import { UserAvatar } from "@/components/UserAvatar";
import { useAuth } from "@/hooks/use-auth";
import { addAuraPoints } from "@/lib/actions";
import { cn } from "@/lib/utils";
import { useToast } from "@/hooks/use-toast";
import { Card } from "@/components/ui/card";
import { CommentSheet } from "./CommentSheet";

interface AuraPointBubble {
  id: number;
  count: number;
}

interface PostCardProps {
  post: Post;
}

export function PostCard({ post }: PostCardProps) {
  const { user } = useAuth();
  const { toast } = useToast();
  
  const [displayAuraPoints, setDisplayAuraPoints] = useState(post.auraPoints || 0);
  const [localAuraPoints, setLocalAuraPoints] = useState(0);
  const [auraPointBubbles, setAuraPointBubbles] = useState<AuraPointBubble[]>([]);
  const [isPending, startTransition] = useTransition();
  const [isCommentSheetOpen, setIsCommentSheetOpen] = useState(false);

  const auraPointTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  const auraButtonRef = useRef<HTMLButtonElement>(null);

  const MAX_AURA_POINTS = 50;

  const handleAddAuraPoint = () => {
    if (!user) {
       toast({ variant: "destructive", title: "You must be logged in to add aura points." });
       return;
    }
    
    if (localAuraPoints >= MAX_AURA_POINTS) {
      toast({ title: "You've reached the maximum aura points for this post!" });
      return;
    }
    
    const newPoints = localAuraPoints + 1;
    setLocalAuraPoints(newPoints);
    setDisplayAuraPoints(prev => prev + 1);

    setAuraPointBubbles(prev => [...prev, { id: Date.now(), count: newPoints }]);

    if (auraPointTimeoutRef.current) {
      clearTimeout(auraPointTimeoutRef.current);
    }
    
    auraPointTimeoutRef.current = setTimeout(() => {
      if (localAuraPoints > 0) {
        saveAuraPoints(localAuraPoints);
        setLocalAuraPoints(0);
      }
    }, 1500);
  };
  
  const saveAuraPoints = (pointsToSend: number) => {
    startTransition(async () => {
      const result = await addAuraPoints(post.id, pointsToSend, user!.uid);
      if (!result.success) {
        setDisplayAuraPoints((prev) => prev - pointsToSend);
        toast({
          variant: "destructive",
          title: "Failed to save aura points.",
          description: result.error,
        });
      }
    });
  };

  useEffect(() => {
    return () => {
      if (auraPointTimeoutRef.current) {
        clearTimeout(auraPointTimeoutRef.current);
      }
    };
  }, []);

  return (
    <>
      <Card className="shadow-sm transition-all hover:shadow-md">
        <div className="flex items-center p-4">
          <UserAvatar name={post.authorName} imageUrl={post.authorPhotoURL} className="h-10 w-10" />
          <div className="ml-4">
            <p className="font-semibold text-sm">{post.authorName}</p>
            <p className="text-xs text-muted-foreground">
                {post.createdAt && formatDistanceToNow(post.createdAt.toDate(), { addSuffix: true })}
            </p>
          </div>
          <Button variant="ghost" size="icon" className="ml-auto h-8 w-8">
              <MoreHorizontal className="h-4 w-4" />
          </Button>
        </div>

        <div className="px-4 pb-4 space-y-4">
          <p className="text-sm text-foreground/90 whitespace-pre-wrap">{post.content}</p>

          {post.imageUrl && (
            <div className="relative aspect-video w-full">
              <Image
                src={post.imageUrl}
                alt="Post image"
                fill
                className="object-cover rounded-md"
                sizes="(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 33vw"
                data-ai-hint="social media post"
              />
            </div>
          )}
          
          <div className="flex items-center justify-between pt-2">
            <div className="flex items-center space-x-2">
              <div className="relative">
                <Button ref={auraButtonRef} variant="ghost" size="icon" onClick={handleAddAuraPoint} className="relative z-10">
                  <Heart className={cn("h-6 w-6", localAuraPoints > 0 && "text-accent fill-accent")} />
                </Button>
                {auraPointBubbles.map(bubble => (
                  <div 
                    key={bubble.id} 
                    className="absolute bottom-full left-1/2 -translate-x-1/2 flex items-center justify-center w-8 h-8 rounded-full bg-accent text-accent-foreground font-bold text-xs pointer-events-none animate-clap-bubble"
                    onAnimationEnd={() => setAuraPointBubbles(prev => prev.filter(b => b.id !== bubble.id))}
                  >
                    +{bubble.count}
                  </div>
                ))}
              </div>
              <Button variant="ghost" size="icon" onClick={() => setIsCommentSheetOpen(true)}>
                <MessageCircle className="h-6 w-6" />
              </Button>
              <Button variant="ghost" size="icon">
                <Send className="h-6 w-6" />
              </Button>
            </div>
            <p className="text-sm font-semibold">{(displayAuraPoints || 0).toLocaleString()} aura points</p>
          </div>
          
          {(post.commentCount ?? 0) > 0 && (
            <button
              onClick={() => setIsCommentSheetOpen(true)}
              className="text-sm text-muted-foreground hover:text-foreground/90 transition-colors"
            >
              View all {post.commentCount} comments
            </button>
          )}
        </div>
      </Card>
      <CommentSheet
        isOpen={isCommentSheetOpen}
        onOpenChange={setIsCommentSheetOpen}
        postId={post.id}
        postAuthorName={post.authorName}
      />
    </>
  );
}
