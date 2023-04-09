const GITHUB_TOKEN = "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";

export default interface Project {
  id: string;
  name: string;

  tags: string[];
  active: boolean | undefined;
  contribution: boolean | undefined;
  fork: boolean | undefined;
  lang: string;
  url: string;

  description: string[];
}

export async function github_graphql(query: string) {
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
    (await github_graphql(
      'query{user(login:"Caellian"){repositoriesContributedTo(last:20){edges{node{name url owner{login}}}}}}'
    ))?.data || {};
  /**
   * {"data":{"user":{"repositoriesContributedTo":{"edges":[{"node":{"name":"stylus","owner":{"login":"stylus"}}},{"node":{"name":"qBittorrent","owner":{"login":"qbittorrent"}}},{"node":{"name":"intellij-rust","owner":{"login":"intellij-rust"}}},{"node":{"name":"TheSims4ScriptModBuilder","owner":{"login":"LuquanLi"}}},{"node":{"name":"AndroidFaker","owner":{"login":"Android1500"}}}]}}}}
   */
  const edges = data?.user?.repositoriesContributedTo?.edges || [];

  let result = [];
  for (const i of edges) {
    let node = i?.node || {};
    node.owner = node.owner?.login || "unknown";
    result.push(node);
  }

  return result;
}
export interface Repository {
  name: string;
  owner: string;
}
export interface PullRequest {
  repository: Repository;
  title: string;
  url: string;
  merged: boolean;
  closed: boolean;
}

export async function getPullRequests(): Promise<PullRequest[]> {
  let data =
    (
      await github_graphql(
        'query{user(login:"Caellian"){pullRequests(last:25){edges{node{repository{name owner{login}}title url merged closed}}}}}'
      )
    )?.data || {};

  const edges = data?.user?.pullRequests?.edges || [];

  let result = [];
  for (const edge of edges) {
    let node = edge.node;
    node.repository = node.repository || {};
    node.repository.owner = node.repository?.owner?.login || "";
    if (node.merged || !node.closed) {
      result.push(node);
    }
  }
  return result.reverse();
}
