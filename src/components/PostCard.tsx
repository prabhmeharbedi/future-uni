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
    <Card className="shadow-sm transition-all hover:shadow-md">
      <div className="flex items-center p-4">
        <UserAvatar name={post.authorName} imageUrl={post.authorPhotoURL} className="h-10 w-10" />
        <p className="font-semibold text-sm ml-4">{post.authorName}</p>
        <Button variant="ghost" size="icon" className="ml-auto h-8 w-8">
            <MoreHorizontal className="h-4 w-4" />
        </Button>
      </div>

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

      <div className="p-4 space-y-3">
        <div className="flex items-center justify-between">
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
            <Button variant="ghost" size="icon">
              <MessageCircle className="h-6 w-6" />
            </Button>
            <Button variant="ghost" size="icon">
              <Send className="h-6 w-6" />
            </Button>
          </div>
          <p className="text-sm font-semibold">{displayAuraPoints.toLocaleString()} aura points</p>
        </div>
        
        <div>
          <span className="font-semibold text-sm mr-2">{post.authorName}</span>
          <span className="text-sm text-foreground/90">{post.content}</span>
        </div>

        <p className="text-xs text-muted-foreground uppercase pt-2">
          {post.createdAt && formatDistanceToNow(post.createdAt.toDate(), { addSuffix: true })}
        </p>
      </div>
    </Card>
  );
}
