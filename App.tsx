import React, { useState, useEffect, Suspense } from 'react';
import { BrowserRouter, Routes, Route, useLocation } from 'react-router-dom';
import { SudokuGame } from './games/Sudoku/SudokuGame';
import GearsGamePage from './src/pages/games/GearsGame/GearsGamePage';
import ReactGA from 'react-ga4';
import { StudentProvider } from '@/src/contexts/StudentContext';
import { MusicProvider } from '@/src/contexts/MusicContext';
import { ProtectedRoute } from '@/src/components/ProtectedRoute';
import { UpdateNotification } from '@/src/components/UpdateNotification';
import { GachaModal } from '@/src/components/GachaModal';
import { UPDATE_AVAILABLE_EVENT, UPDATE_CHECK_COMPLETE_EVENT, checkUpdateSuccess } from '@/services/updateService';
import { initializeTheme } from '@/services/themeService';
import { useStudent, useStudentActions } from '@/src/contexts/StudentContext';
import { X, Download, Loader2, CheckCircle } from 'lucide-react';

// Lazy load pages for performance
const HomePage = React.lazy(() => import('@/src/pages/HomePage').then(module => ({ default: module.HomePage })));
const ModeSelectionPage = React.lazy(() => import('@/src/pages/ModeSelectionPage').then(module => ({ default: module.ModeSelectionPage })));
const StudyPage = React.lazy(() => import('@/src/pages/StudyPage').then(module => ({ default: module.StudyPage })));
const GamePage = React.lazy(() => import('@/src/pages/GamePage').then(module => ({ default: module.GamePage })));
const ProfilePage = React.lazy(() => import('@/src/pages/ProfilePage').then(module => ({ default: module.ProfilePage })));
const ShopPage = React.lazy(() => import('@/src/pages/ShopPage').then(module => ({ default: module.ShopPage })));
const AlbumPage = React.lazy(() => import('@/src/pages/AlbumPage').then(module => ({ default: module.AlbumPage })));
const TellMeWhyPage = React.lazy(() => import('@/src/pages/TellMeWhyPage').then(module => ({ default: module.TellMeWhyPage })));
const SphinxRiddlePage = React.lazy(() => import('@/src/pages/SphinxRiddlePage').then(module => ({ default: module.SphinxRiddlePage })));
const HallOfFamePage = React.lazy(() => import('@/src/pages/HallOfFamePage').then(module => ({ default: module.HallOfFamePage })));
const KidCoderPage = React.lazy(() => import('@/src/pages/KidCoderPage').then(module => ({ default: module.KidCoderPage })));
const SolarSystemPage = React.lazy(() => import('@/src/pages/SolarSystemPage').then(module => ({ default: module.SolarSystemPage })));
const ScienceMenuPage = React.lazy(() => import('@/src/pages/ScienceMenuPage').then(module => ({ default: module.ScienceMenuPage })));
const PeriodicTablePage = React.lazy(() => import('@/src/pages/PeriodicTablePage').then(module => ({ default: module.PeriodicTablePage })));
const ElectricityPage = React.lazy(() => import('@/src/pages/ElectricityPage').then(module => ({ default: module.ElectricityPage })));
const CellBiologyPage = React.lazy(() => import('@/src/pages/science/CellBiologyPage').then(module => ({ default: module.CellBiologyPage })));
const EvolutionTreePage = React.lazy(() => import('@/src/pages/science/EvolutionTreePage').then(module => ({ default: module.EvolutionTreePage })));
const SpeedMathGame = React.lazy(() => import('./games/SpeedMath/SpeedMathGame').then(module => ({ default: module.SpeedMathGame })));


// Initialize Google Analytics
ReactGA.initialize('G-KS48DHBY4L');

// Component to track page views
const PageViewTracker = () => {
  const location = useLocation();

  useEffect(() => {
    ReactGA.send({ hitType: "pageview", page: location.pathname + location.search });
    window.scrollTo(0, 0); // Scroll to top on route change
  }, [location]);

  return null;
};

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

// Update Success Toast Component
const UpdateSuccessToast = ({ onClose }: { onClose: () => void }) => {
  useEffect(() => {
    const timer = setTimeout(onClose, 5000);
    return () => clearTimeout(timer);
  }, [onClose]);

  return (
    <div className="fixed top-6 left-1/2 -translate-x-1/2 z-[70] animate-slideDown">
      <div className="bg-green-500 text-white px-6 py-4 rounded-full shadow-lg flex items-center gap-3">
        <CheckCircle size={24} className="text-white" />
        <div>
          <h3 className="font-bold text-lg">Cập nhật thành công!</h3>
          <p className="text-green-100 text-sm">Chào mừng bạn đến với phiên bản mới.</p>
        </div>
        <button
          onClick={onClose}
          className="ml-2 bg-white/20 hover:bg-white/30 p-1 rounded-full transition-colors"
        >
          <X size={16} />
        </button>
      </div>
      <style>{`
                @keyframes slideDown {
                    from { transform: translate(-50%, -100%); opacity: 0; }
                    to { transform: translate(-50%, 0); opacity: 1; }
                }
                .animate-slideDown { animation: slideDown 0.5s cubic-bezier(0.34, 1.56, 0.64, 1); }
            `}</style>
    </div>
  );
};

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
  const [showUpdateSuccess, setShowUpdateSuccess] = useState(false);

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

    // Check for update success flag
    if (checkUpdateSuccess()) {
      setShowUpdateSuccess(true);
    }

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
      <PageViewTracker />
      <StudentProvider>
        <MusicProvider>
          <Suspense fallback={
            <div className="min-h-screen flex items-center justify-center bg-cyan-50">
              <Loader2 className="w-12 h-12 text-blue-500 animate-spin" />
              <span className="ml-3 text-lg font-bold text-blue-600">Đang tải...</span>
            </div>
          }>
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
              <Route
                path="/hall-of-fame"
                element={
                  <ProtectedRoute>
                    <HallOfFamePage />
                  </ProtectedRoute>
                }
              />
              <Route
                path="/coding"
                element={
                  <ProtectedRoute>
                    <KidCoderPage />
                  </ProtectedRoute>
                }
              />
              <Route path="/games/speed-math" element={<ProtectedRoute><SpeedMathGame difficulty="easy" onBack={() => window.history.back()} onComplete={() => { }} /></ProtectedRoute>} />
              <Route path="/games/gears" element={<ProtectedRoute><GearsGamePage /></ProtectedRoute>} />
              <Route
                path="/science"
                element={
                  <ProtectedRoute>
                    <ScienceMenuPage />
                  </ProtectedRoute>
                }
              />
              <Route
                path="/science/solar-system"
                element={
                  <ProtectedRoute>
                    <SolarSystemPage />
                  </ProtectedRoute>
                }
              />
              <Route
                path="/science/periodic-table"
                element={
                  <ProtectedRoute>
                    <PeriodicTablePage />
                  </ProtectedRoute>
                }
              />
              <Route
                path="/science/electricity"
                element={
                  <ProtectedRoute>
                    <ElectricityPage />
                  </ProtectedRoute>
                }
              />
              <Route
                path="/science/cell-biology"
                element={
                  <ProtectedRoute>
                    <CellBiologyPage />
                  </ProtectedRoute>
                }
              />
              <Route
                path="/science/evolution"
                element={
                  <ProtectedRoute>
                    <EvolutionTreePage />
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

            {showUpdateSuccess && (
              <UpdateSuccessToast onClose={() => setShowUpdateSuccess(false)} />
            )}
          </Suspense>
        </MusicProvider>
      </StudentProvider>
    </BrowserRouter>
  );
}
