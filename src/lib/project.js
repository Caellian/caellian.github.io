const GITHUB_TOKEN = "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";

/**
 * @typedef Project
 * @property {string} id
 * @property {string} name
 * 
 * @property {string[]} tags
 * @property {boolean} [active]
 * @property {boolean} [contribution]
 * @property {boolean} [fork]
 * @property {string} lang
 * @property {string} [url]
 * @property {string[]} description
 * 
*/

/**
 * @param {string} query
 */
export async function github_graphql(query) {
  const headers = {
    Authorization: `bearer ${GITHUB_TOKEN}`,
  };
  const body = {
    query,
  };
  const response = await fetch("https://api.github.com/graphql", {
    method: "POST",
    body: JSON.stringify(body),
    headers: headers,
  });
  return await response.json();
}

// Can be used to generate activity heatmap
export async function getContributions() {
  return github_graphql(
    'query{user(login:"Caellian"){contributionsCollection{contributionCalendar{colors totalContributions weeks{contributionDays{color contributionCount date weekday}firstDay}}}}}'
  );
}

export async function getRepoContributions() {
  const data =
    (
      await github_graphql(
        'query{user(login:"Caellian"){repositoriesContributedTo(last:20){edges{node{name url owner{login}}}}}}'
      )
    ).data || {};

  const edges = data?.user?.repositoriesContributedTo.edges || [];

  const result = [];
  for (const i of edges) {
    const node = i.node || {};
    node.owner = node.owner.login || "unknown";
    result.push(node);
  }

  return result;
}

/**
 * @typedef Repository
 * @property {string} name
 * @property {string} owner
 *
 * @typedef PullRequest
 * @property {Repository} repository
 * @property {string} title
 * @property {string} url
 * @property {boolean} merged
 * @property {boolean} closed
 *
 * @returns {Promise<PullRequest[]>} 
 */
export async function getPullRequests() {
  const data =
    (
      await github_graphql(
        'query{user(login:"Caellian"){pullRequests(last:25){edges{node{repository{name owner{login}}title url merged closed}}}}}'
      )
    )?.data || {};

  const edges = data?.user?.pullRequests?.edges || [];

  const result = [];
  for (const edge of edges) {
    const node = edge.node;
    node.repository = node.repository || {};
    node.repository.owner = node.repository?.owner?.login || "";
    if (node.merged || !node.closed) {
      result.push(node);
    }
  }
  return result.reverse();
}
