let components = [
    "Donut"
];

export default Object.fromEntries(components.map(it => {
    return [it, import(`./src/${it}.wc.svelte`)];
}));
