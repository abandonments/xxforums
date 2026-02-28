import React, { useState, useEffect, useContext } from 'react';
import { useAuth } from '../context/AuthContext';
import { useUI } from '../context/UIContext';
import { UserRole } from '../types';
import { Button, Panel, RoleBadge } from '../components/UI';
import { Link } from 'react-router-dom';
import api from '../src/lib/api'; // Use the custom api instance
import { toast } from 'react-toastify';

const PlanCard = ({ title, price, features, role, recommended = false, secret = false, onSelect, currentRole }: any) => {
    const isCurrent = currentRole === role;
    
    // Determine hierarchy level to prevent downgrading in UI (simple check)
    const roleLevel: Record<string, number> = { [UserRole.USER]: 0, [UserRole.VIP]: 1, [UserRole.RICH]: 2, [UserRole.ELITE]: 3 };
    const currentLevel = roleLevel[currentRole as string] || 0;
    const thisLevel = roleLevel[role as string] || 0;
    const isHigher = currentLevel >= thisLevel && !isCurrent;

    let titleColor = 'text-white';
    if (role === UserRole.VIP) titleColor = 'text-purple-400';
    if (role === UserRole.RICH) titleColor = 'text-yellow-400';
    if (role === UserRole.ELITE) titleColor = 'text-cyan-400';

    return (
        <div className="relative flex flex-col p-6 border border-border bg-panel hover:bg-[#1f1f1f] transition-colors duration-300">
            {recommended && (
                <div className="absolute top-4 right-4 text-yellow-500 text-[10px] font-bold uppercase tracking-wider">
                    Recommended
                </div>
            )}
            {secret && (
                 <div className="absolute top-4 right-4 text-cyan-500 text-[10px] font-bold uppercase tracking-wider">
                    Secret
                </div>
            )}

            <div className={`text-2xl font-bold mb-1 font-mono tracking-tight ${titleColor}`}>{title}</div>
            <div className="text-xl font-bold text-white mb-8 font-mono">
                {price} <span className="text-xs text-textMuted font-sans font-normal">/ lifetime</span>
            </div>
            
            <ul className="space-y-3 mb-10 flex-1">
                {features.map((f: string, i: number) => (
                    <li key={i} className="flex items-start gap-3 text-xs text-textMain">
                        <span className="text-textMuted opacity-50">•</span> {f}
                    </li>
                ))}
            </ul>

            {isCurrent ? (
                <div className="w-full py-2 text-center border border-dashed border-border text-textMuted font-bold text-xs uppercase cursor-default opacity-50">
                    Current Plan
                </div>
            ) : isHigher ? (
                <div className="w-full py-2 text-center border border-border bg-black/20 text-textMuted font-bold text-xs uppercase cursor-not-allowed opacity-50">
                    Owned
                </div>
            ) : (
                <button 
                    className="w-full py-2 text-xs font-bold border border-textMuted text-textMain hover:border-white hover:text-white transition-colors uppercase bg-transparent"
                    onClick={() => onSelect(role, price)}
                >
                    Purchase
                </button>
            )}
        </div>
    );
};

