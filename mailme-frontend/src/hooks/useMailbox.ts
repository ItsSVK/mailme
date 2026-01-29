import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { createMailbox, fetchEmails, fetchEmailDetails } from '@/lib/api';
import { toast } from 'sonner';

/**
 * Hook to create or get a mailbox
 */
export function useCreateMailbox() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (username: string) => createMailbox(username),
    onSuccess: data => {
      toast.success(`Mailbox created: ${data.email}`);
      queryClient.invalidateQueries({ queryKey: ['mailbox', data.username] });
    },
    onError: (error: Error) => {
      toast.error(error.message || 'Failed to create mailbox');
    },
  });
}

/**
 * Hook to fetch emails for a username
 */
export function useEmails(
  username: string | undefined,
  options?: {
    enabled?: boolean;
    refetchInterval?: number;
  }
) {
  return useQuery({
    queryKey: ['emails', username],
    queryFn: () => fetchEmails(username!),
    enabled: options?.enabled ?? !!username,
    refetchInterval: options?.refetchInterval,
    refetchOnWindowFocus: true,
  });
}

/**
 * Hook to fetch full email details
 */
export function useEmailDetails(
  username: string | undefined,
  emailId: string | undefined
) {
  return useQuery({
    queryKey: ['email', username, emailId],
    queryFn: () => fetchEmailDetails(username!, emailId!),
    enabled: !!username && !!emailId,
    refetchOnWindowFocus: false, // Email content usually doesn't change
    staleTime: 1000 * 60 * 5, // Keep in cache for 5 minutes
  });
}

/**
 * Hook to fetch emails since a specific date
 * @deprecated The new worker backend handles 24h retention automatically.
 */
export function useEmailsSince(
  username: string | undefined,
  _since: string | undefined
) {
  return useQuery({
    queryKey: ['emails', username],
    queryFn: () => fetchEmails(username!),
    enabled: !!username,
    refetchOnWindowFocus: true,
  });
}
