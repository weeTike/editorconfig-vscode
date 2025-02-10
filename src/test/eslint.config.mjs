import globals from "globals";

export default [{
    languageOptions: {
        globals: {
            ...globals.mocha,
        },
    },

    rules: {
        "no-async-promise-executor": "off",
        "no-await-in-loop": "off",
        "@typescript-eslint/no-non-null-assertion": "off",
    },
}];