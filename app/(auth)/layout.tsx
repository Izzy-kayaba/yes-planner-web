import type { ReactNode } from "react";
import Link from "next/link";
import { Brand } from "@/components/ui/Brand";

export default function AuthLayout({ children }: { children: ReactNode }) {
  return (
    <main className="auth-layout">
      <section className="auth-story">
        <nav>
          <Brand />
          <Link href="/">Back to home</Link>
        </nav>
        <div className="auth-story-copy">
          <p className="eyebrow light">Plan beautifully together</p>
          <h1>
            Every detail.
            <br />
            One shared vision.
          </h1>
          <p>
            Bring your people, plans and promises together in a workspace designed for the joy of
            the journey.
          </p>
        </div>
        <div className="auth-quote">
          <div className="quote-avatar">TM</div>
          <blockquote>
            “Vow Planner gave us our evenings back. We could finally enjoy being engaged.”
          </blockquote>
          <p>Thandi & Michael · Cape Town</p>
        </div>
        <div className="auth-orbit orbit-one" />
        <div className="auth-orbit orbit-two" />
      </section>
      <section className="auth-panel">{children}</section>
    </main>
  );
}
