#!/usr/bin/env node

/**
 * Quick test to verify MCP server can call production API
 */

const API_KEY = process.env.DATAGRAPH_API_KEY || 'dgc_RL8sLSGemStfhG5Z_G3kbcCaET2PFe5uU1dncM1Iwuo';
const API_URL = 'https://api.datagraph.city';

async function testAPIConnection() {
    console.log('Testing DataGraph API connection...\n');
    
    // Test 1: Health check
    console.log('1. Testing health endpoint...');
    try {
        const healthResponse = await fetch(`${API_URL}/health`);
        const healthData = await healthResponse.json();
        console.log('   ✅ Health check:', healthData);
    } catch (error) {
        console.log('   ❌ Health check failed:', error.message);
        return;
    }
    
    // Test 2: Query endpoint
    console.log('\n2. Testing query endpoint...');
    try {
        const queryResponse = await fetch(`${API_URL}/api/nyc/query`, {
            method: 'POST',
            headers: {
                'Authorization': `Bearer ${API_KEY}`,
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({
                query: 'List all subway stations in Manhattan',
                category: 'transit',
                limit: 5
            })
        });
        
        if (!queryResponse.ok) {
            const error = await queryResponse.json();
            console.log('   ❌ Query failed:', error);
            return;
        }
        
        const queryData = await queryResponse.json();
        console.log('   ✅ Query successful!');
        console.log('   Results count:', queryData.results.length);
        console.log('   First result:', queryData.results[0]);
        console.log('\n   Full response:', JSON.stringify(queryData, null, 2));
    } catch (error) {
        console.log('   ❌ Query failed:', error.message);
        return;
    }
    
    console.log('\n✅ All tests passed! MCP server can communicate with production API.');
}

testAPIConnection();

