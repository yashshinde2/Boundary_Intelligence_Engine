"""
Spatial Object Tracker (ByteTrack / Kalman-like persistence) for TrackShift 2026
Maintains consistent vehicle IDs across video frames and evaluates trajectory continuity.
"""
from typing import List, Dict, Any, Optional
import numpy as np


class SpatialTracker:
    def __init__(self, max_disappeared: int = 10, iou_threshold: float = 0.3):
        self.next_id = 1
        self.tracks: Dict[int, Dict[str, Any]] = {}
        self.disappeared: Dict[int, int] = {}
        self.max_disappeared = max_disappeared
        self.iou_threshold = iou_threshold

    @staticmethod
    def calculate_iou(boxA: List[float], boxB: List[float]) -> float:
        xA = max(boxA[0], boxB[0])
        yA = max(boxA[1], boxB[1])
        xB = min(boxA[2], boxB[2])
        yB = min(boxA[3], boxB[3])

        interArea = max(0, xB - xA) * max(0, yB - yA)
        boxAArea = (boxA[2] - boxA[0]) * (boxA[3] - boxA[1])
        boxBArea = (boxB[2] - boxB[0]) * (boxB[3] - boxB[1])

        iou = interArea / float(boxAArea + boxBArea - interArea + 1e-6)
        return float(iou)

    def update(self, detections: List[Dict[str, Any]]) -> List[Dict[str, Any]]:
        """
        Updates active tracks with new frame detections.
        Returns tracked objects with persistent track_id and tracking continuity score.
        """
        if not detections:
            # Increment disappeared count for all active tracks
            for track_id in list(self.disappeared.keys()):
                self.disappeared[track_id] += 1
                if self.disappeared[track_id] > self.max_disappeared:
                    del self.tracks[track_id]
                    del self.disappeared[track_id]
            return []

        if not self.tracks:
            # Initialize tracks with current detections
            results = []
            for det in detections:
                t_id = det.get("vehicle_id", self.next_id)
                self.tracks[t_id] = {
                    "bbox": det["bbox"],
                    "history": [det["bbox"]],
                    "age": 1,
                    "confidence": det.get("confidence", 0.95)
                }
                self.disappeared[t_id] = 0
                if t_id >= self.next_id:
                    self.next_id = t_id + 1
                
                results.append({
                    "vehicle_id": t_id,
                    "bbox": det["bbox"],
                    "confidence": det.get("confidence", 0.95),
                    "tracking_consistency": 0.95,
                    "history_length": 1
                })
            return results

        # Match detections to existing tracks using IoU
        track_ids = list(self.tracks.keys())
        track_boxes = [self.tracks[t_id]["bbox"] for t_id in track_ids]
        det_boxes = [d["bbox"] for d in detections]

        iou_matrix = np.zeros((len(track_boxes), len(det_boxes)), dtype=np.float32)
        for i, t_box in enumerate(track_boxes):
            for j, d_box in enumerate(det_boxes):
                iou_matrix[i, j] = self.calculate_iou(t_box, d_box)

        matched_tracks = set()
        matched_dets = set()
        results = []

        # Greedy IoU matching
        if iou_matrix.size > 0:
            indices = np.unravel_index(np.argsort(-iou_matrix, axis=None), iou_matrix.shape)
            for i, j in zip(indices[0], indices[1]):
                if i in matched_tracks or j in matched_dets:
                    continue
                if iou_matrix[i, j] >= self.iou_threshold:
                    t_id = track_ids[i]
                    det = detections[j]
                    
                    self.tracks[t_id]["bbox"] = det["bbox"]
                    self.tracks[t_id]["history"].append(det["bbox"])
                    if len(self.tracks[t_id]["history"]) > 30:
                        self.tracks[t_id]["history"].pop(0)
                    self.tracks[t_id]["age"] += 1
                    self.disappeared[t_id] = 0

                    matched_tracks.add(i)
                    matched_dets.add(j)

                    consistency = min(1.0, 0.70 + (self.tracks[t_id]["age"] * 0.03))
                    results.append({
                        "vehicle_id": t_id,
                        "bbox": det["bbox"],
                        "confidence": det.get("confidence", 0.95),
                        "tracking_consistency": round(consistency, 3),
                        "history_length": len(self.tracks[t_id]["history"])
                    })

        # Add unmatched detections as new tracks
        for j, det in enumerate(detections):
            if j not in matched_dets:
                t_id = det.get("vehicle_id", self.next_id)
                self.tracks[t_id] = {
                    "bbox": det["bbox"],
                    "history": [det["bbox"]],
                    "age": 1,
                    "confidence": det.get("confidence", 0.95)
                }
                self.disappeared[t_id] = 0
                if t_id >= self.next_id:
                    self.next_id = t_id + 1

                results.append({
                    "vehicle_id": t_id,
                    "bbox": det["bbox"],
                    "confidence": det.get("confidence", 0.95),
                    "tracking_consistency": 0.85,
                    "history_length": 1
                })

        return results
