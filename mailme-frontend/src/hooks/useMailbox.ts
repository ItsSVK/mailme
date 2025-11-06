import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { createMailbox, fetchEmails } from '@/lib/api';
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
 * Hook to fetch emails since a specific date
 */
export function useEmailsSince(
  username: string | undefined,
  since: string | undefined
) {
  return useQuery({
    queryKey: ['emails', username, 'since', since],
    queryFn: () => fetchEmails(username!, since),
    enabled: !!username && !!since,
    refetchOnWindowFocus: true,
  });
}
