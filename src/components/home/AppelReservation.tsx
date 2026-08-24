import { Bandeau } from '@/components/motion/Effets';
import { Reveal } from '@/components/motion/Reveal';
import { BandeauImage } from '@/components/ui/BandeauImage';
import { Button } from '@/components/ui/Button';
import { Icon } from '@/components/ui/Icon';
import { LotusMark } from '@/components/ui/Logo';
import { contact } from '@/data/site';

// =====================================================================
//  Dernier appel à réserver — le pied de page de la page d'accueil.
//
//  Le bouton est « aimanté » : il suit légèrement le curseur quand on
//  l'approche. C'est le SEUL bouton du site à l'être. L'effet fonctionne
//  parce qu'il est rare — appliqué partout, il devient du bruit et rend
//  l'interface fuyante.
// =====================================================================

/** Les mots du bandeau défilant. */
const MOTS = [
  'Massage traditionnel',
  'Hammam',
  'Huile d’argan',
  'Soin du visage',
  'Ghassoul',
  'À domicile',
  'Pierres chaudes',
  'Eau de rose',
];

export function AppelReservation() {
  return (
    <>
      {/* --- Bandeau défilant --- */}
      <div className="border-y border-line bg-canvas2 py-5">
        <Bandeau vitesse={46}>
          {MOTS.map((m) => (
            <span key={m} className="flex shrink-0 items-center gap-12">
              <span className="whitespace-nowrap font-display text-2xl text-inksoft sm:text-3xl">
                {m}
              </span>
              <LotusMark taille={16} className="shrink-0 text-champagne" />
            </span>
          ))}
        </Bandeau>
      </div>

      {/* --- Appel final --- */}
      <BandeauImage src="/bandeaux/reservation.svg" hauteur="haut" voile="fort">
        <Reveal className="flex flex-col items-center text-center">
          <span className="surtitre text-champagnesoft">Prendre rendez-vous</span>

          <h2 className="mt-6 max-w-2xl font-display text-[2.5rem] leading-[1.05] text-onshell sm:text-[3.5rem] lg:text-[4rem]">
            Offrez-vous <span className="script text-champagnesoft">une heure</span> pour vous
          </h2>

          <p className="mt-6 max-w-lg text-[0.9375rem] leading-relaxed text-onshell">
            Réservation en ligne en deux minutes. On confirme votre créneau dans la journée,
            et vous ne réglez qu’après le soin.
          </p>

          <div className="mt-10 flex flex-col items-center gap-4 sm:flex-row">
            <Button href="/reservation" variante="clair" taille="lg" fleche>
              Réserver maintenant
            </Button>

            <a
              href={`tel:${contact.phoneHref}`}
              className="inline-flex items-center gap-2.5 text-sm text-onshell transition-colors duration-[140ms] hover:text-onshell"
            >
              <Icon nom="telephone" taille={16} />
              ou appelez-nous : {contact.phone}
            </a>
          </div>
        </Reveal>
      </BandeauImage>
    </>
  );
}
