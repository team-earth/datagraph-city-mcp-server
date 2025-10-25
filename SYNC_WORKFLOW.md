# MCP Server Sync Workflow

## Overview

**Develop** in this monorepo → **Sync** to public repo → **Publish** to NPM

- **Source**: `/root/datagraph.city/mcp-server/` (private monorepo)
- **Published**: `team-earth/datagraph-city-mcp-server` (public repo → NPM)
- **Sync method**: Git subtree (automated, no manual copying)

## Workflow

### 1. Develop in Monorepo

```bash
cd /root/datagraph.city/mcp-server
# Edit index.js, package.json, etc.
# Test locally
```

### 2. Commit Changes

```bash
cd /root/datagraph.city
git add mcp-server/
git commit -m "feat: Add new MCP feature"
git push origin main
```

### 3. Sync to Public Repo

```bash
cd /root/datagraph.city
./scripts/sync-mcp-to-public.sh
```

This script:
- ✅ Checks for uncommitted changes
- ✅ Shows what will be synced
- ✅ Asks for confirmation
- ✅ Uses `git subtree push` to sync

### 4. Publish New Version

```bash
# Pull the synced changes
cd /root/datagraph-city-mcp-server
git pull

# Bump version and publish
npm version patch  # or minor/major
git push origin main --tags

# GitHub Actions automatically publishes to NPM
```

## How Git Subtree Works

```
Monorepo (private):
  /root/datagraph.city/
    ├── api/
    ├── frontend/
    └── mcp-server/          ← Source of truth
          ├── index.js
          ├── package.json
          └── README.md

                 ↓ git subtree push

Public Repo:
  team-earth/datagraph-city-mcp-server/
    ├── index.js             ← Same files, synced
    ├── package.json
    └── README.md
```

**Key point**: The `mcp-server/` directory in monorepo becomes the **root** of the public repo.

## Manual Sync (Alternative)

If the script doesn't work, you can manually sync:

```bash
cd /root/datagraph.city
git subtree push --prefix=mcp-server mcp-public main
```

Where:
- `--prefix=mcp-server` = directory to sync
- `mcp-public` = remote name (points to public repo)
- `main` = branch to push to

## Troubleshooting

### Error: "Working tree has modifications"
```bash
cd /root/datagraph.city
git status mcp-server/
# Commit any changes first
git add mcp-server/
git commit -m "Update MCP server"
```

### Error: "Updates were rejected"
```bash
# Pull changes from public repo first
cd /root/datagraph-city-mcp-server
git pull
git push

# Then retry sync
cd /root/datagraph.city
./scripts/sync-mcp-to-public.sh
```

### Verify Sync Worked
```bash
# Check public repo
cd /root/datagraph-city-mcp-server
git pull
git log --oneline -5

# Compare files
diff /root/datagraph.city/mcp-server/index.js \
     /root/datagraph-city-mcp-server/index.js
```

## Git Remote Setup

The monorepo has two remotes:

```bash
cd /root/datagraph.city
git remote -v

# Output:
# origin      https://github.com/kevinkells/datagraph.city.git (private)
# mcp-public  https://github.com/team-earth/datagraph-city-mcp-server.git (public)
```

This was set up with:
```bash
git remote add mcp-public https://github.com/team-earth/datagraph-city-mcp-server.git
```

## Advantages of This Approach

✅ **Single source of truth**: Develop in monorepo  
✅ **No manual copying**: Git handles sync  
✅ **History preserved**: Commits flow to public repo  
✅ **Private by default**: Only MCP code is public  
✅ **Simple workflow**: One script to sync  

## Example: Adding Un-Lonely NYC Support

```bash
# 1. Update MCP in monorepo
cd /root/datagraph.city/mcp-server
# Edit index.js to add NYC GOSR examples

# 2. Commit
cd /root/datagraph.city
git add mcp-server/
git commit -m "feat: Add Un-Lonely NYC GOSR dataset examples"
git push origin main

# 3. Sync to public
./scripts/sync-mcp-to-public.sh

# 4. Publish new version
cd /root/datagraph-city-mcp-server
git pull
npm version minor  # v1.0.0 → v1.1.0
git push origin main --tags
# GitHub Actions publishes to NPM automatically
```

## Quick Reference

| Task | Command |
|------|---------|
| Develop | Edit `/root/datagraph.city/mcp-server/` |
| Test locally | `cd /root/datagraph.city/mcp-server && node index.js` |
| Commit | `cd /root/datagraph.city && git commit -am "..."` |
| Sync | `./scripts/sync-mcp-to-public.sh` |
| Publish | `cd /root/datagraph-city-mcp-server && npm version patch` |

## Status

✅ **Setup Complete**: Git subtree configured  
✅ **Sync Script**: Available at `/root/datagraph.city/scripts/sync-mcp-to-public.sh`  
✅ **Remote Added**: `mcp-public` points to public repo  
⏳ **Ready to Use**: Run sync script whenever you update MCP  

