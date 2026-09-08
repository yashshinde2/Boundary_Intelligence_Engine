"""
Unit Tests for Video Ingest Engine & Frame Extraction
"""
import os
import cv2
import numpy as np
import pytest
from engine.video_ingest import VideoIngestEngine


@pytest.fixture
def sample_video_path(tmp_path):
    """Generates a small 30-frame synthetic test video."""
    video_file = str(tmp_path / "sample_test.mp4")
    fourcc = cv2.VideoWriter_fourcc(*'mp4v')
    out = cv2.VideoWriter(video_file, fourcc, 30.0, (640, 360))

    for i in range(30):
        frame = np.zeros((360, 640, 3), dtype=np.uint8)
        # Draw a moving square
        cv2.rectangle(frame, (50 + i * 5, 100), (120 + i * 5, 180), (0, 0, 255), -1)
        out.write(frame)

    out.release()
    return video_file


def test_extract_metadata(sample_video_path):
    meta = VideoIngestEngine.extract_metadata(sample_video_path)
    assert meta["width"] == 640
    assert meta["height"] == 360
    assert meta["fps"] == 30.0
    assert meta["total_frames"] == 30
    assert meta["duration_sec"] == 1.0


def test_get_frame(sample_video_path):
    frame = VideoIngestEngine.get_frame(sample_video_path, frame_index=5)
    assert frame is not None
    assert frame.shape == (360, 640, 3)


def test_get_frame_jpeg(sample_video_path):
    jpeg_bytes = VideoIngestEngine.get_frame_jpeg(sample_video_path, frame_index=1)
    assert jpeg_bytes is not None
    assert len(jpeg_bytes) > 0
    assert jpeg_bytes[:2] == b'\xff\xd8'  # Standard JPEG magic number


def test_iter_frames(sample_video_path):
    frames_count = 0
    for idx, frame, ts in VideoIngestEngine.iter_frames(sample_video_path, step=1):
        assert idx == frames_count + 1
        assert frame is not None
        assert ts >= 0.0
        frames_count += 1
    assert frames_count == 30


def test_missing_video_raises():
    with pytest.raises(FileNotFoundError):
        VideoIngestEngine.extract_metadata("non_existent_video.mp4")
