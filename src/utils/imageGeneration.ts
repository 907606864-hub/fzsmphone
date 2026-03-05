/**
 * AI 生图核心 — 对齐酒馆脚本 chunk 685
 * 支持 NovelAI / OpenAI / Gemini 三通道
 */

import {
    loadImageGenConfig,
    type ImageGenConfig,
    type NovelAiProviderConfig,
    type OpenAiProviderConfig,
    type GeminiProviderConfig,
} from './imageGenConfig'

// ==================== 代理请求 ====================

async function proxyFetch(
    targetUrl: string,
    apiKey: string,
    headers: Record<string, string>,
    body: unknown,
    signal?: AbortSignal
): Promise<Response> {
    return fetch('/api/ai/image', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ targetUrl, apiKey, headers, body }),
        signal,
    })
}

// ==================== Prompt 合成 ====================

/** Tags 模式：提取所有标签并用逗号连接 */
function collectTags(obj: Record<string, unknown>): string[] {
    const tags: string[] = []
    const push = (arr: unknown) => {
        if (Array.isArray(arr)) {
            for (const item of arr) {
                const s = String(item ?? '').trim()
                if (s && s !== '...' && s !== '…') tags.push(s)
            }
        }
    }
    push(obj?.composition)
    const chars = Array.isArray(obj?.characters) ? obj.characters : []
    for (const c of chars) {
        if (!c || typeof c !== 'object') continue
        push(c.traits); push(c.outfit); push(c.action)
        push(c.body_parts_visible); push(c.interaction); push(c.nsfw)
    }
    push(obj?.entities); push(obj?.background)
    return tags
}

/** Tags prompt */
export function buildPromptText(obj: unknown): string {
    if (typeof obj === 'string') return obj.trim()
    if (!obj || typeof obj !== 'object') return ''
    return collectTags(obj as Record<string, unknown>).join(', ')
}

/** Natural prompt */
export function buildNaturalPromptText(obj: unknown): string {
    if (typeof obj === 'string') return obj.trim()
    if (!obj || typeof obj !== 'object') return ''

    const o = obj as Record<string, unknown>
    const lines: string[] = []

    const describe = (label: string, val: unknown) => {
        const s = describeValue(val)
        if (s) lines.push(`${label}：${s}`)
    }

    describe('人数构图区域焦点视角', o['人数构图区域焦点视角'] ?? o.composition)

    // 中文 key 人物
    const cnChars = Array.isArray(o['人物']) ? o['人物'] : null
    const enChars = Array.isArray(o.characters) ? o.characters : null

    if (cnChars && cnChars.length > 0) {
        cnChars.forEach((c: Record<string, unknown>, i: number) => {
            const name = describeValue(c?.['姓名'] ?? c?.name)
            lines.push(name ? `人物${i + 1}（${name}）` : `人物${i + 1}`)
            describe('人物特征', c?.['人物特征'])
            describe('服装配饰', c?.['服装配饰'])
            describe('动作姿态神态交互', c?.['动作姿态神态交互'])
            describe('需强调的躯体元素', c?.['需强调的躯体元素'])
            describe('NSFW相关', c?.['NSFW相关'])
        })
    } else if (enChars && enChars.length > 0) {
        enChars.forEach((c: Record<string, unknown>, i: number) => {
            const name = describeValue(c?.name)
            lines.push(name ? `人物${i + 1}（${name}）` : `人物${i + 1}`)
            const fields = ['traits', 'outfit', 'action', 'body_parts_visible', 'nsfw'] as const
            const labels = ['人物特征', '服装配饰', '动作姿态神态交互', '需强调的躯体元素', 'NSFW相关']
            fields.forEach((f, idx) => {
                const arr = Array.isArray(c?.[f]) ? (c[f] as string[]).join(', ') : ''
                if (arr) lines.push(`${labels[idx]}：${arr}`)
            })
        })
    }

    describe('物品建筑生物', o['物品建筑生物'] ?? o.entities)
    describe('背景场景光照', o['背景场景光照'] ?? o.background)

    return lines.join('\n').trim()
}

