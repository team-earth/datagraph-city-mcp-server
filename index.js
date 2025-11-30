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
 * Available Datasets (by locality code):
 * 
 * Locality: 'nyc' (New York City - General Data)
 * - NYC Subway: 445 stations with locations and lines
 * - NYC DOB Permits: 4.8M building permits with locations and work types
 * - NYC PLUTO: 858K property parcels with owner, zoning, building characteristics, and address-to-BBL mappings
 * - NYC Property Sales: 53,464 real estate transactions with prices
 * - NYC Crime Data: 100,000 NYPD complaints with demographics
 * - NYC Demographics: 195 neighborhoods with population statistics
 * 
 * Locality: 'unlonely-nyc' (Un-Lonely NYC - GOSR Loneliness Programs)
 * - Dataset: unlonely-nyc
 * - 7,514 Resources (actual programs) addressing urban loneliness
 * - GOSR Framework: 1 Goal, multiple Obstacles, Solutions, Resources, and Actors
 * 
 * Locality: 'kc' (Kansas City - GOSR Violence Prevention)
 * - Dataset: kansas-city-violence-prevention
 * - 149 Resources (violence prevention programs) run by 81 Actors
 * - GOSR Framework: Goals, Obstacles, Solutions, Resources, and Actors
 * 
 * Locality: 'rust-belt' (Western Pennsylvania - GOSR Civic Infrastructure)
 * - Dataset: rust-belt-initiatives
 * - 5,368 Resources (civic programs) addressing community infrastructure
 * - GOSR Framework: 8 Goals covering gathering spaces, economic development, etc.
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
        version: '1.2.3',
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
        name: 'get_city_schema',
        description: `Get the Neo4j graph schema for a city. **ALWAYS CALL THIS FIRST** before querying.
        
Returns: node labels, relationships, properties, indexes, sample Cypher queries, and security constraints.

Available NYC datasets: Subway stations, GOSR programs, DOB building permits, PLUTO property data, property sales, crime data, and demographics.

**RECOMMENDED WORKFLOW:**
1. Call get_city_schema to understand the graph structure
2. Generate Cypher query based on schema
3. Use query_city_data with cypher_query parameter

**ADDRESS LOOKUP PATTERN (CRITICAL):**
When querying by address, ALWAYS use PLUTO as the lookup table:

1. PLUTO stores addresses in format: "123 STREET NAME" (all caps, no street type suffix)
2. Use CONTAINS for flexible matching: WHERE p.address CONTAINS '552' AND p.address CONTAINS 'WEST 43'
3. PLUTO returns BBL (Borough-Block-Lot identifier)
4. Use BBL to join with DOBPermit, PropertySale, or other datasets

Example query:
MATCH (pluto:PLUTOParcel) WHERE pluto.address CONTAINS '552' AND pluto.address CONTAINS 'WEST 43' 
WITH pluto.bbl as bbl
MATCH (permit:DOBPermit) WHERE permit.bbl = bbl
RETURN permit

Why? PLUTO has 100% address coverage (858K parcels). Other datasets use BBL for joins.

Why Cypher-first? Natural language parsing is limited and brittle. LLM-generated Cypher from schema is more reliable, expressive, and handles complex queries better.`,
        inputSchema: {
            type: 'object',
            properties: {
                city: {
                    type: 'string',
                    description: 'Locality code (REQUIRED): "nyc" (NYC general), "kc" (Kansas City), "rust-belt" (Western PA), "unlonely-nyc" (NYC loneliness programs)',
                    enum: ['nyc', 'kc', 'rust-belt', 'unlonely-nyc'],
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

**ADDRESS QUERIES - CRITICAL PATTERN:**
For any address-based queries ("permits at 123 Main St"), use PLUTO first:

Address Format in PLUTO: "NUMBER STREET NAME" (uppercase, e.g., "552 WEST 43 STREET")
- Use CONTAINS for flexible matching: WHERE p.address CONTAINS '552' AND p.address CONTAINS 'WEST 43'
- Include borough filter when known: AND p.borough = 'MN' (Manhattan)
- PLUTO returns BBL (10-digit Borough-Block-Lot ID)
- Join to other datasets via BBL

Example:
MATCH (p:PLUTOParcel) WHERE p.address CONTAINS 'street number' AND p.address CONTAINS 'street name'
WITH p.bbl as bbl, p.address as address
MATCH (permit:DOBPermit) WHERE permit.bbl = bbl
RETURN address, bbl, collect(permit)[0..10]

Why? Only 18% of DOB permits have addresses; PLUTO provides universal address→BBL mapping.

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
                    description: 'Locality code (REQUIRED): "nyc" (NYC general), "kc" (Kansas City), "rust-belt" (Western PA), "unlonely-nyc" (NYC loneliness programs)',
                    enum: ['nyc', 'kc', 'rust-belt', 'unlonely-nyc'],
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

**GOSR - ALWAYS SPELL AS: Goal-Obstacles-Solutions-Resources**
Framework: Goal (singular aspirational future), Obstacles (plural barriers), Solutions (plural potential strategies if implemented, NOT actual programs), Resources (plural actual programs currently operating), Actors (organizations running Resources, in model but not in acronym)

- **NYC Un-Lonely**: 7,514 Resources (actual programs addressing loneliness), mapped to Solutions and Obstacles
- **Kansas City**: 149 Resources (violence prevention programs) run by 81 Actors

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

// Define available prompts
const PROMPTS = [
    {
        name: 'explore_city_data',
        description: 'Guided workflow to explore urban data: list cities, view schema, and query data',
        arguments: [
            {
                name: 'city',
                description: 'City code (default: "nyc")',
                required: false,
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
                name: 'city',
                description: 'City code (default: "nyc")',
                required: false,
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
        case 'explore_city_data': {
            const city = args?.city;
            if (!city) {
                throw new Error('city argument is required. Choose from: nyc, kc, rust-belt, unlonely-nyc');
            }
            return {
                messages: [
                    {
                        role: 'user',
                        content: {
                            type: 'text',
                            text: `I want to explore urban data for ${city}. Let's start by:
1. Listing available cities and their datasets
2. Getting the graph schema for ${city}
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
            const city = args?.city;
            const user_question = args?.user_question;
            
            if (!city) {
                throw new Error('city argument is required. Choose from: nyc, kc, rust-belt, unlonely-nyc');
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
                            text: `I want to query ${city} data to answer: "${user_question}"

Please help me:
1. Get the graph schema for ${city}
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
                const city = uri.split('/').pop();
                const response = await fetch(`${API_URL}/api/${city}/schema`, {
                    headers: {
                        'Authorization': `Bearer ${API_KEY}`,
                    },
                });

                if (!response.ok) {
                    throw new Error(`Failed to fetch schema for ${city}`);
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

            case 'query_city_data': {
                const { query, city, category, limit = 10, cypher_query, cypher_params } = args;
                
                if (!city) {
                    throw new Error('city parameter is required. Choose from: nyc, kc, rust-belt, unlonely-nyc');
                }

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
                const { city } = args;
                
                if (!city) {
                    throw new Error('city parameter is required. Choose from: nyc, kc, rust-belt, unlonely-nyc');
                }

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

