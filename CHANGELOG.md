# Changelog

All notable changes to the DataGraph MCP Server will be documented in this file.

## [1.4.0] - 2026-03-30

### Changed
- **GOSR framework documentation**: Added Funder, StrategyArea, and Ecosystem layer descriptions to file header, `list_datasets` tool description, and `get_server_info` response
  - Funder: foundations/agencies that FUND Actors
  - StrategyArea: practitioner groupings (WORKS_IN) — distinct from Solutions
  - Ecosystem: governance stakeholders (SETS_POLICY, FUNDS, WORKS_IN)
- **README rewrite**: Fully updated for public audiences
  - Correct npx package name (`datagraph-city-mcp-server`)
  - Updated KC dataset counts (450+ programs, 200+ organizations)
  - Added NYC dataset detail table with record counts
  - Added tool parameter documentation for `query_locality_data`
  - Restored GOSR critical distinctions and Obstacle counting Cypher examples
  - Added MCP Inspector development/testing instructions

## [1.2.0] - 2025-11-19

### Added
- **NYC Urban Datasets**: Full integration of 5 major NYC datasets
  - DOB Building Permits (4,806,614 permits across 445,923 buildings)
  - Property Sales (53,464 real estate transactions)
  - Crime Data (100,000 NYPD complaints with demographics)
  - Demographics (195 neighborhood tabulation areas)
  - PLUTO Property Data (859,284 tax lot parcels with 505,869 property owners)
- **Total Production Dataset**: 6.9M+ interconnected nodes
- **PLUTO Integration**: Address-to-BBL (Borough-Block-Lot) lookup system
  - Critical for cross-referencing properties across datasets
  - Enables address-based queries with 100% coverage (vs 18% for DOB permits alone)
- **Enhanced Query Guidance**: Specific address format instructions for optimal PLUTO lookups
  - Format: 'NUMBER STREET NAME' (uppercase, e.g., '552 WEST 43 STREET')
  - CONTAINS-based matching for flexibility

### Changed
- **Simplified Tools**: Removed `list_cities` tool (redundant, data accessible via queries)
- **Updated Descriptions**: Tool descriptions now accurately reflect all available datasets

### Documentation
- Added comprehensive address lookup pattern guidance
- Updated dataset documentation to reflect actual data sources (DOB NOW: rbx6-tga4, 856K total records)

## [1.1.6] - 2025-10-25

### Fixed
- MCP Registry publication via GitHub OIDC authentication
- Correct package naming in monorepo workflow

## [1.1.0] - 2025-10-25

### Added
- Initial MCP Registry publication
- GOSR framework support for NYC Un-Lonely programs and KC violence prevention

## [1.0.0] - 2025-10-20

### Added
- Initial release with NYC Subway data
- Natural language query support
- Direct Cypher query capability
