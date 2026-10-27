import CodeMirror from '@uiw/react-codemirror'
import { json } from '@codemirror/lang-json'
import { AlertCircle } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { prettyJson, tryParseJson } from '@/core/request-engine.ts'
import { useIsDark } from '@/lib/use-is-dark'
import { useAppStore } from '@/store/app-store'
import type { BodyType } from '@/shared/types.ts'

const BODY_TYPES: { value: BodyType; label: string }[] = [
  { value: 'none', label: 'None' },
  { value: 'json', label: 'JSON' },
  { value: 'text', label: 'Text' },
]

const jsonExtensions = [json()]

export function BodyEditor() {
  const method = useAppStore((s) => s.draft.method)
  const bodyType = useAppStore((s) => s.draft.bodyType)
  const body = useAppStore((s) => s.draft.body)
  const updateDraft = useAppStore((s) => s.updateDraft)
  const isDark = useIsDark()

  const invalidJson = bodyType === 'json' && body.trim() !== '' && !tryParseJson(body).ok

  return (
    <div className="flex flex-col gap-2">
      <div className="flex flex-wrap items-center gap-2">
        <Select
          items={BODY_TYPES}
          value={bodyType}
          onValueChange={(v) => v !== null && updateDraft({ bodyType: v })}
        >
          <SelectTrigger aria-label="Body type" size="sm" className="w-28">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            {BODY_TYPES.map((t) => (
              <SelectItem key={t.value} value={t.value}>
                {t.label}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
        {bodyType === 'json' && (
          <Button
            variant="outline"
            size="sm"
            disabled={invalidJson || body.trim() === ''}
            onClick={() => {
              const pretty = prettyJson(body)
              if (pretty !== null) updateDraft({ body: pretty })
            }}
          >
            Beautify
          </Button>
        )}
        {invalidJson && (
          <span role="status" className="flex items-center gap-1 text-xs text-destructive">
            <AlertCircle className="size-3.5" /> Invalid JSON
          </span>
        )}
        {method === 'GET' && bodyType !== 'none' && (
          <span className="text-xs text-muted-foreground">The body is ignored for GET requests.</span>
        )}
      </div>
      {bodyType !== 'none' && (
        <div className="overflow-hidden rounded-lg border">
          <CodeMirror
            aria-label="Request body"
            value={body}
            onChange={(value) => updateDraft({ body: value })}
            extensions={bodyType === 'json' ? jsonExtensions : []}
            theme={isDark ? 'dark' : 'light'}
            minHeight="160px"
            basicSetup={{ foldGutter: false }}
          />
        </div>
      )}
    </div>
  )
}
