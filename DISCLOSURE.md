# Disclosure and Attribution

This project combines original system design and integration work with open-source components and public data sources. The pipeline/integration code is original; the datasets, pretrained models, and libraries are disclosed below.

## Major libraries and components
- Ultralytics YOLOv8 / YOLO-based detector models
- ByteTrack for multi-object tracking
- OpenCV for frame extraction, image processing, and annotation
- FFmpeg for replay rendering and video processing
- Shapely for geometry and boundary containment checks
- FastAPI and React/Vite for the web application stack
- FastF1 as a public telemetry access layer for race data
- TUMFTM racetrack-database for public track-boundary reference data
- F1tenth racetrack assets for map and circuit reference materials

## License and model notice
- YOLOv8 / Ultralytics license terms should be checked before production redistribution or commercial packaging.
- ByteTrack, Shapely, OpenCV, FFmpeg, FastAPI, React, and the related stack are used under their respective open-source terms.
- Public racing telemetry and track reference material are used for demo and research workflows only and are not redistributed as part of this repository unless explicitly included.

## Project statement
All pipeline logic, orchestration, telemetry fusion, boundary-state logic, dashboard design, and incident adjudication workflows in this repository were implemented as part of the original project work. Public datasets and pretrained detection models are used only as disclosed reference assets.
