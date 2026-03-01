import moneroTs, { MoneroWallet } from 'monero-ts';
import logger from './logger.js';

const {
  MONERO_RPC_HOST,
  MONERO_RPC_PORT,
  MONERO_WALLET_RPC_USER,
  MONERO_WALLET_RPC_PASSWORD,
} = process.env;

/**
 * Creates a new Monero wallet for an escrow transaction.
 * @param password - The password to encrypt the wallet with.
 * @returns The newly created wallet.
 */
export const createEscrowWallet = async (path: string, password: string): Promise<MoneroWallet> => {
  try {
    const wallet = await moneroTs.createWalletFull({
      path: path,
      password: password,
      networkType: 'stagenet', // Use stagenet for testing
      server: {
        uri: `http://${MONERO_RPC_HOST}:${MONERO_RPC_PORT}/json_rpc`,
        ...(MONERO_WALLET_RPC_USER && { username: MONERO_WALLET_RPC_USER }),
        ...(MONERO_WALLET_RPC_PASSWORD && { password: MONERO_WALLET_RPC_PASSWORD }),
      },
    });
    return wallet;
  } catch (error) {
    logger.error('Failed to create escrow wallet:', error);
    throw error;
  }
};

/**
 * Gets the balance of an escrow wallet.
 * @param wallet - The wallet to get the balance of.
 * @returns The balance of the wallet.
 */
export const getEscrowBalance = async (wallet: MoneroWallet) => {
    const balance = await wallet.getBalance();
    return balance;
};

/**
 * Gets the address of an escrow wallet.
 * @param wallet - The wallet to get the address of.
 * @returns The address of the wallet.
 */
export const getEscrowAddress = async (wallet: MoneroWallet) => {
    const address = await wallet.getAddress(0, 0);
    return address;
};

/**
 * Releases the funds from an escrow wallet to a destination address.
 * @param wallet - The wallet to release the funds from.
 * @param destination - The address to send the funds to.
 */
export const releaseEscrow = async (wallet: MoneroWallet, destination: string) => {
    const balance = await wallet.getBalance();
    const tx = await wallet.createTx({
        accountIndex: 0,
        address: destination,
        amount: balance,
    });
    await wallet.relayTx(tx);
    return tx;
};
