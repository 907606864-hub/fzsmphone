import { queueImageGeneration } from './imageGeneration'

const SETTINGS_KEY_CHAT_AUTO = 'phone_auto_gen_chat_images'
const SETTINGS_KEY_SOCIAL_AUTO = 'phone_auto_gen_social_images'

/** 获取是否允许聊天室自动生图 */
export function isChatAutoImageGenEnabled(): boolean {
    try {
        const val = localStorage.getItem(SETTINGS_KEY_CHAT_AUTO)
        return val === 'true'
    } catch {
        return false
    }
}

/** 设置是否允许聊天室自动生图 */
export function setChatAutoImageGenEnabled(enabled: boolean): void {
    try {
        localStorage.setItem(SETTINGS_KEY_CHAT_AUTO, enabled ? 'true' : 'false')
    } catch { /* ignore */ }
}

/** 获取是否允许社交App后台自动生图 */
export function isSocialAutoImageGenEnabled(): boolean {
    try {
        const val = localStorage.getItem(SETTINGS_KEY_SOCIAL_AUTO)
        // 默认开启，因为社交比较重后端，或者如果从未设置也默认开启
        return val !== 'false'
    } catch {
        return true
    }
}

/** 设置是否允许社交App后台自动生图 */
export function setSocialAutoImageGenEnabled(enabled: boolean): void {
    try {
        localStorage.setItem(SETTINGS_KEY_SOCIAL_AUTO, enabled ? 'true' : 'false')
    } catch { /* ignore */ }
}

/**
 * 通用生图方法，直接传入 prompt 进行生图
 * 返回生成的 base64 dataUrl
 */
export async function generateImageFromPrompt(prompt: string): Promise<string> {
    if (!prompt || !prompt.trim()) {
        throw new Error('生图提示词不能为空')
    }
    const result = await queueImageGeneration(prompt.trim())
    return result.dataUrl
}
