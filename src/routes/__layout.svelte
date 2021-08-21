<script lang="ts">
	import { prerendering } from '$app/env';

	import Compass from '$lib/components/Compass.svelte';
	import NavLinks from '$lib/components/NavLinks.svelte';

	var navigate = false;
</script>

<svelte:head>
	<title>caellian::com</title>
</svelte:head>

<nav id="navbar" style={navigate ? 'position:fixed;top:0;left:0;' : ''}>
	<a href="https://caellian.com" class="name"><h1>caellian<span>::</span>com</h1></a>

	<ul id="nav-links">
		<NavLinks />
	</ul>

	{#if !prerendering}
	<div on:click={() => (navigate = !navigate)} id="nav-button">
		<Compass color={navigate ? 'var(--accent)' : 'var(--text)'} spin={navigate} />
	</div>
	{/if}
</nav>

<ul id="mobile-links" style="z-index:{navigate ? '1000' : '-100'};{navigate ? '' : 'opacity:0;'}">
	<NavLinks onClick={() => (navigate = false)} />
</ul>

<main style="opacity:{navigate ? '0' : '1'};">
	<slot />
</main>

<style lang="less" global>
	@import '../style/global.less';
	@import '../style/constants.less';

	#navbar {
		display: flex;
		justify-content: space-between;
		align-items: center;

		width: 100vw;
		height: @nav-height;
		background: var(--bg-color);

		border-bottom: @border-style;
		z-index: 1000;

		.name {
			h1 {
				margin-top: auto;
				margin-bottom: auto;

				padding: 0;
				padding-left: 2vh;

				z-index: 2;

				font-size: 2rem;
				color: var(--text);

				transition: color @transition-short;

				@media (min-width: @mobile-size) {
					font-size: 2.5rem;
				}

				span {
					color: var(--accent);

					transition: color @transition-short;
				}

				&:hover {
					color: var(--accent);

					span {
						color: var(--text);
					}
				}
			}
		}

		#nav-button {
			display: grid;
			place-items: center;

			width: @nav-height;
			height: @nav-height;

			padding: 1vh;

			border-left: solid 2px var(--bg-accent);
			cursor: pointer; // Not really needed, but hey, it's here

			@media (min-width: @mobile-size) {
				display: none;
			}
		}

		#nav-links {
			display: none;

			@media (min-width: @mobile-size) {
				display: flex;
				justify-content: space-around;
				align-items: flex-end;

				margin-bottom: 0.5rem;

				height: 100%;

				li {
					a {
						padding-right: 1rem;
						margin-bottom: 0.5rem;

						font-family: 'Quicksand', sans-serif;
						font-size: 1.5rem;
						color: var(--text);

						&:hover {
							color: var(--accent-light);
						}

						&:active {
							color: var(--accent);
						}

						&::after {
							visibility: hidden;

							content: '_';
							font-weight: bold;

							animation: blinking @transition-medium steps(2, start) infinite;
						}
					}

					&.current {
						a {
							color: var(--accent);

							&:hover {
								color: var(--accent);
							}

							&::after {
								visibility: visible;
							}
						}
					}
				}
			}
		}

		@keyframes blinking {
			to {
				visibility: hidden;
			}
		}
	}

	main {
		width: 100vw;
		min-height: calc(100vh - @nav-height);

		overflow-x: hidden;

		transition: opacity ease-in-out @transition-medium;
	}

	#mobile-links {
		display: flex;
		flex-direction: column;
		justify-content: space-around;
		align-items: center;

		background: var(--bg-color);

		position: fixed;
		top: @nav-height;
		left: 0;
		width: 100vw;
		height: calc(100vh - @nav-height);

		text-align: center;

		opacity: 1;
		transition: opacity ease-in-out @transition-medium;

		li {
			display: block;
			width: max-content;

			a {
				font-family: 'Quicksand', sans-serif;
				color: var(--text);
				font-size: 1.3rem;

				padding: 0.5rem;
			}

			&.current {
				a {
					border-bottom: solid 2px var(--accent-light);
					color: var(--accent-light);
				}
			}

			&:active {
				a {
					border-color: var(--accent);
					color: var(--accent);
				}
			}
		}
	}
</style>
