# Publishing DataGraph MCP Server

This guide explains how to publish the DataGraph MCP server to NPM and the MCP Registry.

## Overview

The publishing process is **fully automated** via GitHub Actions. When you push a version tag, the workflow will:

1. ✅ Update version numbers in `package.json` and `server.json`
2. ✅ Run tests (if any)
3. ✅ Publish to NPM
4. ✅ Publish to MCP Registry (using GitHub OIDC)
5. ✅ Create a GitHub Release

## Prerequisites

### One-Time Setup

1. **NPM Token** (for publishing to NPM)
   ```bash
   # Login to NPM
   npm login
   
   # Create an automation token
   # Go to: https://www.npmjs.com/settings/YOUR_USERNAME/tokens
   # Create a new "Automation" token
   ```

2. **Add NPM Token to GitHub Secrets**
   - Go to: `https://github.com/kevinkells/datagraph.city/settings/secrets/actions`
   - Click "New repository secret"
   - Name: `NPM_TOKEN`
   - Value: Your NPM automation token

3. **No MCP Registry Setup Needed!**
   - GitHub Actions OIDC authentication is automatic
   - No manual login or tokens required

## Publishing a New Version

### Step 1: Prepare Your Changes

Make sure all your changes are committed:

```bash
cd /root/datagraph.city/mcp-server
git add .
git commit -m "Prepare for v1.0.0 release"
git push origin main
```

### Step 2: Create and Push a Version Tag

```bash
# For version 1.0.0
git tag mcp-v1.0.0

# Push the tag (this triggers the workflow)
git push origin mcp-v1.0.0
```

**Tag Format:** `mcp-v{VERSION}` (e.g., `mcp-v1.0.0`, `mcp-v1.1.0`, `mcp-v2.0.0`)

### Step 3: Monitor the Workflow

1. Go to: https://github.com/kevinkells/datagraph.city/actions
2. Watch the "Publish MCP Server" workflow
3. Check that all steps complete successfully

### Step 4: Verify Publication

After the workflow completes:

1. **Check NPM**: https://www.npmjs.com/package/datagraph-mcp-server
2. **Check MCP Registry**:
   ```bash
   curl "https://registry.modelcontextprotocol.io/v0/servers?search=io.github.kevinkells/datagraph"
   ```
3. **Check GitHub Release**: https://github.com/kevinkells/datagraph.city/releases

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


