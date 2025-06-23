"use client";

import { useState, useRef, useEffect, useTransition } from "react";
import Image from "next/image";
import { formatDistanceToNow } from "date-fns";
import type { Post } from "@/lib/types";
import { Button } from "@/components/ui/button";
import { Heart, MessageCircle, Send, Bookmark, MoreHorizontal } from "lucide-react";
import { UserAvatar } from "@/components/UserAvatar";
import { useAuth } from "@/hooks/use-auth";
import { clapForPost } from "@/lib/actions";
import { cn } from "@/lib/utils";
import { useToast } from "@/hooks/use-toast";

interface ClapBubble {
  id: number;
  count: number;
}

interface PostCardProps {
  post: Post;
}

export function PostCard({ post }: PostCardProps) {
  const { user } = useAuth();
  const { toast } = useToast();
  
  const [displayLikes, setDisplayLikes] = useState(post.likes);
  const [localClaps, setLocalClaps] = useState(0);
  const [clapBubbles, setClapBubbles] = useState<ClapBubble[]>([]);
  const [isPending, startTransition] = useTransition();

  const clapTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  const clapButtonRef = useRef<HTMLButtonElement>(null);

  const MAX_CLAPS = 50;

  const handleClap = () => {
    if (!user) {
       toast({ variant: "destructive", title: "You must be logged in to clap." });
       return;
    }
    
    if (localClaps >= MAX_CLAPS) {
      toast({ title: "You've reached the maximum claps for this post!" });
      return;
    }
    
    const newClaps = localClaps + 1;
    setLocalClaps(newClaps);
    setDisplayLikes(prev => prev + 1);

    // Show bubble
    setClapBubbles(prev => [...prev, { id: Date.now(), count: newClaps }]);

    if (clapTimeoutRef.current) {
      clearTimeout(clapTimeoutRef.current);
    }
    
    clapTimeoutRef.current = setTimeout(() => {
      if (localClaps > 0) {
        saveClaps(localClaps);
        setLocalClaps(0);
      }
    }, 1500); // Send to server after 1.5s of inactivity
  };
  
  const saveClaps = (clapsToSend: number) => {
    startTransition(async () => {
      const result = await clapForPost(post.id, clapsToSend, user!.uid);
      if (!result.success) {
        // Revert optimistic update on failure
        setDisplayLikes((prev) => prev - clapsToSend);
        toast({
          variant: "destructive",
          title: "Failed to save claps.",
          description: result.error,
        });
      }
    });
  };

  useEffect(() => {
    return () => {
      if (clapTimeoutRef.current) {
        clearTimeout(clapTimeoutRef.current);
      }
    };
  }, []);

  return (
    <div className="rounded-2xl border border-border/40 bg-card/95 p-1 backdrop-blur supports-[backdrop-filter]:bg-card/60 shadow-lg transition-all hover:shadow-xl">
      <div className="flex items-center p-4">
        <UserAvatar name={post.authorName} imageUrl={post.authorPhotoURL} className="h-10 w-10" />
        <p className="font-semibold text-sm ml-4">{post.authorName}</p>
        <Button variant="ghost" size="icon" className="ml-auto h-8 w-8">
            <MoreHorizontal className="h-4 w-4" />
        </Button>
      </div>

      {post.imageUrl && (
        <div className="relative aspect-square w-full my-2">
          <Image
            src={post.imageUrl}
            alt="Post image"
            fill
            className="object-cover rounded-lg"
            sizes="(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 33vw"
            data-ai-hint="social media post"
          />
        </div>
      )}

      <div className="px-4 py-2 space-y-3">
        <div>
          <span className="font-semibold text-sm mr-2">{post.authorName}</span>
          <span className="text-sm text-foreground/80">{post.content}</span>
        </div>

        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-2">
            <div className="relative">
              <Button ref={clapButtonRef} variant="ghost" size="icon" onClick={handleClap} className="relative z-10">
                <Heart className={cn("h-6 w-6", localClaps > 0 && "text-accent fill-accent")} />
              </Button>
              {clapBubbles.map(bubble => (
                <div 
                  key={bubble.id} 
                  className="absolute bottom-full left-1/2 -translate-x-1/2 flex items-center justify-center w-8 h-8 rounded-full bg-accent text-accent-foreground font-bold text-xs pointer-events-none animate-clap-bubble"
                  onAnimationEnd={() => setClapBubbles(prev => prev.filter(b => b.id !== bubble.id))}
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
          <p className="text-sm font-semibold">{displayLikes.toLocaleString()} likes</p>
        </div>
        
        <p className="text-xs text-muted-foreground uppercase pt-2">
          {formatDistanceToNow(post.createdAt.toDate(), { addSuffix: true })}
        </p>
      </div>
    </div>
  );
}
