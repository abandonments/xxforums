declare class MoneroService {
    private walletRpc;
    private wallet;
    constructor();
    private getWallet;
    getBalance(): Promise<{
        balance: any;
        unlockedBalance: any;
    }>;
    getAddress(): Promise<any>;
    createSubaddress(label: string): Promise<any>;
    getPayments(subaddressIndex: {
        major: number;
        minor: number;
    }): Promise<any>;
    verifyPayment(subaddressIndex: {
        major: number;
        minor: number;
    }, amount: number): Promise<boolean>;
    checkIncomingPayments(): Promise<MoneroTransfer[]>;
}
declare const moneroService: MoneroService;
export default moneroService;
export declare const checkIncomingPayments: () => Promise<MoneroTransfer[]>;
//# sourceMappingURL=monero.d.ts.map