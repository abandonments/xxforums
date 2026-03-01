import { MoneroRpcConnection } from 'monero-ts';
const MONERO_RPC_HOST = process.env.MONERO_RPC_HOST || '127.0.0.1';
const MONERO_RPC_PORT = process.env.MONERO_RPC_PORT || '18081';
const MONERO_WALLET_RPC_USER = process.env.MONERO_WALLET_RPC_USER;
const MONERO_WALLET_RPC_PASSWORD = process.env.MONERO_WALLET_RPC_PASSWORD;
const connection = new MoneroRpcConnection(`http://${MONERO_RPC_HOST}:${MONERO_RPC_PORT}/json_rpc`);
if (MONERO_WALLET_RPC_USER || MONERO_WALLET_RPC_PASSWORD) {
    connection.login(MONERO_WALLET_RPC_USER, MONERO_WALLET_RPC_PASSWORD);
}
export const createEscrowWallet = async (name, language) => {
    // This is not a method on Wallet, this needs to be done via the wallet rpc
    // const wallet = await Wallet.createWallet(connection, name, language);
    // return wallet;
    throw new Error("Not implemented");
};
export const getEscrowWallet = async (name) => {
    // This is not a method on Wallet, this needs to be done via the wallet rpc
    // const wallet = await Wallet.openWallet(connection, name);
    // return wallet;
    throw new Error("Not implemented");
};
export const getEscrowBalance = async (wallet) => {
    const balance = await wallet.getBalance();
    return balance;
};
export const getEscrowAddress = async (wallet) => {
    const address = await wallet.getAddress();
    return address;
};
export const releaseEscrow = async (wallet, destination) => {
    const balance = await wallet.getBalance();
    const transaction = await wallet.createTransaction({
        address: destination,
        amount: balance,
    });
    await transaction.send();
    return transaction;
};
//# sourceMappingURL=escrow.js.map