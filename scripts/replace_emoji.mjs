/**
 * Batch emoji replacement script v3 - final stragglers
 */
import fs from 'fs'
import path from 'path'
import { fileURLToPath } from 'url'

const __dirname = path.dirname(fileURLToPath(import.meta.url))
const pagesDir = path.join(__dirname, '..', 'src', 'pages')

const emojiMap = {
    '🏯': '◈', '👶': '◎', '🌃': '★',
    '😍': '◠', '🤓': '◎', '😭': '◡',
    '🧗': '△', '🍭': '◇', '🎹': '♪',
    '🏰': '★', '📖': '▤',
}

function replaceEmojis(content) {
    let result = content
    const sorted = Object.entries(emojiMap).sort((a, b) => b[0].length - a[0].length)
    for (const [emoji, replacement] of sorted) {
        result = result.replaceAll(emoji, replacement)
    }
    return result
}

function walkDir(dir) {
    let count = 0
    for (const entry of fs.readdirSync(dir, { withFileTypes: true })) {
        const full = path.join(dir, entry.name)
        if (entry.isDirectory()) {
            count += walkDir(full)
        } else if (entry.name.endsWith('.vue') || entry.name.endsWith('.ts')) {
            const content = fs.readFileSync(full, 'utf-8')
            const newContent = replaceEmojis(content)
            if (content !== newContent) {
                fs.writeFileSync(full, newContent, 'utf-8')
                console.log(`✓ ${path.relative(pagesDir, full)}`)
                count++
            }
        }
    }
    return count
}

const count = walkDir(pagesDir)
console.log(`\nDone! Fixed ${count} more files.`)
