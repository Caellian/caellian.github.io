<script lang="ts" context="module">
	export interface TimelineItem {
		title: string;
		time: string | undefined;
		description: string | undefined;
	}
</script>

<script lang="ts">
	export var items: TimelineItem[] = [];
	export var lineWidth: string = '0.125rem';
</script>

<article class="timeline" style="grid-template-rows:{items.length},1fr);">
	<div class="line" style="grid-area:1/2/{items.length + 1}/3;width:{lineWidth};" />
	{#each items as item, i}
		<div
			class="pointed"
			class:left={i % 2 == 1}
			class:right={i % 2 == 0}
			style="grid-row-start:{i + 1};grid-row-end:{i + 2};"
		>
			<span class="arrow" />
			<section>
				{#if item.description != null}
					<h1 style="padding-bottom:0.5rem;">{item.title}</h1>
					{@html item.description}
				{:else}
					<h1>{item.title}</h1>
				{/if}
			</section>
		</div>
		<div class="point" style="grid-area:{i + 1}/2/{i + 2}/3;" />
		<span
			style="grid-row-start:{i + 1};grid-row-end:{i + 2};"
			class="time"
			class:right={i % 2 == 1}
			class:left={i % 2 == 0}>{item.time}</span
		>
	{/each}
</article>

<style lang="less">
	@import '../../style/constants.less';

	@arrow-size: 0.7rem;
	@section-padding: 1rem;

	.timeline {
		display: grid;
		grid-template-columns: auto 1fr;
		align-items: center;
		grid-column-gap: 1rem;
		grid-row-gap: 2vh;

		.point {
			background: var(--accent);

			width: 0.6rem;
			height: 0.6rem;
			border-radius: 100vh;
		}

		.time {
			margin-left: auto;
			margin-right: auto;

			font-size: 0.8rem;

			grid-column-start: 1;
			grid-column-end: 2;
			margin-right: 0;

			@media (min-width: @mobile-size) {
				&.right {
					margin-left: 0;
					grid-column-start: 3;
					grid-column-end: 4;
				}
			}
		}

		.pointed {
			display: flex;
			align-items: center;

			grid-column-start: 3;
			grid-column-end: 4;

			margin-left: -@arrow-size / 2;

			section {
				flex-grow: 1;
				background-color: var(--bg-accent);
				padding: 1rem;

				border-radius: 0.5rem;

				h1 {
					padding-bottom: 0;

					font-size: 1.5rem;
					text-align: center;
				}
			}

			&.right,
			&.left {
				span {
					content: ' ';
					float: left;

					width: 1px;
					height: 1px;

					border-top: @arrow-size solid transparent;
					border-bottom: @arrow-size solid transparent;
					border-right: @arrow-size solid var(--bg-accent);

					z-index: -1;
				}
			}

			@media (min-width: @mobile-size) {
				&.left {
					flex-direction: row-reverse;
					margin-left: 0;
					margin-right: -@arrow-size / 2;

					span {
						float: right;

						left: (@section-padding + @arrow-size);

						border-right: none;
						border-left: @arrow-size solid var(--bg-accent);
					}

					grid-column-start: 1;
					grid-column-end: 2;
				}
			}
		}

		.line {
			display: block;

			background: var(--bg-light);
			background: linear-gradient(
				to bottom,
				var(--bg-color) 0%,
				var(--bg-light) 5%,
				var(--bg-light) 95%,
				var(--bg-color) 100%
			);

			height: 100%;

			margin-left: auto;
			margin-right: auto;
		}
	}
</style>
