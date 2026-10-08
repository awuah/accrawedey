import React, { useState, useRef, useEffect } from 'react';
import { AccraWorldData, WorldNode, WorldEdge, WorldProperty, BuildingTypeDefinition } from '@/types/world';
import { INITIAL_BUILDING_TYPES } from '@/types/constants';
import { Plus, Trash2, Save, Download, Eye, ArrowLeft } from 'lucide-react';

interface WorldEditorProps {
  initialWorld: AccraWorldData;
  onSave: (world: AccraWorldData) => void;
  onClose: () => void;
}

type EditorTool = 'select' | 'add_node' | 'add_edge' | 'add_property';

export const WorldEditor: React.FC<WorldEditorProps> = ({ initialWorld, onSave, onClose }) => {
  const [world, setWorld] = useState<AccraWorldData>(initialWorld);
  const [activeTool, setActiveTool] = useState<EditorTool>('select');
  const [selectedNodeId, setSelectedNodeId] = useState<string | null>(null);
  const [selectedEdgeId, setSelectedEdgeId] = useState<string | null>(null);
  const [selectedPropId, setSelectedPropId] = useState<string | null>(null);
  const [edgeSourceNodeId, setEdgeSourceNodeId] = useState<string | null>(null);
  
  // New Property draft state
  const [newPropType, setNewPropType] = useState<string>('mall');
  const [viewTransform, setViewTransform] = useState({ x: 100, y: 100, scale: 0.65 });
  const [isPanning, setIsPanning] = useState(false);
  const panStartRef = useRef({ x: 0, y: 0 });

  const svgRef = useRef<SVGSVGElement>(null);

  // Screen to World coords
  const screenToWorld = (screenX: number, screenY: number) => {
    if (!svgRef.current) return { x: 0, y: 0 };
    const rect = svgRef.current.getBoundingClientRect();
    const x = (screenX - rect.left - viewTransform.x) / viewTransform.scale;
    const y = (screenY - rect.top - viewTransform.y) / viewTransform.scale;
    return { x: Math.round(x), y: Math.round(y) };
  };

  const handleSvgMouseDown = (e: React.MouseEvent<SVGSVGElement>) => {
    if (e.button === 1 || e.altKey || activeTool === 'select' && e.target === svgRef.current) {
      setIsPanning(true);
      panStartRef.current = { x: e.clientX - viewTransform.x, y: e.clientY - viewTransform.y };
      return;
    }

    const { x, y } = screenToWorld(e.clientX, e.clientY);

    if (activeTool === 'add_node') {
      const newNodeId = `node_${Date.now().toString(36)}`;
      const newNode: WorldNode = {
        id: newNodeId,
        x,
        y,
        name: `Node ${Object.keys(world.nodes).length + 1}`,
      };
      setWorld((prev) => ({
        ...prev,
        nodes: { ...prev.nodes, [newNodeId]: newNode },
      }));
      setSelectedNodeId(newNodeId);
    } else if (activeTool === 'add_property') {
      const typeDef = INITIAL_BUILDING_TYPES[newPropType] || INITIAL_BUILDING_TYPES.mall;
      const newPropId = `prop_${Date.now().toString(36)}`;
      const newProp: WorldProperty = {
        id: newPropId,
        name: `New ${typeDef.name}`,
        typeId: newPropType,
        x: x - 40,
        y: y - 35,
        width: 80,
        height: 70,
        price: typeDef.baseCost,
        baseIncomeRate: typeDef.baseIncomeRate,
        isForSale: true,
        tier: 1,
        color: typeDef.defaultColor,
      };
      setWorld((prev) => ({
        ...prev,
        properties: [...prev.properties, newProp],
      }));
      setSelectedPropId(newPropId);
    }
  };

  const handleSvgMouseMove = (e: React.MouseEvent<SVGSVGElement>) => {
    if (isPanning) {
      setViewTransform((prev) => ({
        ...prev,
        x: e.clientX - panStartRef.current.x,
        y: e.clientY - panStartRef.current.y,
      }));
    }
  };

  const handleSvgMouseUp = () => {
    setIsPanning(false);
  };

  const handleNodeClick = (nodeId: string, e: React.MouseEvent) => {
    e.stopPropagation();
    if (activeTool === 'add_edge') {
      if (!edgeSourceNodeId) {
        setEdgeSourceNodeId(nodeId);
      } else if (edgeSourceNodeId !== nodeId) {
        // Create new edge
        const newEdge: WorldEdge = {
          id: `edge_${Date.now().toString(36)}`,
          source: edgeSourceNodeId,
          target: nodeId,
          allowedModes: ['walk', 'bike', 'drive'],
          roadType: 'main',
          name: 'New Road Segment',
        };
        setWorld((prev) => ({
          ...prev,
          edges: [...prev.edges, newEdge],
        }));
        setEdgeSourceNodeId(null);
      }
    } else {
      setSelectedNodeId(nodeId);
      setSelectedPropId(null);
      setSelectedEdgeId(null);
    }
  };

  const handleDeleteSelected = () => {
    if (selectedNodeId) {
      setWorld((prev) => {
        const nextNodes = { ...prev.nodes };
        delete nextNodes[selectedNodeId];
        const nextEdges = prev.edges.filter((e) => e.source !== selectedNodeId && e.target !== selectedNodeId);
        return { ...prev, nodes: nextNodes, edges: nextEdges };
      });
      setSelectedNodeId(null);
    } else if (selectedPropId) {
      setWorld((prev) => ({
        ...prev,
        properties: prev.properties.filter((p) => p.id !== selectedPropId),
      }));
      setSelectedPropId(null);
    } else if (selectedEdgeId) {
      setWorld((prev) => ({
        ...prev,
        edges: prev.edges.filter((e) => e.id !== selectedEdgeId),
      }));
      setSelectedEdgeId(null);
    }
  };

  return (
    <div className="absolute inset-0 z-40 bg-[#FBF9F5] flex flex-col select-none overflow-hidden text-[#292524]">
      {/* Top Admin Navigation Header */}
      <div className="h-14 border-b border-[#E8DFCF] bg-[#F4EFE6] px-4 flex items-center justify-between shadow-sm">
        <div className="flex items-center gap-3">
          <button
            onClick={onClose}
            className="p-2 rounded-xl hover:bg-[#E8DFCF] transition-colors flex items-center gap-1.5 text-xs font-bold cursor-pointer"
          >
            <ArrowLeft className="w-4 h-4" />
            Back to Game
          </button>
          <div className="h-4 w-[1px] bg-[#D6C7AF]" />
          <h1 className="font-black text-sm tracking-tight text-[#292524]">
            Accra World Graph Editor (Version {world.version})
          </h1>
        </div>

        {/* Toolbar Modes */}
        <div className="flex items-center gap-1.5 bg-[#FBF9F5] p-1 rounded-2xl border border-[#E8DFCF]">
          <button
            onClick={() => { setActiveTool('select'); setEdgeSourceNodeId(null); }}
            className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all cursor-pointer ${
              activeTool === 'select' ? 'bg-[#292524] text-white' : 'hover:bg-[#F4EFE6] text-[#78716C]'
            }`}
          >
            Select & Pan
          </button>
          <button
            onClick={() => { setActiveTool('add_node'); setEdgeSourceNodeId(null); }}
            className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all cursor-pointer ${
              activeTool === 'add_node' ? 'bg-[#292524] text-white' : 'hover:bg-[#F4EFE6] text-[#78716C]'
            }`}
          >
            + Add Junction
          </button>
          <button
            onClick={() => setActiveTool('add_edge')}
            className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all cursor-pointer ${
              activeTool === 'add_edge' ? 'bg-[#292524] text-white' : 'hover:bg-[#F4EFE6] text-[#78716C]'
            }`}
          >
            + Draw Road
          </button>
          <button
            onClick={() => { setActiveTool('add_property'); setEdgeSourceNodeId(null); }}
            className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all cursor-pointer ${
              activeTool === 'add_property' ? 'bg-[#292524] text-white' : 'hover:bg-[#F4EFE6] text-[#78716C]'
            }`}
          >
            + Place Landmark
          </button>
        </div>

        {/* Action Buttons */}
        <div className="flex items-center gap-2">
          <button
            onClick={handleDeleteSelected}
            disabled={!selectedNodeId && !selectedPropId && !selectedEdgeId}
            className="px-3 py-2 rounded-xl border border-[#E8DFCF] hover:bg-[#F4EFE6] text-[#EF4444] text-xs font-bold disabled:opacity-30 disabled:cursor-not-allowed flex items-center gap-1 cursor-pointer"
          >
            <Trash2 className="w-3.5 h-3.5" />
            Delete
          </button>
          <button
            onClick={() => onSave(world)}
            className="px-4 py-2 rounded-xl bg-[#22C55E] hover:bg-[#16A34A] text-white text-xs font-black shadow-md flex items-center gap-1.5 cursor-pointer"
          >
            <Save className="w-3.5 h-3.5" />
            Publish World
          </button>
        </div>
      </div>

      {/* Main Canvas Area */}
      <div className="flex-1 relative overflow-hidden bg-[#FBF9F5]">
        <svg
          ref={svgRef}
          onMouseDown={handleSvgMouseDown}
          onMouseMove={handleSvgMouseMove}
          onMouseUp={handleSvgMouseUp}
          className="w-full h-full cursor-crosshair"
        >
          <g transform={`translate(${viewTransform.x}, ${viewTransform.y}) scale(${viewTransform.scale})`}>
            {/* World Bounds Border */}
            <rect
              x={world.bounds.minX}
              y={world.bounds.minY}
              width={world.bounds.maxX - world.bounds.minX}
              height={world.bounds.maxY - world.bounds.minY}
              fill="#F4EFE6"
              stroke="#D6C7AF"
              strokeWidth={4}
            />

            {/* Gulf Coastline Preview */}
            <rect
              x={world.bounds.minX}
              y={1550}
              width={world.bounds.maxX - world.bounds.minX}
              height={500}
              fill="#7DD3FC"
            />

            {/* Edges / Roads */}
            {world.edges.map((edge) => {
              const src = world.nodes[edge.source];
              const tgt = world.nodes[edge.target];
              if (!src || !tgt) return null;
              const isSelected = selectedEdgeId === edge.id;
              return (
                <g key={edge.id} onClick={(e) => { e.stopPropagation(); setSelectedEdgeId(edge.id); }}>
                  <line
                    x1={src.x}
                    y1={src.y}
                    x2={tgt.x}
                    y2={tgt.y}
                    stroke={isSelected ? '#EAB308' : '#57534E'}
                    strokeWidth={edge.roadType === 'highway' ? 24 : 16}
                    strokeLinecap="round"
                    className="hover:stroke-[#EAB308] cursor-pointer"
                  />
                  <line
                    x1={src.x}
                    y1={src.y}
                    x2={tgt.x}
                    y2={tgt.y}
                    stroke="#EAB308"
                    strokeWidth={2}
                    strokeDasharray="8 8"
                  />
                </g>
              );
            })}

            {/* Properties / Buildings */}
            {world.properties.map((prop) => {
              const isSelected = selectedPropId === prop.id;
              return (
                <g
                  key={prop.id}
                  transform={`translate(${prop.x}, ${prop.y})`}
                  onClick={(e) => { e.stopPropagation(); setSelectedPropId(prop.id); }}
                  className="cursor-pointer"
                >
                  <rect
                    width={prop.width}
                    height={prop.height}
                    rx={8}
                    fill={prop.color || '#FB923C'}
                    stroke={isSelected ? '#292524' : '#57534E'}
                    strokeWidth={isSelected ? 4 : 2}
                  />
                  <text
                    x={prop.width / 2}
                    y={prop.height / 2 + 4}
                    textAnchor="middle"
                    fontSize={11}
                    fontWeight="bold"
                    fill="#292524"
                  >
                    {prop.name}
                  </text>
                </g>
              );
            })}

            {/* Nodes / Junctions */}
            {Object.values(world.nodes).map((node) => {
              const isSelected = selectedNodeId === node.id;
              const isSource = edgeSourceNodeId === node.id;
              return (
                <g key={node.id} onClick={(e) => handleNodeClick(node.id, e)} className="cursor-pointer">
                  <circle
                    cx={node.x}
                    cy={node.y}
                    r={isSource ? 16 : isSelected ? 12 : 8}
                    fill={isSource ? '#22C55E' : isSelected ? '#EAB308' : '#292524'}
                    stroke="#FBF9F5"
                    strokeWidth={2}
                  />
                  <text
                    x={node.x}
                    y={node.y - 12}
                    textAnchor="middle"
                    fontSize={10}
                    fontWeight="600"
                    fill="#292524"
                  >
                    {node.name || node.id}
                  </text>
                </g>
              );
            })}
          </g>
        </svg>

        {/* Sidebar Inspector Panel */}
        <div className="absolute top-4 right-4 w-72 bg-[#FBF9F5]/95 border border-[#E8DFCF] rounded-3xl p-4 shadow-xl backdrop-blur-md">
          <h3 className="text-xs font-black uppercase text-[#78716C] tracking-wider mb-2">
            Inspector & Properties
          </h3>

          {selectedPropId && (
            <div className="space-y-3">
              {(() => {
                const prop = world.properties.find((p) => p.id === selectedPropId);
                if (!prop) return null;
                return (
                  <>
                    <div>
                      <label className="text-[11px] font-bold text-[#78716C]">Name</label>
                      <input
                        type="text"
                        value={prop.name}
                        onChange={(e) => {
                          const val = e.target.value;
                          setWorld((prev) => ({
                            ...prev,
                            properties: prev.properties.map((p) =>
                              p.id === prop.id ? { ...p, name: val } : p
                            ),
                          }));
                        }}
                        className="w-full mt-1 px-3 py-1.5 rounded-xl border border-[#E8DFCF] bg-white text-xs font-bold"
                      />
                    </div>
                    <div>
                      <label className="text-[11px] font-bold text-[#78716C]">Price (GH₵)</label>
                      <input
                        type="number"
                        value={prop.price}
                        onChange={(e) => {
                          const val = Number(e.target.value);
                          setWorld((prev) => ({
                            ...prev,
                            properties: prev.properties.map((p) =>
                              p.id === prop.id ? { ...p, price: val } : p
                            ),
                          }));
                        }}
                        className="w-full mt-1 px-3 py-1.5 rounded-xl border border-[#E8DFCF] bg-white text-xs font-bold"
                      />
                    </div>
                    <div>
                      <label className="text-[11px] font-bold text-[#78716C]">Income (GH₵/min)</label>
                      <input
                        type="number"
                        value={prop.baseIncomeRate}
                        onChange={(e) => {
                          const val = Number(e.target.value);
                          setWorld((prev) => ({
                            ...prev,
                            properties: prev.properties.map((p) =>
                              p.id === prop.id ? { ...p, baseIncomeRate: val } : p
                            ),
                          }));
                        }}
                        className="w-full mt-1 px-3 py-1.5 rounded-xl border border-[#E8DFCF] bg-white text-xs font-bold"
                      />
                    </div>
                  </>
                );
              })()}
            </div>
          )}

          {!selectedPropId && !selectedNodeId && !selectedEdgeId && (
            <div className="text-xs text-[#78716C]">
              Select any road junction, segment, or building on the map to modify its properties, or use the top toolbar to draw new roads.
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
