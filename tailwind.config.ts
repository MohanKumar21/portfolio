// tailwind.config.cjs
module.exports = {
    content: [
        "./src/**/*.{html,js,svelte,ts}", // SvelteKit paths
    ],
    theme: {
        extend: {},
    },
    plugins: [require("daisyui")],
    daisyui: {
        themes: ["dark", "cupcake"], // you can pick themes, default is light+dark
    },
    future: {
        oxidePlugin: false // disable @tailwindcss/oxide
    }
}

