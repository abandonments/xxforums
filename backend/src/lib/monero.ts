import moneroTs, { MoneroTransfer, MoneroWalletRpc, MoneroTransferQuery } from 'monero-ts';
import logger from './logger.js';

const {
  MONERO_RPC_HOST,
  MONERO_RPC_PORT,
  MONERO_WALLET_RPC_USER,
  MONERO_WALLET_RPC_PASSWORD,
  MONERO_WALLET_FILE,
  MONERO_WALLET_PASSWORD,
} = process.env;

class MoneroService {
  private walletRpc: MoneroWalletRpc | undefined;

  constructor() {
    if (!MONERO_RPC_HOST || !MONERO_RPC_PORT || !MONERO_WALLET_FILE || !MONERO_WALLET_PASSWORD) {
      throw new Error('Monero RPC/Wallet environment variables not configured.');
    }
  }

  private async getWalletRpc(): Promise<MoneroWalletRpc> {
    if (this.walletRpc) {
      return this.walletRpc;
    }

    try {
      this.walletRpc = await moneroTs.connectToWalletRpc(
        `http://${MONERO_RPC_HOST}:${MONERO_RPC_PORT}/json_rpc`,
        MONERO_WALLET_RPC_USER,
        MONERO_WALLET_RPC_PASSWORD
      );

      // Check if wallet exists, if not create it.
      try {
        await this.walletRpc.openWallet(MONERO_WALLET_FILE!, MONERO_WALLET_PASSWORD!);
      } catch (error: any) {
        if (error.message.includes('Wallet file not found') || error.getCode() === -1) {
          logger.info('Monero wallet not found, attempting to create it...');
          await this.walletRpc.createWallet({
            path: MONERO_WALLET_FILE!,
            password: MONERO_WALLET_PASSWORD!,
            language: 'English',
          });
          logger.info('Successfully created and opened new Monero wallet');
        } else {
          throw error;
        }
      }

      return this.walletRpc;
    } catch (error) {
      logger.error('Failed to connect to Monero Wallet RPC:', error);
      throw error;
    }
  }

  public async getBalance() {
    const walletRpc = await this.getWalletRpc();
    const balance = await walletRpc.getBalance();
    const unlockedBalance = await walletRpc.getUnlockedBalance();
    return { balance, unlockedBalance };
  }

  public async getAddress() {
    const walletRpc = await this.getWalletRpc();
    const address = await walletRpc.getAddress(0, 0); // Get address for account 0, subaddress 0
    return address;
  }
  
  public async createSubaddress(label: string) {
    const walletRpc = await this.getWalletRpc();
    // Account index 0 is the primary account
    const subaddress = await walletRpc.createSubaddress(0, label);
    return subaddress;
  }

  public async getPayments(subaddressIndex: { major: number; minor: number }) {
    const walletRpc = await this.getWalletRpc();
    const query = new MoneroTransferQuery();
    query.setIsIncoming(true);
    query.setIsOutgoing(false);
    query.setSubaddressIndices([subaddressIndex.minor]);
    const payments = await walletRpc.getTransfers(query);
    return payments;
  }
  
  public async verifyPayment(subaddressIndex: { major: number; minor: number }, amount: number): Promise<boolean> {
    const payments = await this.getPayments(subaddressIndex);
    const totalPaid = payments.reduce((acc: number, payment: MoneroTransfer) => acc + Number(payment.getAmount()), 0);
    return totalPaid >= amount;
  }

  public async checkIncomingPayments(): Promise<MoneroTransfer[]> {
    const walletRpc = await this.getWalletRpc();
    const transfers = await walletRpc.getTransfers({ isIncoming: true });
    return transfers;
  }
}

const moneroService = new MoneroService();
export default moneroService;

export const checkIncomingPayments = async () => {
    return await moneroService.checkIncomingPayments();
}