function describeValue(val: unknown): string {
    if (val == null) return ''
    if (typeof val === 'string') return val.trim()
    if (typeof val === 'number' || typeof val === 'boolean') return String(val)
    if (Array.isArray(val)) return val.map(v => describeValue(v)).filter(Boolean).join(', ')
    return ''
}

/** 按模式构建 */
export function buildPromptTextByMode(obj: unknown, mode: string): string {
    return mode === 'natural' ? buildNaturalPromptText(obj) : buildPromptText(obj)
}

/** 合并字符串（逗号分隔用于 tags） */
function joinComma(...parts: (string | undefined)[]): string {
    const items: string[] = []
    for (const p of parts) {
        const s = String(p ?? '').trim()
        if (s) for (const seg of s.split(/[，,]/)) {
            const t = seg.trim()
            if (t) items.push(t)
        }
    }
    return items.join(', ')
}

/** 合并字符串（换行分隔用于 natural） */
function joinNewline(...parts: (string | undefined)[]): string {
    return parts.map(p => String(p ?? '').trim()).filter(Boolean).join('\n').trim()
}

// ==================== 通用图片提取 ====================

/** 解析 base64 data URI */
function parseBase64DataUri(str: string): { mime: string; base64: string } | null {
    const m = String(str || '').trim().match(/^data:([^;]+);base64,([\s\S]+)$/i)
    if (!m) return null
    return { mime: m[1]?.trim() || 'image/png', base64: m[2].replace(/\s+/g, '') }
}

