import { randomUUID } from 'crypto'
import bcrypt from 'bcryptjs'
import sql from './index'

export interface User {
  id: string
  username: string
  nickname: string
  avatar: string
  chips_balance: number
  games_played: number
  games_won: number
  created_at: string
}

const SALT_ROUNDS = 10

export class UserRepository {
  async login(username: string, password: string): Promise<User> {
    const rows = await sql`SELECT * FROM users WHERE username = ${username}`
    const existing = rows[0]

    if (!existing) throw new Error('账号不存在或密码错误')
    const match = await bcrypt.compare(password, existing.password_hash)
    if (!match) throw new Error('账号不存在或密码错误')
    const { password_hash: _, ...user } = existing
    return user as User
  }

  // ===== 管理后台 =====

  async listUsers(): Promise<User[]> {
    const rows = await sql`SELECT * FROM users ORDER BY created_at DESC`
    return rows.map(({ password_hash: _, ...u }) => u as User)
  }

  async findByUsername(username: string): Promise<User | undefined> {
    const rows = await sql`SELECT * FROM users WHERE username = ${username}`
    if (!rows[0]) return undefined
    const { password_hash: _, ...user } = rows[0]
    return user as User
  }

  async createUser(username: string, password: string, chips = 50000): Promise<User> {
    if (!/^[a-zA-Z0-9_\u4e00-\u9fa5]{2,20}$/.test(username)) {
      throw new Error('账户名需为2-20位字母/数字/下划线/中文')
    }
    if (typeof password !== 'string' || password.length < 4) {
      throw new Error('密码至少4位')
    }
    if (await this.findByUsername(username)) {
      throw new Error('账户名已存在')
    }
    const id = randomUUID()
    const hash = await bcrypt.hash(password, SALT_ROUNDS)
    await sql`
      INSERT INTO users (id, username, password_hash, nickname, avatar, chips_balance)
      VALUES (${id}, ${username}, ${hash}, ${username}, '', ${Math.max(0, Math.floor(chips) || 0)})
    `
    const user = await this.findById(id)
    return user!
  }

  async deleteUser(id: string): Promise<void> {
    await sql`DELETE FROM users WHERE id = ${id}`
  }

  async resetPassword(id: string, password: string): Promise<void> {
    if (typeof password !== 'string' || password.length < 4) {
      throw new Error('密码至少4位')
    }
    const hash = await bcrypt.hash(password, SALT_ROUNDS)
    await sql`UPDATE users SET password_hash = ${hash} WHERE id = ${id}`
  }

  async setChips(id: string, chips: number): Promise<void> {
    await sql`UPDATE users SET chips_balance = ${Math.max(0, Math.floor(chips) || 0)} WHERE id = ${id}`
  }

  // ===== 登录记录 =====

  async logLogin(userId: string, username: string, ip: string, userAgent: string): Promise<void> {
    await sql`
      INSERT INTO login_logs (user_id, username, ip, user_agent)
      VALUES (${userId}, ${username}, ${ip}, ${userAgent.slice(0, 200)})
    `
  }

  async listLoginLogs(limit = 100) {
    return await sql`
      SELECT id, username, ip, user_agent, created_at
      FROM login_logs ORDER BY created_at DESC LIMIT ${limit}
    `
  }

  // ===== 筹码/对局记录 =====

  async logChips(userId: string, username: string, change: number, balanceAfter: number, reason: string, detail = ''): Promise<void> {
    await sql`
      INSERT INTO chip_logs (user_id, username, change, balance_after, reason, detail)
      VALUES (${userId}, ${username}, ${change}, ${balanceAfter}, ${reason}, ${detail})
    `
  }

  async listChipLogs(limit = 100) {
    return await sql`
      SELECT id, username, change, balance_after, reason, detail, created_at
      FROM chip_logs ORDER BY created_at DESC LIMIT ${limit}
    `
  }

  // ===== 全局设置 =====

  async getSetting(key: string): Promise<string | undefined> {
    const rows = await sql`SELECT value FROM app_settings WHERE key = ${key}`
    return rows[0]?.value
  }

  async setSetting(key: string, value: string): Promise<void> {
    await sql`
      INSERT INTO app_settings (key, value) VALUES (${key}, ${value})
      ON CONFLICT (key) DO UPDATE SET value = ${value}
    `
  }

  async findById(id: string): Promise<User | undefined> {
    const rows = await sql`SELECT * FROM users WHERE id = ${id}`
    if (!rows[0]) return undefined
    const { password_hash: _, ...user } = rows[0]
    return user as User
  }

  async updateAvatar(id: string, avatar: string): Promise<void> {
    await sql`UPDATE users SET avatar = ${avatar} WHERE id = ${id}`
  }

  async updateChips(id: string, chips: number): Promise<void> {
    await sql`UPDATE users SET chips_balance = ${chips} WHERE id = ${id}`
  }

  async addChips(id: string, delta: number): Promise<void> {
    await sql`UPDATE users SET chips_balance = chips_balance + ${delta} WHERE id = ${id}`
  }

  async incrementGames(id: string): Promise<void> {
    await sql`UPDATE users SET games_played = games_played + 1 WHERE id = ${id}`
  }

  async incrementWins(id: string): Promise<void> {
    await sql`UPDATE users SET games_won = games_won + 1 WHERE id = ${id}`
  }
}
