import React, { useState, useEffect, Suspense, lazy } from 'react';
import type { ViewMode, CornerItem, Incident, SessionType } from './types';
import { HeaderNav } from './components/HeaderNav';
import { IncidentReviewModal } from './components/IncidentReviewModal';
import { API_URL } from './config';

const StrategicDashboard = lazy(() => import('./components/StrategicDashboard').then((module) => ({ default: module.StrategicDashboard })));
const LiveStewardDashboard = lazy(() => import('./components/LiveStewardDashboard').then((module) => ({ default: module.LiveStewardDashboard })));
const TrackCalibrationTool = lazy(() => import('./components/TrackCalibrationTool').then((module) => ({ default: module.TrackCalibrationTool })));
const IncidentsQueueView = lazy(() => import('./components/IncidentsQueueView').then((module) => ({ default: module.IncidentsQueueView })));
const VideoUploadView = lazy(() => import('./components/VideoUploadView').then((module) => ({ default: module.VideoUploadView })));

export const App: React.FC = () => {
  const [currentMode, setCurrentMode] = useState<ViewMode>('LIVE_STEWARD');
  const [corners, setCorners] = useState<CornerItem[]>([]);
  const [selectedCornerId, setSelectedCornerId] = useState<string>('RBR-T9');
  const [activeIncidentId, setActiveIncidentId] = useState<string | null>(null);
  const [, setPendingIncidentsCount] = useState<number>(0);
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
        isLiveStreaming={isLiveStreaming}
        selectedDriverNumber={selectedDriverNumber}
        onSelectDriver={setSelectedDriverNumber}
        selectedSession={selectedSession}
        onSelectSession={setSelectedSession}
      />

      {/* Main Content Area Based on Mode */}
      <main className="flex-1">
        <Suspense
          fallback={
            <div className="flex min-h-[60vh] items-center justify-center text-sm uppercase tracking-[0.2em] text-gray-400">
              Loading system modules...
            </div>
          }
        >
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
        </Suspense>
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
