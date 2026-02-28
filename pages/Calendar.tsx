
import React from 'react';
import { Link } from 'react-router-dom';

export const Calendar = () => {
    const today = new Date();
    const daysInMonth = new Date(today.getFullYear(), today.getMonth() + 1, 0).getDate();
    const days = Array.from({length: daysInMonth}, (_, i) => i + 1);

    return (
        <div className="max-w-[950px] mx-auto p-2">
            <div className="text-xs text-textMuted mb-2">
                <Link to="/">xBOARD</Link> / Calendar
            </div>
            
            <table cellSpacing="1" cellPadding="4" className="w-full text-center">
                <thead>
                    <tr>
                        <th className="thead" colSpan={7}>{today.toLocaleString('default', { month: 'long', year: 'numeric' })}</th>
                    </tr>
                    <tr className="bg-tcat">
                        {['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'].map(d => <td key={d} className="text-white text-xs font-bold border border-black">{d}</td>)}
                    </tr>
                </thead>
                <tbody className="bg-trow1">
                    <tr>
                       {/* Simplified calendar logic just for visual layout */}
                       {days.map(d => (
                           <td key={d} className={`border border-black p-4 align-top h-24 w-[14%] ${d === today.getDate() ? 'bg-[#333]' : 'bg-[#1a1a1a]'}`}>
                               <div className="text-right text-xs font-bold text-[#555] mb-2">{d}</div>
                               {d === today.getDate() && <div className="text-[10px] text-[#a8d8ff]">Today</div>}
                           </td>
                       )).reduce((rows: any[], key, index) => {
                           if (index % 7 === 0) rows.push([]);
                           rows[rows.length - 1].push(key);
                           return rows;
                       }, []).map((row: any[], i: number) => (
                           <React.Fragment key={i}>
                               {/* Close previous row and start new if needed, but this map structure is tricky in pure JSX return without logic. 
                                   Let's just render a grid. */}
                           </React.Fragment>
                       ))}
                    </tr>
                </tbody>
            </table>
            
            {/* Proper Grid Render since table row logic is annoying in map */}
            <div className="grid grid-cols-7 gap-[1px] bg-black border border-black mt-[-10px]">
                 {days.map(d => (
                    <div key={d} className={`bg-trow1 min-h-[100px] p-2 ${d === today.getDate() ? 'bg-[#252525]' : ''}`}>
                        <div className="text-right text-[#555] font-bold">{d}</div>
                    </div>
                 ))}
            </div>
        </div>
    );
};
