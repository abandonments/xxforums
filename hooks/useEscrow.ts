
import { useState, useCallback } from 'react';
import { useForumApi } from './useForumApi';

export const useEscrow = () => {
    const { post, get } = useForumApi();
    const [loading, setLoading] = useState(false);

    const createEscrow = useCallback(async (name: string, language: string, buyerId: number, sellerId: number, postId: number) => {
        setLoading(true);
        try {
            const response = await post('/api/escrow', { name, language, buyerId, sellerId, postId });
            return response;
        } finally {
            setLoading(false);
        }
    }, [post]);

    const getBalance = useCallback(async (name: string) => {
        setLoading(true);
        try {
            const response = await get(`/api/escrow/${name}/balance`);
            return response;
        } finally {
            setLoading(false);
        }
    }, [get]);

    const getAddress = useCallback(async (name: string) => {
        setLoading(true);
        try {
            const response = await get(`/api/escrow/${name}/address`);
            return response;
        } finally {
            setLoading(false);
        }
    }, [get]);

    const releaseEscrow = useCallback(async (name: string, destination: string) => {
        setLoading(true);
        try {
            const response = await post('/api/escrow/release', { name, destination });
            return response;
        } finally {
            setLoading(false);
        }
    }, [post]);

    const getEscrows = useCallback(async () => {
        setLoading(true);
        try {
            const response = await get('/api/escrow');
            return response;
        } finally {
            setLoading(false);
        }
    }, [get]);

    const getEscrow = useCallback(async (id: string) => {
        setLoading(true);
        try {
            const response = await get(`/api/escrow/${id}`);
            return response;
        } finally {
            setLoading(false);
        }
    }, [get]);

    return { createEscrow, getBalance, getAddress, releaseEscrow, getEscrows, getEscrow, loading };
};
