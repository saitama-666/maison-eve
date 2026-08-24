import type { ReactNode } from 'react';

// =====================================================================
//  Gabarit des pages de texte : CGV, confidentialité, mentions légales.
//
//  Colonne bornée à 72 caractères et titres hiérarchisés. Ces pages sont
//  rarement lues en entier — mais quand elles le sont, c'est en cherchant
//  un point précis. D'où les titres de section nombreux et explicites.
//
//  Aucune animation ici : une personne qui vient chercher sa clause
//  d'annulation n'a pas besoin d'un spectacle.
// =====================================================================

export function PageTexte({
  titre,
  miseAJour,
  intro,
  children,
}: {
  titre: string;
  miseAJour: string;
  intro?: string;
  children: ReactNode;
}) {
  return (
    <div className="bg-canvas pb-24 pt-32 lg:pt-40">
      <div className="mx-auto max-w-[72ch] px-5 sm:px-8">
        <header className="flex flex-col gap-4 border-b border-line pb-8">
          <h1 className="font-display text-[2.5rem] leading-tight text-ink sm:text-[3rem]">
            {titre}
          </h1>
          {intro && <p className="text-[0.9375rem] leading-relaxed text-muted">{intro}</p>}
          <p className="text-xs text-faint">Dernière mise à jour : {miseAJour}</p>
        </header>

        <div className="mt-10 flex flex-col gap-10">{children}</div>
      </div>
    </div>
  );
}

export function Section({ titre, children }: { titre: string; children: ReactNode }) {
  return (
    <section className="flex flex-col gap-3">
      <h2 className="font-display text-2xl text-ink sm:text-[1.75rem]">{titre}</h2>
      <div className="flex flex-col gap-3 text-[0.9375rem] leading-relaxed text-muted">
        {children}
      </div>
    </section>
  );
}

export function Liste({ items }: { items: readonly string[] }) {
  return (
    <ul className="flex flex-col gap-2">
      {items.map((i) => (
        <li key={i} className="flex items-start gap-3">
          <span className="mt-2 h-1.5 w-1.5 shrink-0 rounded-full bg-champagne" />
          <span>{i}</span>
        </li>
      ))}
    </ul>
  );
}

/**
 * Encadré signalant un texte à faire valider.
 *
 * Ces pages engagent juridiquement l'institut. Un modèle générique
 * ressemble à un vrai document et c'est précisément le danger : on croit
 * la page faite alors qu'elle ne protège personne. L'avertissement doit
 * donc être VISIBLE sur le site, pas seulement dans un commentaire de code
 * — il disparaîtra quand un professionnel aura relu le texte.
 */
export function AValider({ children }: { children: ReactNode }) {
  return (
    <div className="rounded-md bg-warning/8 px-4 py-3.5 text-sm leading-relaxed text-warning ring-1 ring-inset ring-warning/25">
      <strong className="font-sans font-medium">À faire valider — </strong>
      {children}
    </div>
  );
}
