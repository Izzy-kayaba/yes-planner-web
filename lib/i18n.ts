import { literalMessages } from "@/lib/i18n-literals";

export const supportedLanguages = ["en", "fr"] as const;
export type Language = (typeof supportedLanguages)[number];
export const languageCookieName = "NEXT_LOCALE";

// Check cookie and settings values before using them as a translation catalog key.
export function isSupportedLanguage(value: string | null | undefined): value is Language {
  return value === "en" || value === "fr";
}

const english = {
  "common.addNew": "Add new",
  "common.cancel": "Cancel",
  "common.delete": "Delete",
  "common.edit": "Edit",
  "common.save": "Save changes",
  "common.search": "Search anything",
  "common.settings": "Settings",
  "nav.dashboard": "Dashboard",
  "nav.wedding": "Our wedding",
  "nav.marketplace": "Vendor marketplace",
  "nav.organisation": "Organisation",
  "nav.planner": "Wedding planner",
  "nav.vendor": "Vendor portal",
  "nav.messages": "Messages",
  "nav.admin": "System administration",
  "nav.adminSection": "Platform administration",
  "nav.users": "Users",
  "nav.weddings": "Weddings",
  "nav.businesses": "Businesses",
  "nav.venues": "Venues",
  "nav.verification": "Verification",
  "nav.supportRequests": "Support requests",
  "nav.platformStaff": "Platform staff",
  "nav.integrations": "Integrations",
  "nav.audit": "Audit log",
  "nav.support": "Help & support",
  "nav.workspace": "Workspace",
  "shell.planningMode": "Planning mode",
  "shell.weddingOwner": "Wedding owner",
  "shell.daysToGo": "days to go",
  "shell.openNav": "Open navigation",
  "shell.closeNav": "Close navigation",
  "shell.notifications": "Notifications",
  "shell.search": "Search Yes Planner",
  "dashboard.greeting": "Good morning, {name}",
  "dashboard.intro": "The big day is getting closer. Here’s where everything stands.",
  "dashboard.openWedding": "Open wedding workspace",
  "dashboard.yourWedding": "Your wedding",
  "dashboard.only": "Only",
  "dashboard.planningProgress": "Planning progress",
  "dashboard.complete": "complete",
  "dashboard.focus": "Today’s focus",
  "dashboard.momentum": "Keep the momentum",
  "dashboard.viewTasks": "View all tasks",
  "dashboard.addTask": "Add a task",
  "dashboard.comingUp": "Coming up",
  "dashboard.nextMoments": "Your next moments",
  "dashboard.openCalendar": "Open full calendar",
  "auth.welcome": "Welcome back",
  "auth.loginTitle": "Your celebration awaits",
  "auth.loginIntro": "Sign in to pick up exactly where you left off.",
  "auth.registerEyebrow": "Begin your journey",
  "auth.registerTitle": "Create your workspace",
  "auth.registerIntro":
    "Choose how you’ll use Yes Planner. You can belong to more than one workspace later.",
  "auth.firstName": "First name",
  "auth.lastName": "Last name",
  "auth.email": "Email address",
  "auth.phone": "Phone number",
  "auth.password": "Password",
  "auth.forgot": "Forgot password?",
  "auth.create": "Create my workspace",
  "auth.continue": "Continue to my workspace",
  "auth.account": "Already have an account?",
  "auth.new": "New to Yes Planner?",
  "auth.signIn": "Sign in",
  "auth.createAccount": "Create an account",
  "settings.account": "Account",
  "settings.title": "Settings",
  "settings.intro": "Manage your profile, preferences and notifications.",
  "settings.profile": "Profile",
  "settings.notifications": "Notifications",
  "settings.language": "Language & region",
  "settings.security": "Security",
  "settings.connections": "Connected accounts",
  "settings.preferredLanguage": "Preferred language",
  "settings.timezone": "Time zone",
  "language.english": "English",
  "language.french": "French",
  "wedding.overview": "Overview",
  "wedding.guests": "Guests",
  "wedding.budget": "Budget",
  "wedding.tasks": "Tasks",
  "wedding.vendors": "Vendors",
  "wedding.timeline": "Timeline",
  "wedding.seating": "Seating",
  "wedding.food": "Food & drinks",
  "wedding.documents": "Documents",
  "wedding.bookings": "Bookings",
  "wedding.payments": "Payments",
  "wedding.messages": "Messages",
  "wedding.notes": "Notes",
  "wedding.reports": "Reports",
  "wedding.guestsDescription": "Invitations, replies, meal choices and seating in one view.",
  "wedding.budgetDescription": "Stay close to the numbers without losing sight of the celebration.",
  "wedding.tasksDescription": "A shared list for the couple, planner and assigned team.",
  "wedding.vendorsDescription": "Your creative team, open requests and remaining categories.",
  "wedding.timelineDescription": "Appointments now, a seamless wedding day later.",
  "wedding.seatingDescription": "Shape tables around relationships, accessibility and comfort.",
  "wedding.foodDescription": "Menus, dietary needs and final catering numbers.",
  "wedding.documentsDescription": "Contracts, invoices and shared files with clear visibility.",
  "wedding.bookingsDescription": "Track every request from first quote to completed service.",
  "wedding.paymentsDescription": "Upcoming balances, invoices and a complete payment record.",
  "wedding.messagesDescription": "Keep wedding conversations connected to the plan.",
  "wedding.notesDescription": "Capture ideas, questions and decisions before they disappear.",
  "wedding.reportsDescription": "A clear view of readiness, spend and guest responses.",
  "pricing.under": "Under {amount}",
  "pricing.range": "{min} – {max}",
  "pricing.plus": "{amount}+",
  "guests.under": "Under {amount}",
  "guests.range": "{min} – {max}",
  "guests.plus": "{amount}+",
} as const;

