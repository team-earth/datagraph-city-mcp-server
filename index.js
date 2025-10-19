#!/usr/bin/env node

/**
 * DataGraph MCP Server
 * 
 * Model Context Protocol server that provides access to DataGraph API
 * for use with Claude Desktop, ChatGPT, and other MCP-compatible clients.
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
        version: '1.0.0',
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
        name: 'query_city_data',
        description: 'Query urban data using natural language OR direct Cypher queries. Natural language is translated automatically. For complex queries, you can generate Cypher directly after fetching schema via get_city_schema.',
        inputSchema: {
            type: 'object',
            properties: {
                query: {
                    type: 'string',
                    description: 'Natural language query (e.g., "Stations south of Houston") or description of the Cypher query',
                },
                city: {
                    type: 'string',
                    description: 'City code (default: "nyc")',
                    default: 'nyc',
                },
                category: {
                    type: 'string',
                    description: 'Optional category filter',
                },
                limit: {
                    type: 'number',
                    description: 'Maximum number of results (default: 10, max: 100)',
                    default: 10,
                },
                cypher_query: {
                    type: 'string',
                    description: 'Optional: Direct Cypher query for complex operations. If provided, bypasses natural language translation. Must be read-only and include LIMIT clause. Use get_city_schema first to understand graph structure.',
                },
                cypher_params: {
                    type: 'object',
                    description: 'Optional: Parameters for the Cypher query ($param references). Example: {"borough": "M", "lat": 40.7}',
                },
            },
            required: ['query'],
        },
    },
    {
        name: 'get_city_schema',
        description: 'Get the Neo4j graph schema for a city including node labels, relationships, properties, indexes, sample queries, and security constraints. ALWAYS call this before generating Cypher queries.',
        inputSchema: {
            type: 'object',
            properties: {
                city: {
                    type: 'string',
                    description: 'City code (default: "nyc")',
                    default: 'nyc',
                },
            },
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
                        'X-API-Key': API_KEY,
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
                        'X-API-Key': API_KEY,
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
                        'X-API-Key': API_KEY,
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

            case 'get_usage_stats': {
                const response = await fetch(`${API_URL}/usage`, {
                    headers: {
                        'X-API-Key': API_KEY,
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

