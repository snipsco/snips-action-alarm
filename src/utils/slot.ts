export const slot = {
    missing: (slot: string | string[]) => {
        if (slot instanceof Array) {
            return slot.length === 0
        }
        return !slot || slot.includes('unknownword')
    }
}
