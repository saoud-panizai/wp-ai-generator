# 🔒 Security Guidelines

## ⚠️ NEVER Commit API Keys to Git!

API keys and secrets should **NEVER** be committed to your repository, even private ones.

## ✅ Proper Secret Management

### **For Cloudflare Workers Secrets:**

Use Wrangler's secret management:

```bash
# Set secrets (encrypted, never in code)
npx wrangler secret put GOOGLE_API_KEY
npx wrangler secret put GROQ_API_KEY
npx wrangler secret put OPENROUTER_API_KEY

# List configured secrets (doesn't show values)
npx wrangler secret list

# Delete a secret
npx wrangler secret delete SECRET_NAME
```

### **For Local Development:**

Create `.dev.vars` (already in .gitignore):

```bash
# .dev.vars (NEVER commit this file!)
GOOGLE_API_KEY=your-key-here
GROQ_API_KEY=your-key-here
OPENROUTER_API_KEY=your-key-here
```

Then use in local dev:
```bash
npm run dev
```

## 🚨 If You Accidentally Expose a Key:

1. **Immediately rotate the key** at the provider's website
2. **Remove from Git history** (if public repo)
3. **Update all applications** using the old key
4. **Set as Cloudflare secret** (never in code)

## 📋 API Key Providers:

### Google Gemini
- Get key: https://aistudio.google.com/app/apikey
- Free tier: 15 requests/minute
- Set: `npx wrangler secret put GOOGLE_API_KEY`

### Groq (Optional)
- Get key: https://console.groq.com/
- Free tier: Very generous
- Set: `npx wrangler secret put GROQ_API_KEY`

### OpenRouter (Optional - for Qwen3)
- Get key: https://openrouter.ai/keys
- Free tier: 1M tokens/day
- Set: `npx wrangler secret put OPENROUTER_API_KEY`

## ✅ Security Checklist:

- [ ] API keys stored as Cloudflare secrets
- [ ] `.gitignore` includes `.env*` and `.dev.vars*`
- [ ] No hardcoded keys in code files
- [ ] No keys in commit messages
- [ ] Test files with keys are gitignored
- [ ] Documentation doesn't include real keys

## 🔍 Checking for Exposed Keys:

```bash
# Search current files for potential keys
git grep -i "api[_-]key"
git grep -i "sk-"
git grep -i "password"

# Check Git history (use carefully)
git log -p | grep -i "sk-"
```

## 🛡️ Best Practices:

1. ✅ **Use environment variables** - Never hardcode
2. ✅ **Use Cloudflare secrets** - For production
3. ✅ **Use .dev.vars** - For local development
4. ✅ **Rotate keys regularly** - Every 3-6 months
5. ✅ **Use different keys** - Dev vs Production
6. ❌ **Never commit** - Keys, tokens, passwords
7. ❌ **Never log** - Don't console.log() keys
8. ❌ **Never share** - In chat, email, screenshots

## 📚 Resources:

- [Cloudflare Workers Secrets](https://developers.cloudflare.com/workers/configuration/secrets/)
- [GitHub Secret Scanning](https://docs.github.com/en/code-security/secret-scanning)
- [OWASP API Security](https://owasp.org/www-project-api-security/)

---

**Remember:** Exposed keys can lead to:
- 💸 Unexpected API costs
- 🔓 Unauthorized access
- 📊 Data breaches
- ⚠️ Service abuse

**Always keep your keys secret!** 🔒

