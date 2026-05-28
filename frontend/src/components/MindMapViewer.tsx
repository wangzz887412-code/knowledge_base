import React, { useCallback, useMemo, useRef, useState } from "react";
import { motion } from "framer-motion";
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
  BezierEdge,
} from "@xyflow/react";
import type { NodeProps, EdgeProps } from "@xyflow/react";
import "@xyflow/react/dist/style.css";
import { toPng } from "html-to-image";
import { jsPDF } from "jspdf";
import { apiPost } from "../utils/api";

interface MindMapNodeData {
  label: string;
  isRoot?: boolean;
  description?: string;
  depth?: number;
  branchColor?: string;
  childCount?: number;
}

interface RelationData {
  id: string;
  source: string;
  target: string;
  type: string;
  description: string;
}

const RELATION_COLORS: Record<string, string> = {
  related_to: "#7c8a9a",
  causes: "#d96c6c",
  contrasts_with: "#c9a44b",
  similar_to: "#5aad8e",
  part_of: "#5b8cc9",
  implies: "#8b6fc0",
};

const RELATION_LABELS: Record<string, string> = {
  related_to: "相关",
  causes: "导致",
  contrasts_with: "对比",
  similar_to: "相似",
  part_of: "部分",
  implies: "蕴含",
};

const BRANCH_COLORS = [
  { bg: "#f0e6f6", border: "#c4a2d4", text: "#5c3d6e", accent: "#9b6fb0" },
  { bg: "#e6f3f0", border: "#a2c4b8", text: "#3d5c4f", accent: "#6fa89a" },
  { bg: "#fef3e4", border: "#dcc49e", text: "#6b5230", accent: "#c4984b" },
  { bg: "#e8f0fe", border: "#a8c4e2", text: "#3d5270", accent: "#6b8fc4" },
  { bg: "#fce8ea", border: "#e2a8ac", text: "#6b3d40", accent: "#c46b70" },
  { bg: "#eef2e6", border: "#c4cca2", text: "#4f5835", accent: "#9aaa67" },
  { bg: "#f2e8f5", border: "#cfa8d8", text: "#5d3d68", accent: "#a86fc0" },
  { bg: "#fff0e8", border: "#e2c4a8", text: "#6b4d32", accent: "#c4885b" },
];

const ROOT_COLOR = {
  bg: "#4a3f6b",
  border: "#6c5fa7",
  text: "#ffffff",
  accent: "#7c6fb8",
  glow: "rgba(108, 95, 167, 0.4)",
};

interface MindMapNodeProps extends NodeProps {
  maxWidth?: number;
}

