"""
Unit Tests for Analysis Pipeline & Replay Generation
"""
import os
import cv2
import numpy as np
import pytest
from engine.analysis_pipeline import VideoAnalysisPipeline
from database import save_video_record, get_video_record, save_video_telemetry


@pytest.fixture
def test_video_and_db(tmp_path):
    video_id = "VID-TEST-001"
    video_file = str(tmp_path / "test_session.mp4")
    fourcc = cv2.VideoWriter_fourcc(*'mp4v')
    out = cv2.VideoWriter(video_file, fourcc, 30.0, (1280, 720))

    # Write 45 frames (1.5 seconds)
    for i in range(45):
        frame = np.zeros((720, 1280, 3), dtype=np.uint8)
        # Red Haas Car drifting outside Turn 9 boundary
        cx = 600 + i * 15
        cy = 400 - i * 5
        cv2.rectangle(frame, (cx, cy), (cx + 80, cy + 40), (20, 20, 220), -1)
        out.write(frame)

    out.release()

    save_video_record({
        "video_id": video_id,
        "filename": "test_session.mp4",
        "filepath": video_file,
        "duration_sec": 1.5,
        "fps": 30.0,
        "width": 1280,
        "height": 720,
        "status": "UPLOADED",
        "current_frame": 0,
        "total_frames": 45,
        "corner_id": "RBR-T9"
    })

    return video_id, video_file


def test_pipeline_analysis_run(test_video_and_db):
    video_id, _ = test_video_and_db
    pipeline = VideoAnalysisPipeline()

    result = pipeline.analyze_video_file(
        video_id=video_id,
        corner_id="RBR-T9",
        vehicle_id=27,
        driver_name="Nico Hülkenberg"
    )

    assert result["status"] == "COMPLETED"
    assert result["frames_processed"] == 45
    assert "incidents_detected" in result

    # Check video status updated in DB
    v = get_video_record(video_id)
    assert v["status"] == "COMPLETED"
    assert v["current_frame"] == 45


def test_streaming_generator(test_video_and_db):
    video_id, _ = test_video_and_db
    pipeline = VideoAnalysisPipeline()

    frames = list(pipeline.stream_real_video_analysis(video_id=video_id, corner_id="RBR-T9", vehicle_id=27))
    assert len(frames) == 45

    first_frame = frames[0]
    assert first_frame["type"] == "FRAME_ANALYSIS"
    assert first_frame["vehicle_id"] == 27
    assert "bbox" in first_frame
    assert "footprint" in first_frame
    assert "confidence" in first_frame
    assert first_frame["frame_b64"].startswith("data:image/jpeg;base64,")


def test_replay_clip_generation(test_video_and_db, tmp_path):
    _, video_file = test_video_and_db
    pipeline = VideoAnalysisPipeline()

    clip_path = pipeline.generate_replay_clip(
        source_video_path=video_file,
        incident_id="INC-UNIT-99",
        center_frame_idx=20,
        fps=30.0,
        legal_poly=[[120, 560], [320, 480], [580, 410], [840, 360], [1140, 320]]
    )

    assert os.path.exists(clip_path)
    assert os.path.getsize(clip_path) > 0
