import React, { useCallback, useMemo, useRef } from 'react';
import {
  ReactFlow,
  Node,
  Edge,
  Background,
  Controls,
  MiniMap,
  useNodesState,
  useEdgesState,
  Position,
  Handle,
} from '@xyflow/react';
import type { NodeProps } from '@xyflow/react';
import '@xyflow/react/dist/style.css';
import { toPng } from 'html-to-image';
import { jsPDF } from 'jspdf';

interface MindMapNodeData {
  label: string;
  isRoot?: boolean;
  description?: string;
  onClick?: () => void;
}

const MindMapNode: React.FC<NodeProps> = ({ data, selected }) => {
  const nodeData = data as unknown as MindMapNodeData;
  const isRoot = nodeData.isRoot;

  return (
    <div
      className={`px-4 py-3 rounded-xl shadow-md cursor-pointer transition-all duration-200 font-serif ${
        isRoot
          ? 'bg-gradient-to-br from-amber-50 to-yellow-100 border-2 border-yellow-600 min-w-[180px]'
          : selected
          ? 'bg-white border-2 border-leather shadow-lg min-w-[140px]'
          : 'bg-[#FFFEF9] border-2 border-[#8B7355] hover:border-leather hover:shadow-lg min-w-[140px]'
      }`}
      onClick={nodeData.onClick}
    >
      <Handle
        type="target"
        position={Position.Top}
        className="!bg-[#8B7355] !w-2 !h-2 !border-none"
      />
      <div className={`text-center ${isRoot ? 'text-lg font-bold' : 'text-sm'}`}>
        <span className={`${isRoot ? 'text-yellow-800' : 'text-[#3D2914]'}`}>
          {nodeData.label}
        </span>
      </div>
      {nodeData.description && !isRoot && (
        <div className="text-xs text-[#8B7355] mt-1 text-center">{nodeData.description}</div>
      )}
      <Handle
        type="source"
        position={Position.Bottom}
        className="!bg-[#8B7355] !w-2 !h-2 !border-none"
      />
    </div>
  );
};

const nodeTypes = { mindMapNode: MindMapNode };

interface MindMapData {
  id: string;
  label: string;
  children?: MindMapData[];
}

interface MindMapViewerProps {
  data: MindMapData | null;
  onNodeClick?: (nodeId: string, nodeLabel: string) => void;
}

export const MindMapViewer: React.FC<MindMapViewerProps> = ({ data, onNodeClick }) => {
  const reactFlowWrapper = useRef<HTMLDivElement>(null);
  const [nodes, setNodes, onNodesChange] = useNodesState([] as Node[]);
  const [edges, setEdges, onEdgesChange] = useEdgesState([] as Edge[]);

  const convertToNodesAndEdges = useCallback(
    (mindMapData: MindMapData | null): { nodes: Node[]; edges: Edge[] } => {
      if (!mindMapData) return { nodes: [], edges: [] };

      const nodesList: Node[] = [];
      const edgesList: Edge[] = [];

      const addNode = (
        item: MindMapData,
        parentId: string | null,
        level: number,
        index: number
      ) => {
        const nodeId = item.id;
        const isRoot = level === 0;

        const x = isRoot ? 400 : (index - (item.children?.length ?? 0) / 2) * 250 + (level % 2) * 200;
        const y = isRoot ? 100 : level * 150 + 50;

        nodesList.push({
          id: nodeId,
          type: 'mindMapNode',
          position: { x, y },
          data: {
            label: item.label,
            isRoot,
            description: item.children ? `${item.children.length}个子主题` : undefined,
            onClick: onNodeClick ? () => onNodeClick(nodeId, item.label) : undefined,
          },
        });

        if (parentId) {
          edgesList.push({
            id: `e-${parentId}-${nodeId}`,
            source: parentId,
            target: nodeId,
            type: 'smoothstep',
            style: { stroke: '#8B7355', strokeWidth: 2 },
          });
        }

        if (item.children) {
          item.children.forEach((child, childIndex) => {
            addNode(child, nodeId, level + 1, childIndex);
          });
        }
      };

      addNode(mindMapData, null, 0, 0);

      return { nodes: nodesList, edges: edgesList };
    },
    [onNodeClick]
  );

  useMemo(() => {
    const { nodes: newNodes, edges: newEdges } = convertToNodesAndEdges(data);
    setNodes(newNodes);
    setEdges(newEdges);
  }, [data, convertToNodesAndEdges, setNodes, setEdges]);

  const exportToPNG = useCallback(async () => {
    if (!reactFlowWrapper.current) return;

    const element = reactFlowWrapper.current.querySelector('.react-flow');
    if (!element) return;

    try {
      const dataUrl = await toPng(element as HTMLElement, {
        backgroundColor: '#F5F0E6',
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
        backgroundColor: '#F5F0E6',
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
          nodeTypes={nodeTypes as never}
          fitView
          fitViewOptions={{ padding: 0.3 }}
          minZoom={0.1}
          maxZoom={2}
          defaultEdgeOptions={{
            type: 'smoothstep',
            style: { stroke: '#8B7355', strokeWidth: 2 },
          }}
          proOptions={{ hideAttribution: true }}
        >
          <Background color="#E5DDD0" gap={20} size={1} />
          <Controls
            showInteractive={false}
            className="!bg-[#FFFEF9] !border-[#8B7355] !rounded-lg !shadow-lg [&>button]:!bg-[#FFFEF9] [&>button]:!border-[#8B7355] [&>button]:!text-[#3D2914] [&>button:hover]:!bg-[#F5EDE0]"
          />
          <MiniMap
            nodeColor={() => '#D4A574'}
            maskColor="rgba(240, 230, 215, 0.7)"
            className="!bg-[#FFFEF9] !border-[#8B7355]"
          />
        </ReactFlow>
      </div>

      <div className="absolute top-4 right-16 flex gap-2 z-10">
        <button
          onClick={exportToPNG}
          className="px-3 py-2 bg-[#FFFEF9] border-2 border-[#8B7355] rounded-lg text-sm text-[#3D2914] font-serif hover:bg-[#F5EDE0] transition-colors shadow-md"
          title="导出为PNG"
        >
          📷 PNG
        </button>
        <button
          onClick={exportToPDF}
          className="px-3 py-2 bg-[#FFFEF9] border-2 border-[#8B7355] rounded-lg text-sm text-[#3D2914] font-serif hover:bg-[#F5EDE0] transition-colors shadow-md"
          title="导出为PDF"
        >
          📄 PDF
        </button>
      </div>

      <style>{`
        .react-flow__node {
          cursor: grab;
        }
        .react-flow__node:active {
          cursor: grabbing;
        }
        .react-flow__edge-path {
          stroke: #8B7355;
          stroke-width: 2;
        }
        .react-flow__background {
          background-color: #F5F0E6;
        }
      `}</style>
    </div>
  );
};

export default MindMapViewer;
