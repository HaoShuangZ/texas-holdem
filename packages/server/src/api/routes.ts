import { Hono } from 'hono'
import { cors } from 'hono/cors'
import type { RoomManager } from '../rooms/room-manager'
import type { RoomConfig } from '@texas-holdem/shared'
import type { UserRepository } from '../db/user-repository'
import type { WsHandler } from '../ws/ws-handler'
import { signToken, verifyToken } from '../auth/jwt'
import { adminHtml } from '../admin-page'

export function createApi(roomManager: RoomManager, userRepo: UserRepository, wsHandler?: WsHandler) {
  const app = new Hono()

  app.use('*', cors())

  app.get('/api/health', (c) => c.json({ status: 'ok' }))

  // 管理后台页面
  app.get('/admin', (c) => c.html(adminHtml))

  // --- Auth（已关闭开放注册，账号由管理员在 /admin 创建） ---
  app.post('/api/auth/login', async (c) => {
    const { username, password, avatar } = await c.req.json<{
      username: string
      password: string
      avatar?: string
    }>()

    if (!username?.trim() || !password) {
      return c.json({ error: '请输入账户名和密码' }, 400)
    }

    try {
      const user = await userRepo.login(username.trim(), password)
      if (avatar) await userRepo.updateAvatar(user.id, avatar)
      const token = signToken({ userId: user.id, username: user.username })
      // 记录登录 IP（经 nginx 反代，真实 IP 在 X-Real-IP / X-Forwarded-For）
      const ip = c.req.header('x-real-ip')
        || c.req.header('x-forwarded-for')?.split(',')[0]?.trim()
        || ''
      const ua = c.req.header('user-agent') || ''
      await userRepo.logLogin(user.id, user.username, ip, ua)
      return c.json({ token, user, isNewUser: false })
    } catch (e: any) {
      return c.json({ error: e.message }, 401)
    }
  })

  // --- Admin（管理后台，密码保护） ---
  function requireAdmin(c: any): boolean {
    const expected = process.env.ADMIN_PASSWORD
    if (!expected) return false
    return c.req.header('x-admin-password') === expected
  }

  app.get('/api/admin/users', async (c) => {
    if (!requireAdmin(c)) return c.json({ error: 'Unauthorized' }, 401)
    return c.json({ users: await userRepo.listUsers() })
  })

  app.post('/api/admin/users', async (c) => {
    if (!requireAdmin(c)) return c.json({ error: 'Unauthorized' }, 401)
    try {
      const { username, password, chips } = await c.req.json<{
        username: string; password: string; chips?: number
      }>()
      const user = await userRepo.createUser(username?.trim() ?? '', password, chips)
      return c.json({ user })
    } catch (e: any) {
      return c.json({ error: e.message }, 400)
    }
  })

  app.post('/api/admin/users/:id/password', async (c) => {
    if (!requireAdmin(c)) return c.json({ error: 'Unauthorized' }, 401)
    try {
      const { password } = await c.req.json<{ password: string }>()
      await userRepo.resetPassword(c.req.param('id'), password)
      return c.json({ ok: true })
    } catch (e: any) {
      return c.json({ error: e.message }, 400)
    }
  })

  app.post('/api/admin/users/:id/chips', async (c) => {
    if (!requireAdmin(c)) return c.json({ error: 'Unauthorized' }, 401)
    try {
      const { chips } = await c.req.json<{ chips: number }>()
      const target = Math.max(0, Math.floor(chips) || 0)
      const before = await userRepo.findById(c.req.param('id'))
      await userRepo.setChips(c.req.param('id'), target)
      if (before && target !== before.chips_balance) {
        await userRepo.logChips(before.id, before.username, target - before.chips_balance, target, '管理员调整', '')
        // 若该玩家在对局中，同步对局内筹码，避免结算写回覆盖本次修改
        wsHandler?.applyAdminChips(before.id, target)
      }
      return c.json({ ok: true })
    } catch (e: any) {
      return c.json({ error: e.message }, 400)
    }
  })

  app.delete('/api/admin/users/:id', async (c) => {
    if (!requireAdmin(c)) return c.json({ error: 'Unauthorized' }, 401)
    await userRepo.deleteUser(c.req.param('id'))
    return c.json({ ok: true })
  })

  app.get('/api/admin/login-logs', async (c) => {
    if (!requireAdmin(c)) return c.json({ error: 'Unauthorized' }, 401)
    return c.json({ logs: await userRepo.listLoginLogs(100) })
  })

  app.get('/api/admin/chip-logs', async (c) => {
    if (!requireAdmin(c)) return c.json({ error: 'Unauthorized' }, 401)
    return c.json({ logs: await userRepo.listChipLogs(100) })
  })

  app.get('/api/admin/settings', async (c) => {
    if (!requireAdmin(c)) return c.json({ error: 'Unauthorized' }, 401)
    const maxBet = await userRepo.getSetting('max_bet')
    return c.json({ maxBet: maxBet ? Number(maxBet) : 0 })
  })

  app.post('/api/admin/settings', async (c) => {
    if (!requireAdmin(c)) return c.json({ error: 'Unauthorized' }, 401)
    try {
      const { maxBet } = await c.req.json<{ maxBet: number }>()
      const v = Math.max(0, Math.floor(Number(maxBet) || 0))
      if (v > 100000000) throw new Error('上限过大')
      await userRepo.setSetting('max_bet', String(v))
      return c.json({ ok: true, maxBet: v })
    } catch (e: any) {
      return c.json({ error: e.message }, 400)
    }
  })

  // --- Auth middleware helper ---
  function getUserFromToken(c: any): { userId: string; username: string } | null {
    const auth = c.req.header('Authorization')
    if (!auth?.startsWith('Bearer ')) return null
    return verifyToken(auth.slice(7))
  }

  // --- Get current user profile ---
  app.get('/api/auth/me', async (c) => {
    const payload = getUserFromToken(c)
    if (!payload) return c.json({ error: 'Unauthorized' }, 401)
    const user = await userRepo.findById(payload.userId)
    if (!user) return c.json({ error: 'User not found' }, 404)
    return c.json({ user })
  })

  // --- Update avatar ---
  app.put('/api/auth/avatar', async (c) => {
    const payload = getUserFromToken(c)
    if (!payload) return c.json({ error: 'Unauthorized' }, 401)
    const { avatar } = await c.req.json<{ avatar: string }>()
    await userRepo.updateAvatar(payload.userId, avatar)
    return c.json({ ok: true })
  })

  // --- Rooms ---
  app.post('/api/rooms', async (c) => {
    const payload = getUserFromToken(c)
    if (!payload) return c.json({ error: 'Unauthorized' }, 401)

    const body = await c.req.json<{ config: RoomConfig }>()
    const { config } = body

    if (!config) {
      return c.json({ error: 'config is required' }, 400)
    }

    const user = await userRepo.findById(payload.userId)
    if (!user) return c.json({ error: 'User not found' }, 404)

    const room = roomManager.createRoom(user.id, config)
    roomManager.setHostInfo(room.id, user.nickname, user.avatar)

    return c.json({
      roomId: room.id,
      code: room.code,
    })
  })

  app.get('/api/rooms/:code', (c) => {
    const code = c.req.param('code')
    const roomRef = roomManager.getRoomByCode(code)
    if (!roomRef) {
      return c.json({ error: 'Room not found' }, 404)
    }

    const state = roomManager.getRoomState(roomRef.id)
    if (!state) {
      return c.json({ error: 'Room not found' }, 404)
    }

    return c.json({
      code: state.code,
      playerCount: state.players.length,
      maxPlayers: state.config.maxPlayers,
      status: state.status,
    })
  })

  return app
}
