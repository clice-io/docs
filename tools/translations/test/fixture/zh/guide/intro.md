# 简介

每次提交前运行 `demo check`。详见 [规则](./rules.md)。

<!-- This comment stays byte-identical. -->

```shell
demo check --all
```

- 启动快
- 内存占用小，见 demo#12

1. 安装工具
2. 运行它

- [x] 解析器
- [ ] 格式化器

| 功能 | 状态   |
| :--- | :----- |
| 悬停 | 支持   |
| Lint | 计划中 |

> **注意：** 格式化器仍是实验性的。

### 悬停

悬停显示光标处的类型。

### Lint

- Lint 报告风格问题：

  ```text
  warning: unused variable
  ```
