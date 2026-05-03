import { useState, useEffect, useRef, useCallback } from 'react';

const MAX_PACKETS      = 200;
const MAX_HISTORY      = 60;
const THREAT_EMA_ALPHA = 0.15;

// ─── Category Normaliser ─────────────────────────────────────────────────────
// Maps the display label from backend → canonical stat bucket
// GitHub XGBoost model 11 classes:
//   0=BENIGN, 1=DoS-SYN, 2=Mirai-ACK, 3=Host Discovery,
//   4=Telnet-Brute, 5=Mirai-HTTP, 6=Mirai-UDP, 7=MITM-ARP,
//   8=Scan-Host, 9=Scan-Port, 10=Scan-OS
function getCategory(classification) {
  const c = (classification || '').toUpperCase().replace(/[- ]/g, '_');
  if (c === 'BENIGN')                                              return 'BENIGN';
  // DoS
  if (c === 'DOS_SYN' || c.startsWith('DOS'))                     return 'DOS_SYN';
  // Mirai DDoS variants
  if (c === 'MIRAI_ACK')                                           return 'MIRAI_ACK';
  if (c === 'MIRAI_HTTP')                                          return 'MIRAI_HTTP';
  if (c === 'MIRAI_UDP')                                           return 'MIRAI_UDP';
  // Reconnaissance / Scanning
  if (c === 'HOST_DISCOVERY')                                      return 'HOST_DISC';
  if (c === 'SCAN_HOST')                                           return 'SCAN_HOST';
  if (c === 'SCAN_PORT')                                           return 'SCAN_PORT';
  if (c === 'SCAN_OS' || c === 'OS_SCAN' || c === 'OS_FINGERPRINT') return 'SCAN_OS';
  if (c.includes('SCAN') || c === 'SVC_SCAN' || c === 'SERVICE_SCAN') return 'SCAN_PORT';
  // Brute force
  if (c === 'TELNET_BRUTE' || c.includes('BRUTE') || c.includes('TELNET')) return 'TELNET_BRUTE';
  // Man-in-the-Middle
  if (c === 'MITM_ARP' || c.includes('MITM') || c.includes('ARP')) return 'MITM_ARP';
  // Legacy labels
  if (c.startsWith('DDOS'))                                        return 'MIRAI_ACK';
  if (c === 'KEYLOG' || c.includes('EXFIL'))                       return 'MITM_ARP';
  if (c.includes('ANOMALY') || c.includes('L2'))                   return 'HOST_DISC';
  return 'HOST_DISC';
}

// Auto-detect WebSocket URL from current page location
// Works on localhost, ngrok, localtunnel, or any domain automatically
function getDefaultWsUrl() {
  if (import.meta.env.VITE_WS_URL) return import.meta.env.VITE_WS_URL;
  const loc = window.location;
  const wsProto = loc.protocol === 'https:' ? 'wss:' : 'ws:';
  return `${wsProto}//${loc.host}/ws`;
}
const DEFAULT_WS_URL = getDefaultWsUrl();

