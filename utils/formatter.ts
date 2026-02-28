
export const formatDate = (date: any) => {
  try {
    if (!date) return 'N/A';
    const d = date.toDate ? date.toDate() : (date instanceof Date ? date : new Date(date));
    if (isNaN(d.getTime())) return 'N/A';
    return d.toLocaleString();
  } catch {
    return 'Error';
  }
};

export const formatRelativeTime = (date: any) => {
  try {
    if (!date) return 'never';
    const d = date.toDate ? date.toDate() : (date instanceof Date ? date : new Date(date));
    if (isNaN(d.getTime())) return 'never';

    const now = new Date();
    const diff = Math.floor((now.getTime() - d.getTime()) / 1000);

    if (diff < 60) return 'just now';
    if (diff < 3600) return `${Math.floor(diff / 60)}m ago`;
    if (diff < 86400) return `${Math.floor(diff / 3600)}h ago`;
    if (diff < 604800) return `${Math.floor(diff / 86400)}d ago`;
    
    return d.toLocaleDateString();
  } catch {
    return 'unknown';
  }
};