export type TranslationKey = keyof typeof english;

const french = {
  "common.addNew": "Ajouter",
  "common.cancel": "Annuler",
  "common.delete": "Supprimer",
  "common.edit": "Modifier",
  "common.save": "Enregistrer",
  "common.search": "Rechercher",
  "common.settings": "Paramètres",
  "nav.dashboard": "Tableau de bord",
  "nav.wedding": "Notre mariage",
  "nav.marketplace": "Prestataires",
  "nav.organisation": "Organisation",
  "nav.planner": "Organisation de mariage",
  "nav.vendor": "Espace prestataire",
  "nav.messages": "Messages",
  "nav.admin": "Administration système",
  "nav.adminSection": "Administration de la plateforme",
  "nav.users": "Utilisateurs",
  "nav.weddings": "Mariages",
  "nav.businesses": "Entreprises",
  "nav.venues": "Lieux de réception",
  "nav.verification": "Vérification",
  "nav.supportRequests": "Demandes d’assistance",
  "nav.platformStaff": "Équipe de la plateforme",
  "nav.integrations": "Intégrations",
  "nav.audit": "Journal d’audit",
  "nav.support": "Aide et assistance",
  "nav.workspace": "Espace de travail",
  "shell.planningMode": "Mode planification",
  "shell.weddingOwner": "Propriétaire du mariage",
  "shell.daysToGo": "jours restants",
  "shell.openNav": "Ouvrir la navigation",
  "shell.closeNav": "Fermer la navigation",
  "shell.notifications": "Notifications",
  "shell.search": "Rechercher dans Yes Planner",
  "dashboard.greeting": "Bonjour, {name}",
  "dashboard.intro": "Le grand jour approche. Voici où en est votre organisation.",
  "dashboard.openWedding": "Ouvrir l’espace mariage",
  "dashboard.yourWedding": "Votre mariage",
  "dashboard.only": "Plus que",
  "dashboard.planningProgress": "Progression",
  "dashboard.complete": "terminé",
  "dashboard.focus": "Priorités du jour",
  "dashboard.momentum": "Gardez le rythme",
  "dashboard.viewTasks": "Voir toutes les tâches",
  "dashboard.addTask": "Ajouter une tâche",
  "dashboard.comingUp": "À venir",
  "dashboard.nextMoments": "Vos prochains rendez-vous",
  "dashboard.openCalendar": "Ouvrir le calendrier",
  "auth.welcome": "Heureux de vous revoir",
  "auth.loginTitle": "Votre célébration vous attend",
  "auth.loginIntro": "Connectez-vous pour reprendre là où vous vous êtes arrêté.",
  "auth.registerEyebrow": "Commencez votre parcours",
  "auth.registerTitle": "Créez votre espace",
  "auth.registerIntro":
    "Choisissez comment utiliser Yes Planner. Vous pourrez rejoindre plusieurs espaces ensuite.",
  "auth.firstName": "Prénom",
  "auth.lastName": "Nom",
  "auth.email": "Adresse e-mail",
  "auth.phone": "Numéro de téléphone",
  "auth.password": "Mot de passe",
  "auth.forgot": "Mot de passe oublié ?",
  "auth.create": "Créer mon espace",
  "auth.continue": "Accéder à mon espace",
  "auth.account": "Vous avez déjà un compte ?",
  "auth.new": "Nouveau sur Yes Planner ?",
  "auth.signIn": "Se connecter",
  "auth.createAccount": "Créer un compte",
  "settings.account": "Compte",
  "settings.title": "Paramètres",
  "settings.intro": "Gérez votre profil, vos préférences et vos notifications.",
  "settings.profile": "Profil",
  "settings.notifications": "Notifications",
  "settings.language": "Langue et région",
  "settings.security": "Sécurité",
  "settings.connections": "Comptes connectés",
  "settings.preferredLanguage": "Langue préférée",
  "settings.timezone": "Fuseau horaire",
  "language.english": "Anglais",
  "language.french": "Français",
  "wedding.overview": "Vue d’ensemble",
  "wedding.guests": "Invités",
  "wedding.budget": "Budget",
  "wedding.tasks": "Tâches",
  "wedding.vendors": "Prestataires",
  "wedding.timeline": "Calendrier",
  "wedding.seating": "Plan de table",
  "wedding.food": "Repas et boissons",
  "wedding.documents": "Documents",
  "wedding.bookings": "Réservations",
  "wedding.payments": "Paiements",
  "wedding.messages": "Messages",
  "wedding.notes": "Notes",
  "wedding.reports": "Rapports",
  "wedding.guestsDescription": "Invitations, réponses, repas et placement en un seul endroit.",
  "wedding.budgetDescription": "Suivez les chiffres sans perdre de vue la célébration.",
  "wedding.tasksDescription": "Une liste partagée pour le couple, le planificateur et l’équipe.",
  "wedding.vendorsDescription": "Votre équipe créative, les devis et les catégories restantes.",
  "wedding.timelineDescription": "Les rendez-vous maintenant, une journée fluide ensuite.",
  "wedding.seatingDescription": "Organisez les tables selon les relations et le confort.",
  "wedding.foodDescription": "Menus, besoins alimentaires et nombres finaux.",
  "wedding.documentsDescription": "Contrats, factures et fichiers partagés avec clarté.",
  "wedding.bookingsDescription": "Suivez chaque demande du devis au service terminé.",
  "wedding.paymentsDescription": "Soldes à venir, factures et historique des paiements.",
  "wedding.messagesDescription": "Gardez les conversations liées au projet de mariage.",
  "wedding.notesDescription": "Conservez les idées, questions et décisions importantes.",
  "wedding.reportsDescription": "Une vue claire de l’avancement, des dépenses et des réponses.",
} as Record<TranslationKey, string>;

