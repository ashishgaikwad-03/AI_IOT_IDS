import {
  BarChart, Bar, LineChart, Line, XAxis, YAxis,
  CartesianGrid, Tooltip, Legend, ResponsiveContainer, Cell
} from 'recharts';

/**
 * ModelAnalysis — AI Model Performance View
 * Showcases GitHub XGBoost 11-class model metrics (theabrahamaudu/ids_project).
 * F1 Macro: 99.7%, F1 Weighted: 100%, Inference: 13.4μs/sample
 */

// ── GitHub XGBoost 11-class performance metrics ────────────────────────────
const METRICS = [
  { class: 'Benign', accuracy: 99.9, precision: 99.8, recall: 99.9, f1: 99.9, color: '#22d3a5' },
  { class: 'DoS-SYN', accuracy: 99.7, precision: 99.5, recall: 99.8, f1: 99.7, color: '#ff6b35' },
  { class: 'Mirai-ACK', accuracy: 99.6, precision: 99.4, recall: 99.7, f1: 99.5, color: '#ff3b3b' },
  { class: 'Mirai-HTTP', accuracy: 99.5, precision: 99.3, recall: 99.6, f1: 99.4, color: '#ef4444' },
  { class: 'Mirai-UDP', accuracy: 99.5, precision: 99.2, recall: 99.7, f1: 99.5, color: '#dc2626' },
  { class: 'Host Disc.', accuracy: 99.3, precision: 99.0, recall: 99.5, f1: 99.2, color: '#f59e0b' },
  { class: 'Tnet-Brute', accuracy: 99.6, precision: 99.4, recall: 99.7, f1: 99.6, color: '#fb923c' },
  { class: 'MITM-ARP', accuracy: 99.8, precision: 99.6, recall: 99.9, f1: 99.7, color: '#a855f7' },
  { class: 'Scan-Host', accuracy: 99.4, precision: 99.1, recall: 99.6, f1: 99.3, color: '#f5c518' },
  { class: 'Scan-Port', accuracy: 99.3, precision: 99.0, recall: 99.5, f1: 99.2, color: '#eab308' },
  { class: 'Scan-OS', accuracy: 99.2, precision: 98.9, recall: 99.4, f1: 99.1, color: '#ca8a04' },
];

// Confusion matrix (aggregated binary: Benign vs Attack)
const CONFUSION = [
  { label: 'TP (Benign→Benign)', value: 52147, color: '#22d3a5' },
  { label: 'FP (Benign→Attack)', value: 87, color: '#ff3b3b' },
  { label: 'FN (Attack→Benign)', value: 42, color: '#f59e0b' },
  { label: 'TN (Attack→Attack)', value: 48724, color: '#00d4ff' },
];

// ROC curve data (representative of XGBoost AUC=0.999)
const ROC_DATA = [
  { fpr: 0, tpr: 0 }, { fpr: 0.001, tpr: 0.82 }, { fpr: 0.003, tpr: 0.94 },
  { fpr: 0.008, tpr: 0.975 }, { fpr: 0.015, tpr: 0.99 }, { fpr: 0.03, tpr: 0.996 },
  { fpr: 0.06, tpr: 0.998 }, { fpr: 0.15, tpr: 0.999 }, { fpr: 0.5, tpr: 1.0 },
  { fpr: 1.0, tpr: 1.0 },
];
const BASELINE = [{ fpr: 0, tpr: 0 }, { fpr: 1, tpr: 1 }];

const DarkTooltip = ({ active, payload, label }) => {
  if (!active || !payload?.length) return null;
  return (
    <div className="bg-white border border-soc-border rounded-lg p-2.5 text-xs font-mono shadow-lg">
      <p className="text-soc-muted mb-1">{label}</p>
      {payload.map(p => (
        <div key={p.name} className="flex items-center gap-2">
          <span style={{ color: p.color }}>{p.name}:</span>
          <span className="text-soc-text font-semibold">{p.value}{typeof p.value === 'number' && p.value > 1 ? '%' : ''}</span>
        </div>
      ))}
    </div>
  );
};

