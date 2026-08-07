import type {
  ApplicationCommandOptionChoiceData,
  AutocompleteInteraction,
} from 'discord.js';

/** Max choices Discord accepts for autocomplete */
export const AUTOCOMPLETE_MAX_CHOICES = 25;

export type AutocompleteChoice = ApplicationCommandOptionChoiceData;

export interface AutocompleteContext {
  interaction: AutocompleteInteraction;
  /** Currently focused option name */
  focused: string;
  /** Focused option value as typed by the user (string | number) */
  value: string | number;
  /** Respond with up to 25 choices (extra entries are truncated) */
  respond: (choices: AutocompleteChoice[]) => Promise<void>;
  /** Case-insensitive filter helper for static choice lists */
  filter: (
    choices: AutocompleteChoice[],
    query?: string | number,
  ) => AutocompleteChoice[];
}

/**
 * Build a typed autocomplete context from a Discord interaction.
 */
export function createAutocompleteContext(
  interaction: AutocompleteInteraction,
): AutocompleteContext {
  const focusedOpt = interaction.options.getFocused(true);

  return {
    interaction,
    focused: focusedOpt.name,
    value: focusedOpt.value,
    async respond(choices) {
      await interaction.respond(choices.slice(0, AUTOCOMPLETE_MAX_CHOICES));
    },
    filter(choices, query = focusedOpt.value) {
      const q = String(query).toLowerCase();
      if (!q) return choices.slice(0, AUTOCOMPLETE_MAX_CHOICES);
      return choices
        .filter(
          (c) =>
            c.name.toLowerCase().includes(q) ||
            String(c.value).toLowerCase().includes(q),
        )
        .slice(0, AUTOCOMPLETE_MAX_CHOICES);
    },
  };
}

/**
 * Functional autocomplete handler — use with `command({ autocomplete: ... })`
 * or assign to `SlashCommand.autocomplete`.
 *
 * @example
 * autocomplete: autocomplete(async (ac) => {
 *   await ac.respond(ac.filter([
 *     { name: 'Red', value: 'red' },
 *     { name: 'Blue', value: 'blue' },
 *   ]));
 * })
 */
export function autocomplete(
  run: (ctx: AutocompleteContext) => Promise<void> | void,
): (interaction: AutocompleteInteraction) => Promise<void> {
  return async (interaction) => {
    await run(createAutocompleteContext(interaction));
  };
}

/**
 * Class-based autocomplete — override `run`, assign via method or helper.
 *
 * @example
 * class ColorComplete extends AutocompleteHandler {
 *   async run(ac) {
 *     await ac.respond(ac.filter(COLORS));
 *   }
 * }
 *
 * // On SlashCommand:
 * autocomplete = new ColorComplete().asHandler();
 */
export abstract class AutocompleteHandler {
  abstract run(ctx: AutocompleteContext): Promise<void> | void;

  /** Bind as `(interaction) => …` for CommandDefinition.autocomplete */
  asHandler(): (interaction: AutocompleteInteraction) => Promise<void> {
    return autocomplete((ctx) => this.run(ctx));
  }
}

/**
 * Map strings to `{ name, value }` choices (value = name unless `values` map provided).
 */
export function choicesFrom(
  labels: string[],
  values?: Record<string, string | number>,
): AutocompleteChoice[] {
  return labels.map((name) => ({
    name,
    value: values?.[name] ?? name,
  }));
}
