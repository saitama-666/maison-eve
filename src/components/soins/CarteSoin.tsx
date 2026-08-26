import Image from 'next/image';
import Link from 'next/link';

import { Badge } from '@/components/ui/Bits';
import { Icon } from '@/components/ui/Icon';
import type { Service } from '@/data/services';
import { duree, prix } from '@/lib/utils';

// =====================================================================
//  Carte de soin.
//
//  Reprend la carte de la maquette : visuel en haut, nom, résumé, puis
//  une ligne « durée · prix » séparée par un filet.
//
//  TOUTE LA CARTE EST UN LIEN, pas seulement le titre. Une zone cliquable
//  de 300 px de haut se vise infiniment mieux qu'un texte de 18 px — au
//  doigt comme à la souris. Il n'y a donc qu'un seul lien par carte : deux
//  liens vers la même page obligeraient à tabuler deux fois pour rien.
//
//  Le mouvement suit le rôle « réponse » : la carte se soulève de 6 px en
//  140 ms, le visuel zoome un peu plus lentement (620 ms) parce qu'un
//  zoom rapide sur une image paraît nerveux.
// =====================================================================

export function CarteSoin({
  service,
  priorite = false,
  niveau = 3,
}: {
  service: Service;
  /** À vrai pour les toutes premières cartes visibles sans défiler. */
  priorite?: boolean;
  /**
   * Niveau du titre de la carte.
   *
   * Il DOIT suivre le contexte, sinon la page saute un niveau et un
   * lecteur d'écran annonce une profondeur qui n'existe pas :
   *   · sur /soins, le <h1> est « Nos soins » → les cartes sont des <h2> ;
   *   · sur l'accueil, la section a déjà un <h2> → les cartes sont des <h3>.
   */
  niveau?: 2 | 3;
}) {
  const Titre = (niveau === 2 ? 'h2' : 'h3') as 'h2' | 'h3';

  return (
    // Le soulèvement au survol est en CSS. En Framer, il rendait client
    // le composant le plus répété du site — jusqu'à dix instances par page,
    // chacune avec ses écouteurs de pointeur.
    <article className="group h-full transition-transform duration-[140ms] ease-out hover:-translate-y-1.5 active:translate-y-0">
      <Link
        href={`/soins/${service.slug}`}
        className="carte zoom-carte flex h-full flex-col overflow-hidden transition-shadow duration-[240ms] hover:shadow-lift"
      >
        {/* --- Visuel ---
            ⚠️  4/5, PAS 4/3. Le cadre était en 4/3 (paysage) alors que les
            onze photos de soins sont en 3:4 (portrait) : chaque carte de
            la grille perdait 44 % de la hauteur de sa photo. En 4/5 le
            recadrage tombe à 6 %.

            Si les visuels changent un jour, c'est CE ratio qu'on ajuste,
            pas les fichiers. */}
        <div className="relative aspect-[4/5] shrink-0 overflow-hidden">
          <Image
            src={service.image}
            alt={service.nom}
            fill
            priority={priorite}
            sizes="(max-width: 640px) 100vw, (max-width: 1024px) 50vw, 33vw"
            className="object-cover"
          />

          {service.populaire && (
            <span className="absolute left-3 top-3">
              <Badge ton="clair" icone="etincelle">
                Populaire
              </Badge>
            </span>
          )}

          {!service.domicileDisponible && (
            <span className="absolute right-3 top-3">
              <Badge ton="clair">En institut</Badge>
            </span>
          )}
        </div>

        {/* --- Texte --- */}
        <div className="flex flex-1 flex-col gap-2.5 p-5">
          <Titre className="font-display text-[1.375rem] leading-snug text-ink transition-colors duration-[140ms] group-hover:text-champagne">
            {service.nom}
          </Titre>

          <p className="flex-1 text-sm leading-relaxed text-muted">{service.resume}</p>

          {/* --- Durée · prix --- */}
          <div className="mt-2 flex items-center justify-between border-t border-linesoft pt-3.5">
            <span className="inline-flex items-center gap-1.5 text-xs text-muted">
              <Icon nom="horloge" taille={14} />
              {duree(service.duree)}
            </span>

            <span className="inline-flex items-baseline gap-1.5">
              <span className="font-display text-xl text-ink tabular">{prix(service.prix)}</span>
              <Icon
                nom="fleche-droite"
                taille={15}
                className="text-champagne transition-transform duration-[140ms] group-hover:translate-x-1"
              />
            </span>
          </div>
        </div>
      </Link>
    </article>
  );
}

/** Variante compacte — listes latérales, « soins similaires ». */
export function LigneSoin({ service }: { service: Service }) {
  return (
    <div className="transition-transform duration-[140ms] ease-out hover:translate-x-1">
      <Link
        href={`/soins/${service.slug}`}
        className="group flex items-center gap-4 border-b border-linesoft py-3.5 last:border-0"
      >
        <div className="relative h-14 w-14 shrink-0 overflow-hidden rounded-md">
          <Image src={service.image} alt="" fill sizes="56px" className="object-cover" />
        </div>

        <div className="min-w-0 flex-1">
          <h3 className="truncate font-display text-lg text-ink transition-colors duration-[140ms] group-hover:text-champagne">
            {service.nom}
          </h3>
          <p className="text-xs text-muted">
            {duree(service.duree)} · {prix(service.prix)}
          </p>
        </div>

        <Icon
          nom="fleche-droite"
          taille={15}
          className="shrink-0 text-champagne transition-transform duration-[140ms] group-hover:translate-x-1"
        />
      </Link>
    </div>
  );
}
