import { Request, Response } from 'express';
import * as escrow from '../lib/escrow.js';
import { knexInstance as db } from '../../index.js';

export const createEscrow = async (req: Request, res: Response) => {
    try {
        const { name, language, buyerId, sellerId, postId } = req.body;
        const wallet = await escrow.createEscrowWallet(name, language);
        const address = await escrow.getEscrowAddress(wallet);

        await db('escrows').insert({
            name,
            address,
            buyer_id: buyerId,
            seller_id: sellerId,
            post_id: postId,
            status: 'funded',
        });

        res.json({ address });
    } catch (error) {
        console.error(error);
        res.status(500).json({ error: 'Failed to create escrow' });
    }
};

export const getBalance = async (req: Request, res: Response) => {
    try {
        const { name } = req.params;
        const wallet = await escrow.getEscrowWallet(name as string);
        const balance = await escrow.getEscrowBalance(wallet);
        res.json({ balance });
    } catch (error) {
        console.error(error);
        res.status(500).json({ error: 'Failed to get escrow balance' });
    }
};

export const getAddress = async (req: Request, res: Response) => {
    try {
        const { name } = req.params;
        const wallet = await escrow.getEscrowWallet(name as string);
        const address = await escrow.getEscrowAddress(wallet);
        res.json({ address });
    } catch (error) {
        console.error(error);
        res.status(500).json({ error: 'Failed to get escrow address' });
    }
};

export const releaseEscrow = async (req: Request, res: Response) => {
    try {
        const { name, destination } = req.body;
        const wallet = await escrow.getEscrowWallet(name);
        const transaction = await escrow.releaseEscrow(wallet, destination);

        await db('escrows').where({ name }).update({
            status: 'released',
        });

        res.json({ transaction });
    } catch (error) {
        console.error(error);
        res.status(500).json({ error: 'Failed to release escrow' });
    }
};

export const getEscrows = async (req: Request, res: Response) => {
    try {
        const escrows = await db('escrows').select('*');
        res.json(escrows);
    } catch (error) {
        console.error(error);
        res.status(500).json({ error: 'Failed to get escrows' });
    }
};

export const getEscrow = async (req: Request, res: Response) => {
    try {
        const { id } = req.params;
        const escrow = await db('escrows').where({ id: id as string }).first();
        res.json(escrow);
    } catch (error) {
        console.error(error);
        res.status(500).json({ error: 'Failed to get escrow' });
    }
};
