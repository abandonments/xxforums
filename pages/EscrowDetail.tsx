import React, { useState, useEffect } from 'react';
import { useParams } from 'react-router-dom';
import { useEscrow } from '../hooks/useEscrow';

const EscrowDetail = () => {
    const { id } = useParams<{ id: string }>();
    const { getEscrow, getBalance, getAddress, releaseEscrow, loading } = useEscrow();
    const [escrow, setEscrow] = useState<any>(null);
    const [balance, setBalance] = useState<number | null>(null);
    const [address, setAddress] = useState<string | null>(null);

    useEffect(() => {
        const fetchEscrow = async () => {
            const response = await getEscrow(id);
            setEscrow(response);
        };
        fetchEscrow();
    }, [getEscrow, id]);

    const handleGetBalance = async () => {
        const response = await getBalance(escrow.name);
        setBalance(response.balance);
    };

    const handleGetAddress = async () => {
        const response = await getAddress(escrow.name);
        setAddress(response.address);
    };

    const handleReleaseEscrow = async () => {
        await releaseEscrow(escrow.name, escrow.seller_address);
    };

    return (
        <div className="container mx-auto">
            {loading && <p>Loading...</p>}
            {escrow && (
                <div>
                    <h1 className="text-2xl font-bold">{escrow.name}</h1>
                    <p>Status: {escrow.status}</p>
                    <p>Buyer: {escrow.buyer_id}</p>
                    <p>Seller: {escrow.seller_id}</p>
                    <p>Post: {escrow.post_id}</p>
                    <button onClick={handleGetBalance} className="bg-blue-500 text-white p-2 rounded-lg">Get Balance</button>
                    {balance && <p>Balance: {balance}</p>}
                    <button onClick={handleGetAddress} className="bg-blue-500 text-white p-2 rounded-lg">Get Address</button>
                    {address && <p>Address: {address}</p>}
                    <button onClick={handleReleaseEscrow} className="bg-green-500 text-white p-2 rounded-lg">Release Escrow</button>
                </div>
            )}
        </div>
    );
};

export default EscrowDetail;