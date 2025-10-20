#!/usr/bin/env python3
"""
Validate server.json against the MCP registry schema
"""

import json
import sys
import requests
from jsonschema import validate, ValidationError, SchemaError

def validate_server_json(server_json_path):
    """Validate server.json against the official MCP schema"""
    
    # Read server.json
    try:
        with open(server_json_path, 'r') as f:
            server_data = json.load(f)
    except FileNotFoundError:
        print(f"❌ Error: {server_json_path} not found")
        return False
    except json.JSONDecodeError as e:
        print(f"❌ Error: Invalid JSON in {server_json_path}: {e}")
        return False
    
    # Get schema URL from server.json
    schema_url = server_data.get('$schema')
    if not schema_url:
        print("❌ Error: No $schema field found in server.json")
        return False
    
    print(f"📋 Fetching schema from: {schema_url}")
    
    # Download schema
    try:
        response = requests.get(schema_url, timeout=10)
        response.raise_for_status()
        schema = response.json()
    except requests.RequestException as e:
        print(f"❌ Error fetching schema: {e}")
        return False
    except json.JSONDecodeError as e:
        print(f"❌ Error parsing schema JSON: {e}")
        return False
    
    # Validate
    try:
        validate(instance=server_data, schema=schema)
        print("✅ server.json is valid!")
        print(f"\n📦 Server Details:")
        print(f"   Name: {server_data.get('name')}")
        print(f"   Title: {server_data.get('title')}")
        print(f"   Version: {server_data.get('version')}")
        print(f"   Description: {server_data.get('description')}")
        
        if 'packages' in server_data:
            print(f"\n📦 Packages:")
            for pkg in server_data['packages']:
                print(f"   - {pkg.get('registryType')}: {pkg.get('identifier')} v{pkg.get('version')}")
        
        if 'remotes' in server_data:
            print(f"\n🌐 Remotes:")
            for remote in server_data['remotes']:
                print(f"   - {remote.get('type')}: {remote.get('url')}")
        
        return True
        
    except ValidationError as e:
        print(f"❌ Validation Error:")
        print(f"   Path: {' -> '.join(str(p) for p in e.path)}")
        print(f"   Message: {e.message}")
        if e.context:
            print(f"   Context: {e.context}")
        return False
    except SchemaError as e:
        print(f"❌ Schema Error: {e}")
        return False

if __name__ == "__main__":
    server_json_path = sys.argv[1] if len(sys.argv) > 1 else "server.json"
    success = validate_server_json(server_json_path)
    sys.exit(0 if success else 1)

