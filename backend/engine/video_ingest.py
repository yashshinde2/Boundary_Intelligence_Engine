"""
Video Ingestion and Frame Extraction Engine for TrackShift 2026
Provides high-performance frame extraction, video metadata probing, and frame generation.
"""
import os
import cv2
import numpy as np
from typing import Dict, Any, Generator, Tuple, Optional


class VideoIngestEngine:
    def __init__(self, videos_dir: str = "videos"):
        self.videos_dir = videos_dir
        os.makedirs(self.videos_dir, exist_ok=True)

    @staticmethod
    def extract_metadata(video_path: str) -> Dict[str, Any]:
        """
        Extracts duration, fps, resolution, and total frame count from a video file.
        """
        if not os.path.exists(video_path):
            raise FileNotFoundError(f"Video file not found: {video_path}")

        cap = cv2.VideoCapture(video_path)
        if not cap.isOpened():
            raise ValueError(f"Could not open video file: {video_path}")

        try:
            fps = float(cap.get(cv2.CAP_PROP_FPS))
            if fps <= 0 or np.isnan(fps):
                fps = 30.0

            total_frames = int(cap.get(cv2.CAP_PROP_FRAME_COUNT))
            width = int(cap.get(cv2.CAP_PROP_FRAME_WIDTH))
            height = int(cap.get(cv2.CAP_PROP_FRAME_HEIGHT))
            duration_sec = round(total_frames / fps, 2) if total_frames > 0 else 0.0

            return {
                "fps": round(fps, 2),
                "total_frames": total_frames,
                "width": width,
                "height": height,
                "duration_sec": duration_sec
            }
        finally:
            cap.release()

    @staticmethod
    def get_frame(video_path: str, frame_index: int) -> Optional[np.ndarray]:
        """
        Extracts a single frame by 1-based or 0-based frame index.
        """
        if not os.path.exists(video_path):
            return None

        cap = cv2.VideoCapture(video_path)
        if not cap.isOpened():
            return None

        try:
            target_idx = max(0, frame_index - 1)
            cap.set(cv2.CAP_PROP_POS_FRAMES, target_idx)
            ret, frame = cap.read()
            if ret and frame is not None:
                return frame
            return None
        finally:
            cap.release()

    @staticmethod
    def get_frame_jpeg(video_path: str, frame_index: int = 1, quality: int = 85) -> Optional[bytes]:
        """
        Extracts a frame and encodes it as JPEG bytes.
        """
        frame = VideoIngestEngine.get_frame(video_path, frame_index)
        if frame is None:
            return None
        encode_param = [int(cv2.IMWRITE_JPEG_QUALITY), quality]
        success, encoded = cv2.imencode('.jpg', frame, encode_param)
        if success:
            return encoded.tobytes()
        return None

    @staticmethod
    def iter_frames(video_path: str, step: int = 1) -> Generator[Tuple[int, np.ndarray, float], None, None]:
        """
        Yields (frame_index, frame_bgr, timestamp_sec) from the video file.
        """
        if not os.path.exists(video_path):
            return

        cap = cv2.VideoCapture(video_path)
        if not cap.isOpened():
            return

        try:
            fps = float(cap.get(cv2.CAP_PROP_FPS))
            if fps <= 0 or np.isnan(fps):
                fps = 30.0

            frame_idx = 0
            while True:
                ret, frame = cap.read()
                if not ret or frame is None:
                    break

                frame_idx += 1
                if frame_idx % step == 0:
                    ts_sec = round(frame_idx / fps, 3)
                    yield frame_idx, frame, ts_sec
        finally:
            cap.release()
