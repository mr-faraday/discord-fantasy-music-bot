import { Client, Message } from 'discord.js'
import { SlashCommandBuilder } from '@discordjs/builders'

async function handler (
    this: Client,
    { guild }: MessageCommadHandlerParams
): Promise<void | Message> {
    if (guild.isPlaying) {
        return guild.stop()
    }

    return Promise.resolve()
}

const slashConfig = new SlashCommandBuilder().setName('stop')

export default {
    aliases: ['s'],
    sort: 4,
    helpInfo: '`s` stop playing and clear queue',
    slashConfig,
    handler
}
