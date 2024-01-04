<script>
  import { browser } from "$app/environment";
  import IconLinks from "$components/IconLinks.svelte";
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

  function sendEmail() {
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

<svelte:head>
  <meta
    name="description"
    content="Tin Švagelj's contact information and social links."
  />
  <title>tinsvagelj::net - contact</title>
</svelte:head>

<main class="v-fit">
  <section class="center">
    {#if browser && emailStatus == null}
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
          <input class="button" type="submit" value="Send" />
        </form>
      </div>
    {:else if browser}
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
            href="mailto:tin.svagelj@live.com">tin.svagelj@live.com</a
          >
        </p>
      </div>
    {/if}
  </section>

  {#if browser}
    <p class="mail-desc">
      (the form will send an e-mail to: <a href="mailto:tin.svagelj@live.com"
        >tin.svagelj@live.com</a
      >)
    </p>
  {/if}

  <section id="contact-links" class="center">
    <h3>Find Me Elsewhere</h3>
    <IconLinks />
  </section>
</main>

<style lang="stylus">
main
  width 100vw

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
    stroke var(--clr-red)

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

  input.button
    padding 0.5rem 2rem
    margin 0 auto
    border-radius 0.25rem

    font-weight bold
    font-size 1.2rem

    transition ease-in-out 150ms

.mail-desc
  margin 0 auto
  width max-content
  color var(--fg)
</style>
