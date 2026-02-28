
export const BADGE_INFO: Record<string, { icon: string; name: string; desc: string }> = {
  'early_bird': { icon: 'https://cdn.jsdelivr.net/gh/famfamfam/silk-icons/icons/cup.png', name: 'Early Bird', desc: 'Joined during the beta phase.' },
  'verified': { icon: 'https://cdn.jsdelivr.net/gh/famfamfam/silk-icons/icons/shield.png', name: 'Verified', desc: 'Identity verified by staff.' },
  'dev': { icon: 'https://cdn.jsdelivr.net/gh/famfamfam/silk-icons/icons/controller.png', name: 'Developer', desc: 'Contributed code to the platform.' },
  'rich': { icon: 'https://cdn.jsdelivr.net/gh/famfamfam/silk-icons/icons/money.png', name: 'Wealthy', desc: 'Donated to the server.' },
  'top_poster': { icon: 'https://cdn.jsdelivr.net/gh/famfamfam/silk-icons/icons/medal_gold_1.png', name: 'Top Poster', desc: 'One of the most active users.' },
  'beta': { icon: 'https://cdn.jsdelivr.net/gh/famfamfam/silk-icons/icons/bug.png', name: 'Bug Hunter', desc: 'Found and reported a bug.' },
};

export const CATEGORIES = [
  {
    id: 'community_lounge',
    title: 'Community Lounge',
    description: 'General talk and off-topic.',
    icon: '📁'
  },
  {
    id: 'development',
    title: 'Development',
    description: 'Talk about coding and projects.',
    icon: '💻'
  },
  {
    id: 'marketplace',
    title: 'MarketPlace',
    description: 'The universal hub for all things buying and selling.',
    icon: '🛒'
  },
  {
    id: 'staff_hq',
    title: 'Staff HQ',
    description: 'Restricted access. Staff only.',
    icon: '🔒'
  }
];

export const ADDR_XMR = '44AFFq5kSiGBoZ4NMDwYtN18obc8AemS33DBLWs3H7otXft3XjRPDtQGv7JyFTLLqUp651';
