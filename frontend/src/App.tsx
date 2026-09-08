import React, { useState, useEffect } from 'react';
import type { ViewMode, CornerItem, Incident, SessionType } from './types';
import { HeaderNav } from './components/HeaderNav';
import { StrategicDashboard } from './components/StrategicDashboard';
import { LiveStewardDashboard } from './components/LiveStewardDashboard';
import { TrackCalibrationTool } from './components/TrackCalibrationTool';
import { IncidentsQueueView } from './components/IncidentsQueueView';
import { IncidentReviewModal } from './components/IncidentReviewModal';
import { VideoUploadView } from './components/VideoUploadView';
import { API_URL } from './config';

export const App: React.FC = () => {
  const [currentMode, setCurrentMode] = useState<ViewMode>('STRATEGY');
  const [corners, setCorners] = useState<CornerItem[]>([]);
  const [selectedCornerId, setSelectedCornerId] = useState<string>('RBR-T3');
  const [activeIncidentId, setActiveIncidentId] = useState<string | null>(null);
  const [pendingIncidentsCount, setPendingIncidentsCount] = useState<number>(0);
  const [isLiveStreaming, setIsLiveStreaming] = useState<boolean>(false);
  const [activeVideoId, setActiveVideoId] = useState<string | null>(null);
  const [liveStreamMode, setLiveStreamMode] = useState<'synthetic' | 'live_analysis'>('synthetic');
  const [selectedDriverNumber, setSelectedDriverNumber] = useState<number>(31);
  const [selectedSession, setSelectedSession] = useState<SessionType>('FP2');

  useEffect(() => {
    fetchCorners();
    fetchIncidents();
  }, []);

  const fetchCorners = async () => {
    try {
      const res = await fetch(`${API_URL}/api/corners`);
      if (res.ok) {
        const data = await res.json();
        setCorners(data);
        if (data.length > 0 && !selectedCornerId) {
          setSelectedCornerId(data[0].corner_id);
        }
      }
    } catch (e) {
      console.error('Failed to load corners:', e);
    }
  };

  const fetchIncidents = async () => {
    try {
      const res = await fetch(`${API_URL}/api/incidents`);
      if (res.ok) {
        const data: Incident[] = await res.json();
        const pending = data.filter(i => i.status === 'PENDING_REVIEW').length;
        setPendingIncidentsCount(pending);
      }
    } catch (e) {
      console.error('Failed to load incidents:', e);
    }
  };

  const handleSelectVideoForLive = (videoId: string, cornerId: string) => {
    setActiveVideoId(videoId);
    setSelectedCornerId(cornerId);
    setLiveStreamMode('live_analysis');
    setCurrentMode('LIVE_STEWARD');
  };

  const handleSelectVideoForCalib = (videoId: string, cornerId: string) => {
    setActiveVideoId(videoId);
    setSelectedCornerId(cornerId);
    setCurrentMode('CALIBRATION');
  };

  return (
    <div className="min-h-screen bg-[#0b0b0f] text-gray-100 flex flex-col font-sans">
      {/* Top Header Navigation */}
      <HeaderNav
        currentMode={currentMode}
        onSelectMode={(mode) => {
          if (mode === 'LIVE_STEWARD' && !activeVideoId) {
            setLiveStreamMode('synthetic');
          }
          setCurrentMode(mode);
        }}
        pendingIncidentsCount={pendingIncidentsCount}
        isLiveStreaming={isLiveStreaming}
        selectedDriverNumber={selectedDriverNumber}
        onSelectDriver={setSelectedDriverNumber}
        selectedSession={selectedSession}
        onSelectSession={setSelectedSession}
      />

      {/* Main Content Area Based on Mode */}
      <main className="flex-1">
        {currentMode === 'STRATEGY' && (
          <StrategicDashboard
            corners={corners}
            selectedCornerId={selectedCornerId}
            onSelectCorner={setSelectedCornerId}
            selectedDriverNumber={selectedDriverNumber}
            onSelectDriver={setSelectedDriverNumber}
            selectedSession={selectedSession}
            onSelectSession={setSelectedSession}
          />
        )}

        {currentMode === 'LIVE_STEWARD' && (
          <LiveStewardDashboard
            corners={corners}
            selectedCornerId={selectedCornerId}
            onSelectCorner={setSelectedCornerId}
            onOpenIncidentReview={setActiveIncidentId}
            onSetLiveStreaming={setIsLiveStreaming}
            activeVideoId={activeVideoId}
            mode={liveStreamMode}
            selectedDriverNumber={selectedDriverNumber}
          />
        )}

        {currentMode === 'CALIBRATION' && (
          <TrackCalibrationTool
            corners={corners}
            selectedCornerId={selectedCornerId}
            onSelectCorner={setSelectedCornerId}
            onCalibrationSaved={fetchCorners}
            activeVideoId={activeVideoId}
          />
        )}

        {currentMode === 'INCIDENTS' && (
          <IncidentsQueueView
            onOpenIncidentReview={setActiveIncidentId}
          />
        )}

        {currentMode === 'UPLOAD' && (
          <VideoUploadView
            corners={corners}
            onSelectVideoForLive={handleSelectVideoForLive}
            onSelectVideoForCalib={handleSelectVideoForCalib}
          />
        )}
      </main>

      {/* Steward Incident Review Modal */}
      <IncidentReviewModal
        incidentId={activeIncidentId}
        onClose={() => setActiveIncidentId(null)}
        onIncidentUpdated={() => {
          fetchIncidents();
        }}
      />
    </div>
  );
};

export default App;
