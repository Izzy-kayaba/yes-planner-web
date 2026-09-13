"use client";

import { Heart } from "lucide-react";
import type { ComponentType } from "react";
import { useLanguage } from "@/components/providers/LanguageProvider";
import { PageHeader } from "@/components/ui/PageHeader";
import type { TranslationKey } from "@/lib/i18n";
import { BookingsSection } from "@/features/weddings/sections/BookingsSection";
import { BudgetSection } from "@/features/weddings/sections/BudgetSection";
import { DocumentsSection } from "@/features/weddings/sections/DocumentsSection";
import { FoodSection } from "@/features/weddings/sections/FoodSection";
import { GuestsSection } from "@/features/weddings/sections/GuestsSection";
import { MessagesSection } from "@/features/weddings/sections/MessagesSection";
import { NotesSection } from "@/features/weddings/sections/NotesSection";
import { PaymentsSection } from "@/features/weddings/sections/PaymentsSection";
import { ReportsSection } from "@/features/weddings/sections/ReportsSection";
import { SeatingSection } from "@/features/weddings/sections/SeatingSection";
import { TasksSection } from "@/features/weddings/sections/TasksSection";
import { TimelineSection } from "@/features/weddings/sections/TimelineSection";
import { VendorsSection } from "@/features/weddings/sections/VendorsSection";

const titles: Record<string, [TranslationKey, TranslationKey]> = {
  guests: ["wedding.guests", "wedding.guestsDescription"],
  budget: ["wedding.budget", "wedding.budgetDescription"],
  tasks: ["wedding.tasks", "wedding.tasksDescription"],
  vendors: ["wedding.vendors", "wedding.vendorsDescription"],
  timeline: ["wedding.timeline", "wedding.timelineDescription"],
  seating: ["wedding.seating", "wedding.seatingDescription"],
  "food-drinks": ["wedding.food", "wedding.foodDescription"],
  documents: ["wedding.documents", "wedding.documentsDescription"],
  bookings: ["wedding.bookings", "wedding.bookingsDescription"],
  payments: ["wedding.payments", "wedding.paymentsDescription"],
  messages: ["wedding.messages", "wedding.messagesDescription"],
  notes: ["wedding.notes", "wedding.notesDescription"],
  reports: ["wedding.reports", "wedding.reportsDescription"],
};

const sections: Record<string, ComponentType> = {
  guests: GuestsSection,
  budget: BudgetSection,
  tasks: TasksSection,
  vendors: VendorsSection,
  timeline: TimelineSection,
  seating: SeatingSection,
  "food-drinks": FoodSection,
  documents: DocumentsSection,
  bookings: BookingsSection,
  payments: PaymentsSection,
  messages: MessagesSection,
  notes: NotesSection,
  reports: ReportsSection,
};

export function WeddingSection({ section }: { section: string }) {
  const { t } = useLanguage();
  const heading = titles[section];
  const Section = sections[section];

  return (
    <div className="section-stack">
      <PageHeader
        eyebrow="Amara & Sipho"
        title={heading ? t(heading[0]) : t("nav.workspace")}
        description={heading ? t(heading[1]) : t("dashboard.intro")}
      />
      {Section ? (
        <Section />
      ) : (
        <div className="panel empty-state">
          <Heart size={30} />
          <h3>This space is ready for your plans</h3>
          <p>Choose a wedding module above to continue.</p>
        </div>
      )}
    </div>
  );
}
