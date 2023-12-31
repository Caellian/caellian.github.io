<script>
  var shine_on = false;
  var pos = [0, 0];

  function on_mousemove(ev) {
    pos = [ev.offsetX, ev.offsetY];
    shine_on = true;
  }

  function on_leave() {
    shine_on = false;
  }

  function on_enter() {
    shine_on = true;
  }
</script>

<div
  on:mousemove|stopPropagation={on_mousemove}
  on:mouseleave|stopPropagation={on_leave}
  on:mouseenter|stopPropagation={on_enter}
  class:visible={shine_on}
  style="--pos-x:{pos[0]}px;--pos-y:{pos[1]}px;"
>
  <slot />
</div>

<style lang="stylus">
div
  display grid
  align-content center

  width 100%
  height 100%

 &.visible
  background radial-gradient(circle at var(--pos-x) var(--pos-y), var(--bg-accent) 0%, transparent 50%)
</style>
