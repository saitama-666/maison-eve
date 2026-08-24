'use client';

import { useCallback, useEffect, useState } from 'react';

import { TitreCompte } from '@/components/compte/CadreCompte';
import { Badge, Encart, EtatVide, Squelette } from '@/components/ui/Bits';
import { Button } from '@/components/ui/Button';
import { Case, Champ, Liste, ZoneTexte } from '@/components/ui/Field';
import { Icon } from '@/components/ui/Icon';
import {
  adresseVide,
  ajouterAdresse,
  listerAdresses,
  modifierAdresse,
  supprimerAdresse,
  type Adresse,
  type NouvelleAdresse,
} from '@/lib/addresses';
import { useAuth } from '@/lib/auth-context';
import { messageErreur } from '@/lib/firebase/errors';
import { useToast } from '@/lib/toast';
import { estValide, validerAdresse, type ChampsAdresse, type Erreurs } from '@/lib/validation';
import { cn } from '@/lib/utils';

// =====================================================================
//  Carnet d'adresses.
//
//  Une adresse sert à deux choses, et la distinction est explicite dans
//  l'interface parce qu'elle ne va pas de soi pour la cliente :
//   · FACTURATION — celle qui figure sur le reçu ;
//   · SOIN — là où la praticienne se déplace.
//  Le plus souvent les deux sont identiques : `les-deux` est la valeur
//  par défaut.
//
//  ⚠️  RIEN DE BANCAIRE ICI, ET ON LE DIT.
//      « Adresse de facturation » fait spontanément penser à une carte.
//      L'encart en haut de page lève le doute — sans lui, une partie des
//      gens n'enregistre rien par méfiance. Le garde-fou technique, lui,
//      est posé trois fois : dans `preparer()` côté client, dans les
//      règles Firestore, et dans les routes API.
// =====================================================================

