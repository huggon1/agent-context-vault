---
name: mcp-inspector
description: Debug local MCP servers by inspecting tools, resources, prompts, and request/response payloads.
---

# MCP Inspector

MCP Inspector is a browser-based debugging tool for Model Context Protocol servers. Use it to connect to a local server, inspect exposed capabilities, and test calls without wiring the server into a full client first.

## Common Uses

- Confirm that a server starts with the expected environment variables.
- View available tools, resources, and prompts.
- Send test requests and inspect structured responses.
- Diagnose schema mismatches before integrating with an agent runtime.

## Typical Workflow

Run the inspector:

```bash
npx @modelcontextprotocol/inspector
```

Then configure the server command and arguments in the inspector UI. Start with a simple capability list request, then test one tool call with minimal input before trying a full workflow.
