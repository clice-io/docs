# Introduction

Run `demo check` before every commit. See the [rules](./rules.md) for details.

<!-- This comment stays byte-identical. -->

```shell
demo check --all
```

- Fast startup
- Small memory footprint, see demo#12

1. Install the tool
2. Run it

- [x] Parser
- [ ] Formatter

| Feature | Status    |
| :------ | :-------- |
| Hover   | Supported |
| Lint    | Planned   |

> **Note:** the formatter is experimental.

### Hover

Hover shows the type under the cursor.

### Lint

- Lint reports style problems:

  ```text
  warning: unused variable
  ```
