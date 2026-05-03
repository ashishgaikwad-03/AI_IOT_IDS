import {
  ComposedChart, Line, XAxis, YAxis, CartesianGrid,
  Tooltip, Legend, ResponsiveContainer, Area
} from 'recharts';

/**
 * ThroughputChart — Real-Time Network Throughput Time-Series
 *
 * Renders a Recharts ComposedChart with two data series:
 *   1. Network Throughput (Mbps) — cyan line with area fill
 *   2. Packet Rate (pps)        — amber dashed line
 *
 * Data Source:
 *   props.data = throughputHistory from useWebSocket hook
 *   Format: [{ time: "HH:MM:SS", mbps: number, pps: number }, ...]
 *   Rolling window of last 60 data points (60s at 1 point/sec cadence)
 *
 * Design Decisions:
 *   - ComposedChart allows mixing Area (mbps fill) and Line (pps) series
 *   - Dual Y-axes: left for Mbps, right for pps (different scales)
 *   - isAnimationActive=false prevents jarring full-chart redraws on each update;
 *     instead, the chart naturally pans as new points are appended to the array
 *   - Custom tooltip styled to match SOC dark theme
 *
 * @param {Array} data — throughputHistory array from useWebSocket
 */

const CustomTooltip = ({ active, payload, label }) => {
  if (!active || !payload?.length) return null;
  return (
    <div className="bg-soc-card border border-soc-border rounded-lg p-3 shadow-xl">
      <p className="text-soc-muted text-xs font-mono mb-2">{label}</p>
      {payload.map((entry) => (
        <div key={entry.name} className="flex items-center gap-2 text-xs font-mono">
          <div className="w-2 h-2 rounded-full" style={{ backgroundColor: entry.color }} />
          <span className="text-soc-muted capitalize">{entry.name}:</span>
          <span className="font-semibold" style={{ color: entry.color }}>
            {typeof entry.value === 'number' ? entry.value.toFixed(2) : entry.value}
            {entry.name === 'mbps' ? ' Mbps' : ' pps'}
          </span>
        </div>
      ))}
    </div>
  );
};

export default function ThroughputChart({ data }) {
  const safeData = data || [];

  // Compute current values for the stats row
  const latest   = safeData[safeData.length - 1];
  const peak     = safeData.reduce((acc, d) => Math.max(acc, d.mbps || 0), 0);

  return (
    <div className="panel flex flex-col h-full">
      <div className="panel-header">
        <span className="panel-title">Network Throughput</span>
        <div className="flex items-center gap-4">
          {/* Live stats pills */}
          <span className="text-xs font-mono text-soc-cyan">
            {latest?.mbps?.toFixed(2) ?? '0.00'} <span className="text-soc-muted">Mbps</span>
          </span>
          <span className="text-xs font-mono text-soc-amber">
            {latest?.pps?.toLocaleString() ?? '0'} <span className="text-soc-muted">pps</span>
          </span>
          <span className="text-xs font-mono text-soc-muted">
            Peak: <span className="text-soc-text">{peak.toFixed(2)}</span>
          </span>
        </div>
      </div>

      <div className="flex-1 min-h-0 p-3">
        {safeData.length === 0 ? (
          <div className="h-full flex items-center justify-center">
            <span className="text-soc-muted text-sm font-mono animate-pulse-cyan">
              Awaiting telemetry...
            </span>
          </div>
        ) : (
          <ResponsiveContainer width="100%" height="100%">
            <ComposedChart data={safeData} margin={{ top: 4, right: 40, left: 0, bottom: 0 }}>
              <defs>
                {/* Gradient fill for throughput area */}
                <linearGradient id="mbpsGradient" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%"  stopColor="#00d4ff" stopOpacity={0.25} />
                  <stop offset="95%" stopColor="#00d4ff" stopOpacity={0.02} />
                </linearGradient>
                <linearGradient id="ppsGradient" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%"  stopColor="#f59e0b" stopOpacity={0.15} />
                  <stop offset="95%" stopColor="#f59e0b" stopOpacity={0.02} />
                </linearGradient>
              </defs>

              <CartesianGrid strokeDasharray="3 3" stroke="#1e3a5280" vertical={false} />

              <XAxis
                dataKey="time"
                tick={{ fill: '#4d6b8a', fontSize: 10, fontFamily: 'JetBrains Mono' }}
                tickLine={false}
                axisLine={{ stroke: '#1e3a52' }}
                minTickGap={30}
              />

              {/* Left Y-axis — Mbps */}
              <YAxis
                yAxisId="mbps"
                orientation="left"
                tick={{ fill: '#00d4ff88', fontSize: 10, fontFamily: 'JetBrains Mono' }}
                tickLine={false}
                axisLine={false}
                width={48}
                domain={[0, 'auto']}
                allowDecimals={true}
                tickFormatter={v => v < 0.1 ? v.toFixed(3) : v.toFixed(2)}
              />

              {/* Right Y-axis — pps */}
              <YAxis
                yAxisId="pps"
                orientation="right"
                tick={{ fill: '#f59e0b88', fontSize: 10, fontFamily: 'JetBrains Mono' }}
                tickLine={false}
                axisLine={false}
                width={48}
                domain={[0, 'auto']}
                tickFormatter={v => v >= 1000 ? `${(v/1000).toFixed(1)}k` : Math.round(v)}
              />

              <Tooltip content={<CustomTooltip />} />

              <Legend
                wrapperStyle={{ fontSize: '11px', color: '#4d6b8a', paddingTop: '8px', fontFamily: 'JetBrains Mono' }}
              />

              {/* Throughput Area */}
              <Area
                yAxisId="mbps"
                type="monotone"
                dataKey="mbps"
                stroke="#00d4ff"
                strokeWidth={2}
                fill="url(#mbpsGradient)"
                dot={false}
                isAnimationActive={false}
                name="mbps"
              />

              {/* Packet Rate Line */}
              <Line
                yAxisId="pps"
                type="monotone"
                dataKey="pps"
                stroke="#f59e0b"
                strokeWidth={1.5}
                strokeDasharray="4 2"
                dot={false}
                isAnimationActive={false}
                name="pps"
              />
            </ComposedChart>
          </ResponsiveContainer>
        )}
      </div>
    </div>
  );
}
