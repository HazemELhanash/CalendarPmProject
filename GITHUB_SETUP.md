# 🔐 GitHub Setup Guide

## Prerequisites
- Git installed ([Download Git](https://git-scm.com/download/win))
- GitHub account ([Create GitHub Account](https://github.com/signup))
- GitHub CLI (optional, for easier authentication)

## Step-by-Step Instructions

### Step 1: Create a New Repository on GitHub

1. Go to [GitHub](https://github.com) and log in
2. Click the **+** icon in the top right → **New repository**
3. Repository name: `CalendarFlow` (or your preferred name)
4. Description: `A modern calendar app with project management capabilities`
5. Choose **Public** or **Private**
6. **Do NOT** initialize with README, .gitignore, or license (we have these)
7. Click **Create repository**

### Step 2: Configure Git (First Time Only)

Run these commands in PowerShell:

```powershell
git config --global user.name "Your Name"
git config --global user.email "your.email@example.com"
```

### Step 3: Push to GitHub

Replace `YOUR_USERNAME` and `YOUR_REPO_NAME` with your actual values:

```powershell
cd "d:\Hazem\Recent Project\CalendarFlow"

# Initialize git (if not already done)
git init

# Add all files
git add .

# Create initial commit
git commit -m "Initial commit: CalendarFlow - Project Management Calendar App

- Month, Week, Day calendar views
- Task management with priority, status, and assignments
- Project filtering and organization
- Dark mode support
- Drag and drop event rescheduling
- Recurring events support"

# Add remote repository
git remote add origin https://github.com/YOUR_USERNAME/YOUR_REPO_NAME.git

# Rename branch to main
git branch -M main

# Push to GitHub
git push -u origin main
```

### Step 4: Verify Upload

1. Go to your GitHub repository URL: `https://github.com/YOUR_USERNAME/YOUR_REPO_NAME`
2. Verify all files are present
3. Check that README.md is displayed

## 🔑 Authentication Methods

### Method 1: Personal Access Token (Recommended)
1. GitHub → Settings → Developer settings → Personal access tokens
2. Click **Generate new token**
3. Name: `CalendarFlow`
4. Select scopes: `repo` (full control)
5. Copy the token
6. When git asks for password, paste the token

### Method 2: SSH Key
1. Generate SSH key:
   ```powershell
   ssh-keygen -t ed25519 -C "your.email@example.com"
   ```
2. Add to GitHub: Settings → SSH and GPG keys → New SSH key
3. Use SSH URL: `git@github.com:YOUR_USERNAME/YOUR_REPO_NAME.git`

### Method 3: GitHub CLI (Easiest)
```powershell
# Install GitHub CLI from https://cli.github.com/
# Then authenticate
gh auth login

# Follow the prompts
```

## 📤 Making Updates

After making changes locally:

```powershell
cd "d:\Hazem\Recent Project\CalendarFlow"

# Stage changes
git add .

# Commit
git commit -m "Description of changes"

# Push to GitHub
git push
```

## 📋 Common Commands

```powershell
# Check status
git status

# View commit history
git log

# See differences
git diff

# Undo last commit (keep changes)
git reset --soft HEAD~1

# Undo last commit (discard changes)
git reset --hard HEAD~1
```

## 🐛 Troubleshooting

### "fatal: not a git repository"
```powershell
cd "d:\Hazem\Recent Project\CalendarFlow"
git init
```

### "permission denied" or "authentication failed"
- Use Personal Access Token instead of password
- Or set up SSH keys

### "fatal: remote origin already exists"
```powershell
git remote remove origin
git remote add origin https://github.com/YOUR_USERNAME/YOUR_REPO_NAME.git
```

### Need to force push (use carefully!)
```powershell
git push -f origin main
```

## ✅ Verification Checklist

- [ ] Git installed and configured
- [ ] Repository created on GitHub
- [ ] .gitignore file present
- [ ] README.md created
- [ ] Initial commit made
- [ ] Remote origin added
- [ ] First push successful
- [ ] Files visible on GitHub

## 📞 Support

If you need help with Git or GitHub, refer to:
- [Git Documentation](https://git-scm.com/doc)
- [GitHub Docs](https://docs.github.com)
- [GitHub Learning Lab](https://lab.github.com/)

---

Good luck with your CalendarFlow project! 🚀
