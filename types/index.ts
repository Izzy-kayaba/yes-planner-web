export type WeddingAccess = "Owner" | "FullManager" | "Vendor" | "Guest";

export type StatusTone = "rose" | "sage" | "gold" | "blue" | "neutral";

export interface WeddingSummary {
  id: string;
  title: string;
  partnerNames: string;
  date: string;
  weddingDateIso: string;
  venue: string;
  city: string;
  daysRemaining: number;
  progress: number;
  access: WeddingAccess;
}

export interface NavigationItem {
  label: string;
  href: string;
  icon: string;
  badge?: string;
}

export interface Guest {
  id: string | number;
  name: string;
  group: string;
  email?: string;
  phoneNumber: string;
  isCouple: boolean;
  hasChildren: boolean;
  status: "Attending" | "Pending" | "Declined";
  meal: string;
  table: string;
}

export interface WeddingTask {
  id: string | number;
  title: string;
  category: string;
  due: string;
  assignee: string;
  priority: "High" | "Medium" | "Low";
  complete: boolean;
}
