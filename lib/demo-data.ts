import { differenceInCalendarDays, parseISO, startOfToday } from "date-fns";
import type { Guest, WeddingSummary, WeddingTask } from "@/types";

const weddingDateIso = "2026-10-18";

// Demo data keeps every proposed screen reviewable while the matching API modules are built.
export const currentWedding: WeddingSummary = {
  id: "amara-sipho",
  title: "Our celebration",
  partnerNames: "Amara & Sipho",
  date: "18 October 2026",
  weddingDateIso,
  venue: "Shepstone Gardens",
  city: "Johannesburg",
  daysRemaining: Math.max(0, differenceInCalendarDays(parseISO(weddingDateIso), startOfToday())),
  progress: 68,
  access: "Owner",
};

export const weddingStats = [
  { label: "Budget remaining", value: "R 184,500", detail: "of R 520,000", tone: "rose" },
  { label: "Guests attending", value: "118", detail: "of 164 invited", tone: "sage" },
  { label: "Tasks completed", value: "42", detail: "14 still open", tone: "gold" },
  { label: "Vendors confirmed", value: "8", detail: "3 awaiting response", tone: "blue" },
] as const;

export const guests: Guest[] = [
  {
    id: 1,
    name: "Naledi Molefe",
    group: "Bride's family",
    email: "naledi@example.com",
    status: "Attending",
    meal: "Vegetarian",
    table: "Table 04",
  },
  {
    id: 2,
    name: "Daniel Khumalo",
    group: "Groom's friends",
    email: "daniel@example.com",
    status: "Pending",
    meal: "Not selected",
    table: "Unassigned",
  },
  {
    id: 3,
    name: "Zoe Williams",
    group: "Friends",
    email: "zoe@example.com",
    status: "Attending",
    meal: "Standard",
    table: "Table 08",
  },
  {
    id: 4,
    name: "Mandla Dube",
    group: "Groom's family",
    email: "mandla@example.com",
    status: "Declined",
    meal: "—",
    table: "—",
  },
  {
    id: 5,
    name: "Aisha Patel",
    group: "Friends",
    email: "aisha@example.com",
    status: "Attending",
    meal: "Halaal",
    table: "Table 08",
  },
];

export const tasks: WeddingTask[] = [
  {
    id: 1,
    title: "Approve the final floral concept",
    category: "Décor",
    due: "Today",
    assignee: "Amara",
    priority: "High",
    complete: false,
  },
  {
    id: 2,
    title: "Confirm guest transport schedule",
    category: "Logistics",
    due: "16 Sep",
    assignee: "Lerato",
    priority: "Medium",
    complete: false,
  },
  {
    id: 3,
    title: "Send menu choices to caterer",
    category: "Food & drinks",
    due: "18 Sep",
    assignee: "Sipho",
    priority: "High",
    complete: false,
  },
  {
    id: 4,
    title: "Review ceremony music shortlist",
    category: "Entertainment",
    due: "20 Sep",
    assignee: "Amara",
    priority: "Low",
    complete: true,
  },
  {
    id: 5,
    title: "Pay venue balance",
    category: "Payments",
    due: "24 Sep",
    assignee: "Sipho",
    priority: "High",
    complete: false,
  },
];

export const upcomingEvents = [
  {
    day: "15",
    month: "SEP",
    title: "Final menu tasting",
    meta: "11:00 · Olive & Oak Catering",
    color: "sage",
  },
  {
    day: "18",
    month: "SEP",
    title: "Venue walkthrough",
    meta: "14:30 · Shepstone Gardens",
    color: "rose",
  },
  { day: "21", month: "SEP", title: "Dress fitting", meta: "10:00 · Rosebank", color: "gold" },
];

export const vendors = [
  {
    name: "Lumen & Lace",
    category: "Photography",
    rating: "4.9",
    price: "From R 28,000",
    status: "Confirmed",
    initials: "LL",
    tone: "rose",
  },
  {
    name: "Olive & Oak",
    category: "Catering",
    rating: "4.8",
    price: "From R 850 / guest",
    status: "Confirmed",
    initials: "OO",
    tone: "sage",
  },
  {
    name: "Petal Theory",
    category: "Florist",
    rating: "4.9",
    price: "From R 18,500",
    status: "Quote received",
    initials: "PT",
    tone: "gold",
  },
  {
    name: "Afterglow Events",
    category: "Music & DJ",
    rating: "4.7",
    price: "From R 12,000",
    status: "Shortlisted",
    initials: "AE",
    tone: "blue",
  },
];

export const budgetCategories = [
  { name: "Venue", amount: 142000, budget: 150000, color: "#8d4656" },
  { name: "Food & drinks", amount: 96500, budget: 130000, color: "#71826b" },
  { name: "Photography", amount: 28000, budget: 35000, color: "#b99052" },
  { name: "Décor & flowers", amount: 44000, budget: 70000, color: "#ad7180" },
  { name: "Other", amount: 25000, budget: 135000, color: "#74859d" },
];
