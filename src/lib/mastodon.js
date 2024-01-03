import { BASE_URL } from "$lib/store";
import { writable, get } from "svelte/store";

/**
 * @typedef {Object} Emoji
 * @property {string} shortcode
 * @property {string} static_url
 * 
 * @typedef {Object} Application
 * @property {string} name
 * @property {string} website
 * 
 * @typedef {Object} AccountField
 * @property {string} name
 * @property {string} value
 * @property {string} verified_at
 * 
 * @typedef {Object} Account
 * @property {string} id
 * @property {string} username
 * @property {string} acct
 * @property {string} display_name
 * @property {boolean} locked
 * @property {boolean} bot
 * @property {boolean} discoverable
 * @property {boolean} group
 * @property {string} created_at
 * @property {string} note
 * @property {string} url
 * @property {string} uri
 * @property {string} avatar
 * @property {string} avatar_static
 * @property {string} header
 * @property {string} header_static
 * @property {number} followers_count
 * @property {number} following_count
 * @property {number} statuses_count
 * @property {string} last_status_at
 * @property {boolean} [suspended=false]
 * @property {boolean} noindex
 * @property {Emoji[]} emojis
 * @property {string[]} roles
 * @property {AccountField[]} fields
 * 
 * @typedef {Object} Tag
 * @property {string} name
 * @property {string} url
 * 
 * @typedef {Object} MediaAttachment
 * @property {"image" | "video" | "gifv" | "audio" | unknown} type
 * @property {string} url
 * @property {string} preview_url
 * @property {string} description
 * @property {string} mime_type
 * 
 * @typedef PollOption
 * @property {string} title
 * @property {number} votes_count
 * 
 * @typedef {Object} Poll
 * @property {string} id
 * @property {string} expires_at
 * @property {boolean} expired
 * @property {boolean} multiple
 * @property {number} votes_count
 * @property {number | null} voters_count
 * @property {boolean} voted
 * @property {number[]} own_votes
 * @property {PollOption[]} options
 * @property {Emoji[]} emojis
 * 
 * @typedef {Object} Mention
 * @property {string} id
 * @property {string} username
 * @property {string} url
 * @property {string} acct
 * 
 * @typedef {Object} Card
 * @property {string} url
 * @property {string} title
 * @property {string} description
 * @property {string} language
 * @property {string} type
 * @property {string} author_name
 * @property {string} author_url
 * @property {string} provider_name
 * @property {string} provider_url
 * @property {string} html
 * @property {number} width
 * @property {number} height
 * @property {string} image
 * @property {string} image_description
 * @property {string} embed_url
 * @property {string} blurhash
 * @property {string} published_at
 * 
 * @typedef {Object} Status
 * @property {string} id
 * @property {string} created_at
 * @property {string} in_reply_to_id
 * @property {string} in_reply_to_account_id
 * @property {boolean} sensitive
 * @property {string} spoiler_text
 * @property {string} visibility
 * @property {string} language
 * @property {string} uri
 * @property {string} url
 * @property {number} replies_count
 * @property {number} reblogs_count
 * @property {number} favourites_count
 * @property {string} edited_at
 * @property {string} content
 * @property {Status | null} reblog
 * @property {Application} [application]
 * @property {Account} account
 * @property {MediaAttachment[]} media_attachments
 * @property {Mention[]} mentions
 * @property {Tag[]} tags
 * @property {Emoji[]} emojis
 * @property {Card | null} card
 * @property {Poll | null} poll
 */

/**
 * @typedef {Object} CacheCriteria
 * @property {string} instance
 * @property {string} userId
 * @property {string[]} tags
 * 
 * @typedef {Object} CacheEntry
 * @property {Status[]} toots
 * @property {number} lastUpdate
 * 
 * @typedef {import("svelte/store").Writable<Map<CacheCriteria, CacheEntry>>} PostCache
 */
const postCache = writable(new Map());
const POST_URL = `${BASE_URL}/blog/p/`;
/**
 * Returns a cached list of posts tagged with the given tags.
 * 
 * @param {string} instance mastodon instance
 * @param {string} userId mastodon user id
 * @param {string[]} tags post tags
 * @returns {Promise<Status[]>}
 */
export async function blogPostToots(instance, userId, tags = ["blog", "post"]) {
    let cache = get(postCache);

    let cached = Array.from(cache.entries()).find(([key]) =>
        key.instance === instance && key.userId === userId && key.tags.every((tag) => tags.includes(tag))
    );
    cached = cached ? cached[1] : null;

    if (cached) {
        // cache entries are valid for 20 minutes
        if (cached.lastUpdate < Date.now() - 1000 * 60 * 20) {
            postCache.update((cache) => {
                cache.delete({ instance, userId, tags });
                return cache;
            });
        } else {
            return cached.toots;
        }
    }

    let response = await fetch(
        `https://${instance}/api/v1/accounts/${userId}/statuses?exclude_replies=true&exclude_reblogs=true&${tags.map((tag) => `tagged=${tag}`).join("&")}`
    );
    let data = await response.json();

    if (!Array.isArray(data) || data.length === 0) {
        postCache.update((cache) => {
            cache.set({ instance, userId, tags }, { toots: [], lastUpdate: Date.now() });
            return cache;
        })
        return [];
    }

    data = data
        .filter((it) => it["content"].includes(POST_URL))
        .sort((a, b) => a.created_at.localeCompare(b.created_at));

    postCache.update((cache) => {
        cache.set({ instance, userId, tags }, { toots: data, lastUpdate: Date.now() });
        return cache;
    });

    return data;
}

/**
 * Returns a cached toot for the given slug.
 * 
 * @param {string} instance mastodon instance
 * @param {string} userId mastodon user id
 * @param {string} slug post slug
 * @param {string[]} [tags=["blog", "post"]] post tags
 * @returns {Promise<Status>}
 */
export async function postRelatedToot(instance, userId, slug, tags = ["blog", "post"]) {
    let toots = await blogPostToots(instance, userId, tags);
    return toots?.find((it) => it["content"].includes(POST_URL + slug));
}