/** 尝试将字符串解析为图片 URL/data URI */
function tryParseImageUrl(str: unknown): string | null {
    if (typeof str !== 'string') return null
    const s = str.trim()
    if (!s) return null
    if (/^https?:\/\//i.test(s)) return s
    if (s.startsWith('data:image/')) return s
    // 尝试纯 base64
    const clean = s.replace(/\s+/g, '')
    if (clean.length >= 256 && /^[A-Za-z0-9+/]+={0,2}$/.test(clean)) {
        return `data:image/png;base64,${clean}`
    }
    return null
}

/** 万能响应图片提取器 — 对齐酒馆 extractImageFromResponse */
export function extractImageFromResponse(data: unknown): string | null {
    if (!data) return null

    // 直接字符串
    if (typeof data === 'string') return tryParseImageUrl(data)

    const obj = data as Record<string, unknown>

    // resultUrl
    const resultUrl = obj?.resultUrl ?? obj?.result_url
    if (typeof resultUrl === 'string') {
        const u = tryParseImageUrl(resultUrl)
        if (u) return u
    }

    // Gemini candidates
    if (Array.isArray(obj?.candidates)) {
        for (const cand of obj.candidates as Record<string, unknown>[]) {
            const parts = (cand?.content as Record<string, unknown>)?.parts
            if (Array.isArray(parts)) {
                for (const part of parts as Record<string, unknown>[]) {
                    const inlineData = part?.inline_data || part?.inlineData
                    if (inlineData && typeof inlineData === 'object') {
                        const id = inlineData as Record<string, unknown>
                        const mime = id.mime_type || id.mimeType || 'image/png'
                        const b64 = String(id.data ?? '').replace(/\s+/g, '')
                        if (b64) return `data:${mime};base64,${b64}`
                    }
                }
            }
        }
    }

    // OpenAI data array
    const dataArr = obj?.data as unknown[]
    if (Array.isArray(dataArr) && dataArr.length > 0) {
        const first = dataArr[0]
        if (typeof first === 'string') { const u = tryParseImageUrl(first); if (u) return u }
        if (first && typeof first === 'object') {
            const fo = first as Record<string, unknown>
            if (typeof fo.url === 'string') { const u = tryParseImageUrl(fo.url); if (u) return u }
            if (typeof fo.b64_json === 'string') { const u = tryParseImageUrl(fo.b64_json); if (u) return u }
        }
    }

    // 直接 base64 fields
    for (const key of ['image_base64', 'imageBase64', 'image', 'b64_json', 'base64', 'b64']) {
        if (typeof obj[key] === 'string') {
            const u = tryParseImageUrl(obj[key] as string)
            if (u) return u
        }
    }

    // images array
    const images = obj?.images
    if (Array.isArray(images) && typeof images[0] === 'string') {
        const u = tryParseImageUrl(images[0])
        if (u) return u
    }

    // OpenAI chat completions response (choices[0].message)
    const choicesArr = obj?.choices as Record<string, unknown>[] | undefined
    const msg = (choicesArr && choicesArr.length > 0 ? choicesArr[0]?.message : undefined) as Record<string, unknown> | undefined
    if (msg) {
        if (Array.isArray(msg.content)) {
            for (const block of msg.content as Record<string, unknown>[]) {
                if (block?.type === 'image_url') {
                    const imgUrl = (block?.image_url as Record<string, unknown>)?.url ?? block?.image_url
                    const u = tryParseImageUrl(imgUrl as string)
                    if (u) return u
                }
            }
        }
        if (typeof msg.content === 'string') {
            // markdown image
            const md = String(msg.content).match(/!\[[\s\S]*?]\(([\s\S]*?)\)/)
            if (md?.[1]) { const u = tryParseImageUrl(md[1]); if (u) return u }
        }
    }

    return null
}

// ==================== ZIP 解压 ====================

/** 从 ZIP ArrayBuffer 中提取第一张图片 */
async function extractImageFromZip(buffer: ArrayBuffer): Promise<Blob> {
    const bytes = new Uint8Array(buffer)
    const view = new DataView(buffer)

    // 找 EOCD
    const findEocd = (): number | null => {
        const minPos = Math.max(0, bytes.length - 22 - 65535)
        for (let i = bytes.length - 22; i >= minPos; i--) {
            if (bytes[i] === 0x50 && bytes[i + 1] === 0x4b && bytes[i + 2] === 0x05 && bytes[i + 3] === 0x06) return i
        }
        return null
    }

    const eocd = findEocd()
    if (eocd == null) throw new Error('ZIP 结构错误：找不到 EOCD')

    const cdEntries = view.getUint16(eocd + 10, true)
    const cdOffset = view.getUint32(eocd + 16, true)
    const decoder = new TextDecoder()

    let target: { fileName: string; compMethod: number; compSize: number; localHeaderOffset: number } | undefined
    let pos = cdOffset

    for (let i = 0; i < cdEntries; i++) {
        if (view.getUint32(pos, true) !== 0x02014b50) throw new Error('ZIP 结构错误')
        const compMethod = view.getUint16(pos + 10, true)
        const compSize = view.getUint32(pos + 20, true)
        const nameLen = view.getUint16(pos + 28, true)
        const extraLen = view.getUint16(pos + 30, true)
        const commentLen = view.getUint16(pos + 32, true)
        const localOffset = view.getUint32(pos + 42, true)
        const name = decoder.decode(bytes.slice(pos + 46, pos + 46 + nameLen))
        const isDir = name.endsWith('/')
        const lower = name.toLowerCase()
        const isImage = lower.endsWith('.png') || lower.endsWith('.jpg') || lower.endsWith('.jpeg') || lower.endsWith('.webp')

        if (!target && !isDir && isImage && compSize > 0) {
            target = { fileName: name, compMethod, compSize, localHeaderOffset: localOffset }
            break
        }
        pos += 46 + nameLen + extraLen + commentLen
    }

    if (!target) throw new Error('ZIP 中未找到图片文件')
    if (view.getUint32(target.localHeaderOffset, true) !== 0x04034b50) throw new Error('ZIP 本地文件头错误')

    const localNameLen = view.getUint16(target.localHeaderOffset + 26, true)
    const localExtraLen = view.getUint16(target.localHeaderOffset + 28, true)
    const dataStart = target.localHeaderOffset + 30 + localNameLen + localExtraLen
    const rawData = bytes.slice(dataStart, dataStart + target.compSize)

    let imageData: Uint8Array
    if (target.compMethod === 0) {
        imageData = rawData
    } else if (target.compMethod === 8) {
        // deflate
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        const ds = new DecompressionStream('deflate-raw') as any
        const blob = new Blob([rawData.buffer as ArrayBuffer])
        const decompressed = await new Response(blob.stream().pipeThrough(ds)).arrayBuffer()
        imageData = new Uint8Array(decompressed)
    } else {
        throw new Error(`不支持的压缩算法: ${target.compMethod}`)
    }

    const lower = target.fileName.toLowerCase()
    const mime = (lower.endsWith('.jpg') || lower.endsWith('.jpeg')) ? 'image/jpeg' : 'image/png'
    return new Blob([imageData.buffer as ArrayBuffer], { type: mime })
}

/** Blob → data URL */
async function blobToDataUrl(blob: Blob): Promise<string> {
    return new Promise((resolve, reject) => {
        const reader = new FileReader()
        reader.onload = () => resolve(String(reader.result || ''))
        reader.onerror = () => reject(reader.error || new Error('读取图片失败'))
        reader.readAsDataURL(blob)
    })
}

// ==================== URL 构建 ====================

function buildNovelAiUrl(baseUrl: string): string {
    let url = baseUrl.trim().replace(/\/+$/, '')
    if (!/^https?:\/\//i.test(url)) url = `https://${url}`
    try {
        const parsed = new URL(url)
        parsed.hash = ''; parsed.search = ''
        let path = parsed.pathname.replace(/\/+$/, '')
        if (path.endsWith('/ai/generate-image')) path = path.slice(0, -18)
        else if (path.endsWith('/ai/module/all')) path = path.slice(0, -14)
        else if (/\/ai\/module\/[^/]+$/i.test(path)) path = path.replace(/\/ai\/module\/[^/]+$/i, '')
        else if (path.endsWith('/ai/module')) path = path.slice(0, -10)
        else if (path.endsWith('/ai')) path = path.slice(0, -3)
        return `${parsed.origin}${path.replace(/\/+$/, '')}/ai/generate-image`
    } catch {
        return ''
    }
}

function buildOpenAiChatUrl(baseUrl: string): string {
    let url = baseUrl.trim().replace(/\/+$/, '')
    if (/\/chat\/completions$/i.test(url)) return url
    if (url.endsWith('/v1')) return `${url}/chat/completions`
    return `${url}/v1/chat/completions`
}

function buildGeminiUrl(baseUrl: string, model: string, key: string): string {
    let url = baseUrl.trim().replace(/\/+$/, '')
    if (!url.endsWith('/v1beta/models') && !url.endsWith('/v1beta')) {
        url = `${url}/v1beta`
    }
    const modelName = model.startsWith('models/') ? model.slice(7) : model
    const full = `${url}/models/${modelName}:generateContent`
    try {
        const parsed = new URL(full)
        parsed.searchParams.set('key', key)
        return parsed.toString()
    } catch {
        return `${full}?key=${encodeURIComponent(key)}`
    }
}

// ==================== 通用响应处理 ====================

async function handleResponse(resp: Response): Promise<{ dataUrl: string }> {
    if (!resp.ok) {
        const ct = resp.headers.get('content-type') || ''
        if (ct.includes('application/json')) {
            const json = await resp.json().catch(() => null)
            const msg = json?.error?.message || json?.message || json?.detail
            throw new Error(msg ? String(msg) : `HTTP ${resp.status}: ${resp.statusText}`)
        }
        const text = await resp.text().catch(() => '')
        throw new Error(text ? `HTTP ${resp.status}: ${text}` : `HTTP ${resp.status}: ${resp.statusText}`)
    }

    const ct = resp.headers.get('content-type') || ''

    if (ct.includes('application/json')) {
        const json = await resp.json()
        const url = extractImageFromResponse(json)
        if (!url) throw new Error('未识别的生图返回格式（JSON）')
        return { dataUrl: url }
    }

    if (ct.startsWith('image/')) {
        const blob = await resp.blob()
        return { dataUrl: await blobToDataUrl(blob) }
    }

    // 尝试 ZIP
    const buf = await resp.arrayBuffer()
    const arr = new Uint8Array(buf)
    if (arr.length >= 4 && arr[0] === 0x50 && arr[1] === 0x4b) {
        const blob = await extractImageFromZip(buf)
        return { dataUrl: await blobToDataUrl(blob) }
    }

    // 当作 image blob
    const blob = new Blob([buf], { type: 'image/png' })
    return { dataUrl: await blobToDataUrl(blob) }
}

// ==================== NovelAI 生图 ====================

export interface ImageGenOptions {
    signal?: AbortSignal
    referenceImages?: string[]
    config?: ImageGenConfig
}

export interface ImageGenResult {
    dataUrl: string
}

export async function generateNovelAiImage(
    promptText: string,
    options?: ImageGenOptions
): Promise<ImageGenResult> {
    const cfg = options?.config || loadImageGenConfig()
    const mode = cfg.promptComposeMode || 'tags'
    const refImages = (options?.referenceImages || []).map(s => String(s ?? '').trim()).filter(Boolean)

    if (cfg.apiFormat === 'openai') {
        return generateOpenAiImage(promptText, cfg.openai, mode, refImages, options?.signal)
    }
    if (cfg.apiFormat === 'gemini') {
        return generateGeminiImage(promptText, cfg.gemini, mode, refImages, options?.signal)
    }

    // NovelAI
    const nai = cfg.novelai
    const finalPrompt = mode === 'natural'
        ? joinNewline(nai.promptPrefix, promptText, nai.promptSuffix)
        : joinComma(nai.promptPrefix, promptText, nai.promptSuffix)
    const negPrompt = joinComma(nai.negativePrompt)

    const url = buildNovelAiUrl(nai.url)
    if (!url) throw new Error('未配置 NovelAI URL')
    if (!nai.key) throw new Error('未配置 NovelAI Key')

    const model = nai.model || 'nai-diffusion-4-5-full'
    const isV45 = model.includes('nai-diffusion-4-5')
    const seed = nai.seed >= 0 ? nai.seed : Math.floor(Math.random() * 4294967295)

    // varietyBoost → skip_cfg_above_sigma
    let skipCfg: number | null = null
    if (nai.varietyBoost) {
        const base = isV45 ? 58 : 19
        const ratio = (nai.width * nai.height) / 1011712
        skipCfg = Math.pow(ratio, 0.5) * base
    }

    const body: Record<string, unknown> = {
        action: 'generate',
        input: String(finalPrompt || ''),
        model,
        parameters: {
            params_version: 3,
            width: nai.width,
            height: nai.height,
            scale: nai.cfg,
            seed,
            sampler: nai.sampler || 'k_euler',
            noise_schedule: nai.scheduler || 'karras',
            steps: nai.steps,
            n_samples: 1,
            ucPreset: nai.ucPreset,
            qualityToggle: nai.qualityToggle,
            autoSmea: nai.autoSmea,
            cfg_rescale: nai.cfgRescale,
            dynamic_thresholding: nai.decrisper,
            controlnet_strength: 1,
            legacy: false,
            add_original_image: true,
            legacy_v3_extend: false,
            use_coords: false,
            legacy_uc: false,
            normalize_reference_strength_multiple: true,
            inpaintImg2ImgStrength: 1,
            deliberate_euler_ancestral_bug: false,
            prefer_brownian: true,
            image_format: 'png',
            skip_cfg_above_sigma: skipCfg,
            sm: nai.sm,
            sm_dyn: nai.smDyn,
            characterPrompts: [],
            v4_prompt: {
                caption: { base_caption: String(finalPrompt || ''), char_captions: [] },
                use_coords: false,
                use_order: true,
            },
            v4_negative_prompt: {
                caption: { base_caption: String(negPrompt || ''), char_captions: [] },
                legacy_uc: false,
            },
            negative_prompt: String(negPrompt || ''),
        },
    }

    // 角色参考图（仅 v4.5）
    if (nai.characterReferenceEnabled && isV45 && refImages.length > 0) {
        const validRefs = refImages.filter(r => !!parseBase64DataUri(r))
        if (validRefs.length > 0) {
            const parsed = validRefs.slice(0, 1).map(r => {
                const p = parseBase64DataUri(r)!
                const secret = crypto.getRandomValues(new Uint8Array(32))
                const key = Array.from(secret, b => b.toString(16).padStart(2, '0')).join('')
                return { cache_secret_key: key, data: p.base64 }
            })

            const styleAware = nai.characterReferenceStyleAware ? 'character&style' : 'character'
            const fidelity = Math.max(0, Math.min(1, nai.characterReferenceFidelity))
            const secondary = Math.max(0, Math.min(1, 1 - fidelity))
            const params = (body.parameters as Record<string, unknown>)
            params.director_reference_images_cached = parsed
            params.director_reference_information_extracted = parsed.map(() => 1)
            params.director_reference_strength_values = parsed.map(() => 1)
            params.director_reference_secondary_strength_values = parsed.map(() => secondary)
            params.director_reference_descriptions = parsed.map(() => ({
                caption: { base_caption: styleAware, char_captions: [] },
                legacy_uc: false,
            }))
            params.skip_cfg_above_sigma = null // 角色参考时禁用
        }
    }

    const correlationId = Array.from({ length: 6 }, () =>
        'abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789'[Math.floor(Math.random() * 62)]
    ).join('')

    console.info('[NovelAI] generate-image', { correlationId, model })

    let resp: Response
    try {
        resp = await proxyFetch(url, nai.key, {
            Accept: 'application/zip, image/png, image/jpeg, application/json',
            'x-correlation-id': correlationId,
        }, body, options?.signal)
    } catch (err) {
        // CORS check
        try {
            if (new URL(url).origin !== window.location.origin) {
                throw new Error('请求被浏览器拦截（跨域/CORS）。请使用支持 CORS 的 API URL。')
            }
        } catch { /* ignore */ }
        throw err
    }

    try {
        return await handleResponse(resp)
    } catch (err) {
        const msg = err instanceof Error ? err.message : '生图失败'
        throw new Error(`${msg} (x-correlation-id: ${correlationId})`)
    }
}

// ==================== OpenAI 生图 ====================

async function generateOpenAiImage(
    promptText: string,
    oai: OpenAiProviderConfig,
    mode: string,
    refImages: string[],
    signal?: AbortSignal,
): Promise<ImageGenResult> {
    const url = String(oai.url || '').trim()
    if (!url) throw new Error('未配置 OpenAI Base URL')
    if (!oai.key) throw new Error('未配置 OpenAI Key')
    const model = String(oai.model || '').trim()
    if (!model) throw new Error('未配置 OpenAI 模型')

    const chatUrl = buildOpenAiChatUrl(url)
    const finalPrompt = mode === 'natural'
        ? joinNewline(oai.promptPrefix, promptText, oai.promptSuffix)
        : joinComma(oai.promptPrefix, promptText, oai.promptSuffix)

    const ar = oai.aspectRatio && oai.aspectRatio !== 'auto' ? oai.aspectRatio : null

    const messages: Record<string, unknown>[] = []
    if (ar) {
        messages.push({ role: 'system', content: JSON.stringify({ imageConfig: { aspectRatio: ar } }) })
    }

    const contentParts: Record<string, unknown>[] = [{ type: 'text', text: String(finalPrompt || '') }]
    for (const ref of refImages) {
        contentParts.push({ type: 'image_url', image_url: { url: ref } })
    }
    messages.push({ role: 'user', content: contentParts })

    const reqBody: Record<string, unknown> = { model, stream: false, messages }
    if (ar) reqBody.extra_body = { imageConfig: { aspectRatio: ar } }

    console.info('[AI] image (openai)', { model, prompt: finalPrompt.slice(0, 100) })

    const resp = await proxyFetch(chatUrl, oai.key, {
        'x-api-key': oai.key,
        Accept: 'application/json, image/png, image/jpeg, application/zip',
    }, reqBody, signal)

    return handleResponse(resp)
}

// ==================== Gemini 生图 ====================

async function generateGeminiImage(
    promptText: string,
    gem: GeminiProviderConfig,
    mode: string,
    refImages: string[],
    signal?: AbortSignal,
): Promise<ImageGenResult> {
    const baseUrl = String(gem.url || '').trim()
    if (!baseUrl) throw new Error('未配置 Gemini Base URL')
    if (!gem.key) throw new Error('未配置 Gemini Key')
    const model = String(gem.model || '').trim()
    if (!model) throw new Error('未配置 Gemini 模型')

    const apiUrl = buildGeminiUrl(baseUrl, model, gem.key)
    const finalPrompt = mode === 'natural'
        ? joinNewline(gem.promptPrefix, promptText, gem.promptSuffix)
        : joinComma(gem.promptPrefix, promptText, gem.promptSuffix)

    const ar = gem.aspectRatio && gem.aspectRatio !== 'auto' ? gem.aspectRatio : null
    const imgSize = gem.imageSize && gem.imageSize !== 'auto' ? gem.imageSize : null

    const genConfig: Record<string, unknown> = { responseModalities: ['TEXT', 'IMAGE'] }
    if (ar || imgSize) {
        const ic: Record<string, string> = {}
        if (ar) ic.aspectRatio = ar
        if (imgSize) ic.imageSize = imgSize
        genConfig.imageConfig = ic
    }

    // 构建 parts
    const parts: Record<string, unknown>[] = [{ text: String(finalPrompt || '') }]
    for (const ref of refImages) {
        const parsed = parseBase64DataUri(ref)
        if (parsed) {
            parts.push({ inline_data: { mime_type: parsed.mime, data: parsed.base64 } })
        } else if (/^https?:\/\//i.test(ref)) {
            parts.push({ file_data: { file_uri: ref } })
        }
    }

    const reqBody = {
        contents: [{ role: 'user', parts }],
        generationConfig: genConfig,
    }

    const headers: Record<string, string> = {
        Accept: 'application/json',
    }
    let apiKeyToProxy = ''
    if (apiUrl.includes('generativelanguage.googleapis.com')) {
        headers['x-goog-api-key'] = gem.key
    } else {
        apiKeyToProxy = gem.key
    }

    console.info('[AI] image (gemini)', { model, prompt: finalPrompt.slice(0, 100) })

    const resp = await proxyFetch(apiUrl, apiKeyToProxy, headers, reqBody, signal)

    return handleResponse(resp)
}

// ==================== 队列机制 ====================

interface QueueItem {
    promptText: string
    options?: ImageGenOptions
    resolve: (result: ImageGenResult) => void
    reject: (error: Error) => void
}

const queue: QueueItem[] = []
let processing = false

async function processQueue() {
    if (processing) return
    processing = true
    while (queue.length > 0) {
        const item = queue.shift()!
        if (item.options?.signal?.aborted) {
            item.reject(new Error('生成已取消'))
            continue
        }
        try {
            const result = await generateNovelAiImage(item.promptText, item.options)
            item.resolve(result)
        } catch (err) {
            item.reject(err instanceof Error ? err : new Error('生图失败'))
        }
    }
    processing = false
}

/** 排队生图（NovelAI 串行，其他通道直接调用） */
export function queueImageGeneration(
    promptText: string,
    options?: ImageGenOptions,
): Promise<ImageGenResult> {
    const cfg = options?.config || loadImageGenConfig()
    if (cfg.apiFormat !== 'novelai') {
        return generateNovelAiImage(promptText, { ...options, config: cfg })
    }
    return new Promise((resolve, reject) => {
        queue.push({ promptText, options: { ...options, config: cfg }, resolve, reject })
        console.info('[NovelAI] 图像生成已加入队列，当前队列长度:', queue.length)
        processQueue()
    })
}

/** 获取队列长度 */
export function getImageGenerationQueueLength(): number {
    return queue.length
}

/** 清空队列 */
export function clearImageGenerationQueue(): void {
    while (queue.length > 0) {
        const item = queue.shift()
        item?.reject(new Error('队列已清空'))
    }
}
