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
    <footer className="h-12 md:h-14 border-t border-border-light dark:border-border-dark bg-sidebar-bg dark:bg-sidebar-dark flex items-center justify-between px-3 md:px-6 shrink-0">
      {/* Left section - Stats */}
      <div className="flex items-center gap-3 md:gap-6 text-xs md:text-sm font-mono text-text-muted dark:text-slate-500">
        {/* Document size - Hidden on mobile */}
        <div className="hidden sm:flex items-center gap-2">
          <FileCode className="w-4 h-4 text-primary" />
          <span className="text-primary font-bold">TAILLE:</span>
          <span className="text-text-main dark:text-slate-300 font-semibold">
            {formatBytes(docInfo.size)}
          </span>
        </div>

        {/* Network status indicator */}
        <div className="flex items-center gap-2">
          <Activity className={`w-4 h-4 ${isConnected ? 'text-emerald-500' : 'text-red-500'}`} />
          <span className="text-primary font-bold hidden sm:inline">RÉSEAU:</span>
          <span className={`font-bold ${isConnected ? 'text-emerald-500' : 'text-red-500'}`}>
            {isConnected ? 'OK' : 'HORS LIGNE'}
          </span>
        </div>

        {/* Packet loss indicator - Visible on mobile too */}
        {isConnected && (
          <div className="flex items-center gap-2">
            <AlertTriangle className={`w-4 h-4 ${packetLossCount > 0 ? 'text-amber-500' : 'text-gray-400'}`} />
            <span className="text-primary font-bold hidden xs:inline">PERTES:</span>
            <span className={`font-bold ${packetLossCount > 0 ? 'text-amber-500' : 'text-emerald-500'}`}>
              {packetLossCount}
            </span>
          </div>
        )}

        {/* Mode - Visible on mobile and desktop */}
        <div className="flex items-center gap-2">
          <Code className="w-4 h-4 text-primary" />
          <span className="text-primary font-bold hidden xs:inline">MODE:</span>
          <span className="text-text-main dark:text-slate-300 font-semibold uppercase">
            Diff
          </span>
        </div>

        {/* Latency */}
        <div className="flex items-center gap-2">
          <Timer className="w-4 h-4 text-primary" />
          <span className="text-primary font-bold hidden sm:inline">LATENCE:</span>
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
        <div className="flex items-center gap-2 shrink-0">
          <Timer className="w-4 h-4 text-primary" />
          <span className="text-primary font-bold hidden sm:inline">DURÉE:</span>
          <span className="text-text-main dark:text-slate-300 font-semibold">
            {formatDuration(displayDuration)}
          </span>
        </div>
      </div>

      {/* Right section - Controls */}
      <div className="flex items-center gap-3 md:gap-6 shrink-0">
        {/* Simulate lag slider - Hidden on mobile */}
        <div className="hidden sm:flex items-center gap-2">
          <label className="text-xs font-bold text-text-muted dark:text-slate-500 uppercase">
            Délai
          </label>
          <Slider
            value={[simulatedLag]}
            onValueChange={(value) => setSimulatedLag(value[0])}
            min={0}
            max={500}
            step={10}
            className="w-20 md:w-24"
          />
        </div>

        {/* Encoding and language */}
        <div className="flex items-center gap-3 md:gap-5 border-l border-border-light dark:border-border-dark pl-3 md:pl-5">
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
            className="flex items-center gap-1.5 text-text-muted dark:text-slate-400 text-xs md:text-sm hover:text-primary transition-colors cursor-pointer"
          >
            <Download className="w-4 h-4" />
            <span className="hidden md:inline">EXPORTER</span>
          </button>
          <div className="hidden sm:flex items-center gap-1.5 text-text-muted dark:text-slate-400 text-xs md:text-sm">
            <AlignLeft className="w-4 h-4" />
            UTF-8
          </div>
          <div className="flex items-center gap-1.5 text-text-muted dark:text-slate-400 text-xs md:text-sm">
            <Code className="w-4 h-4" />
            <span className="hidden xs:inline">Markdown</span>
          </div>
        </div>
      </div>
    </footer>
  );
}
