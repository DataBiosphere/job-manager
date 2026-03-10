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

export default [
{
    ignores: ["projects/**/*", "**/node_modules", "**/dist"],
},
{
    files: ["**/*.ts"],

    extends: compat.extends(
        "plugin:@angular-eslint/recommended",
        "plugin:@angular-eslint/template/process-inline-templates",
    ),

    languageOptions: {
        ecmaVersion: 5,
        sourceType: "script",

        parserOptions: {
            project: ["tsconfig.json", "e2e/tsconfig.json"],
            createDefaultProgram: true,
        },
    },

    rules: {
        "@angular-eslint/component-selector": ["error", {
            style: "kebab-case",
            type: "element",
        }],

        "@angular-eslint/directive-selector": ["error", {
            style: "camelCase",
            type: "attribute",
        }],

        "@angular-eslint/no-output-native": "off",
        "@angular-eslint/no-input-rename": "off",
        "@angular-eslint/no-output-on-prefix": "off",
        "@angular-eslint/contextual-lifecycle": "off",
        "@angular-eslint/no-empty-lifecycle-method": "off",
    },
}, {
    files: ["**/*.html"],
    extends: compat.extends("plugin:@angular-eslint/template/recommended"),
    rules: {},
}];
