import { useMemo } from 'react';
import {
  RadialBarChart, RadialBar, PieChart, Pie, Cell,
  ResponsiveContainer, Tooltip, BarChart, Bar, XAxis, YAxis, CartesianGrid
} from 'recharts';

/**
 * AttackIntelligence — Real-time attack analytics panel
 *
 * Shows:
 *  • Live attack type distribution (donut)
 *  • Average confidence per attack type (bar chart)
 *  • Trending attack (most active in recent window)
 *  • Threat severity timeline feed
 */

const ATTACK_META = {
  DOS_SYN:      { label: 'DoS-SYN',       color: '#ff6b35', icon: '🔥' },
  MIRAI_ACK:    { label: 'Mirai-ACK',     color: '#ff3b3b', icon: '⚡' },
  MIRAI_HTTP:   { label: 'Mirai-HTTP',    color: '#ef4444', icon: '⚡' },
  MIRAI_UDP:    { label: 'Mirai-UDP',     color: '#dc2626', icon: '⚡' },
  HOST_DISC:    { label: 'Host Disc.',    color: '#f59e0b', icon: '🔍' },
  TELNET_BRUTE: { label: 'Telnet-Brute',  color: '#fb923c', icon: '🔑' },
  MITM_ARP:     { label: 'MITM-ARP',      color: '#a855f7', icon: '🌐' },
  SCAN_HOST:    { label: 'Scan-Host',     color: '#f5c518', icon: '📡' },
  SCAN_PORT:    { label: 'Scan-Port',     color: '#eab308', icon: '📡' },
  SCAN_OS:      { label: 'Scan-OS',       color: '#ca8a04', icon: '📡' },
};

function DarkTip({ active, payload }) {
  if (!active || !payload?.length) return null;
  const d = payload[0];
  return (
    <div style={{
      background: '#ffffff', border: '1px solid #e2e8f0',
      borderRadius: 8, padding: '8px 12px', fontSize: 11,
      fontFamily: 'JetBrains Mono', color: '#1e293b', boxShadow: '0 4px 12px rgba(0,0,0,0.08)'
    }}>
      <p style={{ color: d.payload?.color || d.fill, fontWeight: 700, marginBottom: 2 }}>
        {d.name}
      </p>
      <p>Count: {d.value}</p>
    </div>
  );
}

function ConfTip({ active, payload, label }) {
  if (!active || !payload?.length) return null;
  return (
    <div style={{
      background: '#ffffff', border: '1px solid #e2e8f0',
      borderRadius: 8, padding: '8px 12px', fontSize: 11,
      fontFamily: 'JetBrains Mono', color: '#1e293b', boxShadow: '0 4px 12px rgba(0,0,0,0.08)'
    }}>
      <p style={{ color: '#0284c7', fontWeight: 700 }}>{label}</p>
      <p>Avg Confidence: {payload[0]?.value}%</p>
    </div>
  );
}

