import React from 'react';
import { Link } from 'react-router-dom';
// Removed all Firestore imports
// import { collection, query, limit, orderBy, addDoc, serverTimestamp, getCountFromServer, onSnapshot, where, writeBatch, getDocs } from 'firebase/firestore';
// import { db } from '../firebase';
import { UserRole } from '../types';
import { CATEGORIES as STATIC_CATEGORIES } from '../lib/constants'; // Renamed to avoid conflict
import { UserLink } from '../components/UI'; // Assuming UserLink does not rely on Firestore directly
import { useUI } from '../context/UIContext';
import { useAuth } from '../context/AuthContext';
import { Sidebar } from '../components/Sidebar';
import { useCategories, useThreads } from '../hooks/useForumApi'; // Import new hooks
import Shoutbox from '../components/Shoutbox'; // Import Shoutbox component
import OnlineUsers from '../components/OnlineUsers'; // Import OnlineUsers component

// Shoutbox component - Commented out for now
/*
const Shoutbox = () => {
    // ... original Shoutbox logic ...
};
*/

export const Home = () => {
  const { openProfileModal } = useUI();
  const { userProfile } = useAuth(); // userProfile now comes from backend via AuthContext

  // Fetch categories using the new hook
  const { categories, loading: categoriesLoading, error: categoriesError } = useCategories();
  const { threads, loading: threadsLoading, error: threadsError } = useThreads(); // Fetch all threads for now

  // Combine static and dynamic categories
  // Note: The structure of categories from backend might differ from STATIC_CATEGORIES
  // Need to decide how to merge or replace static categories. For now, assume backend categories are primary.
  const allForums = [...STATIC_CATEGORIES, ...(categories || [])];

  // For displaying recent threads in category section (placeholder)
  // Currently sorting all threads fetched, this could be optimized with a backend endpoint
  const recentThreads = threads ? threads.sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime()).slice(0, 5) : [];

  // Online Users - Commented out for now
  /*
  const [onlineUsers, setOnlineUsers] = useState<any[]>([]);
  useEffect(() => {
      // ... original online users logic ...
  }, []);
  */

  if (categoriesLoading || threadsLoading) {
    return <div className="max-w-[1100px] mx-auto p-2">Loading forums...</div>;
  }

  if (categoriesError || threadsError) {
    return <div className="max-w-[1100px] mx-auto p-2 text-red-500">Error loading forums: {categoriesError?.message || threadsError?.message}</div>;
  }

  return (
    <div className="max-w-[1100px] mx-auto p-2">
      <div className="flex gap-4">
        {/* Main Content */}
        <div className="flex-1 min-w-0">
           <Shoutbox />
           
           {/* Categories */}
           <table cellSpacing="1" cellPadding="4">
             <thead>
                <tr>
                    <th className="thead" colSpan={2}>Forum</th>
                    <th className="thead" width="85" align="center">Threads</th> {/* Changed from Stats */}
                    <th className="thead" width="200" align="right">Last Post / Recent Thread</th> {/* Updated title */}
                </tr>
             </thead>
             <tbody>
                {allForums.map((c: any) => { // c.id might be numeric now for backend categories
                    // The 'staff_hq' logic needs to be re-evaluated if roles are purely backend now.
                    // Assuming for now, roles are synced to userProfile correctly.
                    if (c.id === 'staff_hq' && !['Root','Admin','Mod'].includes(userProfile?.role || '')) return null;

                    const categoryThreads = threads?.filter(thread => thread.category_id === c.id);
                    const threadCount = categoryThreads?.length || 0;
                    const lastThreadInCat = categoryThreads
                        ? categoryThreads.sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime())[0]
                        : null;

                    return (
                        <tr key={c.id}>
                            <td className="trow1" width="1" align="center"><span className="text-xl opacity-50">{c.icon || '💬'}</span></td>
                            <td className="trow1">
                                <div>
                                    <Link to={`/category/${c.id}`} className="font-bold text-[13px] text-[#a8d8ff]">
                                        {c.title || c.name} {/* Use c.name for backend categories */}
                                    </Link>
                                </div>
                                <div className="text-[10px] text-textMuted">{c.description}</div>
                            </td>
                            <td className="trow2" align="center"><span className="text-[10px] text-textMuted">{threadCount}</span></td>
                            <td className="trow2" align="right">
                                {lastThreadInCat ? (
                                    <div className="text-[10px] text-textMuted">
                                        <Link to={`/thread/${lastThreadInCat.id}`} className="text-[#a8d8ff] hover:underline">
                                            {lastThreadInCat.title}
                                        </Link>
                                        <br />
                                        by <UserLink name={lastThreadInCat.username} role={UserRole.USER} /> {/* Role might need to come from backend UserProfile */}
                                        <br />
                                        {new Date(lastThreadInCat.created_at).toLocaleString()}
                                    </div>
                                ) : (
                                    <span className="text-[10px] text-textMuted">No threads yet</span>
                                )}
                            </td>
                        </tr>
                    );
                })}
             </tbody>
           </table>

           <OnlineUsers />
        </div>

        {/* New Sidebar */}
        <Sidebar />
      </div>
    </div>
  );
};