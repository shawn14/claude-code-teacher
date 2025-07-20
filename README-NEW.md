# ～～～{ vibe-code }～～～

<p align="center">
  <strong>Learn While You Code ✨</strong><br>
  <em>Real-time code insights that level you up with every keystroke</em>
</p>

<p align="center">
  <a href="https://discord.gg/vibecode">
    <img src="https://img.shields.io/badge/Discord-Join%20the%20Vibe-7B2FFF?style=for-the-badge&logo=discord&logoColor=white" alt="Discord">
  </a>
  <a href="https://twitter.com/vibecode">
    <img src="https://img.shields.io/badge/Twitter-Follow-FF2E63?style=for-the-badge&logo=twitter&logoColor=white" alt="Twitter">
  </a>
  <a href="#-start-vibing-in-30-seconds">
    <img src="https://img.shields.io/badge/npx-vibe--code-00FF88?style=for-the-badge&logo=npm&logoColor=black" alt="npx">
  </a>
</p>

<p align="center">
  <img src="demo.gif" alt="Vibe-Code in action" width="600">
</p>

## 🎯 What's Your Vibe?

Ever wished you had a senior developer watching over your shoulder (in a good way)? That's **vibe-code** – your AI-powered coding companion that teaches you while you work.

```bash
# This is all you need 👇
npx vibe-code
```

### 🧠 What You Get

- **🔍 Instant Code Insights**: Understand what changed and why it matters
- **📚 Real-time Teaching**: Learn concepts as you encounter them
- **🛡️ Security Warnings**: Catch vulnerabilities before they catch you
- **⚡ Performance Tips**: Write faster code from the start
- **🎮 Three Modes**: Diff tracking, rules monitoring, and interactive chat

## 🚀 Start Vibing in 30 Seconds

```bash
# Run in any project
npx vibe-code

# Or install globally
npm install -g vibe-code
vibe-code
```

That's it. Seriously. 🎉

## 🎮 Three Modes, Infinite Learning

### 🔍 **Diff Mode** - See What Changed, Learn Why

```diff
📌 UPDATE #1 | 2:45:32 PM
══════════════════════════════════════════════════
📝 auth-service.js

+ const token = sanitize(req.body.token);
+ if (!validateToken(token)) {
+   throw new Error('Invalid token');
+ }

🔒 Security Fix: 2 additions, 0 deletions

💡 Vibe Insight:
   Security improvement detected! You're sanitizing user input
   and validating tokens. This prevents injection attacks and
   ensures only valid tokens are processed.

⚡ Impact:
   🔴 Changes affect security-sensitive code

✨ Suggestion:
   • Consider adding rate limiting to prevent brute force attacks
```

### 📋 **Rules Mode** - Your Code, Your Standards

Monitor compliance with your team's guidelines in `CLAUDE.md`:

```
🚨 Rule Violations:
  🔴 Hardcoded API key detected (line 15)
  🟡 Missing error handling in async function (line 23)
  
✅ Good Practices:
  ✓ Using environment variables
  ✓ Proper TypeScript types
  ✓ Following naming conventions
```

### 💬 **Chat Mode** - Ask Anything, Learn Everything

```
You: What's the difference between useMemo and useCallback?

Vibe: Great question! Think of them like this:

🧠 useMemo: Remembers a calculated VALUE
   const expensiveValue = useMemo(() => {
     return calculateSomethingExpensive(a, b);
   }, [a, b]);

🎯 useCallback: Remembers a FUNCTION
   const handleClick = useCallback(() => {
     doSomething(a, b);
   }, [a, b]);

Use useMemo when you need to cache a computation.
Use useCallback when you need to cache a function reference!
```

**Switch modes anytime with `Shift+Tab` ✨**

## 🏆 Why Developers Love Vibe-Code

<table>
<tr>
<td width="33%" valign="top">

### 🎓 Sarah, Jr Developer
*"I learned more in one week with vibe-code than in my last month of tutorials. It's like having a mentor who never gets tired of my questions!"*

