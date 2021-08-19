<script lang="ts">
	export var color = '#fff';
	export var spin: boolean = false;
</script>

<svg
	class="compass"
	class:spin={spin}
	style="--color: {color}"
	xmlns="http://www.w3.org/2000/svg"
	viewBox="0 0 512 512"
>
	<ellipse class="outer-rim" cx="256" cy="256" rx="234" ry="234" />
	<path
		class="needle"
		d="m375.1,136.8c-3.2,-3.2,-8.1,-4.1,-12.2,-2.3l-155.8,66.7c-2.6,1.1,-4.7,3.2,-5.8,5.8l-66.7,155.8c-1.8,4.1,-0.8,9.0,2.3,12.2c2.1,2.0,4.9,3.2,7.8,3.2c1.4,0,2.9,-0.3,4.3,-0.8l155.8,-66.7c2.6,-1.1,4.7,-3.2,5.8,-5.8l66.7,-155.8c1.7,-4.1,0.8,-9.0,-2.3,-12.2ZM256,278.2c-12.2,0,-22.2,-9.9,-22.2,-22.2c0,-12.2,9.9,-22.2,22.2,-22.2c12.2,0,22.2,9.9,22.2,22.2c0.0,12.2,-9.9,22.2,-22.2,22.2Z"
	/>
</svg>

<style lang="less">
	@import "../../style/func.less";

	.spin-loop (@n, @i: 0) when (@i <= @n) {
		@curr: (@i/@n * 100%);

		@{curr}{
			.random((120 * @i), 30);

			.if(`@{i} % 2 == 1`,
				transform,
				rotate((@random-result) * 1deg),
				rotate((@random-result) * -1deg)
				);
		}

		.spin-loop(@n, (@i + 1));
	}

	@keyframes spinning {
		.spin-loop(10);
	}

	.compass {
		.outer-rim {
			fill: none;
			stroke: var(--color);
			stroke-width: 44;
		}

		.needle {
			fill: var(--color);

			transform-origin: 50% 50%;
		}

		&.spin {
			.needle {
				animation: spinning 10s infinite alternate;
			}
		}
	}
</style>
