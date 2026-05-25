# 安装指南

## 方式一:命令行安装(推荐)

### 1. 解压本 Skill 包到 EasyClaw 工作区

**Windows**:
```cmd
# 假设解压后路径是 C:\Downloads\career-war-room\
xcopy /E /I C:\Downloads\career-war-room %USERPROFILE%\.easyclaw\workspace\skills\career-war-room\
```

**macOS / Linux**:
```bash
cp -r ~/Downloads/career-war-room ~/.easyclaw/workspace/skills/
```

### 2. 验证 Skill 已加载

```bash
easyclaw skills list
```

应看到 `career-war-room` 在列表中。

### 3. 把 6 位子 Agent 注册到主 Agent 工作区

```bash
# 把 agents/ 下的 6 个文件夹链接到主 Agent 的 agents 目录
cp -r ~/.easyclaw/workspace/skills/career-war-room/agents/* ~/.easyclaw/agents/
```

### 4. 配置主 Agent 调度权限

```bash
easyclaw config set agents.list[0].subagents.allowAgents \
  '["prism","scope","scalpel","arena","balance","lumen"]' --json
```

### 5. 验证团队就位

```bash
easyclaw agents list
```

应看到 7 位 Agent(主 + 6 子)全部在线。

---

## 方式二:对你的主 Agent 说(更简单)

如果你不喜欢命令行,可以直接对你的 EasyClaw 主 Agent 说:

> "请安装 career-war-room Skill,
> Skill 包就在我下载文件夹里。
> 帮我把 6 位子 Agent 配置好,
> 并验证团队就位。"

主 Agent 会自动完成全部安装步骤。

---

## 开始使用

安装完成后,对主 Agent 说:

> "我是应届生,在求职中遇到困难,请帮我。"

主 Agent(扮演 Compass)会自动分诊并调度对应子 Agent,
30 分钟后给你一份完整的《个人校招作战地图》。

---

## 故障排查

### 子 Agent 不响应
- 检查 `easyclaw config get agents.list[0].subagents.allowAgents`
- 应该看到 6 位 Agent 名字都在列表里

### Skill 未加载
- 检查 `~/.easyclaw/workspace/skills/career-war-room/SKILL.md` 是否存在
- 重启 EasyClaw 客户端

### 仍然有问题
- 查看 GitHub 仓库 Issues:https://github.com/你的用户名/career-war-room/issues
- 提一个 issue,我会回复
