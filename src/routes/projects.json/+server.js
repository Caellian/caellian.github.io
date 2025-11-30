import { PROJECTS_REMOTE } from "$lib/project";

export const prerender = true;

export async function GET({ fetch }) {
  // Prebaked GitHub Gist to reduce external requests
  const projects = await fetch(PROJECTS_REMOTE);
  return projects;
}
