import type { PlatformRole } from "@/lib/auth/roles";

export type WeddingProfile = {
  weddingKey: string;
  partnerName: string;
  displayName: string;
  weddingDate: string;
  venue: string;
  location: string;
  budgetMinor: number;
  budgetRangeKey?: string;
  estimatedGuests: number;
  guestRangeKey?: string;
  weddingStyle: string;
  planningNotes: string;
};

export type DashboardTask = {
  id: string;
  title: string;
  category: string;
  due: string;
  assignee: string;
  priority: string;
  complete: boolean;
};

export type DashboardData = {
  user: {
    firstName: string;
    name: string;
    role: PlatformRole;
  };
  wedding: WeddingProfile | null;
  counts: {
    guests: number;
    attendingGuests: number;
    tasks: number;
    completedTasks: number;
    vendors: number;
    confirmedVendors: number;
    unreadMessages: number;
  };
  tasks: DashboardTask[];
};
