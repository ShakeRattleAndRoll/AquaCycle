import { requireSupabase } from './supabase';

export type AppNotification = {
  id: string;
  orderId: string;
  title: string;
  subtitle: string;
  icon: string;
  iconColor: string;
  bgColor: string;
  readAt: string | null;
  createdAt: string;
  isStaffNotification: boolean;
};

const NOTIFICATION_STYLE: Record<string, { icon: string; color: string; background: string }> = {
  order_received: { icon: 'receipt-text-outline', color: '#0284c7', background: '#e0f2fe' },
  order_status: { icon: 'washing-machine', color: '#0284c7', background: '#e0f2fe' },
  payment_review: { icon: 'hourglass-top', color: '#b45309', background: '#fef3c7' },
  payment_paid: { icon: 'check-circle-outline', color: '#16a34a', background: '#dcfce7' },
};

export async function fetchAppNotifications(): Promise<AppNotification[]> {
  const client = requireSupabase();
  const { data: { user }, error: userError } = await client.auth.getUser();
  if (userError) throw userError;
  if (!user) throw new Error('Sign in to view notifications.');
  const { data: profile, error: profileError } = await client.from('profiles').select('role').eq('id', user.id).single();
  if (profileError) throw profileError;
  const { data, error } = await client
    .from('notifications')
    .select('id,order_id,notification_type,title,message,created_at,read_at')
    .order('created_at', { ascending: false })
    .limit(50);
  if (error) throw error;

  return (data ?? []).map((item) => {
    const style = NOTIFICATION_STYLE[item.notification_type] ?? NOTIFICATION_STYLE.order_status;
    return {
      id: item.id,
      orderId: item.order_id,
      title: item.title,
      subtitle: item.message,
      icon: style.icon,
      iconColor: style.color,
      bgColor: style.background,
      readAt: item.read_at,
      createdAt: item.created_at,
      isStaffNotification: profile.role === 'staff',
    };
  });
}

export async function markAppNotificationRead(notificationId: string) {
  const client = requireSupabase();
  const { data: { user }, error: userError } = await client.auth.getUser();
  if (userError) throw userError;
  if (!user) throw new Error('Sign in to update notifications.');

  const { error } = await client
    .from('notifications')
    .update({ read_at: new Date().toISOString() })
    .eq('id', notificationId)
    .eq('recipient_id', user.id)
    .is('read_at', null);
  if (error) throw error;
}

export async function markAllAppNotificationsRead() {
  const client = requireSupabase();
  const { data: { user }, error: userError } = await client.auth.getUser();
  if (userError) throw userError;
  if (!user) throw new Error('Sign in to update notifications.');

  const { error } = await client
    .from('notifications')
    .update({ read_at: new Date().toISOString() })
    .eq('recipient_id', user.id)
    .is('read_at', null);
  if (error) throw error;
}
