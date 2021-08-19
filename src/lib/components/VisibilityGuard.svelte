<script>
	import { onMount } from 'svelte';

	let el = null;
	let visible = false;

	onMount(() => {
		const observer = new IntersectionObserver((entries) => {
			visible = visible || entries[0].isIntersecting;
		});
		observer.observe(el);

		return () => observer.unobserve(el);
	});
</script>

<div bind:this={el}>
	<slot {visible} />
</div>
