import { PROJECTS_REMOTE } from "$lib/project";

export const prerender = true;

export async function GET() {
    // Prebake GitHub Gist to reduce external API calls
    const projects = await fetch(PROJECTS_REMOTE);
    return projects;
}
