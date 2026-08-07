import { MessageFlags, type Client, type Interaction } from 'discord.js';
import type { Logger } from '@nexora.ts/logger';
import {
  createComponentContext,
  createModalContext,
  type ComponentInteraction,
} from './context.js';
import type { InteractionRegistry, RegisteredInteraction } from './registry.js';
import type { ButtonHandler } from './button-handler.js';
import type { SelectHandler } from './select-handler.js';
import type { ModalHandler } from './modal-handler.js';

/** Attach button / select / modal handlers to `interactionCreate` */
export function attachInteractionHandlers(
  client: Client,
  registry: InteractionRegistry,
  logger: Logger,
): void {
  if (registry.size === 0) return;

  client.on('interactionCreate', async (interaction) => {
    try {
      if (interaction.isButton()) {
        await runComponent(interaction, registry, client, logger, 'button');
        return;
      }

      if (
        interaction.isStringSelectMenu() ||
        interaction.isUserSelectMenu() ||
        interaction.isRoleSelectMenu() ||
        interaction.isMentionableSelectMenu() ||
        interaction.isChannelSelectMenu()
      ) {
        await runComponent(interaction, registry, client, logger, 'select');
        return;
      }

      if (interaction.isModalSubmit()) {
        const entry = registry.get(interaction.customId, { kind: 'modal' });
        if (!entry) return;

        const ctx = createModalContext(interaction, client);
        const started = Date.now();
        await (entry.handler as ModalHandler).execute(ctx);
        logger.debug(`Modal handler: ${formatCustomId(entry)}`, {
          customId: interaction.customId,
          user: interaction.user.tag,
          duration: Date.now() - started,
        });
      }
    } catch (error) {
      logger.error(
        'Interaction handler error',
        error instanceof Error ? error : { error: String(error) },
      );

      await safeErrorReply(interaction);
    }
  });
}

async function runComponent(
  interaction: ComponentInteraction,
  registry: InteractionRegistry,
  client: Client,
  logger: Logger,
  kind: 'button' | 'select',
): Promise<void> {
  const entry = registry.get(interaction.customId, { kind });
  if (!entry) return;

  const ctx = createComponentContext(interaction, client);
  const started = Date.now();

  if (kind === 'button') {
    await (entry.handler as ButtonHandler).execute(ctx);
  } else {
    await (entry.handler as SelectHandler).execute(ctx);
  }

  logger.debug(`Component handler: ${formatCustomId(entry)}`, {
    kind,
    customId: interaction.customId,
    user: interaction.user.tag,
    duration: Date.now() - started,
  });
}

function formatCustomId(entry: RegisteredInteraction): string {
  return entry.customId instanceof RegExp
    ? entry.customId.toString()
    : entry.customId;
}

async function safeErrorReply(interaction: Interaction): Promise<void> {
  if (!interaction.isRepliable()) return;

  const reply = {
    content: 'An error occurred while handling this interaction.',
    flags: MessageFlags.Ephemeral as const,
  };
  try {
    if (interaction.replied || interaction.deferred) {
      await interaction.followUp(reply);
    } else {
      await interaction.reply(reply);
    }
  } catch {
    // Interaction may already be acknowledged or expired
  }
}
