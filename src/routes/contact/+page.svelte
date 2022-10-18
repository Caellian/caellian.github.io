<script lang="ts">
  import { prerendering } from "$app/environment";
  import Icon from "$lib/components/Icon.svelte";
  import emailjs from "@emailjs/browser";

  var name = "";
  var email = "";
  var message = "";

  var emailStatus = null;

  function valid() {
    return (
      name.length > 0 &&
      email.length > 0 &&
      message != null &&
      message.length > 0
    );
  }

  function sendEmail(_: Event) {
    if (!valid()) {
      return;
    }

    try {
      emailjs.send(
        "caellian-com",
        "job-contact-email",
        {
          name,
          email,
          message,
        },
        "user_TD8lB5tDhA6fPs2uQHWqn"
      );
      emailStatus = "ok";
    } catch (error) {
      emailStatus = "error";
      console.log({ error });
    }
  }
</script>

<div class="v-fit">
  <section class="center">
    {#if !prerendering && emailStatus == null}
      <h2>Contact Me via E-mail</h2>
      <div>
        <form on:submit|preventDefault={sendEmail} class="pagewide">
          <label for="name">Name</label>
          <input
            type="text"
            name="name"
            id="name"
            bind:value={name}
            placeholder="Your Name"
            required
          />
          <label for="email">E-mail Address</label>
          <input
            type="email"
            name="email"
            id="email"
            bind:value={email}
            placeholder="Your Email"
            required
          />
          <label for="message">Message</label>
          <textarea
            name="message"
            id="message"
            bind:value={message}
            cols="30"
            rows="6"
            placeholder="Message content"
            required
          />
          <input type="submit" value="Send" />
        </form>
      </div>
    {:else if !prerendering}
      {#if emailStatus == "error"}
        <div class="status error">
          <svg viewBox="0 0 24 24">
            <path d="M 2,2 22,22" />
            <path d="M 22,2 2,22" />
          </svg>
          <p>Error sending email!</p>
        </div>
      {:else if emailStatus == "ok"}
        <div class="status ok">
          <svg viewBox="0 0 24 24">
            <path d="m 2,11.3 7.01,7 L 22,5.33" />
          </svg>
          <p>Email sent.</p>
        </div>
      {/if}
    {:else}
      <div>
        <p>
          You can contact me by sending an email to: <a
            href="mailto:tin.svagelj@gmail.com">tin.svagelj@live.com</a
          >
        </p>
      </div>
    {/if}
  </section>

  {#if !prerendering}
    <p class="mail-desc">
      (the form will send an e-mail to: <a href="mailto:tin.svagelj@gmail.com"
        >tin.svagelj@live.com</a
      >)
    </p>
  {/if}

  <section id="contact-links" class="center">
    <h3>Find Me Elsewhere</h3>
    <div class="links">
      <div class="bracket left">
        <p>Social</p>
        <ul class="icons left">
          <li>
            <a href="tg://resolve?domain=caellian" target="_blank">
              {#if prerendering}
                Telegram
              {:else}
                <Icon size="2rem" name="telegram" />
              {/if}
            </a>
          </li>
          <li>
            <a href="https://mastodon.social/@caellian" target="_blank">
              {#if prerendering}
                Mastodon
              {:else}
                <Icon size="2rem" name="mastodon" />
              {/if}
            </a>
          </li>
          <li>
            <a href="https://matrix.to/#/@caellian:matrix.org" target="_blank">
              {#if prerendering}
                matrix.org
              {:else}
                <Icon size="2rem" name="matrix" />
              {/if}
            </a>
          </li>
          <li>
            <a href="https://www.linkedin.com/in/tinsvagelj/" target="_blank">
              {#if prerendering}
                LinkedIn
              {:else}
                <Icon size="2rem" name="linkedin" />
              {/if}
            </a>
          </li>
        </ul>
      </div>
      <div class="bracket right">
        <p>Code</p>
        <ul class="icons right">
          <li>
            <a href="https://github.com/Caellian" target="_blank">
              {#if prerendering}
                GitHub
              {:else}
                <Icon size="2rem" name="github" />
              {/if}
            </a>
          </li>
          <li>
            <a href="https://bitbucket.org/Caellian" target="_blank">
              {#if prerendering}
                BitBucket
              {:else}
                <Icon size="2rem" name="bitbucket" />
              {/if}
            </a>
          </li>
          <li>
            <a href="https://gitlab.com/Caellian" target="_blank">
              {#if prerendering}
                GitLab
              {:else}
                <Icon size="2rem" name="gitlab" />
              {/if}
            </a>
          </li>
        </ul>
      </div>
    </div>
  </section>
</div>

<style lang="stylus">
@import "../../style/constants";

.v-fit
  display flex
  flex-direction column
  min-height calc(100vh - var(--nav-height))

  section
    display flex
    flex-direction column
    padding 2rem 0

.center
  width clamp(1ch, 100%, 75ch)
  margin 0 auto

  h2
    text-align center

.status
  display flex
  justify-content space-between
  align-items center

  border solid 0.2rem var(--bg-light)
  padding 2rem

  border-radius 0.4rem

  transition border-color ease-in-out transition-long

  svg
    stroke-width 0.2rem
    width 3rem
  &.ok>svg
    stroke lime
  &.error>svg
    stroke var(--red)

  p
    padding 0

    font-size 1.5rem
    margin-top -0.1rem
    padding-left 0.5rem

  &:hover
    border-color var(--accent)

form
  display block
  margin auto
  text-align center

  height 100%

  label
    float left
    font-family "Quicksand", sans-serif

  #message
    font-size 1.5em

  input[type="submit"]
    padding 0.5rem 2rem
    cursor pointer

    border solid 0.15rem var(--accent)
    background none
    color var(--fg)

    font-family "Quicksand", sans-serif
    font-weight bold
    font-size 1.2rem

    transition ease-in-out 150ms

    &:hover
      background-color var(--accent-7)
      color var(--bg)

    &:active
      background-color var(--accent)

.mail-desc
  margin 0 auto
  width max-content
  color var(--fg)

.links
  display flex
  gap 1rem
  flex-direction column

  width min-content
  max-width 100%
  overflow-x scroll

  @media screen and (min-width 450px)
    flex-direction row

  .bracket
    &:before
      content ""
      display block

      height 0.5em
      width 95%
      margin 0 auto
      margin-top 2rem
      margin-bottom -2.5rem

      border solid 0.15rem var(--bg-accent)
      border-bottom none

      transition border-color ease-in-out transition-medium

    p
      font-family "Quicksand", sans-serif
      font-weight bold
      color var(--fg)
      transition color ease-in-out transition-medium

    &:hover
      &:before
        border solid 0.15rem var(--fg)
        border-bottom none
      p
        color var(--accent-7)

      .icons>li
        :global(svg path),
        :global(svg text)
          fill var(--fg)
          stroke var(--fg)

.icons
  display flex
  flex-direction column
  justify-content space-around

  @media screen and (min-width 250px)
    flex-direction row

  li
    :global(svg)
      margin 1rem
    :global(svg path),
    :global(svg text)
      fill var(--bg-light)

      stroke-opacity 0
      stroke var(--bg-light)
    a:hover
      :global(svg path),
      :global(svg text)
        fill var(--accent-7) !important
        stroke var(--accent-7) !important
    a:active
      :global(svg:active path),
      :global(svg:active text)
        fill var(--accent-6) !important
        stroke var(--accent-6) !important

</style>
