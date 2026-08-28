// =====================================================================
//  Questions fréquentes.
//
//  Servent à deux endroits : la section FAQ de l'accueil (les 4 premières)
//  et la page /faq complète. Elles alimentent aussi les données
//  structurées `FAQPage` — d'où l'importance que les réponses soient
//  vraies : Google les affiche directement dans ses résultats.
// =====================================================================

export type Question = {
  q: string;
  r: string;
  /** Reprise dans la FAQ courte de la page d'accueil. */
  accueil: boolean;
  categorie: 'reservation' | 'domicile' | 'soins' | 'paiement';
};

export const questions: readonly Question[] = [
  {
    q: 'Faut-il réserver à l’avance ?',
    r:
      'Oui, c’est plus sûr. Les créneaux du samedi et de fin de journée partent vite. ' +
      'Réservez en ligne ou par téléphone ; on vous confirme le rendez-vous sous quelques heures.',
    accueil: true,
    categorie: 'reservation',
  },
  {
    q: 'Vous êtes ouverts quels jours ?',
    r:
      'Tous les jours, de 10h à 20h. Dimanche compris. Les créneaux de fin de journée et ' +
      'du week-end partent vite : mieux vaut réserver à l’avance.',
    accueil: true,
    categorie: 'reservation',
  },
  {
    q: 'Vous êtes où exactement ?',
    r:
      'Rue Rajaa, quartier Wifak, à Témara. On est à quelques minutes de Rabat. ' +
      'Appelez-nous si vous cherchez la porte, on vous guide.',
    accueil: true,
    categorie: 'reservation',
  },
  {
    q: 'Comment se passe le paiement ?',
    r:
      'Sur place, à la fin du soin : espèces ou carte. Le paiement en ligne n’est pas encore ' +
      'disponible. Aucune donnée bancaire n’est demandée ni conservée lors de la réservation.',
    accueil: true,
    categorie: 'paiement',
  },
  {
    q: 'Puis-je annuler ou déplacer mon rendez-vous ?',
    r:
      'Oui, depuis votre espace client ou par téléphone. On demande de prévenir au moins ' +
      '24 heures à l’avance : au-delà, la praticienne s’est déjà déplacée ou a refusé un autre créneau.',
    accueil: false,
    categorie: 'reservation',
  },
  {
    q: 'Les hommes sont-ils acceptés ?',
    r:
      'Oui, pour les massages et les soins du visage. ' +
      'Le hammam, lui, fonctionne par créneaux séparés — appelez-nous pour connaître les horaires.',
    accueil: false,
    categorie: 'soins',
  },
  {
    q: 'Je suis enceinte, puis-je réserver un massage ?',
    r:
      'À partir du deuxième trimestre, avec le massage prénatal, qui est conçu pour ça. ' +
      'Les autres massages et le hammam sont déconseillés pendant la grossesse. ' +
      'En cas de grossesse à risque, demandez l’accord de votre médecin.',
    accueil: false,
    categorie: 'soins',
  },
  {
    q: 'Y a-t-il des contre-indications ?',
    r:
      'Oui : fièvre, infection cutanée, phlébite, poussée inflammatoire, chirurgie récente. ' +
      'Signalez toute pathologie ou traitement en cours au moment de la réservation. ' +
      'Un institut ne remplace pas un avis médical.',
    accueil: false,
    categorie: 'soins',
  },
  {
    q: 'Puis-je offrir un soin ?',
    r:
      'Oui. Les cartes cadeaux sont disponibles à l’institut. Écrivez-nous pour en réserver une ' +
      'à distance — on s’occupe de l’envoi.',
    accueil: false,
    categorie: 'paiement',
  },
  {
    q: 'Combien de temps à l’avance dois-je arriver ?',
    r:
      'Dix minutes suffisent. Elles servent à parler de vos zones sensibles et à choisir la ' +
      'pression. Arriver en retard raccourcit le soin, pas la séance suivante.',
    accueil: false,
    categorie: 'reservation',
  },
] as const;

export const questionsAccueil = questions.filter((q) => q.accueil);
