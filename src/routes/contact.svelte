<script lang="ts">
    import emailjs from "emailjs-com";

	var name = '';
	var email = '';
	var message = '';

    function valid() {
      return (
        name.length > 0 && email.length > 0 && message.length > 0
      );
    }

	async function sendEmail(_: Event) {
		if (!valid()) {
			return;
		}

		try {
			emailjs.send(
				'caellian-net',
				'job-contact-email',
				{
					name,
					email,
					message
				},
				'user_TD8lB5tDhA6fPs2uQHWqn'
			);
		} catch (error) {
			console.log({ error });
		}

		name = '';
		email = '';
		message = '';
	}
</script>

<div class="center">
	<form on:submit|preventDefault={sendEmail}>
		<label for="name">Name</label>
		<input type="text" name="name" id="name" value={name} placeholder="Your Name" required />
		<label for="email">Email Address</label>
		<input type="email" name="email" id="email" value={email} placeholder="Your Email" required />
		<label for="message">Message</label>
		<textarea
			name="message"
			id="message"
			value={message}
			cols="30"
			rows="6"
			placeholder="Your next great idea"
			required
		/>
		<input type="submit" value="Send" />
	</form>
</div>

<style lang="less">
	@import '../style/constants.less';

	.center {
		min-height: calc(100vh - @nav-height);
	}

	form {
		--underline-width: 2px;

		display: block;
		margin: auto;
		text-align: center;

		max-width: calc(100% - 2rem);
		width: @tablet-size;
		height: 100%;

		label {
			float: left;
			font-family: 'Quicksand', sans-serif;
		}

		input[type='text'],
		[type='email'],
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

		input[type='submit'] {
			padding: @button-padding;
			cursor: pointer;

			border: solid 2px var(--accent);
			background: none;
			color: var(--text);

			font-family: 'Quicksand', sans-serif;
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
</style>
