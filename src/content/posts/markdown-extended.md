---
title: Markdown 扩展功能
published: 2025-08-22
description: '深入了解 Fuwari 中的 Markdown 功能'
image: ''
tags: [演示, 示例, Markdown, Fuwari]
category: 示例
draft: false 
---

## GitHub 仓库卡片
您可以添加动态链接到 GitHub 仓库的卡片。在页面加载时，仓库信息会通过 GitHub API 自动拉取。

::github{repo="SETIX-A/Fuwari"}

使用代码 `::github{repo="<owner>/<repo>"}` 来创建一个 GitHub 仓库卡片。

```markdown
::github{repo="saicaca/fuwari"}
```

## 忠告栏 (Admonitions)

支持以下类型的忠告栏：`note` `tip` `important` `warning` `caution`

:::note
高亮用户即使在粗略浏览时也应注意到的信息。
:::

:::tip
为帮助用户取得更大成功而提供的可选信息。
:::

:::important
用户成功所必需的关键信息。
:::

:::warning
因潜在风险而要求用户立即关注的关键内容。
:::

:::caution
某个行为可能带来的负面后果。
:::

### 基本语法

```markdown
:::note
高亮用户即使在粗略浏览时也应注意到的信息。
:::

:::tip
为帮助用户取得更大成功而提供的可选信息。
:::
```

### 自定义标题

忠告栏的标题可以自定义。

:::note[我的自定义标题]
这是一个带有自定义标题的笔记。
:::

```markdown
:::note[我的自定义标题]
这是一个带有自定义标题的笔记。
:::
```

### GitHub 语法

> [!TIP]
> 同样支持 [GitHub 语法](https://github.com/orgs/community/discussions/16925)。

```
> [!NOTE]
> 同样支持 GitHub 语法。

> [!TIP]
> 同样支持 GitHub 语法。
```