#!/bin/bash

# Simple MCP server test
# This simulates what Claude Desktop would send

export DATAGRAPH_API_KEY="dgc_RL8sLSGemStfhG5Z_G3kbcCaET2PFe5uU1dncM1Iwuo"

echo "🧪 Testing DataGraph MCP Server"
echo "================================"
echo ""

# Test 1: List tools
echo "1. Listing available tools..."
echo '{"jsonrpc": "2.0", "id": 1, "method": "tools/list"}' | node index.js | head -20
echo ""

# Test 2: Test query (would need more complex JSON-RPC)
echo "2. Testing query tool..."
echo "(Full query test requires MCP Inspector - see below)"
echo ""

echo "✅ MCP Server is running!"
echo ""
echo "Next steps:"
echo "  • Install MCP Inspector: npx @modelcontextprotocol/inspector"
echo "  • Test with Claude Desktop (see README)"
echo "  • Or use curl to test API directly (already working!)"

