import { MoneroWalletRpc, MoneroRpcConnection } from 'ts-monero';
import logger from './logger';
const { MONERO_RPC_HOST, MONERO_RPC_PORT, MONERO_WALLET_RPC_USER, MONERO_WALLET_RPC_PASSWORD, MONERO_WALLET_FILE, MONERO_WALLET_PASSWORD, } = process.env;
class MoneroService {
    walletRpc;
    wallet;
    constructor() {
        if (!MONERO_RPC_HOST || !MONERO_RPC_PORT || !MONERO_WALLET_FILE) {
            throw new Error('Monero RPC/Wallet environment variables not configured.');
        }
        const connection = new MoneroRpcConnection(`http://${MONERO_RPC_HOST}:${MONERO_RPC_PORT}/json_rpc`);
        if (MONERO_WALLET_RPC_USER || MONERO_WALLET_RPC_PASSWORD) {
            connection.login(MONERO_WALLET_RPC_USER, MONERO_WALLET_RPC_PASSWORD);
        }
        this.walletRpc = new MoneroWalletRpc(connection);
    }
    async getWallet() {
        if (this.wallet) {
            return this.wallet;
        }
        try {
            this.wallet = await this.walletRpc.openWallet(MONERO_WALLET_FILE, MONERO_WALLET_PASSWORD);
            logger.info('Successfully opened Monero wallet');
        }
        catch (error) {
            if (error.message.includes('Wallet file not found')) {
                logger.info('Monero wallet not found, attempting to create it...');
                try {
                    // Assuming 'English' is a safe default for the language
                    this.wallet = await this.walletRpc.createWallet(MONERO_WALLET_FILE, MONERO_WALLET_PASSWORD, 'English');
                    logger.info('Successfully created and opened new Monero wallet');
                }
                catch (creationError) {
                    logger.error('Failed to create Monero wallet:', creationError);
                    throw creationError;
                }
            }
            else {
                logger.error('Failed to open Monero wallet:', error);
                throw error;
            }
        }
        return this.wallet;
    }
    async getBalance() {
        const wallet = await this.getWallet();
        const balance = await wallet.getBalance();
        const unlockedBalance = await wallet.getUnlockedBalance();
        return { balance, unlockedBalance };
    }
    async getAddress() {
        const wallet = await this.getWallet();
        const address = await wallet.getAddress();
        return address;
    }
    async createSubaddress(label) {
        const wallet = await this.getWallet();
        // Account index 0 is the primary account
        const subaddress = await wallet.createSubaddress(0, label);
        return subaddress;
    }
    async getPayments(subaddressIndex) {
        const wallet = await this.getWallet();
        const payments = await wallet.getPayments({ subaddressIndex });
        return payments;
    }
    async verifyPayment(subaddressIndex, amount) {
        const payments = await this.getPayments(subaddressIndex);
        const totalPaid = payments.reduce((acc, payment) => acc + payment.amount, 0);
        return totalPaid >= amount;
    }
}
const moneroService = new MoneroService();
export default moneroService;
//# sourceMappingURL=monero.js.map