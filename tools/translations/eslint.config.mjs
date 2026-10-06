import tseslint from "typescript-eslint";

export default tseslint.config(
    { ignores: ["dist/", "node_modules/"] },
    ...tseslint.configs.strictTypeChecked,
    ...tseslint.configs.stylisticTypeChecked,
    {
        languageOptions: {
            parserOptions: {
                projectService: true,
                tsconfigRootDir: import.meta.dirname,
            },
        },
        rules: {
            // A command-line tool: the console is its output.
            "no-console": "off",
            "@typescript-eslint/restrict-template-expressions": ["error", { allowNumber: true }],
        },
    },
    {
        // node:test tracks the promises describe() and test() return itself.
        files: ["test/**/*.ts"],
        rules: { "@typescript-eslint/no-floating-promises": "off" },
    },
    {
        files: ["**/*.mjs"],
        extends: [tseslint.configs.disableTypeChecked],
    },
);
