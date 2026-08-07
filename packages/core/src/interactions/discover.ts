import type { Logger } from '@nexora.ts/logger';
import { resolveButtonHandlerExport } from './button-handler.js';
import { resolveSelectHandlerExport } from './select-handler.js';
import { resolveModalHandlerExport } from './modal-handler.js';
import type { InteractionRegistry } from './registry.js';

const DEFAULT_PATTERNS = ['./interactions/**/*.ts'];

/**
 * Auto-discover and register interaction handlers from glob patterns.
 * Default: recursive TypeScript modules under the interactions folder.
 */
export async function discoverInteractions(
  patterns: string | string[] | undefined,
  registry: InteractionRegistry,
  logger: Logger,
): Promise<void> {
  const { glob } = await import('glob');
  const { pathToFileURL } = await import('node:url');

  const list = normalizePatterns(patterns);

  for (const pattern of list) {
    const files = await glob(pattern, { absolute: true });

    for (const file of files) {
      try {
        const module = await import(pathToFileURL(file).href);
        const exported = module.default as unknown;

        const button = resolveButtonHandlerExport(exported);
        if (button) {
          registry.register(button, file);
          logger.debug(`Registered button handler: ${formatId(button.customId)}`, { file });
          continue;
        }

        const select = resolveSelectHandlerExport(exported);
        if (select) {
          registry.register(select, file);
          logger.debug(`Registered select handler: ${formatId(select.customId)}`, { file });
          continue;
        }

        const modal = resolveModalHandlerExport(exported);
        if (modal) {
          registry.register(modal, file);
          logger.debug(`Registered modal handler: ${formatId(modal.customId)}`, { file });
        }
      } catch (error) {
        logger.error(`Failed to load interaction: ${file}`, {
          error: error instanceof Error ? error.message : String(error),
        });
      }
    }
  }

  logger.info(`Discovered ${registry.size} interaction handler(s)`);
}

function normalizePatterns(patterns: string | string[] | undefined): string[] {
  if (patterns == null) return DEFAULT_PATTERNS;
  return Array.isArray(patterns) ? patterns : [patterns];
}

function formatId(customId: string | RegExp): string {
  return customId instanceof RegExp ? customId.toString() : customId;
}
