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
import { Cpu, Fingerprint, Network, MoveRight } from "lucide-react";

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
    <Card className="p-6 text-center flex flex-col items-center bg-card/50 backdrop-blur-sm border-primary/20 hover:border-primary transition-colors duration-300 shadow-lg">
      <div className="mb-4 bg-primary/10 text-primary p-4 rounded-full border border-primary/30">{icon}</div>
      <h3 className="text-xl font-semibold mb-2">{title}</h3>
      <p className="text-muted-foreground">{description}</p>
    </Card>
  );
}

function LandingPage() {
  return (
    <main className="container mx-auto px-4 py-8 md:py-16">
      <div className="text-center flex flex-col items-center py-16 md:py-24">
        <h1 className="text-5xl md:text-7xl font-bold tracking-tight text-foreground">
          SYSTEM ONLINE.
        </h1>
        <p className="mt-6 max-w-2xl text-lg md:text-xl text-muted-foreground font-mono">
          A raw social network for decentralized minds. Transmit data, earn reputation, and interface with the grid.
        </p>
        <div className="mt-8 flex flex-col sm:flex-row gap-4">
          <Button asChild size="lg">
            <Link href="/signup">
              Jack In <MoveRight className="ml-2" />
            </Link>
          </Button>
          <Button
            asChild
            variant="outline"
            size="lg"
          >
            <Link href="/login">Authenticate</Link>
          </Button>
        </div>
      </div>

      <div className="relative my-16 md:my-24">
        <Card className="p-4 md:p-6 shadow-2xl bg-card/50 backdrop-blur-lg border-primary/20">
          <div className="aspect-video w-full relative">
            <Image
              src="https://placehold.co/1200x675.png"
              alt="Circuit App Showcase"
              fill
              className="rounded-md object-cover"
              data-ai-hint="robotic user interface"
            />
          </div>
        </Card>
      </div>

      <div className="my-16 md:my-24">
        <div className="text-center mb-12">
          <h2 className="text-4xl md:text-5xl font-bold tracking-tight text-foreground">
            A Terminal for Your Consciousness
          </h2>
          <p className="mt-4 max-w-2xl mx-auto text-lg text-muted-foreground font-mono">
            Directives for interaction within the system.
          </p>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
          <FeatureCard
            icon={<Cpu className="w-8 h-8" />}
            title="Transmit Data"
            description="Broadcast text and visual data streams. Authenticity is monitored. Falsehoods will be purged."
          />
          <FeatureCard
            icon={<Fingerprint className="w-8 h-8" />}
            title="Gain Reputation"
            description="Your value is quantified. Earn Aura Points from the network. Increase your system clearance."
          />
          <FeatureCard
            icon={<Network className="w-8 h-8" />}
            title="Interface & Evolve"
            description="Connect to a network of distributed nodes. Absorb new protocols. Evolve your output."
          />
        </div>
      </div>

      <footer className="text-center py-8 border-t mt-16 md:mt-24">
        <Link
          href="/"
          className="text-2xl font-bold tracking-tight text-primary"
        >
          Circuit
        </Link>
        <p className="text-sm text-muted-foreground mt-2 font-mono">
          © {new Date().getFullYear()} Circuit Systems. All rights reserved.
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
        <Skeleton className="h-96 w-full rounded-lg" />
        <Skeleton className="h-96 w-full rounded-lg" />
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
        <Skeleton className="h-96 w-full max-w-2xl rounded-lg" />
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
