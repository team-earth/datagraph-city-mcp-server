# Setup Instructions for DataGraph MCP Server

## Creating the GitHub Repository

### Step 1: Create Repository on GitHub

1. Go to: https://github.com/organizations/team-earth/repositories/new
2. Repository name: `datagraph-city-mcp-server`
3. Description: `Urban intelligence knowledge graph. MCP server for structured city data.`
4. **Visibility: Public** ⚠️ (Required for GitHub OIDC authentication with MCP Registry)
5. **DO NOT** initialize with README, .gitignore, or license (we already have these)
6. Click "Create repository"

### Step 2: Push Code to GitHub

```bash
cd /root/datagraph-city-mcp-server

# Add the remote
git remote add origin https://github.com/team-earth/datagraph-city-mcp-server.git

# Push the code
git push -u origin main
```

### Step 3: Configure NPM Token Secret

1. Go to: https://www.npmjs.com/settings/YOUR_USERNAME/tokens
2. Click "Generate New Token" → "Classic Token"
3. Token type: "Automation"
4. Copy the token

5. Add to GitHub Secrets:
   - Go to: https://github.com/team-earth/datagraph-city-mcp-server/settings/secrets/actions
   - Click "New repository secret"
   - Name: `NPM_TOKEN`
   - Value: Paste your NPM token
   - Click "Add secret"

### Step 4: Verify Repository Settings

Ensure these settings in your GitHub repo:

1. **Actions** are enabled:
   - Go to: Settings → Actions → General
   - Allow all actions and reusable workflows

2. **Workflow permissions**:
   - Go to: Settings → Actions → General → Workflow permissions
   - Select "Read and write permissions"
   - Check "Allow GitHub Actions to create and approve pull requests"

## Publishing Your First Release

Once the repository is set up:

```bash
cd /root/datagraph-city-mcp-server

# Create and push a version tag
git tag v1.0.0
git push origin v1.0.0
```

This will trigger the automated workflow to:
- ✅ Publish to NPM
- ✅ Publish to MCP Registry
- ✅ Create a GitHub Release

## Monitoring

Watch the workflow at:
https://github.com/team-earth/datagraph-city-mcp-server/actions

## Verification

After publishing, verify:

1. **NPM Package**: https://www.npmjs.com/package/datagraph-mcp-server
2. **MCP Registry**:
   ```bash
   curl "https://registry.modelcontextprotocol.io/v0/servers?search=io.github.team-earth/datagraph"
   ```
3. **GitHub Release**: https://github.com/team-earth/datagraph-city-mcp-server/releases

## Troubleshooting

If the workflow fails:
1. Check that `NPM_TOKEN` secret is set correctly
2. Ensure repository is public (required for OIDC)
3. Check workflow logs for specific errors
4. See PUBLISHING.md for detailed troubleshooting guide

## Next Steps

- Update CHANGELOG.md with release notes
- Announce on social media
- Share with the community
- Monitor for user feedback

