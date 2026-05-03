import { useState, useEffect, useRef } from 'react';

/**
 * TopologyMap — Multi-Layer Network Topology Visualization
 *
 * Renders an SVG network graph illustrating data flow between the IDS central
 * server and three simulated Raspberry Pi edge IoT nodes.
 *
 * Layout:
 *   - Central IDS Server node at the viewport center
 *   - 3 Edge RPi nodes arranged in a triangle around the server
 *   - Animated "traveling dot" on each connection line shows data flow direction
 *   - Attack events trigger a red pulsing glow on the affected source node
 *
 * Animation System:
 *   1. Normal state: Subtle cyan dot traveling from each edge node to server
 *   2. Attack state: Affected node flashes red using CSS 'node-attack' keyframe class
 *      The attack state is held for ATTACK_HOLD_MS (2 seconds) then reverts.
 *
 * Attack Detection:
 *   useEffect watches `latestPacket` prop. When classification != 'BENIGN'
 *   the affected node enters attack state for ATTACK_HOLD_MS.
 *
 * Component State:
 *   nodeStates: { 'node-1': 'normal'|'attack'|'warning', ... }
 *   animOffset: frame counter for traveling dot animation (requestAnimationFrame)
 *
 * @param {Object} latestPacket — most recent TelemetryPayload from useWebSocket
 * @param {Object} stats — aggregate statistics by node
 */

// Node layout configuration
const NODES = [
  { id: 'node-1', label: 'RPi Node 1', ip: '192.168.1.101', x: 150, y: 80  },
  { id: 'node-2', label: 'RPi Node 2', ip: '192.168.1.102', x: 450, y: 80  },
  { id: 'node-3', label: 'RPi Node 3', ip: '192.168.1.103', x: 300, y: 300 },
];
const SERVER = { id: 'server', label: 'IDS Server', ip: '10.0.0.1', x: 300, y: 170 };
const ATTACK_HOLD_MS = 2500; // How long node blinks red after attack detection

