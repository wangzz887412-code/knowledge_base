import React, { useCallback, useMemo, useRef, useState } from 'react';
import { motion } from 'framer-motion';
import {
  ReactFlow,
  Node,
  Edge,
  Background,
  Controls,
  MiniMap,
  useNodesState,
  useEdgesState,
  addEdge,
  Connection,
  Handle,
  Position,
} from '@xyflow/react';
import type { NodeProps, EdgeProps } from '@xyflow/react';
import '@xyflow/react/dist/style.css';
import { toPng } from 'html-to-image';
import { jsPDF } from 'jspdf';

interface MindMapNodeData {
  label: string;
  isRoot?: boolean;
  description?: string;
}

interface RelationData {
  id: string;
  source: string;
  target: string;
  type: string;
  description: string;
}

const RELATION_COLORS: Record<string, string> = {
  related_to: '#9ca3af',
  causes: '#ef4444',
  contrasts_with: '#f59e0b',
  similar_to: '#10b981',
  part_of: '#3b82f6',
  implies: '#8b5cf6',
};

const RELATION_LABELS: Record<string, string> = {
  related_to: '相关',
  causes: '导致',
  contrasts_with: '对比',
  similar_to: '相似',
  part_of: '部分',
  implies: '蕴含',
};

interface MindMapNodeProps extends NodeProps {
  maxWidth?: number;
}

const MindMapNode: React.FC<MindMapNodeProps> = ({ data, selected, maxWidth = 300 }) => {
  const nodeData = data as unknown as MindMapNodeData;
  const isRoot = nodeData.isRoot;
  const labelLength = nodeData.label?.length || 0;
  
  const nodeWidth = Math.min(maxWidth, Math.max(160, labelLength * 8));

  return (
    <div
      className={`px-5 py-3 rounded-lg shadow-lg cursor-pointer transition-all duration-200 font-serif relative ${
        isRoot
          ? 'bg-gradient-to-br from-blue-500 to-blue-600 border-2 border-blue-400'
          : selected
          ? 'bg-gray-600 border-2 border-gray-400 shadow-xl'
          : 'bg-gray-700 border-2 border-gray-500 hover:border-gray-400 hover:shadow-xl'
      }`}
      style={{ width: nodeWidth }}
    >
      <Handle type="source" position={Position.Right} className="bg-blue-500 w-3 h-3" />
      <Handle type="target" position={Position.Left} className="bg-purple-500 w-3 h-3" />
      <div className={`text-center leading-relaxed ${isRoot ? 'text-lg font-bold text-white' : 'text-sm text-white'}`}>
        {nodeData.label}
      </div>
      {nodeData.description && (
        <div className="text-xs text-gray-300 mt-1 text-center opacity-70">
          {nodeData.description}
        </div>
      )}
    </div>
  );
};

const RelationEdge: React.FC<EdgeProps> = ({
  id,
  sourceX,
  sourceY,
  targetX,
  targetY,
  sourcePosition,
  targetPosition,
  data,
}) => {
  const relationData = data as unknown as RelationData;
  const color = RELATION_COLORS[relationData?.type] || '#9ca3af';
  const label = relationData?.description || RELATION_LABELS[relationData?.type] || '';

  const midX = (sourceX + targetX) / 2;
  const midY = (sourceY + targetY) / 2;

  const path = `M ${sourceX} ${sourceY} C ${midX} ${sourceY}, ${midX} ${targetY}, ${targetX} ${targetY}`;

  return (
    <>
      <path
        id={id}
        d={path}
        fill="none"
        stroke={color}
        strokeWidth={2}
        strokeDasharray="5,5"
        className="react-flow__edge-path"
        markerEnd="url(#arrowhead)"
      />
      {label && (
        <g transform={`translate(${midX}, ${midY})`}>
          <rect
            x="-40"
            y="-10"
            width="80"
            height="20"
            rx="10"
            fill="#4b5563"
          />
          <text
            textAnchor="middle"
            dominantBaseline="middle"
            fill="#fff"
            fontSize="12"
          >
            {label}
          </text>
        </g>
      )}
    </>
  );
};

