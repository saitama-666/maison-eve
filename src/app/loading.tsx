import { LotusMark } from '@/components/ui/Logo';

// =====================================================================
//  Écran d'attente entre deux pages.
//
//  Volontairement minimal : un logo qui respire. Un squelette détaillé
//  serait plus « moderne », mais il faudrait le maintenir en accord avec
//  chaque page, et un squelette qui ne ressemble plus à la page qu'il
//  annonce est pire que rien.
//
//  L'animation `breathe` est lente (5,5 s) : sur un chargement rapide, on
//  ne voit qu'une image fixe, ce qui évite le clignotement.
// =====================================================================

export default function Chargement() {
  return (
    <div className="flex min-h-[70vh] items-center justify-center bg-canvas">
      <div className="flex flex-col items-center gap-4" role="status" aria-label="Chargement">
        <LotusMark taille={40} className="animate-breathe text-champagne" />
        <span className="text-[0.6875rem] uppercase tracking-[0.3em] text-faint">
          Un instant
        </span>
      </div>
    </div>
  );
}
