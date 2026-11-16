import type { Metadata } from "next";

export const metadata: Metadata = { title: "Terms of Service" };

export default function TermsOfServicePage() {
  return (
    <main className="mx-auto max-w-3xl px-6 py-16 text-slate-800">
      <h1 className="mb-6 text-4xl font-bold">Yes Planner Terms of Service</h1>
      <p className="mb-8 text-sm">Last updated: 16 November 2026</p>
      <section className="space-y-5 leading-7">
        <p>
          Yes Planner helps couples and wedding service providers organise wedding information,
          tasks, documents, invitations, and related communications.
        </p>
        <h2 className="pt-4 text-2xl font-bold">Accounts</h2>
        <p>
          You are responsible for keeping your account information accurate and protecting access
          to your account. You must not use the service unlawfully or interfere with another
          person’s data.
        </p>
        <h2 className="pt-4 text-2xl font-bold">Service changes</h2>
        <p>
          We may improve, modify, or discontinue features. We will take reasonable steps to
          protect stored account data and communicate material changes where appropriate.
        </p>
        <h2 className="pt-4 text-2xl font-bold">Contact</h2>
        <p>Questions about these terms can be sent to yessplanner@gmail.com.</p>
      </section>
    </main>
  );
}
