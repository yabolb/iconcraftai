/**
 * MCP Server — Entry point for the Model Context Protocol.
 */

import { Server } from '@modelcontextprotocol/sdk/server/index.js';
import { StdioServerTransport } from '@modelcontextprotocol/sdk/server/stdio.js';
import {
  CallToolRequestSchema,
  ListToolsRequestSchema,
} from '@modelcontextprotocol/sdk/types.js';
import { TRANSFORM_TOOL_NAME, transformToolDefinition, executeTransformTool } from './tools.js';

export class IconCraftMcpServer {
  private server: Server;

  constructor() {
    this.server = new Server(
      {
        name: 'iconcraft-ai-engine',
        version: '1.0.0',
      },
      {
        capabilities: {
          tools: {},
        },
      }
    );

    this.setupHandlers();
  }

  private setupHandlers() {
    // 1. List Tools
    this.server.setRequestHandler(ListToolsRequestSchema, async () => {
      return {
        tools: [transformToolDefinition],
      };
    });

    // 2. Call Tool
    this.server.setRequestHandler(CallToolRequestSchema, async (request) => {
      if (request.params.name === TRANSFORM_TOOL_NAME) {
        return await executeTransformTool(request.params.arguments);
      }

      throw new Error(`Tool not found: ${request.params.name}`);
    });
  }

  /**
   * Start the server using stdio transport (required for MCP in Claude).
   */
  async run() {
    const transport = new StdioServerTransport();
    await this.server.connect(transport);
    console.error('IconCraft AI MCP Server running on stdio');
  }
}