</td>
<td width="33%" valign="top">

### 👨‍💻 Mike, Team Lead
*"Cut our code review time in half. Junior devs are committing better code because they're learning as they write it."*

</td>
<td width="33%" valign="top">

### 🚀 Alex, Bootcamp Grad
*"The security warnings alone saved me from shipping vulnerable code. Now I think about security while coding, not after."*

</td>
</tr>
</table>

## 📊 Your Learning Journey

Track your progress with automatic insights:

```
📈 This Week's Vibes:
   • 47 concepts learned
   • 12 security issues prevented
   • 8 performance improvements
   • 156 lines of better code
   
🔥 Current Streak: 7 days
🏆 Badges Earned: Security Guardian, Performance Ninja
```

## 🛠️ Works With Everything

- ✅ **Any Editor**: VS Code, Vim, Sublime, IntelliJ, you name it
- ✅ **Any Language**: JavaScript, Python, Go, Rust, and more
- ✅ **Any Framework**: React, Vue, Angular, Next.js, etc.
- ✅ **Any OS**: Mac, Windows, Linux

## 🎪 Join the Vibe Movement

### 🌟 20,000+ Developers Learning Together

<p align="center">
  <a href="https://discord.gg/vibecode">
    <img src="https://img.shields.io/badge/Join%20Our%20Discord-7B2FFF?style=for-the-badge&logo=discord&logoColor=white" alt="Discord">
  </a>
  <a href="https://twitter.com/vibecode">
    <img src="https://img.shields.io/badge/Follow%20on%20Twitter-FF2E63?style=for-the-badge&logo=twitter&logoColor=white" alt="Twitter">
  </a>
  <a href="https://github.com/shawn14/vibe-code">
    <img src="https://img.shields.io/badge/Star%20on%20GitHub-00FF88?style=for-the-badge&logo=github&logoColor=black" alt="GitHub">
  </a>
</p>

### 🎯 Weekly Community Events

- **Meme Monday**: Best coding memes win vibe-code swag
- **TIL Tuesday**: Share what you learned for a feature shoutout
- **Fix-it Friday**: Live code reviews with the community

### 📚 Learning Resources

- [5-Minute Quick Start](https://vibe-code.dev/quickstart)
- [Concept Library](https://vibe-code.dev/concepts)
- [Custom Rules Guide](https://vibe-code.dev/rules)
- [API Documentation](https://vibe-code.dev/api)

## 🤝 Contributing

We believe in learning together! Check out our [Contributing Guide](CONTRIBUTING.md) to:

- 🐛 Report bugs
- 💡 Suggest features  
- 📖 Improve documentation
- 🎨 Submit new insight patterns

## 🎁 Spread the Vibe

Love vibe-code? Here's how to help it grow:

### ⭐ Star This Repo
Help others discover vibe-code by starring this repository!

### 🐦 Share Your Experience
```
Just discovered @vibecode and my mind is blown 🤯

It caught a security bug in my auth code and explained 
exactly why it was dangerous. It's like having a senior 
dev teaching me while I code!

Start vibing 👉 npx vibe-code

#CodingVibes #LearnInPublic #WebDev
```

### 📹 Create Content
- Write a blog post about your learning journey
- Record a video showing your favorite feature
- Stream yourself coding with vibe-code

Tag us and we'll share it with the community! 💜

## 🚀 The Future is Vibing

### Coming Soon
- 🤝 **Team Sync**: Share insights across your team
- 📱 **Mobile Companion**: Review your daily learnings
- 🧠 **AI Mentor**: Personalized learning paths
- 🌍 **Global Challenges**: Learn with developers worldwide

### Our Mission
Make continuous learning the default state of coding. When every developer is learning while they code, we all write better software.

## 📜 License

MIT © [Vibe-Code Team](https://github.com/shawn14/vibe-code)

---

<p align="center">
  <strong>Ready to level up? 🚀</strong><br><br>
  <code>npx vibe-code</code><br><br>
  <em>Good vibes, better code ✨</em>
</p>