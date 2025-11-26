import React, { useState, useEffect } from 'react';
import { BrowserRouter, Routes, Route } from 'react-router-dom';
import { StudentProvider } from '@/src/contexts/StudentContext';
import { MusicProvider } from '@/src/contexts/MusicContext';
import { ProtectedRoute } from '@/src/components/ProtectedRoute';
import { HomePage } from '@/src/pages/HomePage';
import { ModeSelectionPage } from '@/src/pages/ModeSelectionPage';
import { StudyPage } from '@/src/pages/StudyPage';
import { GamePage } from '@/src/pages/GamePage';
import { ProfilePage } from '@/src/pages/ProfilePage';
import { ShopPage } from '@/src/pages/ShopPage';
import { AlbumPage } from '@/src/pages/AlbumPage';
import { TellMeWhyPage } from '@/src/pages/TellMeWhyPage';
import { SphinxRiddlePage } from '@/src/pages/SphinxRiddlePage';
import { UpdateNotification } from '@/src/components/UpdateNotification';
import { GachaModal } from '@/src/components/GachaModal';
import { UPDATE_AVAILABLE_EVENT, UPDATE_CHECK_COMPLETE_EVENT } from '@/services/updateService';
import { initializeTheme } from '@/services/themeService';
import { useStudent, useStudentActions } from '@/src/contexts/StudentContext';
import { X, Download } from 'lucide-react';

// Simple Button and Card components used by InstallInstructions
const Button = ({ onClick, children, variant = 'primary', className = '' }: any) => {
  const baseStyle = 'px-6 py-3 rounded-xl font-bold transition-all flex items-center justify-center';
  const variants = {
    primary: 'bg-brand-500 hover:bg-brand-600 text-white shadow-lg hover:shadow-xl',
    secondary: 'bg-gray-200 hover:bg-gray-300 text-gray-800'
  };
  return <button onClick={onClick} className={`${baseStyle} ${variants[variant]} ${className}`}>{children}</button>;
};

const Card = ({ children, className = '' }: any) => {
  return <div className={`bg-white p-6 rounded-2xl shadow-md border border-gray-100 ${className}`}>{children}</div>;
};

// Install Instructions Modal Component
const InstallInstructionsModal = ({ onClose }: { onClose: () => void }) => (
  <div className="fixed inset-0 bg-black/50 z-[60] flex items-center justify-center p-4 animate-in fade-in">
    <Card className="w-full max-w-md relative">
      <button onClick={onClose} className="absolute top-4 right-4 text-slate-400 hover:text-slate-600">
        <X size={24} />
      </button>
      <h3 className="text-xl font-bold mb-4 flex items-center gap-2">
        <Download className="text-brand-500" /> Cài đặt ứng dụng
      </h3>
      <div className="space-y-4 text-slate-600">
        <p>Để cài đặt ứng dụng MathGenius Kids, hãy làm theo hướng dẫn sau:</p>
        <div className="bg-slate-50 p-4 rounded-xl border border-slate-200">
          <h4 className="font-bold text-slate-800 mb-2">Trên trình duyệt (Chrome/Safari)</h4>
          <p className="mb-2">Nhấn vào nút <strong>Chia sẻ</strong> hoặc <strong>Menu</strong></p>
          <p>Chọn <strong>"Thêm vào màn hình chính"</strong> hoặc <strong>"Install App"</strong></p>
        </div>
        <div className="text-sm text-slate-500 italic text-center">
          Sau khi cài đặt, bé có thể học toán mọi lúc ngay trên màn hình chính!
        </div>
      </div>
      <div className="mt-6">
        <Button className="w-full" onClick={onClose}>Đã hiểu</Button>
      </div>
    </Card>
  </div>
);

// Global Modals Component
function GlobalModals() {
  const { gachaResult } = useStudent();
  const { setGachaResult } = useStudentActions();

  return (
    <>
      {gachaResult && (
        <GachaModal
          image={gachaResult.image}
          isNew={gachaResult.isNew}
          onClose={() => setGachaResult(null)}
        />
      )}
    </>
  );
}

