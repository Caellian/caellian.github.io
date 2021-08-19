<script lang="ts" context="module">
	// import * as md from 'markdown-wasm/dist/markdown';

	/**
	 * @type {import('@sveltejs/kit').Load}
	 */
	export async function load({ page, fetch, session, context }) {
		// await md.ready;
		// const post = await fetch(`./posts/${page.params.post}.md`).then((r: Response) => r.body);
		// console.log('derpere', post.toString());
		// const parsed = md.parse(post);
		// return {
		// 	props: { post: parsed }
		// };
	}
</script>

<script lang="ts">
	export var post = '';
</script>

{@html post}
