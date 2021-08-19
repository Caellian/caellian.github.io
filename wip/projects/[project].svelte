<script lang="ts" context="module">
	import projects from '$lib/projects.json';
	import type Project from '$lib/project';

	/**
	 * @type {import('@sveltejs/kit').Load}
	 */
	export async function load({ page, fetch, session, context }) {
		const req_project = page.params.project;

		var found = null as Project | null;
		for (const p of [...projects.active, ...projects.previous, ...projects.forks] as Project[]) {
			if (p.id === req_project) {
				found = p;
				break;
			}
		}

		if (found !== null) {
			return {
				props: {
					project: found
				}
			};
		}

		return {
			status: 404,
			error: new Error(`Could not find project with ID: ${req_project}`)
		};
	}
</script>

<script lang="ts">
	export let project: Project;
</script>

<h1>{project.name}</h1>