export default function App() {
  const [deferredPrompt, setDeferredPrompt] = useState<any>(null);
  const [showInstallInstructions, setShowInstallInstructions] = useState(false);
  const [isStandalone, setIsStandalone] = useState(false);
  const [showUpdateNotification, setShowUpdateNotification] = useState(false);
  const [versionCheckComplete, setVersionCheckComplete] = useState(false);

  useEffect(() => {
    // Check if standalone
    const checkStandalone = () => {
      const isStandalone = window.matchMedia('(display-mode: standalone)').matches || (window.navigator as any).standalone;
      setIsStandalone(!!isStandalone);
    };
    checkStandalone();
    window.matchMedia('(display-mode: standalone)').addEventListener('change', checkStandalone);

    // Initialize theme
    initializeTheme();

    const handler = (e: any) => {
      e.preventDefault();
      setDeferredPrompt(e);
    };
    window.addEventListener('beforeinstallprompt', handler);

    // Initialize update service
    import('@/services/updateService').then(({ initUpdateService }) => {
      initUpdateService().catch(err => console.error('Failed to init update service:', err));
    });

    // Listen for update available event
    const handleUpdateAvailable = () => {
      setShowUpdateNotification(true);
    };
    window.addEventListener(UPDATE_AVAILABLE_EVENT, handleUpdateAvailable);

    // Listen for update check complete event
    const handleUpdateCheckComplete = () => {
      setVersionCheckComplete(true);
    };
    window.addEventListener(UPDATE_CHECK_COMPLETE_EVENT, handleUpdateCheckComplete);

    return () => {
      window.removeEventListener('beforeinstallprompt', handler);
      window.matchMedia('(display-mode: standalone)').removeEventListener('change', checkStandalone);
      window.removeEventListener(UPDATE_AVAILABLE_EVENT, handleUpdateAvailable);
      window.removeEventListener(UPDATE_CHECK_COMPLETE_EVENT, handleUpdateCheckComplete);
    };
  }, []);

  const handleInstallClick = async () => {
    if (!deferredPrompt) {
      setShowInstallInstructions(true);
      return;
    }
    deferredPrompt.prompt();
    const { outcome } = await deferredPrompt.userChoice;
    if (outcome === 'accepted') {
      setDeferredPrompt(null);
    }
  };

  return (
    <BrowserRouter basename="/Genius-kids">
      <StudentProvider>
        <MusicProvider>
          <Routes>
            <Route
              path="/"
              element={
                <HomePage
                  onInstallClick={handleInstallClick}
                  canInstall={!isStandalone}
                  showVersionCheck={versionCheckComplete}
                />
              }
            />
            <Route
              path="/mode"
              element={
                <ProtectedRoute>
                  <ModeSelectionPage />
                </ProtectedRoute>
              }
            />
            <Route
              path="/study/*"
              element={
                <ProtectedRoute>
                  <StudyPage />
                </ProtectedRoute>
              }
            />
            <Route
              path="/game"
              element={
                <ProtectedRoute>
                  <GamePage />
                </ProtectedRoute>
              }
            />
            <Route
              path="/profile"
              element={
                <ProtectedRoute>
                  <ProfilePage />
                </ProtectedRoute>
              }
            />
            <Route
              path="/shop"
              element={
                <ProtectedRoute>
                  <ShopPage />
                </ProtectedRoute>
              }
            />
            <Route
              path="/album"
              element={
                <ProtectedRoute>
                  <AlbumPage />
                </ProtectedRoute>
              }
            />
            <Route
              path="/tellmewhy"
              element={
                <ProtectedRoute>
                  <TellMeWhyPage />
                </ProtectedRoute>
              }
            />
            <Route
              path="/riddle"
              element={
                <ProtectedRoute>
                  <SphinxRiddlePage />
                </ProtectedRoute>
              }
            />
          </Routes>

          {/* Global Modals */}
          <GlobalModals />

          {showInstallInstructions && (
            <InstallInstructionsModal onClose={() => setShowInstallInstructions(false)} />
          )}

          {showUpdateNotification && (
            <UpdateNotification onDismiss={() => setShowUpdateNotification(false)} />
          )}
        </MusicProvider>
      </StudentProvider>
    </BrowserRouter>
  );
}
