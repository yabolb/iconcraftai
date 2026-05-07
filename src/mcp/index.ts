#!/usr/bin/env node

/**
 * MCP Server entry point script.
 * Executing this file starts the Stdio server.
 */

import { IconCraftMcpServer } from './server.js';

const server = new IconCraftMcpServer();
server.run().catch((error) => {
  console.error('Fatal error running MCP Server:', error);
  process.exit(1);
});
