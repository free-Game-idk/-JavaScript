# Void Cilent v0.1 — Web 原型

这是按你的规范实现的可交互网页原型（放在 void-client-prototype/ 目录下）。界面语言为中文，标题和拼写保持为“Void Cilent”以配合你的原始描述。

包含文件：
- index.html
- style.css
- app.js
- assets/icons.svg
- assets/default-skin.svg

功能亮点（原型）：
- 主菜单布局（顶标、两条主按钮、底部设置/V/模组）
- 鼠标悬停/按下动画（边框变为青蓝 #39CBE8、放大到 105%、外发光）
- 左侧星球：点击打开 About 页面
- 右侧玩家资料框：第一次点击选中，第二次点击进入编辑（可改名、上传皮肤PNG并预览）
- 模组页面：每个模组单独开关（ToggleSprint、Zoom），有设置入口（示例）
- HUD 编辑器示例：可拖拽 FPS/CPS 模块、保存到 localStorage、Cancel/Reset

保存：
- 设置/模组/玩家资料/HUD 都保存在浏览器 localStorage 中，key 在 app.js 顶部注释里可查看。

如何本地查看：
1. 克隆仓库并切到分支 void-client-ui-prototype
2. 打开 void-client-prototype/index.html

下一步我会：
- 如果你确认无改动要求，我将把更多模组的 UI 与 HUD 模块选项补全，并把图标打磨为更精细的 SVG。
- 如果要我部署 GitHub Pages 预览，请授权我开启 Pages 或告诉我你希望如何部署。

