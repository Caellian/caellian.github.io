<script lang="ts">
    export var name: string;
    export var description: string;
    export var link: string | null | undefined;
</script>

<a href={link || "."}>
    <h3>{name}</h3>
    <p>{description}</p>
</a>

<style lang="less">
	@import '../../style/constants.less';

    a {
        display: block;

        background-color: var(--bg-color);
        padding: 1rem 2.5rem;

        height: min-content;
        border-bottom: @border-style;
        border-top: @border-style;

        transition: background-color ease-in-out @transition-medium;
        transition: border-color ease-in-out @transition-short;

        > h3 {
			font-family: 'Quicksand', sans-serif;
			font-size: 1.4rem;
			color: var(--text);

            padding: 0;
        }
        > p {
			font-size: 1rem;
            padding: 0;
        }

        &:hover {
            background-color: var(--bg-accent);

            border-color: var(--accent);

            > h3 {
                color: var(--accent-light);
            }
        }

        &:active {
            > h3 {
                color: var(--accent);
            }
            > p {
                color: var(--accent-light);
            }
        }
    }
</style>
