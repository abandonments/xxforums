
import React, { createContext, useState, useContext } from 'react';

interface UIContextType {
  isAuthModalOpen: boolean;
  openAuthModal: () => void;
  closeAuthModal: () => void;
  viewingProfileId: string | null;
  openProfileModal: (uid: string) => void;
  closeProfileModal: () => void;
}

const UIContext = createContext<UIContextType | undefined>(undefined);

export const UIProvider = ({ children }: { children?: React.ReactNode }) => {
  const [isAuthModalOpen, setIsAuthModalOpen] = useState(false);
  const [viewingProfileId, setViewingProfileId] = useState<string | null>(null);

  return (
    <UIContext.Provider
      value={{
        isAuthModalOpen,
        openAuthModal: () => setIsAuthModalOpen(true),
        closeAuthModal: () => setIsAuthModalOpen(false),
        viewingProfileId,
        openProfileModal: (uid: string) => setViewingProfileId(uid),
        closeProfileModal: () => setViewingProfileId(null),
      }}
    >
      {children}
    </UIContext.Provider>
  );
};

export const useUI = () => {
  const context = useContext(UIContext);
  if (!context) throw new Error('useUI must be used within UIProvider');
  return context;
};
