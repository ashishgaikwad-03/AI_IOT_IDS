import { useMemo } from 'react';

/**
 * ThreatGauge — Real-Time Threat Severity Index Gauge
 *
 * Renders a custom SVG arc gauge that visualizes the current threat index
 * (derived from the Exponential Moving Average of incoming packet severity scores).
 *
 * Component Architecture:
 *   - SVG-based for pixel-perfect rendering at any DPI
 *   - Single arc path split into: background track + colored fill
 *   - Arc spans 210° (from 7 o'clock to 5 o'clock, typical gauge convention)
 *   - Color interpolates: green (0–30) → amber (30–70) → red (70–100)
 *
 * Severity Zones (matching BoT-IoT attack categories):
 *   0–20:   SAFE       (#22d3a5 green)  — Benign IoT traffic
 *   21–50:  LOW        (#f59e0b amber)  — Potential scan activity
 *   51–75:  MEDIUM     (#f97316 orange) — Confirmed reconnaissance
 *   76–100: CRITICAL   (#ff3b3b red)    — Active attack detected
 *
 * @param {number} threatIndex — 0-100 threat severity (EMA-smoothed)
 */

const GAUGE_RADIUS   = 80;
const STROKE_WIDTH   = 12;
const SWEEP_DEGREES  = 240;  // Arc spans 240 degrees (from ~150° to ~390°)
const START_ANGLE_DEG = 150;  // Gauge starts at bottom-left

/** Convert polar coordinates to SVG Cartesian */
function polarToCartesian(cx, cy, r, angleDeg) {
  const rad = ((angleDeg - 90) * Math.PI) / 180;
  return { x: cx + r * Math.cos(rad), y: cy + r * Math.sin(rad) };
}

/** Build SVG arc path descriptor */
function arcPath(cx, cy, r, startAngle, endAngle) {
  const start = polarToCartesian(cx, cy, r, endAngle);
  const end   = polarToCartesian(cx, cy, r, startAngle);
  const large = endAngle - startAngle > 180 ? 1 : 0;
  return `M ${start.x} ${start.y} A ${r} ${r} 0 ${large} 0 ${end.x} ${end.y}`;
}

/** Map threat index to HSL color string */
function threatColor(index) {
  if (index <= 25) return '#22d3a5';      // Green — safe
  if (index <= 50) return '#f59e0b';      // Amber — low threat
  if (index <= 75) return '#f97316';      // Orange — medium
  return '#ff3b3b';                        // Red — critical
}

/** Map threat index to text label */
function threatLabel(index) {
  if (index <= 20) return 'SAFE';
  if (index <= 40) return 'LOW';
  if (index <= 60) return 'MEDIUM';
  if (index <= 80) return 'HIGH';
  return 'CRITICAL';
}

const CX = 100; // SVG viewBox center X
const CY = 100; // SVG viewBox center Y

export default function ThreatGauge({ threatIndex }) {
  const safeIndex = Math.max(0, Math.min(100, threatIndex || 0));
  const color     = threatColor(safeIndex);
  const label     = threatLabel(safeIndex);

  // Compute arc angles
  const endAngle = START_ANGLE_DEG + (SWEEP_DEGREES * safeIndex) / 100;

  // Background arc (full sweep)
  const trackPath = useMemo(() =>
    arcPath(CX, CY, GAUGE_RADIUS, START_ANGLE_DEG, START_ANGLE_DEG + SWEEP_DEGREES), []);

  // Filled arc (proportional to threatIndex)
  const fillPath  = useMemo(() =>
    arcPath(CX, CY, GAUGE_RADIUS, START_ANGLE_DEG, endAngle),
  [endAngle]);

  // Tick marks at 0, 25, 50, 75, 100
  const ticks = [0, 25, 50, 75, 100].map(val => {
    const angle = START_ANGLE_DEG + (SWEEP_DEGREES * val) / 100;
    const inner = polarToCartesian(CX, CY, GAUGE_RADIUS - 8,  angle);
    const outer = polarToCartesian(CX, CY, GAUGE_RADIUS + 6,  angle);
    return { inner, outer, val };
  });

  return (
    <div className="panel flex flex-col h-full">
      <div className="panel-header">
        <span className="panel-title">Threat Severity Index</span>
        <span className={`badge ${
          safeIndex <= 20 ? 'badge-benign' :
          safeIndex <= 50 ? 'badge-scan' : 'badge-ddos'
        }`}>{label}</span>
      </div>

      <div className="flex-1 flex flex-col items-center justify-center py-2 px-4">
        {/* Gauge SVG */}
        <div className="relative w-48 h-48">
          <svg viewBox="0 0 200 180" className="w-full h-full overflow-visible">
            {/* Background track */}
            <path
              d={trackPath}
              fill="none" stroke="#e2e8f0"
              strokeWidth={STROKE_WIDTH}
              strokeLinecap="round"
            />

            {/* Colored fill arc — animated via CSS transition on d attribute isn't supported,
                but the re-render at 600ms intervals creates smooth animation  */}
            {safeIndex > 0 && (
              <path
                d={fillPath}
                fill="none" stroke={color}
                strokeWidth={STROKE_WIDTH}
                strokeLinecap="round"
                style={{
                  filter: `drop-shadow(0 0 ${safeIndex > 70 ? 8 : 4}px ${color}aa)`,
                  transition: 'stroke 0.4s ease',
                }}
              />
            )}

            {/* Tick marks */}
            {ticks.map(({ inner, outer, val }) => (
              <line
                key={val}
                x1={inner.x} y1={inner.y}
                x2={outer.x} y2={outer.y}
                stroke="#cbd5e1"
                strokeWidth="1.5"
              />
            ))}

            {/* Center display */}
            <text x={CX} y={CY - 10} textAnchor="middle"
              fill={color}
              fontSize="32" fontWeight="700"
              fontFamily="JetBrains Mono, monospace"
              style={{ filter: safeIndex > 60 ? `drop-shadow(0 0 6px ${color}88)` : 'none' }}
            >
              {safeIndex}
            </text>
            <text x={CX} y={CY + 10} textAnchor="middle"
              fill="#94a3b8" fontSize="10" letterSpacing="3"
            >
              / 100
            </text>
            <text x={CX} y={CY + 28} textAnchor="middle"
              fill={color} fontSize="9" letterSpacing="2.5"
              fontFamily="JetBrains Mono, monospace"
            >
              THREAT INDEX
            </text>

            {/* Min/Max labels */}
            <text x="18" y="175" fill="#94a3b8" fontSize="9" fontFamily="monospace">0</text>
            <text x="172" y="175" fill="#94a3b8" fontSize="9" fontFamily="monospace">100</text>
          </svg>
        </div>

        {/* Severity zone legend */}
        <div className="grid grid-cols-2 gap-x-4 gap-y-1 mt-2 w-full max-w-xs">
          {[
            { range: '0–20',   label: 'Safe',     color: '#22d3a5' },
            { range: '21–50',  label: 'Low',      color: '#f59e0b' },
            { range: '51–75',  label: 'High',     color: '#f97316' },
            { range: '76–100', label: 'Critical', color: '#ff3b3b' },
          ].map(({ range, label, color }) => (
            <div key={label} className="flex items-center gap-2">
              <div className="w-2.5 h-2.5 rounded-full flex-shrink-0" style={{ backgroundColor: color }} />
              <span className="text-xs text-soc-muted">{label}</span>
              <span className="text-xs text-soc-muted/50 font-mono">{range}</span>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
