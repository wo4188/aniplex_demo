# 说明

## e-signature 分支

`canvas` 手写签名板 demo

- 🌈 已部署至 github pages 静态托管 🔎[查看](https://wo4188.github.io/aniplex_demo/)
- vite + ts + postcss
- 基于 `main` 分支进行的手动改造

### 功能特性

- 编写 类 `Signature` ，统一管理签名绘制功能
- 提供 保存图片功能，导出为 png
- 由父容器决定画布大小(自动充满)
- 兼容 电脑端 | 移动端
  - 鼠标 **click**
  - 触摸 **touch**
- 监听 容器的尺寸变化，自动备份恢复内容，并做出缩放调整
  - `ResizeObserver` [🔗](https://developer.mozilla.org/zh-CN/docs/Web/API/ResizeObserver)
  - 自行维护一个离屏 `canvas`，专门用于备份恢复
  - `drawImage` [🔗](https://developer.mozilla.org/zh-CN/docs/Web/API/CanvasRenderingContext2D/drawImage)

## main 分支

8 分屏人物效果展示 demo

- 创建仓库时的初始练习 demo
- 原生 + postcss + vue3(cdn 版)
