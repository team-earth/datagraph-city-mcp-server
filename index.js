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
 * 
 * Example Queries:
 * - "Find programs addressing social isolation in NYC"
 * - "Show violence prevention resources in Kansas City"
 * - "List organizations running the most programs in NYC"
 * - "Find geocoded community programs near me"
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
2. **Natural Language (FALLBACK)**: Simple queries only. Limited patterns. Brittle.

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
        name: 'list_cities',
        description: 'List all supported cities and their available datasets',
        inputSchema: {
            type: 'object',
            properties: {},
        },
    },
    {
        name: 'list_datasets',
        description: `List all available GOSR (Goal-Obstacle-Solution-Resource) datasets with their node counts and metadata.

**Available GOSR Datasets:**
- **Kansas City** (kc): Violence prevention programs and community resources
- **New York City** (nyc): Un-Lonely NYC - Urban loneliness and social isolation programs

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

            case 'list_cities': {
                const response = await fetch(`${API_URL}/cities`, {
                    headers: {
                        'Authorization': `Bearer ${API_KEY}`,
                    },
                });

                if (!response.ok) {
                    throw new Error('Failed to list cities');
                }

                const cities = await response.json();

                return {
                    content: [
                        {
                            type: 'text',
                            text: JSON.stringify(cities, null, 2),
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

