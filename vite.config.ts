import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import tailwindcss from '@tailwindcss/vite'
import fs from 'node:fs'
import path from 'node:path'

const USER_RESOURCES = ['gelen-isler', 'giden-isler', 'faturalar']

function fileApiPlugin() {
    const dataDir = path.resolve('data')

    if (!fs.existsSync(dataDir)) {
        fs.mkdirSync(dataDir)
    }

    const ensureFile = (filePath: string) => {
        if (!fs.existsSync(filePath)) {
            fs.writeFileSync(filePath, '[]', 'utf-8')
        }
    }

    const ensureUserDir = (username: string) => {
        const userDir = path.join(dataDir, username)
        if (!fs.existsSync(userDir)) {
            fs.mkdirSync(userDir)
            for (const res of USER_RESOURCES) {
                fs.writeFileSync(path.join(userDir, `${res}.txt`), '[]', 'utf-8')
            }
        }
    }

    return {
        name: 'file-api',
        configureServer(server: any) {
            server.middlewares.use((req: any, res: any, next: () => void) => {
                const url = (req.url as string).split('?')[0]
                if (!url.startsWith('/api/')) return next()

                res.setHeader('Content-Type', 'application/json')

                // POST /api/auth/login
                if (url === '/api/auth/login' && req.method === 'POST') {
                    let body = ''
                    req.on('data', (chunk: Buffer) => { body += chunk.toString() })
                    req.on('end', () => {
                        try {
                            const { email, password } = JSON.parse(body)
                            const usersFile = path.join(dataDir, 'kullanicilar.txt')
                            ensureFile(usersFile)
                            const users: any[] = JSON.parse(fs.readFileSync(usersFile, 'utf-8'))
                            const user = users.find((u: any) => u.email === email && u.password === password)
                            if (!user) {
                                res.statusCode = 401
                                res.end(JSON.stringify({ error: 'E-posta veya şifre hatalı' }))
                                return
                            }
                            ensureUserDir(user.username)
                            const { password: _p, ...safeUser } = user
                            res.end(JSON.stringify(safeUser))
                        } catch (e) {
                            res.statusCode = 500
                            res.end(JSON.stringify({ error: String(e) }))
                        }
                    })
                    return
                }

                // POST /api/auth/register
                if (url === '/api/auth/register' && req.method === 'POST') {
                    let body = ''
                    req.on('data', (chunk: Buffer) => { body += chunk.toString() })
                    req.on('end', () => {
                        try {
                            const { username, email, password } = JSON.parse(body)
                            const usersFile = path.join(dataDir, 'kullanicilar.txt')
                            ensureFile(usersFile)
                            const users: any[] = JSON.parse(fs.readFileSync(usersFile, 'utf-8'))
                            if (users.find((u: any) => u.email === email)) {
                                res.statusCode = 409
                                res.end(JSON.stringify({ error: 'Bu e-posta zaten kayıtlı' }))
                                return
                            }
                            if (users.find((u: any) => u.username === username)) {
                                res.statusCode = 409
                                res.end(JSON.stringify({ error: 'Bu kullanıcı adı zaten alınmış' }))
                                return
                            }
                            const newUser = {
                                id: Date.now().toString(),
                                username,
                                email,
                                password,
                                role: 'user',
                                createdAt: new Date().toISOString().slice(0, 10),
                            }
                            users.push(newUser)
                            fs.writeFileSync(usersFile, JSON.stringify(users, null, 2), 'utf-8')
                            ensureUserDir(username)
                            const { password: _p, ...safeUser } = newUser
                            res.statusCode = 201
                            res.end(JSON.stringify(safeUser))
                        } catch (e) {
                            res.statusCode = 500
                            res.end(JSON.stringify({ error: String(e) }))
                        }
                    })
                    return
                }

                // POST /api/auth/reset-password
                if (url === '/api/auth/reset-password' && req.method === 'POST') {
                    let body = ''
                    req.on('data', (chunk: Buffer) => { body += chunk.toString() })
                    req.on('end', () => {
                        try {
                            const { email, newPassword } = JSON.parse(body)
                            const usersFile = path.join(dataDir, 'kullanicilar.txt')
                            ensureFile(usersFile)
                            const users: any[] = JSON.parse(fs.readFileSync(usersFile, 'utf-8'))
                            const idx = users.findIndex((u: any) => u.email === email)
                            if (idx === -1) {
                                res.statusCode = 404
                                res.end(JSON.stringify({ error: 'Bu e-posta ile kayıtlı hesap bulunamadı' }))
                                return
                            }
                            users[idx].password = newPassword
                            fs.writeFileSync(usersFile, JSON.stringify(users, null, 2), 'utf-8')
                            res.end(JSON.stringify({ ok: true }))
                        } catch (e) {
                            res.statusCode = 500
                            res.end(JSON.stringify({ error: String(e) }))
                        }
                    })
                    return
                }

                // /api/{username}/{resource}[/{id}]
                const parts = url.replace('/api/', '').split('/')
                const username = parts[0]
                const resource = parts[1]
                const id = parts[2]
                if (!username || !resource) return next()

                const filePath = path.join(dataDir, username, `${resource}.txt`)
                ensureUserDir(username)
                ensureFile(filePath)

                const handle = (body: string) => {
                    try {
                        const data: any[] = JSON.parse(fs.readFileSync(filePath, 'utf-8'))

                        if (req.method === 'GET') {
                            res.end(JSON.stringify(data))
                        } else if (req.method === 'POST') {
                            const item = { ...JSON.parse(body), id: Date.now().toString() }
                            data.push(item)
                            fs.writeFileSync(filePath, JSON.stringify(data, null, 2), 'utf-8')
                            res.statusCode = 201
                            res.end(JSON.stringify(item))
                        } else if (req.method === 'PUT' && id) {
                            const idx = data.findIndex((d: any) => d.id === id)
                            if (idx === -1) {
                                res.statusCode = 404
                                res.end(JSON.stringify({ error: 'Not found' }))
                                return
                            }
                            data[idx] = { ...JSON.parse(body), id }
                            fs.writeFileSync(filePath, JSON.stringify(data, null, 2), 'utf-8')
                            res.end(JSON.stringify(data[idx]))
                        } else if (req.method === 'DELETE' && id) {
                            const filtered = data.filter((d: any) => d.id !== id)
                            fs.writeFileSync(filePath, JSON.stringify(filtered, null, 2), 'utf-8')
                            res.end(JSON.stringify({ ok: true }))
                        } else {
                            next()
                        }
                    } catch (e) {
                        res.statusCode = 500
                        res.end(JSON.stringify({ error: String(e) }))
                    }
                }

                if (req.method === 'GET' || req.method === 'DELETE') {
                    handle('')
                } else {
                    let body = ''
                    req.on('data', (chunk: Buffer) => { body += chunk.toString() })
                    req.on('end', () => handle(body))
                }
            })
        }
    }
}

export default defineConfig({
    plugins: [react(), tailwindcss(), fileApiPlugin()],
})