export const Upgrade = () => {
    const { user, userProfile } = useAuth();
    const { openAuthModal } = useUI();
    
    const [selectedPlan, setSelectedPlan] = useState<{role: UserRole, price: string} | null>(null);
    const [step, setStep] = useState<'select' | 'payment' | 'confirming'>('select');
    const [depositAddress, setDepositAddress] = useState<string | null>(null);
    const [loadingAddress, setLoadingAddress] = useState<boolean>(false);
    
    const getAmount = (role: UserRole) => {
        const isElite = role === UserRole.ELITE;
        const isRich = role === UserRole.RICH;
        const isVip = role === UserRole.VIP;
        
        // Fixed XMR prices
        if (isElite) return '0.65';
        if (isRich) return '0.10';
        if (isVip) return '0.03';
        return '0';
    };

    const handleSelect = async (role: UserRole, price: string) => {
        if (!user) {
            openAuthModal();
            return;
        }
        setSelectedPlan({ role, price });
        setStep('payment');
        setLoadingAddress(true);

        try {
            const response = await api.get('/api/monero/deposit-address');
            setDepositAddress(response.data.address);
        } catch (error) {
            console.error('Error getting deposit address:', error);
            toast.error('Could not get a deposit address. Please try again later.');
            setStep('select');
        } finally {
            setLoadingAddress(false);
        }
    };

    if (step === 'payment' || step === 'confirming') {
        const requiredAmount = getAmount(selectedPlan?.role || UserRole.VIP);

        return (
            <div className="max-w-xl mx-auto p-4 mt-8">
                <div className="text-xs text-textMuted mb-2 cursor-pointer hover:text-white" onClick={() => setStep('select')}>
                    &laquo; Back to Plans
                </div>
                <Panel title={`Secure Checkout - ${selectedPlan?.price}`}>
                    <div className="p-6">
                        <div className="bg-[#0d1117] border border-border p-4 mb-6 rounded text-center">
                            {loadingAddress ? (
                                <div className="animate-pulse">Loading deposit address...</div>
                            ) : depositAddress ? (
                                <>
                                    <div className="text-xs text-textMuted mb-2">Send exactly <span className="text-white font-bold">{requiredAmount} XMR</span> to:</div>
                                    <div className="bg-black p-3 font-mono text-xs break-all border border-border text-orange-400 rounded select-all cursor-pointer transition-colors hover:bg-orange-900/10">
                                        {depositAddress}
                                    </div>
                                    <div className="text-[10px] text-textMuted mt-2">
                                        Your payment will be automatically detected. Do not send from an exchange.
                                    </div>
                                </>
                            ) : (
                                <div className="text-red-500">Could not load deposit address.</div>
                            )}
                        </div>
                        <div className="w-full py-6 bg-black border border-accent text-accent font-bold text-xs text-center flex flex-col items-center justify-center gap-2">
                            <div className="animate-spin text-xl">↻</div> 
                            <div>AWAITING PAYMENT</div>
                            <div className="text-[10px] text-textMuted max-w-xs mt-2">
                                This page will automatically update once your payment is confirmed on the Monero network.
                            </div>
                        </div>
                    </div>
                </Panel>
            </div>
        );
    }

    return (
        <div className="max-w-6xl mx-auto p-4">
            <div className="text-center mb-10 mt-6">
                <h1 className="text-2xl font-bold text-white mb-2 tracking-tight">Account Upgrades</h1>
                <p className="text-xs text-textMuted max-w-xl mx-auto">
                    Stand out from the crowd and unlock exclusive features. 
                    <br/><span className="text-orange-500 font-bold">Monero (XMR) only</span> for privacy and security.
                </p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-6 max-w-5xl mx-auto">
                <PlanCard 
                    title="VIP" 
                    price="$5.00"
                    role={UserRole.VIP}
                    currentRole={userProfile?.role}
                    onSelect={handleSelect}
                    features={[
                        "Purple Username Color",
                        "Exclusive 'VIP' Badge",
                        "Larger Avatar File Size",
                        "Custom Profile Banner",
                        "Priority Support"
                    ]}
                />
                
                <PlanCard 
                    title="RICH" 
                    price="$15.00"
                    role={UserRole.RICH}
                    recommended={true}
                    currentRole={userProfile?.role}
                    onSelect={handleSelect}
                    features={[
                        "Everything in VIP",
                        "Gold Username Color",
                        "Exclusive 'RICH' Badge",
                        "Animated Profile Picture",
                        "No Rate Limits"
                    ]}
                />

                <PlanCard 
                    title="ELITE" 
                    price="$100.00"
                    role={UserRole.ELITE}
                    secret={true}
                    currentRole={userProfile?.role}
                    onSelect={handleSelect}
                    features={[
                        "Everything in RICH",
                        "Cyan Username Color",
                        "Exclusive 'ELITE' Badge",
                        "Access to 'Rich Club'",
                        "Custom User Title",
                        "Zero Fees on Escrow"
                    ]}
                />
            </div>
            
            <div className="mt-12 text-center text-[10px] text-textMuted opacity-50">
                Payments are processed automatically via private Monero node. NO EXCHANGES OR KYC.
            </div>
        </div>
    );
};