export function CarnetAdresses() {
  const { user } = useAuth();
  const toast = useToast();

  const [adresses, setAdresses] = useState<Adresse[]>([]);
  const [chargement, setChargement] = useState(true);
  const [edition, setEdition] = useState<{ id: string | null; valeurs: NouvelleAdresse } | null>(
    null,
  );
  const [aSupprimer, setASupprimer] = useState<string | null>(null);

  const recharger = useCallback(async () => {
    if (!user) return;
    setChargement(true);
    try {
      setAdresses(await listerAdresses(user.uid));
    } catch (err) {
      toast.erreur(messageErreur(err));
    } finally {
      setChargement(false);
    }
  }, [user, toast]);

  useEffect(() => {
    void recharger();
    // `recharger` dépend de `toast`, qui est mémoïsé par son fournisseur ;
    // la dépendance est donc stable.
  }, [recharger]);

  async function enregistrer(valeurs: NouvelleAdresse, id: string | null) {
    if (!user) return;
    try {
      if (id) {
        await modifierAdresse(user.uid, id, valeurs);
        toast.succes('Adresse mise à jour.');
      } else {
        await ajouterAdresse(user.uid, valeurs);
        toast.succes('Adresse enregistrée.');
      }
      setEdition(null);
      await recharger();
    } catch (err) {
      toast.erreur(messageErreur(err));
    }
  }

  async function supprimer(id: string) {
    if (!user) return;
    try {
      await supprimerAdresse(user.uid, id);
      setASupprimer(null);
      toast.succes('Adresse supprimée.');
      await recharger();
    } catch (err) {
      toast.erreur(messageErreur(err));
    }
  }

  return (
    <>
      <TitreCompte
        titre="Mes adresses"
        texte="Pour ne plus les ressaisir à chaque réservation."
        action={
          !edition && (
            <Button onClick={() => setEdition({ id: null, valeurs: adresseVide() })} fleche>
              Ajouter une adresse
            </Button>
          )
        }
      />

      <Encart ton="info" titre="Aucune donnée bancaire" className="mb-8">
        Une « adresse de facturation » est une adresse postale : celle qui figure sur votre
        reçu. Ce site ne demande, ne traite et ne conserve aucun moyen de paiement — le
        règlement se fait sur place, après le soin.
      </Encart>

      {/* --- Formulaire --- */}
        {edition && (
          <div
            className="surgir mb-8 overflow-hidden"
          >
            <FormulaireAdresse
              valeursInitiales={edition.valeurs}
              modeEdition={edition.id !== null}
              onAnnuler={() => setEdition(null)}
              onEnregistrer={(v) => enregistrer(v, edition.id)}
            />
          </div>
        )}

      {/* --- Liste --- */}
      {chargement ? (
        <div className="grid gap-4 sm:grid-cols-2">
          {[0, 1].map((i) => (
            <Squelette key={i} className="h-52" />
          ))}
        </div>
      ) : adresses.length === 0 && !edition ? (
        <EtatVide
          icone="position"
          titre="Aucune adresse enregistrée"
          texte="Ajoutez-en une pour réserver un soin à domicile en deux clics la prochaine fois."
          action={
            <Button onClick={() => setEdition({ id: null, valeurs: adresseVide() })} fleche>
              Ajouter une adresse
            </Button>
          }
        />
      ) : (
        <div className="grid gap-4 sm:grid-cols-2">
            {adresses.map((a) => (
              <article key={a.id} className="surgir carte flex flex-col gap-3 p-5">
                <div className="flex items-start justify-between gap-3">
                  <h2 className="font-display text-xl text-ink">
                    {a.label || `${a.city}`}
                  </h2>

                  <div className="flex shrink-0 gap-1">
                    <button
                      type="button"
                      onClick={() => setEdition({ id: a.id, valeurs: a })}
                      aria-label={`Modifier l’adresse ${a.label || a.city}`}
                      className="inline-flex h-8 w-8 items-center justify-center rounded-md text-muted transition-colors duration-[140ms] hover:bg-canvas2 hover:text-ink"
                    >
                      <Icon nom="crayon" taille={15} />
                    </button>
                    <button
                      type="button"
                      onClick={() => setASupprimer(a.id)}
                      aria-label={`Supprimer l’adresse ${a.label || a.city}`}
                      className="inline-flex h-8 w-8 items-center justify-center rounded-md text-muted transition-colors duration-[140ms] hover:bg-danger/10 hover:text-danger"
                    >
                      <Icon nom="poubelle" taille={15} />
                    </button>
                  </div>
                </div>

                <div className="flex flex-wrap gap-1.5">
                  {a.isDefaultBilling && (
                    <Badge ton="champagne" icone="check">
                      Facturation par défaut
                    </Badge>
                  )}
                  {a.isDefaultService && (
                    <Badge ton="champagne" icone="check">
                      Soin par défaut
                    </Badge>
                  )}
                  <Badge>
                    {a.type === 'les-deux'
                      ? 'Facturation et soin'
                      : a.type === 'facturation'
                        ? 'Facturation'
                        : 'Soin à domicile'}
                  </Badge>
                </div>

                <address className="text-sm not-italic leading-relaxed text-muted">
                  {a.firstName} {a.lastName}
                  <br />
                  {a.line1}
                  {a.line2 && (
                    <>
                      <br />
                      {a.line2}
                    </>
                  )}
                  <br />
                  {[a.postalCode, a.city].filter(Boolean).join(' ')}
                  {a.region && `, ${a.region}`}
                  <br />
                  {a.country}
                </address>

                <p className="flex items-center gap-2 text-sm text-muted">
                  <Icon nom="telephone" taille={14} className="text-champagne" />
                  {a.phone}
                </p>

                {a.notes && (
                  <p className="rounded-md bg-canvas2 px-3 py-2 text-xs leading-relaxed text-muted">
                    {a.notes}
                  </p>
                )}

                {/* --- Confirmation de suppression, en ligne ---
                    Une fenêtre modale pour supprimer une adresse est
                    disproportionnée ; elle vole le focus et arrête tout.
                    Ici la confirmation apparaît dans la carte concernée. */}
                  {aSupprimer === a.id && (
                    <div
                      className="surgir overflow-hidden"
                    >
                      <div className="flex flex-col gap-3 border-t border-line pt-3">
                        <p className="text-sm text-ink">Supprimer cette adresse ?</p>
                        <div className="flex gap-2">
                          <Button taille="sm" variante="danger" onClick={() => supprimer(a.id)}>
                            Supprimer
                          </Button>
                          <Button
                            taille="sm"
                            variante="fantome"
                            onClick={() => setASupprimer(null)}
                          >
                            Annuler
                          </Button>
                        </div>
                      </div>
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
//  Formulaire d'adresse
// =====================================================================

function FormulaireAdresse({
  valeursInitiales,
  modeEdition,
  onAnnuler,
  onEnregistrer,
}: {
  valeursInitiales: NouvelleAdresse;
  modeEdition: boolean;
  onAnnuler: () => void;
  onEnregistrer: (v: NouvelleAdresse) => Promise<void>;
}) {
  const [v, setV] = useState<NouvelleAdresse>(valeursInitiales);
  const [erreurs, setErreurs] = useState<Erreurs<ChampsAdresse>>({});
  const [envoi, setEnvoi] = useState(false);

  function maj<K extends keyof NouvelleAdresse>(cle: K, valeur: NouvelleAdresse[K]) {
    setV((x) => ({ ...x, [cle]: valeur }));
    setErreurs((e) => {
      const k = cle as keyof ChampsAdresse;
      if (!e[k]) return e;
      const suivant = { ...e };
      delete suivant[k];
      return suivant;
    });
  }

  async function soumettre(e: React.FormEvent) {
    e.preventDefault();

    const trouvees = validerAdresse({
      label: v.label,
      type: v.type,
      firstName: v.firstName,
      lastName: v.lastName,
      phone: v.phone,
      line1: v.line1,
      line2: v.line2,
      city: v.city,
      postalCode: v.postalCode,
      region: v.region,
      country: v.country,
      notes: v.notes,
    });

    setErreurs(trouvees);
    if (!estValide(trouvees)) return;

    setEnvoi(true);
    try {
      await onEnregistrer(v);
    } finally {
      setEnvoi(false);
    }
  }

  return (
    <form onSubmit={soumettre} className="carte flex flex-col gap-5 p-6" noValidate>
      <h2 className="font-display text-2xl text-ink">
        {modeEdition ? 'Modifier l’adresse' : 'Nouvelle adresse'}
      </h2>

      <div className="grid gap-4 sm:grid-cols-2">
        <Champ
          label="Nom de l’adresse"
          value={v.label}
          onChange={(e) => maj('label', e.target.value)}
          erreur={erreurs.label}
          facultatif
          aide="« Maison », « Bureau »…"
        />

        <Liste
          label="Cette adresse sert à"
          value={v.type}
          onChange={(e) => maj('type', e.target.value as NouvelleAdresse['type'])}
          options={[
            { valeur: 'les-deux', label: 'Facturation et soin à domicile' },
            { valeur: 'facturation', label: 'Facturation seulement' },
            { valeur: 'soin', label: 'Soin à domicile seulement' },
          ]}
        />

        <Champ
          label="Prénom"
          value={v.firstName}
          onChange={(e) => maj('firstName', e.target.value)}
          erreur={erreurs.firstName}
          autoComplete="given-name"
        />
        <Champ
          label="Nom"
          value={v.lastName}
          onChange={(e) => maj('lastName', e.target.value)}
          erreur={erreurs.lastName}
          autoComplete="family-name"
        />
      </div>

      <Champ
        label="Téléphone"
        type="tel"
        value={v.phone}
        onChange={(e) => maj('phone', e.target.value)}
        erreur={erreurs.phone}
        autoComplete="tel"
        aide="Pour vous prévenir en cas d’imprévu."
      />

      <Champ
        label="Rue et numéro"
        value={v.line1}
        onChange={(e) => maj('line1', e.target.value)}
        erreur={erreurs.line1}
        autoComplete="address-line1"
      />

      <Champ
        label="Complément"
        value={v.line2}
        onChange={(e) => maj('line2', e.target.value)}
        erreur={erreurs.line2}
        facultatif
        autoComplete="address-line2"
        aide="Étage, code, interphone."
      />

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <Champ
          label="Ville"
          value={v.city}
          onChange={(e) => maj('city', e.target.value)}
          erreur={erreurs.city}
          autoComplete="address-level2"
        />
        <Champ
          label="Code postal"
          value={v.postalCode}
          onChange={(e) => maj('postalCode', e.target.value)}
          erreur={erreurs.postalCode}
          facultatif
          autoComplete="postal-code"
        />
        <Champ
          label="Région"
          value={v.region}
          onChange={(e) => maj('region', e.target.value)}
          facultatif
          autoComplete="address-level1"
        />
        <Champ
          label="Pays"
          value={v.country}
          onChange={(e) => maj('country', e.target.value)}
          erreur={erreurs.country}
          autoComplete="country-name"
        />
      </div>

      <ZoneTexte
        label="Précisions pour la praticienne"
        value={v.notes}
        onChange={(e) => maj('notes', e.target.value)}
        erreur={erreurs.notes}
        facultatif
        rows={3}
        compteur={400}
        aide="Accès, stationnement, animal à la maison, étage sans ascenseur…"
      />

      <div className="flex flex-col gap-3 border-t border-line pt-5">
        <Case
          label="Adresse de facturation par défaut"
          coche={v.isDefaultBilling}
          onChange={(c) => maj('isDefaultBilling', c)}
        />
        <Case
          label="Adresse par défaut pour les soins à domicile"
          coche={v.isDefaultService}
          onChange={(c) => maj('isDefaultService', c)}
        />
      </div>

      <div className={cn('flex flex-col gap-3 pt-1 sm:flex-row')}>
        <Button type="submit" chargement={envoi} fleche>
          {modeEdition ? 'Enregistrer' : 'Ajouter l’adresse'}
        </Button>
        <Button type="button" variante="fantome" onClick={onAnnuler}>
          Annuler
        </Button>
      </div>
    </form>
  );
}
