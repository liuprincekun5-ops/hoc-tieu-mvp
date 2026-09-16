import afterTemplateJson from '../data/after-template.json'
import catalogJson from '../data/catalog.json'
import mapJson from '../data/xiao-g-8.json'
import type { AfterTemplate, TieuCatalog, TieuMap, TieuPiece } from '../types/tieu'

const BASE = new URL('data/', import.meta.env.BASE_URL).pathname.replace(/\/$/, '')

async function fetchJson<T>(path: string): Promise<T> {
  const res = await fetch(`${BASE}/${path}`)
  if (!res.ok) throw new Error(`Không tải được ${path}: ${res.status}`)
  return res.json() as Promise<T>
}

export function loadCatalog(): Promise<TieuCatalog> {
  return Promise.resolve(catalogJson as TieuCatalog)
}

export function loadMap(): Promise<TieuMap> {
  return Promise.resolve(mapJson as TieuMap)
}

export function loadAfterTemplate(): Promise<AfterTemplate> {
  return Promise.resolve(afterTemplateJson as AfterTemplate)
}

export function loadLesson(file: string): Promise<TieuPiece> {
  const p = file.replace(/^\.?\/?/, '')
  return fetchJson(p.startsWith('lessons/') ? p : `lessons/${p}`)
}

export function loadDemoPiece(): Promise<TieuPiece> {
  return fetchJson('jobs/job_demo_01.exported.json')
}

export function isLessonUnlocked(
  lessonIds: string[],
  lessonId: string,
  completedIds: string[]
): boolean {
  const i = lessonIds.indexOf(lessonId)
  if (i < 0) return false
  if (i === 0) return true
  return completedIds.includes(lessonIds[i - 1])
}

export function nextLessonId(
  lessonIds: string[],
  currentId: string
): string | null {
  const i = lessonIds.indexOf(currentId)
  if (i < 0 || i >= lessonIds.length - 1) return null
  return lessonIds[i + 1]
}

export function keyLabelVi(key: string): string {
  const map: Record<string, string> = {
    rest: 'Hơi',
    blow: 'Thổi',
    Re: 'Rê',
    Mi: 'Mi',
    Fi: 'Fi',
    Sol: 'Sol',
    La: 'La',
    Si: 'Si',
    Re2: "Rê'",
  }
  return map[key] ?? key
}
