<script lang="ts" context="module">
  export interface ChartEntry {
    name?: string;
    color?: string;
    weight: number;
  }

  export interface Entry {
    id: number;
    name: string;
    color: string;
    weight: number;
    length: number;
    borderLength: number;
    rotation: number;
  }

  export interface EntrySelection {
    id: number;
    name: string;
    color: string;
  }
</script>

<script lang="ts">
  export var entries: ChartEntry[];
  export var sort = true;

  if (sort) {
    entries.sort((a, b) => b.weight - a.weight);
  }

  export var background = "#fff";
  export var round = true;
  export var width = 12;
  export var entryWidth: number | null = null;
  export var spacing = 4;
  export var startAngle = 0;
  export var borderWidth = 1;
  export var borderColor: string | null = null;
  export var shadowColor: string | null = "rgba(0, 0, 0, 0.2)";
  export var onSelect: (selection: EntrySelection) => void = () => {
    return;
  };

  const radius = 50 - width / 2;

  const circumference = radius * 2 * Math.PI;

  const segWidth = entryWidth === null ? width / 3 : entryWidth;

  const weightTotal = entries.map((s) => s.weight).reduce((a, b) => a + b, 0);

  // Circumference units used by spacing, border and line caps
  const circumferenceWaste =
    entries.length * (spacing + borderWidth * 2 + (round ? segWidth : 0));

  function weightedLength(weight: number) {
    return (circumference - circumferenceWaste) * (weight / weightTotal);
  }

  function weightedBorder(weight: number) {
    return weightedLength(weight) + (round ? 0 : borderWidth * 2);
  }

  var selected = -1;

  var segments: Entry[] = [];

  let currRot = -90 + startAngle;

  currRot +=
    ((spacing + (round ? borderWidth * 2 : 0) + (round ? segWidth : 0)) /
      circumference) *
    180;

  let active = null as Entry | null;
  for (let i = 0; i < entries.length; i++) {
    const e = entries[i];
    const seg = {
      id: i,
      name: e.name ?? "",
      color: e.color ?? "#000",
      weight: e.weight,

      length: weightedLength(e.weight),
      borderLength: weightedBorder(e.weight),
      rotation: currRot,
    } as Entry;

    if (selected != i) {
      segments.push(seg);
    } else {
      active = seg;
    }

    const lengthPerc =
      (weightedLength(e.weight) + circumferenceWaste / entries.length) /
      circumference;
    currRot += lengthPerc * 360;
  }

  if (active != null) {
    segments.push(active);
  }

  function leave() {
    selected = -1;
  }

  function enter(entry: Entry) {
    return () => {
      selected = entry.id;
      onSelect(entry);
    };
  }
</script>

<svg
  xmlns="http://www.w3.org/2000/svg"
  class="donut-chart"
  width="100%"
  height="100%"
  viewBox="0 0 100 100"
  style="stroke-linecap:{round ? 'round' : 'butt'}"
  on:mouseleave={leave}
>
  <circle
    class="donut-background"
    r={radius}
    cx="50"
    cy="50"
    style="stroke:{background};stroke-width:{width}"
  />
  {#each segments as entry}
    <g
      class="entry"
      class:selected={selected === entry.id}
      transform="rotate({entry.rotation} 50 50)"
    >
      {#if shadowColor}
        <circle
          class="entry-shadow"
          r={radius}
          cx="50"
          cy="50"
          stroke-dasharray="{entry.borderLength},{circumference -
            entry.borderLength}"
          stroke-dashoffset={round ? 0 : borderWidth}
          style="stroke:{shadowColor};stroke-width:{segWidth +
            borderWidth * 2};"
        />
      {/if}
      <g class="entry-animator">
        {#if borderWidth > 0}
          <circle
            class="entry-border"
            r={radius}
            cx="50"
            cy="50"
            stroke-dasharray="{entry.borderLength},{circumference -
              entry.borderLength}"
            stroke-dashoffset={round ? 0 : borderWidth}
            style="stroke:{borderColor
              ? borderColor
              : entry.color};stroke-width: {segWidth +
              borderWidth * 2};filter:{borderColor
              ? 'none'
              : 'brightness(150%)'};"
            on:focus
            on:mouseover={enter(entry)}
          />
        {/if}
        <circle
          class="entry-fill"
          r={radius}
          cx="50"
          cy="50"
          stroke-dasharray="{entry.length},{circumference - entry.length}"
          style="stroke:{entry.color};stroke-width:{segWidth};"
          on:focus
          on:mouseover={enter(entry)}
        />
      </g>
    </g>
  {/each}
</svg>

<style lang="stylus">
	*
		fill none

	.donut-chart
		overflow visible

		.entry
			.entry-border
				opacity 0
				transition opacity transition-short linear

			&:hover
				.entry-border
					opacity 1

</style>
