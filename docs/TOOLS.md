# [Q]uantelix Tools API Reference

## Creating a Tool

Every tool is a `ToolDefinition` object:

```typescript
import { ToolDefinition, ToolContext, ToolOutput } from "../core/types";

export const myTool: ToolDefinition = {
  name: "my_tool",
  description: "What this tool does",
  category: "my_category",
  tags: ["tag1", "tag2"],
  input_schema: {
    type: "object",
    properties: {
      input: { type: "string", description: "Input parameter" },
    },
    required: ["input"],
  },
  permissions: {
    filesystem: ["**"],   // Glob patterns for allowed paths
    network: true,        // Allow network access
    env: ["MY_API_KEY"],  // Required env vars
  },
  async execute(args: Record<string, any>, ctx: ToolContext): Promise<ToolOutput> {
    // Your logic here
    return { success: true, data: "result" };
  },
};
```

## Registering Tools

```typescript
import { ToolRegistry } from "../plugins/registry";

const registry = new ToolRegistry();
registry.register(myTool);
registry.registerMany([tool1, tool2, tool3]);
```

## Tool Categories

### Code
| Tool | Description | Args |
|------|-------------|------|
| `read_file` | Read file contents | `file_path`, `max_length?` |
| `write_file` | Create/overwrite file | `file_path`, `content` |
| `edit_file` | Targeted text replacement | `file_path`, `old_text`, `new_text` |
| `search_code` | Ripgrep-style search | `pattern`, `path?`, `max_results?` |
| `list_directory` | List directory contents | `path?` |

### Terminal
| Tool | Description | Args |
|------|-------------|------|
| `execute_command` | Run shell command | `command`, `timeout?`, `workdir?` |
| `execute_script` | Run script by language | `language` (bash/python/node), `code` |

### Git
| Tool | Description | Args |
|------|-------------|------|
| `git_status` | Show working tree status | — |
| `git_diff` | Show changes | `path?` |
| `git_log` | Commit history | `limit?` |
| `git_commit` | Stage and commit | `message` |
| `git_branch` | List branches | — |
| `git_checkout` | Switch branch | `branch` |
| `git_push` | Push to remote | `branch?` |

### Web
| Tool | Description | Args |
|------|-------------|------|
| `web_search` | Search the web | `query`, `max_results?` |
| `read_url` | Fetch URL content | `url`, `max_length?` |

### Memory
| Tool | Description | Args |
|------|-------------|------|
| `remember` | Save to persistent memory | `key`, `value`, `tags?` |
| `recall` | Search memories | `key?`, `query?`, `tag?` |
| `forget` | Remove a memory | `key` |

### Utility
| Tool | Description | Args |
|------|-------------|------|
| `now` | Current date/time | — |
| `uuid` | Generate UUID v4 | — |
| `read_json` | Parse JSON file | `file_path` |
| `write_json` | Write JSON file | `file_path`, `data` |
| `base64_encode` | Encode to base64 | `text` |
| `base64_decode` | Decode base64 | `encoded` |
| `check_port` | Check port availability | `port`, `host?` |
| `find_open_port` | Find available port | `start?`, `end?` |

### Docker
| Tool | Description | Args |
|------|-------------|------|
| `docker_ps` | List containers | `all?` |
| `docker_exec` | Run in container | `container`, `command` |
| `docker_compose_up` | Start compose services | `file?`, `detached?` |
| `docker_build` | Build image | `tag`, `path?` |

### Deploy
| Tool | Description | Args |
|------|-------------|------|
| `deploy_vercel` | Deploy to Vercel | `prod?`, `name?` |
| `deploy_netlify` | Deploy to Netlify | `dir?`, `prod?` |

### Database
| Tool | Description | Args |
|------|-------------|------|
| `query_sqlite` | Run SQL query | `db_path`, `query` |
| `list_tables` | List tables | `db_path` |
| `create_table` | Create table | `db_path`, `table_name`, `columns` |

### API
| Tool | Description | Args |
|------|-------------|------|
| `http_request` | HTTP request | `url`, `method?`, `headers?`, `body?` |
| `graphql_query` | GraphQL query | `url`, `query`, `variables?` |
| `test_endpoint` | Test + validate | `url`, `expected_status?`, `expected_contains?` |

## ToolOutput Format

```typescript
interface ToolOutput {
  success: boolean;
  data: any;           // Result data (string, object, etc.)
  error?: string;      // Error message if failed
  mime_type?: string;  // Optional MIME type hint
}
```
