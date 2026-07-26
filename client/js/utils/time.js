/**
 * Formats an ISO date string into a short relative time label,
 * e.g. "5m", "3h", "2d", or a locale date once it's more than 7 days old.
 */
export const timeAgo = (isoDate) => {
  const date = new Date(isoDate);
  const seconds = Math.floor((Date.now() - date.getTime()) / 1000);

  if (seconds < 60) return 'just now';
  const minutes = Math.floor(seconds / 60);
  if (minutes < 60) return `${minutes}m`;
  const hours = Math.floor(minutes / 60);
  if (hours < 24) return `${hours}h`;
  const days = Math.floor(hours / 24);
  if (days < 7) return `${days}d`;
  return date.toLocaleDateString(undefined, { month: 'short', day: 'numeric', year: 'numeric' });
};

export const formatJoinDate = (isoDate) => {
  const date = new Date(isoDate);
  return date.toLocaleDateString(undefined, { month: 'long', year: 'numeric' });
};
