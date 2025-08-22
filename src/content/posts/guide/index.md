---
title: 写作指南
published: 2025-08-20
description: "如何使用此博客模板。"
image: "./cover.jpg"
tags: ["Fuwari", "博客", "定制"]
category: 指南
draft: false
---

该博客基于 [Astro](https://astro.build/) 构建。对于本指南中未提及的事项，您或许可以在 [Astro 官方文档](https://docs.astro.build/) 中找到答案。

## 文章的 Front-matter

```yaml
---
title: 文章
published: 2025-01-01
description: 副标题
image: ./cover.jpg
tags: [Foo, Bar]
category: 前端
draft: false
---
```

| 属性          | 描述                                                                                                                                                                                                    |
|---------------|---------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------|
| `title`       | 文章的标题。                                                                                                                                                                                            |
| `published`   | 文章的发布日期。                                                                                                                                                                                        |
| `description` | 文章的简短描述，会显示在索引页面上。                                                                                                                                                                    |
| `image`       | 文章的封面图片路径。<br/>1. 以 `http://` 或 `https://` 开头：使用网络图片<br/>2. 以 `/` 开头：用于 `public` 目录下的图片<br/>3. 无上述前缀：相对于当前 Markdown 文件的路径 |
| `tags`        | 文章的标签。                                                                                                                                                                                            |
| `category`    | 文章的分类。                                                                                                                                                                                            |
| `draft`       | 如果文章仍为草稿，则不会被显示。                                                                                                                                                                        |

## 文章文件存放位置

您的文章文件应放置在 `src/content/posts/` 目录下。您也可以创建子目录来更好地组织您的文章和相关资源。

```
src/content/posts/
├── post-1.md
└── post-2/
    ├── cover.png
    └── index.md
```