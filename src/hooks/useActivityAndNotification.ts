import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/components/ui/use-toast';
import { Tables, TablesInsert } from '@/integrations/supabase/types';

/**
 * Centralized hook for logging activities and sending notifications.
 * Ensures all important client/lender/document events are tracked and users are notified.
 */
export function useActivityAndNotification() {
  const { toast } = useToast();

  /**
   * Log an activity and optionally send a notification.
   * @param activity Activity insert object (matches activities table)
   * @param notification Notification insert object (matches notifications table) or null
   */
  async function logActivityAndNotify(
    activity: TablesInsert<'activities'>,
    notification?: TablesInsert<'notifications'> | null
  ) {
    let activityError = null;
    let notificationError = null;

    // Insert activity
    if (activity) {
      console.log('[logActivityAndNotify] Inserting activity:', activity);
      const { error, data } = await supabase.from('activities').insert(activity);
      if (error) {
        activityError = error.message;
        console.error('[logActivityAndNotify] Activity insert error:', error);
        toast({
          title: 'Activity Error',
          description: error.message,
          variant: 'destructive',
        });
      } else {
        console.log('[logActivityAndNotify] Activity insert success:', data);
      }
    }

    // Insert notification
    if (notification) {
      console.log('[logActivityAndNotify] Inserting notification:', notification);
      const { error, data } = await supabase.from('notifications').insert(notification);
      if (error) {
        notificationError = error.message;
        console.error('[logActivityAndNotify] Notification insert error:', error);
        toast({
          title: 'Notification Error',
          description: error.message,
          variant: 'destructive',
        });
      } else {
        console.log('[logActivityAndNotify] Notification insert success:', data);
      }
    }

    if (!activityError && !notificationError) {
      toast({
        title: 'Success',
        description: 'Activity and notification logged.',
      });
    }
    return { activityError, notificationError };
  }

  return { logActivityAndNotify };
}

/**
 * Usage Example:
 * const { logActivityAndNotify } = useActivityAndNotification();
 * await logActivityAndNotify(activityObj, notificationObj);
 */
