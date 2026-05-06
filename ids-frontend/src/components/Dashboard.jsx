import ThreatGauge from './ThreatGauge';
import ThroughputChart from './ThroughputChart';
import PacketTable from './PacketTable';
import AttackIntelligence from './AttackIntelligence';
import ESP32DevicePanel from './ESP32DevicePanel';

/**
 * Dashboard — Main SOC Layout
 * Stats bar → [Gauge | Throughput] → [AttackIntelligence | PacketTable]
 */
export default function Dashboard({ packets, throughputHistory, threatIndex, latestPacket, stats, esp32Status }) {
  const byClass = stats?.byClass || {};
  const total   = stats?.total   || 1;

  // All 11 classes from the GitHub XGBoost model
  const classItems = [
    { key: 'BENIGN',       label: 'Benign',        color: '#22d3a5' },
    { key: 'DOS_SYN',      label: 'DoS-SYN',       color: '#ff6b35' },
    { key: 'MIRAI_ACK',    label: 'Mirai-ACK',     color: '#ff3b3b' },
    { key: 'MIRAI_HTTP',   label: 'Mirai-HTTP',    color: '#ef4444' },
    { key: 'MIRAI_UDP',    label: 'Mirai-UDP',     color: '#dc2626' },
    { key: 'HOST_DISC',    label: 'Host Disc.',    color: '#f59e0b' },
    { key: 'TELNET_BRUTE', label: 'Telnet-Brute',  color: '#fb923c' },
    { key: 'MITM_ARP',     label: 'MITM-ARP',      color: '#a855f7' },
    { key: 'SCAN_HOST',    label: 'Scan-Host',     color: '#f5c518' },
    { key: 'SCAN_PORT',    label: 'Scan-Port',     color: '#eab308' },
    { key: 'SCAN_OS',      label: 'Scan-OS',       color: '#ca8a04' },
  ];

  return (
    <div className="flex flex-col gap-3">
      {/* ── Stats bar ─────────────────────────────────────────────── */}
      <div className="grid gap-2" style={{ gridTemplateColumns: 'repeat(11, 1fr)' }}>
        {classItems.map(({ key, label, color }) => {
          const count = byClass[key] || 0;
          const pct   = ((count / total) * 100).toFixed(1);
          const isAttack = key !== 'BENIGN';
          return (
            <div key={key} className="panel px-2 py-2.5 flex items-center gap-2">
              <div className="w-2 h-2 rounded-full flex-shrink-0"
                   style={{ backgroundColor: color, boxShadow: count > 0 && isAttack ? `0 0 6px ${color}` : 'none' }} />
              <div className="min-w-0">
                <div className="font-mono font-bold text-sm leading-none" style={{ color }}>
                  {count.toLocaleString()}
                </div>
                <div className="text-[10px] text-soc-muted mt-0.5 truncate">{label} · {pct}%</div>
              </div>
            </div>
          );
        })}
      </div>

      {/* ── ESP32 Hardware Status ──────────────────────────────────── */}
      <ESP32DevicePanel esp32Status={esp32Status} />

      {/* ── Row 1: Gauge + Throughput Chart ────────────────────────── */}
      <div className="grid grid-cols-3 gap-3" style={{ height: '340px' }}>
        <div className="col-span-1">
          <ThreatGauge threatIndex={threatIndex} />
        </div>
        <div className="col-span-2">
          <ThroughputChart data={throughputHistory} />
        </div>
      </div>

      {/* ── Row 2: Attack Intelligence + Packet Log ─────────────────── */}
      <div className="grid grid-cols-2 gap-3" style={{ height: '380px' }}>
        <AttackIntelligence packets={packets} stats={stats} />
        <PacketTable packets={packets} />
      </div>
    </div>
  );
}
