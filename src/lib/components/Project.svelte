<script lang="ts">
	import type Project from '$lib/project';

	const from = Math.floor(Math.random() * 360);
	const to = from + Math.floor(Math.random() * 30) + 30;
	const deg = Math.floor(Math.random() * 150) + 30;

	const cssVars = `--bg-deg:${deg}deg;--bg-from:hsl(${from},80%,35%);--bg-to:hsl(${to},80%,35%);`;

	export var project: Project = {
		id: 'none',
		name: 'None',
		tags: [],
		lang: 'No lang',
		url: '.',
		description: []
	};
</script>

<div class="project" style={cssVars}>
	<a href={project.url || '.'} class="project-inner">
		<span class="lang">{project.lang}</span>
		<h1>{project.name}</h1>
		<div class="desc">
			{#each project.description as d}
				<p>{d}</p>
			{/each}
		</div>
		<ul class="tags">
			{#each project.tags as t}
				<li>{t}</li>
			{/each}
		</ul>
	</a>
</div>

<style lang="less">
	@color-gradient: linear-gradient(var(--bg-deg), var(--bg-from), var(--bg-to));

	.project {
		padding: 0.1rem;

		background: var(--bg-from);
		background: @color-gradient;

		margin: 0.1rem;
	}

	.project-inner {
		display: grid;
		grid-template-columns: 1fr;
		grid-template-rows: repeat(2, auto) 1fr auto;

		width: 100%;
		height: 100%;

		background: transparent;
		color: var(--text);

		transition: background ease-in 200ms;

		.lang {
			grid-area: 1 / 1 / 2 / 2;

			background: #0003;

			font-size: 0.8rem;
			text-align: right;

			padding-right: 0.2rem;
			padding-bottom: 0.2rem;
		}

		h1 {
			grid-area: 2 / 1 / 3 / 2;

			width: 100%;
			color: var(--text);

			border-top: 1px dashed var(--text);
			border-bottom: 1px dashed var(--text);

			padding: 0;

			text-align: center;
			font-size: 1.4rem;

			transition: color ease-in 200ms;
		}

		.desc {
			grid-area: 3 / 1 / 4 / 2;

			list-style: none;
			padding: 0.2rem 0.5rem;

			background: #0003;

			p {
				margin: 0;
				text-align: justify;
			}
		}

		.tags {
			grid-area: 4 / 1 / 5 / 2;

			list-style: none;
			padding: 0.2rem;

			border-top: 1px dashed var(--text);

			&::before {
				content: 'tags:';
				margin-right: 0.2rem;
			}

			li {
				display: inline-block;

				padding: 0 0.1rem;
				margin-right: 0.2rem;

				border: 1px solid var(--bg-from);
				border-radius: 0.25rem;

				background: #0003;

				&:nth-child(n) {
					&::after {
						content: ',';
					}
				}

				&:nth-last-child(1) {
					&::after {
						content: '';
					}
				}
			}
		}

		&:hover {
			background: var(--bg-color);

			h1 {
				color: var(--accent);
			}

			tags {
			}
		}
	}
</style>
