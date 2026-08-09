"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "@/components/providers/auth-provider";
import { Spinner } from "@/components/ui/spinner";

export default function Home() {
  const { status } = useAuth();
  const router = useRouter();

  useEffect(() => {
    if (status === "authenticated") router.replace("/drive");
    if (status === "unauthenticated") router.replace("/login");
  }, [status, router]);

  return (
    <div className="flex min-h-screen flex-1 items-center justify-center">
      <Spinner className="h-6 w-6" />
    </div>
  );
}
