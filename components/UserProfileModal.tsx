import React, { useState, useEffect, useRef, useCallback } from 'react';
import { useUI } from '../context/UIContext';
import { useAuth } from '../context/AuthContext';
// Removed all Firestore imports and db/auth imports except for sendPasswordResetEmail
// import { doc, getDoc, collection, query, where, onSnapshot, addDoc, deleteDoc, serverTimestamp, runTransaction, increment, updateDoc } from 'firebase/firestore';
import { sendPasswordResetEmail } from 'firebase/auth'; // Keep Firebase Auth client-side function
import { auth } from '../firebase'; // Keep auth for sendPasswordResetEmail
import { Button, RoleBadge, UserLink, formatDate, Inventory } from './UI';
import BBCodeParser from './RichText';
import { UserRole, UserProfile as IUserProfile } from '../types'; // Using IUserProfile for clarity
import { uploadImage } from '../lib/upload'; // This will need to be refactored to use backend
import { BADGE_INFO } from '../lib/constants';
import { useUserActions } from '../hooks/useUserActions';
import api from '../lib/api'; // Import the configured Axios instance

// --- Profile Music Component ---
const ProfileMusic = ({ url, autoplay }: { url: string; autoplay: boolean }) => {
    const [muted, setMuted] = useState(true);
    const audioRef = useRef<HTMLAudioElement | null>(null);
    const [isYoutube, setIsYoutube] = useState(false);
    const [youtubeId, setYoutubeId] = useState<string | null>(null);

    useEffect(() => {
        if (!url) return;
        
        // Check for YouTube
        const regExp = /^.*(youtu.be\/|v\/|u\/\w\/|embed\/|watch\?v=|&v=)([^#&?]*).*/;
        const match = url.match(regExp);
        if (match && match[2].length === 11) {
            setIsYoutube(true);
            setYoutubeId(match[2]);
        } else {
            setIsYoutube(false);
            if (audioRef.current) {
                audioRef.current.volume = 0.5;
                if (autoplay) {
                    audioRef.current.play().catch(e => console.log("Autoplay blocked", e));
                }
            }
        }
    }, [url, autoplay]);

    const toggleMute = () => {
        setMuted(!muted);
        if (audioRef.current) {
            audioRef.current.muted = !audioRef.current.muted;
            if (!audioRef.current.muted) audioRef.current.play();
        }
    };

    if (!url) return null;

    return (
        <div className="absolute top-2 left-2 z-50 flex items-center gap-2">
            {isYoutube && youtubeId ? (
                <div className="relative w-8 h-8 overflow-hidden rounded-full border border-accent bg-black group">
                    <iframe 
                        width="300" 
                        height="200" 
                        src={`https://www.youtube.com/embed/${youtubeId}?autoplay=${autoplay ? 1 : 0}&mute=${muted ? 1 : 0}&loop=1&playlist=${youtubeId}&controls=0`} 
                        className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 w-[400px] h-[300px] pointer-events-none opacity-50 group-hover:opacity-100 transition-opacity"
                    ></iframe>
                    <button 
                        onClick={() => setMuted(!muted)} 
                        className="absolute inset-0 flex items-center justify-center bg-black/20 hover:bg-transparent text-white text-[10px] font-bold"
                    >
                        {muted ? '🔇' : '🔊'}
                    </button>
                </div>
            ) : (
                <>
                    <audio ref={audioRef} src={url} loop muted={muted} />
                    <button 
                        onClick={toggleMute} 
                        className={`w-6 h-6 flex items-center justify-center rounded-full border text-[10px] shadow-lg ${muted ? 'bg-red-900/80 border-red-500 text-white' : 'bg-green-900/80 border-green-500 text-white animate-pulse'}`}
                        title={muted ? "Unmute Profile Music" : "Mute Profile Music"}
                    >
                        {muted ? '🔇' : '🔊'}
                    </button>
                </>
            )}
        </div>
    );
};

// Assuming this interface matches the backend structure for profile comments
interface ProfileComment {
  id: number;
  toUserId: string; // Firebase UID of the profile owner
  fromUserId: string; // Firebase UID of the commenter
  fromUsername: string;
  content: string;
  createdAt: string; // ISO string
}

// ... UserSettings component ...
const UserSettings = ({ profile, onClose }: { profile: IUserProfile, onClose: () => void }) => {
    const { updateProfile } = useUserActions();
    const [activeTab, setActiveTab] = useState('general');
    const [loading, setLoading] = useState(false);
    
    // Form States
    const [bio, setBio] = useState(profile.bio || '');
    const [signature, setSignature] = useState(profile.signature || '');
    const [musicUrl, setMusicUrl] = useState(profile.musicUrl || '');
    const [musicAutoplay, setMusicAutoplay] = useState(profile.musicAutoplay || false);
    const [customCss, setCustomCss] = useState(profile.customCss || '');
    const [avatarFile, setAvatarFile] = useState<File | null>(null);
    const [bannerFile, setBannerFile] = useState<File | null>(null);

    const isEliteOrRoot = [UserRole.ROOT, UserRole.ADMIN, UserRole.ELITE].includes(profile.role);

    // Previews
    const avatarPreview = avatarFile ? URL.createObjectURL(avatarFile) : profile.avatarUrl;
    const bannerPreview = bannerFile ? URL.createObjectURL(bannerFile) : profile.bannerUrl;

    const handleSave = async () => {
        setLoading(true);
        try {
            let finalAvatarUrl = profile.avatarUrl;
            let finalBannerUrl = profile.bannerUrl;

            // uploadImage will need to be refactored to use backend
            if (avatarFile) {
                if (avatarFile.size > 10 * 1024 * 1024) throw new Error("Avatar too large (Max 10MB)");
                finalAvatarUrl = await uploadImage(avatarFile); // This uses Firebase Storage, needs backend endpoint
            }
            if (bannerFile) {
                if (bannerFile.size > 10 * 1024 * 1024) throw new Error("Banner too large (Max 10MB)");
                finalBannerUrl = await uploadImage(bannerFile); // This uses Firebase Storage, needs backend endpoint
            }

            // Call the refactored updateProfile from useUserActions
            await updateProfile(profile.firebase_uid, { // Use firebase_uid for backend calls
                bio, 
                signature, 
                musicUrl,
                musicAutoplay,
                customCss,
                bannerUrl: finalBannerUrl, 
                avatarUrl: finalAvatarUrl 
            });
            
            onClose();
        } catch(e: any) { 
            alert("Failed to save: " + e.message);
        } finally { 
            setLoading(false); 
        }
    };

    const handlePasswordReset = async () => {
        if(!profile.email) return;
        if(!confirm(`Send password reset email to ${profile.email}?`)) return;
        try {
            // This remains Firebase Auth client-side
            await sendPasswordResetEmail(auth, profile.email);
            alert("Password reset email sent! Check your inbox.");
        } catch(e:any) { alert(e.message); }
    };

    const TabButton = ({ id, label, icon }: any) => (
        <button 
            onClick={() => setActiveTab(id)} 
            className={`w-full text-left px-4 py-3 text-xs font-bold flex items-center gap-3 transition-colors ${activeTab === id ? 'bg-[#161b22] text-accent border-r-2 border-accent' : 'text-textMuted hover:bg-white/5 hover:text-white'}`}
        >
            <img src={icon} alt="" className="w-4 h-4" />
            {label}
        </button>
    );

    return (
        <div className="flex flex-1 overflow-hidden">
            <div className="w-64 bg-[#0d1117] border-r border-border flex flex-col shrink-0">
                <div className="p-4 border-b border-border bg-[#161b22]">
                    <div className="text-sm font-bold text-white">User Settings</div>
                    <div className="text-xs text-textMuted">Manage your profile</div>
                </div>
                <div className="flex-1 py-2">
                    <TabButton id="general" label="General" icon="https://cdn.jsdelivr.net/gh/famfamfam/silk-icons/icons/cog.png" />
                    <TabButton id="signature" label="Signature" icon="https://cdn.jsdelivr.net/gh/famfamfam/silk-icons/icons/pencil.png" />
                    <TabButton id="media" label="Media & CSS" icon="https://cdn.jsdelivr.net/gh/famfamfam/silk-icons/icons/monitor.png" />
                    <TabButton id="inventory" label="Inventory" icon="https://cdn.jsdelivr.net/gh/famfamfam/silk-icons/icons/package.png" />
                    <TabButton id="security" label="Security" icon="https://cdn.jsdelivr.co.uk/gh/famfamfam/silk-icons/icons/lock.png" />
                </div>
                <div className="p-4 border-t border-border">
                    <Button onClick={onClose} className="w-full">Back to Profile</Button>
                </div>
            </div>

            <div className="flex-1 flex flex-col bg-panel min-w-0">
                <div className="flex-1 overflow-y-auto p-8 custom-scrollbar">
                    {activeTab === 'general' && (
                        <div className="space-y-6 max-w-2xl animate-in fade-in duration-300">
                            <div>
                                <h3 className="text-lg font-bold text-white mb-1 border-b border-border pb-2">Public Profile</h3>
                                <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-4">
                                    <div>
                                        <label className="block text-xs font-bold text-textMuted mb-2">Avatar</label>
                                        <div className="flex items-center gap-4">
                                            <img src={avatarPreview || `https://ui-avatars.com/api/?name=${profile.username}`} className="w-20 h-20 rounded border border-border object-cover" />
                                            <div>
                                                <input type="file" id="avatarUpload" className="hidden" accept="image/*" onChange={(e) => e.target.files && setAvatarFile(e.target.files[0])} />
                                                <label htmlFor="avatarUpload" className="cursor-pointer bg-[#21262d] border border-border px-3 py-1 text-xs text-white rounded hover:bg-[#30363d] inline-block mb-1">Upload New</label>
                                            </div>
                                        </div>
                                    </div>
                                    <div>
                                        <label className="block text-xs font-bold text-textMuted mb-2">Banner</label>
                                        <div className="w-full h-20 bg-black rounded border border-border relative overflow-hidden group">
                                            <img src={bannerPreview || "https://picsum.photos/600/200"} className="w-full h-full object-cover opacity-50" />
                                            <div className="absolute inset-0 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity bg-black/50">
                                                <input type="file" id="bannerUpload" className="hidden" accept="image/*" onChange={(e) => e.target.files && setBannerFile(e.target.files[0])} />
                                                <label htmlFor="bannerUpload" className="cursor-pointer text-xs text-white underline font-bold">Change Banner</label>
                                            </div>
                                        </div>
                                    </div>
                                </div>

                                <div className="space-y-4">
                                    <div>
                                        <label className="block text-xs font-bold text-textMuted mb-1">About Me</label>
                                        <textarea value={bio} onChange={e => setBio(e.target.value)} className="w-full bg-[#0d1117] border border-border p-2 text-sm text-textMain min-h-[100px] rounded-sm focus:border-accent outline-none" placeholder="Tell us about yourself..." />
                                    </div>
                                </div>
                            </div>
                        </div>
                    )}
                    
                    {activeTab === 'media' && (
                        <div className="space-y-6 max-w-2xl animate-in fade-in duration-300">
                             <div>
                                <h3 className="text-lg font-bold text-white mb-1 border-b border-border pb-2">Profile Music</h3>
                                <p className="text-xs text-textMuted mb-4">Plays when users view your profile. Supports YouTube and Direct MP3.</p>
                                <input value={musicUrl} onChange={e => setMusicUrl(e.target.value)} className="w-full bg-[#0d1117] border border-border p-2 text-sm text-textMain rounded-sm focus:border-accent outline-none mb-2" placeholder="https://www.youtube.com/watch?v=..." />
                                <label className="flex items-center gap-2 text-xs text-textMain cursor-pointer">
                                    <input type="checkbox" checked={musicAutoplay} onChange={e => setMusicAutoplay(e.target.checked)} />
                                    Autoplay Music (Starts muted)
                                </label>
                             </div>

                             <div>
                                <h3 className="text-lg font-bold text-white mb-1 border-b border-border pb-2">Custom CSS</h3>
                                <p className="text-xs text-textMuted mb-4">
                                    Customize your profile appearance. <span className="text-accent font-bold">Elite/Root only.</span>
                                </p>
                                {isEliteOrRoot ? (
                                    <>
                                        <textarea value={customCss} onChange={e => setCustomCss(e.target.value)} className="w-full bg-[#0d1117] border border-border p-2 text-sm text-textMain min-h-[200px] font-mono rounded-sm focus:border-accent outline-none" placeholder=".profile-container { background: red; }" />
                                        <div className="text-[10px] text-yellow-500 mt-1">Warning: CSS is scoped to the modal, but be careful. Malicious CSS will result in a ban.</div>
                                    </>
                                ) : (
                                    <div className="p-4 border border-dashed border-border text-center text-textMuted text-xs">
                                        You must be <span className="text-accent font-bold">Elite</span> or <span className="text-red-500 font-bold">Root</span> to use Custom CSS.
                                    </div>
                                )}
                             </div>
                        </div>
                    )}

                    {activeTab === 'signature' && (
                        <div className="space-y-4 max-w-2xl animate-in fade-in duration-300">
                             <h3 className="text-lg font-bold text-white mb-1 border-b border-border pb-2">Signature Editor</h3>
                             <div className="bg-[#0d1117] border border-border p-2 rounded-sm mb-2">
                                 <textarea value={signature} onChange={e => setSignature(e.target.value)} className="w-full bg-transparent text-sm text-textMain min-h-[150px] outline-none font-mono" placeholder="Enter your signature BBCode..." />
                             </div>
                             <div className="mt-4">
                                 <div className="text-xs font-bold text-textMuted mb-2 uppercase">Preview</div>
                                 <div className="border-t border-dashed border-border pt-4">
                                     <BBCodeParser content={signature || 'No signature set.'} />
                                 </div>
                             </div>
                        </div>
                    )}

                    {activeTab === 'inventory' && (
                        <div className="space-y-4 animate-in fade-in duration-300">
                            <h3 className="text-lg font-bold text-white mb-1 border-b border-border pb-2">Inventory</h3>
                            {!profile.inventory || profile.inventory.length === 0 ? (
                                <div className="p-8 text-center text-textMuted border border-dashed border-border rounded-sm">Your inventory is empty.</div>
                            ) : (
                                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                                    {profile.inventory.map((item: string, i: number) => {
                                        const badge = BADGE_INFO[item] || { icon: '❓', name: item, desc: 'Unknown Item' };
                                        return (
                                            <div key={i} className="flex items-center gap-4 bg-[#161b22] border border-border p-3 rounded-sm">
                                                <div className="w-12 h-12 flex items-center justify-center bg-black/50 text-2xl rounded border border-border">
                                                    <img src={badge.icon} alt={badge.name} />
                                                </div>
                                                <div>
                                                    <div className="font-bold text-textMain text-sm">{badge.name}</div>
                                                    <div className="text-xs text-textMuted">{badge.desc}</div>
                                                </div>
                                            </div>
                                        );
                                    })}
                                </div>
                            )}
                        </div>
                    )}

                    {activeTab === 'security' && (
                        <div className="space-y-6 max-w-xl animate-in fade-in duration-300">
                             <h3 className="text-lg font-bold text-white mb-1 border-b border-border pb-2">Account Security</h3>
                             <div className="bg-[#161b22] border border-border p-4 rounded-sm">
                                 <div className="flex justify-between items-center">
                                     <div>
                                         <div className="text-sm font-bold text-textMain">Email Address</div>
                                         <div className="text-xs text-textMuted">{profile.email}</div>
                                     </div>
                                     <span className="text-[10px] bg-green-900/30 text-green-400 px-2 py-1 rounded border border-green-900/50">Verified</span>
                                 </div>
                             </div>
                             <Button onClick={handlePasswordReset} className="border-red-500/50 text-red-400 hover:bg-red-900/20">Send Password Reset Email</Button>
                        </div>
                    )}
                </div>

                <div className="p-4 border-t border-border bg-[#161b22] flex justify-end gap-3 shrink-0">
                    <Button variant="primary" onClick={handleSave} disabled={loading} className="px-6">
                        {loading ? 'Saving...' : 'Save Changes'}
                    </Button>
                </div>
            </div>
        </div>
    );
};

const ProfileHeader = ({ profile, closeProfileModal, onEdit, canEdit, isRoot, onDelete }: { profile: IUserProfile, closeProfileModal: () => void, onEdit: () => void, canEdit: boolean, isRoot: boolean, onDelete: () => void }) => (
  <>
    <div className="h-32 w-full bg-gray-800 relative overflow-hidden shrink-0 group">
      <img src={profile.bannerUrl || "https://picsum.photos/600/200"} className="w-full h-full object-cover opacity-75" alt="Banner" />
      <div className="absolute inset-0 bg-gradient-to-t from-panel to-transparent"></div>
      
      {/* Profile Music Integration */}
      {profile.musicUrl && <ProfileMusic url={profile.musicUrl} autoplay={profile.musicAutoplay || false} />}

      <div className="absolute top-2 right-2 flex gap-2 z-10">
          {canEdit && <Button onClick={onEdit}>Edit Profile</Button>}
          <Button onClick={closeProfileModal} className="px-2 font-bold">✕</Button>
      </div>
    </div>
    <div className="px-6 relative -mt-12 flex justify-between items-end pb-4 border-b border-border">
      <div className="flex items-end gap-4">
        <img src={profile.avatarUrl || `https://ui-avatars.com/api/?name=${profile.username}&background=random&color=fff`} className="w-24 h-24 rounded-sm border-4 border-panel bg-panel object-cover shadow-lg" alt="Avatar" />
        <div className="mb-1">
          <div className="text-2xl leading-none drop-shadow-md flex items-center gap-2">
             <UserLink name={profile.username} role={profile.role} className="cursor-default hover:no-underline" />
             <Inventory items={profile.inventory} />
          </div>
          <div className="text-xs text-textMuted mt-1 flex items-center gap-2"><RoleBadge role={profile.role} /><span>•</span><span>Joined {profile.createdAt ? new Date(profile.createdAt).toLocaleDateString() : 'Unknown'}</span></div>
        </div>
      </div>
      
      <div className="flex flex-col items-end">
          {isRoot && !canEdit && (
             <Button onClick={onDelete} variant="danger" className="text-[10px] mb-2">DELETE USER</Button>
          )}
          <div className="text-[10px] font-mono text-textMuted bg-black/40 px-2 py-1 rounded border border-border/30">
              Total Profile Views: <span className="text-accent">{profile.profileViews || 0}</span>
          </div>
      </div>
    </div>
  </>
);

const VouchButton = ({ profile, currentUser, currentProfile }: { profile: IUserProfile, currentUser: any, currentProfile: IUserProfile | null }) => {
    const [loading, setLoading] = useState(false);

    const handleVouch = async () => {
        if (!currentUser || !currentProfile) return;
        if ((currentProfile.postCount || 0) < 20) return alert("You need at least 20 posts to vouch for others.");
        if (currentUser.uid === profile.firebase_uid) return alert("You cannot vouch for yourself."); // Use firebase_uid
        
        setLoading(true);
        try {
            // This needs to be a backend call
            const response = await api.post(`/api/users/${profile.firebase_uid}/vouch`, {
                voter_firebase_uid: currentUser.uid
            });
            alert(response.data.message || "Vouch successful!");
        } catch (e: any) { alert(e.response?.data?.message || e.message); } finally { setLoading(false); }
    };

    if (!currentUser || currentUser.uid === profile.firebase_uid) return null; // Use firebase_uid for comparison

    return (
        <Button onClick={handleVouch} disabled={loading} className="text-xs bg-green-900/20 text-green-400 border border-green-900/50 hover:bg-green-900/40">
            {loading ? '...' : '+ VOUCH'}
        </Button>
    );
};

const ProfileView = ({ profile, comments, user, myProfile, commentContent, setCommentContent, handlePostComment, handleDeleteComment, closeProfileModal }: {
    profile: IUserProfile;
    comments: ProfileComment[]; // Use the new ProfileComment interface
    user: any; // Firebase user
    myProfile: IUserProfile | null;
    commentContent: string;
    setCommentContent: (content: string) => void;
    handlePostComment: () => Promise<void>;
    handleDeleteComment: (commentId: number) => Promise<void>; // Change type to number
    closeProfileModal: () => void;
}) => {
    return (
        <div className="space-y-4 relative" id="user-profile-content">
            {/* Custom CSS Injection for Elite/Root */}
            {profile.customCss && [UserRole.ROOT, UserRole.ADMIN, UserRole.ELITE].includes(profile.role) && (
                <style>{profile.customCss}</style>
            )}

            <div className="grid grid-cols-3 gap-4">
                <div className="bg-background border border-border p-3 rounded-sm text-center">
                    <div className="text-xs text-textMuted uppercase">Reputation</div>
                    <div className={`font-bold text-lg ${profile.reputation >= 0 ? 'text-green-500' : 'text-red-500'}`}>{profile.reputation || 0}</div>
                </div>
                <div className="bg-background border border-border p-3 rounded-sm text-center relative">
                    <div className="text-xs text-textMuted uppercase">Trust Score</div>
                    <div className="font-bold text-lg text-cyan-400">+{profile.trustScore || 0}</div> {/* trustScore needs to come from backend */}
                    <div className="absolute bottom-1 right-1">
                        <VouchButton profile={profile} currentUser={user} currentProfile={myProfile} />
                    </div>
                </div>
                <div className="bg-background border border-border p-3 rounded-sm text-center">
                    <div className="text-xs text-textMuted uppercase">Warnings</div>
                    <div className="font-bold text-lg text-red-500">{profile.warnings || 0}</div>
                </div>
            </div>

            <div><h3 className="text-xs font-bold text-accent uppercase mb-1 border-b border-border pb-1">About Me</h3><p className="text-sm whitespace-pre-wrap leading-relaxed text-textMain">{profile.bio || "No biography added yet."}</p></div>
            {profile.signature && <div><h3 className="text-xs font-bold text-textMuted uppercase mb-1 border-b border-border pb-1">Signature</h3><div className="text-xs text-textMuted opacity-90"><BBCodeParser content={profile.signature} /></div></div>}
            
            <div className="pt-4 mt-4 border-t border-border">
                <h3 className="text-xs font-bold text-accent uppercase mb-2">Profile Comments</h3>
                {user && myProfile?.role !== UserRole.BANNED && (
                    <div className="mb-4 flex gap-2">
                        <input className="flex-1 bg-black border border-border p-2 text-xs text-white focus:border-accent outline-none" placeholder="Write a comment..." value={commentContent} onChange={(e) => setCommentContent(e.target.value)} onKeyDown={(e) => e.key === 'Enter' && handlePostComment()} />
                        <Button variant="primary" onClick={handlePostComment} className="text-xs">Post</Button>
                    </div>
                )}
                <div className="space-y-3 max-h-[200px] overflow-y-auto pr-1 custom-scrollbar">
                    {comments.length === 0 ? <div className="text-xs text-textMuted italic">No comments yet.</div> : comments.map((c: ProfileComment) => (
                        <div key={c.id} className="bg-background border border-border p-2 rounded-sm group relative">
                            <div className="flex justify-between items-start mb-1">
                                <span className="text-xs font-bold"><UserLink name={c.fromUsername} role={UserRole.USER} onClick={() => closeProfileModal()} /></span>
                                <span className="text-xs text-textMuted">{formatDate(c.createdAt)}</span>
                            </div>
                            <div className="text-xs text-textMain break-words">{c.content}</div>
                            {user && (user.uid === c.fromUserId || user.uid === profile.firebase_uid || myProfile?.role === UserRole.ROOT) && (
                                <button onClick={() => handleDeleteComment(c.id)} className="absolute top-1 right-1 opacity-0 group-hover:opacity-100 text-red-500 text-[10px] hover:bg-red-900/20 px-1 rounded transition-opacity">Delete</button>
                            )}
                        </div>
                    ))}
                </div>
            </div>
        </div>
    );
};

export const UserProfileModal = () => {
  const { viewingProfileId, closeProfileModal } = useUI();
  const { user, userProfile: myProfile } = useAuth(); // myProfile is the authenticated user's profile
  
  const [profile, setProfile] = useState<IUserProfile | null>(null);
  const [isEditing, setIsEditing] = useState(false);
  const [comments, setComments] = useState<ProfileComment[]>([]);
  const [commentContent, setCommentContent] = useState('');

  useEffect(() => {
      setIsEditing(false);
  }, [viewingProfileId]);

  // Fetch profile and comments from backend API
  useEffect(() => {
    if (!viewingProfileId) { setProfile(null); setComments([]); return; }
    
    // Fetch user profile
    const fetchProfile = async () => {
        try {
            const response = await api.get(`/api/users/${viewingProfileId}`);
            setProfile(response.data);
            // Profile views increment should be handled by backend
            // For now, we assume the backend returns profileViews
        } catch (e: any) {
            console.error("Failed to fetch user profile:", e);
            setProfile(null);
        }
    };

    // Fetch profile comments
    const fetchComments = async () => {
        try {
            const response = await api.get(`/api/users/${viewingProfileId}/comments`);
            // Backend should return comments sorted by createdAt desc
            setComments(response.data);
        } catch (e: any) {
            console.error("Failed to fetch profile comments:", e);
            setComments([]);
        }
    };

    fetchProfile();
    fetchComments();

  }, [viewingProfileId]);

  if (!viewingProfileId || !profile) return null;

  const canEdit = user && (user.uid === profile.firebase_uid || myProfile?.role === UserRole.ROOT); // Compare with firebase_uid
  const isRoot = myProfile?.role === UserRole.ROOT;

  const handlePostComment = useCallback(async () => {
      if (!user || !myProfile || !commentContent.trim()) return;
      if (myProfile.role === UserRole.BANNED) { alert("Banned users cannot post comments."); return; }

      try {
          const response = await api.post(`/api/users/${viewingProfileId}/comments`, {
              fromUserId: user.uid,
              fromUsername: myProfile.username,
              content: commentContent,
          });
          setComments(prev => [response.data, ...prev]); // Add new comment to top
          setCommentContent('');
      } catch (e: any) {
          console.error("Failed to post comment:", e);
          alert(`Failed to post comment: ${e.response?.data?.message || e.message}`);
      }
  }, [user, myProfile, commentContent, viewingProfileId]);

  const handleDeleteUser = useCallback(async () => {
      if (!confirm("Are you sure you want to DELETE this user? This cannot be undone.")) return;
      try {
          await api.delete(`/api/users/${profile.firebase_uid}`);
          closeProfileModal();
      } catch (e: any) {
          console.error("Failed to delete user:", e);
          alert(`Failed to delete user: ${e.response?.data?.message || e.message}`);
      }
  }, [profile?.firebase_uid, closeProfileModal]);

  const handleDeleteComment = useCallback(async (commentId: number) => {
      if (!confirm("Are you sure you want to delete this comment?")) return;
      try {
          await api.delete(`/api/users/${profile.firebase_uid}/comments/${commentId}`);
          setComments(prev => prev.filter(comment => comment.id !== commentId));
      } catch (e: any) {
          console.error("Failed to delete comment:", e);
          alert(`Failed to delete comment: ${e.response?.data?.message || e.message}`);
      }
  }, [profile?.firebase_uid]);


  return (
    <div className="fixed inset-0 bg-black/80 flex items-center justify-center z-50 p-4 overflow-hidden touch-none overscroll-none">
      <div className={`bg-panel border border-accent w-full shadow-2xl relative flex flex-col max-h-[90vh] transition-all duration-300 ${isEditing ? 'max-w-4xl h-[600px]' : 'max-w-lg'}`}>
        {isEditing ? (
            <UserSettings profile={profile} onClose={() => setIsEditing(false)} />
        ) : (
            <>
                <ProfileHeader 
                    profile={profile} 
                    closeProfileModal={closeProfileModal} 
                    onEdit={() => setIsEditing(true)} 
                    canEdit={canEdit}
                    isRoot={isRoot}
                    onDelete={handleDeleteUser} // Use the new handleDeleteUser callback
                />
                <div className="p-6 overflow-y-auto custom-scrollbar">
                    <ProfileView 
                        profile={profile} 
                        comments={comments} 
                        user={user} 
                        myProfile={myProfile} 
                        commentContent={commentContent} 
                        setCommentContent={setCommentContent} 
                        handlePostComment={handlePostComment} 
                        handleDeleteComment={handleDeleteComment} 
                        closeProfileModal={closeProfileModal} 
                    />
                </div>
            </>
        )}
      </div>
    </div>
  );
};