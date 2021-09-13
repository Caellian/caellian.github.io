<script lang="ts">
	import { page } from '$app/stores';

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

	export let on_click: (e: MouseEvent) => any = () => {};
</script>

{#each links as l}
	<li class:current={$page.path === l.link}>
		<a href={l.link} on:click={on_click}>{l.name}</a>
	</li>
{/each}
