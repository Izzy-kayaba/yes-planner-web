import type { Metadata } from "next";

export const metadata: Metadata = { title: "Data Deletion Instructions" };

export default function DataDeletionPage() {
  return (
    <main className="mx-auto max-w-3xl px-6 py-16 text-slate-800">
      <h1 className="mb-6 text-4xl font-bold">Yes Planner Data Deletion Instructions</h1>
      <p className="mb-8 text-sm">Last updated: 16 November 2026</p>
      <section className="space-y-5 leading-7">
        <p>
          To request deletion of your Yes Planner account and associated personal data, email
          <a className="ml-1 underline" href="mailto:yessplanner@gmail.com?subject=Yes%20Planner%20data%20deletion">yessplanner@gmail.com</a>
          from the address associated with your account. Include “Yes Planner data deletion” in
          the subject.
        </p>
        <p>
          We will verify the request, remove or anonymise account-linked data where required, and
          reply with confirmation or an explanation of any information that must be retained by
          law or for legitimate security and financial-record purposes.
        </p>
        <p>
          Removing the Yes Planner app from Facebook does not itself delete the Yes Planner
          account; use the request process above.
        </p>
      </section>
    </main>
  );
}
