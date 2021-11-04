import { Client, Message } from 'discord.js'

async function handler (this: Client, { message }: MessageCommadHandlerParams): Promise<Message> {
    return await message.channel.send('Hello :)')
}

export default {
    aliases: ['hello'],
    helpSort: 11,
    handler
}