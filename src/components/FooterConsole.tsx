import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { useEditorStore } from '@/features/editor/useEditorStore';
import { useNetworkStore } from '@/features/network/useNetworkStore';
import { Slider } from '@/components/ui/slider';
import { 
  FileCode, 
  Timer, 
  CheckCircle2,
  AlignLeft,
  Code,
  Wifi,
} from 'lucide-react';

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
  const document = useEditorStore((state) => state.document);
  const version = useEditorStore((state) => state.version);
  
  const latency = useNetworkStore((state) => state.latency);
  const ackRate = useNetworkStore((state) => state.ackRate);
  const simulatedLag = useNetworkStore((state) => state.simulatedLag);
  const setSimulatedLag = useNetworkStore((state) => state.setSimulatedLag);
  const session = useNetworkStore((state) => state.session);

  const [displayDuration, setDisplayDuration] = useState(session.duration);

  // Update duration display every second
  useEffect(() => {
    const interval = setInterval(() => {
      setDisplayDuration((prev) => prev + 1);
    }, 1000);

    return () => clearInterval(interval);
  }, []);

  // Sync with store duration
  useEffect(() => {
    setDisplayDuration(session.duration);
  }, [session.duration]);

  return (
    <footer className="h-8 border-t border-border-light dark:border-border-dark bg-sidebar-bg dark:bg-sidebar-dark flex items-center justify-between px-4 shrink-0 overflow-hidden">
      {/* Left section - Stats */}
      <div className="flex items-center gap-6 text-[10px] font-mono text-text-muted dark:text-slate-500">
        {/* Document size */}
        <div className="flex items-center gap-1.5">
          <FileCode className="w-3 h-3 text-primary" />
          <span className="text-primary font-bold">DOC SIZE:</span>
          <span className="text-text-main dark:text-slate-300 font-semibold">
            {formatBytes(document.size)}
          </span>
        </div>

        {/* Sync mode */}
        <div className="flex items-center gap-1.5">
          <Wifi className="w-3 h-3 text-primary" />
          <span className="text-primary font-bold">SYNC:</span>
          <span className="text-text-main dark:text-slate-300 font-semibold">
            WebSocket / Protobuf
          </span>
        </div>

        {/* Latency */}
        <div className="flex items-center gap-1.5">
          <Timer className="w-3 h-3 text-primary" />
          <span className="text-primary font-bold">LATENCY:</span>
          <motion.span
            key={latency}
            initial={{ opacity: 0.5 }}
            animate={{ opacity: 1 }}
            className={`font-bold ${
              latency > 500 ? 'text-red-500' : latency > 200 ? 'text-amber-500' : 'text-emerald-500'
            }`}
          >
            {latency}ms (Simulated)
          </motion.span>
        </div>

        {/* ACK rate */}
        <div className="flex items-center gap-1.5">
          <CheckCircle2 className="w-3 h-3 text-primary" />
          <span className="text-primary font-bold">ACK RATE:</span>
          <span className="text-text-main dark:text-slate-300 font-semibold">
            {ackRate.toFixed(1)}%
          </span>
        </div>

        {/* Version */}
        <div className="flex items-center gap-1.5">
          <span className="text-primary font-bold">VER:</span>
          <span className="text-text-main dark:text-slate-300 font-semibold">
            v{version}
          </span>
        </div>

        {/* Session duration */}
        <div className="flex items-center gap-1.5">
          <span className="text-primary font-bold">UPTIME:</span>
          <span className="text-text-main dark:text-slate-300 font-semibold">
            {formatDuration(displayDuration)}
          </span>
        </div>
      </div>

      {/* Right section - Controls */}
      <div className="flex items-center gap-4">
        {/* Simulate lag slider */}
        <div className="flex items-center gap-2">
          <label className="text-[10px] font-bold text-text-muted dark:text-slate-500 uppercase">
            Simulate Lag
          </label>
          <Slider
            value={[simulatedLag]}
            onValueChange={(value) => setSimulatedLag(value[0])}
            min={0}
            max={500}
            step={10}
            className="w-20"
          />
          <span className="text-[10px] text-text-muted dark:text-slate-500 w-8">
            {simulatedLag}ms
          </span>
        </div>

        {/* Encoding and language */}
        <div className="flex items-center gap-4 border-l border-border-light dark:border-border-dark pl-4 h-full">
          <div className="flex items-center gap-1.5 text-text-muted dark:text-slate-400 text-[10px]">
            <AlignLeft className="w-3.5 h-3.5" />
            {document.encoding}
          </div>
          <div className="flex items-center gap-1.5 text-text-muted dark:text-slate-400 text-[10px]">
            <Code className="w-3.5 h-3.5" />
            {document.language}
          </div>
        </div>
      </div>
    </footer>
  );
}
