
import React, { useState } from 'react';
import { collection, query, where, getDocs, limit, orderBy } from 'firebase/firestore';
import { db } from '../firebase';
import { Link } from 'react-router-dom';
import { formatDate, UserLink } from '../components/UI';
import { useUI } from '../context/UIContext';

export const Search = () => {
    const { openProfileModal } = useUI();
    const [queryStr, setQueryStr] = useState('');
    const [results, setResults] = useState<any[]>([]);
    const [loading, setLoading] = useState(false);
    const [searched, setSearched] = useState(false);

    const handleSearch = async (e: React.FormEvent) => {
        e.preventDefault();
        if(!queryStr) return;
        setLoading(true);
        setSearched(true);
        
        try {
            // Firestore doesn't support full text search natively.
            // We'll fetch recent threads and filter client side for this demo logic
            // or perform a simple title match if possible (which requires exact or prefix match usually).
            // Here we fetch last 100 threads and filter.
            const q = query(collection(db, "threads"), limit(100));
            const snap = await getDocs(q);
            const hits = snap.docs
                .map(d => ({ id: d.id, ...d.data() } as any))
                .filter(t => t.title.toLowerCase().includes(queryStr.toLowerCase()) || t.content.toLowerCase().includes(queryStr.toLowerCase()));
            
            setResults(hits);
        } catch (e) { console.error(e); }
        setLoading(false);
    };

    return (
        <div className="max-w-[950px] mx-auto p-2">
             <div className="text-xs text-textMuted mb-2">
                <Link to="/">xBOARD</Link> / Search
            </div>

            <form onSubmit={handleSearch} className="bg-trow1 border border-black p-4 mb-4">
                <div className="bg-thead-grad text-white px-2 py-1 mb-2 font-bold text-xs border border-black">Search Forums</div>
                <div className="flex gap-2">
                    <input 
                        className="flex-1 p-2" 
                        placeholder="Keywords..." 
                        value={queryStr} 
                        onChange={e => setQueryStr(e.target.value)} 
                    />
                    <button type="submit" className="px-4 bg-[#333] text-white border border-black font-bold text-xs">Search</button>
                </div>
            </form>

            {searched && (
                <table cellSpacing="1" cellPadding="4">
                     <thead>
                        <tr>
                            <th className="thead">Thread Title</th>
                            <th className="thead" width="150" align="right">Author</th>
                            <th className="thead" width="150" align="right">Date</th>
                        </tr>
                     </thead>
                     <tbody>
                        {loading ? <tr><td colSpan={3} className="trow1 p-4 text-center">Searching...</td></tr> : 
                         results.length === 0 ? <tr><td colSpan={3} className="trow1 p-4 text-center">No results found.</td></tr> :
                         results.map((r, i) => (
                             <tr key={r.id}>
                                 <td className={i%2===0 ? 'trow1' : 'trow2'}>
                                     <Link to={`/thread/${r.id}`} className="font-bold text-[#a8d8ff]">{r.title}</Link>
                                     <div className="text-[10px] text-textMuted truncate max-w-lg">{r.content.substring(0, 100)}...</div>
                                 </td>
                                 <td className={i%2===0 ? 'trow1' : 'trow2'} align="right">
                                     <UserLink name={r.authorName} onClick={() => r.authorId && openProfileModal(r.authorId)} />
                                 </td>
                                 <td className={i%2===0 ? 'trow1' : 'trow2'} align="right">
                                     <span className="text-[10px] text-textMuted">{formatDate(r.createdAt)}</span>
                                 </td>
                             </tr>
                         ))}
                     </tbody>
                </table>
            )}
        </div>
    );
};
