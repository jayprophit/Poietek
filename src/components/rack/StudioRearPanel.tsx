import React, { useState, useRef, useEffect } from 'react';
import { MasterState, RackModuleItem } from '../../types';
import { Radio, RefreshCw, Trash2, ArrowRightLeft, Palette, Sliders, Zap, Wand2, Tag, X, Check, Edit3, Sparkles } from 'lucide-react';

interface StudioRearPanelProps {
  masterState: MasterState;
  rackModules?: RackModuleItem[];
  onToggleFlip: () => void;
}

interface PatchConnection {
  id: string;
  fromUnitId: string;
  fromUnitName: string;
  fromJack: string;
  fromX: number; // SVG pixel coordinate
  fromY: number; // SVG pixel coordinate
  toUnitId: string;
  toUnitName: string;
  toJack: string;
  toX: number; // SVG pixel coordinate
  toY: number; // SVG pixel coordinate
  color: string;
  label?: string; // Custom label text
}

interface JackPort {
  id: string;
  unitId: string;
  unitName: string;
  jackName: string;
  type: 'audio_out' | 'audio_in' | 'cv_out' | 'cv_in' | 'gate_out' | 'gate_in';
}

export const StudioRearPanel: React.FC<StudioRearPanelProps> = ({
  masterState,
  rackModules = [],
  onToggleFlip,
}) => {
  const containerRef = useRef<HTMLDivElement>(null);
  const svgRef = useRef<SVGSVGElement>(null);

  // Active patch cable connections
  const [connections, setConnections] = useState<PatchConnection[]>([
    {
      id: 'cable_1',
      fromUnitId: 'hardware_host',
      fromUnitName: 'Hardware Interface',
      fromJack: 'Audio Out L',
      fromX: 180,
      fromY: 85,
      toUnitId: 'master_mixer',
      toUnitName: 'Master SSL Mixer',
      toJack: 'Main In L',
      toX: 180,
      toY: 480,
      color: '#ef4444',
      label: 'Main Bus L',
    },
    {
      id: 'cable_2',
      fromUnitId: 'hardware_host',
      fromUnitName: 'Hardware Interface',
      fromJack: 'Audio Out R',
      fromX: 230,
      fromY: 85,
      toUnitId: 'master_mixer',
      toUnitName: 'Master SSL Mixer',
      toJack: 'Main In R',
      toX: 230,
      toY: 480,
      color: '#ef4444',
      label: 'Main Bus R',
    },
    {
      id: 'cable_3',
      fromUnitId: 'subtractor_1',
      fromUnitName: 'Subtractor Synth',
      fromJack: 'Audio Out L',
      fromX: 300,
      fromY: 260,
      toUnitId: 'rv7000_1',
      toUnitName: 'RV7000 Reverb',
      toJack: 'Audio In L',
      toX: 300,
      toY: 370,
      color: '#eab308',
      label: 'Subtractor -> Reverb',
    },
  ]);

  // Selected cable color for new patch cords
  const [activeColor, setActiveColor] = useState<string>('#ef4444');
  const cableColors = ['#ef4444', '#f97316', '#eab308', '#10b981', '#06b6d4', '#8b5cf6', '#ec4899', '#ffffff'];

  // Cable context menu state (for editing label and custom color)
  const [activeCableMenu, setActiveCableMenu] = useState<{
    cableId: string;
    x: number;
    y: number;
  } | null>(null);
  const [cableLabelInput, setCableLabelInput] = useState<string>('');

  // Dragging state for creating or moving cable connections
  const [dragging, setDragging] = useState<{
    fromUnitId: string;
    fromUnitName: string;
    fromJack: string;
    startX: number;
    startY: number;
    currentX: number;
    currentY: number;
    cableIdToReplace?: string;
  } | null>(null);

  // Store element positions of jacks registered on DOM
  const jackCoordsRef = useRef<Map<string, { x: number; y: number }>>(new Map());

  // Register jack coordinates into our map
  const registerJackRef = (key: string, el: HTMLDivElement | null) => {
    if (!el || !containerRef.current) return;
    const containerRect = containerRef.current.getBoundingClientRect();
    const jackRect = el.getBoundingClientRect();
    const x = jackRect.left + jackRect.width / 2 - containerRect.left;
    const y = jackRect.top + jackRect.height / 2 - containerRect.top;
    jackCoordsRef.current.set(key, { x, y });
  };

  // Mouse move handler for active cable dragging
  const handleMouseMove = (e: React.MouseEvent) => {
    if (!dragging || !containerRef.current) return;
    const containerRect = containerRef.current.getBoundingClientRect();
    const currentX = e.clientX - containerRect.left;
    const currentY = e.clientY - containerRect.top;
    setDragging((prev) => (prev ? { ...prev, currentX, currentY } : null));
  };

  // Mouse up or click on background to cancel or drop dragging
  const handleMouseUp = () => {
    if (dragging) {
      if (dragging.cableIdToReplace) {
        // Disconnected the cable into open air
        setConnections((prev) => prev.filter((c) => c.id !== dragging.cableIdToReplace));
      }
      setDragging(null);
    }
  };

  // Click or drop onto a Jack Port
  const handleJackPortMouseDown = (
    unitId: string,
    unitName: string,
    jackName: string,
    e: React.MouseEvent
  ) => {
    e.stopPropagation();
    const key = `${unitId}_${jackName}`;
    const coords = jackCoordsRef.current.get(key);
    if (!coords) return;

    // Check if there is already a cable attached at this jack to drag off
    const existingCable = connections.find(
      (c) =>
        (c.fromUnitId === unitId && c.fromJack === jackName) ||
        (c.toUnitId === unitId && c.toJack === jackName)
    );

    if (existingCable) {
      // Pick up existing cable end
      const isFrom = existingCable.fromUnitId === unitId && existingCable.fromJack === jackName;
      const otherUnitId = isFrom ? existingCable.toUnitId : existingCable.fromUnitId;
      const otherUnitName = isFrom ? existingCable.toUnitName : existingCable.fromUnitName;
      const otherJack = isFrom ? existingCable.toJack : existingCable.fromJack;
      const otherX = isFrom ? existingCable.toX : existingCable.fromX;
      const otherY = isFrom ? existingCable.toY : existingCable.fromY;

      setDragging({
        fromUnitId: otherUnitId,
        fromUnitName: otherUnitName,
        fromJack: otherJack,
        startX: otherX,
        startY: otherY,
        currentX: coords.x,
        currentY: coords.y,
        cableIdToReplace: existingCable.id,
      });
    } else {
      // Start fresh new cable from this jack
      setDragging({
        fromUnitId: unitId,
        fromUnitName: unitName,
        fromJack: jackName,
        startX: coords.x,
        startY: coords.y,
        currentX: coords.x,
        currentY: coords.y,
      });
    }
  };

  const handleJackPortMouseUp = (
    unitId: string,
    unitName: string,
    jackName: string,
    e: React.MouseEvent
  ) => {
    e.stopPropagation();
    if (!dragging) return;

    // Don't connect to self
    if (dragging.fromUnitId === unitId && dragging.fromJack === jackName) {
      setDragging(null);
      return;
    }

    const key = `${unitId}_${jackName}`;
    const coords = jackCoordsRef.current.get(key);
    if (!coords) return;

    // Remove existing cable if we were replacing one
    let filtered = connections;
    if (dragging.cableIdToReplace) {
      filtered = connections.filter((c) => c.id !== dragging.cableIdToReplace);
    }

    const newCable: PatchConnection = {
      id: `cable_${Date.now()}`,
      fromUnitId: dragging.fromUnitId,
      fromUnitName: dragging.fromUnitName,
      fromJack: dragging.fromJack,
      fromX: dragging.startX,
      fromY: dragging.startY,
      toUnitId: unitId,
      toUnitName: unitName,
      toJack: jackName,
      toX: coords.x,
      toY: coords.y,
      color: activeColor,
    };

    setConnections([...filtered, newCable]);
    setDragging(null);
  };

  // Auto-Route Cables Algorithm
  const handleAutoRouteCables = () => {
    const getJackPos = (unitId: string, jackName: string, fallbackX: number, fallbackY: number) => {
      const key = `${unitId}_${jackName}`;
      return jackCoordsRef.current.get(key) || { x: fallbackX, y: fallbackY };
    };

    const autoConns: PatchConnection[] = [];
    let colorIdx = 0;

    // 1. Hardware Interface -> SSL Mixer Main Bus
    const hwL = getJackPos('hardware_host', 'Audio Out L', 180, 85);
    const mixL = getJackPos('master_mixer', 'Main In L', 180, 480);
    autoConns.push({
      id: 'auto_hw_l',
      fromUnitId: 'hardware_host',
      fromUnitName: 'Hardware Interface',
      fromJack: 'Audio Out L',
      fromX: hwL.x,
      fromY: hwL.y,
      toUnitId: 'master_mixer',
      toUnitName: 'Master SSL Mixer',
      toJack: 'Main In L',
      toX: mixL.x,
      toY: mixL.y,
      color: '#ef4444',
      label: 'Master Stereo L',
    });

    const hwR = getJackPos('hardware_host', 'Audio Out R', 230, 85);
    const mixR = getJackPos('master_mixer', 'Main In R', 230, 480);
    autoConns.push({
      id: 'auto_hw_r',
      fromUnitId: 'hardware_host',
      fromUnitName: 'Hardware Interface',
      fromJack: 'Audio Out R',
      fromX: hwR.x,
      fromY: hwR.y,
      toUnitId: 'master_mixer',
      toUnitName: 'Master SSL Mixer',
      toJack: 'Main In R',
      toX: mixR.x,
      toY: mixR.y,
      color: '#ef4444',
      label: 'Master Stereo R',
    });

    // 2. Hardware Gate Out -> Sync First Instrument
    const activeModules = defaultRearModules;
    if (activeModules.length > 0) {
      const firstMod = activeModules[0];
      const hwGate = getJackPos('hardware_host', 'Gate Out', 400, 85);
      const modGate = getJackPos(firstMod.id, 'Gate In', 400, 260);
      autoConns.push({
        id: 'auto_gate_sync',
        fromUnitId: 'hardware_host',
        fromUnitName: 'Hardware Interface',
        fromJack: 'Gate Out',
        fromX: hwGate.x,
        fromY: hwGate.y,
        toUnitId: firstMod.id,
        toUnitName: firstMod.title,
        toJack: 'Gate In',
        toX: modGate.x,
        toY: modGate.y,
        color: '#ec4899',
        label: 'Gate Clock Sync',
      });
    }

    // 3. Connect Instrument Modules -> Mixer Channels
    let channelIdx = 1;
    activeModules.forEach((mod, idx) => {
      const isFX = mod.category.includes('reverb') || mod.category.includes('delay') || mod.category.includes('distortion') || mod.category.includes('comp');

      if (!isFX && channelIdx <= 8) {
        const modOutL = getJackPos(mod.id, 'Audio Out L', 150 + idx * 80, 260 + idx * 100);
        const mixCh = getJackPos('master_mixer', `Ch ${channelIdx} In`, 120 + channelIdx * 40, 480);
        autoConns.push({
          id: `auto_mod_${mod.id}_ch${channelIdx}`,
          fromUnitId: mod.id,
          fromUnitName: mod.title,
          fromJack: 'Audio Out L',
          fromX: modOutL.x,
          fromY: modOutL.y,
          toUnitId: 'master_mixer',
          toUnitName: 'Master SSL Mixer',
          toJack: `Ch ${channelIdx} In`,
          toX: mixCh.x,
          toY: mixCh.y,
          color: cableColors[(colorIdx++) % cableColors.length],
          label: `${mod.title.split(' ')[0]} -> Ch ${channelIdx}`,
        });
        channelIdx++;
      } else if (isFX) {
        // Connect FX send / return loop
        const mixAux = getJackPos('master_mixer', 'Aux Send 1', 400, 480);
        const fxIn = getJackPos(mod.id, 'Audio In L', 300, 370);
        autoConns.push({
          id: `auto_fx_send_${mod.id}`,
          fromUnitId: 'master_mixer',
          fromUnitName: 'Master SSL Mixer',
          fromJack: 'Aux Send 1',
          fromX: mixAux.x,
          fromY: mixAux.y,
          toUnitId: mod.id,
          toUnitName: mod.title,
          toJack: 'Audio In L',
          toX: fxIn.x,
          toY: fxIn.y,
          color: '#10b981',
          label: `Aux Send -> ${mod.title.split(' ')[0]}`,
        });

        const fxOut = getJackPos(mod.id, 'Audio Out L', 250, 370);
        const mixRet = getJackPos('master_mixer', 'Aux Return L/R', 450, 480);
        autoConns.push({
          id: `auto_fx_ret_${mod.id}`,
          fromUnitId: mod.id,
          fromUnitName: mod.title,
          fromJack: 'Audio Out L',
          fromX: fxOut.x,
          fromY: fxOut.y,
          toUnitId: 'master_mixer',
          toUnitName: 'Master SSL Mixer',
          toJack: 'Aux Return L/R',
          toX: mixRet.x,
          toY: mixRet.y,
          color: '#10b981',
          label: `${mod.title.split(' ')[0]} Return`,
        });
      }
    });

    setConnections(autoConns);
  };

  const handleCableContextMenu = (cableId: string, e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    const cable = connections.find((c) => c.id === cableId);
    if (cable) {
      setActiveCableMenu({ cableId, x: e.clientX, y: e.clientY });
      setCableLabelInput(cable.label || '');
    }
  };

  const handleSaveCableLabel = () => {
    if (!activeCableMenu) return;
    setConnections((prev) =>
      prev.map((c) =>
        c.id === activeCableMenu.cableId ? { ...c, label: cableLabelInput.trim() } : c
      )
    );
    setActiveCableMenu(null);
  };

  const handleChangeCableColor = (cableId: string, color: string) => {
    setConnections((prev) =>
      prev.map((c) => (c.id === cableId ? { ...c, color } : c))
    );
  };

  // Build default rear devices if rackModules is empty
  const defaultRearModules: { id: string; title: string; category: string }[] =
    rackModules.length > 0
      ? rackModules.map((m) => ({ id: m.id, title: m.title, category: m.type }))
      : [
          { id: 'subtractor_1', title: 'Subtractor Polyphonic Synth', category: 'subtractor_synth' },
          { id: 'rv7000_1', title: 'RV7000 MkII Advanced Reverb', category: 'rv7000_reverb' },
          { id: 'echo_1', title: 'The Echo Digital Tape Delay', category: 'the_echo_delay' },
          { id: 'scream_1', title: 'Scream 4 Distortion Unit', category: 'scream4_distortion' },
        ];

  // Helper renderer for Jack Button
  const renderJack = (
    unitId: string,
    unitName: string,
    jackName: string,
    label: string,
    type: 'audio_out' | 'audio_in' | 'cv_out' | 'cv_in' | 'gate'
  ) => {
    const key = `${unitId}_${jackName}`;
    const isConnected = connections.some(
      (c) =>
        (c.fromUnitId === unitId && c.fromJack === jackName) ||
        (c.toUnitId === unitId && c.toJack === jackName)
    );

    let borderColor = 'border-neutral-600 text-neutral-300';
    if (type === 'audio_out') borderColor = 'border-emerald-500 text-emerald-300';
    if (type === 'audio_in') borderColor = 'border-blue-500 text-blue-300';
    if (type === 'cv_out') borderColor = 'border-amber-500 text-amber-300';
    if (type === 'cv_in') borderColor = 'border-orange-500 text-orange-300';
    if (type === 'gate') borderColor = 'border-pink-500 text-pink-300';

    return (
      <div className="flex flex-col items-center gap-1">
        <div
          ref={(el) => registerJackRef(key, el)}
          onMouseDown={(e) => handleJackPortMouseDown(unitId, unitName, jackName, e)}
          onMouseUp={(e) => handleJackPortMouseUp(unitId, unitName, jackName, e)}
          className={`w-9 h-9 rounded-full border-2 bg-neutral-950 flex items-center justify-center cursor-pointer shadow-inner transition transform hover:scale-110 select-none ${borderColor} ${
            isConnected ? 'ring-2 ring-amber-400 bg-amber-950/80 font-black' : 'hover:border-amber-400'
          }`}
          title={`${unitName}: ${label} (Drag or Click to Patch)`}
        >
          <div className={`w-3 h-3 rounded-full ${isConnected ? 'bg-amber-400 animate-pulse' : 'bg-neutral-800'}`} />
        </div>
        <span className="text-[8px] font-mono text-neutral-400 font-bold uppercase truncate max-w-[60px] text-center">
          {label}
        </span>
      </div>
    );
  };

  return (
    <div
      ref={containerRef}
      onMouseMove={handleMouseMove}
      onMouseUp={handleMouseUp}
      className="relative bg-neutral-950 min-h-[750px] border-2 border-neutral-800 rounded-2xl p-6 overflow-hidden select-none shadow-2xl"
    >
      {/* Background Rack Rail Grid */}
      <div className="absolute inset-0 bg-[radial-gradient(#262626_1px,transparent_1px)] [background-size:12px_12px] opacity-60" />

      {/* Top Controls Header */}
      <div className="relative z-20 bg-gradient-to-r from-neutral-900 via-stone-900 to-neutral-900 border-2 border-neutral-700 rounded-xl p-4 shadow-xl flex flex-wrap items-center justify-between gap-4 mb-6">
        <div>
          <h2 className="text-xs font-mono font-black text-amber-400 uppercase tracking-widest flex items-center gap-2">
            <Radio className="w-4 h-4 animate-pulse" />
            REASON HARDWARE REAR PANEL & PATCH BAY
          </h2>
          <p className="text-[10px] text-neutral-400 font-mono mt-0.5">
            Drag cables between jacks to route Audio & Control Voltage (CV) signals. Click or drag off to disconnect.
          </p>
        </div>

        {/* Cable Color Selector */}
        <div className="flex items-center gap-2 bg-black/60 p-1.5 rounded-lg border border-neutral-700">
          <Palette className="w-3.5 h-3.5 text-amber-400 ml-1" />
          <span className="text-[9px] font-mono text-neutral-300 font-bold uppercase">CABLE COLOR:</span>
          <div className="flex gap-1">
            {cableColors.map((color) => (
              <button
                key={color}
                onClick={() => setActiveColor(color)}
                style={{ backgroundColor: color }}
                className={`w-5 h-5 rounded-full border-2 transition ${
                  activeColor === color ? 'border-white scale-110 shadow-lg' : 'border-black/50 opacity-70 hover:opacity-100'
                }`}
              />
            ))}
          </div>
        </div>

        {/* Control Buttons */}
        <div className="flex items-center gap-2">
          <button
            onClick={handleAutoRouteCables}
            className="px-3 py-1.5 rounded bg-amber-500 hover:bg-amber-400 text-neutral-950 font-mono text-xs font-black transition flex items-center gap-1 shadow-md"
            title="Automatically connect standard inputs and outputs based on module types"
          >
            <Wand2 className="w-3.5 h-3.5" />
            <span>AUTO-ROUTE CABLES</span>
          </button>

          <button
            onClick={() => setConnections([])}
            className="px-3 py-1.5 rounded bg-rose-950/80 hover:bg-rose-900 text-rose-300 font-mono text-xs border border-rose-800 transition flex items-center gap-1"
          >
            <Trash2 className="w-3.5 h-3.5" />
            <span>UNPLUG ALL</span>
          </button>

          <button
            onClick={onToggleFlip}
            className="px-4 py-1.5 rounded bg-neutral-800 hover:bg-neutral-700 text-amber-400 border border-neutral-700 font-black font-mono text-xs transition shadow flex items-center gap-1"
          >
            <ArrowRightLeft className="w-3.5 h-3.5" />
            <span>FRONT RACK (TAB)</span>
          </button>
        </div>
      </div>

      {/* SVG Cable Rendering Layer */}
      <svg ref={svgRef} className="absolute inset-0 w-full h-full pointer-events-none z-30">
        {/* Render Established Connections */}
        {connections.map((c) => {
          const sagY = Math.max(c.fromY, c.toY) + 90;
          const midX = 0.5 * c.fromX + 0.5 * c.toX;
          const midY = 0.125 * c.fromY + 0.75 * sagY + 0.125 * c.toY;

          return (
            <g
              key={c.id}
              className="pointer-events-auto cursor-pointer group"
              onClick={(e) => handleCableContextMenu(c.id, e)}
              onContextMenu={(e) => handleCableContextMenu(c.id, e)}
            >
              {/* Cable Outer Shadow */}
              <path
                d={`M ${c.fromX} ${c.fromY} C ${c.fromX} ${sagY}, ${c.toX} ${sagY}, ${c.toX} ${c.toY}`}
                fill="none"
                stroke="black"
                strokeWidth="9"
                strokeOpacity="0.5"
              />
              {/* Cable Body */}
              <path
                d={`M ${c.fromX} ${c.fromY} C ${c.fromX} ${sagY}, ${c.toX} ${sagY}, ${c.toX} ${c.toY}`}
                fill="none"
                stroke={c.color}
                strokeWidth="5"
                strokeLinecap="round"
                className="transition duration-150 group-hover:stroke-amber-400 group-hover:stroke-[6px]"
              />
              {/* Connectors */}
              <circle cx={c.fromX} cy={c.fromY} r="5.5" fill="#171717" stroke="#fbbf24" strokeWidth="1.5" />
              <circle cx={c.toX} cy={c.toY} r="5.5" fill="#171717" stroke="#fbbf24" strokeWidth="1.5" />

              {/* Custom Text Label Tape Badge */}
              {c.label && (
                <foreignObject
                  x={midX - 60}
                  y={midY - 12}
                  width="120"
                  height="28"
                  className="overflow-visible pointer-events-auto"
                >
                  <div
                    onClick={(e) => handleCableContextMenu(c.id, e)}
                    className="bg-amber-100 text-neutral-950 font-mono text-[9px] font-black px-2 py-0.5 rounded-md shadow-2xl border border-amber-400/90 tracking-tight text-center truncate max-w-[120px] mx-auto transform -rotate-1 hover:scale-110 transition cursor-pointer flex items-center justify-center gap-1 select-none"
                    title="Right-click or click to edit cable label & color"
                  >
                    <Tag className="w-2.5 h-2.5 text-amber-800 flex-shrink-0" />
                    <span className="truncate">{c.label}</span>
                  </div>
                </foreignObject>
              )}
            </g>
          );
        })}

        {/* Render Currently Dragged Active Cable */}
        {dragging && (
          <g>
            {/* Live Drooping Arc to Mouse Cursor */}
            <path
              d={`M ${dragging.startX} ${dragging.startY} C ${dragging.startX} ${
                Math.max(dragging.startY, dragging.currentY) + 70
              }, ${dragging.currentX} ${
                Math.max(dragging.startY, dragging.currentY) + 70
              }, ${dragging.currentX} ${dragging.currentY}`}
              fill="none"
              stroke={activeColor}
              strokeWidth="5"
              strokeDasharray="4,4"
              strokeLinecap="round"
              className="animate-pulse"
            />
            <circle cx={dragging.startX} cy={dragging.startY} r="6" fill="#fbbf24" />
            <circle cx={dragging.currentX} cy={dragging.currentY} r="6" fill={activeColor} stroke="#ffffff" strokeWidth="2" />
          </g>
        )}
      </svg>

      {/* Rear Panel Device Hardware Chassis Layout */}
      <div className="relative z-10 space-y-6">
        {/* Hardware Host Interface Unit (Top Rear) */}
        <div className="bg-gradient-to-r from-neutral-900 via-stone-900 to-neutral-900 border-2 border-neutral-700 rounded-2xl p-5 shadow-2xl relative">
          <div className="flex items-center justify-between border-b border-neutral-800 pb-2 mb-4">
            <span className="font-mono text-xs font-bold text-amber-500 uppercase tracking-wider">
              HARDWARE AUDIO & MIDI INTERFACE (SYSTEM HOST REAR)
            </span>
            <span className="text-[10px] font-mono text-neutral-500">64 STEREO AUDIO BUS • MIDI CLOCK SINK</span>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <div>
              <span className="text-[10px] font-mono font-bold text-neutral-400 block mb-2 uppercase">SYSTEM AUDIO OUTPUTS</span>
              <div className="flex flex-wrap gap-3">
                {renderJack('hardware_host', 'Hardware Interface', 'Audio Out L', 'Out L', 'audio_out')}
                {renderJack('hardware_host', 'Hardware Interface', 'Audio Out R', 'Out R', 'audio_out')}
                {renderJack('hardware_host', 'Hardware Interface', 'Monitor L', 'Mon L', 'audio_out')}
                {renderJack('hardware_host', 'Hardware Interface', 'Monitor R', 'Mon R', 'audio_out')}
              </div>
            </div>

            <div>
              <span className="text-[10px] font-mono font-bold text-neutral-400 block mb-2 uppercase">AUDIO INPUTS (BUS 1-4)</span>
              <div className="flex flex-wrap gap-3">
                {renderJack('hardware_host', 'Hardware Interface', 'Audio In 1', 'In 1', 'audio_in')}
                {renderJack('hardware_host', 'Hardware Interface', 'Audio In 2', 'In 2', 'audio_in')}
                {renderJack('hardware_host', 'Hardware Interface', 'Audio In 3', 'In 3', 'audio_in')}
                {renderJack('hardware_host', 'Hardware Interface', 'Audio In 4', 'In 4', 'audio_in')}
              </div>
            </div>

            <div>
              <span className="text-[10px] font-mono font-bold text-neutral-400 block mb-2 uppercase">MASTER SYNC & GATE CV</span>
              <div className="flex flex-wrap gap-3">
                {renderJack('hardware_host', 'Hardware Interface', 'Gate Out', 'Gate', 'gate')}
                {renderJack('hardware_host', 'Hardware Interface', 'Pitch CV', 'Pitch', 'cv_out')}
                {renderJack('hardware_host', 'Hardware Interface', 'Clock CV', 'Clock', 'cv_out')}
              </div>
            </div>
          </div>
        </div>

        {/* Dynamic Rear View for Active Stacked Modules */}
        {defaultRearModules.map((mod, index) => (
          <div
            key={mod.id}
            className="bg-gradient-to-r from-neutral-900 via-stone-900 to-neutral-900 border-2 border-neutral-700 rounded-2xl p-5 shadow-2xl relative"
          >
            <div className="flex items-center justify-between border-b border-neutral-800 pb-2 mb-4">
              <span className="font-mono text-xs font-bold text-indigo-400 uppercase tracking-wider">
                {index + 1}. {mod.title.toUpperCase()} (REAR CHASSIS)
              </span>
              <span className="text-[10px] font-mono text-neutral-500">I/O BUS • CV MODULATION PORTS</span>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              <div>
                <span className="text-[10px] font-mono font-bold text-neutral-400 block mb-2 uppercase">AUDIO OUTPUTS</span>
                <div className="flex flex-wrap gap-3">
                  {renderJack(mod.id, mod.title, 'Audio Out L', 'Main L', 'audio_out')}
                  {renderJack(mod.id, mod.title, 'Audio Out R', 'Main R', 'audio_out')}
                  {renderJack(mod.id, mod.title, 'Direct Out 1', 'Dir 1', 'audio_out')}
                </div>
              </div>

              <div>
                <span className="text-[10px] font-mono font-bold text-neutral-400 block mb-2 uppercase">AUDIO INPUTS / SENDS</span>
                <div className="flex flex-wrap gap-3">
                  {renderJack(mod.id, mod.title, 'Audio In L', 'In L', 'audio_in')}
                  {renderJack(mod.id, mod.title, 'Audio In R', 'In R', 'audio_in')}
                  {renderJack(mod.id, mod.title, 'Sidechain In', 'Sidech', 'audio_in')}
                </div>
              </div>

              <div>
                <span className="text-[10px] font-mono font-bold text-neutral-400 block mb-2 uppercase">CV & GATE CONTROL</span>
                <div className="flex flex-wrap gap-3">
                  {renderJack(mod.id, mod.title, 'Gate In', 'Gate In', 'gate')}
                  {renderJack(mod.id, mod.title, 'Pitch CV In', 'Pitch In', 'cv_in')}
                  {renderJack(mod.id, mod.title, 'Mod CV In', 'Mod In', 'cv_in')}
                </div>
              </div>
            </div>
          </div>
        ))}

        {/* Master SSL Studio Mixer Unit (Bottom Rear) */}
        <div className="bg-gradient-to-r from-neutral-900 via-stone-900 to-neutral-900 border-2 border-neutral-700 rounded-2xl p-5 shadow-2xl relative">
          <div className="flex items-center justify-between border-b border-neutral-800 pb-2 mb-4">
            <span className="font-mono text-xs font-bold text-emerald-400 uppercase tracking-wider">
              MASTER SSL MIXING CONSOLE & BUS COMPRESSOR (REAR)
            </span>
            <span className="text-[10px] font-mono text-neutral-500">ANALOG CHANNELS 1-8 • AUX REVERB/DELAY BUS</span>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <span className="text-[10px] font-mono font-bold text-neutral-400 block mb-2 uppercase">CHANNEL INSERT INPUTS</span>
              <div className="flex flex-wrap gap-3">
                {[1, 2, 3, 4, 5, 6, 7, 8].map((ch) =>
                  renderJack('master_mixer', 'Master SSL Mixer', `Ch ${ch} In`, `Ch ${ch}`, 'audio_in')
                )}
              </div>
            </div>

            <div>
              <span className="text-[10px] font-mono font-bold text-neutral-400 block mb-2 uppercase">MASTER AUX & SIDECHAIN</span>
              <div className="flex flex-wrap gap-3">
                {renderJack('master_mixer', 'Master SSL Mixer', 'Main In L', 'Main L', 'audio_in')}
                {renderJack('master_mixer', 'Master SSL Mixer', 'Main In R', 'Main R', 'audio_in')}
                {renderJack('master_mixer', 'Master SSL Mixer', 'Aux Send 1', 'Aux 1', 'audio_out')}
                {renderJack('master_mixer', 'Master SSL Mixer', 'Aux Return L/R', 'Return', 'audio_in')}
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Interactive Cable Context Menu Popover */}
      {activeCableMenu && (
        <div
          style={{
            left: Math.min(activeCableMenu.x - 100, window.innerWidth - 280),
            top: Math.min(activeCableMenu.y - 40, window.innerHeight - 240),
          }}
          className="fixed z-[300] bg-neutral-950 border-2 border-amber-500 rounded-2xl p-3.5 shadow-2xl text-white space-y-3 w-64 animate-in fade-in zoom-in-95 duration-100 backdrop-blur-md"
        >
          <div className="flex items-center justify-between border-b border-neutral-800 pb-2">
            <span className="font-mono text-[11px] font-black text-amber-400 uppercase flex items-center gap-1.5">
              <Tag className="w-3.5 h-3.5" /> EDIT PATCH CABLE
            </span>
            <button
              onClick={() => setActiveCableMenu(null)}
              className="p-1 rounded-lg bg-neutral-800 hover:bg-neutral-700 text-neutral-400 hover:text-white transition"
            >
              <X className="w-3.5 h-3.5" />
            </button>
          </div>

          {/* Custom Label Input */}
          <div className="space-y-1">
            <label className="text-[10px] font-mono text-neutral-400 uppercase block font-bold">Cable Custom Label:</label>
            <div className="flex gap-1.5">
              <input
                type="text"
                value={cableLabelInput}
                onChange={(e) => setCableLabelInput(e.target.value)}
                onKeyDown={(e) => e.key === 'Enter' && handleSaveCableLabel()}
                placeholder="e.g. Lead Synth L..."
                className="w-full bg-neutral-900 border border-neutral-700 rounded-lg px-2.5 py-1 text-xs text-white font-mono outline-none focus:border-amber-400 font-bold"
                autoFocus
              />
              <button
                onClick={handleSaveCableLabel}
                className="px-2.5 py-1 rounded-lg bg-amber-500 hover:bg-amber-400 text-neutral-950 font-black text-xs transition flex items-center justify-center shadow"
              >
                <Check className="w-4 h-4" />
              </button>
            </div>
          </div>

          {/* Assign Custom Color */}
          <div className="space-y-1">
            <label className="text-[10px] font-mono text-neutral-400 uppercase block font-bold">Cable Custom Color:</label>
            <div className="flex flex-wrap gap-1.5 p-1 bg-neutral-900/80 rounded-lg border border-neutral-800">
              {cableColors.map((color) => (
                <button
                  key={color}
                  onClick={() => handleChangeCableColor(activeCableMenu.cableId, color)}
                  style={{ backgroundColor: color }}
                  className="w-5 h-5 rounded-full border border-black/80 transition transform hover:scale-125 shadow"
                  title={`Set cable color to ${color}`}
                />
              ))}
            </div>
          </div>

          {/* Unplug Button */}
          <div className="pt-2 border-t border-neutral-800 flex justify-between">
            <button
              onClick={() => {
                setConnections((prev) => prev.filter((c) => c.id !== activeCableMenu.cableId));
                setActiveCableMenu(null);
              }}
              className="w-full py-1.5 rounded-lg bg-rose-950 hover:bg-rose-900 text-rose-300 text-xs font-mono font-bold border border-rose-800 flex items-center justify-center gap-1.5 transition"
            >
              <Trash2 className="w-3.5 h-3.5" />
              <span>UNPLUG CABLE</span>
            </button>
          </div>
        </div>
      )}
    </div>
  );
};