const MindMapNode: React.FC<MindMapNodeProps> = ({
  data,
  selected,
  maxWidth = 300,
}) => {
  const nodeData = data as unknown as MindMapNodeData;
  const isRoot = nodeData.isRoot;
  const depth = nodeData.depth || 0;
  const labelLength = nodeData.label?.length || 0;

  const nodeWidth = isRoot
    ? Math.min(maxWidth, Math.max(220, labelLength * 9 + 40))
    : Math.min(maxWidth, Math.max(160, labelLength * 8));

  const branchColor = nodeData.branchColor || "#c4a2d4";

  const bgColor = isRoot ? ROOT_COLOR.bg : selected ? "#e8e0ef" : "#faf8fc";
  const borderColor = isRoot
    ? ROOT_COLOR.border
    : selected
      ? "#8b6fc0"
      : branchColor;
  const textColor = isRoot ? ROOT_COLOR.text : "#3d3648";

  return (
    <div
      className="mindmap-node"
      style={{
        position: "relative",
        padding: isRoot ? "16px 24px" : depth === 1 ? "12px 20px" : "10px 16px",
        borderRadius: isRoot ? "16px" : "12px",
        background: bgColor,
        border: isRoot
          ? `2px solid ${borderColor}`
          : `1.5px solid ${borderColor}`,
        color: textColor,
        width: nodeWidth,
        cursor: "pointer",
        transition: "all 0.25s cubic-bezier(0.4, 0, 0.2, 1)",
        boxShadow: isRoot
          ? `0 4px 24px ${ROOT_COLOR.glow}, 0 2px 8px rgba(74, 63, 107, 0.3)`
          : selected
            ? "0 2px 16px rgba(139, 111, 192, 0.25), 0 1px 4px rgba(0,0,0,0.06)"
            : "0 1px 4px rgba(0,0,0,0.04), 0 1px 2px rgba(0,0,0,0.02)",
        fontFamily: "'Inter', 'Segoe UI', system-ui, sans-serif",
      }}
    >
      <div
        className="mindmap-accent-bar"
        style={{
          position: "absolute",
          left: 0,
          top: isRoot ? 8 : 6,
          bottom: isRoot ? 8 : 6,
          width: 4,
          borderRadius: "0 2px 2px 0",
          background: isRoot ? ROOT_COLOR.accent : branchColor,
        }}
      />
      <Handle
        type="source"
        position={Position.Right}
        style={{
          background: isRoot ? ROOT_COLOR.accent : branchColor,
          border: "2px solid #fff",
          width: 10,
          height: 10,
        }}
      />
      <Handle
        type="target"
        position={Position.Left}
        style={{
          background: "#a39bb5",
          border: "2px solid #fff",
          width: 10,
          height: 10,
        }}
      />
      <div
        style={{
          fontSize: isRoot ? "18px" : depth === 1 ? "15px" : "13px",
          fontWeight: isRoot ? 700 : depth === 1 ? 600 : 500,
          lineHeight: 1.5,
          letterSpacing: isRoot ? "0.02em" : "0.01em",
          wordBreak: "break-word",
        }}
      >
        {nodeData.label}
      </div>
      {nodeData.description && (
        <div
          style={{
            fontSize: "11px",
            color: isRoot ? "rgba(255,255,255,0.7)" : "#8a7f9a",
            marginTop: 6,
            lineHeight: 1.4,
            wordBreak: "break-word",
          }}
        >
          {nodeData.description}
        </div>
      )}
      {isRoot && (
        <div
          className="mindmap-root-dot"
          style={{
            position: "absolute",
            top: -6,
            right: -6,
            width: 12,
            height: 12,
            borderRadius: "50%",
            background: ROOT_COLOR.accent,
            boxShadow: `0 0 8px ${ROOT_COLOR.glow}`,
          }}
        />
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
  data,
}) => {
  const relationData = data as unknown as RelationData;
  const color = RELATION_COLORS[relationData?.type] || "#7c8a9a";
  const label =
    relationData?.description || RELATION_LABELS[relationData?.type] || "";

  const midX = (sourceX + targetX) / 2;
  const midY = (sourceY + targetY) / 2 + 20;

  const path = `M ${sourceX} ${sourceY} C ${midX} ${sourceY}, ${midX} ${targetY}, ${targetX} ${targetY}`;

  return (
    <>
      <path
        id={id}
        d={path}
        fill="none"
        stroke={color}
        strokeWidth={1.5}
        strokeDasharray="6,4"
        strokeOpacity={0.6}
        markerEnd="url(#arrowhead)"
      />
      {label && (
        <g transform={`translate(${midX}, ${midY})`}>
          <rect
            x="-44"
            y="-11"
            width="88"
            height="22"
            rx="11"
            fill="#f5f2f8"
            stroke={color}
            strokeWidth={1}
            strokeOpacity={0.5}
          />
          <text
            textAnchor="middle"
            dominantBaseline="middle"
            fill="#5c5470"
            fontSize="11"
            fontWeight={500}
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

interface MindMapViewerProps {
  data: MindMapData | null;
  fileId?: string;
  onNodeClick?: (nodeId: string, nodeLabel: string) => void;
}

export const MindMapViewer: React.FC<MindMapViewerProps> = ({
  data,
  fileId,
  onNodeClick,
}) => {
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
  const [newNodeLabel, setNewNodeLabel] = useState("");
  const [editNodeLabel, setEditNodeLabel] = useState("");
  const [relationSource, setRelationSource] = useState("");
  const [relationTarget, setRelationTarget] = useState("");
  const [relationType, setRelationType] = useState("related_to");
  const [relationDescription, setRelationDescription] = useState("");
  const [progress, setProgress] = useState<{
    message: string;
    percentage: number;
  } | null>(null);

  const [layoutConfig, setLayoutConfig] = useState({
    levelSpacing: 280,
    nodeGap: 70,
    maxNodeWidth: 320,
  });

  const MAX_DEPTH = 5;
  const NODE_HEIGHT = 56;
  const ROOT_X = 120;
  const ROOT_PADDING_TOP = 120;

  const estimateNodeWidth = useCallback(
    (label: string, isRoot: boolean, depth: number): number => {
      const charWidth = isRoot ? 9 : 8;
      const padding = isRoot ? 64 : 48;
      return Math.min(
        layoutConfig.maxNodeWidth,
        Math.max(isRoot ? 220 : 140, label.length * charWidth + padding),
      );
    },
    [layoutConfig.maxNodeWidth],
  );

  const calculateSubtreeHeight = useCallback(
    (item: MindMapData, itemDepth: number = 0): number => {
      if (!item.children || item.children.length === 0) {
        return NODE_HEIGHT + layoutConfig.nodeGap;
      }
      const childrenHeight = item.children
        .slice(0, 8)
        .reduce(
          (acc, child) => acc + calculateSubtreeHeight(child, itemDepth + 1),
          0,
        );
      return Math.max(NODE_HEIGHT + layoutConfig.nodeGap, childrenHeight);
    },
    [layoutConfig.nodeGap],
  );

  const convertToNodesAndEdges = useCallback(
    (mindMapData: MindMapData | null): { nodes: Node[]; edges: Edge[] } => {
      if (!mindMapData) return { nodes: [], edges: [] };

      const nodesList: Node[] = [];
      const edgesList: Edge[] = [];
      const { levelSpacing, nodeGap } = layoutConfig;

      const addNode = (
        item: MindMapData,
        parentId: string | null,
        depth: number,
        branchColor: string,
        yStart: number,
      ): number => {
        if (depth > MAX_DEPTH) return yStart;

        const nodeId = item.id;
        const isRoot = depth === 0;
        const nodeWidth = estimateNodeWidth(item.label, isRoot, depth);

        const subtreeHeight = calculateSubtreeHeight(item, depth);
        const y = yStart + subtreeHeight / 2;

        nodesList.push({
          id: nodeId,
          type: "mindMapNode",
          position: { x: ROOT_X + depth * levelSpacing, y },
          data: {
            label: item.label,
            isRoot,
            depth,
            branchColor,
            childCount: item.children?.length || 0,
          },
        });

        if (parentId && !isRoot) {
          edgesList.push({
            id: `e-${parentId}-${nodeId}`,
            source: parentId,
            target: nodeId,
            type: "default",
            animated: false,
            style: {
              stroke: branchColor,
              strokeWidth: depth === 1 ? 2.5 : 2,
              strokeOpacity: depth === 1 ? 0.8 : 0.6,
            },
          });
        }

        let currentY = yStart;
        if (item.children && item.children.length > 0 && depth < MAX_DEPTH) {
          const validChildren = item.children.slice(0, 8);
          validChildren.forEach((child) => {
            currentY = addNode(child, nodeId, depth + 1, branchColor, currentY);
          });
        } else if (depth < MAX_DEPTH) {
          currentY = yStart + NODE_HEIGHT + nodeGap;
        }

        return currentY;
      };

      const totalHeight = calculateSubtreeHeight(mindMapData);
      const rootBranchColor = BRANCH_COLORS[0].accent;

      if (mindMapData.children && mindMapData.children.length > 0) {
        const validChildren = mindMapData.children.slice(0, 8);
        let yStart = ROOT_PADDING_TOP;

        const rootNodeId = mindMapData.id;
        nodesList.push({
          id: rootNodeId,
          type: "mindMapNode",
          position: {
            x: ROOT_X,
            y: RootCenterYForChildren(validChildren, yStart),
          },
          data: {
            label: mindMapData.label,
            isRoot: true,
            depth: 0,
            branchColor: rootBranchColor,
            childCount: validChildren.length,
          },
        });

        validChildren.forEach((child, idx) => {
          const color = BRANCH_COLORS[idx % BRANCH_COLORS.length];
          yStart = addNode(child, rootNodeId, 1, color.accent, yStart);
        });
      } else {
        nodesList.push({
          id: mindMapData.id,
          type: "mindMapNode",
          position: { x: ROOT_X, y: ROOT_PADDING_TOP + 100 },
          data: {
            label: mindMapData.label,
            isRoot: true,
            depth: 0,
            branchColor: rootBranchColor,
            childCount: 0,
          },
        });
      }

      if (mindMapData.relations) {
        mindMapData.relations.forEach((relation, index) => {
          edgesList.push({
            id: `rel-${index}`,
            source: relation.source,
            target: relation.target,
            type: "relation",
            style: {
              stroke: RELATION_COLORS[relation.type] || "#7c8a9a",
              strokeWidth: 1.5,
              strokeDasharray: "6,4",
              strokeOpacity: 0.6,
            },
            data: relation,
          });
        });
      }

      return { nodes: nodesList, edges: edgesList };
    },
    [layoutConfig, calculateSubtreeHeight, estimateNodeWidth],
  );

  const RootCenterYForChildren = (
    children: MindMapData[],
    yStart: number,
  ): number => {
    let total = 0;
    children.slice(0, 8).forEach((child) => {
      total += calculateSubtreeHeight(child);
    });
    return yStart + total / 2;
  };

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
    setProgress({ message: "正在分析节点关系...", percentage: 20 });

    try {
      const response = await apiPost("/api/ai/mindmap/analyze-relations/", {
        file_id: fileId,
      });

      setProgress({ message: "AI正在分析语义关联...", percentage: 50 });

      const result = await response.json();

      setProgress({ message: "正在生成连接...", percentage: 80 });

      if (result.success) {
        setRelations(result.relations);
        const relationEdges: Edge[] = result.relations.map(
          (rel: RelationData, index: number) => ({
            id: `rel-${index}`,
            source: rel.source,
            target: rel.target,
            type: "relation",
            style: {
              stroke: RELATION_COLORS[rel.type] || "#7c8a9a",
              strokeWidth: 1.5,
              strokeDasharray: "6,4",
              strokeOpacity: 0.6,
            },
            data: rel,
          }),
        );

        setEdges((prev) => [
          ...prev.filter((e) => !e.id?.startsWith("rel-")),
          ...relationEdges,
        ]);

        setProgress({ message: "分析完成！", percentage: 100 });
        setTimeout(() => setProgress(null), 2000);
      }
    } catch (error) {
      console.error("分析关联失败:", error);
      setProgress(null);
    } finally {
      setIsAnalyzing(false);
    }
  }, [fileId]);

  const handleAddNode = async () => {
    if (!newNodeLabel.trim() || !selectedNode || !fileId) return;

    try {
      const response = await apiPost("/api/ai/mindmap/edit/", {
        file_id: fileId,
        updates: {
          add_node: {
            id: `node_${Date.now()}`,
            label: newNodeLabel,
            parent_id: selectedNode,
          },
        },
      });

      const result = await response.json();
      if (result.success) {
        window.location.reload();
      }
    } catch (error) {
      console.error("添加节点失败:", error);
    }

    setShowAddNodeModal(false);
    setNewNodeLabel("");
  };

  const handleEditNode = async () => {
    if (!editNodeLabel.trim() || !selectedNode || !fileId) return;

    try {
      const response = await apiPost("/api/ai/mindmap/edit/", {
        file_id: fileId,
        updates: {
          update_node: {
            id: selectedNode,
            label: editNodeLabel,
          },
        },
      });

      const result = await response.json();
      if (result.success) {
        window.location.reload();
      }
    } catch (error) {
      console.error("编辑节点失败:", error);
    }

    setShowEditModal(false);
    setEditNodeLabel("");
  };

  const handleDeleteNode = async () => {
    if (!selectedNode || !fileId) return;

    if (!window.confirm("确定要删除这个节点吗？")) return;

    try {
      const response = await apiPost("/api/ai/mindmap/edit/", {
        file_id: fileId,
        updates: {
          delete_node: selectedNode,
        },
      });

      const result = await response.json();
      if (result.success) {
        setNodes((prev) => prev.filter((n) => n.id !== selectedNode));
        setEdges((prev) =>
          prev.filter(
            (e) => e.source !== selectedNode && e.target !== selectedNode,
          ),
        );
      }
    } catch (error) {
      console.error("删除节点失败:", error);
    }

    setSelectedNode(null);
  };

  const handleAddRelation = async () => {
    if (!relationSource || !relationTarget || !fileId) return;

    try {
      const response = await apiPost("/api/ai/mindmap/edit/", {
        file_id: fileId,
        updates: {
          add_relation: {
            source: relationSource,
            target: relationTarget,
            type: relationType,
            description: relationDescription || RELATION_LABELS[relationType],
          },
        },
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

        setEdges((prev) => [
          ...prev,
          {
            id: newRelation.id,
            source: newRelation.source,
            target: newRelation.target,
            type: "relation",
            style: {
              stroke: RELATION_COLORS[newRelation.type] || "#7c8a9a",
              strokeWidth: 1.5,
              strokeDasharray: "6,4",
              strokeOpacity: 0.6,
            },
            data: newRelation,
          },
        ]);
      }
    } catch (error) {
      console.error("添加关联失败:", error);
    }

    setShowAddRelationModal(false);
    setRelationSource("");
    setRelationTarget("");
    setRelationType("related_to");
    setRelationDescription("");
  };

  const handleDeleteRelation = async () => {
    if (!selectedEdge || !fileId) return;

    if (!window.confirm("确定要删除这个关联吗？")) return;

    try {
      const response = await apiPost("/api/ai/mindmap/edit/", {
        file_id: fileId,
        updates: {
          delete_relation: selectedEdge,
        },
      });

      const result = await response.json();
      if (result.success) {
        setEdges((prev) => prev.filter((e) => e.id !== selectedEdge));
      }
    } catch (error) {
      console.error("删除关联失败:", error);
    }

    setSelectedEdge(null);
  };

  const handleConnect = useCallback(
    (connection: Connection) => {
      const newRelation: RelationData = {
        id: `rel_${Date.now()}`,
        source: connection.source,
        target: connection.target,
        type: "related_to",
        description: "相关",
      };

      setEdges((prev) =>
        addEdge(
          {
            ...connection,
            type: "relation",
            style: {
              stroke: "#7c8a9a",
              strokeWidth: 1.5,
              strokeDasharray: "6,4",
              strokeOpacity: 0.6,
            },
            data: newRelation,
          },
          prev,
        ),
      );
    },
    [setEdges],
  );

  const exportToPNG = useCallback(async () => {
    if (!reactFlowWrapper.current) return;

    const element = reactFlowWrapper.current.querySelector(".react-flow");
    if (!element) return;

    try {
      const dataUrl = await toPng(element as HTMLElement, {
        backgroundColor: "#faf8f5",
        pixelRatio: 2,
      });

      const link = document.createElement("a");
      link.download = "mindmap.png";
      link.href = dataUrl;
      link.click();
    } catch (error) {
      console.error("导出PNG失败:", error);
    }
  }, []);

  const exportToPDF = useCallback(async () => {
    if (!reactFlowWrapper.current) return;

    const element = reactFlowWrapper.current.querySelector(".react-flow");
    if (!element) return;

    try {
      const dataUrl = await toPng(element as HTMLElement, {
        backgroundColor: "#faf8f5",
        pixelRatio: 2,
      });

      const pdf = new jsPDF("landscape", "mm", "a4");
      const imgWidth = 297;
      const imgHeight =
        (element as HTMLElement).offsetHeight *
        (297 / (element as HTMLElement).offsetWidth);

      pdf.addImage(dataUrl, "PNG", 0, 0, imgWidth, Math.min(imgHeight, 210));
      pdf.save("mindmap.pdf");
    } catch (error) {
      console.error("导出PDF失败:", error);
    }
  }, []);

  const handleNodeClick = useCallback(
    (_event: React.MouseEvent, node: Node) => {
      setSelectedNode(node.id);
      setSelectedEdge(null);
      if (onNodeClick) {
        onNodeClick(node.id, String(node.data?.label));
      }
    },
    [onNodeClick],
  );

  const onEdgeClick = useCallback((event: React.MouseEvent, edge: Edge) => {
    event.stopPropagation();
    setSelectedEdge(edge.id);
    setSelectedNode(null);
  }, []);

  const [isRegenerating, setIsRegenerating] = useState(false);
  const [regenerateMsg, setRegenerateMsg] = useState("");
  const [searchQuery, setSearchQuery] = useState("");

  const nodeCount = useMemo(() => {
    const countByDepth = (d: MindMapData): number => {
      let c = 1;
      d.children?.forEach((ch) => {
        c += countByDepth(ch as MindMapData);
      });
      return c;
    };
    return data ? countByDepth(data) : 0;
  }, [data]);

  const handleRegenerate = useCallback(async () => {
    if (!fileId) return;
    setIsRegenerating(true);
    setRegenerateMsg("正在调用 AI 生成思维导图...");
    setProgress({ message: "AI 正在分析文档内容...", percentage: 30 });

    try {
      const response = await apiPost("/api/ai/mindmap/regenerate/", {
        file_id: fileId,
      });

      setProgress({ message: "AI 正在构建知识框架...", percentage: 70 });

      const result = await response.json();

      if (result.success) {
        setRegenerateMsg(result.message || "思维导图生成成功！");
        setProgress({ message: "生成完成！", percentage: 100 });
        setTimeout(() => {
          setProgress(null);
          setRegenerateMsg("");
          window.location.reload();
        }, 1500);
      } else {
        setRegenerateMsg(result.error || "生成失败");
        setProgress(null);
        setTimeout(() => setRegenerateMsg(""), 4000);
      }
    } catch (error) {
      console.error("重新生成思维导图失败:", error);
      setRegenerateMsg("网络错误，请重试");
      setProgress(null);
      setTimeout(() => setRegenerateMsg(""), 4000);
    } finally {
      setIsRegenerating(false);
    }
  }, [fileId]);

  const filteredNodeIds = useMemo(() => {
    if (!searchQuery.trim()) return null;
    const q = searchQuery.toLowerCase();
    return nodes
      .filter((n) => {
        const label = String(n.data?.label || "").toLowerCase();
        return label.includes(q);
      })
      .map((n) => n.id);
  }, [searchQuery, nodes]);

  if (!data) {
    return (
      <div className="flex items-center justify-center h-full bg-[#faf8f5]">
        <div className="text-center">
          <div className="text-6xl mb-5 opacity-40">🧠</div>
          <p className="text-[#7a6e8a] text-lg font-medium">暂无思维导图数据</p>
          <p className="text-[#a39bb5] text-sm mt-2">
            上传文档后 AI 将自动生成思维导图
          </p>
          {fileId && (
            <button
              onClick={handleRegenerate}
              disabled={isRegenerating}
              className="mt-4 px-6 py-2.5 rounded-xl text-sm font-semibold text-white transition-all shadow-md disabled:opacity-50"
              style={{
                background: "linear-gradient(135deg, #6c5fa7, #5b8cc9)",
              }}
            >
              {isRegenerating ? "🔄 AI 生成中..." : "✨ AI 生成思维导图"}
            </button>
          )}
          {regenerateMsg && (
            <p className="text-[#6c5fa7] text-sm mt-3 font-medium">
              {regenerateMsg}
            </p>
          )}
        </div>
      </div>
    );
  }

  return (
    <div
      className="relative w-full h-full"
      style={{ fontFamily: "'Inter', 'Segoe UI', system-ui, sans-serif" }}
    >
      <div ref={reactFlowWrapper} className="w-full h-full">
        <ReactFlow
          nodes={nodes}
          edges={edges}
          onNodesChange={onNodesChange}
          onEdgesChange={onEdgesChange}
          onConnect={handleConnect}
          onNodeClick={handleNodeClick}
          onEdgeClick={onEdgeClick}
          nodeTypes={{
            mindMapNode: (props: NodeProps) => (
              <MindMapNode {...props} maxWidth={layoutConfig.maxNodeWidth} />
            ),
          }}
          edgeTypes={{
            ...edgeTypes,
            default: BezierEdge as any,
          }}
          fitView
          fitViewOptions={{ padding: 0.3, minZoom: 0.2, maxZoom: 1.5 }}
          minZoom={0.15}
          maxZoom={2}
          proOptions={{ hideAttribution: true }}
          connectable={true}
          defaultEdgeOptions={{
            type: "default",
          }}
        >
          <Background
            color="#e8e3ed"
            gap={24}
            size={1}
            style={{ backgroundColor: "#faf8f5" }}
          />
          <Controls
            showInteractive={false}
            className="!bg-white !border-[#e0d8ec] !rounded-xl !shadow-md !overflow-hidden [&>button]:!bg-white [&>button]:!border-[#e0d8ec] [&>button]:!text-[#5c5470] [&>button:hover]:!bg-[#f5f2f8] [&>button>svg]:!fill-[#5c5470]"
          />
          <MiniMap
            nodeColor={(n) => {
              const d = n.data as unknown as MindMapNodeData;
              if (d?.isRoot) return "#4a3f6b";
              return d?.branchColor || "#c4a2d4";
            }}
            maskColor="rgba(250, 248, 245, 0.85)"
            className="!bg-white !border-[#e0d8ec] !rounded-lg !shadow-md"
          />
          <svg className="react-flow__edge-marker">
            <defs>
              <marker
                id="arrowhead"
                markerWidth="8"
                markerHeight="6"
                refX="7"
                refY="3"
                orient="auto"
              >
                <polygon points="0 0, 8 3, 0 6" fill="#7c8a9a" opacity={0.5} />
              </marker>
            </defs>
          </svg>
        </ReactFlow>
      </div>

      {progress && (
        <div className="absolute top-4 left-1/2 -translate-x-1/2 z-20 w-72">
          <div className="bg-white border border-[#e0d8ec] rounded-xl p-4 shadow-xl">
            <div className="flex items-center justify-between mb-3">
              <span className="text-sm text-[#5c5470] font-medium">
                {progress.message}
              </span>
              <span className="text-sm text-[#a39bb5] font-semibold">
                {progress.percentage}%
              </span>
            </div>
            <div className="w-full h-2 bg-[#f0ecf5] rounded-full overflow-hidden">
              <motion.div
                className="h-full rounded-full"
                style={{
                  background: "linear-gradient(90deg, #9b6fb0, #6b8fc4)",
                }}
                initial={{ width: 0 }}
                animate={{ width: `${progress.percentage}%` }}
                transition={{ duration: 0.4 }}
              />
            </div>
          </div>
        </div>
      )}

      {/* 统一顶部工具栏 */}
      <div
        className="absolute top-0 left-0 right-0 z-10 flex items-center justify-between px-4 py-3 gap-3"
        style={{
          fontFamily: "inherit",
          background:
            "linear-gradient(180deg, rgba(250,248,245,0.97) 0%, rgba(250,248,245,0.88) 75%, rgba(250,248,245,0) 100%)",
        }}
      >
        <div className="flex items-center gap-2.5">
          <div className="bg-white/90 backdrop-blur border border-[#e0d8ec] rounded-xl px-3 py-1.5 shadow-sm flex items-center gap-1.5">
            <span className="text-[11px] text-[#a39bb5] font-medium">节点</span>
            <span className="text-sm text-[#3d3648] font-bold">
              {nodeCount}
            </span>
          </div>
          <div className="relative">
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="搜索..."
              className="w-32 px-3 py-1.5 bg-white/90 backdrop-blur border border-[#e0d8ec] rounded-xl text-[13px] text-[#3d3648] placeholder-[#a39bb5] focus:outline-none focus:border-[#8b6fc0] focus:ring-2 focus:ring-[#e8e0ef] shadow-sm transition-all"
            />
            {searchQuery && filteredNodeIds && (
              <div className="absolute top-full mt-1 z-20">
                <span className="bg-white border border-[#e0d8ec] rounded-lg shadow-lg px-3 py-1 text-[11px] text-[#a39bb5] whitespace-nowrap">
                  匹配{" "}
                  <span className="text-[#6c5fa7] font-semibold">
                    {filteredNodeIds.length}
                  </span>{" "}
                  个
                </span>
              </div>
            )}
          </div>
        </div>
        <div className="flex gap-1.5 flex-wrap justify-end">
          {fileId && (
            <button
              onClick={handleRegenerate}
              disabled={isRegenerating}
              className="px-3 py-1.5 rounded-xl text-[12px] font-medium transition-all shadow-sm disabled:opacity-50 disabled:cursor-not-allowed text-white"
              style={{
                background: "linear-gradient(135deg, #6c5fa7, #5b8cc9)",
                border: "none",
              }}
              title="使用AI重新生成思维导图"
            >
              {isRegenerating ? "🔄 生成中" : "✨ AI重新生成"}
            </button>
          )}
          <button
            onClick={analyzeRelations}
            disabled={isAnalyzing}
            className="px-3 py-1.5 rounded-xl text-[12px] font-medium transition-all shadow-sm disabled:opacity-50 disabled:cursor-not-allowed text-white"
            style={{
              background: "linear-gradient(135deg, #6c5fa7, #5b8cc9)",
              border: "none",
            }}
            title="AI分析知识点关联"
          >
            {isAnalyzing ? "🔄 中" : "🧠 分析关联"}
          </button>
          <button
            onClick={() => setShowAddRelationModal(true)}
            className="px-3 py-1.5 bg-white/90 backdrop-blur border border-[#e0d8ec] rounded-xl text-[12px] text-[#5c5470] font-medium hover:bg-[#f5f2f8] transition-colors shadow-sm"
          >
            ➕ 关联
          </button>
          <button
            onClick={exportToPNG}
            className="px-3 py-1.5 bg-white/90 backdrop-blur border border-[#e0d8ec] rounded-xl text-[12px] text-[#5c5470] font-medium hover:bg-[#f5f2f8] transition-colors shadow-sm"
          >
            📷 PNG
          </button>
          <button
            onClick={exportToPDF}
            className="px-3 py-1.5 bg-white/90 backdrop-blur border border-[#e0d8ec] rounded-xl text-[12px] text-[#5c5470] font-medium hover:bg-[#f5f2f8] transition-colors shadow-sm"
          >
            📄 PDF
          </button>
        </div>
      </div>

      {regenerateMsg && !progress && (
        <motion.div
          initial={{ opacity: 0, y: -5 }}
          animate={{ opacity: 1, y: 0 }}
          className="absolute top-14 left-1/2 -translate-x-1/2 z-20"
          style={{ fontFamily: "inherit" }}
        >
          <div className="bg-[#6c5fa7] text-white rounded-xl px-4 py-2 shadow-lg">
            <span className="text-sm font-medium">{regenerateMsg}</span>
          </div>
        </motion.div>
      )}

      {selectedNode && (
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          className="absolute bottom-5 left-5 z-10"
          style={{ fontFamily: "inherit" }}
        >
          <div className="bg-white border border-[#e0d8ec] rounded-xl p-4 shadow-xl">
            <p className="text-[#3d3648] text-sm font-semibold mb-3">
              已选中:{" "}
              <span className="text-[#6c5fa7]">
                {nodes.find((n) => n.id === selectedNode)?.data?.label}
              </span>
            </p>
            <div className="flex gap-2">
              <button
                onClick={() => {
                  setEditNodeLabel(
                    nodes.find((n) => n.id === selectedNode)?.data?.label || "",
                  );
                  setShowEditModal(true);
                }}
                className="px-4 py-2 text-sm font-medium rounded-lg transition-colors"
                style={{ background: "#f0ecf5", color: "#6c5fa7" }}
              >
                编辑
              </button>
              <button
                onClick={() => {
                  setNewNodeLabel("");
                  setShowAddNodeModal(true);
                }}
                className="px-4 py-2 text-sm font-medium rounded-lg transition-colors"
                style={{ background: "#e8f0e8", color: "#4a7c59" }}
              >
                添加子节点
              </button>
              <button
                onClick={handleDeleteNode}
                className="px-4 py-2 text-sm font-medium rounded-lg transition-colors"
                style={{ background: "#fce8ea", color: "#c46b70" }}
              >
                删除
              </button>
            </div>
          </div>
        </motion.div>
      )}

      {selectedEdge && (
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          className="absolute bottom-5 left-5 z-10"
          style={{ fontFamily: "inherit" }}
        >
          <div className="bg-white border border-[#e0d8ec] rounded-xl p-4 shadow-xl">
            <p className="text-[#3d3648] text-sm font-medium mb-3">
              已选中关联
            </p>
            <button
              onClick={handleDeleteRelation}
              className="px-4 py-2 text-sm font-medium rounded-lg transition-colors"
              style={{ background: "#fce8ea", color: "#c46b70" }}
            >
              删除关联
            </button>
          </div>
        </motion.div>
      )}

      {showAddNodeModal && (
        <div className="absolute inset-0 bg-black/20 flex items-center justify-center z-50">
          <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            className="bg-white rounded-2xl p-6 w-96 shadow-2xl border border-[#e0d8ec]"
            style={{ fontFamily: "inherit" }}
          >
            <h3 className="text-[#3d3648] font-bold text-lg mb-4">
              添加子节点
            </h3>
            <input
              type="text"
              value={newNodeLabel}
              onChange={(e) => setNewNodeLabel(e.target.value)}
              placeholder="输入节点标签..."
              autoFocus
              onKeyDown={(e) => e.key === "Enter" && handleAddNode()}
              className="w-full px-4 py-3 bg-[#faf8f5] border border-[#e0d8ec] rounded-xl text-[#3d3648] placeholder-[#a39bb5] focus:outline-none focus:border-[#8b6fc0] focus:ring-2 focus:ring-[#e8e0ef] transition-all text-sm"
            />
            <div className="flex gap-3 mt-4">
              <button
                onClick={handleAddNode}
                disabled={!newNodeLabel.trim()}
                className="flex-1 px-4 py-2.5 text-sm font-semibold rounded-xl transition-all disabled:opacity-40 disabled:cursor-not-allowed"
                style={{ background: "#6c5fa7", color: "#fff" }}
              >
                添加
              </button>
              <button
                onClick={() => setShowAddNodeModal(false)}
                className="px-4 py-2.5 text-sm font-medium rounded-xl transition-colors"
                style={{ background: "#f0ecf5", color: "#5c5470" }}
              >
                取消
              </button>
            </div>
          </motion.div>
        </div>
      )}

      {showEditModal && (
        <div className="absolute inset-0 bg-black/20 flex items-center justify-center z-50">
          <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            className="bg-white rounded-2xl p-6 w-96 shadow-2xl border border-[#e0d8ec]"
            style={{ fontFamily: "inherit" }}
          >
            <h3 className="text-[#3d3648] font-bold text-lg mb-4">编辑节点</h3>
            <input
              type="text"
              value={editNodeLabel}
              onChange={(e) => setEditNodeLabel(e.target.value)}
              placeholder="输入节点标签..."
              autoFocus
              onKeyDown={(e) => e.key === "Enter" && handleEditNode()}
              className="w-full px-4 py-3 bg-[#faf8f5] border border-[#e0d8ec] rounded-xl text-[#3d3648] placeholder-[#a39bb5] focus:outline-none focus:border-[#8b6fc0] focus:ring-2 focus:ring-[#e8e0ef] transition-all text-sm"
            />
            <div className="flex gap-3 mt-4">
              <button
                onClick={handleEditNode}
                disabled={!editNodeLabel.trim()}
                className="flex-1 px-4 py-2.5 text-sm font-semibold rounded-xl transition-all disabled:opacity-40 disabled:cursor-not-allowed"
                style={{ background: "#6c5fa7", color: "#fff" }}
              >
                保存
              </button>
              <button
                onClick={() => setShowEditModal(false)}
                className="px-4 py-2.5 text-sm font-medium rounded-xl transition-colors"
                style={{ background: "#f0ecf5", color: "#5c5470" }}
              >
                取消
              </button>
            </div>
          </motion.div>
        </div>
      )}

      {showAddRelationModal && (
        <div className="absolute inset-0 bg-black/20 flex items-center justify-center z-50">
          <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            className="bg-white rounded-2xl p-6 w-96 shadow-2xl border border-[#e0d8ec]"
            style={{ fontFamily: "inherit" }}
          >
            <h3 className="text-[#3d3648] font-bold text-lg mb-4">添加关联</h3>
            <div className="space-y-3">
              <select
                value={relationSource}
                onChange={(e) => setRelationSource(e.target.value)}
                className="w-full px-4 py-3 bg-[#faf8f5] border border-[#e0d8ec] rounded-xl text-[#3d3648] focus:outline-none focus:border-[#8b6fc0] focus:ring-2 focus:ring-[#e8e0ef] transition-all text-sm"
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
                className="w-full px-4 py-3 bg-[#faf8f5] border border-[#e0d8ec] rounded-xl text-[#3d3648] focus:outline-none focus:border-[#8b6fc0] focus:ring-2 focus:ring-[#e8e0ef] transition-all text-sm"
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
                className="w-full px-4 py-3 bg-[#faf8f5] border border-[#e0d8ec] rounded-xl text-[#3d3648] focus:outline-none focus:border-[#8b6fc0] focus:ring-2 focus:ring-[#e8e0ef] transition-all text-sm"
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
                className="w-full px-4 py-3 bg-[#faf8f5] border border-[#e0d8ec] rounded-xl text-[#3d3648] placeholder-[#a39bb5] focus:outline-none focus:border-[#8b6fc0] focus:ring-2 focus:ring-[#e8e0ef] transition-all text-sm"
              />
            </div>
            <div className="flex gap-3 mt-4">
              <button
                onClick={handleAddRelation}
                disabled={!relationSource || !relationTarget}
                className="flex-1 px-4 py-2.5 text-sm font-semibold rounded-xl transition-all disabled:opacity-40 disabled:cursor-not-allowed"
                style={{ background: "#6c5fa7", color: "#fff" }}
              >
                添加
              </button>
              <button
                onClick={() => setShowAddRelationModal(false)}
                className="px-4 py-2.5 text-sm font-medium rounded-xl transition-colors"
                style={{ background: "#f0ecf5", color: "#5c5470" }}
              >
                取消
              </button>
            </div>
          </motion.div>
        </div>
      )}
    </div>
  );
};

export default MindMapViewer;
