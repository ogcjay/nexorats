import type {
  Attachment,
  ChatInputCommandInteraction,
  GuildBasedChannel,
  GuildMember,
  Role,
  User,
} from 'discord.js';

/**
 * Typed shortcuts for `interaction.options.get*` on {@link CommandContext}.
 *
 * Overloads match discord.js: pass `true` as `required` to narrow away `null`.
 *
 * @example
 * const user = ctx.options.user('target', true);
 * const reason = ctx.options.string('reason') ?? 'No reason';
 */
export interface CommandOptionsGetters {
  string(name: string, required?: false): string | null;
  string(name: string, required: true): string;

  integer(name: string, required?: false): number | null;
  integer(name: string, required: true): number;

  number(name: string, required?: false): number | null;
  number(name: string, required: true): number;

  boolean(name: string, required?: false): boolean | null;
  boolean(name: string, required: true): boolean;

  user(name: string, required?: false): User | null;
  user(name: string, required: true): User;

  channel(name: string, required?: false): GuildBasedChannel | null;
  channel(name: string, required: true): GuildBasedChannel;

  role(name: string, required?: false): Role | null;
  role(name: string, required: true): Role;

  mentionable(
    name: string,
    required?: false,
  ): User | GuildMember | Role | null;
  mentionable(name: string, required: true): User | GuildMember | Role;

  attachment(name: string, required?: false): Attachment | null;
  attachment(name: string, required: true): Attachment;
}

/**
 * Build typed option getters bound to a chat-input interaction.
 *
 * @param interaction - Discord chat-input command interaction
 * @returns Getters mirroring `interaction.options.get*`
 */
export function createCommandOptionsGetters(
  interaction: ChatInputCommandInteraction,
): CommandOptionsGetters {
  const opts = interaction.options;

  return {
    string: ((name: string, required?: boolean) =>
      opts.getString(name, required ?? false)) as CommandOptionsGetters['string'],

    integer: ((name: string, required?: boolean) =>
      opts.getInteger(name, required ?? false)) as CommandOptionsGetters['integer'],

    number: ((name: string, required?: boolean) =>
      opts.getNumber(name, required ?? false)) as CommandOptionsGetters['number'],

    boolean: ((name: string, required?: boolean) =>
      opts.getBoolean(name, required ?? false)) as CommandOptionsGetters['boolean'],

    user: ((name: string, required?: boolean) =>
      opts.getUser(name, required ?? false)) as CommandOptionsGetters['user'],

    channel: ((name: string, required?: boolean) =>
      opts.getChannel(name, required ?? false)) as CommandOptionsGetters['channel'],

    role: ((name: string, required?: boolean) =>
      opts.getRole(name, required ?? false)) as CommandOptionsGetters['role'],

    mentionable: ((name: string, required?: boolean) =>
      opts.getMentionable(name, required ?? false)) as CommandOptionsGetters['mentionable'],

    attachment: ((name: string, required?: boolean) =>
      opts.getAttachment(name, required ?? false)) as CommandOptionsGetters['attachment'],
  };
}
