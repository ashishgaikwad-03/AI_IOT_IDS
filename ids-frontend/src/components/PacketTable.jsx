import { useRef, useEffect, useState } from 'react';

/**
 * PacketTable — Live Packet Log
 * Handles all classification labels from the new multi-model backend.
 */

// ─── Style helpers ────────────────────────────────────────────────────────────
// Normalise GitHub XGBoost model labels → style key
function styleKey(cls) {
  const c = (cls || '').toUpperCase().replace(/[- ]/g, '_');
  if (c === 'BENIGN')                                    return 'BENIGN';
  // DoS / DDoS family
  if (c === 'DOS_SYN' || c.startsWith('DOS'))            return 'DOS';
  if (c.startsWith('MIRAI') || c.startsWith('DDOS'))     return 'DDOS';
  // Reconnaissance / Scanning
  if (c === 'HOST_DISCOVERY' || c.startsWith('SCAN'))    return 'RECON';
  // Brute force
  if (c === 'TELNET_BRUTE' || c.includes('BRUTE'))       return 'BRUTE';
  // Man-in-the-Middle
  if (c === 'MITM_ARP' || c.includes('MITM'))            return 'MITM';
  // Legacy fallback
  if (c.includes('EXFIL') || c === 'KEYLOG')             return 'MITM';
  return 'OTHER';
}

const BADGE_CLASS = {
  BENIGN:  'badge-benign',
  DDOS:    'badge-ddos',
  DOS:     'badge-ddos',
  RECON:   'badge-scan',
  BRUTE:   'badge-ddos',
  MITM:    'badge-exfil',
  OTHER:   'badge-scan',
};

const BAR_COLOR = {
  BENIGN:  '#22d3a5',
  DDOS:    '#ff3b3b',
  DOS:     '#ff6b35',
  RECON:   '#f59e0b',
  BRUTE:   '#fb923c',
  MITM:    '#a855f7',
  OTHER:   '#4d6b8a',
};

const ROW_BG = {
  BENIGN:  '',
  DDOS:    'packet-row-attack',
  DOS:     'packet-row-attack',
  RECON:   'bg-soc-amber/5',
  BRUTE:   'bg-soc-amber/5',
  MITM:    'bg-soc-purple/5',
  OTHER:   '',
};

function formatTime(ts) {
  if (!ts) return '—';
  try {
    const d = new Date(ts);
    return d.toLocaleTimeString('en-US', {
      hour12: false, hour: '2-digit', minute: '2-digit', second: '2-digit'
    }) + '.' + String(d.getMilliseconds()).padStart(3, '0');
  } catch { return '—'; }
}

// Source badge: xgboost vs layer2
function SourceBadge({ source }) {
  if (source === 'layer2') {
    return (
      <span style={{ fontSize: '9px', padding: '1px 4px', borderRadius: '3px',
        backgroundColor: '#a855f720', color: '#a855f7', border: '1px solid #a855f740',
        fontFamily: 'JetBrains Mono', marginLeft: '4px', verticalAlign: 'middle' }}>
        L2
      </span>
    );
  }
  return null;
}

