<template>
  <div>
    <article>
      <h1>Actively developed projects</h1>

      <p>I'm actively working on these projects in my free time.</p>
      <p>They're ordered by priority of development I give them.</p>

      <div class="project-list">
        <Project v-for="a in active" :key="a.name" :info="a"></Project>
      </div>
    </article>

    <article>
      <h1>Previous projects</h1>

      <p>Some of these receive fixes from time to time but they are generally no longer being developed because I don't have a need for them anymore, they don't interest me anymore or they don't require further work.</p>

      <div class="project-list">
        <Project v-for="p in previous" :key="p.name" :info="p"></Project>
      </div>
    </article>

    <article>
      <h1>Custom forks</h1>

      <p>These are modified versions of other people's code.</p>

      <div class="project-list">
        <Project v-for="f in forks" :key="f.name" :info="f"></Project>
      </div>
    </article>
  </div>
</template>

<script lang="ts">
import Project from "@/components/Project.vue";
import plist from "@/assets/projects.json";

export default {
  name: "contact",
  components: {
    Project
  },
  data() {
    return {
      active: plist.active,
      previous: plist.previous,
      forks: plist.forks
    };
  }
};
</script>

<style scoped lang="scss">
@import "./node_modules/include-media/dist/include-media";

$breakpoints: (
  phone: 320px,
  tablet: 720px,
  desktop: 910px
);

.project-list {
  display: flex;
  flex-direction: row;
  flex-wrap: wrap;
  justify-content: space-evenly;
  align-items: stretch;

  @include media("<tablet") {
    flex-direction: column;
  }
}
</style>
