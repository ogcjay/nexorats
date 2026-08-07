# Plugin ecosystem

The long-term value of Nexora on GitHub is a **shared ecosystem**:

- Official plugins (tickets, moderation, …)
- Community plugins
- Shared dashboard modules and API patterns

## Design goals

- Plugins must not require forking core
- Clear manifests and dependency resolution
- Safe enable/disable per guild
- Discoverable via CLI (`nexora add …`) over time

## Publish your plugin

Until a registry exists:

1. Publish an npm package (e.g. `@you/nexora-plugin-tickets`)
2. Document the Nexora version range
3. Open a discussion / PR to list it in community showcases

Ideas and RFCs: use GitHub Discussions once the repo is public.
