"use client";

import { useEffect, useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import { collection, query, where, onSnapshot } from "firebase/firestore";
import { db } from "@/lib/firebase";
import { useAuth } from "@/hooks/use-auth";
import { addComment } from "@/lib/actions";
import type { Comment as CommentType } from "@/lib/types";
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetDescription,
  SheetFooter,
} from "@/components/ui/sheet";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { ScrollArea } from "@/components/ui/scroll-area";
import { UserAvatar } from "@/components/UserAvatar";
import { formatDistanceToNow } from "date-fns";
import { useToast } from "@/hooks/use-toast";
import { Form, FormControl, FormField, FormItem, FormMessage } from "./ui/form";
import { Skeleton } from "./ui/skeleton";
import { Separator } from "./ui/separator";

interface CommentSheetProps {
  isOpen: boolean;
  onOpenChange: (open: boolean) => void;
  postId: string;
  postAuthorName: string;
}

const formSchema = z.object({
  content: z.string().min(1, "Comment cannot be empty.").max(1000),
});

export function CommentSheet({ isOpen, onOpenChange, postId, postAuthorName }: CommentSheetProps) {
  const { user } = useAuth();
  const { toast } = useToast();
  const [comments, setComments] = useState<CommentType[]>([]);
  const [loading, setLoading] = useState(true);

  const form = useForm<z.infer<typeof formSchema>>({
    resolver: zodResolver(formSchema),
    defaultValues: { content: "" },
  });

  useEffect(() => {
    if (!isOpen || !postId) return;

    setLoading(true);
    const q = query(
      collection(db, "comments"),
      where("postId", "==", postId)
    );
    
    const unsubscribe = onSnapshot(q, (querySnapshot) => {
      const commentsData: CommentType[] = [];
      querySnapshot.forEach((doc) => {
        commentsData.push({ id: doc.id, ...doc.data() } as CommentType);
      });

      // Sort comments on the client-side to avoid needing a composite index
      commentsData.sort((a, b) => {
        const aTime = a.createdAt?.toDate().getTime() || 0;
        const bTime = b.createdAt?.toDate().getTime() || 0;
        return aTime - bTime;
      });

      setComments(commentsData);
      setLoading(false);
    }, (error) => {
        console.error("Error fetching comments: ", error);
        setLoading(false);
    });

    return () => unsubscribe();
  }, [postId, isOpen]);

  async function onSubmit(values: z.infer<typeof formSchema>) {
    if (!user) {
      toast({ variant: "destructive", title: "You must be logged in to comment." });
      return;
    }
    
    const result = await addComment({ ...values, postId }, user.uid);

    if (result.success) {
      form.reset();
    } else {
      toast({
        variant: "destructive",
        title: "Failed to post comment.",
        description: result.error,
      });
    }
  }

  return (
    <Sheet open={isOpen} onOpenChange={onOpenChange}>
      <SheetContent className="flex flex-col">
        <SheetHeader>
          <SheetTitle>Comments</SheetTitle>
          <SheetDescription>
            Comments on {postAuthorName}'s post.
          </SheetDescription>
        </SheetHeader>
        <Separator />
        <ScrollArea className="flex-1 pr-4 -mr-6">
          <div className="space-y-4 py-4">
            {loading ? (
              <div className="space-y-4">
                <Skeleton className="h-16 w-full" />
                <Skeleton className="h-16 w-full" />
                <Skeleton className="h-16 w-full" />
              </div>
            ) : comments.length > 0 ? (
              comments.map((comment) => (
                <div key={comment.id} className="flex gap-3">
                  <UserAvatar name={comment.authorName} imageUrl={comment.authorPhotoURL} className="h-8 w-8 mt-1" />
                  <div className="flex-1">
                    <div className="text-sm">
                      <span className="font-semibold">{comment.authorName}</span>
                      <p className="inline text-foreground/90 ml-2">{comment.content}</p>
                    </div>
                    <p className="text-xs text-muted-foreground mt-1">
                      {comment.createdAt && formatDistanceToNow(comment.createdAt.toDate(), { addSuffix: true })}
                    </p>
                  </div>
                </div>
              ))
            ) : (
              <p className="text-center text-muted-foreground py-8">No comments yet. Be the first!</p>
            )}
          </div>
        </ScrollArea>
        {user && (
          <>
            <Separator />
            <SheetFooter className="py-4">
              <Form {...form}>
                <form onSubmit={form.handleSubmit(onSubmit)} className="flex w-full items-start gap-2">
                  <FormField
                    control={form.control}
                    name="content"
                    render={({ field }) => (
                      <FormItem className="flex-1">
                        <FormControl>
                          <Input placeholder="Add a comment..." {...field} autoComplete="off"/>
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  <Button type="submit" disabled={form.formState.isSubmitting}>
                    {form.formState.isSubmitting ? "..." : "Send"}
                  </Button>
                </form>
              </Form>
            </SheetFooter>
          </>
        )}
      </SheetContent>
    </Sheet>
  );
}
