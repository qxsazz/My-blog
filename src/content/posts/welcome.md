---
title: "从这里开始：拆开 AI，理解它如何工作"
published: 2026-10-24
description: "dominator 的第一篇站点说明：写作方向、阅读方式，以及怎样把直觉变成可以验证的理解。"
tags: ["站点说明", "AI"]
category: "随笔"
draft: true
---

欢迎来到 **dominator**。这里将记录关于 AI 的个人理解、技术原理拆解与工程实验。

## 我们如何理解一个技术问题

一篇原理拆解，会尽量回答五个问题：

1. 它要解决什么问题？
2. 能否先用直觉解释？
3. 关键公式中的量分别代表什么？
4. 如何通过一段代码或一个实验验证？
5. 在什么情况下，它会失效？

## 公式与代码

站点支持数学公式。例如缩放点积注意力：

$$
\operatorname{Attention}(Q,K,V)=\operatorname{softmax}\left(\frac{QK^\top}{\sqrt{d_k}}\right)V
$$

其中，$Q$ 是查询，$K$ 是键，$V$ 是值，$d_k$ 是键向量的维度。这个公式把查询与键之间的相似度转为权重，再对值进行加权求和。

下面只演示最后一步的加权求和，并非完整的注意力实现：

```python
weights = [0.2, 0.8]
values = [10, 20]
output = sum(w * v for w, v in zip(weights, values))
print(output)  # 18.0
```

参考：[Attention Is All You Need](https://arxiv.org/abs/1706.03762)。

## 让阅读保持专注

你可以使用站内搜索、文章目录和深浅主题。右下角提供壁纸、光效开关和轻柔的环境音；环境音由浏览器本地合成，无需外部音乐服务。

这是一篇站点介绍与排版示例，后续会逐步加入更完整的技术文章。
