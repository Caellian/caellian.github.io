<script>
  import toPX from "to-px";

  export var color = "#fff";
  export var spin = false;
  export var size = "2rem";
  export var width = toPX(size);
  export var height = toPX(size);
</script>

<svg
  class="compass"
  style="--color: {color}"
  xmlns="http://www.w3.org/2000/svg"
  viewBox="0 0 510 513"
  {width}
  {height}
  on:mouseup
>
  <ellipse class="outer-rim" cx="256" cy="256" rx="234" ry="234" />
  {#if spin}
    <path
      class="needle spin"
      d="m 255.9,87.4 c -4.5,0 -8.6,2.8 -10.2,7.0 L 182.7,251.7 c -1.0,2.6 -1.0,5.5 0,8.2 l 63.0,157.3 c 1.6,4.1 5.8,6.9 10.2,7.0 2.9,-0.0 5.7,-1.2 7.7,-3.2 0.9,-0.9 1.8,-2.2 2.4,-3.6 L 329.2,260.0 c 1.0,-2.6 1.0,-5.5 0,-8.2 L 266.2,94.5 c -1.7,-4.1 -5.8,-6.9 -10.2,-7.0 z m 15.7,184.2 c -8.6,8.6 -22.7,8.7 -31.4,0 -8.6,-8.6 -8.7,-22.7 0,-31.4 8.6,-8.6 22.7,-8.7 31.4,0 8.6,8.6 8.7,22.7 0,31.4 z"
    />
  {:else}
    <path
      class="needle"
      d="m375.1,136.8c-3.2,-3.2,-8.1,-4.1,-12.2,-2.3l-155.8,66.7c-2.6,1.1,-4.7,3.2,-5.8,5.8l-66.7,155.8c-1.8,4.1,-0.8,9.0,2.3,12.2c2.1,2.0,4.9,3.2,7.8,3.2c1.4,0,2.9,-0.3,4.3,-0.8l155.8,-66.7c2.6,-1.1,4.7,-3.2,5.8,-5.8l66.7,-155.8c1.7,-4.1,0.8,-9.0,-2.3,-12.2ZM256,278.2c-12.2,0,-22.2,-9.9,-22.2,-22.2c0,-12.2,9.9,-22.2,22.2,-22.2c12.2,0,22.2,9.9,22.2,22.2c0.0,12.2,-9.9,22.2,-22.2,22.2Z"
    />
  {/if}
</svg>

<style lang="stylus">
	positions = 30 60 90 120 10 280 130 20 160 30 180 320

	@keyframes spinning
		for pos, i in positions
			{100% * (i / (length(positions) - 1))}
				if i % 2 == 0
					transform rotate(pos * 1deg)
				else
					transform rotate(pos * -1deg)

	.compass
		.outer-rim
			fill none
			stroke var(--color)
			stroke-width 44

		.needle
			fill var(--color)

		.spin
			transform-origin 50% 50%
			animation spinning 10s infinite alternate

</style>
