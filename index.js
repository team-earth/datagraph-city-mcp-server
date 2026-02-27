#!/usr/bin/env node

/**
 * DataGraph MCP Server
 * 
 * Model Context Protocol server that provides access to DataGraph API
 * for use with Claude Desktop, ChatGPT, and other MCP-compatible clients.
 * 
 * GOSR Framework - ALWAYS SPELL AS: Goal-Obstacles-Solutions-Resources
 * (Note: Goal is singular, Obstacles/Solutions/Resources are PLURAL)
 * 
 * - Goal: A single aspirational future picture (singular)
 * - Obstacles: Barriers preventing the goal (plural - what stands in the way)
 * - Solutions: POTENTIAL strategies to overcome obstacles if implemented (plural - not actual programs)
 * - Resources: ACTUAL programs/initiatives currently operating (plural)
 * - Actors: Organizations running the Resources (not in GOSR acronym but critical to the model)
 * 
 * Localities are discovered dynamically via the list_datasets tool.
 * Always call list_datasets first to see available locality codes and datasets.
 */

import { Server } from '@modelcontextprotocol/sdk/server/index.js';
import { StdioServerTransport } from '@modelcontextprotocol/sdk/server/stdio.js';
import {
    CallToolRequestSchema,
    ListToolsRequestSchema,
    ListPromptsRequestSchema,
    GetPromptRequestSchema,
    ListResourcesRequestSchema,
    ReadResourceRequestSchema,
} from '@modelcontextprotocol/sdk/types.js';
import dotenv from 'dotenv';
import { readFileSync } from 'fs';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);
const packageJson = JSON.parse(readFileSync(join(__dirname, 'package.json'), 'utf-8'));

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
        version: '1.3.0',
    },
    {
        capabilities: {
            tools: {},
            prompts: {},
            resources: {},
        },
    }
);

