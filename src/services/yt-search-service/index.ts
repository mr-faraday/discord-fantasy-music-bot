import { Worker } from 'worker_threads'
import path from 'path'
import { v4 as uuidv4 } from 'uuid'
import { assert } from '../../utils/assertion'
import { NODE_ENV } from '../../config'
import { concatMessages, LogLevel } from '../../journal'

type Uuid = string

export interface YtVideoSearchResult {
    videoId: string
    title: string
    thumbnail: string
}

interface ServiceRequest {
    uuid: Uuid
    query: string
    resolve(result: YtVideoSearchResult): void
    reject(error: string | Error): void
}

interface ServiceResult {
    success: boolean
    result: {
        uuid?: Uuid
        searchResult?: YtVideoSearchResult
        message?: string
    }
}

const serviceRequests = new Map<Uuid, ServiceRequest>()
let isOnline = false
let worker: Worker

const workerFilePath =
    NODE_ENV === 'development'
        ? path.join(
            __dirname,
            '..',
            '..',
            '..',
            'build',
            'services',
            'yt-search-service',
            'worker.js'
        )
        : path.join(__dirname, 'worker.js')

function spawnWorker () {
    worker = new Worker(workerFilePath)

    worker.on('online', () => {
        isOnline = true
        console.log(`[${LogLevel.INFO}] YtSearchService | Worker spawned`)

        for (const [uuid, { query }] of serviceRequests) {
            worker.postMessage(JSON.stringify([uuid, query]))
        }
    })

    worker.on('message', (message: string) => {
        const response: unknown = JSON.parse(message)

        if (!validateServiceResult(response)) {
            return console.log(
                `[${LogLevel.ERROR}] YtSearchService | onMessage: message parse error, payload:`,
                '\n',
                message
            )
        }

        if (typeof response.result.uuid !== 'string') {
            return console.log(
                `[${LogLevel.ERROR}] YtSearchService | onMessage: service error`,
                '\n',
                response.result.message
            )
        }

        const uuid = response.result.uuid
        const request = serviceRequests.get(uuid)

        if (!request) {
            return console.log(
                `[${LogLevel.ERROR}] YtSearchService | onMessage: request not found`
            )
        }

        try {
            assert(response.result.searchResult || response.result.message)

            if (response.success && response.result.searchResult) {
                request.resolve(response.result.searchResult)
            } else if (response.result.message) {
                request.reject(response.result.message)
            }
        } catch (error) {
            console.log(
                `[${LogLevel.ERROR}] YtSearchService | onWorkerMessage`,
                '\n',
                concatMessages(error)
            )
        } finally {
            serviceRequests.delete(uuid)
        }
    })

    worker.on('error', (error) => {
        console.log(
            `[${LogLevel.ERROR}] YtSearchService | onWorkerError`,
            '\n',
            concatMessages(error)
        )
    })
    worker.on('exit', (code) => {
        console.log(
            `[${LogLevel.INFO}] YtSearchService |' stopped with ${code} exit code`
        )

        isOnline = false
        spawnWorker()
    })
}

function search (query: string): Promise<YtVideoSearchResult> {
    return new Promise((resolve, reject) => {
        const serviceRequest = { uuid: uuidv4(), query, resolve, reject }

        serviceRequests.set(serviceRequest.uuid, serviceRequest)

        if (isOnline) {
            worker.postMessage(JSON.stringify([serviceRequest.uuid, query]))
        }
    })
}

function validateServiceResult (result: unknown): result is ServiceResult {
    return (
        typeof result === 'object' &&
        result !== null &&
        'success' in result &&
        'result' in result
    )
}

spawnWorker()

const YtSearchService = { search }
export default YtSearchService
