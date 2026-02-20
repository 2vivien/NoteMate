# NoteMate - Éditeur de Texte Collaboratif

Une interface d'éditeur de texte collaboratif simulant des interactions multi-utilisateurs en temps réel avec gestion de la latence réseau et des erreurs.

## 🎯 Objectif du Projet

Réaliser une interface d'éditeur de texte collaboratif simulant des interactions multi-utilisateurs. L'application gère des flux de données asynchrones, des états de synchronisation et une interface structurée en plusieurs panneaux.

## 📋 Spécifications Respectées

### Layout (Conforme au Cahier des Charges)
- **En-tête (Header)** : Nom du document éditable, indicateur de statut de connexion (Connecté, Synchronisation, Déconnecté), contrôles Undo/Redo
- **Panneau Latéral Gauche** : Liste des utilisateurs actifs avec avatars colorés, statuts d'écriture et compteurs d'opérations
- **Zone Centrale d'Édition** : Éditeur monospaced avec numérotation de lignes, affichage de curseurs multiples et indicateur de latence en temps réel
- **Panneau Latéral Droit** : Système d'onglets alternant entre un journal d'activité chronologique (logs des opérations) et un module de chat
- **Pied de page (Footer)** : Console de débogage affichant les statistiques système (taille du document, mode de synchronisation, latence simulée)

### Contraintes de Développement Respectées
| Contrainte | Statut | Implémentation |
|------------|--------|----------------|
| 3 utilisateurs simultanés | ✅ | Vivien, Bob, Charlie |
| Latence réseau aléatoire (100ms à 1500ms) | ✅ | `simulateNetwork.ts` |
| Gestion des erreurs (perte de paquets 1%) | ✅ | `Math.random() < 0.01` |
| Pas de re-renders globaux | ✅ | Zustand avec sélecteurs |
| Mémoïsation | ✅ | `React.memo`, `useCallback` |
| Gestion fine du DOM pour curseurs | ✅ | Framer Motion |
| Tailwind CSS | ✅ | Styling complet |
| Dark Mode | ✅ | Via `dark:` prefix |
| Responsive Design | ✅ | Mobile-first |

## 🛠️ Stack Technique

### Technologies Utilisées (Conformes au Cahier des Charges)

| Technologie | Usage | Justification |
|-------------|-------|---------------|
| **React 18** | Framework UI | Demande du cahier des charges |
| **Vite** | Build tool | Rapide, HMR instantané |
| **TypeScript** | Typage | Code robuste, pas de `any` |
| **Tailwind CSS** | Styling | Styling rapide, responsive, dark mode facile |
| **shadcn/ui** | Composants UI | Tabs, Sidebar, Avatars, Tooltips prêts à l'emploi |
| **Framer Motion** | Animations | Animations curseurs, notifications |
| **Zustand** | State management | Léger, updates ciblées sans re-render global |
| **Monaco Editor** | Éditeur | Monospace, curseurs multiples, numérotation lignes |

## 📁 Architecture du Projet

```
/src
 ├─ /components           # Composants UI
 │    ├─ Header.tsx       # En-tête avec statut connexion, undo/redo
 │    ├─ UsersSidebar.tsx # Liste des utilisateurs actifs
 │    ├─ EditorPanel.tsx  # Zone d'édition Monaco
 │    ├─ LogsChatPanel.tsx# Panneau logs + chat
 │    ├─ FooterConsole.tsx# Console de débogage
 │    └─ /ui              # Composants shadcn réutilisables
 │
 ├─ /features             # Feature-centric (store + logique)
 │    ├─ /editor/useEditorStore.ts    # État éditeur, contenu, curseurs
 │    ├─ /users/useUsersStore.ts      # Liste utilisateurs, typing
 │    ├─ /chat/useChatStore.ts        # Messages du chat
 │    ├─ /logs/useLogsStore.ts        # Journal d'activité
 │    ├─ /network/useNetworkStore.ts  # État réseau, latence, connexion
 │    └─ /theme/useThemeStore.ts      # Dark/Light mode
 │
 ├─ /hooks                # Hooks personnalisés
 │    ├─ useSimulatedUsers.ts         # Simulation multi-users, latence, packet loss
 │    ├─ useSessionTimer.ts           # Timer de session
 │    └─ use-mobile.ts                # Détection mobile
 │
 ├─ /lib                  # Utilitaires
 │    ├─ simulateNetwork.ts           # Fonction de simulation réseau
 │    ├─ constants.ts                 # Constantes du projet
 │    └─ utils.ts                     # Utilitaires divers
 │
 └─ /types                # Types TypeScript
      └─ index.ts                    # Types globaux (User, Cursor, Log, etc.)
```

## 🧩 Modularité du Code

### Règles Strictes Appliquées (Conformes au Cahier des Charges)

| Règle | Application |
|-------|-------------|
| **Max 80 lignes par composant** | ✅ Chaque composant est découpé si nécessaire |
| **Pas de spaghetti code** | ✅ Logique séparée dans les stores et hooks |
| **Une responsabilité par fichier** | ✅ Chaque fichier a un seul rôle |
| **Props typées** | ✅ TypeScript strict, pas de `any` |
| **Composants stateless** | ✅ UI uniquement, logique dans les stores |
| **Fonctions ≤ 20 lignes** | ✅ Fonctions courtes et claires |
| **Pas de magic numbers** | ✅ Constantes dans `constants.ts` |
| **Pas de code mort** | ✅ Code propre sans `console.log` inutiles |

