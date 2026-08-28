'use client';

import Image from 'next/image';
import { useCallback, useEffect, useState } from 'react';

import { TitreAdmin } from '@/components/admin/CadreAdmin';
import { Badge, Encart, EtatVide, Squelette } from '@/components/ui/Bits';
import { Button } from '@/components/ui/Button';
import { Case, Champ, Liste, ZoneTexte } from '@/components/ui/Field';
import { Icon } from '@/components/ui/Icon';
import { appelAdmin, ErreurAdmin } from '@/lib/admin';
import { useToast } from '@/lib/toast';
import { cn, duree, prix, slug as versSlug } from '@/lib/utils';
import { slugValide } from '@/lib/validation';

// =====================================================================
//  Gestion du catalogue de soins.
//
//  Liste + éditeur, avec aperçu en direct de la carte telle qu'elle
//  s'affichera sur le site. L'aperçu n'est pas un gadget : sans lui, on
//  écrit un résumé de trois lignes sans voir qu'il déborde de la carte.
//
//  ⚠️  Le slug est GÉNÉRÉ depuis le nom tant qu'on ne l'a pas modifié à la
//      main. Une fois modifié, on ne l'écrase plus : changer le slug d'un
//      soin déjà en ligne casse ses liens et son référencement. C'est
//      pour ça qu'il reste modifiable, mais jamais automatiquement.
// =====================================================================

type Soin = {
  id: string;
  nom: string;
  slug: string;
  categorie: string;
  resume: string;
  description: string[];
  duree: number;
  prix: number;
  supplementDomicile: number;
  domicileDisponible: boolean;
  image: string;
  bienfaits: string[];
  populaire: boolean;
  actif: boolean;
  ordre: number;
};

function soinVide(): Soin {
  return {
    id: '',
    nom: '',
    slug: '',
    categorie: 'massages',
    resume: '',
    description: [''],
    duree: 60,
    prix: 0,
    supplementDomicile: 0,
    domicileDisponible: true,
    image: '/soins/defaut.jpg',
    bienfaits: [''],
    populaire: false,
    actif: true,
    ordre: 99,
  };
}

const CATEGORIES = [
  { valeur: 'corps', label: 'Hammam & spa' },
  { valeur: 'massages', label: 'Massages' },
  { valeur: 'visage', label: 'Soins du visage' },
  { valeur: 'rituels', label: 'Beaute & coiffure' },
];

