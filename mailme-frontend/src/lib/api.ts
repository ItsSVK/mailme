const API_BASE_URL =
  import.meta.env.VITE_API_URL || 'http://localhost:4000/api';

export interface Mailbox {
  username: string;
  email: string;
  createdAt: string;
}

export interface Email {
  id: string;
  to: string;
  from: string;
  subject: string | null;
  text: string | null;
  html: string | null;
  createdAt: string;
}

export interface CreateMailboxResponse {
  username: string;
  email: string;
  createdAt: string;
}

/**
 * Create or get a mailbox
 */
export async function createMailbox(
  username: string
): Promise<CreateMailboxResponse> {
  const response = await fetch(`${API_BASE_URL}/mails`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({ username }),
  });

  if (!response.ok) {
    const error = await response
      .json()
      .catch(() => ({ error: 'Unknown error' }));
    throw new Error(
      error.error || `Failed to create mailbox: ${response.statusText}`
    );
  }

  return response.json();
}

/**
 * Fetch emails for a username
 */
export async function fetchEmails(
  username: string,
  since?: string
): Promise<Email[]> {
  const url = new URL(`${API_BASE_URL}/mails/${username}`);
  if (since) {
    url.searchParams.set('since', since);
  }

  const response = await fetch(url.toString());

  if (!response.ok) {
    if (response.status === 404) {
      return [];
    }
    const error = await response
      .json()
      .catch(() => ({ error: 'Unknown error' }));
    throw new Error(
      error.error || `Failed to fetch emails: ${response.statusText}`
    );
  }

  return response.json();
}
