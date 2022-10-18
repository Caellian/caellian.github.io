<script lang="ts">
  export let value: boolean;
  export let style: string;

  $: content = `<style>${style}</style>`;
</script>

{#if value}
  {@html content}
{/if}