const edgeTypes = { relation: RelationEdge };

interface MindMapData {
  id: string;
  label: string;
  children?: MindMapData[];
  relations?: RelationData[];
}

const BRANCH_COLORS = [
  '#ff6b6b',
  '#feca57',
  '#48dbfb',
  '#1dd1a1',
  '#ff9ff3',
  '#54a0ff',
  '#5f27cd',
  '#00d2d3',
];

interface MindMapViewerProps {
  data: MindMapData | null;
  fileId?: string;
  onNodeClick?: (nodeId: string, nodeLabel: string) => void;
}

export const MindMapViewer: React.FC<MindMapViewerProps> = ({ data, fileId, onNodeClick }) => {
  const reactFlowWrapper = useRef<HTMLDivElement>(null);
  const [nodes, setNodes, onNodesChange] = useNodesState([] as Node[]);
  const [edges, setEdges, onEdgesChange] = useEdgesState([] as Edge[]);
  const [relations, setRelations] = useState<RelationData[]>([]);
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [selectedNode, setSelectedNode] = useState<string | null>(null);
  const [selectedEdge, setSelectedEdge] = useState<string | null>(null);
  const [showAddNodeModal, setShowAddNodeModal] = useState(false);
  const [showEditModal, setShowEditModal] = useState(false);
  const [showAddRelationModal, setShowAddRelationModal] = useState(false);
  const [newNodeLabel, setNewNodeLabel] = useState('');
  const [editNodeLabel, setEditNodeLabel] = useState('');
  const [relationSource, setRelationSource] = useState('');
  const [relationTarget, setRelationTarget] = useState('');
  const [relationType, setRelationType] = useState('related_to');
  const [relationDescription, setRelationDescription] = useState('');
  const [progress, setProgress] = useState<{ message: string; percentage: number } | null>(null);
  const [showLayoutConfig, setShowLayoutConfig] = useState(false);

  const [layoutConfig, setLayoutConfig] = useState({
    canvasWidth: 2000,
    canvasHeight: 1400,
    levelSpacing: 250,
    nodeGap: 80,
    maxNodeWidth: 300,
  });

  const MAX_DEPTH = 4;
  const NODE_WIDTH = 180;
  const NODE_HEIGHT = 50;

  const calculateSubtreeHeight = useCallback((item: MindMapData): number => {
    if (!item.children || item.children.length === 0) {
      return NODE_HEIGHT;
    }
    return item.children.reduce((acc, child) => acc + calculateSubtreeHeight(child) + layoutConfig.nodeGap, 0);
  }, [layoutConfig.nodeGap]);

  const convertToNodesAndEdges = useCallback(
    (mindMapData: MindMapData | null): { nodes: Node[]; edges: Edge[] } => {
      if (!mindMapData) return { nodes: [], edges: [] };

      const nodesList: Node[] = [];
      const edgesList: Edge[] = [];
      const { canvasWidth, canvasHeight, levelSpacing, nodeGap } = layoutConfig;
      
      const rootSubtreeHeight = calculateSubtreeHeight(mindMapData);
      const ROOT_Y = Math.max(150, Math.min(canvasHeight - 150, rootSubtreeHeight / 2 + 50));
      const ROOT_X = 200;

      const addNode = (
        item: MindMapData,
        parentId: string | null,
        level: number,
        yOffset: number,
        branchIndex: number
      ) => {
        if (level > MAX_DEPTH) return { nextY: yOffset };
        
        const nodeId = item.id;
        const isRoot = level === 0;
        const color = BRANCH_COLORS[branchIndex % BRANCH_COLORS.length];

        const x = ROOT_X + level * levelSpacing;
        const subtreeHeight = calculateSubtreeHeight(item);
        const y = yOffset + subtreeHeight / 2;

        const clampedX = Math.max(NODE_WIDTH, Math.min(canvasWidth - NODE_WIDTH - 50, x));
        const clampedY = Math.max(NODE_HEIGHT / 2, Math.min(canvasHeight - NODE_HEIGHT / 2, y));

        nodesList.push({
          id: nodeId,
          type: 'mindMapNode',
          position: { x: clampedX, y: clampedY },
          data: {
            label: item.label,
            isRoot,
          },
        });

        if (parentId) {
          edgesList.push({
            id: `e-${parentId}-${nodeId}`,
            source: parentId,
            target: nodeId,
            type: 'smoothstep',
            style: { stroke: color, strokeWidth: isRoot ? 4 : 2 },
          });
        }

        let nextY = yOffset;
        if (item.children && item.children.length > 0 && level < MAX_DEPTH) {
          const validChildren = item.children.slice(0, 10);
          validChildren.forEach((child, childIndex) => {
            const childSubtreeHeight = calculateSubtreeHeight(child);
            const result = addNode(child, nodeId, level + 1, nextY, branchIndex);
            nextY = result.nextY + nodeGap;
          });
        }

        return { nextY: yOffset + subtreeHeight };
      };

      addNode(mindMapData, null, 0, 50, 0);

      if (mindMapData.relations) {
        mindMapData.relations.forEach((relation, index) => {
          edgesList.push({
            id: `rel-${index}`,
            source: relation.source,
            target: relation.target,
            type: 'relation',
            style: { stroke: RELATION_COLORS[relation.type] || '#9ca3af', strokeWidth: 2, strokeDasharray: '5,5' },
            data: relation,
          });
        });
      }

      return { nodes: nodesList, edges: edgesList };
    },
    [layoutConfig, calculateSubtreeHeight]
  );

  useMemo(() => {
    const { nodes: newNodes, edges: newEdges } = convertToNodesAndEdges(data);
    setNodes(newNodes);
    setEdges(newEdges);
    if (data?.relations) {
      setRelations(data.relations);
    }
  }, [data, convertToNodesAndEdges, setNodes, setEdges]);

  const analyzeRelations = useCallback(async () => {
    if (!fileId) return;
    
    setIsAnalyzing(true);
    setProgress({ message: '正在分析节点关系...', percentage: 20 });
    
    try {
      const response = await fetch(`/api/ai/mindmap/analyze-relations/`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'X-CSRFToken': document.querySelector('meta[name="csrf-token"]')?.getAttribute('content') || '',
        },
        body: JSON.stringify({ file_id: fileId }),
        credentials: 'include',
      });
      
      setProgress({ message: 'AI正在分析语义关联...', percentage: 50 });
      
      const result = await response.json();
      
      setProgress({ message: '正在生成连接...', percentage: 80 });
      
      if (result.success) {
        setRelations(result.relations);
        const relationEdges: Edge[] = result.relations.map((rel: RelationData, index: number) => ({
          id: `rel-${index}`,
          source: rel.source,
          target: rel.target,
          type: 'relation',
          style: { stroke: RELATION_COLORS[rel.type] || '#9ca3af', strokeWidth: 2, strokeDasharray: '5,5' },
          data: rel,
        }));
        
        setEdges(prev => [...prev.filter(e => !e.id?.startsWith('rel-')), ...relationEdges]);
        
        setProgress({ message: '分析完成！', percentage: 100 });
        setTimeout(() => setProgress(null), 2000);
      }
    } catch (error) {
      console.error('分析关联失败:', error);
      setProgress(null);
    } finally {
      setIsAnalyzing(false);
    }
  }, [fileId]);

  const handleAddNode = async () => {
    if (!newNodeLabel.trim() || !selectedNode || !fileId) return;
    
    try {
      const response = await fetch(`/api/ai/mindmap/edit/`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'X-CSRFToken': document.querySelector('meta[name="csrf-token"]')?.getAttribute('content') || '',
        },
        body: JSON.stringify({
          file_id: fileId,
          updates: {
            add_node: {
              id: `node_${Date.now()}`,
              label: newNodeLabel,
              parent_id: selectedNode,
            },
          },
        }),
        credentials: 'include',
      });
      
      const result = await response.json();
      if (result.success) {
        window.location.reload();
      }
    } catch (error) {
      console.error('添加节点失败:', error);
    }
    
    setShowAddNodeModal(false);
    setNewNodeLabel('');
  };

  const handleEditNode = async () => {
    if (!editNodeLabel.trim() || !selectedNode || !fileId) return;
    
    try {
      const response = await fetch(`/api/ai/mindmap/edit/`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'X-CSRFToken': document.querySelector('meta[name="csrf-token"]')?.getAttribute('content') || '',
        },
        body: JSON.stringify({
          file_id: fileId,
          updates: {
            update_node: {
              id: selectedNode,
              label: editNodeLabel,
            },
          },
        }),
        credentials: 'include',
      });
      
      const result = await response.json();
      if (result.success) {
        window.location.reload();
      }
    } catch (error) {
      console.error('编辑节点失败:', error);
    }
    
    setShowEditModal(false);
    setEditNodeLabel('');
  };

  const handleDeleteNode = async () => {
    if (!selectedNode || !fileId) return;
    
    if (!window.confirm('确定要删除这个节点吗？')) return;
    
    try {
      const response = await fetch(`/api/ai/mindmap/edit/`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'X-CSRFToken': document.querySelector('meta[name="csrf-token"]')?.getAttribute('content') || '',
        },
        body: JSON.stringify({
          file_id: fileId,
          updates: {
            delete_node: selectedNode,
          },
        }),
        credentials: 'include',
      });
      
      const result = await response.json();
      if (result.success) {
        setNodes(prev => prev.filter(n => n.id !== selectedNode));
        setEdges(prev => prev.filter(e => e.source !== selectedNode && e.target !== selectedNode));
      }
    } catch (error) {
      console.error('删除节点失败:', error);
    }
    
    setSelectedNode(null);
  };

  const handleAddRelation = async () => {
    if (!relationSource || !relationTarget || !fileId) return;
    
    try {
      const response = await fetch(`/api/ai/mindmap/edit/`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'X-CSRFToken': document.querySelector('meta[name="csrf-token"]')?.getAttribute('content') || '',
        },
        body: JSON.stringify({
          file_id: fileId,
          updates: {
            add_relation: {
              source: relationSource,
              target: relationTarget,
              type: relationType,
              description: relationDescription || RELATION_LABELS[relationType],
            },
          },
        }),
        credentials: 'include',
      });
      
      const result = await response.json();
      if (result.success) {
        const newRelation: RelationData = {
          id: `rel_${Date.now()}`,
          source: relationSource,
          target: relationTarget,
          type: relationType,
          description: relationDescription || RELATION_LABELS[relationType],
        };
        
        setEdges(prev => [...prev, {
          id: newRelation.id,
          source: newRelation.source,
          target: newRelation.target,
          type: 'relation',
          style: { stroke: RELATION_COLORS[newRelation.type] || '#9ca3af', strokeWidth: 2, strokeDasharray: '5,5' },
          data: newRelation,
        }]);
      }
    } catch (error) {
      console.error('添加关联失败:', error);
    }
    
    setShowAddRelationModal(false);
    setRelationSource('');
    setRelationTarget('');
    setRelationType('related_to');
    setRelationDescription('');
  };

  const handleDeleteRelation = async () => {
    if (!selectedEdge || !fileId) return;
    
    if (!window.confirm('确定要删除这个关联吗？')) return;
    
    try {
      const response = await fetch(`/api/ai/mindmap/edit/`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'X-CSRFToken': document.querySelector('meta[name="csrf-token"]')?.getAttribute('content') || '',
        },
        body: JSON.stringify({
          file_id: fileId,
          updates: {
            delete_relation: selectedEdge,
          },
        }),
        credentials: 'include',
      });
      
      const result = await response.json();
      if (result.success) {
        setEdges(prev => prev.filter(e => e.id !== selectedEdge));
      }
    } catch (error) {
      console.error('删除关联失败:', error);
    }
    
    setSelectedEdge(null);
  };

  const handleConnect = useCallback((connection: Connection) => {
    const newRelation: RelationData = {
      id: `rel_${Date.now()}`,
      source: connection.source,
      target: connection.target,
      type: 'related_to',
      description: '相关',
    };
    
    setEdges(prev => addEdge({
      ...connection,
      type: 'relation',
      style: { stroke: '#9ca3af', strokeWidth: 2, strokeDasharray: '5,5' },
      data: newRelation,
    }, prev));
  }, [setEdges]);

  const exportToPNG = useCallback(async () => {
    if (!reactFlowWrapper.current) return;

    const element = reactFlowWrapper.current.querySelector('.react-flow');
    if (!element) return;

    try {
      const dataUrl = await toPng(element as HTMLElement, {
        backgroundColor: '#2d2d2d',
        pixelRatio: 2,
      });

      const link = document.createElement('a');
      link.download = 'mindmap.png';
      link.href = dataUrl;
      link.click();
    } catch (error) {
      console.error('导出PNG失败:', error);
    }
  }, []);

  const exportToPDF = useCallback(async () => {
    if (!reactFlowWrapper.current) return;

    const element = reactFlowWrapper.current.querySelector('.react-flow');
    if (!element) return;

    try {
      const dataUrl = await toPng(element as HTMLElement, {
        backgroundColor: '#2d2d2d',
        pixelRatio: 2,
      });

      const pdf = new jsPDF('landscape', 'mm', 'a4');
      const imgWidth = 297;
      const imgHeight = (element as HTMLElement).offsetHeight * (297 / (element as HTMLElement).offsetWidth);

      pdf.addImage(dataUrl, 'PNG', 0, 0, imgWidth, Math.min(imgHeight, 210));
      pdf.save('mindmap.pdf');
    } catch (error) {
      console.error('导出PDF失败:', error);
    }
  }, []);

  const handleNodeClick = useCallback((event: React.MouseEvent, node: Node) => {
    setSelectedNode(node.id);
    setSelectedEdge(null);
    if (onNodeClick) {
      onNodeClick(node.id, String(node.data?.label));
    }
  }, [onNodeClick]);

  const onEdgeClick = useCallback((event: React.MouseEvent, edge: Edge) => {
    event.stopPropagation();
    setSelectedEdge(edge.id);
    setSelectedNode(null);
  }, []);

  if (!data) {
    return (
      <div className="flex items-center justify-center h-full text-[#8B7355] font-serif">
        <div className="text-center">
          <div className="text-6xl mb-4">📚</div>
          <p>暂无思维导图数据</p>
        </div>
      </div>
    );
  }

  return (
    <div className="relative w-full h-full">
      <div ref={reactFlowWrapper} className="w-full h-full">
        <ReactFlow
          nodes={nodes}
          edges={edges}
          onNodesChange={onNodesChange}
          onEdgesChange={onEdgesChange}
          onConnect={handleConnect}
          onNodeClick={handleNodeClick}
          onEdgeClick={onEdgeClick}
          nodeTypes={{ mindMapNode: (props: NodeProps) => <MindMapNode {...props} maxWidth={layoutConfig.maxNodeWidth} /> }}
          edgeTypes={edgeTypes as any}
          fitView
          fitViewOptions={{ padding: 0.2 }}
          minZoom={0.1}
          maxZoom={2}
          proOptions={{ hideAttribution: true }}
          connectable={true}
        >
          <Background color="#4a4a4a" gap={20} size={1} />
          <Controls
            showInteractive={false}
            className="!bg-[#3d3d3d] !border-[#666] !rounded-lg !shadow-lg [&>button]:!bg-[#3d3d3d] [&>button]:!border-[#666] [&>button]:!text-white [&>button:hover]:!bg-[#555]"
          />
          <MiniMap
            nodeColor={() => '#666'}
            maskColor="rgba(60, 60, 60, 0.7)"
            className="!bg-[#3d3d3d] !border-[#666]"
          />
          <svg className="react-flow__edge-marker">
            <defs>
              <marker
                id="arrowhead"
                markerWidth="10"
                markerHeight="7"
                refX="9"
                refY="3.5"
                orient="auto"
              >
                <polygon
                  points="0 0, 10 3.5, 0 7"
                  fill="#9ca3af"
                />
              </marker>
            </defs>
          </svg>
        </ReactFlow>
      </div>

      {progress && (
        <div className="absolute top-4 left-1/2 -translate-x-1/2 z-20 w-64">
          <div className="bg-[#3d3d3d] border border-[#666] rounded-lg p-3 shadow-xl">
            <div className="flex items-center justify-between mb-2">
              <span className="text-sm text-white font-serif">{progress.message}</span>
              <span className="text-sm text-gray-400 font-serif">{progress.percentage}%</span>
            </div>
            <div className="w-full h-2 bg-[#4a4a4a] rounded-full overflow-hidden">
              <motion.div
                className="h-full bg-gradient-to-r from-purple-500 to-blue-500 rounded-full"
                initial={{ width: 0 }}
                animate={{ width: `${progress.percentage}%` }}
                transition={{ duration: 0.3 }}
              />
            </div>
          </div>
        </div>
      )}

      {showLayoutConfig && (
        <div className="absolute top-4 left-4 bg-[#3d3d3d] border border-[#666] rounded-lg p-4 z-20 w-72">
          <div className="flex justify-between items-center mb-3">
            <span className="text-white font-serif font-bold">布局配置</span>
            <button
              onClick={() => setShowLayoutConfig(false)}
              className="text-gray-400 hover:text-white"
            >
              ✕
            </button>
          </div>
          <div className="space-y-3">
            <div>
              <label className="block text-gray-300 text-sm mb-1">画布宽度</label>
              <input
                type="range"
                min="1200"
                max="3000"
                step="100"
                value={layoutConfig.canvasWidth}
                onChange={(e) => setLayoutConfig(prev => ({ ...prev, canvasWidth: Number(e.target.value) }))}
                className="w-full"
              />
              <span className="text-xs text-gray-400">{layoutConfig.canvasWidth}</span>
            </div>
            <div>
              <label className="block text-gray-300 text-sm mb-1">画布高度</label>
              <input
                type="range"
                min="800"
                max="2000"
                step="100"
                value={layoutConfig.canvasHeight}
                onChange={(e) => setLayoutConfig(prev => ({ ...prev, canvasHeight: Number(e.target.value) }))}
                className="w-full"
              />
              <span className="text-xs text-gray-400">{layoutConfig.canvasHeight}</span>
            </div>
            <div>
              <label className="block text-gray-300 text-sm mb-1">层级间距</label>
              <input
                type="range"
                min="150"
                max="400"
                step="20"
                value={layoutConfig.levelSpacing}
                onChange={(e) => setLayoutConfig(prev => ({ ...prev, levelSpacing: Number(e.target.value) }))}
                className="w-full"
              />
              <span className="text-xs text-gray-400">{layoutConfig.levelSpacing}</span>
            </div>
            <div>
              <label className="block text-gray-300 text-sm mb-1">节点间距</label>
              <input
                type="range"
                min="40"
                max="150"
                step="10"
                value={layoutConfig.nodeGap}
                onChange={(e) => setLayoutConfig(prev => ({ ...prev, nodeGap: Number(e.target.value) }))}
                className="w-full"
              />
              <span className="text-xs text-gray-400">{layoutConfig.nodeGap}</span>
            </div>
            <div>
              <label className="block text-gray-300 text-sm mb-1">节点最大宽度</label>
              <input
                type="range"
                min="150"
                max="400"
                step="10"
                value={layoutConfig.maxNodeWidth}
                onChange={(e) => setLayoutConfig(prev => ({ ...prev, maxNodeWidth: Number(e.target.value) }))}
                className="w-full"
              />
              <span className="text-xs text-gray-400">{layoutConfig.maxNodeWidth}px</span>
            </div>
            <button
              onClick={() => setLayoutConfig({
                canvasWidth: 2000,
                canvasHeight: 1400,
                levelSpacing: 250,
                nodeGap: 80,
                maxNodeWidth: 300,
              })}
              className="w-full px-3 py-2 bg-blue-600 text-white text-sm rounded hover:bg-blue-500 transition-colors"
            >
              重置默认值
            </button>
          </div>
        </div>
      )}

      <div className="absolute top-4 right-16 flex gap-2 z-10">
        <button
          onClick={analyzeRelations}
          disabled={isAnalyzing}
          className="px-3 py-2 bg-gradient-to-r from-purple-600 to-blue-600 border-2 border-purple-500 rounded-lg text-sm text-white font-serif hover:from-purple-500 hover:to-blue-500 transition-all shadow-md disabled:opacity-50 disabled:cursor-not-allowed"
          title="AI分析知识点关联"
        >
          {isAnalyzing ? '🔄 分析中...' : '🧠 AI分析关联'}
        </button>
        <button
          onClick={() => {
            setShowAddRelationModal(true);
          }}
          className="px-3 py-2 bg-[#4a4a4a] border-2 border-[#666] rounded-lg text-sm text-white font-serif hover:bg-[#555] transition-colors shadow-md"
          title="添加自定义关联"
        >
          ➕ 添加关联
        </button>
        <button
          onClick={exportToPNG}
          className="px-3 py-2 bg-[#4a4a4a] border-2 border-[#666] rounded-lg text-sm text-white font-serif hover:bg-[#555] transition-colors shadow-md"
          title="导出为PNG"
        >
          📷 PNG
        </button>
        <button
          onClick={exportToPDF}
          className="px-3 py-2 bg-[#4a4a4a] border-2 border-[#666] rounded-lg text-sm text-white font-serif hover:bg-[#555] transition-colors shadow-md"
          title="导出为PDF"
        >
          📄 PDF
        </button>
        <button
          onClick={() => setShowLayoutConfig(!showLayoutConfig)}
          className="px-3 py-2 bg-[#4a4a4a] border-2 border-[#666] rounded-lg text-sm text-white font-serif hover:bg-[#555] transition-colors shadow-md"
          title="调整布局参数"
        >
          ⚙️ 布局
        </button>
      </div>

      {selectedNode && (
        <div className="absolute bottom-4 left-4 bg-[#3d3d3d] border border-[#666] rounded-lg p-4 z-10">
          <p className="text-white text-sm mb-3">已选中节点: {nodes.find(n => n.id === selectedNode)?.data?.label}</p>
          <div className="flex gap-2">
            <button
              onClick={() => {
                setEditNodeLabel(nodes.find(n => n.id === selectedNode)?.data?.label || '');
                setShowEditModal(true);
              }}
              className="px-3 py-1 bg-blue-600 text-white text-sm rounded hover:bg-blue-500 transition-colors"
            >
              编辑
            </button>
            <button
              onClick={() => {
                setNewNodeLabel('');
                setShowAddNodeModal(true);
              }}
              className="px-3 py-1 bg-green-600 text-white text-sm rounded hover:bg-green-500 transition-colors"
            >
              添加子节点
            </button>
            <button
              onClick={handleDeleteNode}
              className="px-3 py-1 bg-red-600 text-white text-sm rounded hover:bg-red-500 transition-colors"
            >
              删除
            </button>
          </div>
        </div>
      )}

      {selectedEdge && (
        <div className="absolute bottom-4 left-4 bg-[#3d3d3d] border border-[#666] rounded-lg p-4 z-10">
          <p className="text-white text-sm mb-3">已选中关联</p>
          <button
            onClick={handleDeleteRelation}
            className="px-3 py-1 bg-red-600 text-white text-sm rounded hover:bg-red-500 transition-colors"
          >
            删除关联
          </button>
        </div>
      )}

      {showAddNodeModal && (
        <div className="absolute inset-0 bg-black/50 flex items-center justify-center z-50">
          <div className="bg-[#3d3d3d] border border-[#666] rounded-lg p-6 w-96">
            <h3 className="text-white font-serif font-bold mb-4">添加子节点</h3>
            <input
              type="text"
              value={newNodeLabel}
              onChange={(e) => setNewNodeLabel(e.target.value)}
              placeholder="输入节点标签"
              className="w-full px-3 py-2 bg-[#4a4a4a] border border-[#666] rounded text-white placeholder-gray-400 focus:outline-none focus:border-blue-500"
            />
            <div className="flex gap-2 mt-4">
              <button
                onClick={handleAddNode}
                disabled={!newNodeLabel.trim()}
                className="flex-1 px-3 py-2 bg-blue-600 text-white rounded hover:bg-blue-500 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
              >
                添加
              </button>
              <button
                onClick={() => setShowAddNodeModal(false)}
                className="px-3 py-2 bg-[#4a4a4a] text-white rounded hover:bg-[#555] transition-colors"
              >
                取消
              </button>
            </div>
          </div>
        </div>
      )}

      {showEditModal && (
        <div className="absolute inset-0 bg-black/50 flex items-center justify-center z-50">
          <div className="bg-[#3d3d3d] border border-[#666] rounded-lg p-6 w-96">
            <h3 className="text-white font-serif font-bold mb-4">编辑节点</h3>
            <input
              type="text"
              value={editNodeLabel}
              onChange={(e) => setEditNodeLabel(e.target.value)}
              placeholder="输入节点标签"
              className="w-full px-3 py-2 bg-[#4a4a4a] border border-[#666] rounded text-white placeholder-gray-400 focus:outline-none focus:border-blue-500"
            />
            <div className="flex gap-2 mt-4">
              <button
                onClick={handleEditNode}
                disabled={!editNodeLabel.trim()}
                className="flex-1 px-3 py-2 bg-blue-600 text-white rounded hover:bg-blue-500 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
              >
                保存
              </button>
              <button
                onClick={() => setShowEditModal(false)}
                className="px-3 py-2 bg-[#4a4a4a] text-white rounded hover:bg-[#555] transition-colors"
              >
                取消
              </button>
            </div>
          </div>
        </div>
      )}

      {showAddRelationModal && (
        <div className="absolute inset-0 bg-black/50 flex items-center justify-center z-50">
          <div className="bg-[#3d3d3d] border border-[#666] rounded-lg p-6 w-96">
            <h3 className="text-white font-serif font-bold mb-4">添加关联</h3>
            <div className="space-y-3">
              <select
                value={relationSource}
                onChange={(e) => setRelationSource(e.target.value)}
                className="w-full px-3 py-2 bg-[#4a4a4a] border border-[#666] rounded text-white focus:outline-none focus:border-blue-500"
              >
                <option value="">选择源节点</option>
                {nodes.map((node) => (
                  <option key={node.id} value={node.id}>
                    {node.data?.label}
                  </option>
                ))}
              </select>
              <select
                value={relationTarget}
                onChange={(e) => setRelationTarget(e.target.value)}
                className="w-full px-3 py-2 bg-[#4a4a4a] border border-[#666] rounded text-white focus:outline-none focus:border-blue-500"
              >
                <option value="">选择目标节点</option>
                {nodes.map((node) => (
                  <option key={node.id} value={node.id}>
                    {node.data?.label}
                  </option>
                ))}
              </select>
              <select
                value={relationType}
                onChange={(e) => setRelationType(e.target.value)}
                className="w-full px-3 py-2 bg-[#4a4a4a] border border-[#666] rounded text-white focus:outline-none focus:border-blue-500"
              >
                {Object.entries(RELATION_LABELS).map(([key, label]) => (
                  <option key={key} value={key}>
                    {label}
                  </option>
                ))}
              </select>
              <input
                type="text"
                value={relationDescription}
                onChange={(e) => setRelationDescription(e.target.value)}
                placeholder="关联描述（可选）"
                className="w-full px-3 py-2 bg-[#4a4a4a] border border-[#666] rounded text-white placeholder-gray-400 focus:outline-none focus:border-blue-500"
              />
            </div>
            <div className="flex gap-2 mt-4">
              <button
                onClick={handleAddRelation}
                disabled={!relationSource || !relationTarget}
                className="flex-1 px-3 py-2 bg-blue-600 text-white rounded hover:bg-blue-500 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
              >
                添加
              </button>
              <button
                onClick={() => setShowAddRelationModal(false)}
                className="px-3 py-2 bg-[#4a4a4a] text-white rounded hover:bg-[#555] transition-colors"
              >
                取消
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default MindMapViewer;
