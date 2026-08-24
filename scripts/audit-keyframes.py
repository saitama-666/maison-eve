# -*- coding: utf-8 -*-
"""
Cherche, dans globals.css, toute animation dont l'image de DEPART masque
son element.

Regle du projet : si l'animation ne se joue jamais, le contenu doit rester
lisible. Une propriete masquante dans un bloc `from` / `0%` viole cette
regle, quel que soit le langage qui la porte.
"""
import io, re, sys

import os
p = os.path.join(os.path.dirname(os.path.abspath(__file__)), '..', 'src', 'app', 'globals.css')
s = io.open(p, encoding='utf-8').read()

# --- 1. Recolte des @keyframes ---------------------------------------
blocs = {}
for m in re.finditer(r'@keyframes\s+([\w-]+)\s*\{', s):
    nom = m.group(1)
    i = m.end()
    prof = 1
    while i < len(s) and prof:
        if s[i] == '{':
            prof += 1
        elif s[i] == '}':
            prof -= 1
        i += 1
    blocs[nom] = s[m.end():i - 1]

print('%d @keyframes analysees\n' % len(blocs))


def etapes_depart(corps):
    """Rend le contenu des blocs `from` / `0%`."""
    out = []
    for m in re.finditer(r'(^|\})\s*([^{}]+?)\s*\{([^{}]*)\}', corps):
        selecteurs = [x.strip() for x in m.group(2).split(',')]
        if any(x in ('from', '0%') for x in selecteurs):
            out.append(m.group(3))
    return out


MASQUANT = [
    (re.compile(r'opacity\s*:\s*(0|0?\.0*[0-4]\d*)\s*[;}]'), 'opacity quasi nulle'),
    (re.compile(r'visibility\s*:\s*hidden'), 'visibility: hidden'),
    (re.compile(r'clip-path\s*:\s*inset\([^)]*?(?:[5-9]\d|100)%'), 'clip-path qui decoupe la majorite'),
    (re.compile(r'scale\(\s*0?\.[0-2]\d*\s*\)'), 'scale tres reduit'),
    (re.compile(r'scaleX\(\s*0\s*\)'), 'scaleX(0)'),
    (re.compile(r'translate3d\([^)]*?(?:[5-9]\d|\d{3,})(?:px|%)'), 'translation superieure a 50px/%'),
    (re.compile(r'stroke-dashoffset\s*:\s*[1-9]'), 'trace SVG non dessine'),
]

# Animations dont l'etat masquant est ASSUME et documente.
TOLEREES = {
    'volet-fermer': 'sortie : finit cachee puis se demonte',
    'voile-entrer': 'pseudo-element decoratif, ne porte aucun contenu',
    'coche-tracer': 'coche decorative, l information est portee par le texte a cote',
    'marquee': 'bandeau defilant en boucle',
    'marquee-reverse': 'bandeau defilant en boucle',
    'pulse-ring': 'halo decoratif en boucle',
    'breathe': 'respiration decorative en boucle',
    'shimmer': 'reflet decoratif en boucle',
    'reveler': 'sous @supports (animation-timeline) — pilotee par le defilement',
    'reveler-zoom': 'idem',
    'reveler-gauche': 'idem',
    'reveler-droite': 'idem',
    'reveler-rideau': 'idem',
    'mot-monter': 'idem',
    'progression': 'barre de progression pilotee par le defilement',
    'filet-tracer': 'filet decoratif pilote par le defilement',
    'parallaxe': 'fond decoratif pilote par le defilement',
}

problemes = []
for nom in sorted(blocs):
    for corps in etapes_depart(blocs[nom]):
        for motif, libelle in MASQUANT:
            if motif.search(corps):
                problemes.append((nom, libelle, ' '.join(corps.split())))

if not problemes:
    print('Aucune image de depart masquante. OK')
    sys.exit(0)

graves = [x for x in problemes if x[0] not in TOLEREES]
tolerees = [x for x in problemes if x[0] in TOLEREES]

if tolerees:
    print('--- Masquantes ASSUMEES (%d) ---' % len(tolerees))
    for nom, libelle, corps in tolerees:
        print('  %-18s %-34s  %s' % (nom, libelle, TOLEREES[nom]))
    print()

if graves:
    print('--- A CORRIGER (%d) ---' % len(graves))
    for nom, libelle, corps in graves:
        print('  !! %-18s %s' % (nom, libelle))
        print('     %s' % corps)
    sys.exit(1)

print('Aucune animation masquante non assumee. OK')
