import React, { useState, useMemo, useEffect } from 'react';
import { useParams, Link } from 'react-router-dom';
// Removed all Firestore imports
// import { collection, addDoc, serverTimestamp, where, doc, getDoc } from 'firebase/firestore';
// import { db } from '../firebase';
import { useAuth } from '../context/AuthContext';
import { useUI } from '../context/UIContext';
import { UserRole, Thread } from '../types'; // Thread interface should match backend response
import { CATEGORIES as STATIC_CATEGORIES } from '../lib/constants'; // Renamed to avoid conflict
import { Button, Panel, UserLink, formatDate } from '../components/UI';
import { useCategory, useThreads } from '../hooks/useForumApi'; // Import new hooks

export const Category = () => {
  const { id } = useParams();
  const { user, userProfile } = useAuth();
  const { openAuthModal, openProfileModal } = useUI();
  
  const [isCreating, setIsCreating] = useState(false);
  const [newTitle, setNewTitle] = useState('');
  const [newContent, setNewContent] = useState('');
  const [newPrefix, setNewPrefix] = useState('');
  const [newIsHidden, setNewIsHidden] = useState(false);

  // Use the new useCategory hook
  const { category: dynamicCategory, loading: categoryLoading } = useCategory(id);
  const staticCategory = STATIC_CATEGORIES.find(c => String(c.id) === id); // Ensure comparison is type-safe
  
  // Prioritize staticCategory if found, otherwise use dynamic
  const category = staticCategory || dynamicCategory;

  // Use the new useThreads hook
  const { threads: rawThreads, loading: threadsLoading, createThread: apiCreateThread } = useThreads(id);

  const isRichClub = id === 'rich_club';
  const isStaffHQ = id === 'staff_hq';
  const isMarketplace = id === 'marketplace';
  
  const hasAccess = userProfile && (
    (isRichClub && ['Root', 'Admin', 'Rich', 'Elite'].includes(userProfile.role)) ||
    (isStaffHQ && ['Root', 'Admin', 'Mod'].includes(userProfile.role)) ||
    (!isRichClub && !isStaffHQ)
  );

  const threads = useMemo(() => {
    // rawThreads are already filtered by categoryId from useThreads hook
    if (!rawThreads) return [];

    return [...rawThreads].sort((a: any, b: any) => {
      // Assuming isSticky is a property from backend thread model
      if (a.isSticky && !b.isSticky) return -1;
      if (!a.isSticky && b.isSticky) return 1;
      // Use direct created_at/updated_at from backend (ISO string or similar)
      const timeA = new Date(a.updated_at || a.created_at).getTime();
      const timeB = new Date(b.updated_at || b.created_at).getTime();
      return timeB - timeA; 
    });
  }, [rawThreads]);

  const handleCreateThread = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user) return openAuthModal();
    
    if (userProfile?.role === UserRole.BANNED) {
      alert("You are BANNED and cannot create new threads.");
      return;
    }

    if (!category?.id) {
        alert("Category ID not found.");
        return;
    }

    try {
      await apiCreateThread(
        category.id, // category_id is expected by backend
        newTitle,
        newContent
      );
      setIsCreating(false);
      setNewTitle('');
      setNewContent('');
      setNewPrefix('');
      setNewIsHidden(false);
    } catch (e: any) {
      console.error(e);
      alert(`Failed to create thread: ${e.response?.data?.message || e.message}`);
    }
  };

  if (categoryLoading || threadsLoading) { // Combined loading states
    return <div className="p-20 text-center font-mono">Loading...</div>;
  }
  
  if (!category) return <div className="p-20 text-center font-mono text-red-500">Category not found.</div>;
  
  if (!hasAccess) {
      return (
          <div className="p-20 text-center">
              <div className="text-4xl mb-4">🚫</div>
              <h1 className="text-xl font-bold text-red-500 mb-2">ACCESS DENIED</h1>
              <p className="text-textMuted">You do not have permission to view this forum.</p>
              {isRichClub && <p className="text-sm mt-4"><Link to="/upgrade" className="text-yellow-400 hover:underline">Purchase Rich or Elite Status</Link> to gain entry.</p>}
          </div>
      );
  }

  const renderPrefix = (prefix?: string) => {
      if (!prefix) return null;
      let style = "bg-gray-700 text-gray-300";
      if (prefix === 'WTS') style = "bg-green-900/50 border border-green-500 text-green-400";
      if (prefix === 'WTB') style = "bg-blue-900/50 border border-blue-500 text-blue-400";
      if (prefix === 'LEAK') style = "bg-red-900/50 border border-red-500 text-red-400";
      return <span className={`text-[9px] px-1 rounded font-bold mr-1 ${style}`}>{prefix}</span>;
  };

  return (
    <div className="max-w-5xl mx-auto p-4">
      <div className="flex justify-between items-center mb-4 border-b border-border pb-2">
        <div className="text-xs text-textMuted">
          <Link to="/" className="hover:text-accent hover:underline">xBOARD</Link>
          {' / '}
          <span className={`font-bold ${isRichClub ? 'text-yellow-400' : 'text-textMain'}`}>{category.title || category.name}</span> {/* Use category.name for backend */}
        </div>
        {user ? (
          <Button variant="primary" onClick={() => setIsCreating(true)} className="shadow-[0_0_10px_rgba(88,166,255,0.3)]">
            + New Thread
          </Button>
        ) : (
          <Button onClick={openAuthModal} disabled className="opacity-50 cursor-not-allowed">Login to Post</Button>
        )}
      </div>

      <Panel title={`Threads in ${category.title || category.name}`}> {/* Use category.name for backend */}
        <table className="w-full text-sm">
          <thead>
            <tr className="bg-gradient-to-b from-[#252f3d] to-[#1a222d] border-b border-black text-xs font-bold">
              <th className="p-2 text-left w-[60%]">Thread / Thread Starter</th>
              <th className="p-2 text-center w-[15%]">Replies</th>
              <th className="p-2 text-right w-[25%]">Last Post</th>
            </tr>
          </thead>
          <tbody>
            {(threadsLoading || categoryLoading) ? ( // Use combined loading state
              <tr><td colSpan={3} className="p-8 text-center text-textMuted">Loading...</td></tr>
            ) : threads.length === 0 ? (
              <tr><td colSpan={3} className="p-8 text-center text-textMuted">No threads in this forum.</td></tr>
            ) : (
              threads.map((t: any, i: number) => {
                // Assuming t.user_id is the primary key of the user in your backend DB
                // t.username is coming from the join
                // t.firebase_uid might also be present if joined in backend
                const tName = t.username || 'Unknown'; 
                
                return (
                  <tr key={t.id} className={i % 2 === 0 ? 'bg-[#1a2029] hover:bg-[#202630]' : 'bg-[#161b22] hover:bg-[#202630]'}>
                    <td className="p-3">
                      <div className="flex items-center gap-2">
                          {renderPrefix(t.prefix)}
                          {t.isSticky && <span className="bg-yellow-600 text-white text-[9px] px-1 rounded font-bold">STICKY</span>}
                          {t.isLocked && <span className="bg-red-600 text-white text-[9px] px-1 rounded font-bold">LOCKED</span>}
                          {t.isHidden && <span className="text-[9px] px-1 rounded font-bold bg-purple-900/50 border border-purple-500 text-purple-400">HIDDEN</span>}
                          <Link
                          to={`/thread/${t.id}`}
                          className={`font-bold text-md hover:underline block truncate ${t.isSticky ? 'text-yellow-400' : 'text-textMain hover:text-accent'}`}
                          >
                          {t.title}
                          </Link>
                      </div>
                      <div className="text-xs text-textMuted mt-1">
                        Started by <UserLink name={tName} role={UserRole.USER} onClick={() => { /* openProfileModal(t.user_id or firebase_uid) */ }} />
                      </div>
                    </td>
                    <td className="p-3 text-center text-textMuted">{t.replyCount}</td> {/* replyCount might need to be calculated or fetched from backend */}
                    <td className="p-3 text-right text-xs">
                      <div className="text-textMuted">{formatDate(t.updated_at || t.created_at)}</div> {/* Use updated_at from backend */}
                    </td>
                  </tr>
                );
              })
            )}
          </tbody>
        </table>
      </Panel>

      {isCreating && (
        <div className="fixed inset-0 bg-black/90 flex items-center justify-center z-50 p-4 backdrop-blur-sm">
          <div className="bg-panel border border-accent w-full max-w-2xl shadow-xl">
            <Panel title="Post New Thread">
              <form onSubmit={handleCreateThread} className="p-4 flex flex-col gap-4">
                <div className="flex gap-2">
                    {isMarketplace && (
                        <select className="bg-background border border-border p-3 text-sm" value={newPrefix} onChange={e => setNewPrefix(e.target.value)}>
                            <option value="">No Prefix</option>
                            <option value="WTS">WTS (Selling)</option>
                            <option value="WTB">WTB (Buying)</option>
                            <option value="LEAK">LEAK</option>
                        </select>
                    )}
                    <input
                      className="flex-1 bg-background border border-border p-3 text-sm text-textMain focus:border-accent outline-none font-bold"
                      placeholder="Thread Title"
                      required
                      value={newTitle}
                      onChange={e => setNewTitle(e.target.value)}
                    />
                </div>
                
                <div className="flex items-center gap-2 text-xs text-textMuted">
                    <input type="checkbox" id="hideContent" checked={newIsHidden} onChange={e => setNewIsHidden(e.target.checked)} />
                    <label htmlFor="hideContent">Hide content until user replies ("Reply to See")</label>
                </div>

                <textarea
                  className="w-full bg-background border border-border p-3 text-sm text-textMain focus:border-accent outline-none min-h-[200px]"
                  placeholder="Content (BBCode Supported)"
                  required
                  value={newContent}
                  onChange={e => setNewContent(e.target.value)}
                />
                <div className="flex justify-end gap-2 border-t border-border pt-4">
                  <Button type="button" onClick={() => setIsCreating(false)}>Cancel</Button>
                  <Button type="submit" variant="primary">Post</Button>
                </div>
              </form>
            </Panel>
          </div>
        </div>
      )}
    </div>
  );
};