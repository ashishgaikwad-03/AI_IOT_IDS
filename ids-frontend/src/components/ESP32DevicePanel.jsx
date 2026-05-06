import { useMemo } from 'react';

/**
 * ESP32DevicePanel — Hardware Status Monitor
 *
 * Shows real-time status of ESP32 IoT devices (CAM + DHT11 sensor)
 * connected to the same Wi-Fi network. Data comes from /api/esp32/status
 * which is updated by live_guardian.py.
 *
 * @param {Object} esp32Status — from polling GET /api/esp32/status
 */

function formatTime(epoch) {
  if (!epoch || epoch === 0) return '—';
  const d = new Date(epoch * 1000);
  return d.toLocaleTimeString('en-US', {
    hour12: false, hour: '2-digit', minute: '2-digit', second: '2-digit',
  });
}

function formatRate(val) {
  if (!val || val === 0) return '0';
  if (val >= 1000) return `${(val / 1000).toFixed(1)}K`;
  return val.toFixed(1);
}

const CAMERA_BADGE = {
  STREAMING: { label: 'STREAMING', color: '#16a34a', bg: '#f0fdf4', border: '#bbf7d0' },
  FROZEN:    { label: 'FROZEN ⚠',  color: '#d97706', bg: '#fffbeb', border: '#fde68a' },
  DOWN:      { label: 'DOWN',      color: '#dc2626', bg: '#fef2f2', border: '#fecaca' },
  UNKNOWN:   { label: 'WAITING',   color: '#64748b', bg: '#f8fafc', border: '#e2e8f0' },
};

