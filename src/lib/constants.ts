// Network simulation constants
export const MIN_LATENCY = 1000;
export const MAX_LATENCY = 1500;
export const PACKET_LOSS_RATE = 0.01; // 1%
export const DEFAULT_ACK_RATE = 99.9;

// User simulation constants
export const SIMULATED_USERS = 3;
export const USER_ACTION_INTERVAL_MIN = 2000;
export const USER_ACTION_INTERVAL_MAX = 8000;
export const TYPING_DURATION_MIN = 1500;
export const TYPING_DURATION_MAX = 4000;

// Editor constants
export const DEFAULT_DOCUMENT_NAME = 'notes_de_reunion.docx';
export const DEFAULT_CONTENT = `# Lancement du Projet : NoteMate V2

**Date :** 19 Février 2026
**Participants :** Vivien, Bob, Charlie
**Sujet :** Fonctionnalités de collaboration en temps réel

## 1. Ordre du jour
- [ ] Revoir les besoins principaux
- [ ] Discuter de l'architecture technique
- [ ] Assigner les premières tâches

## 2. Notes de discussion
* L'équipe est d'accord pour une architecture décentralisée.
* La gestion de la latence est la priorité n°1 pour l'expérience utilisateur.

## 3. Actions à entreprendre
1. Rechercher OT vs CRDT (Bob)
2. Créer le nouveau design de l'UI (Vivien)
3. Configurer le serveur websocket (Charlie)

---
*Notes prises par Vivien*`;

// User presets for simulation
export const PRESET_USERS = [
  {
    id: 'user-vivien',
    name: 'Vivien',
    color: '#10b981', // emerald
    avatar: 'FLAT_DESIGN',
  },
  {
    id: 'user-bob',
    name: 'Bob',
    color: '#f59e0b', // amber
    avatar: 'FLAT_DESIGN',
  },
  {
    id: 'user-charlie',
    name: 'Charlie',
    color: '#8b5cf6', // violet
    avatar: 'FLAT_DESIGN',
  },
];

// Session constants
export const SESSION_ID = '#AF92-K921';

// Theme constants
export const THEME_LIGHT = 'light';
export const THEME_DARK = 'dark';
