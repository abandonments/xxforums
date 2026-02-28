
import { Wallet, RpcConnection } from 'ts-monero';

const MONERO_RPC_HOST = process.env.MONERO_RPC_HOST || '127.0.0.1';
const MONERO_RPC_PORT = process.env.MONERO_RPC_PORT || '18081';
const MONERO_WALLET_RPC_USER = process.env.MONERO_WALLET_RPC_USER;
const MONERO_WALLET_RPC_PASSWORD = process.env.MONERO_WALLET_RPC_PASSWORD;

const connection = new RpcConnection(`http://${MONERO_RPC_HOST}:${MONERO_RPC_PORT}/json_rpc`);
connection.login(MONERO_WALLET_RPC_USER, MONERO_WALLET_RPC_PASSWORD);

export const createEscrowWallet = async (name: string, language: string) => {
    const wallet = await Wallet.createWallet(connection, name, language);
    return wallet;
};

export const getEscrowWallet = async (name: string) => {
    const wallet = await Wallet.openWallet(connection, name);
    return wallet;
};

export const getEscrowBalance = async (wallet: Wallet) => {
    const balance = await wallet.getBalance();
    return balance;
};

export const getEscrowAddress = async (wallet: Wallet) => {
    const address = await wallet.getAddress();
    return address;
};

export const releaseEscrow = async (wallet: Wallet, destination: string) => {
    const balance = await wallet.getBalance();
    const transaction = await wallet.createTransaction({
        address: destination,
        amount: balance,
    });
    await transaction.send();
    return transaction;
};
