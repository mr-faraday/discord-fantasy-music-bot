import { parentPort } from 'worker_threads'
import yts from 'yt-search'
import { assert, assertType } from '../../utils/assertion'

assert(parentPort)

parentPort.on('message', async (message: string) => {
    let uuid
    let query

    try {
        const request: unknown = JSON.parse(message)

        assertType<[string, string]>(
            request,
            Array.isArray(request) &&
                typeof request[0] === 'string' &&
                typeof request[0] === 'string'
        )

        uuid = request[0]
        query = request[1]

        if (!uuid) {
            throw new TypeError('uuid is not porvided')
        } else if (!query) {
            throw new TypeError('query is not provided')
        }
    } catch (error) {
        return JSON.stringify({
            success: false,
            result: {
                message:
                    (error instanceof Error && error.message) ??
                    'YtServiceWorker | Parsing message unknown error'
            }
        })
    }

    try {
        const response = await yts({ query, pages: 1 })
        const video = response.videos[0]

        if (!video) {
            throw new Error('Video not found')
        }

        assert(parentPort)
        parentPort.postMessage(
            JSON.stringify({
                success: true,
                result: {
                    uuid,
                    searchResult: {
                        videoId: video.videoId,
                        title: video.title,
                        thumbnail: video.thumbnail
                    }
                }
            })
        )
    } catch (error) {
        assert(parentPort)
        parentPort.postMessage(
            JSON.stringify({
                success: false,
                result: {
                    uuid,
                    message:
                        (error instanceof Error && error.message) ??
                        'YtServiceWorker | Unknown error'
                }
            })
        )
    }
})
