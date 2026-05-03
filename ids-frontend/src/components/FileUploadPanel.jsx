import { useState, useRef, useCallback } from 'react';
import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer,
  PieChart, Pie, Cell, Legend,
} from 'recharts';

/**
 * FileUploadPanel — Offline Traffic File Scanner
 *
 * Accepts CSV (or PCAP with redirect guide) and sends to backend for analysis.
 * Results: summary stats, threat distribution pie, per-class bar chart, full table.
 *
 * API: POST /api/upload/scan (multipart/form-data, field: "file")
 */

const CLASS_META = {
  BENIGN:      { label: 'Benign',    color: '#22d3a5', badge: 'badge-benign', short: 'BENIGN'   },
  // DDoS variants
  'DDOS·TCP':  { label: 'DDoS TCP', color: '#ff3b3b', badge: 'badge-ddos',   short: 'DDoS·TCP' },
  'DDOS·UDP':  { label: 'DDoS UDP', color: '#ff3b3b', badge: 'badge-ddos',   short: 'DDoS·UDP' },
  // DoS variants
  'DOS·HTTP':  { label: 'DoS HTTP', color: '#ff6b35', badge: 'badge-ddos',   short: 'DoS·HTTP' },
  'DOS·TCP':   { label: 'DoS TCP',  color: '#ff6b35', badge: 'badge-ddos',   short: 'DoS·TCP'  },
  'DOS·UDP':   { label: 'DoS UDP',  color: '#ff6b35', badge: 'badge-ddos',   short: 'DoS·UDP'  },
  // Recon
  'OS SCAN':   { label: 'OS Scan',  color: '#f59e0b', badge: 'badge-scan',   short: 'OS SCAN'  },
  'SVC SCAN':  { label: 'Svc Scan', color: '#f5c518', badge: 'badge-scan',   short: 'SVC SCAN' },
  // Theft
  KEYLOG:      { label: 'Keylog',   color: '#a855f7', badge: 'badge-exfil',  short: 'KEYLOG'   },
  'DATA EXFIL':{ label: 'Exfil',    color: '#a855f7', badge: 'badge-exfil',  short: 'EXFIL'    },
  // Layer2
  'L2 ANOMALY':{ label: 'L2 Anom', color: '#e879f9', badge: 'badge-ddos',   short: 'L2 ANOM'  },
};

/* Custom bar chart tooltip */
function BarTip({ active, payload, label }) {
  if (!active || !payload?.length) return null;
  return (
    <div className="bg-soc-card border border-soc-border rounded-lg px-3 py-2 text-xs font-mono shadow-lg">
      <p className="text-soc-text font-semibold mb-1">{label}</p>
      {payload.map((p) => (
        <p key={p.name} style={{ color: p.fill }}>{p.name}: {p.value}</p>
      ))}
    </div>
  );
}

/* Custom pie chart tooltip */
function PieTip({ active, payload }) {
  if (!active || !payload?.length) return null;
  const d = payload[0];
  return (
    <div className="bg-soc-card border border-soc-border rounded-lg px-3 py-2 text-xs font-mono shadow-lg">
      <p style={{ color: d.payload.color }} className="font-semibold">{d.name}</p>
      <p className="text-soc-text">Count: {d.value}</p>
      <p className="text-soc-muted">Share: {d.payload.pct}%</p>
    </div>
  );
}

