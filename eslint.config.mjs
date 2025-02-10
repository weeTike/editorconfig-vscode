import typescriptEslint from "@typescript-eslint/eslint-plugin";
import globals from "globals";
import tsParser from "@typescript-eslint/parser";
import path from "node:path";
import { fileURLToPath } from "node:url";
import js from "@eslint/js";
import { FlatCompat } from "@eslint/eslintrc";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const compat = new FlatCompat({
    baseDirectory: __dirname,
    recommendedConfig: js.configs.recommended,
    allConfig: js.configs.all
});

export default [{
    ignores: ["**/out/", "src/test/suite/fixtures/"],
}, ...compat.extends("eslint:recommended", "prettier", "plugin:@typescript-eslint/recommended"), {
    plugins: {
        "@typescript-eslint": typescriptEslint,
    },

    languageOptions: {
        globals: {
            ...globals.node,
            fetch: true,
        },

        parser: tsParser,
        ecmaVersion: 6,
        sourceType: "module",

        parserOptions: {
            ecmaFeatures: {
                impliedStrict: true,
            },

            project: "./tsconfig.json",
            tsconfigRootDir: ".",
        },
    },

    rules: {
        "no-async-promise-executor": "error",
        "no-await-in-loop": "error",
        "no-misleading-character-class": "error",
        "no-template-curly-in-string": "error",
        "@typescript-eslint/member-delimiter-style": "off",
        "@typescript-eslint/camelcase": "off",
        "@typescript-eslint/explicit-module-boundary-types": "off",
        "@typescript-eslint/indent": "off",
        "@typescript-eslint/no-explicit-any": "error",
        "@typescript-eslint/no-extra-semi": "off",
        "@typescript-eslint/no-object-literal-type-assertion": "off",
        "@typescript-eslint/no-parameter-properties": "off",

        "@typescript-eslint/no-this-alias": ["error", {
            allowDestructuring: true,
        }],

        "@typescript-eslint/no-use-before-define": "off",
    },
}];