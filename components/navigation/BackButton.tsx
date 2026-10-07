"use client";

import { ArrowLeft } from "lucide-react";
import { useRouter } from "next/navigation";
import { useLanguage } from "@/components/providers/LanguageProvider";

export function BackButton({ fallback }: { fallback: string }) {
  const router = useRouter();
  const { text } = useLanguage();
  return (
    <button
      className="auth-home-button auth-home-mobile-static"
      type="button"
      aria-label={text("Back")}
      title={text("Back")}
      onClick={() => (window.history.length > 1 ? router.back() : router.push(fallback))}
    >
      <ArrowLeft size={19} aria-hidden="true" />
    </button>
  );
}
