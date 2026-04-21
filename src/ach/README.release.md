# Agent Continuity Harness (ACH)

这个分支是 **ACH 的直接安装分支**。

这里的仓库根目录本身就是最终可安装内容，不再保留 `src/ach/...`、构建脚本或其他源码结构。

## 如何安装

将这个分支的根目录作为一个 skill 目录放入你的 Codex skills 目录，并命名为 `ach`。

也就是说，安装后的目标结构应当直接从这些文件开始：

- `SKILL.md`
- `agents/`
- `references/`
- `assets/`

## 这个分支和 `main` 的区别

- `release-ach`
  只保留最终可安装内容，适合直接下载和安装
- `main`
  保留 `src/ach/...`、构建脚本、校验脚本和维护所需的源码结构

如果你只是想安装 ACH，用这个分支即可。  
如果你想查看源码、参与维护或重新构建发布产物，请切回 `main`。
