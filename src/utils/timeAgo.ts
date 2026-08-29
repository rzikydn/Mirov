export const getTimeAgo = (date: Date): string => {
  const now = new Date();
  const diffInSeconds = Math.floor((now.getTime() - date.getTime()) / 1000);

  if (diffInSeconds < 60) {
    return 'just now';
  }

  const diffInMinutes = Math.floor(diffInSeconds / 60);
  if (diffInMinutes < 60) {
    return `${diffInMinutes} minute${diffInMinutes > 1 ? 's' : ''} ago`;
  }

  const diffInHours = Math.floor(diffInMinutes / 60);
  if (diffInHours < 24) {
    return `${diffInHours} hour${diffInHours > 1 ? 's' : ''} ago`;
  }

  const diffInDays = Math.floor(diffInHours / 24);
  if (diffInDays < 7) {
    return `${diffInDays} day${diffInDays > 1 ? 's' : ''} ago`;
  }

  const diffInWeeks = Math.floor(diffInDays / 7);
  if (diffInWeeks < 4) {
    return `${diffInWeeks} week${diffInWeeks > 1 ? 's' : ''} ago`;
  }

  const diffInMonths = Math.floor(diffInDays / 30);
  return `${diffInMonths} month${diffInMonths > 1 ? 's' : ''} ago`;
};

export const formatHistoryDescription = (
  userName: string,
  action: 'create' | 'edit' | 'delete',
  target: 'note' | 'database' | 'schedule',
  targetName?: string
): string => {
  const actionText = action === 'create' ? 'added' : action === 'edit' ? 'changed' : 'deleted';
  const targetText = target === 'note' ? 'note' : target === 'database' ? 'database' : 'schedule';

  if (targetName) {
    return `${userName} ${actionText} ${targetText} "${targetName}"`;
  }
  return `${userName} ${actionText} a ${targetText}`;
};
