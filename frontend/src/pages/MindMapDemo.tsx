import React from 'react';
import { MindMapRenderer } from '../components/MindMapRenderer';

const MindMapDemo: React.FC = () => {
  return (
    <div className="min-h-screen bg-[#1f2937] p-8">
      <div className="max-w-6xl mx-auto">
        <div className="text-center mb-8">
          <h1 className="text-3xl font-bold text-white mb-2">知识库思维导图</h1>
          <p className="text-gray-400">基于JSON数据渲染的思维导图演示</p>
        </div>
        
        <MindMapRenderer />
        
        <div className="mt-8 bg-[#374151] rounded-xl p-6">
          <h2 className="text-xl font-bold text-white mb-4">思维导图数据结构</h2>
          <pre className="text-sm text-gray-300 overflow-x-auto">
{JSON.stringify(mindMapData, null, 2)}
          </pre>
        </div>
      </div>
    </div>
  );
};

const mindMapData = {
  "name": "知识库思维导图",
  "children": [
    {
      "name": "思维导图功能",
      "children": [
        {"name": "深色主题设计", "children": [{"name": "蓝色根节点"}, {"name": "灰色子节点"}, {"name": "彩色分支连线"}]},
        {"name": "节点编辑操作", "children": [{"name": "添加子节点"}, {"name": "编辑节点标签"}, {"name": "删除节点"}]},
        {"name": "导出功能", "children": [{"name": "PNG格式导出"}, {"name": "PDF格式导出"}]}
      ]
    },
    {"name": "AI分析关联", "children": [{"name": "智能分析语义关联"}, {"name": "自动建立知识点连接"}, {"name": "支持6种关联类型", "children": [{"name": "相关/导致"}, {"name": "对比/相似"}, {"name": "部分/蕴含"}]}]},
    {"name": "布局设计原则", "children": [{"name": "放射状布局算法"}, {"name": "层级深度≤4层"}, {"name": "节点间距≥50像素"}, {"name": "一级分支3-5条"}]},
    {"name": "用户体验优化", "children": [{"name": "快速操作卡片"}, {"name": "最近使用文档"}, {"name": "上传进度显示"}, {"name": "空状态引导"}]},
    {"name": "功能特性", "children": [{"name": "节点连接柄"}, {"name": "拖拽创建连接"}, {"name": "关系标签显示"}, {"name": "连接线箭头"}]}
  ]
};

export default MindMapDemo;