export default function FileUploadPanel() {
  const [isDragging, setIsDragging] = useState(false);
  const [isScanning, setIsScanning] = useState(false);
  const [result,     setResult]     = useState(null);
  const [error,      setError]      = useState(null);
  const [fileName,   setFileName]   = useState(null);
  const [progress,   setProgress]   = useState(0);
  const fileInputRef = useRef(null);

  const API_BASE = import.meta.env.VITE_API_URL || `${window.location.protocol}//${window.location.host}`;

  const processFile = useCallback(async (file) => {
    if (!file) return;
    setFileName(file.name);
    setIsScanning(true);
    setResult(null);
    setError(null);
    setProgress(0);

    // Fake progress animation while awaiting server
    const ticker = setInterval(() => setProgress(p => Math.min(p + 6, 90)), 200);

    const formData = new FormData();
    formData.append('file', file);

    try {
      const res  = await fetch(`${API_BASE}/api/analyze-file`, { method: 'POST', body: formData });
      const data = await res.json();
      if (res.status !== 200) throw new Error(data.detail || data.error || 'Request failed');
      setProgress(100);
      setTimeout(() => setResult(data), 300);
    } catch (e) {
      setError(e.message || 'Upload failed. Is the backend running?');
    } finally {
      clearInterval(ticker);
      setIsScanning(false);
    }
  }, []);

  // Helper: get meta for a display label (handles exact match + prefix match)
  const getMeta = (cls) => {
    if (!cls) return { label: cls, color: '#4d6b8a', badge: 'badge-scan', short: cls };
    const upper = cls.toUpperCase();
    // Exact match first
    if (CLASS_META[cls])  return CLASS_META[cls];
    if (CLASS_META[upper]) return CLASS_META[upper];
    // Prefix match for variants
    for (const [k, v] of Object.entries(CLASS_META)) {
      if (upper.startsWith(k) || k.startsWith(upper)) return v;
    }
    return { label: cls, color: '#4d6b8a', badge: 'badge-scan', short: cls };
  };

  const onDrop      = useCallback((e) => { e.preventDefault(); setIsDragging(false); const f = e.dataTransfer.files[0]; if (f) processFile(f); }, [processFile]);
  const onDragOver  = (e) => { e.preventDefault(); setIsDragging(true);  };
  const onDragLeave = ()  => setIsDragging(false);
  const onFileChange= (e) => { const f = e.target.files[0]; if (f) processFile(f); };

  // ── Derived chart data ─────────────────────────────────────────────────
  const byClass = {};
  if (result?.records) {
    for (const r of result.records) {
      byClass[r.classification] = (byClass[r.classification] || 0) + 1;
    }
  }

  const pieData = Object.entries(byClass).map(([cls, cnt]) => {
    const meta = getMeta(cls);
    return {
      name:  meta.label,
      value: cnt,
      color: meta.color,
      pct:   result ? ((cnt / result.totalRecords) * 100).toFixed(1) : 0,
    };
  });

  const barData = Object.entries(byClass).map(([cls, cnt]) => {
    const meta = getMeta(cls);
    return { class: meta.label, Count: cnt, fill: meta.color };
  });

  // Confidence buckets for histogram
  const confBuckets = { '70–79': 0, '80–89': 0, '90–94': 0, '95–100': 0 };
  if (result?.records) {
    for (const r of result.records) {
      const pct = Math.round((r.confidence || 0) * 100);
      if (pct < 80)       confBuckets['70–79']++;
      else if (pct < 90)  confBuckets['80–89']++;
      else if (pct < 95)  confBuckets['90–94']++;
      else                confBuckets['95–100']++;
    }
  }
  const confData = Object.entries(confBuckets).map(([range, cnt]) => ({ range, Count: cnt }));

  const attackPct = result
    ? ((result.attackCount / Math.max(result.totalRecords, 1)) * 100).toFixed(1)
    : 0;

  return (
    <div className="flex flex-col gap-4">

      {/* ── Page header ────────────────────────────────────────────────── */}
      <div className="panel px-6 py-4 flex flex-wrap items-center justify-between gap-3">
        <div>
          <h2 className="text-soc-cyan font-bold text-lg tracking-wider flex items-center gap-2">
            <svg width="18" height="18" viewBox="0 0 18 18" fill="none" className="flex-shrink-0">
              <path d="M9 1L16.5 5v8L9 17 1.5 13V5L9 1z" stroke="#00d4ff" strokeWidth="1.3"/>
              <path d="M6 9l2 2 4-4" stroke="#00d4ff" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
            </svg>
            Offline Traffic File Scanner
          </h2>
          <p className="text-soc-muted text-sm mt-0.5 font-mono">
            Upload stored capture files — AI classifier analyses every packet for threats
          </p>
        </div>
        <div className="flex items-center gap-2">
          <span className="px-3 py-1.5 rounded-lg border border-soc-green/30 bg-soc-green/5 text-xs font-mono text-soc-green">
            ✓ CSV — Full Support (XGBoost)
          </span>
          <span className="px-3 py-1.5 rounded-lg border border-soc-green/30 bg-soc-green/5 text-xs font-mono text-soc-green">
            ✓ PCAP — Layer2 Model
          </span>
          {result && (
            <button
              onClick={() => { setResult(null); setFileName(null); setProgress(0); }}
              className="px-3 py-1.5 rounded-lg border border-soc-border hover:border-soc-cyan/40 text-xs font-mono text-soc-muted hover:text-soc-cyan transition-colors"
            >
              ✕ Clear Results
            </button>
          )}
        </div>
      </div>

      {/* ── Drop zone ──────────────────────────────────────────────────── */}
      {!result && (
        <div
          onDrop={onDrop}
          onDragOver={onDragOver}
          onDragLeave={onDragLeave}
          onClick={() => !isScanning && fileInputRef.current?.click()}
          className={`panel transition-all duration-300 flex flex-col items-center justify-center py-14 gap-5
            ${isScanning ? 'cursor-wait' : 'cursor-pointer'}
            ${isDragging
              ? 'border-soc-cyan bg-soc-cyan/5 shadow-[0_0_30px_rgba(0,212,255,0.12)]'
              : 'hover:border-soc-cyan/50 hover:bg-soc-cyan/[0.02]'}`}
        >
          <input
            ref={fileInputRef}
            type="file"
            accept=".csv,.pcap,.pcapng,.cap"
            className="hidden"
            onChange={onFileChange}
          />

          {isScanning ? (
            /* Scanning state */
            <div className="flex flex-col items-center gap-5 w-full max-w-xs">
              {/* Animated scanner icon */}
              <div className="relative w-16 h-16">
                <svg viewBox="0 0 64 64" className="w-full h-full text-soc-cyan" fill="none">
                  <circle cx="32" cy="32" r="30" stroke="currentColor" strokeWidth="1" opacity="0.2"/>
                  <circle cx="32" cy="32" r="30" stroke="currentColor" strokeWidth="1.5"
                    strokeDasharray="47 141" strokeLinecap="round" className="animate-spin origin-center"/>
                  <circle cx="32" cy="32" r="18" stroke="currentColor" strokeWidth="0.8" opacity="0.3"/>
                  <path d="M20 32h24M32 20v24" stroke="currentColor" strokeWidth="1" opacity="0.4"/>
                  <circle cx="32" cy="32" r="4" fill="currentColor"/>
                </svg>
                {/* Scanning line sweep */}
                <div className="absolute inset-0 rounded-full overflow-hidden">
                  <div className="absolute inset-0 bg-gradient-to-b from-soc-cyan/20 to-transparent animate-pulse"/>
                </div>
              </div>
              <div className="text-center">
                <p className="text-soc-cyan font-mono text-sm animate-pulse font-semibold">Analysing {fileName}…</p>
                <p className="text-soc-muted text-xs mt-1 font-mono">Running AI classifier on each packet</p>
              </div>
              {/* Progress bar */}
              <div className="w-full bg-soc-border rounded-full h-1.5">
                <div
                  className="h-1.5 rounded-full bg-gradient-to-r from-soc-cyan to-soc-green transition-all duration-300"
                  style={{ width: `${progress}%` }}
                />
              </div>
              <p className="text-xs font-mono text-soc-muted">{progress}% complete</p>
            </div>
          ) : (
            <>
              {/* Upload icon */}
              <div className={`transition-colors duration-200 ${isDragging ? 'text-soc-cyan' : 'text-soc-muted'}`}>
                <svg width="60" height="60" viewBox="0 0 60 60" fill="none">
                  <circle cx="30" cy="30" r="28" stroke="currentColor" strokeWidth="1.2" strokeDasharray="5 3"/>
                  <path d="M30 38V24M30 24L24 30M30 24L36 30" stroke="currentColor" strokeWidth="2.2"
                    strokeLinecap="round" strokeLinejoin="round"/>
                  <path d="M20 44h20" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" opacity="0.5"/>
                </svg>
              </div>

              <div className="text-center">
                <p className={`font-semibold text-base ${isDragging ? 'text-soc-cyan' : 'text-soc-text'}`}>
                  {isDragging ? '📂 Release to scan' : 'Drop your capture file here'}
                </p>
                <p className="text-soc-muted text-sm mt-1.5">
                  or <span className="text-soc-cyan underline underline-offset-2">browse</span> — accepts{' '}
                  <span className="font-mono text-xs">.csv</span>,{' '}
                  <span className="font-mono text-xs">.pcap</span>,{' '}
                  <span className="font-mono text-xs">.pcapng</span>,{' '}
                  <span className="font-mono text-xs">.cap</span>
                </p>
              </div>

              {/* Format hint */}
              <div className="flex flex-col items-center gap-2 max-w-sm">
                <div className="flex items-center gap-2 px-4 py-2 rounded-lg bg-soc-card border border-soc-border text-xs font-mono text-soc-muted w-full">
                  <span className="text-soc-cyan text-base">ℹ</span>
                  <span>CSV columns: <span className="text-soc-text">src_ip, dst_ip, proto, dport, frame_len</span></span>
                </div>
                <div className="flex items-center gap-2 px-4 py-2 rounded-lg bg-soc-card border border-soc-border text-xs font-mono text-soc-muted w-full">
                  <span className="text-soc-purple text-base">⚡</span>
                  <span>Up to <span className="text-soc-text">10,000 rows</span> analysed per file</span>
                </div>
              </div>
            </>
          )}
        </div>
      )}

      {/* ── Error state ─────────────────────────────────────────────────── */}
      {error && (
        <div className="panel border-soc-red/40 bg-soc-red/5 px-6 py-4 flex items-start gap-3">
          <span className="text-soc-red text-xl flex-shrink-0">⚠</span>
          <div>
            <p className="text-soc-red font-semibold text-sm">Analysis Failed</p>
            <p className="text-soc-muted font-mono text-xs mt-0.5">{error}</p>
          </div>
          <button onClick={() => setError(null)} className="ml-auto text-soc-muted hover:text-soc-text transition-colors text-xs">✕</button>
        </div>
      )}

      {/* ── PCAP guide ──────────────────────────────────────────────────── */}
      {result?.fileType === 'PCAP' && (
        <div className="panel border-soc-amber/40 bg-soc-amber/5 px-6 py-5">
          <div className="flex items-start gap-4">
            <div className="text-4xl">🔬</div>
            <div>
              <h3 className="text-soc-amber font-semibold tracking-wide mb-2">PCAP Native Parsing — Planned for v2.0</h3>
              <p className="text-soc-muted text-sm font-mono leading-relaxed mb-3">
                Full PCAP parsing (pcap4j) is in the roadmap. Export from Wireshark as CSV in the meantime:
              </p>
              <ol className="text-soc-text text-sm space-y-1.5 font-mono">
                <li><span className="text-soc-cyan mr-2">1.</span>Open your .pcap in Wireshark</li>
                <li><span className="text-soc-cyan mr-2">2.</span>File → Export Packet Dissections → As CSV…</li>
                <li><span className="text-soc-cyan mr-2">3.</span>Save and upload the CSV here</li>
              </ol>
            </div>
          </div>
        </div>
      )}

      {/* ══ RESULTS SECTION ════════════════════════════════════════════════ */}
      {result && (
        <div className="flex flex-col gap-4">

          {/* ── Summary cards ─────────────────────────────────────────── */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
            {[
              {
                label: 'File Analysed',
                value: result.filename,
                sub:   `${(result.totalRecords)} packets`,
                color: '#c9d8e8',
                icon: '📄',
              },
              {
                label: 'Total Packets',
                value: result.totalRecords.toLocaleString(),
                sub:   'records scanned',
                color: '#00d4ff',
                icon: '📦',
              },
              {
                label: 'Threats Found',
                value: result.attackCount.toLocaleString(),
                sub:   `${attackPct}% attack rate`,
                color: result.attackCount > 0 ? '#ff3b3b' : '#22d3a5',
                icon: result.attackCount > 0 ? '🚨' : '✅',
              },
              {
                label: 'Clean Traffic',
                value: result.benignCount.toLocaleString(),
                sub:   `${(100 - parseFloat(attackPct)).toFixed(1)}% benign`,
                color: '#22d3a5',
                icon: '🛡️',
              },
            ].map(({ label, value, sub, color, icon }) => (
              <div key={label} className="panel px-5 py-4 flex items-start gap-3">
                <span className="text-2xl flex-shrink-0">{icon}</span>
                <div className="min-w-0">
                  <div className="font-mono font-bold text-xl leading-none truncate" style={{ color }}>{value}</div>
                  <div className="text-xs text-soc-muted mt-1">{label}</div>
                  <div className="text-xs font-mono mt-0.5" style={{ color, opacity: 0.7 }}>{sub}</div>
                </div>
              </div>
            ))}
          </div>

          {/* ── Threat distribution stacked bar ───────────────────────── */}
          <div className="panel px-6 py-4">
            <div className="flex items-center justify-between mb-3">
              <span className="text-xs font-mono text-soc-muted tracking-widest">THREAT DISTRIBUTION</span>
              <span className="text-xs font-mono text-soc-muted">{result.totalRecords.toLocaleString()} records</span>
            </div>
            <div className="h-3 rounded-full overflow-hidden bg-soc-border flex">
              {pieData.map((d) => (
                <div
                  key={d.name}
                  className="h-full transition-all duration-700 first:rounded-l-full last:rounded-r-full"
                  style={{ width: `${d.pct}%`, backgroundColor: d.color }}
                  title={`${d.name}: ${d.value} (${d.pct}%)`}
                />
              ))}
            </div>
            <div className="flex flex-wrap items-center gap-x-4 gap-y-1 mt-2">
              {pieData.map((d) => (
                <span key={d.name} className="text-xs font-mono" style={{ color: d.color }}>
                  ● {d.name}: {d.value} ({d.pct}%)
                </span>
              ))}
            </div>
          </div>

          {/* ── Charts row ────────────────────────────────────────────── */}
          <div className="grid grid-cols-2 gap-3">
            {/* Per-class bar chart */}
            <div className="panel px-5 py-4 flex flex-col">
              <div className="panel-header mb-3">
                <span className="panel-title">Classification Breakdown</span>
                <span className="text-xs font-mono text-soc-muted">packet count per class</span>
              </div>
              <div className="flex-1" style={{ minHeight: '220px' }}>
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={barData} margin={{ top: 4, right: 8, bottom: 4, left: 0 }}>
                    <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" vertical={false}/>
                    <XAxis dataKey="class" tick={{ fill: '#64748b', fontSize: 10, fontFamily: 'JetBrains Mono' }} axisLine={false} tickLine={false}/>
                    <YAxis tick={{ fill: '#64748b', fontSize: 10, fontFamily: 'JetBrains Mono' }} axisLine={false} tickLine={false} width={40}/>
                    <Tooltip content={<BarTip />}/>
                    <Bar dataKey="Count" radius={[4, 4, 0, 0]} maxBarSize={52}>
                      {barData.map((d, i) => (
                        <Cell key={i} fill={d.fill} fillOpacity={0.85}/>
                      ))}
                    </Bar>
                  </BarChart>
                </ResponsiveContainer>
              </div>
            </div>

            {/* Confidence distribution chart */}
            <div className="panel px-5 py-4 flex flex-col">
              <div className="panel-header mb-3">
                <span className="panel-title">Confidence Distribution</span>
                <span className="text-xs font-mono text-soc-muted">AI model certainty buckets</span>
              </div>
              <div className="flex-1" style={{ minHeight: '220px' }}>
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={confData} margin={{ top: 4, right: 8, bottom: 4, left: 0 }}>
                    <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" vertical={false}/>
                    <XAxis dataKey="range" tick={{ fill: '#64748b', fontSize: 10, fontFamily: 'JetBrains Mono' }} axisLine={false} tickLine={false}/>
                    <YAxis tick={{ fill: '#64748b', fontSize: 10, fontFamily: 'JetBrains Mono' }} axisLine={false} tickLine={false} width={40}/>
                    <Tooltip content={<BarTip />}/>
                    <Bar dataKey="Count" fill="#00d4ff" fillOpacity={0.75} radius={[4, 4, 0, 0]} maxBarSize={52}/>
                  </BarChart>
                </ResponsiveContainer>
              </div>
            </div>
          </div>

          {/* ── Full results table ─────────────────────────────────────── */}
          <div className="panel flex flex-col" style={{ maxHeight: '440px' }}>
            <div className="panel-header flex-shrink-0">
              <span className="panel-title">Scan Results</span>
              <span className="text-xs font-mono text-soc-muted">
                {result.totalRecords.toLocaleString()} records · scroll to view all
              </span>
            </div>

            {/* Column headers */}
            <div className="grid grid-cols-8 gap-1 px-3 py-2 border-b border-soc-border bg-soc-bg/60
                            text-xs font-mono text-soc-muted tracking-wider flex-shrink-0">
              <div>#</div>
              <div>SRC IP</div>
              <div>DST IP</div>
              <div>PROTO</div>
              <div>PORT</div>
              <div>SIZE</div>
              <div>CLASSIFICATION</div>
              <div>CONF %</div>
            </div>

            <div className="overflow-y-auto flex-1 font-mono text-xs">
              {result.records.map((r) => {
                const meta   = CLASS_META[r.classification] || CLASS_META.BENIGN;
                const conf   = Math.round((r.confidence || 0) * 100);
                const isAtk  = r.classification !== 'BENIGN';
                return (
                  <div
                    key={r.row}
                    className={`grid grid-cols-8 gap-1 px-3 py-1.5 border-b border-soc-border/50
                      hover:bg-soc-cyan/5 transition-colors
                      ${isAtk ? 'bg-soc-red/[0.04]' : ''}`}
                  >
                    <div className="text-soc-muted/60">{r.row}</div>
                    <div className="text-soc-cyan truncate">{r.sourceIp}</div>
                    <div className="text-soc-text truncate">{r.destIp}</div>
                    <div className="text-soc-purple font-semibold">{r.protocol}</div>
                    <div className="text-soc-text">{r.port || '—'}</div>
                    <div className="text-soc-muted">{r.packetSize}B</div>
                    <div>
                      <span className={`badge ${meta.badge}`}>{meta.short}</span>
                    </div>
                    <div className="flex items-center gap-1.5">
                      <div className="confidence-bar-track flex-1">
                        <div className="confidence-bar-fill"
                          style={{ width: `${conf}%`, backgroundColor: meta.color }} />
                      </div>
                      <span className="w-7 text-right text-soc-muted">{conf}%</span>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

          {/* Re-upload button */}
          <div className="flex justify-center">
            <button
              onClick={() => { setResult(null); setFileName(null); setProgress(0); setTimeout(() => fileInputRef.current?.click(), 100); }}
              className="flex items-center gap-2 px-5 py-2.5 rounded-lg border border-soc-cyan/30 bg-soc-cyan/5
                         text-soc-cyan text-sm font-mono hover:bg-soc-cyan/10 hover:border-soc-cyan/50 transition-all"
            >
              <svg width="14" height="14" viewBox="0 0 14 14" fill="currentColor">
                <path d="M7 1v6M7 1L4.5 3.5M7 1L9.5 3.5" stroke="currentColor" strokeWidth="1.5"
                  strokeLinecap="round" strokeLinejoin="round" fill="none"/>
                <path d="M1 9v2.5C1 12.33 1.67 13 2.5 13h9c.83 0 1.5-.67 1.5-1.5V9"
                  stroke="currentColor" strokeWidth="1.3" strokeLinecap="round" fill="none"/>
              </svg>
              Upload Another File
            </button>
          </div>

        </div>
      )}
    </div>
  );
}
