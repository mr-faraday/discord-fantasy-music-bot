import { Client, Message } from 'discord.js'
import db from '../db'
import { isValidInteger } from '../utils/number'
import { SlashCommandBuilder } from '@discordjs/builders'
import GuildSession from '../guild-session'
import { BINDS_MAX_INDEX } from '../config'

const interactionName = 'drop'

async function messageHandler (
    this: Client,
    { message, guild, args }: MessageCommadHandlerParams
): Promise<void | Message> {
    if (!message.guild) return
    const [, bindParam] = args

    const bindKey = Number(bindParam)
    if (!bindParam) {
        return await message.channel.send('No params provided')
    } else if (!isValidInteger(bindKey, 0, BINDS_MAX_INDEX)) {
        return await message.channel.send(`Bind key must be an integer from 0 to ${BINDS_MAX_INDEX}`)
    }

    try {
        await db.query('DELETE FROM bind WHERE guild_id = $1 AND bind_key = $2', [
            message.guild.id,
            bindKey
        ])

        guild.binds.delete(bindKey)
        await message.channel.send('Deleted')
    } catch (error) {
        guild.journal.error(error)
        return await message.channel.send('Something went wrong, try later')
    }

    return Promise.resolve()
}

async function interactionHandler (
    this: Client,
    { guild, interaction }: InterationHandlerParams
): Promise<void> {
    console.debug(interaction)
    await Promise.resolve()
}

const slashConfig = new SlashCommandBuilder()
    .setName(interactionName)
    .setDescription('Delete binded link')

interface ExecutorParams {
    changeIt: number
}

async function executor (guild: GuildSession, { changeIt }: ExecutorParams) {
    // executor
}

const command: MessageCommand<ExecutorParams> & SlashCommand<ExecutorParams> = {
    commandMessageNames: ['drop'],
    sort: 10,
    helpInfo: `\`drop [0..${BINDS_MAX_INDEX}]\` delete binded link`,
    messageHandler,

    commandInteractionNames: [interactionName],
    slashConfig,
    interactionHandler,

    executor
}

export default command
