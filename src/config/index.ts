import dotenv from 'dotenv'

// loading environment variables for development
if (process.env.NODE_ENV !== 'production') {
    dotenv.config()
}

export const TOKEN = process.env.TOKEN
export const YOUTUBE_API_KEY = process.env.YOUTUBE_API_KEY
export const DATABASE_URL = process.env.DATABASE_URL

export const EMBED_COLOR = '#f26d53'