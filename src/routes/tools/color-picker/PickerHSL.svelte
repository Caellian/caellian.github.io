<script>
  import { rainbow } from "./colors";

  /**
   * @type {import("./colors").Color}
   */
  export let color;

  export let setColor = (value) => {
    color = value;
  };

  $: angle = (((color && color.h) || 0) / 360) * (2 * Math.PI);

  function vec_sum(vec) {
    return vec.reduce((a, b) => a + b);
  }
  function vec_len(vec) {
    return Math.sqrt(vec_sum(vec.map((it) => it * it)));
  }
  function vec_normalize(vec) {
    let len = vec_len(vec);
    return vec.map((it) => it / len);
  }

  $: pos = vec_normalize([
    Math.cos(angle - Math.PI / 2),
    Math.sin(angle - Math.PI / 2),
  ]);
  $: x = pos[0] * 50 * (1 - ((color && color.l / 100) || 1));
  $: y = pos[1] * 50 * (1 - ((color && color.l / 100) || 1));

  $: pickerStyle = `--left:${x}%;--top:${y}%`;

  let area;

  /**
   *
   * @param {MouseEvent} e
   */
  function onSelect(e) {
    let bounds = area.getBoundingClientRect();
    let x = bounds.width / (e.pageX - bounds.x);
    let y = bounds.height / (e.pageY - bounds.y);
    let r = Math.sqrt(x * x + y * y);
    if (r > 100.0) {
      return;
    }
    let phi = Math.atan2(e.x, e.y);
    setColor({
      ...color,
      h: Math.round((phi / (2 * Math.PI)) * 360),
    });
  }

  $: BG = rainbow(
    `${Math.round(((color && color.s) || 1) * 100)}%`,
    "50%",
    "conic"
  );
</script>

<div class="palette">
  <div
    bind:this={area}
    class="wheel"
    style="background: radial-gradient(closest-side, #fff, #8880, #000), {BG}"
    on:click={onSelect}
    on:drag={onSelect}
  ></div>
  <div class="picker" style={pickerStyle}></div>
</div>

<style lang="stylus">
.palette
    min-width: 20rem;
    min-height: 20rem;
    margin: 1rem;

    position: relative;
    
    .wheel
        width: 20rem;
        height: 20rem;
        border-radius: 100vw;
        background-color: white;
        border: solid 0.25rem black;
        outline: solid 0.2rem white;

    .picker
        position: absolute
        top: calc(var(--top, 50%) + 11rem)
        left: calc(var(--left, 50%) + 9rem)

        width: 1rem
        height: 1rem
        margin: -0.5rem
        border-radius: 100vw;
        border: solid 0.1rem black
        outline: solid 0.2rem white
        transform: rotate(-90deg) translate(100%, 100%)
</style>