export default function AttackIntelligence({ packets, stats }) {
  const byClass = stats?.byClass || {};

  // ── Derived attack distribution (exclude BENIGN) ─────────────────────────
  const attackEntries = useMemo(() =>
    Object.entries(byClass)
      .filter(([key]) => key !== 'BENIGN')
      .map(([key, count]) => ({
        key,
        name:  ATTACK_META[key]?.label || key,
        value: count,
        color: ATTACK_META[key]?.color || '#4d6b8a',
        icon:  ATTACK_META[key]?.icon  || '⚠',
      }))
      .filter(e => e.value > 0)
      .sort((a, b) => b.value - a.value),
    [byClass]
  );

  const totalAttacks = attackEntries.reduce((s, e) => s + e.value, 0);
  const trending     = attackEntries[0] || null;

  // ── Average confidence per attack type  (from last 100 packets) ──────────
  const confByType = useMemo(() => {
    const accum = {};
    const counts = {};

    // Map backend category → ATTACK_META key
    const CAT_TO_KEY = {
      'dos': 'DOS_SYN', 'ddos': 'MIRAI_ACK', 'recon': 'SCAN_HOST',
      'brute': 'TELNET_BRUTE', 'mitm': 'MITM_ARP',
    };

    const recent = (packets || []).filter(p => p.category !== 'benign').slice(0, 100);
    for (const pkt of recent) {
      const cat = (pkt.category || 'unknown').toLowerCase();
      const metaKey = CAT_TO_KEY[cat] || 'HOST_DISC';
      const label = ATTACK_META[metaKey]?.label || pkt.classification || cat;
      accum[label]  = (accum[label]  || 0) + (pkt.confidence || 0);
      counts[label] = (counts[label] || 0) + 1;
    }

    return Object.entries(accum).map(([name, total]) => ({
      name,
      conf: Math.round((total / counts[name]) * 100),
      color: Object.values(ATTACK_META).find(m => m.label === name)?.color || '#4d6b8a',
    }));
  }, [packets]);

  // ── Recent alerts feed ────────────────────────────────────────────────────
  const recentAlerts = useMemo(() =>
    (packets || [])
      .filter(p => p.category !== 'benign')
      .slice(0, 8),
    [packets]
  );

  return (
    <div className="panel flex flex-col h-full min-h-0 overflow-hidden">
      {/* Header */}
      <div className="panel-header flex-shrink-0">
        <span className="panel-title">Attack Intelligence</span>
        <div className="flex items-center gap-2">
          <span className="text-xs font-mono text-soc-muted">
            {totalAttacks} attacks detected
          </span>
          {trending && (
            <span className="px-2 py-0.5 text-xs font-mono rounded-md"
                  style={{ background: trending.color + '20', color: trending.color, border: `1px solid ${trending.color}40` }}>
              {trending.icon} {trending.name} trending
            </span>
          )}
        </div>
      </div>

      {totalAttacks === 0 ? (
        /* No attacks yet */
        <div className="flex-1 flex flex-col items-center justify-center gap-3 text-soc-muted">
          <div style={{ fontSize: 40 }}>🛡️</div>
          <p className="text-sm font-mono text-soc-green font-semibold">Network Clear</p>
          <p className="text-xs font-mono text-center px-4">
            No attacks detected. Run an attack script to see intelligence data.
          </p>
        </div>
      ) : (
        <div className="flex-1 min-h-0 overflow-y-auto flex flex-col gap-3 p-3">

          {/* ── Row 1: Donut + Stats ─────────────────────────────────────── */}
          <div className="flex gap-3">
            {/* Donut chart */}
            <div style={{ width: 140, height: 130, flexShrink: 0 }}>
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie
                    data={attackEntries}
                    cx="50%" cy="50%"
                    innerRadius={32} outerRadius={55}
                    paddingAngle={3}
                    dataKey="value"
                  >
                    {attackEntries.map((e, i) => (
                      <Cell key={i} fill={e.color} fillOpacity={0.85} />
                    ))}
                  </Pie>
                  <Tooltip content={<DarkTip />} />
                </PieChart>
              </ResponsiveContainer>
            </div>

            {/* Attack type breakdown list */}
            <div className="flex-1 flex flex-col justify-center gap-1.5">
              {attackEntries.map(e => {
                const pct = totalAttacks > 0 ? ((e.value / totalAttacks) * 100).toFixed(1) : 0;
                return (
                  <div key={e.key} className="flex items-center gap-2">
                    <span style={{ color: e.color, fontSize: 13 }}>{e.icon}</span>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center justify-between">
                        <span className="text-xs font-mono font-semibold" style={{ color: e.color }}>
                          {e.name}
                        </span>
                        <span className="text-xs font-mono text-soc-muted ml-1">{e.value} ({pct}%)</span>
                      </div>
                      <div className="h-1 rounded-full bg-soc-border mt-0.5">
                        <div className="h-1 rounded-full transition-all duration-500"
                             style={{ width: `${pct}%`, background: e.color, boxShadow: `0 0 4px ${e.color}66` }} />
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

          {/* ── Row 2: Confidence per attack type ───────────────────────── */}
          {confByType.length > 0 && (
            <div>
              <p className="text-xs font-mono text-soc-muted tracking-widest mb-1">
                MODEL CONFIDENCE PER ATTACK TYPE
              </p>
              <div style={{ height: 90 }}>
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={confByType} margin={{ top: 2, right: 4, left: -20, bottom: 0 }}>
                    <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" vertical={false} />
                    <XAxis dataKey="name" tick={{ fill: '#64748b', fontSize: 9, fontFamily: 'JetBrains Mono' }}
                           axisLine={false} tickLine={false} />
                    <YAxis domain={[0, 100]} tick={{ fill: '#64748b', fontSize: 9, fontFamily: 'JetBrains Mono' }}
                           axisLine={false} tickLine={false} tickFormatter={v => `${v}%`} />
                    <Tooltip content={<ConfTip />} />
                    <Bar dataKey="conf" radius={[3, 3, 0, 0]} maxBarSize={36}>
                      {confByType.map((e, i) => (
                        <Cell key={i} fill={e.color} fillOpacity={0.8} />
                      ))}
                    </Bar>
                  </BarChart>
                </ResponsiveContainer>
              </div>
            </div>
          )}

          {/* ── Row 3: Recent Attack Alerts Feed ────────────────────────── */}
          <div>
            <p className="text-xs font-mono text-soc-muted tracking-widest mb-1">
              RECENT ATTACK ALERTS
            </p>
            <div className="flex flex-col gap-1">
              {recentAlerts.map((pkt, i) => {
                const cat = (pkt.category || 'unknown').toLowerCase();
                const CAT_MAP = {
                  'dos': 'DOS_SYN', 'ddos': 'MIRAI_ACK', 'recon': 'SCAN_HOST',
                  'brute': 'TELNET_BRUTE', 'mitm': 'MITM_ARP',
                };
                const metaKey = CAT_MAP[cat] || 'HOST_DISC';
                const color = ATTACK_META[metaKey]?.color || '#ff3b3b';
                const icon  = ATTACK_META[metaKey]?.icon  || '⚠';
                const t = new Date(pkt.timestamp).toLocaleTimeString('en-US', {
                  hour12: false, hour: '2-digit', minute: '2-digit', second: '2-digit'
                });
                return (
                  <div key={pkt._id || i}
                       className="flex items-center gap-2 px-2 py-1 rounded text-xs font-mono"
                       style={{ background: color + '10', border: `1px solid ${color}25` }}>
                    <span style={{ color }}>{icon}</span>
                    <span style={{ color, fontWeight: 700 }}>{pkt.classification}</span>
                    <span className="text-soc-muted flex-1 truncate">
                      {pkt.sourceIp} → {pkt.destIp}
                    </span>
                    <span className="text-soc-muted">{t}</span>
                    <span className="font-semibold" style={{ color }}>
                      sev {pkt.severityScore}
                    </span>
                  </div>
                );
              })}
            </div>
          </div>

        </div>
      )}
    </div>
  );
}
