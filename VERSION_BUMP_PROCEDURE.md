# MCP Server Version Bump Procedure

## ⚠️ CRITICAL: Three Files Must Be Updated

When bumping the MCP server version, you **MUST** update **THREE** files, not just two.

### The Three Files

1. **`mcp-server/package.json`**
   - Line 3: `"version": "X.Y.Z"`

2. **`mcp-server/index.js`**
   - Server constructor: `version: 'X.Y.Z'`

3. **`mcp-server/server.json`** ⚠️ **OFTEN FORGOTTEN**
   - Line 6: `"version": "X.Y.Z"`
   - Line 23: `"version": "X.Y.Z"` (in packages array)

## Why All Three?

Different systems read different files:

| System | File Used | What Fails If Wrong |
|--------|-----------|---------------------|
| npm | `package.json` | npm publish fails |
| MCP clients (Claude) | `index.js` Server constructor | Wrong version shown to users |
| MCP Registry | `server.json` | Registry publish fails with "duplicate version" |

## What Went Wrong (Nov 30, 2025)

### The Error
```
Publishing version: 1.2.3
✅ npm publish succeeded (reads package.json)
❌ MCP Registry publish failed: "invalid version: cannot publish duplicate version"
```

### Root Cause
- We updated `package.json` → 1.2.3 ✅
- We updated `index.js` → 1.2.3 ✅
- We forgot `server.json` → still 1.2.1 ❌

Result:
- npm saw 1.2.3 and published successfully
- MCP Registry saw 1.2.1 and rejected it as duplicate

## Correct Procedure

### 1. Update All Three Files

```bash
cd /home/kkells/datagraph.city/mcp-server

# Update package.json
# Change: "version": "1.2.3" → "1.2.4"

# Update index.js
# Change: version: '1.2.3' → version: '1.2.4'

# Update server.json (TWO places!)
# Line 6:  "version": "1.2.3" → "1.2.4"
# Line 23: "version": "1.2.3" → "1.2.4"
```

### 2. Commit to Main Repo

```bash
cd /home/kkells/datagraph.city
git add mcp-server/
git commit -m "feat: Bump MCP server to v1.2.4

- Update package.json version
- Update index.js Server constructor version
- Update server.json version (both locations)"
git push origin main
```

### 3. Sync to Public Repo

```bash
cd /home/kkells/datagraph.city
./scripts/sync-mcp-to-public.sh
# Type 'y' when prompted
```

### 4. Tag and Push

```bash
cd /home/kkells/datagraph-city-mcp-server
git pull
git tag v1.2.4
git push origin v1.2.4
```

### 5. Verify GitHub Actions

Watch the publish workflow:
https://github.com/team-earth/datagraph-city-mcp-server/actions

Both should succeed:
- ✅ npm publish
- ✅ MCP Registry publish

## Verification Checklist

Before pushing a version tag, verify:

```bash
cd /home/kkells/datagraph-city-mcp-server

# All three should show the SAME version:
grep '"version"' package.json        # Should show X.Y.Z
grep 'version:' index.js             # Should show X.Y.Z
grep '"version"' server.json         # Should show X.Y.Z (appears twice)
```

If any mismatch, DO NOT push the tag. Fix the files first.

## Quick Version Check Command

```bash
cd /home/kkells/datagraph.city/mcp-server
echo "package.json: $(grep -m1 '"version"' package.json | cut -d'"' -f4)"
echo "index.js:     $(grep -m1 "version: '" index.js | cut -d"'" -f2)"
echo "server.json:  $(grep -m1 '"version"' server.json | cut -d'"' -f4)"
```

All three should output the same version number.

## For LLMs Reading This

When the user asks you to bump the MCP server version:

1. **ASK YOURSELF**: Did I update all THREE files?
   - package.json ✓
   - index.js ✓
   - server.json ✓ (TWO places)

2. **USE SEARCH AND REPLACE** with `replace_all: true` for server.json to catch both instances

3. **VERIFY** before committing:
   ```bash
   grep '"version"' mcp-server/package.json mcp-server/server.json
   grep 'version:' mcp-server/index.js
   ```

## History

- **Nov 30, 2025**: Documented after v1.2.3 publish failure due to missing server.json update
- Issue: MCP Registry reads server.json, not package.json
- Solution: Always update all three files in lockstep

