#!/usr/bin/env node

/**
 * DataGraph MCP Server
 * 
 * Model Context Protocol server that provides access to DataGraph API
 * for use with Claude Desktop, ChatGPT, and other MCP-compatible clients.
 * 
 * Available Datasets:
 * - NYC Subway: 445 stations with locations and lines
 * - NYC GOSR (Un-Lonely NYC): 7,514 programs addressing urban loneliness
 * - Kansas City GOSR: 149 violence prevention resources
 * - NYC DOB Permits: 4.8M building permits with locations and work types
 * - NYC PLUTO: 858K property parcels with owner, zoning, building characteristics, and address-to-BBL mappings
 * - NYC Property Sales: 53,464 real estate transactions with prices
 * - NYC Crime Data: 100,000 NYPD complaints with demographics
 * - NYC Demographics: 195 neighborhoods with population statistics
 * 
 * Example Queries:
 * - "Find programs addressing social isolation in NYC"
 * - "Show recent building permits in Manhattan"
 * - "What is the BBL for 552 W 43rd Street?"
 * - "Show property characteristics for a given address"
 * - "What are property sale prices by borough?"
 * - "Show crime statistics for Brooklyn"
 * - "Which neighborhoods have the highest population?"
 */

import { Server } from '@modelcontextprotocol/sdk/server/index.js';
import { StdioServerTransport } from '@modelcontextprotocol/sdk/server/stdio.js';
import {
    CallToolRequestSchema,
    ListToolsRequestSchema,
} from '@modelcontextprotocol/sdk/types.js';
import dotenv from 'dotenv';

dotenv.config();

const API_KEY = process.env.DATAGRAPH_API_KEY;
const API_URL = process.env.DATAGRAPH_API_URL || 'https://api.datagraph.city';

if (!API_KEY) {
    console.error('Error: DATAGRAPH_API_KEY environment variable is required');
    process.exit(1);
}

// Create MCP server
const server = new Server(
    {
        name: 'datagraph',
        version: '1.1.0',
    },
    {
        capabilities: {
            tools: {},
        },
    }
);

// Define available tools
const TOOLS = [
    {
        name: 'get_city_schema',
        description: `Get the Neo4j graph schema for a city. **ALWAYS CALL THIS FIRST** before querying.
        
Returns: node labels, relationships, properties, indexes, sample Cypher queries, and security constraints.

Available NYC datasets: Subway stations, GOSR programs, DOB building permits, property sales, crime data, and demographics.

**RECOMMENDED WORKFLOW:**
1. Call get_city_schema to understand the graph structure
2. Generate Cypher query based on schema
3. Use query_city_data with cypher_query parameter

Why Cypher-first? Natural language parsing is limited and brittle. LLM-generated Cypher from schema is more reliable, expressive, and handles complex queries better.`,
        inputSchema: {
            type: 'object',
            properties: {
                city: {
                    type: 'string',
                    description: 'City code: "nyc" (New York), "kc" (Kansas City), etc. (default: "nyc")',
                    default: 'nyc',
                    enum: ['nyc', 'kc'],
                },
            },
        },
    },
    {
        name: 'query_city_data',
        description: `Execute queries against city data. **BEST PRACTICE: Generate Cypher from schema rather than using natural language.**

**Two modes:**
1. **Cypher (RECOMMENDED)**: Generate Cypher after calling get_city_schema. More reliable and expressive.
2. **Natural Language**: Supports GOSR programs, subway stations, DOB permits, property sales, crime data, demographics.

**Natural Language Examples:**
- "Show building permits in Manhattan"
- "What are recent property sales?"
- "Show crime statistics by borough"
- "Which neighborhoods are most populous?"
- "Find programs addressing social isolation"

**Why Cypher-first?**
- Natural language parser is limited to predefined patterns
- Cypher handles complex queries (multiple filters, aggregations, etc.)
- LLMs are excellent at generating Cypher from schema
- Security validation ensures read-only operations

**Workflow:**
1. Call get_city_schema
2. Generate Cypher based on user question and schema
3. Submit via cypher_query parameter`,
        inputSchema: {
            type: 'object',
            properties: {
                query: {
                    type: 'string',
                    description: 'User question or description. Used for logging and natural language fallback.',
                },
                city: {
                    type: 'string',
                    description: 'City code: "nyc" (New York), "kc" (Kansas City), etc. (default: "nyc")',
                    default: 'nyc',
                    enum: ['nyc', 'kc'],
                },
                cypher_query: {
                    type: 'string',
                    description: 'RECOMMENDED: Cypher query generated from schema. Must be read-only, include LIMIT clause (max 1000). Validated for security before execution.',
                },
                cypher_params: {
                    type: 'object',
                    description: 'Parameters for Cypher query. Use $param syntax in query. Example: {"borough": "M", "lat": 40.7}',
                },
                limit: {
                    type: 'number',
                    description: 'Maximum results for natural language queries (default: 10, max: 100)',
                    default: 10,
                },
            },
            required: ['query'],
        },
    },
    {
        name: 'list_datasets',
        description: `List all available datasets with their node counts and metadata.

**Available Datasets:**

**NYC Property Data:**
- **PLUTO**: Primary Land Use Tax Lot Output - All NYC parcels with address-to-BBL/BIN mappings, ownership, zoning (858K parcels)
- **DOB Permits**: Building permits with work types, costs, locations (4.8M permits)
- **Property Sales**: Real estate transactions with prices and neighborhoods (53K sales)

**NYC Public Safety & Demographics:**
- **Crime Data**: NYPD complaints with offense types and demographics (100K complaints)
- **Demographics**: Neighborhood population statistics (195 NTAs)

**NYC Infrastructure:**
- **Subway**: MTA station data with lines and locations (445 stations)

**GOSR (Goal-Obstacle-Solution-Resource):**
- **NYC Un-Lonely**: Urban loneliness and social isolation programs (7,514 programs)
- **Kansas City**: Violence prevention programs and community resources (149 programs)

Use this to discover civic datasets and their structure before querying.`,
        inputSchema: {
            type: 'object',
            properties: {
                city: {
                    type: 'string',
                    description: 'Filter by city name (optional)',
                },
            },
        },
    },
    {
        name: 'get_usage_stats',
        description: 'Get your API usage statistics and quota information',
        inputSchema: {
            type: 'object',
            properties: {},
        },
    },
];

