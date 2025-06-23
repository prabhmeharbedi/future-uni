"use client";

import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import type { User } from "firebase/auth";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormMessage,
} from "@/components/ui/form";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { useToast } from "@/hooks/use-toast";
import { createPost } from "@/lib/actions";
import { useState } from "react";

const formSchema = z.object({
  content: z.string().min(1, "Post cannot be empty.").max(2000, "Post cannot exceed 2000 characters."),
  imageUrl: z.string().url("Please enter a valid URL.").optional().or(z.literal('')),
});

interface CreatePostFormProps {
  user: User;
}

export function CreatePostForm({ user }: CreatePostFormProps) {
  const { toast } = useToast();
  const [isSubmitting, setIsSubmitting] = useState(false);

  const form = useForm<z.infer<typeof formSchema>>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      content: "",
      imageUrl: "",
    },
  });

  async function onSubmit(values: z.infer<typeof formSchema>) {
    setIsSubmitting(true);
    const result = await createPost(values);

    if (result.success) {
      toast({ title: "Post created!", description: "Your post is now live." });
      form.reset();
    } else {
      toast({
        variant: "destructive",
        title: "Failed to create post.",
        description: result.error,
      });
    }
    setIsSubmitting(false);
  }

  return (
    <Card className="mb-6">
      <CardHeader>
        <CardTitle>Create a new post</CardTitle>
      </CardHeader>
      <Form {...form}>
        <form onSubmit={form.handleSubmit(onSubmit)}>
          <CardContent className="space-y-4">
            <FormField
              control={form.control}
              name="content"
              render={({ field }) => (
                <FormItem>
                  <FormControl>
                    <Textarea
                      placeholder="What's on your mind?"
                      className="resize-none"
                      {...field}
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <FormField
              control={form.control}
              name="imageUrl"
              render={({ field }) => (
                <FormItem>
                  <FormControl>
                    <Input placeholder="Image URL (optional)" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
          </CardContent>
          <CardFooter className="flex justify-end">
            <Button type="submit" disabled={isSubmitting}>
              {isSubmitting ? "Posting..." : "Post"}
            </Button>
          </CardFooter>
        </form>
      </Form>
    </Card>
  );
}
