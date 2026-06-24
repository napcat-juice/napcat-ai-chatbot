# 图片素材指南

将截图放入 `docs/images/`，文件名必须与下表一致，README 才会正确显示。

## 文件清单

| 文件名 | 用途 | 建议尺寸 | 谁提供 |
|--------|------|----------|--------|
| `banner.png` | README 顶部横幅 | 1200 x 400 px | 已内置（纯文字网格风），可自选替换 |
| `screenshot-dashboard.png` | 仪表盘概览 | 1280 x 800 px | **你截图替换** |
| `screenshot-api.png` | API 与模型配置页 | 1280 x 800 px | **你截图替换** |
| `screenshot-conversations.png` | 对话管理 | 1280 x 800 px | **你截图替换** |
| `screenshot-tokens.png` | Token 统计与图表 | 1280 x 800 px | **你截图替换** |
| `screenshot-logs.png` | 运行日志 | 1280 x 800 px | **你截图替换** |
| `screenshot-chat.png` | QQ 群内实际对话效果 | 800 x 600 px | **你截图替换** |

## 截图步骤（WebUI）

1. 启动 NapCat，确保插件已加载。
2. 浏览器打开：`http://<你的地址>/plugin/napcat-plugin-chat-bot/page/dashboard`
3. 使用 **深色主题**（与 README 黑白风格一致）。
4. 按 `Win + Shift + S`（Windows）或系统截图工具框选内容区。
5. 保存为 PNG，放入 `docs/images/`，**覆盖**对应占位图。

### 各页截图要点

**screenshot-dashboard.png**

- 侧边栏选「概览」。
- 确保可见：四张数据卡片 + Token 趋势图 + 快捷入口按钮。

**screenshot-api.png**

- 侧边栏「API 与模型」。
- 密钥字段打码（黑色块遮住 Key）。

**screenshot-conversations.png**

- 侧边栏「对话管理」。
- 尽量有 1～2 条会话列表；右侧可显示会话详情。

**screenshot-tokens.png**

- 侧边栏「Token 统计」。
- 确保三张图表（趋势 / 柱状 / 环形）已加载。

**screenshot-logs.png**

- 侧边栏「运行日志」。
- 确保有多条日志，且 JSON 详情带语法高亮。

**screenshot-chat.png**

- QQ 客户端群内 @ 机器人或触发指令的截图。
- 昵称、群号等隐私信息请打码。

## Star History 图表

仓库推送到 GitHub 后：

1. 打开 [Star History](https://www.star-history.com/)
2. 输入 `你的用户名/napcat-ai-chatbot`
3. 选择 **Date** 模式
4. 将 README 里的 `YOUR_USERNAME` 替换为真实用户名

```markdown
[![Star History Chart](https://api.star-history.com/svg?repos=YOUR_USERNAME/napcat-ai-chatbot&type=Date)](https://star-history.com/#YOUR_USERNAME/napcat-ai-chatbot&Date)
```

## 提交前检查

- [ ] 六张 `screenshot-*.png` 已替换为你的真实截图
- [ ] 截图中无真实 API Key、QQ 号、群号
- [ ] README 中 `YOUR_USERNAME` 已改为 GitHub 用户名
