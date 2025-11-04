#!/bin/bash

# SchemaCraft AI - Git Push Script
# This script commits and pushes changes to GitHub

echo "🚀 SchemaCraft AI - Git Push"
echo "=============================="
echo ""

# Check if there are changes
if [[ -z $(git status -s) ]]; then
    echo "✅ No changes to commit"
    exit 0
fi

# Show status
echo "📋 Current changes:"
git status -s
echo ""

# Ask for commit message
read -p "💬 Enter commit message (or press Enter for default): " commit_msg

# Use default message if none provided
if [ -z "$commit_msg" ]; then
    commit_msg="Update SchemaCraft AI"
fi

# Add all changes
echo ""
echo "📦 Adding changes..."
git add .

# Commit
echo "💾 Committing changes..."
git commit -m "$commit_msg"

# Push to GitHub
echo "⬆️  Pushing to GitHub..."
git push

# Check if push was successful
if [ $? -eq 0 ]; then
    echo ""
    echo "✅ Successfully pushed to GitHub!"
    echo "🌐 Repository: https://github.com/Juan-Cwq/DBMS"
else
    echo ""
    echo "❌ Push failed. Please check your connection and try again."
    exit 1
fi
