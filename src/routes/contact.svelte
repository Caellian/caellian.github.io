<script lang="ts">
  import { prerendering } from "$app/env";
  import emailjs from "emailjs-com";

  var name = "";
  var email = "";
  var message = "";

  var emailSent = false;

  function valid() {
    return name.length > 0 && email.length > 0 && message.length > 0;
  }

  function sendEmail(_: Event) {
    if (!valid()) {
      return;
    }

    emailSent = true;

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
    } catch (error) {
      console.log({ error });
    }
  }
</script>

<div class="v-fit">
  <section class="center tall">
    {#if !prerendering && !emailSent}
      <div>
        <h2>Contact Me via E-mail</h2>
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
            placeholder="Your next great idea"
            required
          />
          <input type="submit" value="Send" />
        </form>
      </div>
    {:else if !prerendering}
      <div class="sent">
        <svg viewBox="0 0 24 24">
          <path d="M21,7L9,19L3.5,13.5L4.91,12.09L9,16.17L19.59,5.59L21,7Z" />
        </svg>
        <p>Email sent.</p>
      </div>
    {:else}
      <div>
        <p>
          You can contact me by sending an email to: <a
            href="mailto:tin.svagelj@gmail.com">tin.svagelj@live.com</a
          >
        </p>

        <p>If JS was enabled you could use a fancy pants form.</p>
      </div>
    {/if}
  </section>

  <section class="center short">
    <div>
      <h2>Find Me Elsewhere</h2>
      <ul class="icons">
        <li>
          <a href="https://www.linkedin.com/in/tinsvagelj/" target="_blank">
            <svg
              role="img"
              viewBox="0 0 24 24"
              xmlns="http://www.w3.org/2000/svg"
            >
              <path
                d="M20.447 20.452h-3.554v-5.569c0-1.328-.027-3.037-1.852-3.037-1.853 0-2.136 1.445-2.136 2.939v5.667H9.351V9h3.414v1.561h.046c.477-.9 1.637-1.85 3.37-1.85 3.601 0 4.267 2.37 4.267 5.455v6.286zM5.337 7.433c-1.144 0-2.063-.926-2.063-2.065 0-1.138.92-2.063 2.063-2.063 1.14 0 2.064.925 2.064 2.063 0 1.139-.925 2.065-2.064 2.065zm1.782 13.019H3.555V9h3.564v11.452zM22.225 0H1.771C.792 0 0 .774 0 1.729v20.542C0 23.227.792 24 1.771 24h20.451C23.2 24 24 23.227 24 22.271V1.729C24 .774 23.2 0 22.222 0h.003z"
              /></svg
            >
          </a>
        </li>
        <li>
          <a href="tg://resolve?domain=caellian" target="_blank">
            <svg
              role="img"
              viewBox="0 0 24 24"
              xmlns="http://www.w3.org/2000/svg"
            >
              <path
                d="M11.944 0A12 12 0 0 0 0 12a12 12 0 0 0 12 12 12 12 0 0 0 12-12A12 12 0 0 0 12 0a12 12 0 0 0-.056 0zm4.962 7.224c.1-.002.321.023.465.14a.506.506 0 0 1 .171.325c.016.093.036.306.02.472-.18 1.898-.962 6.502-1.36 8.627-.168.9-.499 1.201-.82 1.23-.696.065-1.225-.46-1.9-.902-1.056-.693-1.653-1.124-2.678-1.8-1.185-.78-.417-1.21.258-1.91.177-.184 3.247-2.977 3.307-3.23.007-.032.014-.15-.056-.212s-.174-.041-.249-.024c-.106.024-1.793 1.14-5.061 3.345-.48.33-.913.49-1.302.48-.428-.008-1.252-.241-1.865-.44-.752-.245-1.349-.374-1.297-.789.027-.216.325-.437.893-.663 3.498-1.524 5.83-2.529 6.998-3.014 3.332-1.386 4.025-1.627 4.476-1.635z"
              /></svg
            >
          </a>
        </li>
        <li>
          <a href="https://matrix.to/#/@caellian:matrix.org" target="_blank">
            <svg
              role="img"
              viewBox="0 0 24 24"
              xmlns="http://www.w3.org/2000/svg"
            >
              <path
                style="stroke-width:1.5;stroke-linecap:square;fill-opacity:0;stroke-opacity:1"
                d="m2.5,0.76-1.75,0V23.25H2.5"
              />
              <text
                style="font-family:sans-serif;font-weight:bold;font-size:15px"
                x="4.3"
                y="16">m</text
              >
              <path
                style="stroke-width:1.5;stroke-linecap:square;fill-opacity:0;stroke-opacity:1"
                d="m21.5,0.76h1.75V23.25H21.5"
              />
            </svg>
          </a>
        </li>
        <li>
          <a href="https://github.com/Caellian" target="_blank">
            <svg
              role="img"
              viewBox="0 0 24 24"
              xmlns="http://www.w3.org/2000/svg"
            >
              <path
                d="M12 .297c-6.63 0-12 5.373-12 12 0 5.303 3.438 9.8 8.205 11.385.6.113.82-.258.82-.577 0-.285-.01-1.04-.015-2.04-3.338.724-4.042-1.61-4.042-1.61C4.422 18.07 3.633 17.7 3.633 17.7c-1.087-.744.084-.729.084-.729 1.205.084 1.838 1.236 1.838 1.236 1.07 1.835 2.809 1.305 3.495.998.108-.776.417-1.305.76-1.605-2.665-.3-5.466-1.332-5.466-5.93 0-1.31.465-2.38 1.235-3.22-.135-.303-.54-1.523.105-3.176 0 0 1.005-.322 3.3 1.23.96-.267 1.98-.399 3-.405 1.02.006 2.04.138 3 .405 2.28-1.552 3.285-1.23 3.285-1.23.645 1.653.24 2.873.12 3.176.765.84 1.23 1.91 1.23 3.22 0 4.61-2.805 5.625-5.475 5.92.42.36.81 1.096.81 2.22 0 1.606-.015 2.896-.015 3.286 0 .315.21.69.825.57C20.565 22.092 24 17.592 24 12.297c0-6.627-5.373-12-12-12"
              /></svg
            >
          </a>
        </li>
        <li>
          <a href="https://bitbucket.org/Caellian" target="_blank">
            <svg
              role="img"
              viewBox="0 0 24 24"
              xmlns="http://www.w3.org/2000/svg"
            >
              <path
                d="M2.65 3C2.3 3 2 3.3 2 3.65C2 3.69 2 3.73 2 3.77L4.73 20.27C4.8 20.69 5.16 21 5.58 21H18.63C18.94 21 19.22 20.78 19.27 20.46L22 3.77C22.05 3.42 21.81 3.09 21.46 3.04C21.43 3.03 21.39 3.03 21.35 3.03L2.65 3M14.1 14.95H9.94L8.81 9.07H15.11L14.1 14.95Z"
              />
            </svg></a
          >
        </li>
        <li>
          <a href="https://gitlab.com/Caellian" target="_blank">
            <svg
              role="img"
              viewBox="0 0 24 24"
              xmlns="http://www.w3.org/2000/svg"
            >
              <path
                d="M21.94 13.11L20.89 9.89C20.89 9.86 20.88 9.83 20.87 9.8L18.76 3.32C18.65 3 18.33 2.75 17.96 2.75C17.6 2.75 17.28 3 17.17 3.33L15.17 9.5H8.84L6.83 3.33C6.72 3 6.4 2.75 6.04 2.75H6.04C5.67 2.75 5.35 3 5.24 3.33L3.13 9.82C3.13 9.82 3.13 9.83 3.13 9.83L2.06 13.11C1.9 13.61 2.07 14.15 2.5 14.45L11.72 21.16C11.89 21.28 12.11 21.28 12.28 21.15L21.5 14.45C21.93 14.15 22.1 13.61 21.94 13.11M8.15 10.45L10.72 18.36L4.55 10.45M13.28 18.37L15.75 10.78L15.85 10.45H19.46L13.87 17.61M17.97 3.94L19.78 9.5H16.16M14.86 10.45L13.07 15.96L12 19.24L9.14 10.45M6.03 3.94L7.84 9.5H4.23M3.05 13.69C2.96 13.62 2.92 13.5 2.96 13.4L3.75 10.97L9.57 18.42M20.95 13.69L14.44 18.42L14.46 18.39L20.25 10.97L21.04 13.4C21.08 13.5 21.04 13.62 20.95 13.69"
              />
            </svg></a
          >
        </li>
      </ul>
    </div>
  </section>
</div>

<style lang="stylus">
  @import "../style/constants";

  .v-fit
    display flex
    flex-direction column
    min-height calc(100vh - var(--nav-height))

    .tall
      flex-grow 7

    .short
      flex-grow 3

  .center
    width 100vw;

    h2
      text-align center;

  .sent
    display flex;
    justify-content space-between;
    align-items center;

    background var(--bg-light);
    padding 2rem;

    border-radius 0.2rem;

    transition background ease-in-out transition-long;

    svg
      fill var(--bg-color);

      width 3rem;

    p
      padding 0;

      font-size 1.5rem;
      margin-top -0.1rem;
      padding-left 0.5rem;

    &:hover
      background var(--accent);

  form
    --underline-width 2px;

    display block;
    margin auto;
    text-align center;

    height 100%;

    label
      float left;
      font-family "Quicksand", sans-serif;

    input[type="text"],
    [type="email"],
    textarea
      box-sizing border-box;
      width 100%;
      padding 0.5vh;
      margin-bottom 2vh;
      resize vertical;

      background none;
      color var(--text);

      border none;
      border-bottom solid var(--underline-width) var(--accent);

      transition border-bottom ease-in-out 200ms;

      &:focus
        outline none;
        border-bottom solid var(--underline-width) var(--accent-light);

      &:invalid
        outline none;
        box-shadow none;
        border-bottom solid var(--underline-width) red;

    #message
      font-size 1.5em;

    input[type="submit"]
      padding button-padding;
      cursor pointer;

      border solid 2px var(--accent);
      background none;
      color var(--text);

      font-family "Quicksand", sans-serif;
      font-weight bold;
      font-size 1.2rem;

      transition ease-in-out 150ms;

      &:hover
        background-color var(--accent-light);
        color var(--bg-color);

      &:active
        background-color var(--accent);

  .icons
    display flex;
    justify-content space-around;

    width 100vw;

    @media screen and (min-width: mobile-size)
      width 50vw;

    li
      padding 1vh;

      *
        height 2rem;

      svg
        path, text
          fill var(--bg-light)

          stroke-opacity 0
          stroke var(--bg-light)

        &:hover
          path, text
            fill var(--text);
            stroke var(--text);

      a:active
        svg
          path, text
            fill var(--accent);
            stroke var(--accent);
</style>
