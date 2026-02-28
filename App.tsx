import React, { useEffect, useState, Suspense, lazy } from 'react';
import { HashRouter, Routes, Route } from 'react-router-dom';
import { AuthProvider, useAuth } from './context/AuthContext';
import { UIProvider } from './context/UIContext';
import { SocketProvider, useSocket } from './context/SocketContext';
import { Navbar } from './components/Navbar';
import { AuthModal } from './components/AuthModal';
import { UserProfileModal } from './components/UserProfileModal';
import { ToastContainer, toast } from 'react-toastify';

const Home = lazy(() => import('./pages/Home'));
const Category = lazy(() => import('./pages/Category'));
const Thread = lazy(() => import('./pages/Thread'));
const Admin = lazy(() => import('./pages/Admin'));
const Inbox = lazy(() => import('./pages/Inbox'));
const EscrowDashboard = lazy(() => import('./pages/EscrowDashboard'));
const EscrowDetail = lazy(() => import('./pages/EscrowDetail'));
const MemberList = lazy(() => import('./pages/MemberList'));
const Search = lazy(() => import('./pages/Search'));
const Calendar = lazy(() => import('./pages/Calendar'));
const Upgrade = lazy(() => import('./pages/Upgrade'));
const ModQueue = lazy(() => import('./pages/ModQueue'));

const NotificationListener = () => {
    const { socket } = useSocket();
    
    useEffect(() => {
        if (!socket) return;

        const handleNewNotification = (data: any) => {
            try {
                const audio = new Audio("https://assets.mixkit.co/active_storage/sfx/2869/2869-preview.mp3");
                audio.volume = 0.5;
                audio.play().catch(e => console.warn("Audio play failed (interaction required)", e));
            } catch (e) { console.error(e); }

            toast.info(
                <div className="flex flex-col">
                    <span className="font-bold text-accent uppercase text-xs mb-1">{data.type} Notification</span>
                    <span className="text-xs text-white">{data.message || "You have a new notification."}</span>
                </div>
            , {
                position: "bottom-right",
                autoClose: 5000,
                hideProgressBar: false,
                closeOnClick: true,
                pauseOnHover: true,
                draggable: true,
                theme: "dark",
                style: {
                    background: '#121212',
                    border: '1px solid #67e8f9',
                    color: '#e4e4e7',
                    fontFamily: 'Verdana, sans-serif',
                    fontSize: '11px'
                }
            });
        };

        socket.on('newNotification', handleNewNotification);

        return () => {
            socket.off('newNotification', handleNewNotification);
        };
    }, [socket]);

    return null;
};

const BroadcastBanner = () => {
    const { socket } = useSocket();
    const [alert, setAlert] = useState<{message: string, type: 'info' | 'warning' | 'emergency', isActive: boolean} | null>(null);

    useEffect(() => {
        if (!socket) return;

        const handleGlobalBroadcast = (data: any) => {
            setAlert(data);
        };

        socket.on('globalBroadcast', handleGlobalBroadcast);

        // Fetch initial broadcast state (optional, can be handled by backend sending on connect)
        // For now, we'll rely on the backend to send the current broadcast on connect.

        return () => {
            socket.off('globalBroadcast', handleGlobalBroadcast);
        };
    }, [socket]);

    if (!alert || !alert.isActive) return null;

    let styles = "bg-accent/10 border-b border-accent text-accent";
    if (alert.type === 'warning') styles = "bg-yellow-900/20 border-b border-yellow-500 text-yellow-500";
    if (alert.type === 'emergency') styles = "bg-[#7f1d1d] border-b border-white text-white animate-pulse font-bold tracking-widest";

    return (
        <div className={`w-full py-2 px-4 text-center text-xs ${styles} font-mono shadow-md z-50`}>
             [SYSTEM BROADCAST] {alert.message}
        </div>
    );
};

const Layout = ({ children }: { children?: React.ReactNode }) => {
    useEffect(() => {
      const link = document.createElement("link");
      link.rel = "stylesheet";
      link.href = "https://cdn.jsdelivr.net/npm/react-toastify@9.1.3/dist/ReactToastify.css";
      document.head.appendChild(link);
      return () => { document.head.removeChild(link); };
  }, []);

  return (
    <div className="min-h-screen pb-10 bg-background text-textMain font-sans selection:bg-accent selection:text-white">
        <BroadcastBanner />
        <Navbar />
        <NotificationListener />
        {children}
        <AuthModal />
        <UserProfileModal />
        <ToastContainer toastClassName="!bg-[#121212] !border !border-accent !text-white !font-sans !text-xs" />
    </div>
  );
};

const App = () => {
  return (
    <HashRouter>
      <SocketProvider>
        <AuthProvider>
          <UIProvider>
            <Layout>
              <Suspense fallback={<div>Loading...</div>}>
                <Routes>
                  <Route path="/" element={<Home />} />
                  <Route path="/category/:id" element={<Category />} />
                  <Route path="/thread/:id" element={<Thread />} />
                  <Route path="/admin" element={<Admin />} />
                  <Route path="/modcp" element={<ModQueue />} />
                  <Route path="/inbox" element={<Inbox />} />
                  <Route path="/escrow" element={<EscrowDashboard />} />
                  <Route path="/escrow/:id" element={<EscrowDetail />} />
                  <Route path="/members" element={<MemberList />} />
                  <Route path="/search" element={<Search />} />
                  <Route path="/calendar" element={<Calendar />} />
                  <Route path="/upgrade" element={<Upgrade />} />
                </Routes>
              </Suspense>
            </Layout>
          </UIProvider>
        </AuthProvider>
      </SocketProvider>
    </HashRouter>
  );
};

export default App;