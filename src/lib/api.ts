const BASE = '/api'

function currentUsername(): string {
    try {
        const user = JSON.parse(localStorage.getItem('currentUser') || '{}')
        return user.username || 'admin'
    } catch {
        return 'admin'
    }
}

export async function getAll<T>(resource: string): Promise<T[]> {
    const res = await fetch(`${BASE}/${currentUsername()}/${resource}`)
    if (!res.ok) throw new Error(`GET ${resource} başarısız`)
    return res.json()
}

export async function create<T>(resource: string, data: Omit<T, 'id'>): Promise<T> {
    const res = await fetch(`${BASE}/${currentUsername()}/${resource}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data),
    })
    if (!res.ok) throw new Error(`POST ${resource} başarısız`)
    return res.json()
}

export async function update<T extends { id: string }>(resource: string, id: string, data: Omit<T, 'id'>): Promise<T> {
    const res = await fetch(`${BASE}/${currentUsername()}/${resource}/${id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data),
    })
    if (!res.ok) throw new Error(`PUT ${resource}/${id} başarısız`)
    return res.json()
}

export async function remove(resource: string, id: string): Promise<void> {
    await fetch(`${BASE}/${currentUsername()}/${resource}/${id}`, { method: 'DELETE' })
}
