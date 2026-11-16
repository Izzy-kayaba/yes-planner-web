import type { Metadata } from "next";

export const metadata: Metadata = { title: "Privacy Policy" };

export default function PrivacyPolicyPage() {
  return (
    <main className="mx-auto max-w-3xl px-6 py-16 text-slate-800">
      <h1 className="mb-6 text-4xl font-bold">Yes Planner Privacy Policy</h1>
      <p className="mb-8 text-sm">Last updated: 16 November 2026</p>
      <section className="space-y-5 leading-7">
        <p>
          Yes Planner provides wedding planning tools, accounts, invitations, and vendor services.
          We collect information needed to provide those services, such as account details,
          wedding-planning content, and authentication information.
        </p>
        <h2 className="pt-4 text-2xl font-bold">Social sign-in</h2>
        <p>
          If you choose Google or Facebook sign-in, we receive the provider identity needed to
          authenticate you and, where available, your name and email address. We use this only to
          create or access your Yes Planner account. We do not sell this information.
        </p>
        <h2 className="pt-4 text-2xl font-bold">Your choices</h2>
        <p>
          You may request access, correction, or deletion of your personal information by emailing
          <a className="ml-1 underline" href="mailto:yessplanner@gmail.com">yessplanner@gmail.com</a>.
          Account deletion requests are handled as described in our data-deletion instructions.
        </p>
        <h2 className="pt-4 text-2xl font-bold">Contact</h2>
        <p>Questions about privacy can be sent to yessplanner@gmail.com.</p>
      </section>
    </main>
  );
}