function CopyableIP({ ip, className }) {
  const [copied, setCopied] = useState(false);
  
  if (!ip || ip === '—' || ip === 'Unknown') {
    return <div className={`truncate ${className}`}>{ip || '—'}</div>;
  }

  const handleCopy = (e) => {
    e.stopPropagation();
    navigator.clipboard.writeText(ip);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  // Shrink long IPv6 addresses for visual table clarity so they don't break the CSS
  let displayIp = ip;
  if (ip.length > 15 && ip.includes(':')) {
    const parts = ip.split(':');
    if (parts.length >= 4) {
      displayIp = `${parts[0]}:${parts[1]}..${parts[parts.length - 1]}`;
    }
  }

  return (
    <div className={`group flex items-center justify-between gap-1 overflow-hidden ${className}`}>
      <span className="truncate" title={ip}>{displayIp}</span>
      <button 
        onClick={handleCopy}
        className="opacity-0 group-hover:opacity-100 transition-opacity text-[10px] bg-gray-200 text-gray-700 rounded px-1.5 py-0.5 hover:bg-gray-300 flex-shrink-0"
        title="Copy exact IP to clipboard"
      >
        {copied ? 'Copied' : 'Copy'}
      </button>
    </div>
  );
}

export default function PacketTable({ packets }) {
  const topRef = useRef(null);

  useEffect(() => {
    if (topRef.current) {
      topRef.current.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
    }
  }, [packets]);

  return (
    <div className="panel flex flex-col h-full min-h-0">
      <div className="panel-header">
        <span className="panel-title">Live Packet Log</span>
        <div className="flex items-center gap-3">
          <span className="text-xs font-mono text-soc-muted">
            {packets?.length ?? 0} records
          </span>
          <div className="w-1.5 h-1.5 rounded-full bg-soc-cyan animate-pulse" />
        </div>
      </div>

      {/* Column headers */}
      <div className="grid gap-1 px-3 py-1.5 border-b border-soc-border bg-soc-bg/60
                      text-xs font-mono text-soc-muted tracking-wider flex-shrink-0"
           style={{ gridTemplateColumns: '1fr 1.2fr 1.2fr 0.6fr 0.5fr 0.5fr 1.1fr 0.7fr' }}>
        <div>TIME</div>
        <div>SRC IP</div>
        <div>DST IP</div>
        <div>PROTO</div>
        <div>PORT</div>
        <div>SIZE</div>
        <div>CLASSIFICATION</div>
        <div>CONF %</div>
      </div>

      {/* Scrollable rows */}
      <div className="flex-1 overflow-y-auto min-h-0 font-mono text-xs">
        <div ref={topRef} />

        {(!packets || packets.length === 0) ? (
          <div className="flex items-center justify-center h-24 text-soc-muted text-sm animate-pulse-cyan">
            Waiting for packets...
          </div>
        ) : (
          packets.map((pkt) => {
            const key      = styleKey(pkt.classification);
            const barColor = BAR_COLOR[key];
            const confPct  = Math.round((pkt.confidence || 0) * 100);

            return (
              <div
                key={pkt._id}
                className={`packet-row grid gap-1 px-3 py-1.5 ${ROW_BG[key]}`}
                style={{ gridTemplateColumns: '1fr 1.2fr 1.2fr 0.6fr 0.5fr 0.5fr 1.1fr 0.7fr' }}
              >
                <div className="text-soc-muted truncate">{formatTime(pkt.timestamp)}</div>

                <CopyableIP ip={pkt.sourceIp} className="text-soc-cyan" />
                <CopyableIP ip={pkt.destIp} className="text-soc-text" />

                <div className="text-soc-purple font-semibold">
                  {pkt.protocol || '—'}
                </div>

                <div className="text-soc-text">
                  {pkt.port === 0 || pkt.port == null ? '—' : pkt.port}
                </div>

                <div className="text-soc-muted">
                  {pkt.packetSize != null ? `${pkt.packetSize}B` : '—'}
                </div>

                {/* Classification badge */}
                <div className="flex items-center gap-1">
                  <span className={`badge ${BADGE_CLASS[key]}`}>
                    {pkt.classification}
                  </span>
                  <SourceBadge source={pkt.source} />
                </div>

                {/* Confidence bar */}
                <div className="flex items-center gap-1.5">
                  <div className="confidence-bar-track flex-1">
                    <div
                      className="confidence-bar-fill"
                      style={{
                        width:           `${confPct}%`,
                        backgroundColor: barColor,
                        boxShadow:       `0 0 4px ${barColor}66`,
                      }}
                    />
                  </div>
                  <span className="flex-shrink-0 text-soc-muted w-7 text-right">{confPct}%</span>
                </div>
              </div>
            );
          })
        )}
      </div>
    </div>
  );
}
