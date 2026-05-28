import React, { useMemo } from 'react';
import {
  ReactFlow,
  Node,
  Edge,
  Background,
  Controls,
  useNodesState,
  useEdgesState,
  BezierEdge,
  Handle,
  Position,
} from '@xyflow/react';
import '@xyflow/react/dist/style.css';

interface MindMapNode {
  name: string;
  children?: MindMapNode[];
}

const mindMapData: MindMapNode = {
  name: "知识库思维导图",
  children: [
    {
      name: "思维导图功能",
      children: [
        {
          name: "Obsidian 风格设计",
          children: [
            { name: "柔和配色" },
            { name: "圆角节点" },
            { name: "贝塞尔曲线连线" },
          ],
        },
        {
          name: "节点编辑操作",
          children: [
            { name: "添加子节点" },
            { name: "编辑节点标签" },
            { name: "删除节点" },
          ],
        },
        {
          name: "导出功能",
          children: [
            { name: "PNG格式导出" },
            { name: "PDF格式导出" },
          ],
        },
      ],
    },
    {
      name: "AI分析关联",
      children: [
        { name: "智能分析语义关联" },
        { name: "自动建立知识点连接" },
        {
          name: "6种关联类型",
          children: [
            { name: "相关 / 导致" },
            { name: "对比 / 相似" },
            { name: "部分 / 蕴含" },
          ],
        },
      ],
    },
    {
      name: "布局设计",
      children: [
        { name: "树状层级布局" },
        { name: "层级深度 ≤ 5层" },
        { name: "每层自动着色" },
        { name: "自适应间距" },
      ],
    },
    {
      name: "用户体验",
      children: [
        { name: "快速操作卡片" },
        { name: "最近使用文档" },
        { name: "上传进度显示" },
        { name: "空状态引导" },
      ],
    },
    {
      name: "交互特性",
      children: [
        { name: "节点连接柄" },
        { name: "拖拽创建连接" },
        { name: "关系标签显示" },
        { name: "动画过渡效果" },
      ],
    },
  ],
};

const BRANCH_COLORS = [
  { bg: '#f0e6f6', border: '#c4a2d4', text: '#5c3d6e', accent: '#9b6fb0' },
  { bg: '#e6f3f0', border: '#a2c4b8', text: '#3d5c4f', accent: '#6fa89a' },
  { bg: '#fef3e4', border: '#dcc49e', text: '#6b5230', accent: '#c4984b' },
  { bg: '#e8f0fe', border: '#a8c4e2', text: '#3d5270', accent: '#6b8fc4' },
  { bg: '#fce8ea', border: '#e2a8ac', text: '#6b3d40', accent: '#c46b70' },
];

const ROOT_COLOR = {
  bg: '#4a3f6b',
  border: '#6c5fa7',
  text: '#ffffff',
  accent: '#7c6fb8',
  glow: 'rgba(108, 95, 167, 0.4)',
};

const MindMapCustomNode: React.FC<{
  data: { label: string; isRoot?: boolean; depth?: number; branchColor?: string };
  selected?: boolean;
}> = ({ data, selected }) => {
  const isRoot = data.isRoot;
  const depth = data.depth || 0;
  const branchColor = data.branchColor || '#c4a2d4';

  return (
    <div
      style={{
        position: 'relative',
        padding: isRoot ? '16px 28px' : depth === 1 ? '12px 22px' : '9px 16px',
        borderRadius: isRoot ? '16px' : '12px',
        background: isRoot ? ROOT_COLOR.bg : selected ? '#e8e0ef' : '#faf8fc',
        border: isRoot ? `2px solid ${ROOT_COLOR.border}` : `1.5px solid ${selected ? '#8b6fc0' : branchColor}`,
        color: isRoot ? ROOT_COLOR.text : '#3d3648',
        cursor: 'pointer',
        transition: 'all 0.25s cubic-bezier(0.4, 0, 0.2, 1)',
        boxShadow: isRoot
          ? `0 4px 24px ${ROOT_COLOR.glow}, 0 2px 8px rgba(74, 63, 107, 0.3)`
          : selected
          ? '0 2px 16px rgba(139, 111, 192, 0.25), 0 1px 4px rgba(0,0,0,0.06)'
          : '0 1px 4px rgba(0,0,0,0.04), 0 1px 2px rgba(0,0,0,0.02)',
        fontFamily: "'Inter', 'Segoe UI', system-ui, sans-serif",
        fontSize: isRoot ? '18px' : depth === 1 ? '15px' : '13px',
        fontWeight: isRoot ? 700 : depth === 1 ? 600 : 500,
        lineHeight: 1.5,
        letterSpacing: isRoot ? '0.02em' : '0.01em',
        wordBreak: 'break-word',
      }}
    >
      <div
        style={{
          position: 'absolute',
          left: 0,
          top: isRoot ? 8 : 5,
          bottom: isRoot ? 8 : 5,
          width: 4,
          borderRadius: '0 2px 2px 0',
          background: isRoot ? ROOT_COLOR.accent : branchColor,
        }}
      />
      <Handle
        type="source"
        position={Position.Right}
        style={{
          background: isRoot ? ROOT_COLOR.accent : branchColor,
          border: '2px solid #fff',
          width: 10,
          height: 10,
        }}
      />
      <Handle
        type="target"
        position={Position.Left}
        style={{
          background: '#a39bb5',
          border: '2px solid #fff',
          width: 10,
          height: 10,
        }}
      />
      {data.label}
      {isRoot && (
        <div
          style={{
            position: 'absolute',
            top: -6,
            right: -6,
            width: 12,
            height: 12,
            borderRadius: '50%',
            background: ROOT_COLOR.accent,
            boxShadow: `0 0 8px ${ROOT_COLOR.glow}`,
          }}
        />
      )}
    </div>
  );
};

