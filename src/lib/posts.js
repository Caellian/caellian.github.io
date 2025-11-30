/**
 * @typedef {import("types/post").Post} Post
 */
/**
 * @typedef {Omit<
 *   Post,
 *   | 'datePublished'
 *   | 'dateModified'
 * > & {
 *   slug: string,
 *   datePublished: Date,
 *   dateModified?: Date,
 *   toot?: string
 * }} PostData
 */

/**
 * Handles post data validation and processing
 *
 * @param {string} slug
 * @param {Post} post
 * @returns {PostData}
 */
export function parsePostEntry(slug, post) {
  return {
    slug,
    ...post,
    datePublished: new Date(post.datePublished),
    dateModified:
      (post.dateModified && new Date(post.dateModified)) || undefined,
    articleSection: post.articleSection,
    inLanguage: post.inLanguage,
  };
}

/**
 * @param {Post | PostData} a
 * @param {Post | PostData} b
 * @returns {number}
 */
function postCmp(a, b) {
  let aDate, bDate;
  if (
    typeof a.datePublished === "string" &&
    typeof b.datePublished === "string"
  ) {
    aDate = new Date(a.dateModified || a.datePublished);
    bDate = new Date(b.dateModified || b.datePublished);
  } else {
    aDate = /** @type {Date} */ (a.dateModified || a.datePublished);
    bDate = /** @type {Date} */ (b.dateModified || b.datePublished);
  }
  return bDate.getTime() - aDate.getTime();
}

/**
 * Sort posts by update or alternatively date property
 * @param {PostData[]} posts
 * @returns {PostData[]}
 */
export function orderPosts(posts) {
  return posts.sort(postCmp);
}

/**
 * Convert a date from post to Date object.
 *
 * @param {Date | string} date
 * @returns {Date | null}
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
  return null;
}

/**
 * @callback MapPostResponsePromise
 * @param {Promise<Response>} posts
 * @returns {Promise<PostData[]>}
 * @private
 */
/**
 * @callback MapPostResponse
 * @param {Response} posts
 * @returns {PostData[]}
 * @private
 */
/**
 * @callback MapPostRecordPromise
 * @param {Promise<Record<string, any>>} posts
 * @returns {Promise<PostData[]>}
 * @private
 */
/**
 * @callback MapPostRecord
 * @param {Record<string, any>} posts
 * @returns {PostData[]}
 * @private
 */
/**
 * Convert a post map to a list.
 *
 * It works for both promises and discrete values. If given a promise, a promise
 * will be returned.
 *
 * If given a {@link Response}, a promise will be returned.
 *
 * @type {MapPostResponsePromise | MapPostResponse | MapPostRecordPromise |
 * MapPostRecord}
 * @param {Promise<Response> | Response | Promise<Record<string, Post>> |
 * Record<string, Post>} posts
 * @returns {Promise<PostData[]> | PostData[]}
 */
export function toPostList(posts) {
  /**
   * @type {MapPostRecord}
   */
  const mapPosts = (posts) =>
    Object.entries(posts)
      .map(([slug, post]) => parsePostEntry(slug, post))
      .sort(postCmp);

  /**
   * @type {MapPostResponse | MapPostRecord}
   * @param {Response | Record<string, any>} posts
   * @returns {Promise<PostData[]> | PostData[]}
   */
  function unwrapResponse(posts) {
    if (typeof posts.json === "function") {
      return posts.json().then(mapPosts);
    } else {
      return mapPosts(posts);
    }
  }

  if ("then" in posts && typeof posts.then === "function") {
    return posts.then(unwrapResponse);
  } else {
    return unwrapResponse(posts);
  }
}
