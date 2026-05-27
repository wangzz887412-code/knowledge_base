import React, { useMemo } from 'react';
import {
  ReactFlow,
  Node,
  Edge,
  Background,
  Controls,
  useNodesState,
  useEdgesState,
} from '@xyflow/react';
import '@xyflow/react/dist/style.css';

interface MindMapNode {
  name: string;
  children?: MindMapNode[];
}

const mindMapData: MindMapNode = {
  "name": "知识库思维导图",
  "children": [
    {
      "name": "思维导图功能",
      "children": [
        {
          "name": "深色主题设计",
          "children": [
            {"name": "蓝色根节点"},
            {"name": "灰色子节点"},
            {"name": "彩色分支连线"}
          ]
        },
        {
          "name": "节点编辑操作",
          "children": [
            {"name": "添加子节点"},
            {"name": "编辑节点标签"},
            {"name": "删除节点"}
          ]
        },
        {
          "name": "导出功能",
          "children": [
            {"name": "PNG格式导出"},
            {"name": "PDF格式导出"}
          ]
        }
      ]
    },
    {
      "name": "AI分析关联",
      "children": [
        {"name": "智能分析语义关联"},
        {"name": "自动建立知识点连接"},
        {
          "name": "支持6种关联类型",
          "children": [
            {"name": "相关/导致"},
            {"name": "对比/相似"},
            {"name": "部分/蕴含"}
          ]
        }
      ]
    },
    {
      "name": "布局设计原则",
      "children": [
        {"name": "放射状布局算法"},
        {"name": "层级深度≤4层"},
        {"name": "节点间距≥50像素"},
        {"name": "一级分支3-5条"}
      ]
    },
    {
      "name": "用户体验优化",
      "children": [
        {"name": "快速操作卡片"},
        {"name": "最近使用文档"},
        {"name": "上传进度显示"},
        {"name": "空状态引导"}
      ]
    },
    {
      "name": "功能特性",
      "children": [
        {"name": "节点连接柄"},
        {"name": "拖拽创建连接"},
        {"name": "关系标签显示"},
        {"name": "连接线箭头"}
      ]
    }
  ]
};

const BRANCH_COLORS = [
  '#ff6b6b',
  '#feca57',
  '#48dbfb',
  '#1dd1a1',
  '#ff9ff3',
];

interface MindMapRendererProps {
  data?: MindMapNode;
}

export const MindMapRenderer: React.FC<MindMapRendererProps> = ({ data = mindMapData }) => {
  const { nodes, edges } = useMemo(() => {
    const nodesList: Node[] = [];
    const edgesList: Edge[] = [];
    
    const ROOT_X = 500;
    const ROOT_Y = 300;
    const RADIUS_LEVEL1 = 200;
    const RADIUS_INCREMENT = 150;
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
        type: 'default',
        position: { x, y },
        data: {
          label: item.name,
          style: {
            background: isRoot ? 'linear-gradient(135deg, #3b82f6, #2563eb)' : '#4b5563',
            color: '#ffffff',
            borderColor: isRoot ? '#60a5fa' : '#6b7280',
            borderWidth: 2,
            padding: [12, 20],
            borderRadius: 8,
            fontSize: isRoot ? 16 : 12,
            fontWeight: isRoot ? 'bold' : 'normal',
          },
        },
      });

      if (parentId) {
        edgesList.push({
          id: `edge-${parentId}-${nodeId}`,
          source: parentId,
          target: nodeId,
          type: 'smoothstep',
          style: {
            stroke: color,
            strokeWidth: level === 1 ? 3 : 2,
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
    <div className="w-full h-[600px] bg-[#1f2937] rounded-xl overflow-hidden">
      <ReactFlow
        nodes={nodesState}
        edges={edgesState}
        onNodesChange={onNodesChange}
        onEdgesChange={onEdgesChange}
        fitView
        fitViewOptions={{ padding: 0.3 }}
        minZoom={0.1}
        maxZoom={2}
        proOptions={{ hideAttribution: true }}
        className="bg-[#1f2937]"
      >
        <Background color="#374151" gap={20} size={1} />
        <Controls
          showInteractive={false}
          className="!bg-[#374151] !border-[#4b5563] !rounded-lg"
        />
      </ReactFlow>
    </div>
  );
};

export default MindMapRenderer;
