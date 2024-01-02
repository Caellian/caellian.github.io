export const prerender = true;

export async function load({ fetch }) {
    const projects = await fetch("/projects.json");
    return {
        projects: await projects.json()
    };
}
