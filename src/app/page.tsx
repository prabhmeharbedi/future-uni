"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import Image from "next/image";
import { collection, query, orderBy, onSnapshot } from "firebase/firestore";
import { db } from "@/lib/firebase";
import { useAuth } from "@/hooks/use-auth";
import type { Post } from "@/lib/types";
import { CreatePostForm } from "@/components/CreatePostForm";
import { PostCard } from "@/components/PostCard";
import { Skeleton } from "@/components/ui/skeleton";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Lightbulb, Users, Award, MoveRight } from "lucide-react";

function FeatureCard({
  icon,
  title,
  description,
}: {
  icon: React.ReactNode;
  title: string;
  description: string;
}) {
  return (
    <Card className="rounded-2xl border-border/40 bg-card/60 p-6 backdrop-blur-lg shadow-lg text-center flex flex-col items-center hover:border-accent transition-colors duration-300">
      <div className="mb-4 bg-muted p-4 rounded-full">{icon}</div>
      <h3 className="text-xl font-semibold mb-2">{title}</h3>
      <p className="text-foreground/80">{description}</p>
    </Card>
  );
}

function LandingPage() {
  return (
    <main className="container mx-auto px-4 py-8 md:py-16 text-foreground">
      <div className="text-center flex flex-col items-center py-16 md:py-24">
        <h1 className="text-5xl md:text-7xl font-bold tracking-tight bg-gradient-to-br from-pink-400 via-blue-400 to-indigo-500 text-transparent bg-clip-text">
          Unleash Your Aura.
        </h1>
        <p className="mt-6 max-w-2xl text-lg md:text-xl text-foreground/80">
          A new social universe where creativity glows. Share your moments,
          collect Aura Points, and connect with a community that shines.
        </p>
        <div className="mt-8 flex flex-col sm:flex-row gap-4">
          <Button asChild size="lg" className="rounded-full text-lg px-8 py-6">
            <Link href="/signup">
              Join Now <MoveRight className="ml-2" />
            </Link>
          </Button>
          <Button
            asChild
            variant="outline"
            size="lg"
            className="rounded-full text-lg px-8 py-6 border-2 bg-transparent"
          >
            <Link href="/login">Log In</Link>
          </Button>
        </div>
      </div>

      <div className="relative my-16 md:my-24">
        <div className="absolute inset-0 bg-gradient-to-tr from-accent/30 to-blue-500/30 blur-3xl rounded-full -z-10"></div>
        <Card className="rounded-2xl border-border/40 bg-card/60 p-4 md:p-6 backdrop-blur-xl shadow-2xl">
          <div className="aspect-video w-full relative">
            <Image
              src="https://placehold.co/1200x675.png"
              alt="Aura App Showcase"
              fill
              className="rounded-lg object-cover"
              data-ai-hint="social media app interface"
            />
          </div>
        </Card>
      </div>

      <div className="my-16 md:my-24">
        <div className="text-center mb-12">
          <h2 className="text-4xl md:text-5xl font-bold tracking-tight">
            A Canvas for Your Creativity
          </h2>
          <p className="mt-4 max-w-2xl mx-auto text-lg text-foreground/80">
            Everything you need to share your unique vibe.
          </p>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
          <FeatureCard
            icon={<Lightbulb className="w-8 h-8 text-accent" />}
            title="Express Freely"
            description="Share your thoughts, photos, and stories in a space that values authenticity and creative expression."
          />
          <FeatureCard
            icon={<Award className="w-8 h-8 text-accent" />}
            title="Collect Aura Points"
            description="Your creativity is valuable. Earn Aura Points from the community and see your influence grow."
          />
          <FeatureCard
            icon={<Users className="w-8 h-8 text-accent" />}
            title="Connect & Inspire"
            description="Join a vibrant community of creators and tastemakers. Discover new ideas and inspire others."
          />
        </div>
      </div>

      <footer className="text-center py-8 border-t border-border/40 mt-16 md:mt-24">
        <Link
          href="/"
          className="text-2xl font-bold tracking-tight bg-gradient-to-r from-pink-400 to-blue-400 text-transparent bg-clip-text"
        >
          Aura
        </Link>
        <p className="text-sm text-muted-foreground mt-2">
          © {new Date().getFullYear()} Aura. All rights reserved.
        </p>
      </footer>
    </main>
  );
}

function FeedContent() {
  const [posts, setPosts] = useState<Post[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const q = query(collection(db, "posts"), orderBy("createdAt", "desc"));
    const unsubscribe = onSnapshot(q, (querySnapshot) => {
      const postsData: Post[] = [];
      querySnapshot.forEach((doc) => {
        postsData.push({ id: doc.id, ...doc.data() } as Post);
      });
      setPosts(postsData);
      setLoading(false);
    });

    return () => unsubscribe();
  }, []);

  if (loading) {
    return (
      <div className="space-y-8 mt-6">
        <Skeleton className="h-96 w-full rounded-2xl" />
        <Skeleton className="h-96 w-full rounded-2xl" />
      </div>
    );
  }

  return (
    <div className="mt-6 space-y-8">
      {posts.map((post) => (
        <PostCard key={post.id} post={post} />
      ))}
    </div>
  );
}

export default function Home() {
  const { user, loading: authLoading } = useAuth();

  if (authLoading) {
    return (
      <main className="flex h-[calc(100vh-4rem)] items-center justify-center">
        <Skeleton className="h-96 w-full max-w-2xl rounded-2xl" />
      </main>
    );
  }

  if (user) {
    return (
      <main className="container mx-auto max-w-2xl py-8 px-4">
        <CreatePostForm user={user} />
        <FeedContent />
      </main>
    );
  }

  return <LandingPage />;
}
