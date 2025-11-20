# Changelog

All notable changes to the DataGraph MCP Server will be documented in this file.

## [1.2.0] - 2025-11-19

### Added
- **NYC Urban Datasets**: Full integration of 5 major NYC datasets
  - DOB Building Permits (31,001 records from DOB NOW system)
  - Property Sales (53,464 real estate transactions)
  - Crime Data (100,000 NYPD complaints with demographics)
  - Demographics (195 neighborhood tabulation areas)
  - PLUTO Property Data (complete NYC property information)
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