french["pricing.under"] = "Moins de {amount}";
french["pricing.range"] = "{min} – {max}";
french["pricing.plus"] = "{amount}+";
french["guests.under"] = "Moins de {amount}";
french["guests.range"] = "{min} – {max}";
french["guests.plus"] = "{amount}+";

export const messages: Record<Language, Record<TranslationKey, string>> = {
  en: english,
  fr: french,
};

function nestMessages(languageMessages: Record<TranslationKey, string>) {
  // next-intl expects nested objects; the source catalog stays flat for type safety.
  return Object.entries(languageMessages).reduce<Record<string, Record<string, string>>>(
    (result, [key, value]) => {
      const separator = key.indexOf(".");
      const namespace = key.slice(0, separator);
      const messageKey = key.slice(separator + 1);
      result[namespace] ??= {};
      result[namespace][messageKey] = value;
      return result;
    },
    {},
  );
}

/** Messages in the nested shape expected by next-intl. */
export const intlMessages: Record<Language, Record<string, Record<string, string>>> = {
  en: { ...nestMessages(messages.en), literal: literalMessages.en },
  fr: { ...nestMessages(messages.fr), literal: literalMessages.fr },
};

export function translate(
  language: Language,
  key: TranslationKey,
  values?: Record<string, string | number>,
) {
  // Replace named placeholders such as {name} without losing numeric values.
  const template = messages[language][key];
  if (!values) return template;
  return Object.entries(values).reduce(
    (result, [name, value]) => result.replaceAll(`{${name}}`, String(value)),
    template,
  );
}
