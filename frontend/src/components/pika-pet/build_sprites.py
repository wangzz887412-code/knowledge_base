"""
皮卡丘桌宠 - 精灵图生成脚本
使用方法：
1. 把 3 轮图片保存为单个 PNG 帧文件（去掉透明背景棋盘格）
2. 放在 frontend/src/components/pika-pet/frames/ 目录下
3. 运行: python build_sprites.py
"""
import os
import sys
from PIL import Image

SCRIPT_DIR = os.path.dirname(os.path.abspath(__file__))
FRAMES_DIR = os.path.join(SCRIPT_DIR, "frames")
OUTPUT_DIR = os.path.join(SCRIPT_DIR, "..", "..", "..", "public", "pika-pet", "sprites")
os.makedirs(OUTPUT_DIR, exist_ok=True)

def create_spritesheet(frame_files, output_name, frame_size=None):
    if not frame_files:
        print(f"  SKIP: {output_name} - no frames")
        return
    
    valid_frames = [f for f in frame_files if os.path.exists(f)]
    if not valid_frames:
        print(f"  SKIP: {output_name} - no valid frames found")
        return
    
    n = len(valid_frames)
    
    if frame_size is None:
        frame_size = Image.open(valid_frames[0]).size
    
    sheet_w = n * frame_size[0]
    sheet_h = frame_size[1]
    sheet = Image.new("RGBA", (sheet_w, sheet_h), (0, 0, 0, 0))
    
    for i, fpath in enumerate(valid_frames):
        img = Image.open(fpath).convert("RGBA")
        if img.size != frame_size:
            img = img.resize(frame_size, Image.LANCZOS)
        sheet.paste(img, (i * frame_size[0], 0), img)
    
    out_path = os.path.join(OUTPUT_DIR, output_name)
    sheet.save(out_path, "PNG")
    print(f"  Created: {out_path} ({n} frames, {frame_size[0]}x{frame_size[1]})")

def main():
    if not os.path.exists(FRAMES_DIR):
        print(f"Frames directory not found: {FRAMES_DIR}")
        print("Please save your frame images to this directory:")
        print(f"  frames/idle_0.png  frames/idle_1.png  ... (idle frames)")
        print(f"  frames/interact_0.png  frames/interact_1.png  ...")
        print(f"  frames/skill_0.png  frames/skill_1.png  ...")
        print(f"  frames/sleep_0.png  frames/sleep_1.png  ...")
        return

    # Try to auto-detect frames
    def get_frames(prefix):
        frames = []
        i = 0
        while True:
            for ext in ['.png', '.jpg', '.jpeg', '.webp']:
                path = os.path.join(FRAMES_DIR, f"{prefix}_{i}{ext}")
                if os.path.exists(path):
                    frames.append(path)
                    break
            else:
                break
            i += 1
        return frames
    
    print("Detecting frames...")
    idle_frames = get_frames("idle")
    interact_frames = get_frames("interact")
    skill_frames = get_frames("skill")
    sleep_frames = get_frames("sleep")
    
    print(f"  idle: {len(idle_frames)} frames")
    print(f"  interact: {len(interact_frames)} frames")
    print(f"  skill: {len(skill_frames)} frames")
    print(f"  sleep: {len(sleep_frames)} frames")
    
    # Get frame size from first available frame
    frame_size = None
    for frames in [idle_frames, interact_frames, skill_frames, sleep_frames]:
        if frames:
            frame_size = Image.open(frames[0]).size
            print(f"\nDetected frame size: {frame_size[0]}x{frame_size[1]}")
            break
    
    print("\nCreating sprite sheets...")
    create_spritesheet(idle_frames, "idle.png", frame_size)
    create_spritesheet(interact_frames, "interact.png", frame_size)
    create_spritesheet(skill_frames, "skill.png", frame_size)
    create_spritesheet(sleep_frames, "sleep.png", frame_size)
    
    print("\nDone!")
    print("Update config.ts URLs to use .png:")
    print("  idle: '/pika-pet/sprites/idle.png'")
    print("  interact: '/pika-pet/sprites/interact.png'")
    print("  skill: '/pika-pet/sprites/skill.png'")
    print("  sleep: '/pika-pet/sprites/sleep.png'")

if __name__ == "__main__":
    main()