export default function useWebSocket(
  url   = DEFAULT_WS_URL,
  topic = ''
) {
  const [packets,           setPackets]           = useState([]);
  const [throughputHistory, setThroughputHistory] = useState([]);
  const [threatIndex,       setThreatIndex]       = useState(0);
  const [isConnected,       setIsConnected]       = useState(false);
  const [latestPacket,      setLatestPacket]      = useState(null);
  const [stats,             setStats]             = useState({
    total: 0, attacks: 0, benign: 0,
    byNode: { 'TShark-Live': 0, 'Injected': 0, 'Live-WiFi': 0 },
    byClass: {
      BENIGN: 0, DOS_SYN: 0, MIRAI_ACK: 0, HOST_DISC: 0,
      TELNET_BRUTE: 0, MIRAI_HTTP: 0, MIRAI_UDP: 0, MITM_ARP: 0,
      SCAN_HOST: 0, SCAN_PORT: 0, SCAN_OS: 0,
    },
  });

  const wsRef          = useRef(null);
  const threatIndexRef = useRef(0);
  const statsRef       = useRef({ ...stats });
  
  // Throttle refs for visual UI updates
  const lastAttackTimeRef = useRef(0);
  const lastBenignTimeRef = useRef(0);

  // ── Throughput batching: aggregate packets over 2-second windows ──────────
  const throughputBufRef   = useRef({ mbps: 0, pps: 0, count: 0 });
  const throughputTimerRef = useRef(null);

  // Flush the throughput buffer every 2 seconds into the chart history
  useEffect(() => {
    throughputTimerRef.current = setInterval(() => {
      const buf = throughputBufRef.current;

      const timeLabel = new Date().toLocaleTimeString('en-US', {
        hour12: false, hour: '2-digit', minute: '2-digit', second: '2-digit'
      });

      // Divide by 2 because window is 2 seconds, which yields the per-second rate
      const rateMbps = buf.mbps / 2.0;
      const ratePps  = Math.round(buf.pps / 2.0);

      setThroughputHistory(prev => {
        const entry = { time: timeLabel, mbps: parseFloat(rateMbps.toFixed(4)), pps: ratePps };
        const updated = [...prev, entry];
        return updated.length > MAX_HISTORY ? updated.slice(-MAX_HISTORY) : updated;
      });

      // Reset buffer
      throughputBufRef.current = { mbps: 0, pps: 0, count: 0 };
    }, 2000); // Update every 2 seconds

    return () => clearInterval(throughputTimerRef.current);
  }, []);

  const processPacket = useCallback((rawMessage) => {
    let packet;
    try {
      packet = JSON.parse(rawMessage.data);
    } catch (e) {
      console.error('[IDS] Failed to parse WS msg:', e);
      return;
    }

    packet._id = `${Date.now()}-${Math.random().toString(36).slice(2, 7)}`;

    const category = getCategory(packet.classification);
    const isAttack = category !== 'BENIGN';

    // Throttled UI insertion (so the table doesn't scroll too fast to read)
    const now = Date.now();
    let shouldLogVisual = false;
    
    if (isAttack) {
      // Allow max 5 visual attack logs per second
      if (now - lastAttackTimeRef.current > 200) {
        shouldLogVisual = true;
        lastAttackTimeRef.current = now;
      }
    } else {
      // Allow max 1 visual benign log per second
      if (now - lastBenignTimeRef.current > 1000) {
        shouldLogVisual = true;
        lastBenignTimeRef.current = now;
      }
    }

    if (shouldLogVisual) {
      setPackets(prev => {
        const updated = [packet, ...prev];
        return updated.length > MAX_PACKETS ? updated.slice(0, MAX_PACKETS) : updated;
      });
    }

    // Accumulate throughput data (flushed every 2s by the timer above)
    throughputBufRef.current.mbps += (packet.throughputMbps || 0);
    throughputBufRef.current.pps  += (packet.pps || 1);
    throughputBufRef.current.count += 1;

    threatIndexRef.current = Math.round(
      THREAT_EMA_ALPHA * packet.severityScore +
      (1 - THREAT_EMA_ALPHA) * threatIndexRef.current
    );
    setThreatIndex(threatIndexRef.current);

    const prev = statsRef.current;

    const newStats = {
      total:   prev.total + 1,
      attacks: prev.attacks + (isAttack ? 1 : 0),
      benign:  prev.benign  + (isAttack ? 0 : 1),
      byNode: {
        ...prev.byNode,
        [packet.sourceNode]: (prev.byNode[packet.sourceNode] || 0) + 1,
      },
      byClass: {
        ...prev.byClass,
        [category]: (prev.byClass[category] || 0) + 1,
      },
    };
    statsRef.current = newStats;
    setStats({ ...newStats });
    setLatestPacket(packet);
  }, []);

  useEffect(() => {
    let reconnectTimer;

    const connect = () => {
      const ws = new WebSocket(url);
      wsRef.current = ws;

      ws.onopen = () => {
        setIsConnected(true);
        console.log('[IDS] WebSocket Connected');
      };

      ws.onmessage = (msg) => processPacket(msg);

      ws.onclose = () => {
        setIsConnected(false);
        console.log('[IDS] WebSocket Disconnected. Reconnecting in 5s...');
        reconnectTimer = setTimeout(connect, 5000);
      };

      ws.onerror = (err) => {
        console.error('[IDS] WebSocket Error:', err);
        ws.close();
      };
    };

    connect();
    return () => {
      clearTimeout(reconnectTimer);
      if (wsRef.current) {
        wsRef.current.onclose = null;
        wsRef.current.close();
      }
    };
  }, [url, processPacket]);

  return { packets, throughputHistory, threatIndex, isConnected, latestPacket, stats };
}
