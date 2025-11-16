# DataGraph MCP Server

Model Context Protocol server for accessing DataGraph API from Claude Desktop, ChatGPT, and other MCP-compatible clients.

## Installation

### 1. Install Dependencies

```bash
cd mcp-server
npm install
```

### 2. Configure API Key

Create `.env` file:
```bash
cp .env.example .env
# Edit .env and add your API key
```

Or set environment variable:
```bash
export DATAGRAPH_API_KEY="dgc_your_key_here"
```

### 3. Test Locally

```bash
npm start
```

## Using with Claude Desktop

### Configure Claude Desktop

Edit your Claude Desktop config file:

**macOS:** `~/Library/Application Support/Claude/claude_desktop_config.json`
**Windows:** `%APPDATA%\Claude\claude_desktop_config.json`

Add this configuration:

```json
{
  "mcpServers": {
    "datagraph": {
      "command": "node",
      "args": [
        "/absolute/path/to/mcp-server/index.js"
      ],
      "env": {
        "DATAGRAPH_API_KEY": "dgc_your_api_key_here"
      }
    }
  }
}
```

**Or use npx (easier):**

```json
{
  "mcpServers": {
    "datagraph": {
      "command": "npx",
      "args": [
        "-y",
        "datagraph-mcp-server"
      ],
      "env": {
        "DATAGRAPH_API_KEY": "dgc_your_api_key_here"
      }
    }
  }
}
```

### Restart Claude Desktop

Restart Claude Desktop for changes to take effect.

## Example Usage in Claude

Once configured, you can ask Claude:

```
"Using DataGraph, show me recent building permits in Manhattan"

"What are property sale prices by borough in NYC?"

"Show crime statistics for Brooklyn"

"Which NYC neighborhoods have the highest population?"

"Find programs addressing social isolation in NYC"

"What cities are available in DataGraph?"
```

Claude will automatically use the DataGraph MCP server to query the data.

## Available Datasets

**New York City (nyc):**
- **Subway**: 445 MTA stations with lines and locations
- **GOSR (Un-Lonely NYC)**: 7,514 programs addressing urban loneliness
- **DOB Permits**: 856,480 building permits from DOB NOW (March 2021-present)
  - Source: NYC Open Data `rbx6-tga4` - DOB NOW: Build - Approved Permits
  - Includes work types, costs, dates, applicants, owners, building details
- **Property Sales**: 53,464 real estate transactions with prices
- **Crime Data**: 100,000 NYPD complaints with demographics
- **Demographics**: 195 neighborhoods with population statistics

**Kansas City (kc):**
- **GOSR**: 149 violence prevention and community resources

## Available Tools

### `query_city_data`

Query urban data using natural language.

**Parameters:**
- `query` (required): Natural language query
- `city` (optional): City code (default: "nyc")
- `category` (optional): Filter by category
- `limit` (optional): Max results (default: 10)

**Example:**
```json
{
  "query": "Properties under $800K in Brooklyn",
  "city": "nyc",
  "limit": 5
}
```

### `list_cities`

List all supported cities and their datasets.

### `get_usage_stats`

Get your API usage statistics and quota.

## Development

### Test with MCP Inspector

```bash
npx @modelcontextprotocol/inspector node index.js
```

### Debug Mode

```bash
DEBUG=* npm start
```

## Publishing to NPM (Optional)

To publish as an npm package:

```bash
# 1. Update package.json with your details
# 2. Login to npm
npm login

# 3. Publish
npm publish
```

Then users can install with:
```bash
npx datagraph-mcp-server
```

## Troubleshooting

### "API key not found" error

Make sure your `.env` file exists with correct API key:
```bash
DATAGRAPH_API_KEY=dgc_your_key_here
```

### Claude doesn't see the server

1. Check config file path is correct
2. Use absolute paths, not relative
3. Restart Claude Desktop completely
4. Check Claude Desktop logs for errors

### "Command failed" error

1. Make sure Node.js is installed (`node --version`)
2. Run `npm install` in mcp-server directory
3. Test manually: `node index.js`

## Support

- Documentation: https://docs.datagraph.city/mcp
- Issues: https://github.com/yourusername/datagraph/issues
- Email: support@datagraph.city