## 🎨 Utilisation de shadcn/ui

### Composants Utilisés

| Composant | Usage | Fichier |
|-----------|-------|---------|
| `Tabs` | Onglets Logs/Chat | `LogsChatPanel.tsx` |
| `Badge` | Compteurs d'opérations | `UsersSidebar.tsx` |
| `Button` | Undo/Redo, Publier | `Header.tsx` |
| `Input` | Chat, Nom document | `Header.tsx`, `LogsChatPanel.tsx` |
| `Slider` | Délai simulé | `FooterConsole.tsx` |
| `ScrollArea` | Scroll logs/chat | `LogsChatPanel.tsx` |

### Pourquoi shadcn/ui ?

1. **Accessibilité** : Composants ARIA-compliant
2. **Personnalisable** : Code source dans le projet
3. **Tailwind natif** : Intégration parfaite
4. **Dark mode** : Support natif via `dark:`

## 🎬 Utilisation de Framer Motion

### Animations Implémentées

| Animation | Fichier | Description |
|-----------|---------|-------------|
| **Curseurs utilisateurs** | `EditorPanel.tsx` | Mouvement fluide des curseurs |
| **Logs** | `LogsChatPanel.tsx` | Apparition/disparition des logs |
| **Messages chat** | `LogsChatPanel.tsx` | Slide-in des nouveaux messages |
| **Statut connexion** | `Header.tsx` | Transition du badge de statut |
| **Popup déconnexion** | `Header.tsx` | Animation d'ouverture/fermeture |

## 💬 Gestion du Chat

### Architecture

```
useChatStore.ts (Store)
     ↓
LogsChatPanel.tsx (UI)
     ↓
useSimulatedUsers.ts (Simulation messages bots)
```

### Fonctionnalités

1. **Messages en temps réel** : Ajout via `addMessage()`
2. **Compteur non-lus** : Badge sur l'onglet Chat
3. **Auto-scroll** : Scroll automatique vers le bas
4. **Simulation bots** : Bob et Charlie envoient des messages automatiques

## 🔌 Gestion de la Déconnexion

### États de Connexion

| État | Indicateur | Comportement |
|------|------------|--------------|
| **Connecté** | Badge vert "CONNECTÉ" | Tout fonctionne |
| **Synchronisation** | Badge bleu "SYNCHRONISATION..." | En cours de sync |
| **Déconnecté** | Badge rouge "DÉCONNECTÉ" | Mode hors ligne |

### Effets de la Déconnexion

- Logs cachés
- Chat désactivé
- Curseurs bots cachés
- Bannière d'avertissement éditeur
- Indicateur réseau "HORS LIGNE"

## 📡 Simulation Réseau

### Fonction de Simulation

```typescript
// lib/simulateNetwork.ts
export const simulateNetwork = <T>(
  fn: () => T,
  options: { latency?: number; packetLoss?: number } = {}
): Promise<T> => {
  const latency = getRandomLatency(100, 1500); // 100ms à 1500ms
  const packetLoss = 0.01; // 1%

  return new Promise((resolve, reject) => {
    setTimeout(() => {
      const isDropped = Math.random() < packetLoss;
      if (isDropped) {
        reject(new Error('Packet dropped'));
      } else {
        resolve(fn());
      }
    }, latency);
  });
};
```

### Constantes

```typescript
// lib/constants.ts
export const MIN_LATENCY = 100;      // ms
export const MAX_LATENCY = 1500;     // ms
export const PACKET_LOSS_RATE = 0.01; // 1%
```

## 📊 Stores Zustand

### Pourquoi Zustand ?

| Critère | Zustand | Autres |
|---------|---------|--------|
| **Re-render global** | ❌ Non (sélecteurs) | Context API : Oui |
| **Boilerplate** | ✅ Minimal | Redux : Important |
| **Taille bundle** | ✅ ~1KB | Redux : ~7KB |

### Stores par Feature

| Store | Responsabilité |
|-------|----------------|
| `useEditorStore` | Contenu, curseurs, undo/redo |
| `useUsersStore` | Liste utilisateurs, typing |
| `useChatStore` | Messages du chat |
| `useLogsStore` | Journal d'activité |
| `useNetworkStore` | Connexion, latence |
| `useThemeStore` | Dark/Light mode |

## 🌙 Dark Mode

Implémenté via Tailwind CSS avec `dark:` prefix et un store Zustand dédié.

## 📱 Responsive Design

- **Mobile-first** avec Tailwind CSS
- **Breakpoints** : `sm:`, `md:`, `lg:`
- **Hook de détection** : `use-mobile.ts`

## 🚀 Installation

```bash
# Cloner le projet
git clone https://github.com/2vivien/NoteMate.git
cd NoteMate

# Installer les dépendances
npm install

# Lancer en développement
npm run dev

# Build production
npm run build
```

## 📦 Dépendances Principales

```json
{
  "dependencies": {
    "react": "^18.3.1",
    "react-dom": "^18.3.1",
    "zustand": "^4.5.0",
    "framer-motion": "^11.0.0",
    "@monaco-editor/react": "^4.6.0",
    "lucide-react": "^0.475.0",
    "tailwindcss": "^3.4.0"
  }
}
```

## 👤 Auteur

**Vivien** - [GitHub](https://github.com/2vivien)

---

*Projet réalisé conformément au cahier des charges pour démontrer les compétences en React, TypeScript, et simulation de systèmes distribués.*