export default function ESP32DevicePanel({ esp32Status }) {
  const s = esp32Status || {};
  const isOnline = s.online === true;
  const isAttack = s.last_prediction && s.last_prediction !== 'BENIGN';
  const camInfo = CAMERA_BADGE[s.camera_status] || CAMERA_BADGE.UNKNOWN;

  const threatColor = isAttack ? '#dc2626' : '#16a34a';
  const threatLabel = isAttack ? 'ATTACK DETECTED' : 'SECURE';
  const threatBg = isAttack ? '#fef2f2' : '#f0fdf4';
  const threatBorder = isAttack ? '#fecaca' : '#bbf7d0';

  return (
    <div className={`panel ${isAttack ? 'animate-pulse-red' : ''}`}
         style={{ transition: 'box-shadow 0.3s ease' }}>
      <div className="panel-header">
        <span className="panel-title">IoT Hardware Status</span>
        <div className="flex items-center gap-3">
          {/* Guardian connection status */}
          <span className="flex items-center gap-1.5 text-xs font-mono"
                style={{ color: isOnline ? '#16a34a' : '#dc2626' }}>
            <span className={`w-2 h-2 rounded-full ${isOnline ? 'bg-soc-green animate-pulse' : 'bg-soc-red'}`} />
            {isOnline ? 'GUARDIAN ACTIVE' : 'GUARDIAN OFFLINE'}
          </span>
          {/* Threat status pill */}
          <span className="px-2.5 py-0.5 rounded-full text-xs font-mono font-semibold"
                style={{
                  color: threatColor,
                  backgroundColor: threatBg,
                  border: `1px solid ${threatBorder}`,
                  boxShadow: isAttack ? `0 0 8px ${threatColor}30` : 'none',
                }}>
            {isAttack ? '🔴' : '🟢'} {threatLabel}
          </span>
        </div>
      </div>

      <div className="p-4">
        <div className="grid grid-cols-4 gap-4">

          {/* ── ESP32-CAM Device Card ──────────────────────────── */}
          <div className="rounded-xl border p-4 flex flex-col gap-2"
               style={{
                 backgroundColor: isOnline ? '#f0f9ff' : '#f8fafc',
                 borderColor: isOnline ? '#bae6fd' : '#e2e8f0',
               }}>
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <span style={{ fontSize: 20 }}>📹</span>
                <div>
                  <div className="text-sm font-semibold text-soc-text">ESP32-CAM</div>
                  <div className="text-xs font-mono text-soc-muted">{s.target_ip || '—'}</div>
                </div>
              </div>
              <span className={`w-2.5 h-2.5 rounded-full ${isOnline ? 'bg-soc-green animate-pulse' : 'bg-gray-300'}`} />
            </div>
            {/* Camera status badge */}
            <div className="px-2 py-1 rounded-md text-xs font-mono font-semibold text-center"
                 style={{ color: camInfo.color, backgroundColor: camInfo.bg, border: `1px solid ${camInfo.border}` }}>
              {camInfo.label}
            </div>
          </div>

          {/* ── ESP32+DHT11 Device Card ───────────────────────── */}
          <div className="rounded-xl border p-4 flex flex-col gap-2"
               style={{
                 backgroundColor: isOnline ? '#f0fdf4' : '#f8fafc',
                 borderColor: isOnline ? '#bbf7d0' : '#e2e8f0',
               }}>
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <span style={{ fontSize: 20 }}>🌡️</span>
                <div>
                  <div className="text-sm font-semibold text-soc-text">ESP32+DHT11</div>
                  <div className="text-xs font-mono text-soc-muted">Sensor Node</div>
                </div>
              </div>
              <span className={`w-2.5 h-2.5 rounded-full ${isOnline ? 'bg-soc-green animate-pulse' : 'bg-gray-300'}`} />
            </div>
            <div className="px-2 py-1 rounded-md text-xs font-mono font-semibold text-center"
                 style={{
                   color: isOnline ? '#16a34a' : '#64748b',
                   backgroundColor: isOnline ? '#f0fdf4' : '#f8fafc',
                   border: `1px solid ${isOnline ? '#bbf7d0' : '#e2e8f0'}`,
                 }}>
              {isOnline ? 'TRANSMITTING' : 'WAITING'}
            </div>
          </div>

          {/* ── Live Metrics ──────────────────────────────────── */}
          <div className="rounded-xl border p-4 flex flex-col justify-between"
               style={{ backgroundColor: '#f8fafc', borderColor: '#e2e8f0' }}>
            <div className="text-xs font-mono text-soc-muted tracking-wider mb-2">LIVE METRICS</div>
            <div className="flex flex-col gap-1.5">
              <div className="flex justify-between items-center">
                <span className="text-xs text-soc-muted">Packet Rate</span>
                <span className="text-sm font-mono font-bold text-soc-cyan">
                  {formatRate(s.packet_rate)} <span className="text-xs text-soc-muted font-normal">pps</span>
                </span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-xs text-soc-muted">Byte Rate</span>
                <span className="text-sm font-mono font-bold text-soc-cyan">
                  {formatRate(s.byte_rate)} <span className="text-xs text-soc-muted font-normal">B/s</span>
                </span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-xs text-soc-muted">Last Seen</span>
                <span className="text-xs font-mono text-soc-muted">{formatTime(s.last_seen)}</span>
              </div>
            </div>
          </div>

          {/* ── Detection Status ──────────────────────────────── */}
          <div className="rounded-xl border p-4 flex flex-col items-center justify-center text-center"
               style={{
                 backgroundColor: threatBg,
                 borderColor: threatBorder,
                 boxShadow: isAttack ? `0 0 12px ${threatColor}20` : 'none',
               }}>
            <div style={{ fontSize: 28 }}>{isAttack ? '🚨' : '🛡️'}</div>
            <div className="text-sm font-mono font-bold mt-1" style={{ color: threatColor }}>
              {s.last_prediction || 'BENIGN'}
            </div>
            <div className="text-xs text-soc-muted mt-0.5">
              {isAttack ? 'Intrusion Detected' : 'No Threats'}
            </div>
            {isAttack && s.last_severity > 0 && (
              <div className="mt-1 px-2 py-0.5 rounded text-xs font-mono font-semibold"
                   style={{ color: '#dc2626', backgroundColor: '#fef2f2', border: '1px solid #fecaca' }}>
                Severity: {s.last_severity}/100
              </div>
            )}
          </div>

        </div>
      </div>
    </div>
  );
}
