# DataGraph MCP Server

Model Context Protocol server for accessing the DataGraph API from Claude Desktop, ChatGPT, and other MCP-compatible clients.

## Installation

### Via npx (recommended)

```json
{
  "mcpServers": {
    "datagraph": {
      "command": "npx",
      "args": ["-y", "datagraph-city-mcp-server"],
      "env": {
        "DATAGRAPH_API_KEY": "dgc_your_api_key_here"
      }
    }
  }
}
```

### Via local install

```bash
npm install datagraph-city-mcp-server
```

```json
{
  "mcpServers": {
    "datagraph": {
      "command": "node",
      "args": ["/absolute/path/to/node_modules/datagraph-city-mcp-server/index.js"],
      "env": {
        "DATAGRAPH_API_KEY": "dgc_your_api_key_here"
      }
    }
  }
}
```

### Get an API key

Sign up at [datagraph.city](https://datagraph.city) to get your free API key.

---

## Claude Desktop setup

1. Open Claude Desktop config:
   - **macOS:** `~/Library/Application Support/Claude/claude_desktop_config.json`
   - **Windows:** `%APPDATA%\Claude\claude_desktop_config.json`
2. Add the configuration above with your API key
3. Restart Claude Desktop

---

## Example queries

```
"What programs address violence prevention in Kansas City?"
"Show me the obstacles to reducing urban loneliness in NYC"
"Which organizations fund violence prevention in Kansas City?"
"What strategy areas do Kansas City nonprofits work in?"
"Show recent building permits in Manhattan"
"What are property sale prices by borough in NYC?"
```

---

## Available datasets

**Call `list_datasets` first** — it returns exact dataset names and current counts.

| Locality | Dataset | Description |
|----------|---------|-------------|
| `kc` | `kansas-city-violence-prevention` | 450+ programs, 200+ organizations, violence prevention (GOSR) |
| `unlonely-nyc` | `unlonely-nyc` | 7,500+ programs addressing urban loneliness (GOSR) |
| `rust-belt` | `rust-belt-initiatives` | 5,300+ civic infrastructure programs (GOSR) |
| `nyc` | multiple | NYC subway, building permits, property sales, crime, demographics |

### NYC dataset details

| Dataset | Records | Notes |
|---------|---------|-------|
| Subway | 445 stations | MTA lines and locations |
| DOB Permits | 856,480 | Building permits from DOB NOW (March 2021–present) |
| Property Sales | 53,464 | Real estate transactions with prices |
| Crime | 100,000 | NYPD complaints with demographics |
| Demographics | 195 neighborhoods | Population statistics |

---

## GOSR Framework

**Goal-Obstacles-Solutions-Resources (GOSR)** is a participatory problem-structuring method for civic problem-solving. Learn more at [gosr.ai](https://gosr.ai).

| Layer | Role |
|-------|------|
| **Goal** | The aspirational future state for a community (singular) |
| **Obstacles** | Barriers preventing that future — a diagnosis of why the problem persists |
| **Solutions** | Potential strategies to overcome each Obstacle (NOT actual programs) |
| **Resources** | Actual operating programs that implement a Solution in practice |
| **Actors** | Organizations that run Resources |
| **Funders** | Foundations and government agencies that fund Actors |
| **StrategyArea** | Practitioner-defined operational groupings (e.g. Prevention, Intervention) — present in some datasets |
| **Ecosystem** | Governance stakeholders (elected officials, planning bodies) that set policy — present in some datasets |

**Key relationship chain:**
```
(Goal)-[:HAS_OBSTACLE]->(Obstacle)-[:HAS_SOLUTION]->(Solution)
    <-[:IMPLEMENTS]-(Resource)<-[:EXECUTES]-(Actor)<-[:FUNDS]-(Funder)
(Actor)-[:WORKS_IN]->(StrategyArea)
```

**Critical distinctions:**
- Solutions are theoretical/potential interventions — they describe *what could work*
- Resources are real, existing programs currently operating
- Obstacles can have child Solutions (leaf nodes) OR child Obstacles (sub-problems), but not both

**Counting parent vs. leaf Obstacles:**
```cypher
// Parent obstacles (have sub-obstacles)
MATCH (p:Obstacle)-[:HAS_OBSTACLE]->(c:Obstacle)
WHERE p.dataset = 'your-dataset'
RETURN COUNT(DISTINCT p)

// Leaf obstacles (have solutions)
MATCH (p:Obstacle)-[:HAS_OBSTACLE]->(c:Obstacle)
WHERE p.dataset = 'your-dataset'
RETURN COUNT(c)
```

---

## Available tools

| Tool | Description |
|------|-------------|
| `list_datasets` | List all available datasets — **call this first** |
| `get_locality_schema` | Get the full graph schema for a locality — call before writing Cypher |
| `query_locality_data` | Query data using natural language or raw Cypher |
| `explore_locality_data` | Browse available data in a locality |
| `analyze_gosr_dataset` | Analyze a GOSR dataset for civic problem-solving |
| `get_server_info` | Server version and framework reference |
| `get_usage_stats` | Your API usage and quota |

### `query_locality_data` parameters

| Parameter | Required | Description |
|-----------|----------|-------------|
| `query` | Yes | Natural language query or raw Cypher |
| `locality` | No | Locality code, e.g. `kc`, `nyc` (default: `nyc`) |
| `category` | No | Filter by category |
| `limit` | No | Max results (default: 10) |

**Tip:** Call `get_locality_schema` first to understand the graph structure, then write Cypher directly for precise results.

---

## Development

### Test with MCP Inspector

```bash
npx @modelcontextprotocol/inspector node index.js
```

### Debug mode

```bash
DEBUG=* node index.js
```

---

## Troubleshooting

**"API key not found"** — Ensure `DATAGRAPH_API_KEY` is set in your MCP server env config.

**Claude doesn't see the server** — Use absolute paths. Restart Claude Desktop completely after config changes.

**Empty query results** — Use `get_locality_schema` first to understand the graph structure, then write Cypher directly via `query_locality_data`.

**"Command failed"** — Verify Node.js is installed (`node --version`), then test manually: `node index.js`.

---

## Support

- Documentation: [docs.datagraph.city](https://docs.datagraph.city)
- Issues: [github.com/team-earth/datagraph-city-mcp-server/issues](https://github.com/team-earth/datagraph-city-mcp-server/issues)
- Email: support@datagraph.city
