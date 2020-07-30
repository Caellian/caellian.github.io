<template>
  <div class="project" :style="cssVars">
    <div class="header">
      <h1>{{ info.name }}</h1>
      <span class="lang">{{ info.lang }}</span>
    </div>
    <div class="description">
      <p v-for="d in info.description" :key="d">{{d}}</p>
    </div>
    <div v-if="info.tags" class="tags">
      <p v-for="t in info.tags" :key="t">{{t}}</p>
    </div>
    <a v-if="info.url" :href="info.url" class="repo">
      {{ repoLabel(info.url) }}
    </a>
    <p v-else class="norepo">
      Private project
    </p>
  </div>
</template>

<script lang="ts">
import { Component, Prop, Vue } from "vue-property-decorator";
import ProjectInfo from "@/lib/ProjectInfo";

@Component
export default class Project extends Vue {
  @Prop({ required: true, type: Object }) readonly info?: ProjectInfo;

  get cssVars() {
    const from = Math.floor(Math.random() * 360);
    const to = from + Math.floor(Math.random() * 30) + 30;
    
    const deg = Math.floor(Math.random() * 360);

    return {
      "--bg-deg": deg + "deg",
      "--bg-from": "hsl(" + from + ",80%,35%)",
      "--bg-to": "hsl(" + to + ",80%,35%)"
    };
  }

  repoLabel(repoUrl: string) {
    const url = repoUrl.toLowerCase();
    switch (true) {
      case /github/.test(url):
        return "Open on GitHub";
      case /bitbucket/.test(url):
        return "Open on BitBucket";
      case /gitlab/.test(url):
        return "Open on GitLab";
    }
  }
}
</script>

<style scoped lang="scss">
@import "./node_modules/include-media/dist/include-media";

$breakpoints: (
  phone: 320px,
  tablet: 720px,
  desktop: 910px
);

%repotext {
  width: 100%;
  padding: 0.25rem;
  margin: 0;
  border-radius: 0.2rem;
  
  color: #fff;
  font-size: 1rem;
  font-weight: bold;
  text-decoration: none;
}

.project {
  display: flex;
  flex-direction: column;

  min-height: 15rem;
  flex-basis: 90%;
  flex-grow: 1;
  margin: 1vh 2vh;

  background: linear-gradient(
    var(--bg-deg, 90deg),
    var(--bg-from, #000),
    var(--bg-to, #fff)
  );
  border-radius: 0.2rem;
  color: #fff;

  @include media(">=tablet", "<desktop") {
    flex-basis: 45%;
  }

  @include media(">=desktop") {
    flex-basis: 30%;
  }

  .header {
    display: flex;
    flex-wrap: nowrap;
    justify-content: space-between;
    align-items: center;
    align-content: space-between;

    border-bottom: solid #fff 0.15rem;

    h1 {
      flex-grow: 1;

      color: #fff;
      font-size: 1.5rem;
      font-weight: bold;
      border: none;
      padding-top: 0.5rem;
      padding-left: 0.7rem;
    }

    .lang {
      display: inline;
      position: relative;
      top: 0;
      right: 0;

      padding: 0.1rem 1rem;
      margin: 0 0.5rem;

      background: #fff3;

      border: solid #fff 2px;
      border-radius: 1rem;
      
      &:hover {
        background: #0002;
      }
    }
  }

  .description {
    flex-grow: 1;
    width: 100;
    padding: 1vh 0.5rem;
  }

  .tags {
    display: flex;
    flex-wrap: wrap;
    padding: 0.1rem;

    border-top: dashed #fff5 1px;

    * {
      padding: 0.25rem;
      margin: 0.1rem;
      border-radius: 0.2rem;
      
      color: #fff;
      background: #0002;
      font-size: 0.65rem;
      text-decoration: none;
    }
  }
  
  .repo {
    @extend %repotext;

    background: linear-gradient(45deg, #fff4, #0000);

    &:hover {
      background: linear-gradient(45deg, #fff2, #0000);
    }

    &:active {
      background: #0004;
    }
  }

  .norepo {
    @extend %repotext;

    background: linear-gradient(45deg, #0004, #0000);
  }
}
</style>
