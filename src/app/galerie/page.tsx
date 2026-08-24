import type { Metadata } from 'next';

import { AppelReservation } from '@/components/home/AppelReservation';
import { GalerieComplete } from '@/components/galerie/GalerieComplete';
import { EnTetePage } from '@/components/layout/EnTetePage';
import { Button } from '@/components/ui/Button';
import { Encart } from '@/components/ui/Bits';

export const metadata: Metadata = {
  title: 'Galerie — l’institut en images',
  description:
    'La cabine de soin, le hammam, les huiles et les produits que nous utilisons. ' +
    'Pour savoir où vous mettez les pieds avant de réserver.',
  alternates: { canonical: '/galerie' },
};

export default function PageGalerie() {
  return (
    <>
      <EnTetePage
        surtitre="En images"
        titre={
          <>
            Nos <span className="italic text-champagnesoft">instants</span>
          </>
        }
        texte="La cabine, le hammam, les huiles. Aucune surprise en poussant la porte."
        image="/galerie/hammam.svg"
        filAriane={[{ label: 'Galerie' }]}
        action={
          <Button href="/reservation" variante="clair" fleche>
            Réserver un soin
          </Button>
        }
      />

      {/* ⚠️  Cet encart est temporaire et DOIT disparaître avec les vraies
          photos. Il est là parce que les visuels actuels sont des
          illustrations générées, pas des photographies de l'institut :
          laisser croire le contraire serait trompeur. Voir PROGRESS.md §11. */}
      <div className="bg-canvas pt-12">
        <div className="mx-auto max-w-[1400px] px-5 sm:px-8">
          <Encart ton="attention" titre="Visuels provisoires">
            Les images ci-dessous sont des illustrations, en attendant les photographies de
            l’institut. Elles ne représentent pas les lieux réels.
          </Encart>
        </div>
      </div>

      <GalerieComplete />
      <AppelReservation />
    </>
  );
}
