
import React, { useState, useEffect } from 'react';
import { useParams, Link, useNavigate } from 'react-router-dom';
// Removed all Firestore imports
// import { doc, getDoc, collection, addDoc, serverTimestamp, updateDoc, increment, deleteDoc, runTransaction, onSnapshot, query, where, orderBy } from 'firebase/firestore';
// import { db } from '../firebase';
import { useAuth } from '../context/AuthContext';
import { useUI } from '../context/UIContext';
import { UserRole, Thread as IThread, Post as IPost, UserProfile } from '../types'; // IReply is now IPost
import { CATEGORIES } from '../lib/constants'; // Potentially remove or update based on new category fetching
import { Button, UserLink, formatDate, RankBadge, Skeleton, UserAvatar, Inventory } from '../components/UI';
import BBCodeParser from '../components/RichText';
import { ReportModal } from '../components/ReportModal';
import { useUserActions } from '../hooks/useUserActions'; // This hook will need refactoring later
import { useThread, usePosts } from '../hooks/useForumApi'; // Import new hooks

interface PostBitProps {
  post: IThread | IPost; // Can be a thread (OP) or a post (reply)
  isOp?: boolean;
  onAction?: (action: string, postId: number) => void; // Example action prop
  deleteCallback: (postId: number, isOp: boolean) => void;
  onReport: (id: number, type: 'thread' | 'reply') => void;
  onWarn: (firebase_uid: string) => void;
  canWarn: boolean;
  hiddenContent?: boolean;
  authorProfile: UserProfile; // Pass author profile directly
}

const PostBit = ({ post, isOp = false, deleteCallback, onReport, onWarn, canWarn, hiddenContent, authorProfile }: PostBitProps) => {
  const { openProfileModal } = useUI();
  const { user, userProfile: myProfile } = useAuth(); // myProfile is the authenticated user's profile from backend

  const uid = authorProfile?.firebase_uid; // Assuming firebase_uid is available in authorProfile
  const fallbackName = authorProfile?.username || 'Unknown';

  const isMine = user?.uid === uid;
  const trustScore = authorProfile?.reputation || 0; // Using reputation as trustScore

  let trustColor = 'text-gray-500';
  let trustBarColor = 'bg-gray-500';
  if (trustScore > 0) { trustColor = 'text-green-500'; trustBarColor = 'bg-green-500'; }
  if (trustScore > 50) { trustColor = 'text-cyan-400 drop-shadow-[0_0_5px_rgba(34,211,238,0.5)]'; trustBarColor = 'bg-cyan-400 shadow-[0_0_5px_rgba(34,211,238,0.5)]'; }
  if (trustScore < 0) { trustColor = 'text-red-500'; trustBarColor = 'bg-red-500'; }


  return (
    <table cellSpacing="1" cellPadding="0" className="w-full mb-4 border border-black bg-black">
        <thead>
            <tr>
                <td className="thead bg-thead-grad text-xs px-2 py-1 flex justify-between">
                    <span>{formatDate(post.created_at)}</span>
                    <span className="font-normal opacity-50">#{post.id}</span> {/* Using numeric ID directly */}
                </td>
            </tr>
        </thead>
        <tbody>
            <tr className="bg-trow1">
               {/* User Info Column */}
               <td className="align-top w-[180px] p-2 border-r border-black bg-[#1f1f1f] text-center">
                   <div className="flex flex-col items-center gap-1">
                       <UserLink name={authorProfile?.username || fallbackName} role={authorProfile?.role || UserRole.USER} className="text-sm font-bold" onClick={() => uid && openProfileModal(uid)} />
                       <span className="text-[10px] text-textMuted">{authorProfile?.role || 'User'}</span>
                       <UserAvatar url={authorProfile?.avatarUrl} name={fallbackName} className="w-24 h-24 my-1" />
                       <RankBadge postCount={authorProfile?.postCount || 0} />
                       
                       {/* Trust Score */}
                       <div className="w-full px-2 mt-2">
                           <div className="flex justify-between text-[9px] font-bold mb-1 font-tahoma">
                               <span className="text-textMuted">Trust</span>
                               <span className={trustColor}>{trustScore >= 0 ? '+' : ''}{trustScore}</span>
                           </div>
                           <div className="w-full h-1 bg-[#111] border border-[#333]">
                               <div className={`h-full ${trustBarColor}`} style={{ width: `${Math.min(Math.abs(trustScore), 100)}%` }}></div> {/* Trust bar width based on absolute value */}
                           </div>
                       </div>

                       <div className="text-[9px] text-left w-full mt-2 pl-2 space-y-0.5 text-textMuted">
                           <div>Posts: {authorProfile?.postCount || 0}</div>
                           <div>Reputation: <span className={authorProfile.reputation >= 0 ? 'text-green-500' : 'text-red-500'}>{authorProfile.reputation || 0}</span></div>
                           <div>Credits: <span className="text-accent">{authorProfile?.credits || 0}</span></div>
                           <div>Joined: {authorProfile?.createdAt ? new Date(authorProfile.createdAt).toLocaleDateString() : 'N/A'}</div>
                           {authorProfile?.role === UserRole.BANNED && <div className="text-red-500 font-bold mt-1">BANNED</div>}
                       </div>
                       
                       {/* Medal Display */}
                       <div className="w-full px-2 mt-2">
                           {/* Assuming inventory is part of UserProfile from backend */}
                           <Inventory items={authorProfile?.inventory} /> 
                       </div>
                   </div>
               </td>
               
               {/* Post Content Column */}
               <td className="align-top p-4 bg-[#262626] min-h-[150px]">
                   {hiddenContent ? (
                       <div className="border border-purple-500/50 bg-purple-900/10 p-6 text-center">
                           <div className="text-purple-400 font-bold text-lg mb-2">🔒 HIDDEN CONTENT</div>
                           <p className="text-textMuted text-xs">You must <span className="text-white font-bold">REPLY</span> to this thread to see this content.</p>
                       </div>
                   ) : (
                       <>
                           <div className="text-xs text-[#ddd] min-h-[100px]">
                               <BBCodeParser content={post.content} />
                           </div>
                           
                           {authorProfile?.signature && ( // Assuming signature is part of UserProfile
                               <div className="mt-8 pt-2 border-t border-[#444] text-[10px] opacity-70">
                                   <BBCodeParser content={authorProfile.signature} />
                               </div>
                           )}
                       </>
                   )}
               </td>
            </tr>
            {/* Post Footer / Actions */}
            <tr className="bg-trow2">
                <td className="border-r border-black"></td>
                <td className="p-1 flex justify-end gap-2">
                    {user && !isMine && <Button className="text-[10px]" onClick={() => onReport(post.id, isOp ? 'thread' : 'reply')}>Report</Button>}
                    {canWarn && !isMine && uid && <Button variant="danger" className="text-[10px]" onClick={() => onWarn(uid)}>Warn</Button>}
                    <Button className="text-[10px]" onClick={() => {}}>Quote</Button>
                    {(isMine || ['Root','Admin'].includes(myProfile?.role || '')) && (
                        <Button variant="danger" className="text-[10px]" onClick={() => deleteCallback(post.id, isOp)}>Delete</Button>
                    )}
                </td>
            </tr>
        </tbody>
    </table>
  );
};

