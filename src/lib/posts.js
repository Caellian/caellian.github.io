/**
 * @typedef {Object} Post
 * @property {string} title
 * @property {Date} [update]
 * @property {Date} date
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
export function processPostData(post) {
    return {
        title: post.title,
        update: post.update && new Date(post.update),
        date: post.date && new Date(post.date),
        published: post.date != null,
        content: post.content,
        topic: post.topic || "development",
        summary: post.summary,
        tags: post.tags && Array.isArray(post.tags) && post.tags || [],
        root: post.toot,
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