interface MindMapRendererProps {
  data?: MindMapNode;
}

export const MindMapRenderer: React.FC<MindMapRendererProps> = ({ data = mindMapData }) => {
  const { nodes, edges } = useMemo(() => {
    const nodesList: Node[] = [];
    const edgesList: Edge[] = [];

    const ROOT_X = 500;
    const ROOT_Y = 300;
    const RADIUS_LEVEL1 = 220;
    const RADIUS_INCREMENT = 160;
    const MAX_DEPTH = 4;

    const firstLevelChildren = data.children?.slice(0, 7) || [];
    const ANGLE_STEP = (2 * Math.PI) / Math.max(firstLevelChildren.length, 3);

    const addNode = (
      item: MindMapNode,
      parentId: string | null,
      level: number,
      index: number,
      branchIndex: number,
      parentX: number = ROOT_X,
      parentY: number = ROOT_Y
    ) => {
      if (level > MAX_DEPTH) return;

      const nodeId = `node-${level}-${branchIndex}-${index}`;
      const isRoot = level === 0;
      const color = BRANCH_COLORS[branchIndex % BRANCH_COLORS.length];

      let x: number, y: number;

      if (isRoot) {
        x = ROOT_X;
        y = ROOT_Y;
      } else if (level === 1) {
        const angle = branchIndex * ANGLE_STEP - Math.PI / 2;
        x = ROOT_X + RADIUS_LEVEL1 * Math.cos(angle);
        y = ROOT_Y + RADIUS_LEVEL1 * Math.sin(angle);
      } else {
        const radius = RADIUS_LEVEL1 + (level - 1) * RADIUS_INCREMENT;
        const childrenCount = item.children?.length ?? 1;
        const angle = (index / childrenCount) * 2 * Math.PI - Math.PI / 2;
        x = parentX + radius * 0.5 * Math.cos(angle);
        y = parentY + radius * 0.5 * Math.sin(angle);
      }

      nodesList.push({
        id: nodeId,
        type: 'mindMapNode',
        position: { x, y },
        data: {
          label: item.name,
          isRoot,
          depth: level,
          branchColor: color.accent,
        },
      });

      if (parentId) {
        edgesList.push({
          id: `edge-${parentId}-${nodeId}`,
          source: parentId,
          target: nodeId,
          type: 'default',
          style: {
            stroke: color.accent,
            strokeWidth: level === 1 ? 2.5 : 2,
            strokeOpacity: level === 1 ? 0.8 : 0.6,
          },
        });
      }

      if (item.children) {
        const validChildren = item.children.slice(0, 7);
        validChildren.forEach((child, childIndex) => {
          addNode(child, nodeId, level + 1, childIndex, branchIndex, x, y);
        });
      }
    };

    addNode(data, null, 0, 0, 0, ROOT_X, ROOT_Y);

    return { nodes: nodesList, edges: edgesList };
  }, [data]);

  const [nodesState, setNodes, onNodesChange] = useNodesState(nodes);
  const [edgesState, setEdges, onEdgesChange] = useEdgesState(edges);

  return (
    <div className="w-full h-[600px] rounded-xl overflow-hidden">
      <ReactFlow
        nodes={nodesState}
        edges={edgesState}
        onNodesChange={onNodesChange}
        onEdgesChange={onEdgesChange}
        nodeTypes={{ mindMapNode: MindMapCustomNode as any }}
        edgeTypes={{ default: BezierEdge as any }}
        fitView
        fitViewOptions={{ padding: 0.3 }}
        minZoom={0.1}
        maxZoom={2}
        proOptions={{ hideAttribution: true }}
        defaultEdgeOptions={{ type: 'default' }}
      >
        <Background
          color="#e8e3ed"
          gap={20}
          size={1}
          style={{ backgroundColor: '#faf8f5' }}
        />
        <Controls
          showInteractive={false}
          className="!bg-white !border-[#e0d8ec] !rounded-xl !shadow-md !overflow-hidden [&>button]:!bg-white [&>button]:!border-[#e0d8ec] [&>button]:!text-[#5c5470] [&>button:hover]:!bg-[#f5f2f8] [&>button>svg]:!fill-[#5c5470]"
        />
      </ReactFlow>
    </div>
  );
};

export default MindMapRenderer;