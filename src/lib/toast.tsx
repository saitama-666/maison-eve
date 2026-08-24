'use client';

import {
  createContext,
  useCallback,
  useContext,
  useMemo,
  useRef,
  useState,
  type ReactNode,
} from 'react';


// =====================================================================
//  Messages éphémères.
//
//  Un seul point d'entrée : `const { succes, erreur } = useToast()`.
//
//  Accessibilité : le conteneur porte `role="status"` et
//  `aria-live="polite"`. Un lecteur d'écran annonce donc le message sans
//  interrompre ce que la personne est en train de faire. `assertive`
//  serait plus agressif et couperait la lecture en cours — réservé aux
//  vraies urgences, ce qu'un « Adresse enregistrée » n'est pas.
// =====================================================================

type Ton = 'succes' | 'erreur' | 'info';

type Message = {
  id: number;
  ton: Ton;
  texte: string;
};

type Contexte = {
  succes: (texte: string) => void;
  erreur: (texte: string) => void;
  info: (texte: string) => void;
};

const ToastContext = createContext<Contexte | null>(null);

const DUREE_AFFICHAGE = 4200;

export function ToastProvider({ children }: { children: ReactNode }) {
  const [messages, setMessages] = useState<Message[]>([]);
  const compteur = useRef(0);

  const pousser = useCallback((ton: Ton, texte: string) => {
    compteur.current += 1;
    const id = compteur.current;

    setMessages((liste) => {
      // Au-delà de trois, on empile sans fin et on masque le contenu.
      const suivant = [...liste, { id, ton, texte }];
      return suivant.slice(-3);
    });

    setTimeout(() => {
      setMessages((liste) => liste.filter((m) => m.id !== id));
    }, DUREE_AFFICHAGE);
  }, []);

  const valeur = useMemo<Contexte>(
    () => ({
      succes: (t: string) => pousser('succes', t),
      erreur: (t: string) => pousser('erreur', t),
      info: (t: string) => pousser('info', t),
    }),
    [pousser],
  );

  return (
    <ToastContext.Provider value={valeur}>
      {children}

      <div
        role="status"
        aria-live="polite"
        className="pointer-events-none fixed inset-x-0 bottom-0 z-[300] flex flex-col items-center gap-2 p-4 sm:items-end sm:p-6"
      >
        {/*
          Un toast porte souvent la seule explication d'un échec
          (« Ce créneau vient d'être pris »). Il partait de `opacity: 0`
          sous Framer : sans boucle d'animation, le message n'apparaissait
          jamais et l'action semblait n'avoir aucun effet.

          `.surgir` ne fait que le décaler de 14 px vers le haut.
        */}
        {messages.map((m) => (
            <div
              key={m.id}
              className={[
                'surgir',
                'pointer-events-auto flex max-w-sm items-start gap-3 rounded-lg px-4 py-3 text-sm shadow-lift',
                m.ton === 'succes' && 'bg-ink text-oncream',
                m.ton === 'erreur' && 'bg-danger text-white',
                m.ton === 'info' && 'bg-card text-ink ring-1 ring-line',
              ]
                .filter(Boolean)
                .join(' ')}
            >
              <span aria-hidden className="mt-0.5 shrink-0">
                {m.ton === 'succes' && (
                  <svg width="16" height="16" viewBox="0 0 16 16" fill="none">
                    <path
                      className="trace-coche"
                      d="M3 8.5L6.2 11.5L13 4.5"
                      stroke="currentColor"
                      strokeWidth="1.6"
                      strokeLinecap="round"
                      strokeLinejoin="round"
                    />
                  </svg>
                )}
                {m.ton === 'erreur' && (
                  <svg width="16" height="16" viewBox="0 0 16 16" fill="none">
                    <path d="M8 4.5V9" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" />
                    <circle cx="8" cy="11.6" r="0.9" fill="currentColor" />
                  </svg>
                )}
                {m.ton === 'info' && (
                  <svg width="16" height="16" viewBox="0 0 16 16" fill="none">
                    <circle cx="8" cy="8" r="6.2" stroke="currentColor" strokeWidth="1.3" />
                    <path d="M8 7.4V11" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
                    <circle cx="8" cy="5.2" r="0.8" fill="currentColor" />
                  </svg>
                )}
              </span>
              <span className="leading-snug">{m.texte}</span>
            </div>
          ))}
      </div>
    </ToastContext.Provider>
  );
}

export function useToast(): Contexte {
  const ctx = useContext(ToastContext);
  if (!ctx) {
    throw new Error('useToast doit être utilisé à l’intérieur de <ToastProvider>.');
  }
  return ctx;
}
