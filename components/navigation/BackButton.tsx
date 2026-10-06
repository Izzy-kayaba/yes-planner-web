"use client";

import { ArrowLeft } from "lucide-react";
import { useRouter } from "next/navigation";
import { useLanguage } from "@/components/providers/LanguageProvider";

export function BackButton({ fallback }: { fallback: string }) {
  const router = useRouter();
  const { text } = useLanguage();
  return (
    <button
      className="button button-ghost w-fit"
      type="button"
      onClick={() => (window.history.length > 1 ? router.back() : router.push(fallback))}
    >
      <ArrowLeft size={17} aria-hidden="true" /> {text("Back")}
    </button>
  );
}
