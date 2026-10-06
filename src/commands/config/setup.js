import { SlashCommandBuilder, PermissionFlagsBits, ChannelType, EmbedBuilder, MessageFlags } from 'discord.js';
import { BOT_COLOR } from '../../lib/branding.js';
import { config } from '../../lib/config.js';

const onOff = (v) => (v ? '✅ be' : '❌ ki');
const ch = (id) => (id ? `<#${id}>` : '—');

export default {
  data: new SlashCommandBuilder()
    .setName('setup')
    .setDescription('Meteor bot beállításai ezen a szerveren')
    .setDefaultMemberPermissions(PermissionFlagsBits.ManageGuild)
    .setContexts(0)
    .addSubcommand((s) => s.setName('view').setDescription('Jelenlegi beállítások'))
    .addSubcommand((s) => s.setName('logchannel').setDescription('Moderációs log csatorna')
      .addChannelOption((o) => o.setName('channel').setDescription('Csatorna (üres = kikapcsol)').addChannelTypes(ChannelType.GuildText)))
    .addSubcommand((s) => s.setName('welcome').setDescription('Üdvözlő üzenet')
      .addChannelOption((o) => o.setName('channel').setDescription('Csatorna (üres = kikapcsol)').addChannelTypes(ChannelType.GuildText))
      .addStringOption((o) => o.setName('message').setDescription('Üzenet. Változók: {user} {server} {count}').setMaxLength(500)))
    .addSubcommand((s) => s.setName('antispam').setDescription('Anti-spam')
      .addBooleanOption((o) => o.setName('enabled').setDescription('Be/ki').setRequired(true))
      .addIntegerOption((o) => o.setName('limit').setDescription('Üzenetek száma (3-20)').setMinValue(3).setMaxValue(20))
      .addIntegerOption((o) => o.setName('window').setDescription('Időablak mp-ben (2-30)').setMinValue(2).setMaxValue(30))
      .addIntegerOption((o) => o.setName('timeout').setDescription('Timeout mp-ben (60-86400)').setMinValue(60).setMaxValue(86400)))
    .addSubcommand((s) => s.setName('filters').setDescription('Link- és meghívószűrő')
      .addBooleanOption((o) => o.setName('antiinvite').setDescription('Discord meghívók tiltása'))
      .addBooleanOption((o) => o.setName('antilink').setDescription('Minden link tiltása')))
    .addSubcommand((s) => s.setName('badwords').setDescription('Tiltott szavak')
      .addStringOption((o) => o.setName('action').setDescription('Művelet').setRequired(true).addChoices({ name: 'hozzáad', value: 'add' }, { name: 'töröl', value: 'remove' }, { name: 'lista', value: 'list' }, { name: 'mind törlése', value: 'clear' }))
      .addStringOption((o) => o.setName('word').setDescription('Szó').setMaxLength(50)))
    .addSubcommand((s) => s.setName('antiraid').setDescription('Anti-raid')
      .addBooleanOption((o) => o.setName('enabled').setDescription('Be/ki').setRequired(true))
      .addIntegerOption((o) => o.setName('joins').setDescription('Belépések száma (3-50)').setMinValue(3).setMaxValue(50))
      .addIntegerOption((o) => o.setName('window').setDescription('Időablak mp-ben (5-120)').setMinValue(5).setMaxValue(120))
      .addStringOption((o) => o.setName('action').setDescription('Mi történjen a belépőkkel').addChoices({ name: 'kick', value: 'kick' }, { name: 'ban', value: 'ban' }, { name: 'csak naplóz', value: 'none' }))
      .addIntegerOption((o) => o.setName('min_account_age').setDescription('Minimum fiókkor napokban (0 = ki)').setMinValue(0).setMaxValue(365)))
    .addSubcommand((s) => s.setName('xp').setDescription('Szintrendszer')
      .addBooleanOption((o) => o.setName('enabled').setDescription('Be/ki').setRequired(true))
      .addChannelOption((o) => o.setName('levelup_channel').setDescription('Szintlépés üzenetek csatornája (üres = ahol írt)').addChannelTypes(ChannelType.GuildText))),
  async execute(interaction) {
    const db = interaction.client.db;
    const gid = interaction.guildId;
    const sub = interaction.options.getSubcommand();
    const o = interaction.options;
    const patch = {};
    let msg = '';

    switch (sub) {
      case 'logchannel':
        patch.log_channel = o.getChannel('channel')?.id ?? null;
        msg = patch.log_channel ? `📋 Log csatorna: <#${patch.log_channel}>` : '📋 Log csatorna kikapcsolva.';
        break;
      case 'welcome':
        patch.welcome_channel = o.getChannel('channel')?.id ?? null;
        if (o.getString('message') !== null) patch.welcome_message = o.getString('message');
        msg = patch.welcome_channel ? `👋 Üdvözlés: <#${patch.welcome_channel}>` : '👋 Üdvözlés kikapcsolva.';
        break;
      case 'antispam':
        patch.antispam = o.getBoolean('enabled', true) ? 1 : 0;
        if (o.getInteger('limit') !== null) patch.antispam_limit = o.getInteger('limit');
        if (o.getInteger('window') !== null) patch.antispam_window = o.getInteger('window');
        if (o.getInteger('timeout') !== null) patch.antispam_timeout = o.getInteger('timeout');
        msg = `🛡️ Anti-spam: ${onOff(patch.antispam)}`;
        break;
      case 'filters':
        if (o.getBoolean('antiinvite') !== null) patch.antiinvite = o.getBoolean('antiinvite') ? 1 : 0;
        if (o.getBoolean('antilink') !== null) patch.antilink = o.getBoolean('antilink') ? 1 : 0;
        msg = '🚫 Szűrők frissítve.';
        break;
      case 'badwords': {
        const s = db.settings(gid);
        const action = o.getString('action', true);
        const word = o.getString('word')?.toLowerCase().trim();
        let list = s.badwords;
        if (action === 'list') { msg = list.length ? `🚫 Tiltott szavak: ${list.map((w) => `\`${w}\``).join(', ')}` : 'Nincs tiltott szó.'; break; }
        if (action === 'clear') list = [];
        else if (!word) { msg = '❌ Adj meg egy szót.'; break; }
        else if (action === 'add') { if (list.length >= 200) { msg = '❌ Legfeljebb 200 szó lehet.'; break; } if (!list.includes(word)) list.push(word); }
        else list = list.filter((w) => w !== word);
        patch.badwords = list;
        msg = `🚫 Tiltott szavak (${list.length}): ${list.map((w) => `\`${w}\``).join(', ') || '—'}`;
        break;
      }
      case 'antiraid':
        patch.antiraid = o.getBoolean('enabled', true) ? 1 : 0;
        if (o.getInteger('joins') !== null) patch.antiraid_joins = o.getInteger('joins');
        if (o.getInteger('window') !== null) patch.antiraid_window = o.getInteger('window');
        if (o.getString('action') !== null) patch.antiraid_action = o.getString('action');
        if (o.getInteger('min_account_age') !== null) patch.min_account_age = o.getInteger('min_account_age');
        msg = `🛡️ Anti-raid: ${onOff(patch.antiraid)}`;
        break;
      case 'xp':
        patch.xp_enabled = o.getBoolean('enabled', true) ? 1 : 0;
        patch.levelup_channel = o.getChannel('levelup_channel')?.id ?? null;
        msg = `⭐ Szintrendszer: ${onOff(patch.xp_enabled)}`;
        break;
    }
    const s = Object.keys(patch).length ? db.updateSettings(gid, patch) : db.settings(gid);
    if (sub !== 'view') {
      await interaction.reply({ content: msg, flags: MessageFlags.Ephemeral });
      return;
    }
    const embed = new EmbedBuilder()
      .setTitle(`⚙️ ${interaction.guild.name} – Meteor beállítások`)
      .setColor(BOT_COLOR)
      .addFields(
        { name: 'Log csatorna', value: ch(s.log_channel), inline: true },
        { name: 'Üdvözlés', value: ch(s.welcome_channel), inline: true },
        { name: 'Szintrendszer', value: onOff(s.xp_enabled), inline: true },
        { name: 'Anti-spam', value: `${onOff(s.antispam)} · ${s.antispam_limit} üzenet / ${s.antispam_window} mp → ${Math.round(s.antispam_timeout / 60)} perc timeout`, inline: false },
        { name: 'Anti-raid', value: `${onOff(s.antiraid)} · ${s.antiraid_joins} belépés / ${s.antiraid_window} mp → ${s.antiraid_action} · min. fiókkor: ${s.min_account_age} nap`, inline: false },
        { name: 'Szűrők', value: `meghívó: ${onOff(s.antiinvite)} · link: ${onOff(s.antilink)} · tiltott szavak: ${s.badwords.length}`, inline: false },
      );
    if (config.web.enabled) embed.setFooter({ text: `Webes vezérlőpult: ${config.web.baseUrl}/dashboard` });
    await interaction.reply({ embeds: [embed], flags: MessageFlags.Ephemeral });
  },
};