// Define available tools
const TOOLS = [
    {
        name: 'get_server_info',
        description: 'Get DataGraph MCP server version and metadata information',
        inputSchema: {
            type: 'object',
            properties: {},
        },
    },
    {
        name: 'get_locality_schema',
        description: `Get the Neo4j graph schema for a locality. **ALWAYS CALL THIS FIRST** before querying.
        
Returns: node labels, relationships, properties, indexes, sample Cypher queries, and security constraints.

**RECOMMENDED WORKFLOW:**
1. Call list_datasets to discover available localities and datasets
2. Call get_locality_schema with the locality code
3. Generate Cypher query based on schema
4. Use query_locality_data with cypher_query parameter

Why Cypher-first? Natural language parsing is limited and brittle. LLM-generated Cypher from schema is more reliable, expressive, and handles complex queries better.`,
        inputSchema: {
            type: 'object',
            properties: {
                locality: {
                    type: 'string',
                    description: 'Locality code (REQUIRED). Call list_datasets to discover available codes.',
                },
            },
            required: ['locality'],
        },
    },
    {
        name: 'query_locality_data',
        description: `Execute queries against locality data. **BEST PRACTICE: Generate Cypher from schema rather than using natural language.**

**Two modes:**
1. **Cypher (RECOMMENDED)**: Generate Cypher after calling get_locality_schema. More reliable and expressive.
2. **Natural Language**: Fallback for simple queries.

**Workflow:**
1. Call list_datasets to discover localities
2. Call get_locality_schema to understand the graph
3. Generate Cypher based on user question and schema
4. Submit via cypher_query parameter`,
        inputSchema: {
            type: 'object',
            properties: {
                query: {
                    type: 'string',
                    description: 'User question or description. Used for logging and natural language fallback.',
                },
                locality: {
                    type: 'string',
                    description: 'Locality code (REQUIRED). Call list_datasets to discover available codes.',
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
        description: `List all available datasets with their locality codes, node counts, and metadata.

**CALL THIS FIRST** to discover available localities and datasets before querying.

Returns each dataset's locality code, name, node counts (Goals, Obstacles, Solutions, Resources, Actors, Locations), and suggested Cypher queries.

GOSR Framework — ALWAYS SPELL AS: Goal-Obstacles-Solutions-Resources
- Goal (singular aspirational future)
- Obstacles (plural barriers)
- Solutions (plural potential strategies if implemented, NOT actual programs)
- Resources (plural actual programs currently operating)
- Actors (organizations running Resources, in model but not in GOSR acronym)`,
        inputSchema: {
            type: 'object',
            properties: {
                locality: {
                    type: 'string',
                    description: 'Filter by locality code (optional)',
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

// Define available prompts
const PROMPTS = [
    {
        name: 'explore_locality_data',
        description: 'Guided workflow to explore urban data: list localities, view schema, and query data',
        arguments: [
            {
                name: 'locality',
                description: 'Locality code. Call list_datasets to discover available codes.',
                required: true,
            },
        ],
    },
    {
        name: 'analyze_gosr_dataset',
        description: 'Analyze a GOSR (Goal-Obstacles-Solutions-Resources) dataset for civic problem-solving',
        arguments: [
            {
                name: 'dataset',
                description: 'Dataset name (e.g., "Un-Lonely NYC", "Kansas City Violence Prevention")',
                required: true,
            },
            {
                name: 'focus',
                description: 'Specific focus area (e.g., "social isolation", "community programs", "violence prevention")',
                required: false,
            },
        ],
    },
    {
        name: 'cypher_query_builder',
        description: 'Step-by-step guide to build a Cypher query from schema',
        arguments: [
            {
                name: 'locality',
                description: 'Locality code. Call list_datasets to discover available codes.',
                required: true,
            },
            {
                name: 'user_question',
                description: 'What you want to find out',
                required: true,
            },
        ],
    },
];

// Define available resources
const RESOURCES = [
    {
        uri: 'datagraph://cities/list',
        name: 'Available Cities',
        description: 'List of all cities with available datasets',
        mimeType: 'application/json',
    },
    {
        uri: 'datagraph://datasets/gosr',
        name: 'GOSR Datasets',
        description: 'All Goal-Obstacles-Solutions-Resources datasets for civic problem-solving',
        mimeType: 'application/json',
    },
    {
        uri: 'datagraph://schema/nyc',
        name: 'NYC Graph Schema',
        description: 'Neo4j graph schema for New York City data',
        mimeType: 'application/json',
    },
    {
        uri: 'datagraph://schema/kc',
        name: 'Kansas City Graph Schema',
        description: 'Neo4j graph schema for Kansas City data',
        mimeType: 'application/json',
    },
    {
        uri: 'datagraph://usage/stats',
        name: 'API Usage Statistics',
        description: 'Your current API usage and quota information',
        mimeType: 'application/json',
    },
];

// List available tools
server.setRequestHandler(ListToolsRequestSchema, async () => {
    return {
        tools: TOOLS,
    };
});

// List available prompts
server.setRequestHandler(ListPromptsRequestSchema, async () => {
    return {
        prompts: PROMPTS,
    };
});

// Handle prompt requests
server.setRequestHandler(GetPromptRequestSchema, async (request) => {
    const { name, arguments: args } = request.params;

    switch (name) {
        case 'explore_locality_data': {
            const locality = args?.locality;
                if (!locality) {
                    throw new Error('locality argument is required. Call list_datasets to discover available locality codes.');
                }
            return {
                messages: [
                    {
                        role: 'user',
                        content: {
                            type: 'text',
                            text: `I want to explore urban data for ${locality}. Let's start by:
1. Listing available localities and their datasets
2. Getting the graph schema for ${locality}
3. Understanding what kinds of questions I can ask

Please guide me through this process.`,
                        },
                    },
                ],
            };
        }

        case 'analyze_gosr_dataset': {
            const dataset = args?.dataset;
            const focus = args?.focus || 'general overview';
            
            if (!dataset) {
                throw new Error('dataset argument is required');
            }

            return {
                messages: [
                    {
                        role: 'user',
                        content: {
                            type: 'text',
                            text: `I want to analyze the "${dataset}" GOSR dataset, focusing on: ${focus}.

Please help me:
1. List available GOSR datasets to confirm this one exists
2. Get the schema to understand the data structure
3. Query for relevant Goals, Obstacles, Solutions, and Resources
4. Summarize key insights and patterns

Use the GOSR framework (gosr.ai) to structure the analysis.`,
                        },
                    },
                ],
            };
        }

        case 'cypher_query_builder': {
            const locality = args?.locality;
            const user_question = args?.user_question;
            
            if (!locality) {
                    throw new Error('locality argument is required. Call list_datasets to discover available locality codes.');
                }
            if (!user_question) {
                throw new Error('user_question argument is required');
            }

            return {
                messages: [
                    {
                        role: 'user',
                        content: {
                            type: 'text',
                            text: `I want to query ${locality} data to answer: "${user_question}"

Please help me:
1. Get the graph schema for ${locality}
2. Understand what node labels and relationships are available
3. Generate an appropriate Cypher query based on my question
4. Execute the query and interpret the results

Remember to include LIMIT clauses and ensure read-only operations.`,
                        },
                    },
                ],
            };
        }

        default:
            throw new Error(`Unknown prompt: ${name}`);
    }
});

// List available resources
server.setRequestHandler(ListResourcesRequestSchema, async () => {
    return {
        resources: RESOURCES,
    };
});

// Handle resource reads
server.setRequestHandler(ReadResourceRequestSchema, async (request) => {
    const { uri } = request.params;

    try {
        switch (uri) {
            case 'datagraph://cities/list': {
                const response = await fetch(`${API_URL}/cities`, {
                    headers: {
                        'Authorization': `Bearer ${API_KEY}`,
                    },
                });

                if (!response.ok) {
                    throw new Error('Failed to fetch cities');
                }

                const cities = await response.json();

                return {
                    contents: [
                        {
                            uri,
                            mimeType: 'application/json',
                            text: JSON.stringify(cities, null, 2),
                        },
                    ],
                };
            }

            case 'datagraph://datasets/gosr': {
                const response = await fetch(`${API_URL}/datasets`, {
                    headers: {
                        'Authorization': `Bearer ${API_KEY}`,
                    },
                });

                if (!response.ok) {
                    throw new Error('Failed to fetch datasets');
                }

                const datasets = await response.json();

                return {
                    contents: [
                        {
                            uri,
                            mimeType: 'application/json',
                            text: JSON.stringify(datasets, null, 2),
                        },
                    ],
                };
            }

            case 'datagraph://schema/nyc':
            case 'datagraph://schema/kc': {
                const locality = uri.split('/').pop();
                const response = await fetch(`${API_URL}/api/${locality}/schema`, {
                    headers: {
                        'Authorization': `Bearer ${API_KEY}`,
                    },
                });

                if (!response.ok) {
                    throw new Error(`Failed to fetch schema for ${locality}`);
                }

                const schema = await response.json();

                return {
                    contents: [
                        {
                            uri,
                            mimeType: 'application/json',
                            text: JSON.stringify(schema, null, 2),
                        },
                    ],
                };
            }

            case 'datagraph://usage/stats': {
                const response = await fetch(`${API_URL}/usage`, {
                    headers: {
                        'Authorization': `Bearer ${API_KEY}`,
                    },
                });

                if (!response.ok) {
                    throw new Error('Failed to fetch usage stats');
                }

                const stats = await response.json();

                return {
                    contents: [
                        {
                            uri,
                            mimeType: 'application/json',
                            text: JSON.stringify(stats, null, 2),
                        },
                    ],
                };
            }

            default:
                throw new Error(`Unknown resource: ${uri}`);
        }
    } catch (error) {
        throw new Error(`Failed to read resource ${uri}: ${error.message}`);
    }
});

// Handle tool calls
server.setRequestHandler(CallToolRequestSchema, async (request) => {
    const { name, arguments: args } = request.params;

    try {
        switch (name) {
            case 'get_server_info': {
                return {
                    content: [
                        {
                            type: 'text',
                            text: JSON.stringify({
                                name: packageJson.name,
                                version: packageJson.version,
                                description: packageJson.description,
                                homepage: packageJson.homepage,
                                repository: packageJson.repository.url,
                                gosr_framework: {
                                    spelling: "ALWAYS: Goal-Obstacles-Solutions-Resources (Goal singular, rest plural)",
                                    goal: "A single aspirational future picture (singular)",
                                    obstacles: "Barriers preventing the goal (plural)",
                                    solutions: "POTENTIAL strategies to overcome obstacles if implemented (plural - NOT actual programs)",
                                    resources: "ACTUAL programs/initiatives currently operating (plural)",
                                    actors: "Organizations running the Resources (in model but not in GOSR acronym)"
                                }
                            }, null, 2),
                        },
                    ],
                };
            }

            case 'query_locality_data': {
                const { query, locality, category, limit = 10, cypher_query, cypher_params } = args;
                
                if (!locality) {
                    throw new Error('locality parameter is required. Call list_datasets to discover available locality codes.');
                }

                const requestBody = { query, category, limit };

                // If Cypher query is provided, include it
                if (cypher_query) {
                    requestBody.cypher_query = cypher_query;
                    if (cypher_params) {
                        requestBody.cypher_params = cypher_params;
                    }
                }

                const response = await fetch(`${API_URL}/api/${locality}/query`, {
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

            case 'get_locality_schema': {
                const { locality } = args;
                
                if (!locality) {
                    throw new Error('locality parameter is required. Call list_datasets to discover available locality codes.');
                }

                const response = await fetch(`${API_URL}/api/${locality}/schema`, {
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
                const { locality } = args;
                const url = locality ? `${API_URL}/datasets?locality=${encodeURIComponent(locality)}` : `${API_URL}/datasets`;

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

