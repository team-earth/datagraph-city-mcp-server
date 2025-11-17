# Claude Desktop Setup for DataGraph MCP

**Status:** ✅ Tested and working (October 18, 2025)

---

## Prerequisites

- Windows 10/11 with WSL2 (Ubuntu)
- Node.js installed on Windows
- Claude Desktop installed on Windows
- DataGraph MCP server code in WSL at `/home/kkells/datagraph.city/mcp-server/`

---

## Setup Steps

### 1. Install Node.js on Windows

Download from: https://nodejs.org/  
Version tested: v22.20.0

### 2. Install Claude Desktop on Windows

Download from: https://claude.ai/download

### 3. Configure Claude Desktop

**Config file location:**
```
C:\Users\<YourUsername>\AppData\Roaming\Claude\claude_desktop_config.json
```

**Config content (Option 1 - Using wsl command):**
```json
{
  "mcpServers": {
    "datagraph": {
      "command": "wsl",
      "args": [
        "-d",
        "Ubuntu",
        "/home/kkells/datagraph.city/mcp-server/index.js"
      ],
      "env": {
        "DATAGRAPH_API_KEY": "dgc_Og_CVPG3qL0JFDvuru1zNUWfYLZBPGPmfIVAXMZRrEo",
        "DATAGRAPH_API_URL": "https://api.datagraph.city"
      }
    }
  }
}
```

**Config content (Option 2 - Using Windows node):**
```json
{
  "mcpServers": {
    "datagraph": {
      "command": "node",
      "args": [
        "\\\\wsl$\\Ubuntu\\home\\kkells\\datagraph.city\\mcp-server\\index.js"
      ],
      "env": {
        "DATAGRAPH_API_KEY": "dgc_Og_CVPG3qL0JFDvuru1zNUWfYLZBPGPmfIVAXMZRrEo",
        "DATAGRAPH_API_URL": "https://api.datagraph.city"
      }
    }
  }
}
```

**Notes:**
- **Option 1 (Recommended)**: Uses `wsl` command to run in WSL environment with Linux paths
- **Option 2**: Uses Windows Node.js with `\\wsl$\Ubuntu\...` UNC path
- Replace API key if using a different account
- Path must match your actual WSL username (change `kkells` if different)

### 4. Restart Claude Desktop

Completely close and reopen Claude Desktop for changes to take effect.

### 5. Verify Connection

In Claude Desktop:
1. Go to Settings (gear icon)
2. Click "Developer" in left sidebar
3. Under "Local MCP servers" you should see:
   - **datagraph** with status **running** (blue badge)

---

## Testing

Ask Claude:
```
Using DataGraph, list 5 subway stations in Manhattan
```

**Expected result:**  
Claude should query your DataGraph API and return real NYC subway station data including:
- Station names
- Subway lines served
- Accessibility information
- Borough

---

## Troubleshooting

### MCP Server Not Listed

**Problem:** "No servers added" in Claude Desktop  
**Solution:** Make sure config file is in the correct location: `%APPDATA%\Claude\claude_desktop_config.json`

### Server Shows Error

**Check logs in Claude Desktop:**
1. Settings → Developer
2. Click on the datagraph server
3. Look for error messages in logs

**Common issues:**
- Node.js not installed on Windows
- Wrong WSL path (check if your distribution is named "Ubuntu")
- Invalid API key
- WSL not running

### Path Issues

**If your WSL distribution has a different name:**
```
\\wsl$\<DistributionName>\home\kkells\datagraph.city\mcp-server\index.js
```

Check distribution name: `wsl -l` in PowerShell

---

## Architecture

```
┌─────────────────────────────────────┐
│         Windows (Host OS)           │
│                                     │
│  ┌─────────────────────────────┐  │
│  │   Claude Desktop (GUI)       │  │
│  └──────────┬──────────────────┘  │
│             │                      │
│             ↓                      │
│  ┌─────────────────────────────┐  │
│  │   Node.js (Windows)          │  │
│  │   - Executes MCP server      │  │
│  └──────────┬──────────────────┘  │
│             │ via \\wsl$\ path     │
└─────────────┼─────────────────────┘
              │
              ↓
┌─────────────────────────────────────┐
│          WSL (Ubuntu)                │
│                                     │
│  ┌─────────────────────────────┐  │
│  │  MCP Server Code             │  │
│  │  mcp-server/index.js         │  │
│  └──────────┬──────────────────┘  │
│             │                      │
│             ↓                      │
│  ┌─────────────────────────────┐  │
│  │  Production API              │  │
│  │  api.datagraph.city          │  │
│  └─────────────────────────────┘  │
└─────────────────────────────────────┘
```

---

## Test Results (October 18, 2025)

**Query:** "Using DataGraph, list 5 subway stations in Manhattan"

**Results:**
1. **1 Av** - L line (accessible)
2. **103 St** - 6 line
3. **14 St-Union Sq** - N, Q, R, W lines (accessible)
4. **125 St** - 4, 5, 6 lines (accessible)
5. **34 St-Penn Station** - A, C, E lines (accessible)

**Total:** 50 Manhattan stations found

**Status:** ✅ Working perfectly!

---

## Production Info

- **API Endpoint:** https://api.datagraph.city
- **MCP Server Status:** Running in Claude Desktop
- **Rate Limiting:** 5 requests/min (free tier), enforced via Redis
- **Data Source:** Neo4j database on Fly.io
- **Dataset:** 445 NYC subway stations with accessibility and connectivity data