export function GestionSoins() {
  const toast = useToast();

  const [liste, setListe] = useState<Soin[]>([]);
  const [chargement, setChargement] = useState(true);
  const [erreur, setErreur] = useState<string | null>(null);
  const [edition, setEdition] = useState<Soin | null>(null);
  const [aSupprimer, setASupprimer] = useState<string | null>(null);

  const charger = useCallback(async () => {
    setChargement(true);
    setErreur(null);
    try {
      const r = await appelAdmin<{ soins: Soin[] }>('/api/admin/soins');
      setListe(r.soins);
    } catch (e) {
      setErreur(e instanceof ErreurAdmin ? e.message : 'Lecture impossible.');
    } finally {
      setChargement(false);
    }
  }, []);

  useEffect(() => {
    void charger();
  }, [charger]);

  async function supprimer(id: string) {
    try {
      const r = await appelAdmin<{ desactive: boolean; message?: string }>(
        `/api/admin/soins?id=${encodeURIComponent(id)}`,
        { methode: 'DELETE' },
      );
      toast.succes(r.desactive ? (r.message ?? 'Soin désactivé.') : 'Soin supprimé.');
      setASupprimer(null);
      await charger();
    } catch (e) {
      toast.erreur(e instanceof ErreurAdmin ? e.message : 'Suppression impossible.');
    }
  }

  if (edition) {
    return (
      <EditeurSoin
        soin={edition}
        onFerme={() => setEdition(null)}
        onEnregistre={async () => {
          setEdition(null);
          await charger();
        }}
      />
    );
  }

  return (
    <>
      <TitreAdmin
        titre="Soins"
        texte={`${liste.length} soin${liste.length > 1 ? 's' : ''} au catalogue.`}
        action={
          <Button onClick={() => setEdition(soinVide())} fleche>
            Nouveau soin
          </Button>
        }
      />

      {erreur && (
        <Encart ton="attention" className="mb-6">
          {erreur}
        </Encart>
      )}

      {chargement && liste.length === 0 ? (
        <div className="flex flex-col gap-3">
          {[0, 1, 2].map((i) => (
            <Squelette key={i} className="h-24" />
          ))}
        </div>
      ) : liste.length === 0 ? (
        <EtatVide
          icone="lotus"
          titre="Aucun soin en base"
          texte="Le site affiche pour l’instant le catalogue de repli inscrit dans le code. Ajoutez un soin pour reprendre la main depuis ici."
          action={<Button onClick={() => setEdition(soinVide())}>Créer le premier soin</Button>}
        />
      ) : (
        <div className="flex flex-col gap-3">
          {liste.map((s) => (
            <article
              key={s.id}
              // `relative` est nécessaire : la confirmation de suppression
              // se pose en `absolute inset-0` par-dessus la ligne.
              className={cn('carte relative flex items-center gap-4 p-4', !s.actif && 'opacity-55')}
            >
              <div className="relative h-16 w-16 shrink-0 overflow-hidden rounded-md">
                <Image src={s.image} alt="" fill sizes="64px" className="object-cover" />
              </div>

              <div className="min-w-0 flex-1">
                <div className="flex flex-wrap items-center gap-2">
                  <h2 className="truncate font-display text-lg leading-tight text-ink">
                    {s.nom}
                  </h2>
                  {s.populaire && <Badge ton="champagne">Populaire</Badge>}
                  {!s.actif && <Badge>Désactivé</Badge>}
                </div>
                <p className="truncate text-xs text-muted">{s.resume}</p>
                <p className="text-xs text-faint tabular">
                  {duree(s.duree)} · {prix(s.prix)}
                  {s.domicileDisponible && ` · +${prix(s.supplementDomicile)} à domicile`}
                </p>
              </div>

              <div className="flex shrink-0 gap-1">
                <button
                  type="button"
                  onClick={() => setEdition(s)}
                  aria-label={`Modifier ${s.nom}`}
                  className="inline-flex h-9 w-9 items-center justify-center rounded-md text-muted transition-colors duration-[140ms] hover:bg-canvas2 hover:text-ink"
                >
                  <Icon nom="crayon" taille={16} />
                </button>
                <button
                  type="button"
                  onClick={() => setASupprimer(s.id)}
                  aria-label={`Supprimer ${s.nom}`}
                  className="inline-flex h-9 w-9 items-center justify-center rounded-md text-muted transition-colors duration-[140ms] hover:bg-danger/10 hover:text-danger"
                >
                  <Icon nom="poubelle" taille={16} />
                </button>
              </div>

              {/*
                Confirmation de suppression. Elle partait de `opacity: 0`
                sous Framer — le pire endroit possible : on clique sur la
                poubelle, rien n'apparait, on reclique. `.surgir` ne fait
                que la decaler de 14 px, elle est donc toujours lisible.
              */}
              {aSupprimer === s.id && (
                <div className="surgir absolute inset-0 flex items-center justify-center gap-3 rounded-lg bg-card/96 px-4 backdrop-blur-sm">
                    <p className="text-sm text-ink">Supprimer « {s.nom} » ?</p>
                    <Button taille="sm" variante="danger" onClick={() => supprimer(s.id)}>
                      Supprimer
                    </Button>
                    <Button taille="sm" variante="fantome" onClick={() => setASupprimer(null)}>
                      Annuler
                    </Button>
                </div>
              )}
            </article>
          ))}
        </div>
      )}
    </>
  );
}

// =====================================================================
//  Éditeur
// =====================================================================

