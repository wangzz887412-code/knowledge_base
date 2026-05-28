import React from 'react';
import { MindMapRenderer } from '../components/MindMapRenderer';

const MindMapDemo: React.FC = () => {
  return (
    <div className="min-h-screen bg-[#faf8f5] p-8" style={{ fontFamily: "'Inter', 'Segoe UI', system-ui, sans-serif" }}>
      <div className="max-w-6xl mx-auto">
        <div className="text-center mb-8">
          <h1 className="text-3xl font-bold text-[#3d3648] mb-2">知识库思维导图</h1>
          <p className="text-[#7a6e8a]">Obsidian 风格 · 柔和配色 · 贝塞尔曲线连线</p>
        </div>

        <MindMapRenderer />

        <div className="mt-8 bg-white border border-[#e0d8ec] rounded-2xl p-6 shadow-sm">
          <h2 className="text-xl font-bold text-[#3d3648] mb-4">设计理念</h2>
          <div className="grid grid-cols-3 gap-4">
            <div className="p-4 rounded-xl" style={{ background: '#f0e6f6' }}>
              <div className="text-[#5c3d6e] font-semibold mb-2">柔和配色</div>
              <div className="text-[#7a5c8a] text-sm">低饱和度色彩体系，长时间阅读不疲劳，各分支独立着色便于区分</div>
            </div>
            <div className="p-4 rounded-xl" style={{ background: '#e6f3f0' }}>
              <div className="text-[#3d5c4f] font-semibold mb-2">贝塞尔曲线</div>
              <div className="text-[#5a7a6a] text-sm">自然的贝塞尔曲线连线替代僵硬的阶梯线，视觉流畅度大幅提升</div>
            </div>
            <div className="p-4 rounded-xl" style={{ background: '#e8f0fe' }}>
              <div className="text-[#3d5270] font-semibold mb-2">层次分明</div>
              <div className="text-[#5a7090] text-sm">通过字号、字重、颜色深浅区分层级，核心节点突出，一目了然</div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default MindMapDemo;