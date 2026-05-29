# 皮卡丘桌宠 - 全自动部署完成

## 新建的文件/目录

```
frontend/src/components/pika-pet/
├── config.ts              # 桌宠配置 (动画帧数、FPS、超时设置)
├── usePetBehavior.ts      # 用户行为监视 Hook
├── PetSpriteCanvas.tsx    # Canvas 精灵动画渲染组件
├── index.tsx              # 桌宠主组件 (DesktopPetV2)
└── README.md              # 本文件
```

## 修改的文件

- `frontend/src/App.tsx`: 第 4 行 `import` 改为 `DesktopPetV2`，第 74 行组件改为 `<DesktopPetV2 />`

## 如何测试

| 操作 | 预期效果 |
|------|----------|
| 正常浏览页面 | idle 动画 (6帧循环) |
| 鼠标移动/键盘/滚动 | 重置30秒计时，保持 idle |
| 10秒内快速操作>5次 | 进入 idle-busy 忙碌模式 (加速) |
| 30秒无操作 | 进入 sleep 浅睡动画 |
| 切换到其他标签页/失焦 | 进入 sleep-deep 深睡 (速度减半) |
| 切回标签页 | 立刻恢复 idle |
| 单击桌宠 | 弹出对话气泡 |
| 双击桌宠 | 触发 skill 技能动画 |
| 拖动桌宠 | 拖拽时暂停动画，松开恢复 |
| 右上角 ✕ 按钮 | 隐藏桌宠 (localStorage 记忆位置) |

## 控制台检查

打开浏览器 DevTools (F12) → Console，应**无任何报错**。

## 注意事项

- 不影响网站原有代码/样式/功能
- 桌宠完全隔离在 `pika-pet/` 目录中
- 位置通过 `localStorage` 持久化记忆
- z-index: 9999 确保最高层级
