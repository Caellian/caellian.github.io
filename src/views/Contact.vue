<template>
  <div id="contact">
    <article>
      <h1>Contact</h1>

      <p>
        You can contact me via either email or social media. I sheldom use most
        of social media, but I respond to email and telegram messages the
        quickest.
      </p>

      <div class="icon-collection">
        <a href="#" v-on:click="emailLink"
          ><font-awesome-icon :icon="['fas', 'envelope']"
        /></a>
        <a href="https://telegram.me/caellian"
          ><font-awesome-icon :icon="['fab', 'telegram-plane']"
        /></a>
        <a href="https://www.facebook.com/tin.svagelj.email/"
          ><font-awesome-icon :icon="['fab', 'facebook-messenger']"
        /></a>
        <a href="https://www.reddit.com/user/Caellyan"
          ><font-awesome-icon :icon="['fab', 'reddit']"
        /></a>
        <a href="https://twitter.com/tinsvagelj/"
          ><font-awesome-icon :icon="['fab', 'twitter']"
        /></a>
        <a href="https://www.instagram.com/tinsvagelj/"
          ><font-awesome-icon :icon="['fab', 'instagram-square']"
        /></a>
        <a href="https://www.linkedin.com/in/tinsvagelj/"
          ><font-awesome-icon :icon="['fab', 'linkedin']"
        /></a>
      </div>
    </article>
  </div>
</template>

<script lang="ts">
export default {
  name: "contact",
  methods: {
    emailLink: function(event: Event) {
      let mailParts = [
        "mail",
        [""][0],
        "to:",
        [],
        "tin",
        ["svagelj", ""][1],
        ".",
        ["svagelj", ""][0],
        "@",
        ["\u1f4a9", "live.com"][
          ((): number => {
            if (
              window.location.toString().endsWith("contact") ||
              window.location.toString().endsWith("contact/")
            ) {
              return 7;
            } else {
              return 8;
            }
          })() % 2
        ],
      ];
      window.location.href = mailParts.join("");
    },
  },
};
</script>

<style scoped lang="scss">
.icon-collection {
  display: flex;
  flex-wrap: wrap;
  justify-content: space-around;
  align-items: center;
  align-content: space-around;

  padding: 1vh 5vh;

  a {
    padding: 0.2rem;

    * {
      font-size: 3rem;
    }
  }
}

.tox-id {
  background: rgb(200, 200, 200);

  padding: 0.2rem;
  border-radius: 0.2rem;

  font: "Courier New", Courier, monospace;
  overflow-wrap: break-word;
}
</style>
