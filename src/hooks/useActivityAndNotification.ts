import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/components/ui/use-toast';
import { Tables, TablesInsert } from '@/integrations/supabase/types';

/**
 * Enhanced activity logging system that supports all entity types
 */
export function useActivityAndNotification() {
  const { toast } = useToast();

  /**
   * Enhanced activity logging with flexible entity support
   */
  async function logActivity(params: {
    action_type: string;
    description: string;
    user_id: string;
    // Entity references - at least one must be provided
    client_id?: string | null;
    lender_id?: string | null;
    opportunity_id?: string | null;
    loan_id?: string | null;
    people_id?: string | null;
    realtor_id?: string | null;
    document_id?: string | null;
    // Optional notification
    notification?: {
      type: string;
      message: string;
      entity_type?: string;
      entity_id?: string;
    };
  }) {
    try {
      // Prepare activity data
      const activityData: TablesInsert<'activities'> = {
        action_type: params.action_type,
        description: params.description,
        user_id: params.user_id,
        client_id: params.client_id || null,
        lender_id: params.lender_id || null,
        opportunity_id: params.opportunity_id || null,
        loan_id: params.loan_id || null,
        people_id: params.people_id || null,
        realtor_id: params.realtor_id || null,
        document_id: params.document_id || null,
      };

      console.log('[logActivity] Inserting activity:', activityData);

      // Insert activity
      const { error: activityError } = await supabase
        .from('activities')
        .insert(activityData);

      if (activityError) {
        console.error('[logActivity] Activity insert error:', activityError);
        // Don't show toast for activity errors as they're not critical to main functionality
        return { success: false, error: activityError.message };
      }

      // Insert notification if provided
      if (params.notification) {
        const notificationData: TablesInsert<'notifications'> = {
          user_id: params.user_id,
          type: params.notification.type,
          message: params.notification.message,
          entity_type: params.notification.entity_type || 'activity',
          entity_id: params.notification.entity_id || params.loan_id || params.opportunity_id || params.client_id || null,
          read: false,
        };

        console.log('[logActivity] Inserting notification:', notificationData);

        const { error: notificationError } = await supabase
          .from('notifications')
          .insert(notificationData);

        if (notificationError) {
          console.error('[logActivity] Notification insert error:', notificationError);
          // Don't fail the whole operation for notification errors
        }
      }

      return { success: true, error: null };
    } catch (error) {
      console.error('[logActivity] Unexpected error:', error);
      return { success: false, error: error instanceof Error ? error.message : 'Unknown error' };
    }
  }

  /**
   * Convenience method for loan activities
   */
  async function logLoanActivity(params: {
    action_type: 'loan_created' | 'loan_updated' | 'loan_deleted' | 'loan_status_changed';
    description: string;
    user_id: string;
    loan_id: string;
    client_id?: string | null;
    lender_id?: string | null;
    opportunity_id?: string | null;
    showNotification?: boolean;
  }) {
    return logActivity({
      ...params,
      notification: params.showNotification ? {
        type: params.action_type,
        message: params.description,
        entity_type: 'loan',
        entity_id: params.loan_id,
      } : undefined,
    });
  }

  /**
   * Convenience method for opportunity activities
   */
  async function logOpportunityActivity(params: {
    action_type: 'opportunity_created' | 'opportunity_updated' | 'opportunity_stage_changed' | 'opportunity_converted_to_loan';
    description: string;
    user_id: string;
    opportunity_id: string;
    client_id?: string | null;
    people_id?: string | null;
    showNotification?: boolean;
  }) {
    return logActivity({
      ...params,
      notification: params.showNotification ? {
        type: params.action_type,
        message: params.description,
        entity_type: 'opportunity',
        entity_id: params.opportunity_id,
      } : undefined,
    });
  }

  /**
   * Convenience method for client activities
   */
  async function logClientActivity(params: {
    action_type: 'client_created' | 'client_updated' | 'client_deleted';
    description: string;
    user_id: string;
    client_id: string;
    people_id?: string | null;
    showNotification?: boolean;
  }) {
    return logActivity({
      ...params,
      notification: params.showNotification ? {
        type: params.action_type,
        message: params.description,
        entity_type: 'client',
        entity_id: params.client_id,
      } : undefined,
    });
  }

  /**
   * Convenience method for people activities
   */
  async function logPersonActivity(params: {
    action_type: 'person_created' | 'person_updated' | 'person_deleted';
    description: string;
    user_id: string;
    people_id: string;
    client_id?: string | null;
    showNotification?: boolean;
  }) {
    return logActivity({
      ...params,
      notification: params.showNotification ? {
        type: params.action_type,
        message: params.description,
        entity_type: 'person',
        entity_id: params.people_id,
      } : undefined,
    });
  }

  /**
   * Legacy method for backward compatibility
   */
  async function logActivityAndNotify(
    activity: TablesInsert<'activities'>,
    notification?: TablesInsert<'notifications'> | null
  ) {
    return logActivity({
      action_type: activity.action_type,
      description: activity.description,
      user_id: activity.user_id,
      client_id: activity.client_id,
      lender_id: activity.lender_id,
      opportunity_id: activity.opportunity_id,
      loan_id: activity.loan_id,
      people_id: activity.people_id,
      realtor_id: activity.realtor_id,
      document_id: activity.document_id,
      notification: notification ? {
        type: notification.type,
        message: notification.message,
        entity_type: notification.entity_type,
        entity_id: notification.entity_id,
      } : undefined,
    });
  }

  return {
    logActivity,
    logLoanActivity,
    logOpportunityActivity,
    logClientActivity,
    logPersonActivity,
    // Legacy support
    logActivityAndNotify,
  };
}