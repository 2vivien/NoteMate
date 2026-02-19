import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { useEditorStore } from '@/features/editor/useEditorStore';
import { useNetworkStore } from '@/features/network/useNetworkStore';
import { Slider } from '@/components/ui/slider';
import {
  FileCode,
  Timer,
  AlignLeft,
  Code,
  Wifi,
  Download,
  AlertTriangle,
  Activity
} from 'lucide-react';
import { useLogsStore } from '@/features/logs/useLogsStore';

function formatBytes(bytes: number): string {
  if (bytes === 0) return '0 B';
  const k = 1024;
  const sizes = ['B', 'KB', 'MB', 'GB'];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  return parseFloat((bytes / Math.pow(k, i)).toFixed(1)) + ' ' + sizes[i];
}

function formatDuration(seconds: number): string {
  const hours = Math.floor(seconds / 3600);
  const mins = Math.floor((seconds % 3600) / 60);
  const secs = seconds % 60;
  return `${hours.toString().padStart(2, '0')}:${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
}

export function FooterConsole() {
  const docInfo = useEditorStore((state) => state.document);

  const latency = useNetworkStore((state) => state.latency);
  const packetLoss = useNetworkStore((state) => state.packetLoss);
  const ackRate = useNetworkStore((state) => state.ackRate);
  const isConnected = useNetworkStore((state) => state.isConnected);
  const simulatedLag = useNetworkStore((state) => state.simulatedLag);
  const setSimulatedLag = useNetworkStore((state) => state.setSimulatedLag);
  const session = useNetworkStore((state) => state.session);

  const [displayDuration, setDisplayDuration] = useState(session.duration);
  const [packetLossCount, setPacketLossCount] = useState(0);

  // Update duration display every second
  useEffect(() => {
    const interval = setInterval(() => {
      setDisplayDuration((prev) => prev + 1);
    }, 1000);

    return () => clearInterval(interval);
  }, []);

  // Simulate random packet loss events
  useEffect(() => {
    if (!isConnected) return;

    const lossInterval = setInterval(() => {
      // 1% chance of packet loss every 5 seconds
      if (Math.random() < 0.01) {
        setPacketLossCount((prev) => prev + 1);
      }
    }, 5000);

    return () => clearInterval(lossInterval);
  }, [isConnected]);

  // Sync with store duration
  useEffect(() => {
    setDisplayDuration(session.duration);
  }, [session.duration]);

  return (
    <footer className="h-8 border-t border-border-light dark:border-border-dark bg-sidebar-bg dark:bg-sidebar-dark flex items-center justify-between px-2 md:px-4 shrink-0 overflow-hidden">
      {/* Left section - Stats */}
      <div className="flex items-center gap-3 md:gap-6 text-[9px] md:text-[10px] font-mono text-text-muted dark:text-slate-500 overflow-hidden">
        {/* Document size - Hidden on mobile */}
        <div className="hidden sm:flex items-center gap-1.5">
          <FileCode className="w-3 h-3 text-primary" />
          <span className="text-primary font-bold">TAILLE:</span>
          <span className="text-text-main dark:text-slate-300 font-semibold">
            {formatBytes(docInfo.size)}
          </span>
        </div>

        {/* Network status indicator */}
        <div className="flex items-center gap-1.5">
          <Activity className={`w-2.5 h-2.5 md:w-3 md:h-3 ${isConnected ? 'text-emerald-500' : 'text-red-500'}`} />
          <span className="text-primary font-bold hidden sm:inline">RÉSEAU:</span>
          <span className={`font-bold ${isConnected ? 'text-emerald-500' : 'text-red-500'}`}>
            {isConnected ? 'OK' : 'HORS LIGNE'}
          </span>
        </div>

        {/* Packet loss indicator */}
        {isConnected && (
          <div className="hidden md:flex items-center gap-1.5">
            <AlertTriangle className={`w-2.5 h-2.5 ${packetLossCount > 0 ? 'text-amber-500' : 'text-gray-400'}`} />
            <span className="text-primary font-bold">PERTES:</span>
            <span className={`font-bold ${packetLossCount > 0 ? 'text-amber-500' : 'text-emerald-500'}`}>
              {packetLossCount} paquet{packetLossCount > 1 ? 's' : ''}
            </span>
          </div>
        )}

        {/* Sync status & Mode - Hidden on mobile */}
        <div className="hidden lg:flex items-center gap-4">
          <div className="flex items-center gap-1.5">
            <Wifi className="w-3 h-3 text-primary" />
            <span className="text-primary font-bold">SYNCHRO:</span>
            <span className="text-text-main dark:text-slate-300 font-semibold">
              WS / Protobuf
            </span>
          </div>
          <div className="flex items-center gap-1.5">
            <Code className="w-3 h-3 text-primary" />
            <span className="text-primary font-bold">MODE:</span>
            <span className="text-text-main dark:text-slate-300 font-semibold uppercase">
              Différentiel
            </span>
          </div>
        </div>

        {/* Latency - Always visible but compact */}
        <div className="flex items-center gap-1 md:gap-1.5">
          <Timer className="w-2.5 h-2.5 md:w-3 md:h-3 text-primary" />
          <span className="text-primary font-bold hidden xs:inline">LATENCE:</span>
          <motion.span
            key={latency}
            initial={{ opacity: 0.5 }}
            animate={{ opacity: 1 }}
            className={`font-bold ${latency > 500 ? 'text-red-500' : latency > 200 ? 'text-amber-500' : 'text-emerald-500'
              }`}
          >
            {latency}ms
          </motion.span>
        </div>

        {/* Session duration */}
        <div className="flex items-center gap-1 md:gap-1.5 shrink-0">
          <Timer className="w-2.5 h-2.5 md:w-3 md:h-3 text-primary sm:hidden" />
          <span className="text-primary font-bold hidden sm:inline">DURÉE:</span>
          <span className="text-text-main dark:text-slate-300 font-semibold text-[8px] xs:text-[10px]">
            {formatDuration(displayDuration)}
          </span>
        </div>
      </div>

      {/* Right section - Controls */}
      <div className="flex items-center gap-2 md:gap-4 shrink-0">
        {/* Simulate lag slider - Hidden on mobile */}
        <div className="hidden sm:flex items-center gap-2">
          <label className="text-[10px] font-bold text-text-muted dark:text-slate-500 uppercase">
            Délai
          </label>
          <Slider
            value={[simulatedLag]}
            onValueChange={(value) => setSimulatedLag(value[0])}
            min={0}
            max={500}
            step={10}
            className="w-16 md:w-20"
          />
        </div>

        {/* Encoding and language - Only language on mobile */}
        <div className="flex items-center gap-2 md:gap-4 border-l border-border-light dark:border-border-dark pl-2 md:pl-4 h-full">
          <button
            onClick={() => {
              const data = JSON.stringify(useLogsStore.getState().logs, null, 2);
              const blob = new Blob([data], { type: 'application/json' });
              const url = URL.createObjectURL(blob);
              const a = document.createElement('a');
              a.href = url;
              a.download = `notemate-logs-${Date.now()}.json`;
              a.click();
            }}
            className="hidden md:flex items-center gap-1.5 text-text-muted dark:text-slate-400 text-[9px] md:text-[10px] hover:text-primary transition-colors cursor-pointer"
          >
            <Download className="w-3 h-3 md:w-3.5 md:h-3.5" />
            EXPORTER
          </button>
          <div className="hidden xs:flex items-center gap-1.5 text-text-muted dark:text-slate-400 text-[9px] md:text-[10px]">
            <AlignLeft className="w-3 h-3 md:w-3.5 md:h-3.5" />
            UTF-8
          </div>
          <div className="flex items-center gap-1.5 text-text-muted dark:text-slate-400 text-[9px] md:text-[10px]">
            <Code className="w-3 h-3 md:w-3.5 md:h-3.5" />
            Markdown
          </div>
        </div>
      </div>
    </footer>
  );
}