// List available tools
server.setRequestHandler(ListToolsRequestSchema, async () => {
    return {
        tools: TOOLS,
    };
});

// Handle tool calls
server.setRequestHandler(CallToolRequestSchema, async (request) => {
    const { name, arguments: args } = request.params;

    try {
        switch (name) {
            case 'query_city_data': {
                const { query, city = 'nyc', category, limit = 10, cypher_query, cypher_params } = args;

                const requestBody = { query, category, limit };

                // If Cypher query is provided, include it
                if (cypher_query) {
                    requestBody.cypher_query = cypher_query;
                    if (cypher_params) {
                        requestBody.cypher_params = cypher_params;
                    }
                }

                const response = await fetch(`${API_URL}/api/${city}/query`, {
                    method: 'POST',
                    headers: {
                        'Authorization': `Bearer ${API_KEY}`,
                        'Content-Type': 'application/json',
                    },
                    body: JSON.stringify(requestBody),
                });

                if (!response.ok) {
                    const error = await response.json();
                    throw new Error(error.error || 'Query failed');
                }

                const data = await response.json();

                return {
                    content: [
                        {
                            type: 'text',
                            text: JSON.stringify(data, null, 2),
                        },
                    ],
                };
            }

            case 'get_city_schema': {
                const { city = 'nyc' } = args;

                const response = await fetch(`${API_URL}/api/${city}/schema`, {
                    headers: {
                        'Authorization': `Bearer ${API_KEY}`,
                    },
                });

                if (!response.ok) {
                    throw new Error('Failed to fetch schema');
                }

                const schema = await response.json();

                return {
                    content: [
                        {
                            type: 'text',
                            text: JSON.stringify(schema, null, 2),
                        },
                    ],
                };
            }


            case 'list_datasets': {
                const { city } = args;
                const url = city ? `${API_URL}/datasets?city=${encodeURIComponent(city)}` : `${API_URL}/datasets`;

                const response = await fetch(url, {
                    headers: {
                        'Authorization': `Bearer ${API_KEY}`,
                    },
                });

                if (!response.ok) {
                    throw new Error('Failed to list datasets');
                }

                const datasets = await response.json();

                return {
                    content: [
                        {
                            type: 'text',
                            text: JSON.stringify(datasets, null, 2),
                        },
                    ],
                };
            }

            case 'get_usage_stats': {
                const response = await fetch(`${API_URL}/usage`, {
                    headers: {
                        'Authorization': `Bearer ${API_KEY}`,
                    },
                });

                if (!response.ok) {
                    throw new Error('Failed to get usage stats');
                }

                const stats = await response.json();

                return {
                    content: [
                        {
                            type: 'text',
                            text: JSON.stringify(stats, null, 2),
                        },
                    ],
                };
            }

            default:
                throw new Error(`Unknown tool: ${name}`);
        }
    } catch (error) {
        return {
            content: [
                {
                    type: 'text',
                    text: `Error: ${error.message}`,
                },
            ],
            isError: true,
        };
    }
});

// Start the server
async function main() {
    const transport = new StdioServerTransport();
    await server.connect(transport);
    console.error('DataGraph MCP server running on stdio');
}

main().catch((error) => {
    console.error('Server error:', error);
    process.exit(1);
});

