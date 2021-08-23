<script lang="ts">
	import projectList from '$lib/projects.json';

	import type Project from '$lib/project';
	import ProjectCard from '$lib/components/Project.svelte';

	const activeProjects = projectList.active as Project[];
	const previousProjects = projectList.previous as Project[];
	const forks = projectList.forks as Project[];
</script>

<section class="pagewide">
	<h1 class="title">Current Projects</h1>

	<div class="project-list current">
		{#each activeProjects as p}
			<div class="card">
				<ProjectCard project={p} />
			</div>
		{/each}
	</div>
</section>

<section class="pagewide">
	<h1 class="title">Previous Projects</h1>

	<div class="project-list">
		{#each previousProjects as p}
			<div class="card">
				<ProjectCard project={p} />
			</div>
		{/each}
	</div>
</section>

<section class="pagewide">
	<h1 class="title">OSS Contributions and Forks</h1>

	<div class="project-list">
		{#each forks as p}
			<div class="card">
				<ProjectCard project={p} />
			</div>
		{/each}
	</div>
</section>

<style lang="less">
	@import '../../style/constants.less';

	section {
		padding: 2vh 0;

		margin: 0 auto;

		@media (min-width: @tablet-size) {
			> * {
				padding-left: 2rem;
				padding-right: 2rem;
			}

			.title {
				padding-left: 0;
				padding-right: 0;
			}
		}
	}

	.project-list {
		display: flex;
		flex-flow: column wrap;
		justify-content: space-around;
		align-items: stretch;
		align-content: stretch;

		width: 100%;
		height: max-content;

		.card {
			flex-grow: 1;
			flex-basis: 90%;

			margin: 0.1rem;

			@media (min-width: @mobile-size) {
				flex-basis: 45%;
			}

			@media (max-width: @mobile-size) {
				padding-bottom: 0.5rem;
			}
		}

		@media (min-width: @mobile-size) {
			flex-flow: row wrap;

			&.current {
				flex-flow: column wrap;
				.project {
					p {
						max-width: max-content;
					}
				}
			}
		}
	}
</style>
