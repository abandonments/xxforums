import { Request, Response } from 'express';
import * as escrow from '../lib/escrow.js';
import { knexInstance as db } from '../../index.js';
import { v4 as uuidv4 } from 'uuid';
import { encrypt, decrypt } from '../lib/crypto.js';
import moneroTs from 'monero-ts';

export const createEscrow = async (req: Request, res: Response) => {
    try {
        const { buyerId, sellerId, postId } = req.body;
        const walletName = uuidv4();
        const password = uuidv4();
        
        const wallet = await escrow.createEscrowWallet(walletName, password);
        const address = await escrow.getEscrowAddress(wallet);

        const encryptedPassword = encrypt(password);

        await db('escrows').insert({
            name: walletName,
            address,
            buyer_id: buyerId,
            seller_id: sellerId,
            post_id: postId,
            status: 'funded',
            wallet_path: wallet.getPath(),
            wallet_password: encryptedPassword,
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
        const escrowData = await db('escrows').where({ name }).first();
        if (!escrowData) {
            return res.status(404).json({ error: 'Escrow not found' });
        }
        const password = decrypt(escrowData.wallet_password);
        const wallet = await moneroTs.openWalletFull({ path: escrowData.wallet_path, password });
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
        const escrowData = await db('escrows').where({ name }).first();
        if (!escrowData) {
            return res.status(404).json({ error: 'Escrow not found' });
        }
        res.json({ address: escrowData.address });
    } catch (error) {
        console.error(error);
        res.status(500).json({ error: 'Failed to get escrow address' });
    }
};

export const releaseEscrow = async (req: Request, res: Response) => {
    try {
        const { name, destination } = req.body;
        const escrowData = await db('escrows').where({ name }).first();
        if (!escrowData) {
            return res.status(404).json({ error: 'Escrow not found' });
        }
        const password = decrypt(escrowData.wallet_password);
        const wallet = await moneroTs.openWalletFull({ path: escrowData.wallet_path, password });
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
