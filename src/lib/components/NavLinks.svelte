<script lang="ts">
	import { page } from '$app/stores';

	export var onClick = (_: MouseEvent) => {};

	interface NavLink {
		link: string;
		name: string;
	}

	const links = [
		{
			link: '/',
			name: 'About Me'
		},
		{
			link: '/projects',
			name: 'Projects'
		},
		// {
		//     link: "/blog",
		//     name: "Blog"
		// },
		{
			link: '/contact',
			name: 'Contact'
		}
	] as NavLink[];
</script>

{#each links as l}
	<li class:current={$page.path === l.link}>
		<a href={l.link} on:click={onClick}>{l.name}</a>
	</li>
{/each}