export default function TopologyMap({ latestPacket, stats }) {
  const [nodeStates, setNodeStates] = useState({
    'node-1': 'normal', 'node-2': 'normal', 'node-3': 'normal',
  });
  const [dotOffsets, setDotOffsets] = useState({ 'node-1': 0, 'node-2': 0.33, 'node-3': 0.66 });
  const attackTimers   = useRef({});
  const animFrameRef   = useRef(null);
  const frameCountRef  = useRef(0);

  // ── Traveling dot animation (requestAnimationFrame) ────────────────────
  useEffect(() => {
    const animate = () => {
      frameCountRef.current += 1;
      if (frameCountRef.current % 2 === 0) { // Update every 2 frames (~30fps)
        setDotOffsets(prev => ({
          'node-1': (prev['node-1'] + 0.008) % 1,
          'node-2': (prev['node-2'] + 0.008) % 1,
          'node-3': (prev['node-3'] + 0.008) % 1,
        }));
      }
      animFrameRef.current = requestAnimationFrame(animate);
    };
    animFrameRef.current = requestAnimationFrame(animate);
    return () => cancelAnimationFrame(animFrameRef.current);
  }, []);

  // ── Attack detection: flash node red for ATTACK_HOLD_MS ───────────────
  useEffect(() => {
    if (!latestPacket || latestPacket.classification === 'BENIGN') return;

    const nodeId = latestPacket.sourceNode;
    if (!nodeId) return;

    // Set attack state
    setNodeStates(prev => ({ ...prev, [nodeId]: 'attack' }));

    // Clear any existing timer for this node
    if (attackTimers.current[nodeId]) clearTimeout(attackTimers.current[nodeId]);

    // Revert to normal after hold period
    attackTimers.current[nodeId] = setTimeout(() => {
      setNodeStates(prev => ({ ...prev, [nodeId]: 'normal' }));
    }, ATTACK_HOLD_MS);
  }, [latestPacket]);

  // Cleanup timers on unmount
  useEffect(() => {
    return () => {
      Object.values(attackTimers.current).forEach(clearTimeout);
      cancelAnimationFrame(animFrameRef.current);
    };
  }, []);

  /**
   * Compute traveling dot x,y position along the line from edge node to server.
   * offset: 0.0 = at node, 1.0 = at server
   */
  function getDotPosition(node, offset) {
    return {
      x: node.x + (SERVER.x - node.x) * offset,
      y: node.y + (SERVER.y - node.y) * offset,
    };
  }

  return (
    <div className="panel flex flex-col h-full">
      <div className="panel-header">
        <span className="panel-title">Network Topology</span>
        <div className="flex items-center gap-3">
          <span className="flex items-center gap-1.5 text-xs font-mono text-soc-green">
            <span className="w-2 h-2 rounded-full bg-soc-green inline-block" />
            3 Edge Nodes
          </span>
          {Object.values(nodeStates).includes('attack') && (
            <span className="flex items-center gap-1.5 text-xs font-mono text-soc-red animate-pulse">
              ⚠ ATTACK DETECTED
            </span>
          )}
        </div>
      </div>

      <div className="flex-1 p-2">
        <svg
          viewBox="0 0 600 380"
          className="w-full h-full"
          style={{ maxHeight: '320px' }}
        >
          <defs>
            {/* Glow filters */}
            <filter id="glowCyan" x="-50%" y="-50%" width="200%" height="200%">
              <feGaussianBlur stdDeviation="3" result="blur" />
              <feMerge><feMergeNode in="blur"/><feMergeNode in="SourceGraphic"/></feMerge>
            </filter>
            <filter id="glowRed" x="-80%" y="-80%" width="260%" height="260%">
              <feGaussianBlur stdDeviation="8" result="blur" />
              <feMerge><feMergeNode in="blur"/><feMergeNode in="SourceGraphic"/></feMerge>
            </filter>
            <filter id="glowGreen" x="-50%" y="-50%" width="200%" height="200%">
              <feGaussianBlur stdDeviation="4" result="blur" />
              <feMerge><feMergeNode in="blur"/><feMergeNode in="SourceGraphic"/></feMerge>
            </filter>

            {/* Grid pattern */}
            <pattern id="gridPat" width="30" height="30" patternUnits="userSpaceOnUse">
              <path d="M 30 0 L 0 0 0 30" fill="none" stroke="#1e3a5240" strokeWidth="0.5"/>
            </pattern>
          </defs>

          {/* Background grid */}
          <rect width="600" height="380" fill="url(#gridPat)" />
          <rect width="600" height="380" fill="url(#radialBg)" opacity="0.5" />

          {/* Connection lines + traveling dots */}
          {NODES.map(node => {
            const isAttack = nodeStates[node.id] === 'attack';
            const lineColor = isAttack ? '#ff3b3b' : '#1e3a52';
            const dotColor  = isAttack ? '#ff3b3b' : '#00d4ff';
            const dot       = getDotPosition(node, dotOffsets[node.id]);

            return (
              <g key={node.id}>
                {/* Static connection line */}
                <line
                  x1={node.x} y1={node.y}
                  x2={SERVER.x} y2={SERVER.y}
                  stroke={lineColor}
                  strokeWidth={isAttack ? 1.5 : 1}
                  strokeDasharray="6 4"
                  opacity={isAttack ? 1 : 0.5}
                  style={{ transition: 'stroke 0.3s, opacity 0.3s' }}
                />
                {/* Traveling dot */}
                <circle
                  cx={dot.x} cy={dot.y} r={isAttack ? 4 : 3}
                  fill={dotColor}
                  filter={`url(#glow${isAttack ? 'Red' : 'Cyan'})`}
                  opacity={isAttack ? 1 : 0.8}
                />
              </g>
            );
          })}

          {/* ── Edge nodes (Raspberry Pi) ─────────────────────────────── */}
          {NODES.map(node => {
            const isAttack = nodeStates[node.id] === 'attack';
            const nodeColor = isAttack ? '#ff3b3b' : '#00d4ff';
            const bgColor   = isAttack ? '#2d0a0a' : '#0d1f2f';
            const pkts      = stats?.byNode?.[node.id] ?? 0;

            return (
              <g key={node.id} className={isAttack ? 'node-attack' : ''}>
                {/* Outer glow ring for attack */}
                {isAttack && (
                  <circle
                    cx={node.x} cy={node.y} r={36}
                    fill="none" stroke="#ff3b3b"
                    strokeWidth="1.5"
                    opacity="0.6"
                    filter="url(#glowRed)"
                  />
                )}

                {/* Node body (hexagon approximated as circle for SVG simplicity) */}
                <circle
                  cx={node.x} cy={node.y} r={28}
                  fill={bgColor}
                  stroke={nodeColor}
                  strokeWidth={isAttack ? 2 : 1}
                  filter={isAttack ? 'url(#glowRed)' : 'url(#glowCyan)'}
                  style={{ transition: 'fill 0.3s, stroke 0.3s' }}
                />

                {/* RPi icon (simplified circuit board) */}
                <text x={node.x} y={node.y - 4} textAnchor="middle" fontSize="16">
                  🍓
                </text>

                {/* Node label */}
                <text x={node.x} y={node.y + 12}
                  textAnchor="middle" fill={nodeColor}
                  fontSize="7.5" fontFamily="JetBrains Mono"
                  fontWeight="bold" letterSpacing="0.5"
                >
                  {node.label.toUpperCase()}
                </text>

                {/* IP address */}
                <text x={node.x} y={node.y + 46}
                  textAnchor="middle" fill="#4d6b8a"
                  fontSize="8.5" fontFamily="JetBrains Mono"
                >
                  {node.ip}
                </text>

                {/* Packet counter badge */}
                <rect x={node.x - 18} y={node.y + 52}
                  width="36" height="13" rx="3"
                  fill={isAttack ? '#3d0a0a' : '#0d1f2f'}
                  stroke={nodeColor} strokeWidth="0.5" opacity="0.8"
                />
                <text x={node.x} y={node.y + 62}
                  textAnchor="middle" fill={nodeColor}
                  fontSize="8" fontFamily="JetBrains Mono"
                >
                  {pkts} pkts
                </text>

                {/* Attack alert label */}
                {isAttack && (
                  <text x={node.x} y={node.y - 40}
                    textAnchor="middle" fill="#ff3b3b"
                    fontSize="9" fontFamily="JetBrains Mono"
                    fontWeight="bold"
                    style={{ animation: 'nodeFlash 0.8s ease-in-out infinite' }}
                  >
                    ⚠ ATTACK
                  </text>
                )}
              </g>
            );
          })}

          {/* ── Central IDS Server ────────────────────────────────────── */}
          <g>
            {/* Server glow ring */}
            <circle
              cx={SERVER.x} cy={SERVER.y} r={44}
              fill="none" stroke="#00d4ff"
              strokeWidth="0.5"
              opacity="0.2"
            />
            <circle
              cx={SERVER.x} cy={SERVER.y} r={38}
              fill="#091420"
              stroke="#00d4ff"
              strokeWidth="1.5"
              filter="url(#glowCyan)"
            />

            {/* Server icon (shield) */}
            <text x={SERVER.x} y={SERVER.y - 6} textAnchor="middle" fontSize="20">
              🛡
            </text>

            <text x={SERVER.x} y={SERVER.y + 12}
              textAnchor="middle" fill="#00d4ff"
              fontSize="8.5" fontFamily="JetBrains Mono"
              fontWeight="bold" letterSpacing="1"
            >
              IDS SERVER
            </text>

            <text x={SERVER.x} y={SERVER.y + 26}
              textAnchor="middle" fill="#4d6b8a"
              fontSize="8" fontFamily="JetBrains Mono"
            >
              {SERVER.ip}
            </text>

            {/* Total packets bubble */}
            <rect x={SERVER.x - 28} y={SERVER.y + 32}
              width="56" height="13" rx="3"
              fill="#091420" stroke="#00d4ff44" strokeWidth="0.5"
            />
            <text x={SERVER.x} y={SERVER.y + 42}
              textAnchor="middle" fill="#00d4ff88"
              fontSize="8" fontFamily="JetBrains Mono"
            >
              {(stats?.total ?? 0).toLocaleString()} total
            </text>
          </g>

          {/* ── Layer labels ─────────────────────────────────────────────── */}
          <text x="10" y="20" fill="#1e3a52" fontSize="9" fontFamily="JetBrains Mono" opacity="0.7">
            LAYER 1: EDGE IOT NODES
          </text>
          <text x="10" y="200" fill="#1e3a52" fontSize="9" fontFamily="JetBrains Mono" opacity="0.7">
            LAYER 2: INTRUSION DETECTION
          </text>
          <text x="10" y="360" fill="#1e3a52" fontSize="9" fontFamily="JetBrains Mono" opacity="0.7">
            PROTOCOL: MQTT / TCP / UDP
          </text>
        </svg>
      </div>
    </div>
  );
}
