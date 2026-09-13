const frenchByEnglish: Record<string, string> = {
  // Shared actions and form language
  "Add new": "Ajouter",
  Add: "Ajouter",
  Cancel: "Annuler",
  Close: "Fermer",
  "Close dialog": "Fermer la fenêtre",
  Delete: "Supprimer",
  Edit: "Modifier",
  Save: "Enregistrer",
  "Save changes": "Enregistrer",
  "Saving…": "Enregistrement…",
  Search: "Rechercher",
  "Select an option": "Sélectionnez une option",
  "Download report": "Télécharger le rapport",
  "Report downloaded.": "Rapport téléchargé.",
  All: "Tous",
  Name: "Nom",
  Rating: "Note",
  Pending: "En attente",
  Confirmed: "Confirmé",
  Declined: "Refusé",
  Attending: "Présent",
  Completed: "Terminé",
  Scheduled: "Planifié",
  New: "Nouveau",
  Today: "Aujourd’hui",
  Yesterday: "Hier",

  // Marketplace
  "Curated for your celebration": "Sélectionnés pour votre célébration",
  "Find your creative team": "Trouvez votre équipe créative",
  "Explore trusted wedding professionals whose work fits your date, place and style.":
    "Découvrez des prestataires de confiance adaptés à votre date, votre lieu et votre style.",
  "Search photographers, florists, venues…": "Rechercher photographes, fleuristes, lieux…",
  "Search vendors": "Rechercher des prestataires",
  "matching vendors found.": "prestataires correspondants trouvés.",
  Photography: "Photographie",
  Catering: "Traiteur",
  Florist: "Fleuriste",
  "Music & DJ": "Musique et DJ",
  "Vow Planner edit": "Sélection Vow Planner",
  "Florals that feel": "Des fleurs qui semblent",
  "gathered, not arranged.": "cueillies, jamais arrangées.",
  "Meet five Johannesburg studios creating expressive, season-led celebrations.":
    "Découvrez cinq studios de Johannesburg qui créent des célébrations expressives au rythme des saisons.",
  "Explore the edit →": "Découvrir la sélection →",
  "Portfolio stories": "Histoires de portfolios",
  "See the craft before you shortlist.": "Découvrez le savoir-faire avant de présélectionner.",
  "Previous portfolio": "Portfolio précédent",
  "Next portfolio": "Portfolio suivant",
  "Recommended near Johannesburg": "Recommandés près de Johannesburg",
  "Best match": "Meilleure correspondance",
  "View portfolio": "Voir le portfolio",
  "Johannesburg · Responds within a day": "Johannesburg · Répond sous 24 heures",
  "View profile": "Voir le profil",
  "Sort vendors": "Trier les prestataires",
  "profile preview opened.": "aperçu du profil ouvert.",
  "Floral design": "Création florale",
  "Editorial light · Johannesburg": "Lumière éditoriale · Johannesburg",
  "Season-led installations · Gauteng": "Installations au rythme des saisons · Gauteng",
  "Modern South African menus": "Menus sud-africains modernes",
  "Curated dance floors · Nationwide": "Ambiances dansantes sur mesure · Dans tout le pays",
  "From R 28,000": "À partir de R 28 000",
  "From R 850 / guest": "À partir de R 850 / invité",
  "From R 18,500": "À partir de R 18 500",
  "From R 12,000": "À partir de R 12 000",
  "exceptional matches": "prestataires remarquables",

  // Account and shell
  "Main navigation": "Navigation principale",
  "Open profile settings": "Ouvrir les paramètres du profil",
  "Use light theme": "Utiliser le thème clair",
  "Use dark theme": "Utiliser le thème sombre",
  "Profile information": "Informations du profil",
  "This information is visible to people sharing a workspace with you.":
    "Ces informations sont visibles par les personnes qui partagent votre espace.",
  "Your choice updates the shared navigation and dashboard language and is remembered on this device.":
    "Votre choix met à jour la navigation et le tableau de bord et reste mémorisé sur cet appareil.",
  "Task reminders": "Rappels de tâches",
  "Weekly planning tasks and approaching due dates": "Tâches hebdomadaires et échéances proches",
  "RSVP updates": "Mises à jour RSVP",
  "Guest replies and dietary changes": "Réponses des invités et changements alimentaires",
  "Vendor messages": "Messages des prestataires",
  "New messages from your booked vendors": "Nouveaux messages de vos prestataires réservés",
  "Payment reminders": "Rappels de paiement",
  "Upcoming deposits and final balances": "Acomptes à venir et soldes finaux",
  "Sign-in alerts": "Alertes de connexion",
  "Get an email when a new device signs in": "Recevez un e-mail lors d’une nouvelle connexion",
  "Two-step verification": "Vérification en deux étapes",
  "Require a second check when signing in": "Demandez une seconde vérification à la connexion",
  "Remember this device": "Mémoriser cet appareil",
  "Skip extra checks on this trusted browser": "Évitez les vérifications sur ce navigateur fiable",
  "Google Calendar": "Google Agenda",
  "Sync appointments and planning milestones":
    "Synchronisez les rendez-vous et les étapes importantes",
  "Apple Calendar": "Calendrier Apple",
  "Keep wedding dates on your Apple devices": "Gardez les dates du mariage sur vos appareils Apple",
  "Google Drive": "Google Drive",
  "Attach contracts and inspiration files": "Ajoutez vos contrats et fichiers d’inspiration",
  "You have 3 unread messages.": "Vous avez 3 messages non lus.",
  "Saved profile settings could not be loaded.": "Impossible de charger les paramètres du profil.",
  "Profile settings saved.": "Paramètres du profil enregistrés.",
  "Saved preferences could not be loaded.": "Impossible de charger les préférences.",
  enabled: "activé",
  disabled: "désactivé",

  // Authentication
  Couple: "Couple",
  Planner: "Organisateur",
  Vendor: "Prestataire",
  "Account type": "Type de compte",
  "Please check the highlighted details.": "Vérifiez les informations signalées.",
  "Your workspace is ready.": "Votre espace est prêt.",
  "Welcome back, Amara.": "Heureux de vous revoir, Amara.",
  "Authentication failed.": "Échec de l’authentification.",
  "Use at least 8 characters with a number and a symbol.":
    "Utilisez au moins 8 caractères, un chiffre et un symbole.",
  "or continue with": "ou continuer avec",
  "Google sign-in will be available when authentication is connected.":
    "La connexion Google sera disponible lorsque l’authentification sera configurée.",
  "Facebook sign-in will be available when authentication is connected.":
    "La connexion Facebook sera disponible lorsque l’authentification sera configurée.",
};

const literalKeyByEnglish = new Map(
  Object.keys(frenchByEnglish).map((english, index) => [english, `message${index}`]),
);

export const literalMessages = Object.entries(frenchByEnglish).reduce<{
  en: Record<string, string>;
  fr: Record<string, string>;
}>(
  (result, [english, french], index) => {
    const key = `message${index}`;
    result.en[key] = english;
    result.fr[key] = french;
    return result;
  },
  { en: {}, fr: {} },
);

export function getLiteralMessageKey(value: string) {
  const key = literalKeyByEnglish.get(value);
  return key ? `literal.${key}` : null;
}
