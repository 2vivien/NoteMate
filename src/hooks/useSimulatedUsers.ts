import { useEffect, useRef, useCallback } from 'react';
import { useUsersStore } from '@/features/users/useUsersStore';
import { useEditorStore } from '@/features/editor/useEditorStore';
import { useLogsStore } from '@/features/logs/useLogsStore';
import { useChatStore } from '@/features/chat/useChatStore';
import { useNetworkStore } from '@/features/network/useNetworkStore';
import { getRandomLatency, simulateNetwork } from '@/lib/simulateNetwork';

// --- CONFIGURATION DES PERSONNALITÉS ---
const BOTS = {
  bob: { id: 'user-bob', name: 'Bob', color: '#f59e0b' },
  charlie: { id: 'user-charlie', name: 'Charlie', color: '#8b5cf6' }
};

// Conversations entre Bob et Charlie
const BOB_CHARLIE_CONVERSATIONS = [
  { speaker: 'bob', message: "Charlie, as-tu vu la dernière mise à jour de l'éditeur ?" },
  { speaker: 'charlie', message: "Oui Bob, l'intégration Monaco est vraiment fluide !" },
  { speaker: 'bob', message: "Je travaille sur l'optimisation du stockage local." },
  { speaker: 'charlie', message: "Super ! Moi je peaufine les composants UI." },
  { speaker: 'bob', message: "Vivien a fait du super travail sur la synchronisation." },
  { speaker: 'charlie', message: "Absolument, la latence simulée est très réaliste." },
  { speaker: 'bob', message: "On devrait merger la branche feature cette semaine." },
  { speaker: 'charlie', message: "D'accord, je finalise les tests ce soir." },
  { speaker: 'bob', message: "J'ai corrigé le bug d'affichage des curseurs." },
  { speaker: 'charlie', message: "Parfait ! Je vais review ta PR." },
  { speaker: 'bob', message: "La V2 va être incroyable avec toutes ces fonctionnalités." },
  { speaker: 'charlie', message: "Oui, l'édition collaborative en temps réel c'est le futur !" },
];

// Réponses réactives au chat (Vivien -> Bots)
const CHAT_REACTIONS: Record<string, string[]> = {
  "bonjour": ["Salut Vivien !", "Hey ! Ça avance ?", "Hello !"],
  "salut": ["Coucou !", "Salut !", "On continue le projet ?"],
  "design": ["Le design est top en tout cas.", "Oui, l'UI est vraiment clean.", "On garde ces couleurs ?"],
  "latence": ["Je m'occupe d'optimiser ça.", "C'est normal, on simule le réseau.", "C'est fluide chez moi."],
  "bravo": ["Merci !", "On forme une bonne équipe.", "Yes !"],
  "quoi": ["On discute de la V2 là.", "On check les logs.", "Je modifie la section 3."],
  "notemate": ["NoteMate est l'avenir de l'édition collaborative !", "Ce projet va révolutionner nos prises de notes.", "On y est presque !"],
  "vivien": ["Vivien est notre lead dev sur ce projet.", "C'est Vivien qui a conçu l'architecture.", "Salut Vivien !"],
  "mobile": ["Le Header est maintenant bien compact sur téléphone.", "L'éditeur de texte s'adapte parfaitement aux petits écrans.", "N'oublie pas de vérifier le FooterConsole."],
  "bug": ["Je regarde ça tout de suite.", "Quel bug ? Je vais checker.", "On va corriger ça ensemble."],
  "aide": ["Je suis là pour t'aider !", "Dis-moi ce dont tu as besoin.", "On est une équipe !"],
  "merci": ["De rien !", "Avec plaisir !", "C'est normal entre collègues !"],
};

// Variable globale pour éviter la réinitialisation en Strict Mode
let isSimulationRunning = false;
let conversationIndex = 0;

