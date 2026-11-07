/**
 * Discord invite resolver.
 * Uses the public Discord API to get server info from an invite code.
 * Never exposes raw Discord API errors to customers.
 */

const DISCORD_API = 'https://discord.com/api/v10';
const DISCORD_CDN = 'https://cdn.discordapp.com';

export interface ResolvedInvite {
  valid: true;
  serverId: string;
  serverName: string;
  serverIcon: string | null;
  memberCount: number | null;
  inviteCode: string;
}

export interface InvalidInvite {
  valid: false;
  error: string;
}

/**
 * Clean an invite string - accepts full URLs, discord.gg links, or bare codes.
 * Returns the raw invite code.
 */
export function cleanInviteCode(raw: string): string {
  return raw
    .trim()
    .replace(/^https?:\/\/(www\.)?discord\.gg\//i, '')
    .replace(/^https?:\/\/(www\.)?discord\.com\/invite\//i, '')
    .replace(/^discord\.gg\//i, '')
    .replace(/^invite\//i, '')
    .split('?')[0]!
    .split('/')[0]!
    .trim();
}

export async function resolveDiscordInvite(raw: string): Promise<ResolvedInvite | InvalidInvite> {
  const code = cleanInviteCode(raw);

  if (!code || code.length < 2 || code.length > 25 || !/^[a-zA-Z0-9-]+$/.test(code)) {
    return { valid: false, error: 'Invalid or expired invite link.' };
  }

  try {
    const res = await fetch(
      `${DISCORD_API}/invites/${encodeURIComponent(code)}?with_counts=true`,
      {
        headers: {
          'User-Agent': 'DiscordBot (boost.mskhub.store, 1.0)',
          Accept: 'application/json',
        },
      },
    );

    if (res.status === 404 || res.status === 400) {
      return { valid: false, error: 'Invalid or expired invite link.' };
    }
    if (res.status === 429) {
      return { valid: false, error: 'Unable to verify invite right now. Please try again in a moment.' };
    }
    if (!res.ok) {
      return { valid: false, error: 'Could not verify the invite link. Please try again.' };
    }

    const data = await res.json() as {
      guild?: { id: string; name: string; icon: string | null };
      approximate_member_count?: number;
    };

    if (!data.guild) {
      return { valid: false, error: 'This invite is for a group DM or is invalid.' };
    }

    const { id, name, icon } = data.guild;
    const iconUrl = icon
      ? `${DISCORD_CDN}/icons/${id}/${icon}.${icon.startsWith('a_') ? 'gif' : 'png'}?size=128`
      : null;

    return {
      valid: true,
      serverId: id,
      serverName: name,
      serverIcon: iconUrl,
      memberCount: data.approximate_member_count ?? null,
      inviteCode: code,
    };
  } catch (err) {
    // Log internally but never expose to customer
    console.error('[discord] Invite resolve error:', err instanceof Error ? err.message : err);
    return { valid: false, error: 'Could not verify the invite link. Please try again.' };
  }
}