export const Thread = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const { user, userProfile } = useAuth();
  const { warnUser } = useUserActions(); // This hook will need refactoring later
  
  // Use new hooks
  const { thread, loading: threadLoading, error: threadError } = useThread(id);
  const { posts: replies, loading: repliesLoading, error: repliesError, createPost: apiCreatePost, deletePost: apiDeletePost } = usePosts(id);

  const [replyContent, setReplyContent] = useState('');

  // Reporting State
  const [reportModalOpen, setReportModalOpen] = useState(false);
  const [reportTarget, setReportTarget] = useState<{id: number, type: 'thread' | 'reply'} | null>(null);

  // If thread is not found or error, handle redirect/message
  useEffect(() => {
    if (!threadLoading && !thread && !threadError) {
      // If thread not found, maybe navigate to a 404 page or home
      navigate('/'); // Redirect to home for now
    }
  }, [threadLoading, thread, threadError, navigate]);


  const handleReply = async () => {
      if (!user || !replyContent || !thread?.id) return; // Ensure thread.id is available
      if (userProfile?.role === UserRole.BANNED) { alert("Banned users cannot reply."); return; }

      try {
          await apiCreatePost(thread.id, replyContent); // Use createPost from usePosts hook
          setReplyContent('');
      } catch (e: any) {
          console.error("Failed to create post:", e);
          alert(`Failed to post reply: ${e.response?.data?.message || e.message}`);
      }
  };

  const handleDelete = async (postId: number, isOp: boolean) => {
     if(!confirm("Are you sure?")) return;
     try {
        if(isOp && thread?.id) { // Deleting the original thread
            // This would require a deleteThread function from useThreads, or a direct API call
            // For now, let's assume useThreads hook is available and provides deleteThread
            // (useThreads does provide deleteThread, so we need to get it via useThreads in this component or pass from parent)
            // For simplicity here, we'll just navigate away if successful
            await api.delete(`/api/forum/threads/${postId}`); // Direct API call for thread deletion
            navigate('/'); // Navigate after deleting the thread
        } else { // Deleting a reply/post
            await apiDeletePost(postId); // Use deletePost from usePosts hook
        }
     } catch (e: any) {
        console.error("Failed to delete post/reply:", e);
        alert(`Failed to delete: ${e.response?.data?.message || e.message}`);
     }
  };

  const handleWarn = async (targetFirebaseUid: string) => {
      const reason = prompt("Enter warning reason:");
      if (!reason) return;
      try {
          await warnUser(targetFirebaseUid, reason); // warnUser from useUserActions needs backend implementation
          alert("User warned.");
      } catch(e: any) { 
          console.error("Failed to warn:", e);
          alert(`Failed to warn: ${e.response?.data?.message || e.message}`); 
      }
  };

  if (threadLoading || repliesLoading) return <div className="p-10"><Skeleton className="h-20 w-full" /></div>;
  if (threadError) return <div className="p-10 text-red-500">Error loading thread: {threadError.message}</div>;

  if (!thread) return null; // Should be handled by useEffect redirect, but for TS safety

  const isStaff = userProfile && ['Root', 'Admin', 'Mod'].includes(userProfile.role);
  // Assuming thread.user_id is the primary key of the author in PostgreSQL users table
  const isAuthor = userProfile?.uid === thread.firebase_uid; // Compare with firebase_uid from userProfile
  const hasReplied = replies.some(r => r.firebase_uid === userProfile?.uid); // Compare with firebase_uid from userProfile
  const shouldHideContent = thread.isHidden && !isAuthor && !hasReplied && !isStaff;

  const renderPrefix = (prefix?: string) => {
      if (!prefix) return null;
      let style = "bg-gray-700 text-gray-300";
      if (prefix === 'WTS') style = "bg-green-900/50 border border-green-500 text-green-400";
      if (prefix === 'WTB') style = "bg-blue-900/50 border border-blue-500 text-blue-400";
      if (prefix === 'LEAK') style = "bg-red-900/50 border border-red-500 text-red-400";
      return <span className={`text-[10px] px-1 rounded font-bold mr-2 align-middle ${style}`}>{prefix}</span>;
  };

  return (
    <div className="max-w-[950px] mx-auto p-2">
       <div className="text-xs text-textMuted mb-2">
           <Link to="/">xBOARD</Link> / {renderPrefix(thread.prefix)} {thread.title}
       </div>
       
       <PostBit 
           post={thread} 
           isOp={true} 
           deleteCallback={(postId) => handleDelete(postId as number, true)} // Cast to number
           onReport={(tid: number, type: 'thread') => { setReportTarget({id: tid, type}); setReportModalOpen(true); }} 
           canWarn={isStaff}
           onWarn={handleWarn}
           hiddenContent={shouldHideContent}
           authorProfile={thread.authorProfile} // Pass author profile from thread data
       />
       
       {replies.map(r => (
           <PostBit 
               key={r.id} 
               post={r} 
               deleteCallback={(postId) => handleDelete(postId as number, false)} // Cast to number
               onReport={(pid: number, type: 'reply') => { setReportTarget({id: pid, type}); setReportModalOpen(true); }} 
               canWarn={isStaff}
               onWarn={handleWarn}
               authorProfile={r.authorProfile} // Pass author profile from post data
           />
       ))}

       {user ? (
           <div className="border border-black bg-trow1 mt-4">
               <div className="bg-thead-grad text-white text-xs font-bold px-2 py-1">Quick Reply</div>
               <div className="p-2">
                   <textarea className="w-full h-32" value={replyContent} onChange={e => setReplyContent(e.target.value)}></textarea>
                   <div className="mt-1">
                       <Button variant="primary" onClick={handleReply}>Post Reply</Button>
                   </div>
               </div>
           </div>
       ) : (
           <div className="text-center text-xs p-4 border border-black bg-trow1">Please login to reply.</div>
       )}

       {reportTarget && (
           <ReportModal 
               isOpen={reportModalOpen} 
               onClose={() => setReportModalOpen(false)} 
               targetId={reportTarget.id} 
               targetType={reportTarget.type} 
           />
       )}
    </div>
  );
};
