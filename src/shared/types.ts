export type HttpMethod = 'GET' | 'POST' | 'PUT' | 'DELETE'
export type BodyType = 'none' | 'json' | 'text'

export interface KeyValue {
  id: string
  key: string
  value: string
  enabled: boolean
}

export interface RequestDef {
  id: string
  name: string
  method: HttpMethod
  url: string
  params: KeyValue[]
  headers: KeyValue[]
  bodyType: BodyType
  body: string
}

export interface Collection {
  id: string
  name: string
  requests: RequestDef[]
}

export interface Environment {
  id: string
  name: string
  variables: KeyValue[]
}

export interface ProxyRequest {
  method: HttpMethod
  url: string
  headers: Record<string, string>
  body?: string
  timeoutMs?: number
}

export interface ProxyResponse {
  ok: boolean
  status: number
  statusText: string
  headers: Record<string, string>
  body: string
  sizeBytes: number
  durationMs: number
  truncated: boolean
  error?: string
}

export interface TimingEntry {
  at: number
  durationMs: number
  status: number
}
