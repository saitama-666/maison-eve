'use client';


import { Encart, Ligne } from '@/components/ui/Bits';
import { Button } from '@/components/ui/Button';
import { Icon } from '@/components/ui/Icon';
import { LotusMark } from '@/components/ui/Logo';
import { contact } from '@/data/site';
import { dateHeure, duree, prix } from '@/lib/utils';

// =====================================================================
//  Écran de confirmation.
//
//  Il doit faire trois choses, dans cet ordre :
//   1. RASSURER — la demande est bien partie.
//   2. DIRE LA VÉRITÉ — ce n'est pas encore confirmé. Le statut est
//      « en attente » tant qu'un humain n'a pas validé. Écrire « Votre
//      rendez-vous est confirmé ! » serait faux, et la déception au
//      moment du rappel coûterait plus cher que la nuance.
//   3. DONNER LA SUITE — la référence à citer, et comment nous joindre.
//
//  La coche se dessine (`pathLength`) plutôt que d'apparaître : le trait
//  qui se trace donne le sentiment que quelque chose vient de s'accomplir.
// =====================================================================

type Vue = {
  id: string;
  reference: string;
  serviceNom: string;
  serviceSlug: string;
  duree: number;
  lieu: 'institut' | 'domicile';
  prix: number;
  supplementDomicile: number;
  total: number;
  startAt: string;
  statutLabel: string;
  prenom: string;
  nom: string;
  email: string;
  telephone: string;
  adresseSoin: string | null;
  adresseFacturation: string | null;
  notes: string;
};

export function ConfirmationReservation({ reservation: r }: { reservation: Vue }) {
  return (
    /*
      ⚠️  CETTE PAGE PORTE LA RÉFÉRENCE DE RÉSERVATION DU CLIENT.

          C'est le seul élément qu'il doit retenir, et la seule preuve
          qu'il a de sa demande. Elle était rendue par quatre blocs Framer
          partant tous de `opacity: 0`. Framer avance depuis
          `requestAnimationFrame` : si rAF ne tourne pas — onglet passé en
          arrière-plan pendant l'envoi du formulaire, ce qui arrive
          précisément ici, où l'on attend une réponse serveur — la page de
          confirmation s'affiche VIDE.

          Tout passe par `.arrivee`, qui ne décale que la position.
    */
    <div className="arrivee mx-auto max-w-2xl px-5 pb-24 pt-32 sm:px-8 lg:pt-40">
      {/* --- Coche --- */}
      <div className="surgir-coche mx-auto flex h-20 w-20 items-center justify-center rounded-full bg-champagnepale/70 text-champagne">
        <svg width="36" height="36" viewBox="0 0 36 36" fill="none" aria-hidden>
          {/* Le trait se dessine par `stroke-dashoffset`. L'état de REPOS
              est le trait complet : si l'animation ne se joue pas, la coche
              est simplement déjà tracée. */}
          <path
            className="trace-coche"
            d="M9 18.5L15 24.5L27 11.5"
            stroke="currentColor"
            strokeWidth="2.2"
            strokeLinecap="round"
            strokeLinejoin="round"
          />
        </svg>
      </div>

      <div className="mt-7 text-center">
        <h1 className="font-display text-[2.25rem] leading-tight text-ink sm:text-[2.75rem]">
          Merci {r.prenom}, votre demande est partie
        </h1>

        <p className="mx-auto mt-4 max-w-md text-[0.9375rem] leading-relaxed text-muted">
          Elle n’est pas encore confirmée : l’institut vérifie le créneau et vous rappelle,
          en général dans la journée.
        </p>

        {/* La référence est le seul élément à retenir : elle est mise en
            avant, en chiffres à chasse fixe, sélectionnable d'un geste. */}
        <div className="mx-auto mt-7 inline-flex flex-col items-center gap-1.5 rounded-lg bg-canvas2 px-7 py-4">
          <span className="text-[0.625rem] uppercase tracking-[0.24em] text-faint">
            Votre référence
          </span>
          <span className="select-all font-display text-3xl tracking-wide text-ink tabular">
            {r.reference}
          </span>
        </div>
      </div>

      {/* --- Détail --- */}
      <div className="carte mt-10 p-6">
        <div className="mb-4 flex items-center gap-2 border-b border-linesoft pb-4">
          <LotusMark taille={20} className="text-champagne" />
          <h2 className="font-display text-xl text-ink">Votre rendez-vous</h2>
        </div>

        <Ligne cle="Statut" valeur={r.statutLabel} />
        <Ligne cle="Soin" valeur={r.serviceNom} />
        <Ligne cle="Durée" valeur={duree(r.duree)} />
        <Ligne cle="Quand" valeur={r.startAt ? dateHeure(r.startAt) : '—'} />
        <Ligne cle="Où" valeur={r.lieu === 'domicile' ? 'À domicile' : `En institut — ${contact.city}`} />
        {r.adresseSoin && <Ligne cle="Adresse du soin" valeur={r.adresseSoin} />}
        {r.adresseFacturation && <Ligne cle="Adresse de facturation" valeur={r.adresseFacturation} />}
        <Ligne cle="Au nom de" valeur={`${r.prenom} ${r.nom}`} />
        <Ligne cle="Téléphone" valeur={r.telephone} />
        <Ligne cle="E-mail" valeur={r.email} />
        {r.notes && <Ligne cle="Vos remarques" valeur={r.notes} />}

        <Ligne cle="Prix du soin" valeur={prix(r.prix)} />
        {r.supplementDomicile > 0 && (
          <Ligne cle="Déplacement" valeur={prix(r.supplementDomicile)} />
        )}
        <Ligne cle="À régler sur place" valeur={prix(r.total)} fort />
      </div>

      <div className="mt-6 flex flex-col gap-5">
        <Encart ton="info" titre="Gardez ce lien">
          Cette page vous permet de retrouver votre demande. Si vous avez un compte, elle
          apparaît aussi dans « Mes rendez-vous ».
        </Encart>

        <div className="flex flex-col gap-3 sm:flex-row">
          <Button href="/compte/reservations" pleineLargeur fleche>
            Mes rendez-vous
          </Button>
          <Button href="/soins" variante="secondaire" pleineLargeur>
            Voir les autres soins
          </Button>
        </div>

        <div className="flex flex-col items-center gap-2 pt-2 text-center text-sm text-muted">
          <span>Un changement, une question ?</span>
          <a
            href={`tel:${contact.phoneHref}`}
            className="inline-flex items-center gap-2 text-ink transition-colors duration-[140ms] hover:text-champagne"
          >
            <Icon nom="telephone" taille={15} />
            {contact.phone}
          </a>
        </div>
      </div>
    </div>
  );
}
