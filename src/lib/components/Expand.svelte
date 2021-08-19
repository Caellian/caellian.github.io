<script lang="ts">
	var expanded = false;

	function expand() {
		expanded = true;
	}
</script>

<div class="expand" class:expanded>
	<div class="fade" />
	<div class="content">
		<slot />
	</div>

	<div class="button-container center">
		<button class="button" type="button" on:click|once={expand}>
			<slot name="button">Expand content</slot>
		</button>
	</div>
</div>

<style lang="less">
	@import '../../style/constants.less';

	.expand {
		display: grid;
		grid-template-columns: 1fr;
		grid-template-rows: 1fr auto;
		grid-row-gap: 2vh;

		width: 100%;
		height: max-content;

		.fade {
			grid-area: 1 / 1 / 2 / 2;

			display: block;

			width: 100%;
			height: 50vh;

			background: linear-gradient(to bottom, #0000 0%, #0000 50%, var(--bg-color) 100%);

			z-index: 50;
		}
		.content {
			grid-area: 1 / 1 / 2 / 2;

			height: 50vh;
			overflow-y: hidden;

			transition: height ease-in @transition-long;
		}
		.button-container {
			grid-area: 2 / 1 / 3 / 2;

			margin-top: 1vh;
		}

		&.expanded {
			.fade {
				display: none;
			}
			.content {
				height: 100%;
				overflow-y: hidden;
			}
			.button-container {
				display: none;
			}
		}
	}
</style>
