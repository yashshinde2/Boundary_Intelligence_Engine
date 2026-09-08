import React, { useState, useEffect, useRef } from 'react';
import type { VideoRecord, CornerItem } from '../types';
import { 
  Upload, 
  Film, 
  FileSpreadsheet, 
  Play, 
  Sliders, 
  CheckCircle2, 
  Radio,
  Layers,
  Sparkles
} from 'lucide-react';
import { API_URL } from '../config';

interface VideoUploadViewProps {
  corners: CornerItem[];
  onSelectVideoForLive: (videoId: string, cornerId: string) => void;
  onSelectVideoForCalib: (videoId: string, cornerId: string) => void;
}

export const VideoUploadView: React.FC<VideoUploadViewProps> = ({
  corners,
  onSelectVideoForLive,
  onSelectVideoForCalib
}) => {
  const [videos, setVideos] = useState<VideoRecord[]>([]);
  const [selectedCornerId, setSelectedCornerId] = useState<string>(corners[0]?.corner_id || 'RBR-T9');
  const [videoFile, setVideoFile] = useState<File | null>(null);
  const [telemetryFile, setTelemetryFile] = useState<File | null>(null);
  const [uploading, setUploading] = useState(false);
  const [statusMessage, setStatusMessage] = useState<string | null>(null);

  const videoInputRef = useRef<HTMLInputElement | null>(null);
  const telemInputRef = useRef<HTMLInputElement | null>(null);

  useEffect(() => {
    fetchVideos();
    const interval = setInterval(fetchVideos, 3000);
    return () => clearInterval(interval);
  }, []);

  const fetchVideos = async () => {
    try {
      const res = await fetch(`${API_URL}/api/videos`);
      if (res.ok) {
        const data = await res.json();
        setVideos(data);
      }
    } catch (e) {
      console.error('Failed to fetch videos:', e);
    }
  };

  const handleUpload = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!videoFile) return;

    try {
      setUploading(true);
      setStatusMessage('Uploading video footage to TrackShift Boundary Engine...');

      const formData = new FormData();
      formData.append('file', videoFile);
      formData.append('corner_id', selectedCornerId);

      const res = await fetch(`${API_URL}/api/video/upload`, {
        method: 'POST',
        body: formData
      });

      if (!res.ok) {
        throw new Error('Upload failed');
      }

      const data = await res.json();
      const newVideoId = data.video_id;

      // If telemetry file provided, upload as well
      if (telemetryFile) {
        setStatusMessage('Syncing CSV telemetry feed...');
        const telemFormData = new FormData();
        telemFormData.append('file', telemetryFile);

        await fetch(`${API_URL}/api/video/${newVideoId}/telemetry`, {
          method: 'POST',
          body: telemFormData
        });
      }

      setStatusMessage('Video and telemetry indexed successfully! Ready for AI compliance analysis.');
      setVideoFile(null);
      setTelemetryFile(null);
      fetchVideos();
    } catch (err: any) {
      setStatusMessage(`Upload failed: ${err.message}`);
    } finally {
      setUploading(false);
    }
  };

  const handleAnalyze = async (videoId: string, cornerId: string) => {
    try {
      setStatusMessage(`Kicking off AI vision analysis on video ${videoId}...`);
      const res = await fetch(`${API_URL}/api/video/${videoId}/analyze`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ corner_id: cornerId, vehicle_id: 27 })
      });

      if (res.ok) {
        fetchVideos();
      }
    } catch (e) {
      console.error('Analysis trigger failed:', e);
    }
  };

  return (
    <div className="p-6 space-y-6 max-w-7xl mx-auto">
      {/* Top Banner */}
      <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-4 border-b border-[#232332] pb-4">
        <div>
          <div className="flex items-center gap-2">
            <Film className="w-5 h-5 text-[#E10600]" />
            <h2 className="text-lg font-black text-white uppercase tracking-wider">
              Real-Video Ingestion & Boundary Analysis Pipeline
            </h2>
          </div>
          <p className="text-xs text-gray-400 mt-0.5">
            Upload real F1 broadcast or CCTV session footage, ingest CAN-bus telemetry CSV, and run automated YOLO + ByteTrack compliance.
          </p>
        </div>

        <div className="flex items-center gap-2 px-3 py-1 rounded bg-[#161622] border border-[#2c2c3e] text-xs font-mono text-gray-300">
          <Sparkles className="w-3.5 h-3.5 text-[#00E5FF]" />
          <span>Haas F1 VF-24 Vision Engine</span>
        </div>
      </div>

      {/* Grid: Upload Card & Pipeline Status */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Upload Form Card (5 cols) */}
        <div className="lg:col-span-5 space-y-4">
          <div className="f1-card p-5 space-y-4">
            <h3 className="text-sm font-bold text-white uppercase tracking-wider flex items-center gap-2 border-b border-[#222232] pb-2">
              <Upload className="w-4 h-4 text-[#E10600]" />
              Upload Race Footage (.mp4)
            </h3>

            <form onSubmit={handleUpload} className="space-y-4">
              {/* Corner Selection */}
              <div className="space-y-1.5">
                <label className="text-xs font-bold text-gray-300 uppercase tracking-wider">
                  Target Circuit Corner
                </label>
                <select
                  value={selectedCornerId}
                  onChange={(e) => setSelectedCornerId(e.target.value)}
                  className="w-full bg-[#0a0a0f] border border-[#232332] rounded-lg p-2.5 text-xs text-white focus:outline-none focus:border-[#E10600]"
                >
                  {corners.map((c) => (
                    <option key={c.corner_id} value={c.corner_id}>
                      {c.corner_name} ({c.speed_category})
                    </option>
                  ))}
                </select>
              </div>

              {/* Video File Dropzone */}
              <div className="space-y-1.5">
                <label className="text-xs font-bold text-gray-300 uppercase tracking-wider">
                  Video File (MP4, MOV, AVI)
                </label>
                <div 
                  onClick={() => videoInputRef.current?.click()}
                  className={`border-2 border-dashed rounded-lg p-4 text-center cursor-pointer transition-all ${
                    videoFile 
                      ? 'border-[#00E5FF] bg-[#00E5FF]/5' 
                      : 'border-[#2c2c3e] hover:border-[#E10600] bg-[#0e0e15]'
                  }`}
                >
                  <input
                    ref={videoInputRef}
                    type="file"
                    accept="video/mp4,video/avi,video/quicktime,video/x-matroska"
                    className="hidden"
                    onChange={(e) => setVideoFile(e.target.files?.[0] || null)}
                  />
                  <Film className={`w-7 h-7 mx-auto mb-1.5 ${videoFile ? 'text-[#00E5FF]' : 'text-gray-500'}`} />
                  {videoFile ? (
                    <div className="text-xs font-mono text-white truncate max-w-xs mx-auto">
                      {videoFile.name} ({(videoFile.size / (1024 * 1024)).toFixed(1)} MB)
                    </div>
                  ) : (
                    <div className="space-y-0.5">
                      <p className="text-xs font-medium text-gray-300">Click to select video footage</p>
                      <p className="text-[10px] text-gray-500">Supports 720p / 1080p F1 camera feeds</p>
                    </div>
                  )}
                </div>
              </div>

              {/* Optional Telemetry File Dropzone */}
              <div className="space-y-1.5">
                <div className="flex items-center justify-between">
                  <label className="text-xs font-bold text-gray-300 uppercase tracking-wider">
                    Telemetry CSV (Optional)
                  </label>
                  <span className="text-[10px] text-gray-500">Auto-fallback to synthetic if omitted</span>
                </div>
                <div 
                  onClick={() => telemInputRef.current?.click()}
                  className={`border-2 border-dashed rounded-lg p-3 text-center cursor-pointer transition-all ${
                    telemetryFile 
                      ? 'border-[#FFB800] bg-[#FFB800]/5' 
                      : 'border-[#242434] hover:border-gray-500 bg-[#0a0a0f]'
                  }`}
                >
                  <input
                    ref={telemInputRef}
                    type="file"
                    accept=".csv,text/csv"
                    className="hidden"
                    onChange={(e) => setTelemetryFile(e.target.files?.[0] || null)}
                  />
                  <FileSpreadsheet className={`w-5 h-5 mx-auto mb-1 ${telemetryFile ? 'text-[#FFB800]' : 'text-gray-600'}`} />
                  {telemetryFile ? (
                    <div className="text-xs font-mono text-white truncate max-w-xs mx-auto">
                      {telemetryFile.name}
                    </div>
                  ) : (
                    <p className="text-[11px] text-gray-400">Attach telemetry CSV (speed, lat_g, steer, throttle, brake)</p>
                  )}
                </div>
              </div>

              {/* Submit Button */}
              <button
                type="submit"
                disabled={!videoFile || uploading}
                className={`w-full py-2.5 rounded-lg text-xs font-bold uppercase tracking-wider flex items-center justify-center gap-2 transition-all ${
                  videoFile && !uploading
                    ? 'bg-[#E10600] text-white hover:bg-red-700 shadow-lg shadow-red-900/40 cursor-pointer'
                    : 'bg-[#20202c] text-gray-500 cursor-not-allowed border border-[#2e2e42]'
                }`}
              >
                <Upload className="w-4 h-4" />
                <span>{uploading ? 'Uploading Footage...' : 'Upload & Process Video'}</span>
              </button>

              {statusMessage && (
                <div className="p-2.5 rounded bg-[#101018] border border-[#232332] text-xs text-gray-300 flex items-start gap-2">
                  <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0 mt-0.5" />
                  <span>{statusMessage}</span>
                </div>
              )}
            </form>
          </div>
        </div>

        {/* Video Catalog & Pipeline Status (7 cols) */}
        <div className="lg:col-span-7 space-y-4">
          <div className="f1-card p-5 space-y-4">
            <div className="flex items-center justify-between border-b border-[#222232] pb-2">
              <h3 className="text-sm font-bold text-white uppercase tracking-wider flex items-center gap-2">
                <Layers className="w-4 h-4 text-[#00E5FF]" />
                Ingested Session Videos ({videos.length})
              </h3>
              <button
                onClick={fetchVideos}
                className="text-[11px] text-gray-400 hover:text-white transition-colors"
              >
                Refresh List
              </button>
            </div>

            {videos.length === 0 ? (
              <div className="text-center py-12 space-y-3 bg-[#0a0a0f] rounded-lg border border-[#1f1f2e]">
                <Film className="w-10 h-10 text-gray-600 mx-auto" />
                <div className="space-y-1">
                  <p className="text-xs font-bold text-gray-300 uppercase">No video footage uploaded yet</p>
                  <p className="text-[11px] text-gray-500 max-w-sm mx-auto">
                    Upload an MP4 video above to run real-world YOLO detection, ByteTrack spatial tracking, and track limit compliance analysis.
                  </p>
                </div>
              </div>
            ) : (
              <div className="space-y-3">
                {videos.map((vid) => {
                  const percent = vid.total_frames > 0 
                    ? Math.min(100, Math.round((vid.current_frame / vid.total_frames) * 100)) 
                    : (vid.status === 'COMPLETED' ? 100 : 0);

                  return (
                    <div 
                      key={vid.video_id}
                      className="bg-[#0e0e15] border border-[#232332] rounded-lg p-4 space-y-3 hover:border-[#383850] transition-all"
                    >
                      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                        <div className="flex items-center gap-2.5">
                          <div className="p-2 rounded bg-[#161622] border border-[#2c2c3e] text-[#00E5FF]">
                            <Film className="w-4 h-4" />
                          </div>
                          <div>
                            <div className="flex items-center gap-2">
                              <span className="text-xs font-bold text-white font-mono">{vid.filename}</span>
                              <span className={`px-2 py-0.5 rounded text-[9px] font-bold uppercase tracking-wider ${
                                vid.status === 'COMPLETED'
                                  ? 'bg-emerald-950 text-emerald-400 border border-emerald-800'
                                  : vid.status === 'PROCESSING'
                                  ? 'bg-cyan-950 text-cyan-400 border border-cyan-800 animate-pulse'
                                  : vid.status === 'FAILED'
                                  ? 'bg-red-950 text-red-400 border border-red-800'
                                  : 'bg-gray-800 text-gray-300'
                              }`}>
                                {vid.status}
                              </span>
                            </div>
                            <div className="flex items-center gap-3 text-[10px] text-gray-400 mt-0.5 font-mono">
                              <span>ID: {vid.video_id}</span>
                              <span>Corner: {vid.corner_id}</span>
                              <span>{vid.duration_sec}s @ {vid.fps} FPS</span>
                              <span>{vid.width}x{vid.height}</span>
                            </div>
                          </div>
                        </div>

                        {/* Actions */}
                        <div className="flex items-center gap-2 shrink-0">
                          {vid.status === 'UPLOADED' && (
                            <button
                              onClick={() => handleAnalyze(vid.video_id, vid.corner_id)}
                              className="px-3 py-1.5 rounded bg-[#E10600] text-white hover:bg-red-700 text-xs font-bold shadow-md shadow-red-900/40 transition-all flex items-center gap-1"
                            >
                              <Play className="w-3 h-3" />
                              <span>Analyze Video</span>
                            </button>
                          )}

                          <button
                            onClick={() => onSelectVideoForCalib(vid.video_id, vid.corner_id)}
                            className="px-2.5 py-1.5 rounded bg-[#181824] text-gray-300 hover:text-white text-xs font-semibold border border-[#2c2c3e] transition-all flex items-center gap-1"
                            title="Calibrate Boundary on Video Frame"
                          >
                            <Sliders className="w-3 h-3 text-[#00E5FF]" />
                            <span className="hidden sm:inline">Calibrate</span>
                          </button>

                          <button
                            onClick={() => onSelectVideoForLive(vid.video_id, vid.corner_id)}
                            className="px-3 py-1.5 rounded bg-[#00E5FF]/20 text-[#00E5FF] hover:bg-[#00E5FF]/30 text-xs font-bold border border-[#00E5FF]/40 transition-all flex items-center gap-1"
                            title="Open in Live Steward Dashboard"
                          >
                            <Radio className="w-3 h-3 text-[#00E5FF]" />
                            <span>Live Feed</span>
                          </button>
                        </div>
                      </div>

                      {/* Progress bar if processing */}
                      {vid.status === 'PROCESSING' && (
                        <div className="space-y-1">
                          <div className="flex justify-between text-[10px] font-mono text-gray-400">
                            <span>Processing Frames: {vid.current_frame} / {vid.total_frames}</span>
                            <span className="text-[#00E5FF]">{percent}%</span>
                          </div>
                          <div className="w-full h-1.5 bg-[#1a1a24] rounded-full overflow-hidden">
                            <div 
                              className="h-full bg-gradient-to-r from-[#00E5FF] to-[#E10600] transition-all duration-300"
                              style={{ width: `${percent}%` }}
                            />
                          </div>
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};
