import type { ReactNode } from "react";
import Link from "next/link";
import { Brand } from "@/components/ui/Brand";
import { getTextTranslator } from "@/lib/i18n-server";
import { ArrowLeft } from "lucide-react";

export default async function AuthLayout({ children }: { children: ReactNode }) {
  const text = await getTextTranslator();

  return (
    <main className="auth-layout">
      <section className="auth-story">
        <nav>
          <Brand />
          <Link className="auth-home-button" href="/" aria-label={text("Back to home")}>
            <ArrowLeft size={19} />
          </Link>
        </nav>
        <div className="auth-story-copy">
          <p className="eyebrow light">{text("Plan beautifully together")}</p>
          <h1>
            {text("Every detail.")}
            <br />
            {text("One shared vision.")}
          </h1>
          <p>
            {text(
              "Bring your people, plans and promises together in a workspace designed for the joy of the journey.",
            )}
          </p>
        </div>
        <div className="auth-quote">
          <div className="quote-avatar">TM</div>
          <blockquote>
            {text("Yes Planner gave us our evenings back. We could finally enjoy being engaged.")}
          </blockquote>
          <p>{text("Thandi & Michael · Cape Town")}</p>
        </div>
        <div className="auth-orbit orbit-one" />
        <div className="auth-orbit orbit-two" />
      </section>
      <section className="auth-panel">
        {/* <Link
          className="auth-home-button auth-home-mobile"
          href="/"
          aria-label={text("Back to home")}
        >
          <ArrowLeft size={19} />
        </Link> */}
        {children}
      </section>
    </main>
  );
}
