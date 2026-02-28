import React, { useState, useEffect } from 'react';
import { useEscrow } from '../hooks/useEscrow';
import { Link } from 'react-router-dom';

const EscrowDashboard = () => {
    const { getEscrows, loading } = useEscrow();
    const [escrows, setEscrows] = useState([]);

    useEffect(() => {
        const fetchEscrows = async () => {
            const response = await getEscrows();
            setEscrows(response);
        };
        fetchEscrows();
    }, [getEscrows]);

    return (
        <div className="container mx-auto">
            <h1 className="text-2xl font-bold">Escrow Dashboard</h1>
            {loading && <p>Loading...</p>}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {escrows.map((escrow: any) => (
                    <div key={escrow.id} className="border p-4 rounded-lg">
                        <h2 className="text-xl font-bold">{escrow.name}</h2>
                        <p>Status: {escrow.status}</p>
                        <Link to={`/escrow/${escrow.id}`} className="text-blue-500">View Details</Link>
                    </div>
                ))}
            </div>
        </div>
    );
};

export default EscrowDashboard;