"use client";

import { useState, useEffect, useRef } from "react";
import Image from "next/image";
import { formatDistanceToNow } from "date-fns";
import type { Post } from "@/lib/types";
import {
  Card,
  CardContent,
  CardFooter,
  CardHeader,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Hand } from "lucide-react";
import { UserAvatar } from "@/components/UserAvatar";
import { useAuth } from "@/hooks/use-auth";
import { clapForPost } from "@/lib/actions";
import { cn } from "@/lib/utils";

const MAX_CLAPS = 50;
const CLAP_DEBOUNCE_MS = 1000;

interface PostCardProps {
  post: Post;
}

export function PostCard({ post }: PostCardProps) {
  const { user } = useAuth();
  
  const [displayLikes, setDisplayLikes] = useState(post.likes);
  const [userClapCount, setUserClapCount] = useState(0);
  const pendingClapsRef = useRef(0);
  const debounceTimerRef = useRef<NodeJS.Timeout | null>(null);
  const [clapBubbleCount, setClapBubbleCount] = useState(0);
  const [showClapBubble, setShowClapBubble] = useState(false);
  const bubbleTimerRef = useRef<NodeJS.Timeout | null>(null);

  useEffect(() => {
    return () => {
      if (debounceTimerRef.current) {
        clearTimeout(debounceTimerRef.current);
      }
      if (bubbleTimerRef.current) {
        clearTimeout(bubbleTimerRef.current);
      }
    };
  }, []);

  const sendClapsToServer = async () => {
    if (pendingClapsRef.current === 0) return;

    const clapsToSend = pendingClapsRef.current;
    pendingClapsRef.current = 0; 

    const result = await clapForPost(post.id, clapsToSend);

    if (!result.success) {
      setDisplayLikes((prev) => prev - clapsToSend);
      console.error("Failed to save claps:", result.error);
    }
  };

  const handleClap = () => {
    if (!user || userClapCount >= MAX_CLAPS) return;

    const newClapCount = userClapCount + 1;
    setUserClapCount(newClapCount);
    setDisplayLikes((prev) => prev + 1);
    pendingClapsRef.current += 1;
    
    setClapBubbleCount(prev => prev + 1);
    setShowClapBubble(true);
    if (bubbleTimerRef.current) clearTimeout(bubbleTimerRef.current);
    bubbleTimerRef.current = setTimeout(() => {
        setShowClapBubble(false);
        setClapBubbleCount(0);
    }, 1000);

    if (debounceTimerRef.current) {
      clearTimeout(debounceTimerRef.current);
    }
    debounceTimerRef.current = setTimeout(sendClapsToServer, CLAP_DEBOUNCE_MS);
  };
  
  const hasClapped = userClapCount > 0;

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
          <Hand className="h-5 w-5" />
          <span>{displayLikes}</span>
        </div>
        <div className="relative">
             <Button onClick={handleClap} disabled={!user || userClapCount >= MAX_CLAPS} variant="outline" size="sm" className="relative transition-transform duration-100 ease-out active:scale-95">
                <Hand className={cn("mr-2 h-4 w-4", hasClapped && 'text-primary fill-primary')} />
                 Clap
            </Button>
            {showClapBubble && (
                 <div className="absolute -top-8 left-1/2 -translate-x-1/2 w-10 h-10 flex items-center justify-center bg-primary text-primary-foreground rounded-full text-sm font-bold pointer-events-none animate-in fade-in zoom-in-50">
                    +{clapBubbleCount}
                </div>
            )}
        </div>
      </CardFooter>
    </Card>
  );
}
