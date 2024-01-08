/**
 * @typedef {Object} Post
 * @property {string} title
 * @property {Date | string} [update]
 * @property {Date | string} date
 * @property {boolean} [published=true]
 * @property {string} content html string
 * @property {string} [topic="development"]
 * @property {string} [summary]
 * @property {string[]} tags
 * @property {string} slug
 */

/**
 * Handles post data validation and processing
 * 
 * @param {Object} post
 * @returns {Post}
 */
export function normalizePostEntry(post) {
    return {
        title: post.title,
        update: post.update && new Date(post.update),
        create: post.create && new Date(post.create),
        publish: post.publish,
        content: post.html || post.content,
        topic: post.topic || "development",
        summary: post.summary,
        tags: post.tags && Array.isArray(post.tags) && post.tags || [],
        toot: post.toot,
        prev: post.prev || null,
        next: post.next || null,
        slug: post.slug
    };
}
/**
 * Sort posts by update or alternatively date property
 * @param {Post[]} posts
 * @returns {Post[]}
*/
export function orderPosts(posts) {
    posts.sort((a, b) => {
        let aDate = a.update || a.date;
        let bDate = b.update || b.date;

        return bDate - aDate;
    });
    return posts;
}

/**
 * Convert a date from post to ISO string.
 * 
 * This function handles normalization and conversion of dates.
 * 
 * @param {Date | string} date
 * @returns {string}
 */
export function postDateISO(date) {
    if (date == null) {
        return null;
    }
    if (typeof date === "string") {
        let d = null;
        try {
            d = new Date(date);
        } catch (e) {
            throw new Error(`Invalid date: '${date}'`);
        }
        return d.toISOString();
    }
    if (typeof date.toISOString === "function") {
        return date.toISOString();
    }
}

/**
 * Convert a date from post to Date object.
 * 
 * @param {Date | string} date
 * @returns {Date}
 */
export function parsePostDate(date) {
    if (date == null) {
        return null;
    }
    if (typeof date === "string") {
        let d = null;
        try {
            d = new Date(date);
        } catch (e) {
            throw new Error(`Invalid date: '${date}'`);
        }
        return d;
    }
    if (typeof date.toISOString === "function") {
        return date;
    }
}

/**
 * Convert a post map in any form to a list.
 * 
 * Handles the following edge cases:
 * - If the provided object is a promise, it will be mapped according to remaining rules.
 * - If the provided object is a response, it will be read as JSON object.
 * - If the provided object is an array, it will be returned back as is.
 * - If the provided object is null or undefined, an empty array will be returned.
 * 
 * @param {Promise<Reponse> | Response | Promise<Object.<string, any>>} posts
 */
export function postMapToList(posts) {
    function mapMaybeReponse(posts) {
        let p = posts;
        if (typeof p.json === "function") {
            p = p.json();
        }

        function mapPosts(posts) {
            if (typeof posts !== "object") {
                if (posts == null) {
                    return [];
                } else if (Array.isArray(posts)) {
                    return posts;
                }
            }
            return Object.entries(posts).map(([slug, post]) => ({
                ...post,
                slug
            }));
        }

        if (typeof p.then === "function") {
            return p.then(mapPosts);
        } else {
            return mapPosts(p);
        }
    }

    if (typeof posts.then === "function") {
        return posts.then(mapMaybeReponse);
    } else {
        return mapMaybeReponse(posts);
    }
}
