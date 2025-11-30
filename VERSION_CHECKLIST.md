# Version Bump Checklist

Use this checklist every time you bump the MCP server version.

## Pre-Flight Check

Current version to bump from: `_______` → New version: `_______`

## Step 1: Update Three Files ⚠️ CRITICAL

- [ ] **package.json** (Line 3)
  ```json
  "version": "X.Y.Z"
  ```

- [ ] **index.js** (Server constructor, ~Line 64)
  ```javascript
  version: 'X.Y.Z'
  ```

- [ ] **server.json** (Lines 6 AND 23) ⚠️ TWO PLACES
  ```json
  "version": "X.Y.Z"
  ```

## Step 2: Verify Version Consistency

Run this command and confirm all three show the SAME version:

```bash
cd /home/kkells/datagraph.city/mcp-server
echo "package.json: $(grep -m1 '"version"' package.json | cut -d'"' -f4)"
echo "index.js:     $(grep -m1 "version: '" index.js | cut -d"'" -f2)"
echo "server.json:  $(grep -m1 '"version"' server.json | cut -d'"' -f4)"
```

- [ ] All three files show the same version number

## Step 3: Commit to Main Repo

```bash
cd /home/kkells/datagraph.city
git add mcp-server/
git commit -m "feat: Bump MCP server to vX.Y.Z

- Update package.json version
- Update index.js Server constructor version  
- Update server.json version (both locations)

[Brief description of what changed]"
git push origin main
```

- [ ] Committed to main repo
- [ ] Pushed to origin

## Step 4: Sync to Public Repo

```bash
cd /home/kkells/datagraph.city
./scripts/sync-mcp-to-public.sh
# Type 'y' when prompted
```

- [ ] Synced to team-earth/datagraph-city-mcp-server

## Step 5: Tag and Push

```bash
cd /home/kkells/datagraph-city-mcp-server
git pull
git tag vX.Y.Z
git push origin vX.Y.Z
```

- [ ] Tag created
- [ ] Tag pushed to GitHub

## Step 6: Monitor GitHub Actions

Open: https://github.com/team-earth/datagraph-city-mcp-server/actions

Watch for both:
- [ ] ✅ npm publish succeeded
- [ ] ✅ MCP Registry publish succeeded

## Step 7: Verify Publication

- [ ] NPM: https://www.npmjs.com/package/datagraph-city-mcp-server shows new version
- [ ] Test installation: `npx datagraph-city-mcp-server@latest` works

## If Publish Fails

### "duplicate version" error from MCP Registry?

**Cause:** You forgot to update `server.json`

**Fix:**
1. Update `server.json` to correct version
2. Commit and push to main repo
3. Sync to public repo
4. Delete and recreate the tag:
   ```bash
   cd /home/kkells/datagraph-city-mcp-server
   git pull
   git tag -d vX.Y.Z
   git push origin :refs/tags/vX.Y.Z
   git tag vX.Y.Z
   git push origin vX.Y.Z
   ```

### npm publish failed?

**Cause:** Wrong `package.json` version or permissions issue

**Fix:** Check NPM_TOKEN secret in GitHub repo settings

## Success Criteria

✅ All checks passed
✅ GitHub Actions workflow completed successfully
✅ Package visible on npm
✅ Can install with `npx datagraph-city-mcp-server`

## Done!

Update this line in PUBLISHING.md:
```
## ✅ Last Successful Publish: vX.Y.Z (Date)
```