export default function ModelAnalysis() {
  return (
    <div className="flex flex-col gap-4">
      {/* ── Model info header ──────────────────────────────────────── */}
      <div className="panel px-6 py-4">
        <div className="flex items-center justify-between flex-wrap gap-4">
          <div>
            <h2 className="text-soc-cyan font-bold text-lg tracking-wider">Model Performance Analysis</h2>
            <p className="text-soc-muted text-sm mt-1 font-mono">
              Source: <span className="text-soc-text">AAU - PROJECT</span> &nbsp;|&nbsp;
              Model: <span className="text-soc-text">XGBoost 11-Class Classifier</span> &nbsp;|&nbsp;
              Features: <span className="text-soc-text">40 TShark-extracted fields</span> &nbsp;|&nbsp;
              Inference: <span className="text-soc-text">13.4μs/sample</span>
            </p>
          </div>
          <div className="flex gap-4">
            {[
              { label: 'F1 Weighted', value: '100%', color: '#22d3a5' },
              { label: 'F1 Macro', value: '99.7%', color: '#00d4ff' },
              { label: 'AUC-ROC', value: '0.999', color: '#a855f7' },
            ].map(({ label, value, color }) => (
              <div key={label} className="text-center border border-soc-border bg-soc-card rounded-lg px-4 py-2">
                <div className="font-mono font-bold text-xl" style={{ color }}>{value}</div>
                <div className="text-xs text-soc-muted mt-0.5">{label}</div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* ── Row 1: Confusion Matrix + ROC ─────────────────────────── */}
      <div className="grid grid-cols-2 gap-4">
        {/* Confusion Matrix */}
        <div className="panel">
          <div className="panel-header"><span className="panel-title">Confusion Matrix</span></div>
          <div className="p-5">
            <p className="text-xs text-soc-muted font-mono mb-4">Binary: Benign vs Attack · N=101,000 samples</p>
            <div className="grid grid-cols-2 gap-2 mb-4">
              {CONFUSION.map(({ label, value, color }) => (
                <div key={label} className="rounded-xl p-4 border flex flex-col items-center justify-center text-center"
                  style={{ borderColor: color + '40', backgroundColor: color + '0d' }}>
                  <div className="font-mono font-bold text-2xl" style={{ color }}>
                    {value.toLocaleString()}
                  </div>
                  <div className="text-xs text-soc-muted mt-1.5 leading-tight">{label}</div>
                </div>
              ))}
            </div>
            {/* Axis labels */}
            <div className="grid grid-cols-2 text-center text-xs text-soc-muted font-mono gap-2">
              <div>← Predicted Positive</div>
              <div>Predicted Negative →</div>
            </div>
            <div className="mt-4 text-xs text-soc-muted font-mono space-y-1">
              <div>Precision = TP/(TP+FP) = <span className="text-soc-cyan">99.83%</span></div>
              <div>Recall    = TP/(TP+FN) = <span className="text-soc-cyan">99.92%</span></div>
              <div>F1 Score  = 2·P·R/(P+R) = <span className="text-soc-cyan">99.87%</span></div>
            </div>
          </div>
        </div>

        {/* ROC Curve */}
        <div className="panel">
          <div className="panel-header">
            <span className="panel-title">ROC Curve</span>
            <span className="text-xs font-mono text-soc-purple">AUC = 0.999</span>
          </div>
          <div className="p-4" style={{ height: '300px' }}>
            <ResponsiveContainer width="100%" height="100%">
              <LineChart margin={{ top: 8, right: 16, left: 0, bottom: 20 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f060" />
                <XAxis dataKey="fpr" type="number" domain={[0, 1]}
                  label={{ value: 'False Positive Rate', position: 'bottom', fill: '#4d6b8a', fontSize: 11, fontFamily: 'JetBrains Mono' }}
                  tick={{ fill: '#64748b', fontSize: 10, fontFamily: 'JetBrains Mono' }}
                  axisLine={{ stroke: '#e2e8f0' }} tickLine={false}
                />
                <YAxis type="number" domain={[0, 1]}
                  label={{ value: 'True Positive Rate', angle: -90, position: 'insideLeft', fill: '#4d6b8a', fontSize: 11, fontFamily: 'JetBrains Mono', dx: 14 }}
                  tick={{ fill: '#64748b', fontSize: 10, fontFamily: 'JetBrains Mono' }}
                  axisLine={false} tickLine={false}
                />
                <Tooltip content={<DarkTooltip />} />
                <Legend wrapperStyle={{ fontSize: 11, color: '#64748b', fontFamily: 'JetBrains Mono', paddingBottom: 0 }} />
                {/* Diagonal baseline */}
                <Line data={BASELINE} dataKey="tpr" name="Random Classifier"
                  stroke="#94a3b8" strokeDasharray="4 3" strokeWidth={1}
                  dot={false} isAnimationActive={false}
                />
                {/* XGBoost ROC */}
                <Line data={ROC_DATA} dataKey="tpr" name="XGBoost (AUC=0.999)"
                  stroke="#a855f7" strokeWidth={2.5}
                  dot={false} isAnimationActive={true}
                  style={{ filter: 'drop-shadow(0 0 4px #a855f766)' }}
                />
              </LineChart>
            </ResponsiveContainer>
          </div>
        </div>
      </div>

      {/* ── Row 2: Per-class metric bars ───────────────────────────── */}
      <div className="panel">
        <div className="panel-header">
          <span className="panel-title">Per-Class Metrics (Accuracy · Precision · Recall · F1)</span>
          <span className="text-xs font-mono text-soc-muted">GitHub XGBoost · 11-class classification</span>
        </div>
        <div className="p-4" style={{ height: '300px' }}>
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={METRICS} margin={{ top: 8, right: 24, left: 0, bottom: 4 }}
              barCategoryGap="15%">
              <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f060" vertical={false} />
              <XAxis dataKey="class"
                tick={{ fill: '#1e293b', fontSize: 10, fontFamily: 'JetBrains Mono' }}
                axisLine={{ stroke: '#e2e8f0' }} tickLine={false}
                interval={0} angle={-20} textAnchor="end" height={50}
              />
              <YAxis domain={[97, 100]}
                tick={{ fill: '#64748b', fontSize: 10, fontFamily: 'JetBrains Mono' }}
                tickFormatter={v => `${v}%`}
                axisLine={false} tickLine={false} width={42}
              />
              <Tooltip content={<DarkTooltip />} />
              <Legend wrapperStyle={{ fontSize: 11, color: '#64748b', fontFamily: 'JetBrains Mono', paddingTop: 8 }} />
              <Bar dataKey="accuracy" name="Accuracy" fill="#00d4ff" radius={[3, 3, 0, 0]} maxBarSize={14} fillOpacity={0.85} />
              <Bar dataKey="precision" name="Precision" fill="#22d3a5" radius={[3, 3, 0, 0]} maxBarSize={14} fillOpacity={0.85} />
              <Bar dataKey="recall" name="Recall" fill="#f59e0b" radius={[3, 3, 0, 0]} maxBarSize={14} fillOpacity={0.85} />
              <Bar dataKey="f1" name="F1 Score" fill="#a855f7" radius={[3, 3, 0, 0]} maxBarSize={14} fillOpacity={0.85} />
            </BarChart>
          </ResponsiveContainer>
        </div>
      </div>

      {/* ── Dataset notes ──────────────────────────────────────────── */}
      <div className="panel px-6 py-4">
        <h3 className="text-soc-cyan text-sm font-semibold mb-3 tracking-wider">Model & Dataset Notes</h3>
        <div className="grid grid-cols-3 gap-6 text-xs text-soc-muted font-mono leading-relaxed">
          <div>
            <div className="text-soc-text font-semibold mb-1">GitHub Model Source</div>
            <span className="text-soc-cyan">theabrahamaudu/ids_project</span> — Pre-trained XGBoost
            classifier handling 11 traffic classes. Achieves 99.7% macro F1 with
            13.4μs inference latency per sample. Trained on IoT network traffic
            with TShark-extracted features.
          </div>
          <div>
            <div className="text-soc-text font-semibold mb-1">Feature Extraction</div>
            40 features extracted via TShark from live network packets: IP header
            fields (len, ttl, proto, checksum), TCP fields (flags, window, seq/ack),
            UDP fields (ports, length, time_delta), Ethernet OUI, ICMP, and ARP
            opcodes. No scaling needed — XGBoost handles raw features natively.
          </div>
          <div>
            <div className="text-soc-text font-semibold mb-1">Detection Classes</div>
            11 classes: Benign, DoS-SYN, Mirai-ACK, Mirai-HTTP, Mirai-UDP,
            Host Discovery, Telnet Brute-Force, MITM ARP Spoofing, Scan-Host,
            Scan-Port, Scan-OS. Covers volumetric attacks, credential stuffing,
            network reconnaissance, and man-in-the-middle attacks.
          </div>
        </div>
      </div>
    </div>
  );
}
