<script lang="ts">
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

<section class="center tall">
  {#if !emailSent}
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
  {:else}
    <div class="sent">
      <svg viewBox="0 0 24 24">
        <path d="M21,7L9,19L3.5,13.5L4.91,12.09L9,16.17L19.59,5.59L21,7Z" />
      </svg>
      <p>Email sent.</p>
    </div>
  {/if}
</section>

<section class="center">
  <div>
    <h2>Find Me on Social Media</h2>
    <ul class="icons">
      <li>
        <a href="https://www.linkedin.com/in/tinsvagelj/" target="_blank">
          <svg role="img" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
            <path
              d="M20.447 20.452h-3.554v-5.569c0-1.328-.027-3.037-1.852-3.037-1.853 0-2.136 1.445-2.136 2.939v5.667H9.351V9h3.414v1.561h.046c.477-.9 1.637-1.85 3.37-1.85 3.601 0 4.267 2.37 4.267 5.455v6.286zM5.337 7.433c-1.144 0-2.063-.926-2.063-2.065 0-1.138.92-2.063 2.063-2.063 1.14 0 2.064.925 2.064 2.063 0 1.139-.925 2.065-2.064 2.065zm1.782 13.019H3.555V9h3.564v11.452zM22.225 0H1.771C.792 0 0 .774 0 1.729v20.542C0 23.227.792 24 1.771 24h20.451C23.2 24 24 23.227 24 22.271V1.729C24 .774 23.2 0 22.222 0h.003z"
            /></svg
          >
        </a>
      </li>
      <li>
        <a href="https://twitter.com/tinsvagelj" target="_blank">
          <svg role="img" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
            <path
              d="M23.953 4.57a10 10 0 01-2.825.775 4.958 4.958 0 002.163-2.723c-.951.555-2.005.959-3.127 1.184a4.92 4.92 0 00-8.384 4.482C7.69 8.095 4.067 6.13 1.64 3.162a4.822 4.822 0 00-.666 2.475c0 1.71.87 3.213 2.188 4.096a4.904 4.904 0 01-2.228-.616v.06a4.923 4.923 0 003.946 4.827 4.996 4.996 0 01-2.212.085 4.936 4.936 0 004.604 3.417 9.867 9.867 0 01-6.102 2.105c-.39 0-.779-.023-1.17-.067a13.995 13.995 0 007.557 2.209c9.053 0 13.998-7.496 13.998-13.985 0-.21 0-.42-.015-.63A9.935 9.935 0 0024 4.59z"
            /></svg
          >
        </a>
      </li>
      <li>
        <a href="tg://resolve?domain=caellian" target="_blank">
          <svg role="img" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
            <path
              d="M11.944 0A12 12 0 0 0 0 12a12 12 0 0 0 12 12 12 12 0 0 0 12-12A12 12 0 0 0 12 0a12 12 0 0 0-.056 0zm4.962 7.224c.1-.002.321.023.465.14a.506.506 0 0 1 .171.325c.016.093.036.306.02.472-.18 1.898-.962 6.502-1.36 8.627-.168.9-.499 1.201-.82 1.23-.696.065-1.225-.46-1.9-.902-1.056-.693-1.653-1.124-2.678-1.8-1.185-.78-.417-1.21.258-1.91.177-.184 3.247-2.977 3.307-3.23.007-.032.014-.15-.056-.212s-.174-.041-.249-.024c-.106.024-1.793 1.14-5.061 3.345-.48.33-.913.49-1.302.48-.428-.008-1.252-.241-1.865-.44-.752-.245-1.349-.374-1.297-.789.027-.216.325-.437.893-.663 3.498-1.524 5.83-2.529 6.998-3.014 3.332-1.386 4.025-1.627 4.476-1.635z"
            /></svg
          >
        </a>
      </li>
      <li>
        <a href="https://github.com/Caellian" target="_blank">
          <svg role="img" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
            <path
              d="M12 .297c-6.63 0-12 5.373-12 12 0 5.303 3.438 9.8 8.205 11.385.6.113.82-.258.82-.577 0-.285-.01-1.04-.015-2.04-3.338.724-4.042-1.61-4.042-1.61C4.422 18.07 3.633 17.7 3.633 17.7c-1.087-.744.084-.729.084-.729 1.205.084 1.838 1.236 1.838 1.236 1.07 1.835 2.809 1.305 3.495.998.108-.776.417-1.305.76-1.605-2.665-.3-5.466-1.332-5.466-5.93 0-1.31.465-2.38 1.235-3.22-.135-.303-.54-1.523.105-3.176 0 0 1.005-.322 3.3 1.23.96-.267 1.98-.399 3-.405 1.02.006 2.04.138 3 .405 2.28-1.552 3.285-1.23 3.285-1.23.645 1.653.24 2.873.12 3.176.765.84 1.23 1.91 1.23 3.22 0 4.61-2.805 5.625-5.475 5.92.42.36.81 1.096.81 2.22 0 1.606-.015 2.896-.015 3.286 0 .315.21.69.825.57C20.565 22.092 24 17.592 24 12.297c0-6.627-5.373-12-12-12"
            /></svg
          >
        </a>
      </li>
      <li>
        <a href="https://www.reddit.com/user/chaellian/" target="_blank">
          <svg role="img" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
            <path
              d="M12 0A12 12 0 0 0 0 12a12 12 0 0 0 12 12 12 12 0 0 0 12-12A12 12 0 0 0 12 0zm5.01 4.744c.688 0 1.25.561 1.25 1.249a1.25 1.25 0 0 1-2.498.056l-2.597-.547-.8 3.747c1.824.07 3.48.632 4.674 1.488.308-.309.73-.491 1.207-.491.968 0 1.754.786 1.754 1.754 0 .716-.435 1.333-1.01 1.614a3.111 3.111 0 0 1 .042.52c0 2.694-3.13 4.87-7.004 4.87-3.874 0-7.004-2.176-7.004-4.87 0-.183.015-.366.043-.534A1.748 1.748 0 0 1 4.028 12c0-.968.786-1.754 1.754-1.754.463 0 .898.196 1.207.49 1.207-.883 2.878-1.43 4.744-1.487l.885-4.182a.342.342 0 0 1 .14-.197.35.35 0 0 1 .238-.042l2.906.617a1.214 1.214 0 0 1 1.108-.701zM9.25 12C8.561 12 8 12.562 8 13.25c0 .687.561 1.248 1.25 1.248.687 0 1.248-.561 1.248-1.249 0-.688-.561-1.249-1.249-1.249zm5.5 0c-.687 0-1.248.561-1.248 1.25 0 .687.561 1.248 1.249 1.248.688 0 1.249-.561 1.249-1.249 0-.687-.562-1.249-1.25-1.249zm-5.466 3.99a.327.327 0 0 0-.231.094.33.33 0 0 0 0 .463c.842.842 2.484.913 2.961.913.477 0 2.105-.056 2.961-.913a.361.361 0 0 0 .029-.463.33.33 0 0 0-.464 0c-.547.533-1.684.73-2.512.73-.828 0-1.979-.196-2.512-.73a.326.326 0 0 0-.232-.095z"
            /></svg
          >
        </a>
      </li>
    </ul>
  </div>
</section>

<style lang="less">
  @import "../style/constants.less";

  .center {
    width: 100vw;

    h2 {
      text-align: center;
    }
  }

  .tall {
    min-height: calc(100vh - @nav-height - 20vh);
  }

  .sent {
    display: flex;
    justify-content: space-between;
    align-items: center;

    background: var(--bg-light);
    padding: 2rem;

    border-radius: 0.2rem;

    transition: background ease-in-out @transition-long;

    svg {
      fill: var(--bg-color);

      width: 3rem;
      width: 3rem;
    }

    p {
      padding: 0;

      font-size: 1.5rem;
      margin-top: -0.1rem;
      padding-left: 0.5rem;
    }

    &:hover {
      background: var(--accent);
    }
  }

  form {
    --underline-width: 2px;

    display: block;
    margin: auto;
    text-align: center;

    height: 100%;

    label {
      float: left;
      font-family: "Quicksand", sans-serif;
    }

    input[type="text"],
    [type="email"],
    textarea {
      box-sizing: border-box;
      width: 100%;
      padding: 0.5vh;
      margin-bottom: 2vh;
      resize: vertical;

      background: none;
      color: var(--text);

      border: none;
      border-bottom: solid var(--underline-width) var(--accent);

      transition: border-bottom ease-in-out 200ms;

      &:focus {
        outline: none;
        border-bottom: solid var(--underline-width) var(--accent-light);
      }

      &:invalid {
        outline: none;
        box-shadow: none;
        border-bottom: solid var(--underline-width) red;
      }
    }

    #message {
      font-size: 1.5em;
    }

    input[type="submit"] {
      padding: @button-padding;
      cursor: pointer;

      border: solid 2px var(--accent);
      background: none;
      color: var(--text);

      font-family: "Quicksand", sans-serif;
      font-weight: bold;
      font-size: 1.2rem;

      transition: ease-in-out 150ms;

      &:hover {
        background-color: var(--accent-light);
        color: var(--bg-color);
      }

      &:active {
        background-color: var(--accent);
      }
    }
  }

  .icons {
    display: flex;
    justify-content: space-around;

    width: 100vw;

    @media (min-width: @mobile-size) {
      width: 50vw;
    }

    li {
      padding: 1vh;

      * {
        height: 2rem;
      }

      svg {
        path {
          fill: var(--bg-light);
        }

        &:hover {
          path {
            fill: var(--text);
          }
        }
      }

      a:active {
        svg {
          path {
            fill: var(--accent);
          }
        }
      }
    }
  }
</style>
