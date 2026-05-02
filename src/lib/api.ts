import { supabase } from './supabase'

// ── Kaynak adı → tablo adı eşleşmesi ────────────────────────
const TABLE: Record<string, string> = {
    'gelen-isler': 'gelen_isler',
    'giden-isler': 'giden_isler',
    'faturalar': 'faturalar',
    'firmalar': 'firmalar',
    'cariler': 'cariler',
    'banka-hesaplari': 'banka_hesaplari',
    'islemler': 'islemler',
    'urunler': 'urunler',
    'stok-hareketleri': 'stok_hareketleri',
}

// ── camelCase ↔ snake_case dönüşümleri ──────────────────────
function toSnake(key: string): string {
    return key.replace(/[A-Z]/g, c => `_${c.toLowerCase()}`)
}
function toCamel(key: string): string {
    return key.replace(/_([a-z])/g, (_, c) => c.toUpperCase())
}
function rowToSnake(obj: Record<string, unknown>): Record<string, unknown> {
    return Object.fromEntries(Object.entries(obj).map(([k, v]) => [toSnake(k), v]))
}
function rowToCamel(obj: Record<string, unknown>): Record<string, unknown> {
    return Object.fromEntries(Object.entries(obj).map(([k, v]) => [toCamel(k), v]))
}

function tableName(resource: string): string {
    return TABLE[resource] ?? resource.replace(/-/g, '_')
}

function currentUserId(): string {
    try {
        const user = JSON.parse(localStorage.getItem('currentUser') || '{}')
        return user.id ?? ''
    } catch {
        return ''
    }
}

// ── CRUD ─────────────────────────────────────────────────────

export async function getAll<T>(resource: string): Promise<T[]> {
    const { data, error } = await supabase
        .from(tableName(resource))
        .select('*')
        .eq('user_id', currentUserId())
        .order('created_at', { ascending: false })

    if (error) throw new Error(`GET ${resource} başarısız: ${error.message}`)
    return (data ?? []).map(row => rowToCamel(row as Record<string, unknown>) as T)
}

export async function create<T>(resource: string, data: Omit<T, 'id'>): Promise<T> {
    const row = {
        ...rowToSnake(data as Record<string, unknown>),
        user_id: currentUserId(),
    }

    const { data: created, error } = await supabase
        .from(tableName(resource))
        .insert(row)
        .select()
        .single()

    if (error) throw new Error(`POST ${resource} başarısız: ${error.message}`)
    return rowToCamel(created as Record<string, unknown>) as T
}

export async function update<T extends { id: string }>(
    resource: string,
    id: string,
    data: Omit<T, 'id'>,
): Promise<T> {
    const row = rowToSnake(data as Record<string, unknown>)

    const { data: updated, error } = await supabase
        .from(tableName(resource))
        .update(row)
        .eq('id', id)
        .eq('user_id', currentUserId())
        .select()
        .single()

    if (error) throw new Error(`PUT ${resource}/${id} başarısız: ${error.message}`)
    return rowToCamel(updated as Record<string, unknown>) as T
}

export async function remove(resource: string, id: string): Promise<void> {
    const { error } = await supabase
        .from(tableName(resource))
        .delete()
        .eq('id', id)
        .eq('user_id', currentUserId())

    if (error) throw new Error(`DELETE ${resource}/${id} başarısız: ${error.message}`)
}

// ── AUTH ──────────────────────────────────────────────────────

export async function authLogin(email: string, password: string) {
    const { data, error } = await supabase.auth.signInWithPassword({ email, password })
    if (error) throw new Error(error.message === 'Invalid login credentials'
        ? 'E-posta veya şifre hatalı'
        : error.message)

    const { data: profile, error: profileErr } = await supabase
        .from('profiles')
        .select('username, role, created_at')
        .eq('id', data.user.id)
        .single()

    if (profileErr) throw new Error(profileErr.message)

    const currentUser = {
        id: data.user.id,
        username: profile.username,
        email: data.user.email!,
        role: profile.role as 'admin' | 'user',
        createdAt: profile.created_at,
    }
    localStorage.setItem('currentUser', JSON.stringify(currentUser))
    return currentUser
}

export async function authRegister(username: string, email: string, password: string) {
    // Kullanıcı adı benzersizliğini kontrol et
    const { data: existing } = await supabase
        .from('profiles')
        .select('id')
        .eq('username', username)
        .maybeSingle()

    if (existing) throw new Error('Bu kullanıcı adı zaten alınmış')

    const { data, error } = await supabase.auth.signUp({
        email,
        password,
        options: { data: { username } },
    })

    if (error) {
        if (error.message.includes('already registered')) throw new Error('Bu e-posta zaten kayıtlı')
        throw new Error(error.message)
    }
    if (!data.user) throw new Error('Kullanıcı oluşturulamadı')

    // Trigger profili oluşturur; biz sadece currentUser'ı saklıyoruz
    const currentUser = {
        id: data.user.id,
        username,
        email,
        role: 'user' as const,
        createdAt: new Date().toISOString().slice(0, 10),
    }
    localStorage.setItem('currentUser', JSON.stringify(currentUser))
    return currentUser
}

export async function authLogout() {
    await supabase.auth.signOut()
    localStorage.removeItem('currentUser')
}

// Şifre sıfırlama e-postası gönderir (Supabase e-posta şablonu ile)
export async function authResetPassword(email: string) {
    const { error } = await supabase.auth.resetPasswordForEmail(email, {
        redirectTo: `${window.location.origin}/login`,
    })
    if (error) throw new Error(error.message)
}
