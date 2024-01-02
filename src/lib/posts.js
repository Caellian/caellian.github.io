/**
 * @typedef {Object} Post
 * @property {string} title
 * @property {Date} update
 * @property {Date} date
 * @property {string} content html string
 * @property {string} summary
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
        date: new Date(post.date),
        content: post.content && post.content.render().html,
        summary: post.summary,
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