// --- LOGIQUE DU HOOK ---
export function useSimulatedUsers() {
  const lastUserMessageId = useRef<string | null>(null);
  const timeoutsRef = useRef<ReturnType<typeof setTimeout>[]>([]);

  const setLatency = useNetworkStore((state) => state.setLatency);
  const setPacketLoss = useNetworkStore((state) => state.setPacketLoss);
  const setConnected = useNetworkStore((state) => state.setConnected);
  const incrementActions = useUsersStore((state) => state.incrementActions);
  const setUserTyping = useUsersStore((state) => state.setUserTyping);
  const setSyncing = useNetworkStore((state) => state.setSyncing);
  const addLog = useLogsStore((state) => state.addUserLog);
  const addChatMessage = useChatStore((state) => state.addMessage);
  const messages = useChatStore((state) => state.messages);

  // --- ACTIONS DE BAS NIVEAU AVEC RÉSEAU ---

  const performWithNetwork = useCallback(async (botId: string, action: () => Promise<void> | void) => {
    try {
      const latency = await simulateNetwork(() => getRandomLatency(1000, 1500), {
        packetLoss: 0.01
      });
      setLatency(latency);
      await action();
    } catch (error) {
      setConnected(false);
      setPacketLoss(0.01);
      const bot = Object.values(BOTS).find(b => b.id === botId) || BOTS.bob;
      addLog('system' as any, botId, bot.name, bot.color, "Perte de paquet détectée", "(Action annulée)");

      useEditorStore.getState().setCursor({
        userId: botId,
        position: useEditorStore.getState().cursors[botId]?.position || { lineNumber: 1, column: 1 },
        latency: 0,
        visible: false
      });

      setTimeout(() => {
        setConnected(true);
        setPacketLoss(0);
        useEditorStore.getState().setCursor({
          userId: botId,
          position: useEditorStore.getState().cursors[botId]?.position || { lineNumber: 1, column: 1 },
          latency: Math.floor(1000 + Math.random() * 500),
          visible: true
        });
      }, 1500);
    }
  }, [addLog, setLatency, setPacketLoss, setConnected]);

  const botSendMessage = useCallback(async (botId: string, text: string) => {
    const bot = Object.values(BOTS).find(b => b.id === botId) || BOTS.bob;

    // Log "écrit un message" avant d'envoyer
    addLog('chat', botId, bot.name, bot.color, 'écrit un message...', '');

    setUserTyping(botId, true);
    await new Promise(r => setTimeout(r, 1000 + Math.random() * 1000));

    addChatMessage({
      id: Math.random().toString(36).substring(2, 9),
      userId: botId,
      userName: bot.name,
      userColor: bot.color,
      content: text,
      timestamp: Date.now(),
    });

    setSyncing(true);
    addLog('chat', botId, bot.name, bot.color, `a envoyé un message`, "");
    incrementActions(botId);
    setTimeout(() => setSyncing(false), 500);
    setUserTyping(botId, false);
  }, [addChatMessage, addLog, incrementActions, setUserTyping, setSyncing]);

  const typeWithTypos = useCallback(async (botId: string, position: { lineNumber: number, column: number }, text: string) => {
    const editor = useEditorStore.getState();
    const bot = Object.values(BOTS).find(b => b.id === botId) || BOTS.bob;

    setUserTyping(botId, true);
    setSyncing(true);

    editor.setCursor({
      userId: botId,
      position: position,
      latency: Math.floor(1000 + Math.random() * 500),
      visible: true
    });

    if (Math.random() < 0.25 && text.length > 5) {
      const typoLen = Math.floor(text.length / 2);
      const wrongPart = text.substring(0, typoLen) + "zx" + text.substring(typoLen + 1);

      editor.applyOperation(botId, position, wrongPart, 'insert');
      await new Promise(r => setTimeout(r, 500));

      editor.applyOperation(botId, { lineNumber: position.lineNumber, column: position.column + wrongPart.length }, wrongPart.length.toString(), 'delete');
      await new Promise(r => setTimeout(r, 300));
      editor.applyOperation(botId, position, text, 'insert');
      addLog('edit', botId, bot.name, bot.color, "a corrigé une faute de frappe", `ligne ${position.lineNumber}`);
    } else {
      editor.applyOperation(botId, position, text, 'insert');
      addLog('edit', botId, bot.name, bot.color, "a modifié le document", `ligne ${position.lineNumber}`);
    }

    setUserTyping(botId, false);
    setTimeout(() => setSyncing(false), 500);
    incrementActions(botId);
  }, [setUserTyping, incrementActions, addLog, setSyncing]);

  const botEditSmart = useCallback(async (botId: string) => {
    await performWithNetwork(botId, async () => {
      const bot = Object.values(BOTS).find(b => b.id === botId) || BOTS.bob;
      const editor = useEditorStore.getState();
      const content = editor.content;
      const lines = content.split('\n');

      let lineIdx = Math.floor(Math.random() * lines.length);
      for (let i = 0; i < 5; i++) {
        if (lines[lineIdx]?.trim().length > 10) break;
        lineIdx = Math.floor(Math.random() * lines.length);
      }

      const line = lines[lineIdx] || "";

      editor.setCursor({
        userId: botId,
        position: { lineNumber: lineIdx + 1, column: 1 },
        latency: Math.floor(1000 + Math.random() * 500),
        visible: true
      });

      await new Promise(r => setTimeout(r, 400));

      if (line.toLowerCase().includes("todo") || line.includes("- [ ]")) {
        const check = " [FAIT]";
        await typeWithTypos(botId, { lineNumber: lineIdx + 1, column: line.length + 1 }, check);
      } else if (line.length > 0 && Math.random() > 0.3) {
        const comment = ` // Note de ${bot.name}`;
        await typeWithTypos(botId, { lineNumber: lineIdx + 1, column: line.length + 1 }, comment);
      } else {
        const newIdea = `\n* Point important à discuter`;
        await typeWithTypos(botId, { lineNumber: lineIdx + 1, column: 1 }, newIdea);
      }
    });
  }, [addLog, typeWithTypos, performWithNetwork]);

  // --- RÉACTIONS AUX MESSAGES DE VIVIEN ---
  useEffect(() => {
    if (messages.length === 0) return;
    const lastMsg = messages[messages.length - 1];

    if (lastMsg.userId === 'user-vivien' && lastMsg.id !== lastUserMessageId.current) {
      lastUserMessageId.current = lastMsg.id;

      const content = lastMsg.content.toLowerCase();
      let response = "";
      let responderId = Math.random() > 0.5 ? BOTS.bob.id : BOTS.charlie.id;

      for (const key in CHAT_REACTIONS) {
        if (content.includes(key)) {
          const options = CHAT_REACTIONS[key];
          response = options[Math.floor(Math.random() * options.length)];
          break;
        }
      }

      if (response) {
        const t = setTimeout(() => botSendMessage(responderId, response), 800 + Math.random() * 800);
        timeoutsRef.current.push(t);
      } else if (Math.random() > 0.5) {
        const genericResponses = ["Intéressant !", "Je vois.", "D'accord !", "Bien noté."];
        const t = setTimeout(() => botSendMessage(BOTS.charlie.id, genericResponses[Math.floor(Math.random() * genericResponses.length)]), 1500);
        timeoutsRef.current.push(t);
      }
    }
  }, [messages, botSendMessage]);

  // --- CONVERSATIONS AUTONOMES ENTRE BOB ET CHARLIE ---
  useEffect(() => {
    if (isSimulationRunning) {
      console.log('[Bots] Simulation déjà en cours, skip...');
      return;
    }
    isSimulationRunning = true;

    console.log('[Bots] Initialisation de la simulation...');

    // Initialiser les curseurs des bots au démarrage
    const editor = useEditorStore.getState();
    editor.setCursor({
      userId: BOTS.bob.id,
      position: { lineNumber: 5, column: 1 },
      latency: Math.floor(1000 + Math.random() * 500),
      visible: true
    });
    editor.setCursor({
      userId: BOTS.charlie.id,
      position: { lineNumber: 10, column: 1 },
      latency: Math.floor(1000 + Math.random() * 500),
      visible: true
    });

    // Log de connexion
    addLog('connect', BOTS.bob.id, BOTS.bob.name, BOTS.bob.color, 'connecté à la session', '');
    addLog('connect', BOTS.charlie.id, BOTS.charlie.name, BOTS.charlie.color, 'connecté à la session', '');

    // Démarrer la simulation après 2 secondes
    const initTimeout = setTimeout(() => {
      console.log('[Bots] Démarrage de la simulation...');

      // Premier message de Bob
      botSendMessage(BOTS.bob.id, "Salut tout le monde ! Je commence à travailler sur le document.");

      // Charlie répond après 3 secondes
      const t1 = setTimeout(() => {
        botSendMessage(BOTS.charlie.id, "Super ! Je rejoins la session.");
      }, 3000);
      timeoutsRef.current.push(t1);

      // Bob édite après 6 secondes
      const t2 = setTimeout(() => {
        botEditSmart(BOTS.bob.id);
      }, 6000);
      timeoutsRef.current.push(t2);

      // Charlie édite après 9 secondes
      const t3 = setTimeout(() => {
        botEditSmart(BOTS.charlie.id);
      }, 9000);
      timeoutsRef.current.push(t3);

      // Boucle continue pour les actions
      const loopInterval = setInterval(() => {
        const action = Math.random();
        const convIdx = conversationIndex % BOB_CHARLIE_CONVERSATIONS.length;
        conversationIndex++;

        if (action < 0.4) {
          const conv = BOB_CHARLIE_CONVERSATIONS[convIdx];
          const speakerBot = conv.speaker === 'bob' ? BOTS.bob : BOTS.charlie;
          botSendMessage(speakerBot.id, conv.message);
        } else if (action < 0.7) {
          botEditSmart(BOTS.bob.id);
        } else {
          botEditSmart(BOTS.charlie.id);
        }
      }, 8000);

      timeoutsRef.current.push(loopInterval as any);
    }, 2000);
    timeoutsRef.current.push(initTimeout);

    // Ne pas nettoyer - la simulation doit continuer
    // return () => { ... };
  }, [botSendMessage, botEditSmart, addLog]);

  return { triggerManualAction: () => { } };
}
