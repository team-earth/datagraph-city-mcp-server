# Publishing DataGraph MCP Server

This guide explains how to publish the DataGraph MCP server to NPM and the MCP Registry.

## ⚠️ IMPORTANT: Sync Workflow

**DO NOT** publish from this monorepo (`kevinkells/datagraph.city`). The MCP server must be published from the `team-earth/datagraph-city-mcp-server` repository for GitHub OIDC authentication to work correctly.

### Why?
- MCP Registry uses GitHub OIDC to verify organization membership
- OIDC authentication is based on the repository running the workflow
- The workflow must run from `team-earth/*` to publish as `io.github.team-earth/datagraph`

## Overview

**Workflow**: Develop in monorepo → Sync to team-earth → Tag triggers publish

1. ✅ Develop and test in `/home/kkells/datagraph.city/mcp-server/`
2. ✅ Commit changes to kevinkells/datagraph.city
3. ✅ Sync to team-earth/datagraph-city-mcp-server (using git subtree)
4. ✅ Create version tag on team-earth repo
5. ✅ GitHub Actions automatically publishes to NPM + MCP Registry

## Prerequisites

### One-Time Setup (Already Complete ✅)

1. **Git Remote** - `mcp-public` points to team-earth repo
   ```bash
   git remote add mcp-public git@github.com:team-earth/datagraph-city-mcp-server.git
   ```

2. **NPM Token** - `NPM_TOKEN` secret configured in team-earth repo
   - Token created at: https://www.npmjs.com/settings/kevinkells/tokens
   - Added to: https://github.com/team-earth/datagraph-city-mcp-server/settings/secrets/actions

3. **GitHub Org Membership** - Public member of team-earth org
   - Required for MCP Registry OIDC authentication
   - Verified at: https://github.com/orgs/team-earth/people

4. **Sync Script** - `/home/kkells/datagraph.city/scripts/sync-mcp-to-public.sh`

## Publishing a New Version

### Step 1: Develop and Test in Monorepo

```bash
cd /home/kkells/datagraph.city/mcp-server
# Edit files (index.js, package.json, etc.)
# Test locally
node index.js
```

### Step 2: Commit Changes to Monorepo

```bash
cd /home/kkells/datagraph.city
git add mcp-server/
git commit -m "feat: Add new MCP feature"
git push origin main
```

### Step 3: Sync to Team-Earth Repo

**Option A: Using Sync Script (Recommended)**
```bash
cd /home/kkells/datagraph.city
./scripts/sync-mcp-to-public.sh
```

**Option B: Manual Sync**
```bash
cd /home/kkells/datagraph.city
git subtree split --prefix=mcp-server | xargs -I {} git push mcp-public {}:main --force
```

### Step 4: Create and Push Version Tag

```bash
cd /home/kkells/datagraph.city

# For version 1.2.0
git subtree split --prefix=mcp-server | xargs -I {} git push mcp-public {}:refs/tags/v1.2.0
```

**Tag Format:** `v{VERSION}` (e.g., `v1.0.0`, `v1.1.0`, `v2.0.0`)

⚠️ **Note**: Use `v*` not `mcp-v*` for team-earth repo tags!

### Step 5: Monitor the Workflow

1. Go to: https://github.com/team-earth/datagraph-city-mcp-server/actions
2. Watch the "Publish MCP Server" workflow
3. Check that all steps complete successfully

### Step 6: Verify Publication

After the workflow completes:

1. **Check NPM**: https://www.npmjs.com/package/datagraph-city-mcp-server
2. **Check MCP Registry**:
   ```bash
   curl "https://registry.modelcontextprotocol.io/v0/servers?search=datagraph" | jq '.servers[] | select(.server.name == "io.github.team-earth/datagraph")'
   ```
3. **Check GitHub Release**: https://github.com/team-earth/datagraph-city-mcp-server/releases

## Version Numbering

Follow [Semantic Versioning](https://semver.org/):

- **Major** (1.0.0 → 2.0.0): Breaking changes
- **Minor** (1.0.0 → 1.1.0): New features, backwards compatible
- **Patch** (1.0.0 → 1.0.1): Bug fixes

Examples:
```bash
git tag mcp-v1.0.0  # Initial release
git tag mcp-v1.0.1  # Bug fix
git tag mcp-v1.1.0  # New feature
git tag mcp-v2.0.0  # Breaking change
```

## Validation

Before publishing, you can validate your `server.json`:

```bash
cd /root/datagraph.city/mcp-server
.venv/bin/python validate_server_json.py server.json
```

This checks:
- ✅ Valid JSON syntax
- ✅ Matches MCP registry schema
- ✅ All required fields present
- ✅ Field length constraints

## Troubleshooting

### "Authentication failed" in GitHub Actions

**Problem**: MCP Registry authentication fails

**Solution**: 
- Ensure workflow has `id-token: write` permission (already configured)
- Check that repository is public or has proper GitHub OIDC setup

### "Package validation failed" 

**Problem**: MCP Registry can't verify NPM package ownership

**Solution**:
- Verify `mcpName` field exists in `package.json`
- Ensure it matches the name in `server.json`: `io.github.kevinkells/datagraph`
- Wait a few minutes after NPM publish before MCP registry attempts validation

### "npm publish failed"

**Problem**: NPM authentication or package issues

**Solution**:
- Check that `NPM_TOKEN` secret is set correctly
- Ensure package name is available on NPM
- Verify you have permission to publish under that name

### Tag Already Exists

**Problem**: You pushed a tag that already exists

**Solution**:
```bash
# Delete local tag
git tag -d mcp-v1.0.0

# Delete remote tag
git push origin :refs/tags/mcp-v1.0.0

# Create new tag
git tag mcp-v1.0.0
git push origin mcp-v1.0.0
```

## Manual Publishing (Not Recommended)

If you need to publish manually:

### Install MCP Publisher CLI

```bash
# macOS/Linux with Homebrew
brew install mcp-publisher

# Or download binary
curl -L "https://github.com/modelcontextprotocol/registry/releases/latest/download/mcp-publisher_$(uname -s | tr '[:upper:]' '[:lower:]')_$(uname -m | sed 's/x86_64/amd64/;s/aarch64/arm64/').tar.gz" | tar xz mcp-publisher
```

### Publish to NPM

```bash
cd /root/datagraph.city/mcp-server
npm publish
```

### Publish to MCP Registry

```bash
cd /root/datagraph.city/mcp-server

# Login with GitHub
mcp-publisher login github

# Publish
mcp-publisher publish
```

## Files Involved

- `server.json` - MCP Registry metadata
- `package.json` - NPM package metadata (includes `mcpName` field)
- `.github/workflows/publish-mcp.yml` - Automated publishing workflow
- `validate_server_json.py` - Schema validation script

## Next Steps

After publishing:

1. ✅ Update documentation with installation instructions
2. ✅ Announce on social media / Discord
3. ✅ Monitor for user feedback
4. ✅ Plan next release

## Support

- GitHub Issues: https://github.com/kevinkells/datagraph.city/issues
- MCP Registry Docs: https://modelcontextprotocol.io/docs
- NPM Package: https://www.npmjs.com/package/datagraph-mcp-server