function EditeurSoin({
  soin,
  onFerme,
  onEnregistre,
}: {
  soin: Soin;
  onFerme: () => void;
  onEnregistre: () => Promise<void>;
}) {
  const toast = useToast();

  const [v, setV] = useState<Soin>(soin);
  const [envoi, setEnvoi] = useState(false);
  const [erreurs, setErreurs] = useState<Record<string, string>>({});
  // Un slug déjà rempli à l'ouverture est un slug voulu : on ne le
  // régénère plus depuis le nom.
  const [slugManuel, setSlugManuel] = useState(Boolean(soin.slug));

  function maj<K extends keyof Soin>(cle: K, valeur: Soin[K]) {
    setV((x) => ({ ...x, [cle]: valeur }));
    setErreurs((e) => {
      if (!e[cle as string]) return e;
      const suivant = { ...e };
      delete suivant[cle as string];
      return suivant;
    });
  }

  function majNom(nom: string) {
    setV((x) => ({ ...x, nom, ...(slugManuel ? {} : { slug: versSlug(nom) }) }));
  }

  async function enregistrer(e: React.FormEvent) {
    e.preventDefault();

    const trouvees: Record<string, string> = {};
    if (!v.nom.trim()) trouvees.nom = 'Le nom est obligatoire.';
    if (!slugValide(v.slug)) {
      trouvees.slug = 'Minuscules, chiffres et tirets uniquement.';
    }
    if (!v.resume.trim()) trouvees.resume = 'Le résumé s’affiche sur la carte du catalogue.';
    if (v.prix < 0) trouvees.prix = 'Le prix ne peut pas être négatif.';
    if (v.duree < 15) trouvees.duree = '15 minutes minimum.';

    setErreurs(trouvees);
    if (Object.keys(trouvees).length > 0) return;

    setEnvoi(true);
    try {
      const corps = {
        ...v,
        description: v.description.filter((p) => p.trim()),
        bienfaits: v.bienfaits.filter((b) => b.trim()),
      };

      if (v.id) {
        await appelAdmin('/api/admin/soins', { methode: 'PATCH', corps });
        toast.succes('Soin enregistré.');
      } else {
        await appelAdmin('/api/admin/soins', { methode: 'POST', corps });
        toast.succes('Soin créé.');
      }

      await onEnregistre();
    } catch (e2) {
      toast.erreur(e2 instanceof ErreurAdmin ? e2.message : 'Enregistrement impossible.');
    } finally {
      setEnvoi(false);
    }
  }

  return (
    <>
      <TitreAdmin
        titre={v.id ? 'Modifier le soin' : 'Nouveau soin'}
        action={
          <Button variante="fantome" onClick={onFerme}>
            Retour à la liste
          </Button>
        }
      />

      <div className="grid gap-7 lg:grid-cols-[1fr_340px]">
        {/* --- Formulaire --- */}
        <form onSubmit={enregistrer} className="flex flex-col gap-6" noValidate>
          <section className="carte flex flex-col gap-5 p-6">
            <h2 className="font-display text-2xl text-ink">L’essentiel</h2>

            <Champ
              label="Nom du soin"
              value={v.nom}
              onChange={(e) => majNom(e.target.value)}
              erreur={erreurs.nom}
            />

            <Champ
              label="Adresse de la page (slug)"
              value={v.slug}
              onChange={(e) => {
                setSlugManuel(true);
                maj('slug', e.target.value);
              }}
              erreur={erreurs.slug}
              aide={`Le soin sera à l’adresse /soins/${v.slug || '…'}`}
            />

            <Liste
              label="Catégorie"
              value={v.categorie}
              onChange={(e) => maj('categorie', e.target.value)}
              options={CATEGORIES}
            />

            <ZoneTexte
              label="Résumé"
              value={v.resume}
              onChange={(e) => maj('resume', e.target.value)}
              erreur={erreurs.resume}
              rows={2}
              compteur={200}
              aide="Une phrase, affichée sur la carte du catalogue."
            />
          </section>

          <section className="carte flex flex-col gap-5 p-6">
            <h2 className="font-display text-2xl text-ink">Durée et tarif</h2>

            <div className="grid gap-4 sm:grid-cols-3">
              <Champ
                label="Durée (minutes)"
                type="number"
                value={String(v.duree)}
                onChange={(e) => maj('duree', Number(e.target.value))}
                erreur={erreurs.duree}
                min={15}
                max={480}
                step={5}
              />
              <Champ
                label="Prix en institut"
                type="number"
                value={String(v.prix)}
                onChange={(e) => maj('prix', Number(e.target.value))}
                erreur={erreurs.prix}
                min={0}
                step={10}
              />
              <Champ
                label="Supplément domicile"
                type="number"
                value={String(v.supplementDomicile)}
                onChange={(e) => maj('supplementDomicile', Number(e.target.value))}
                min={0}
                step={10}
              />
            </div>

            <Case
              label="Ce soin peut être réalisé à domicile"
              coche={v.domicileDisponible}
              onChange={(c) => maj('domicileDisponible', c)}
            />
          </section>

          <section className="carte flex flex-col gap-5 p-6">
            <h2 className="font-display text-2xl text-ink">La fiche détaillée</h2>

            <ListeChamps
              label="Paragraphes de description"
              valeurs={v.description}
              onChange={(x) => maj('description', x)}
              multiligne
              max={6}
            />

            <ListeChamps
              label="Bienfaits"
              valeurs={v.bienfaits}
              onChange={(x) => maj('bienfaits', x)}
              max={8}
            />

            <Champ
              label="Chemin du visuel"
              value={v.image}
              onChange={(e) => maj('image', e.target.value)}
              aide="Fichier déposé dans public/soins/, par exemple massage-argan.jpg"
            />
          </section>

          <section className="carte flex flex-col gap-4 p-6">
            <h2 className="font-display text-2xl text-ink">Affichage</h2>

            <Champ
              label="Ordre d’affichage"
              type="number"
              value={String(v.ordre)}
              onChange={(e) => maj('ordre', Number(e.target.value))}
              min={0}
              max={999}
              aide="Le plus petit nombre s’affiche en premier."
            />

            <Case
              label="Mettre en avant sur la page d’accueil"
              coche={v.populaire}
              onChange={(c) => maj('populaire', c)}
            />

            <Case
              label="Soin actif (visible sur le site)"
              coche={v.actif}
              onChange={(c) => maj('actif', c)}
            />
          </section>

          <div className="flex flex-wrap gap-3">
            <Button type="submit" chargement={envoi} fleche>
              {v.id ? 'Enregistrer' : 'Créer le soin'}
            </Button>
            <Button type="button" variante="fantome" onClick={onFerme}>
              Annuler
            </Button>
          </div>
        </form>

        {/* --- Aperçu --- */}
        <aside className="lg:sticky lg:top-24 lg:h-fit">
          <h2 className="surtitre mb-3">Aperçu de la carte</h2>

          <div className="carte overflow-hidden">
            <div className="relative aspect-[4/3]">
              <Image
                src={v.image || '/soins/defaut.jpg'}
                alt=""
                fill
                sizes="340px"
                className="object-cover"
              />
              {v.populaire && (
                <span className="absolute left-3 top-3">
                  <Badge ton="clair" icone="etincelle">
                    Populaire
                  </Badge>
                </span>
              )}
            </div>

            <div className="flex flex-col gap-2.5 p-5">
              <h3 className="font-display text-[1.375rem] leading-snug text-ink">
                {v.nom || 'Nom du soin'}
              </h3>
              <p className="text-sm leading-relaxed text-muted">
                {v.resume || 'Le résumé apparaîtra ici.'}
              </p>
              <div className="mt-2 flex items-center justify-between border-t border-linesoft pt-3.5">
                <span className="inline-flex items-center gap-1.5 text-xs text-muted">
                  <Icon nom="horloge" taille={14} />
                  {duree(v.duree)}
                </span>
                <span className="font-display text-xl text-ink tabular">{prix(v.prix)}</span>
              </div>
            </div>
          </div>

          <p className="mt-3 text-xs leading-relaxed text-faint">
            L’aperçu se met à jour pendant la saisie. Il reflète exactement la carte du
            catalogue.
          </p>
        </aside>
      </div>
    </>
  );
}

