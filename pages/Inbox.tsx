
import React, { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import { collection, query, where, onSnapshot, addDoc, serverTimestamp, orderBy, doc, updateDoc, getDoc, getDocs } from 'firebase/firestore';
import { db } from '../firebase';
import { Panel, Button, formatDate } from '../components/UI';
import { Link } from 'react-router-dom';
import { UserRole } from '../types';
import BBCodeParser from '../components/RichText';

export const Inbox = () => {
  const { user, userProfile } = useAuth();
  const [messages, setMessages] = useState<any[]>([]);
  const [notifications, setNotifications] = useState<any[]>([]);
  const [activeTab, setActiveTab] = useState<'inbox' | 'compose'>('inbox');
  
  // Compose State
  const [toUsername, setToUsername] = useState('');
  const [msgSubject, setMsgSubject] = useState('');
  const [msgContent, setMsgContent] = useState('');

  // Selected Message for View
  const [viewMessage, setViewMessage] = useState<any>(null);

  useEffect(() => {
    if (!user) return;
    
    const qMsg = query(collection(db, "messages"), where("toUserId", "==", user.uid));
    const unsubMsg = onSnapshot(qMsg, (snap) => {
        const msgs = snap.docs.map(d => ({ id: d.id, ...d.data() }));
        msgs.sort((a:any, b:any) => (b.createdAt?.toMillis() || 0) - (a.createdAt?.toMillis() || 0));
        setMessages(msgs);
    });

    const qNotif = query(collection(db, "notifications"), where("toUserId", "==", user.uid));
    const unsubNotif = onSnapshot(qNotif, (snap) => {
        const notifs = snap.docs.map(d => ({ id: d.id, ...d.data() }));
        notifs.sort((a:any, b:any) => (b.createdAt?.toMillis() || 0) - (a.createdAt?.toMillis() || 0));
        setNotifications(notifs);
    });

    return () => {
        unsubMsg();
        unsubNotif();
    };
  }, [user]);

  const handleSend = async (e: React.FormEvent) => {
      e.preventDefault();
      
      if (userProfile?.role === UserRole.BANNED) {
          alert("You are BANNED and cannot send messages.");
          return;
      }

      if (!toUsername || !msgSubject || !msgContent) return;

      try {
          const q = query(collection(db, "users"), where("username", "==", toUsername));
          const snap = await getDocs(q);
          
          if (snap.empty) {
              alert("User not found");
              return;
          }
          
          const targetUser = snap.docs[0];
          
          await addDoc(collection(db, "messages"), {
              fromUserId: user?.uid,
              fromUsername: userProfile?.username,
              toUserId: targetUser.id,
              subject: msgSubject,
              content: msgContent,
              createdAt: serverTimestamp(),
              read: false
          });
          
          setMsgSubject('');
          setMsgContent('');
          setToUsername('');
          alert("Message Sent");
          setActiveTab('inbox'); // Return to inbox
      } catch (e) {
          console.error("Error sending message", e);
          alert("Failed to send message");
      }
  };

  const markNotifRead = async (id: string) => {
      await updateDoc(doc(db, "notifications", id), { read: true });
  };

  const openMessage = async (msg: any) => {
      setViewMessage(msg);
      if(!msg.read && !msg.isSystem) { // System messages/Logs stay unread or managed differently? 
          await updateDoc(doc(db, "messages", msg.id), { read: true });
      }
  };

  if (!user) return <div className="p-10 text-center">Please login.</div>;

  return (
    <div className="max-w-6xl mx-auto p-4">
       <div className="text-xs text-textMuted mb-2">
           <Link to="/">xBOARD</Link> / Messages
       </div>

       {/* Top Navigation Tabs */}
       <div className="flex border-b border-border mb-4 bg-thead-grad">
           <button 
               onClick={() => { setActiveTab('inbox'); setViewMessage(null); }}
               className={`px-6 py-2 text-xs font-bold transition-colors ${activeTab === 'inbox' ? 'bg-[#333] text-white border-b-2 border-accent' : 'text-textMuted hover:text-white'}`}
           >
               INBOX & LOGS
           </button>
           <button 
               onClick={() => { setActiveTab('compose'); setViewMessage(null); }}
               className={`px-6 py-2 text-xs font-bold transition-colors ${activeTab === 'compose' ? 'bg-[#333] text-white border-b-2 border-accent' : 'text-textMuted hover:text-white'}`}
           >
               SEND MESSAGE
           </button>
       </div>

       {activeTab === 'compose' ? (
           <div className="max-w-2xl mx-auto">
               <Panel title="Compose New Message">
                   <form onSubmit={handleSend} className="p-4 flex flex-col gap-4">
                       <div>
                           <label className="block text-xs font-bold text-textMuted mb-1 uppercase">Recipient Username</label>
                           <input 
                               className="w-full bg-black border border-border p-2 text-white font-bold" 
                               placeholder="Enter exact username..."
                               value={toUsername}
                               onChange={e => setToUsername(e.target.value)}
                               required
                           />
                       </div>
                       <div>
                           <label className="block text-xs font-bold text-textMuted mb-1 uppercase">Subject</label>
                           <input 
                               className="w-full bg-black border border-border p-2 text-white" 
                               placeholder="Message Subject..."
                               value={msgSubject}
                               onChange={e => setMsgSubject(e.target.value)}
                               required
                           />
                       </div>
                       <div>
                           <label className="block text-xs font-bold text-textMuted mb-1 uppercase">Content (BBCode)</label>
                           <textarea 
                               className="w-full bg-black border border-border p-2 text-white min-h-[200px]" 
                               placeholder="Write your message here..."
                               value={msgContent}
                               onChange={e => setMsgContent(e.target.value)}
                               required
                           />
                       </div>
                       <Button variant="primary" className="py-2">Send Message</Button>
                   </form>
               </Panel>
           </div>
       ) : (
           <div className="flex gap-4">
               {/* Left List */}
               <div className="w-1/3 flex flex-col gap-4">
                   <Panel title="Private Messages">
                       <div className="max-h-[300px] overflow-y-auto">
                           {messages.length === 0 ? <div className="p-4 text-textMuted text-center text-xs">No messages.</div> : (
                               <div className="divide-y divide-border">
                                   {messages.map(m => (
                                       <div 
                                           key={m.id} 
                                           onClick={() => openMessage(m)}
                                           className={`p-3 cursor-pointer hover:bg-white/5 transition-colors ${viewMessage?.id === m.id ? 'bg-[#2a2a2a] border-l-2 border-accent' : ''} ${!m.read ? 'bg-accent/5' : ''}`}
                                       >
                                           <div className="flex justify-between items-start mb-1">
                                               <span className={`text-xs ${!m.read ? 'font-bold text-white' : 'text-textMain'}`}>{m.subject}</span>
                                               <span className="text-[9px] text-textMuted">{formatDate(m.createdAt).split(',')[0]}</span>
                                           </div>
                                           <div className="text-[10px] text-textMuted flex justify-between">
                                               <span>From: {m.fromUsername}</span>
                                               {m.isSystem && <span className="text-yellow-500 font-bold">SYSTEM</span>}
                                           </div>
                                       </div>
                                   ))}
                               </div>
                           )}
                       </div>
                   </Panel>

                   <Panel title="Admin Logs / Notifications">
                        <div className="max-h-[300px] overflow-y-auto">
                            {notifications.length === 0 ? <div className="p-4 text-textMuted text-center text-xs">No logs.</div> : (
                                <div className="divide-y divide-border">
                                    {notifications.map(n => (
                                        <div key={n.id} className={`p-3 flex justify-between items-start ${n.read ? 'opacity-50' : 'bg-blue-900/10'}`}>
                                            <div className="text-[10px] text-textMain">
                                                {n.type === 'reply' && (
                                                    <span>New reply in <Link to={`/thread/${n.threadId}`} className="text-accent underline">thread</Link>.</span>
                                                )}
                                                {n.type === 'reputation' && (
                                                    <span>Reputation change ({n.amount > 0 ? '+' : ''}{n.amount}).</span>
                                                )}
                                                {/* Fallback for generic logs */}
                                                {!['reply', 'reputation'].includes(n.type) && <span>System Log: {JSON.stringify(n)}</span>}
                                                <div className="text-[9px] text-textMuted mt-1">{formatDate(n.createdAt)}</div>
                                            </div>
                                            {!n.read && <button onClick={() => markNotifRead(n.id)} className="text-[9px] text-textMuted hover:text-white px-1 border border-border">x</button>}
                                        </div>
                                    ))}
                                </div>
                            )}
                        </div>
                   </Panel>
               </div>

               {/* Right Content */}
               <div className="flex-1">
                   {viewMessage ? (
                       <Panel title={viewMessage.subject}>
                           <div className="p-6">
                               <div className="flex justify-between items-center border-b border-border pb-4 mb-4">
                                   <div>
                                       <div className="text-xs text-textMuted uppercase">From</div>
                                       <div className="font-bold text-lg text-white flex items-center gap-2">
                                           {viewMessage.fromUsername}
                                           {viewMessage.isSystem && <span className="text-[10px] bg-yellow-600 text-black px-1 rounded font-bold">OFFICIAL</span>}
                                       </div>
                                   </div>
                                   <div className="text-right">
                                       <div className="text-xs text-textMuted uppercase">Sent</div>
                                       <div className="text-xs text-white">{formatDate(viewMessage.createdAt)}</div>
                                   </div>
                               </div>
                               
                               <div className="min-h-[200px] text-sm text-textMain leading-relaxed whitespace-pre-wrap">
                                   <BBCodeParser content={viewMessage.content} />
                               </div>

                               {!viewMessage.isSystem && (
                                   <div className="border-t border-border pt-4 mt-6 flex justify-end">
                                       <Button onClick={() => {
                                           setActiveTab('compose');
                                           setToUsername(viewMessage.fromUsername);
                                           setMsgSubject(`Re: ${viewMessage.subject}`);
                                           setViewMessage(null);
                                       }}>Reply</Button>
                                   </div>
                               )}
                           </div>
                       </Panel>
                   ) : (
                       <div className="h-full flex items-center justify-center border border-dashed border-border bg-black/20 text-textMuted p-10">
                           Select a message from the inbox to read.
                       </div>
                   )}
               </div>
           </div>
       )}
    </div>
  );
};
