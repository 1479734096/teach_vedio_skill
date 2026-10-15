"""从生成的 MP4 中自动等间隔采样代表性关键帧，并拼接为横向/网格长图画册，供快速视觉审查。"""
import argparse
from pathlib import Path
import cv2
import numpy as np

def extract_keyframes(video_path, out_path, num_frames=5):
    video_path = Path(video_path).resolve()
    out_path = Path(out_path).resolve()
    if not video_path.is_file():
        raise FileNotFoundError(f"视频文件不存在: {video_path}")
    
    cap = cv2.VideoCapture(str(video_path))
    if not cap.isOpened():
        raise RuntimeError(f"无法打开视频: {video_path}")
    
    total_frames = int(cap.get(cv2.CAP_PROP_FRAME_COUNT))
    fps = cap.get(cv2.CAP_PROP_FPS) or 30.0
    duration = total_frames / fps
    
    if total_frames <= 0:
        raise RuntimeError("视频帧数异常 (0 帧)")

    # 均匀采样帧位置（避开最前 0.5s 和最后 0.5s，取最能代表中间过程的镜头）
    start_f = min(int(0.5 * fps), max(0, total_frames // 10))
    end_f = max(total_frames - int(0.5 * fps), min(total_frames - 1, total_frames * 9 // 10))
    if end_f <= start_f:
        indices = np.linspace(0, total_frames - 1, num_frames, dtype=int)
    else:
        indices = np.linspace(start_f, end_f, num_frames, dtype=int)
    
    frames = []
    timestamps = []
    
    for idx in indices:
        cap.set(cv2.CAP_PROP_POS_FRAMES, idx)
        ret, frame = cap.read()
        if ret and frame is not None:
            # 缩放到合适缩略图宽度（如 480x270）
            thumb = cv2.resize(frame, (480, 270), interpolation=cv2.INTER_AREA)
            t_sec = idx / fps
            # 绘制时间戳标签 (置于右下角安全空白区，避免遮挡顶部标题)
            cv2.putText(thumb, f"t={t_sec:.1f}s (f={idx})", (thumb.shape[1] - 155, thumb.shape[0] - 14),
                        cv2.FONT_HERSHEY_SIMPLEX, 0.55, (0, 0, 0), 3, cv2.LINE_AA)
            cv2.putText(thumb, f"t={t_sec:.1f}s (f={idx})", (thumb.shape[1] - 155, thumb.shape[0] - 14),
                        cv2.FONT_HERSHEY_SIMPLEX, 0.55, (0, 255, 255), 1, cv2.LINE_AA)
            frames.append(thumb)
            timestamps.append(t_sec)
    
    cap.release()
    
    if not frames:
        raise RuntimeError("未能从视频中成功截取任何帧")
    
    # 组合为网格或长图：如果帧数 <= 4 横排，若 > 4 且 <= 6 可 2x3 或横排
    # 此处采用简洁的网格拼图：每行最多 3 张
    cols = 3 if len(frames) >= 4 else len(frames)
    rows = (len(frames) + cols - 1) // cols
    
    cell_w, cell_h = frames[0].shape[1], frames[0].shape[0]
    sheet = np.zeros((rows * cell_h, cols * cell_w, 3), dtype=np.uint8)
    
    for i, frame in enumerate(frames):
        r = i // cols
        c = i % cols
        sheet[r*cell_h:(r+1)*cell_h, c*cell_w:(c+1)*cell_w] = frame
        
    out_path.parent.mkdir(parents=True, exist_ok=True)
    cv2.imwrite(str(out_path), sheet, [cv2.IMWRITE_JPEG_QUALITY, 90])
    print(f"已生成关键帧预览长图: {out_path} ({len(frames)} 帧, 视频总时长 {duration:.1f}s)")
    return 0

def main():
    parser = argparse.ArgumentParser(description="提取理科动画代表性关键帧生成画册预览")
    parser.add_argument("--video", default="final.mp4", help="输入的 MP4 文件路径")
    parser.add_argument("--out", default="qa/keyframes_preview.jpg", help="输出拼图预览图片路径")
    parser.add_argument("--count", type=int, default=5, help="采样关键帧数量")
    args = parser.parse_args()
    return extract_keyframes(args.video, args.out, args.count)

if __name__ == "__main__":
    raise SystemExit(main())