/** Liste de champs texte, avec ajout et retrait. */
function ListeChamps({
  label,
  valeurs,
  onChange,
  multiligne,
  max = 8,
}: {
  label: string;
  valeurs: string[];
  onChange: (v: string[]) => void;
  multiligne?: boolean;
  max?: number;
}) {
  return (
    <div className="flex flex-col gap-2.5">
      <span className="font-sans text-[0.6875rem] uppercase tracking-[0.2em] text-muted">
        {label}
      </span>

      {/* Champs repetables. Ils partaient de `{ opacity: 0, height: 0 }` :
          on ajoutait une ligne et rien n'apparaissait. */}
      {valeurs.map((valeur, i) => (
          <div key={i} className="surgir flex items-start gap-2">
            {multiligne ? (
              <textarea
                value={valeur}
                rows={3}
                onChange={(e) => {
                  const suivant = [...valeurs];
                  suivant[i] = e.target.value;
                  onChange(suivant);
                }}
                aria-label={`${label} ${i + 1}`}
                className="w-full rounded-md bg-card px-4 py-3 text-sm text-ink ring-1 ring-inset ring-line transition-shadow duration-[140ms] focus:outline-none focus:ring-2 focus:ring-champagne"
              />
            ) : (
              <input
                value={valeur}
                onChange={(e) => {
                  const suivant = [...valeurs];
                  suivant[i] = e.target.value;
                  onChange(suivant);
                }}
                aria-label={`${label} ${i + 1}`}
                className="h-11 w-full rounded-md bg-card px-4 text-sm text-ink ring-1 ring-inset ring-line transition-shadow duration-[140ms] focus:outline-none focus:ring-2 focus:ring-champagne"
              />
            )}

            <button
              type="button"
              onClick={() => onChange(valeurs.filter((_, j) => j !== i))}
              aria-label={`Retirer ${label} ${i + 1}`}
              disabled={valeurs.length === 1}
              className="mt-1 inline-flex h-9 w-9 shrink-0 items-center justify-center rounded-md text-muted transition-colors duration-[140ms] hover:bg-danger/10 hover:text-danger disabled:pointer-events-none disabled:opacity-30"
            >
              <Icon nom="moins" taille={16} />
            </button>
          </div>
        ))}

      {valeurs.length < max && (
        <button
          type="button"
          onClick={() => onChange([...valeurs, ''])}
          className="inline-flex w-fit items-center gap-2 rounded-full px-3 py-1.5 text-xs text-champagne transition-colors duration-[140ms] hover:bg-canvas2"
        >
          <Icon nom="plus" taille={14} />
          Ajouter
        </button>
      )}
    </div>
  );
}
