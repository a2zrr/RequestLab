import { useEffect, useState } from 'react'
import { Loader2, Save, Send } from 'lucide-react'
import { BodyEditor } from '@/components/body-editor'
import { KeyValueEditor } from '@/components/key-value-editor'
import { SaveDialog } from '@/components/save-dialog'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { countEnabled } from '@/lib/key-values'
import { METHODS, methodTextClass } from '@/lib/http-styles'
import { cn } from '@/lib/utils'
import { useAppStore } from '@/store/app-store'

const COMMON_HEADERS = ['Content-Type', 'Authorization', 'Accept', 'User-Agent', 'Cache-Control']
const methodItems = METHODS.map((m) => ({ value: m, label: m }))

export function RequestEditor() {
  const draft = useAppStore((s) => s.draft)
  const draftCollectionId = useAppStore((s) => s.draftCollectionId)
  const dirty = useAppStore((s) => s.dirty)
  const loading = useAppStore((s) => s.responseStatus === 'loading')
  const updateDraft = useAppStore((s) => s.updateDraft)
  const send = useAppStore((s) => s.send)
  const cancel = useAppStore((s) => s.cancel)
  const saveDraft = useAppStore((s) => s.saveDraft)
  const [saveOpen, setSaveOpen] = useState(false)

  useEffect(() => {
    // Capture phase so the shortcut also works inside CodeMirror.
    const onKeyDown = (e: KeyboardEvent) => {
      if (e.key !== 'Enter' || !(e.ctrlKey || e.metaKey)) return
      e.preventDefault()
      e.stopPropagation()
      const state = useAppStore.getState()
      if (state.responseStatus !== 'loading') void state.send()
    }
    window.addEventListener('keydown', onKeyDown, true)
    return () => window.removeEventListener('keydown', onKeyDown, true)
  }, [])

  const onSave = () => (draftCollectionId ? saveDraft() : setSaveOpen(true))
  const paramsCount = countEnabled(draft.params)
  const headersCount = countEnabled(draft.headers)

  return (
    <section aria-label="Request" className="flex flex-col gap-3 p-3">
      <div className="flex items-center gap-2">
        <Input
          aria-label="Request name"
          value={draft.name}
          onChange={(e) => updateDraft({ name: e.target.value })}
          className="h-8 max-w-md border-transparent px-1 font-medium shadow-none hover:border-input"
        />
        {dirty && (
          <span className="size-2 shrink-0 rounded-full bg-amber-500" title="Unsaved changes">
            <span className="sr-only">Unsaved changes</span>
          </span>
        )}
      </div>

      <form
        className="flex flex-wrap items-center gap-2 sm:flex-nowrap"
        onSubmit={(e) => {
          e.preventDefault()
          if (!loading) void send()
        }}
      >
        <Select
          items={methodItems}
          value={draft.method}
          onValueChange={(v) => v !== null && updateDraft({ method: v })}
        >
          <SelectTrigger aria-label="HTTP method" className={cn('w-28 font-mono font-semibold', methodTextClass[draft.method])}>
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            {METHODS.map((m) => (
              <SelectItem key={m} value={m} className={cn('font-mono font-semibold', methodTextClass[m])}>
                {m}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
        <Input
          aria-label="URL"
          placeholder="https://api.example.com/resource or {{baseUrl}}/path"
          value={draft.url}
          onChange={(e) => updateDraft({ url: e.target.value })}
          className="h-8 min-w-0 flex-1 basis-60 font-mono text-sm"
        />
        {loading ? (
          <Button type="button" variant="destructive" onClick={cancel} className="w-24">
            <Loader2 className="animate-spin" /> Cancel
          </Button>
        ) : (
          <Button type="submit" className="w-24" title="Send (Ctrl/Cmd+Enter)">
            <Send /> Send
          </Button>
        )}
        <Button type="button" variant="outline" onClick={onSave}>
          <Save /> Save
        </Button>
      </form>

      <Tabs defaultValue="params">
        <TabsList>
          <TabsTrigger value="params">
            Params <CountBadge n={paramsCount} />
          </TabsTrigger>
          <TabsTrigger value="headers">
            Headers <CountBadge n={headersCount} />
          </TabsTrigger>
          <TabsTrigger value="body">Body</TabsTrigger>
        </TabsList>
        <TabsContent value="params">
          <KeyValueEditor
            key={`params-${draft.id}`}
            label="Query parameters"
            rows={draft.params}
            onChange={(params) => updateDraft({ params })}
          />
        </TabsContent>
        <TabsContent value="headers">
          <KeyValueEditor
            key={`headers-${draft.id}`}
            label="Headers"
            keyPlaceholder="Header"
            keySuggestionsId="common-headers"
            rows={draft.headers}
            onChange={(headers) => updateDraft({ headers })}
          />
          <datalist id="common-headers">
            {COMMON_HEADERS.map((h) => (
              <option key={h} value={h} />
            ))}
          </datalist>
        </TabsContent>
        <TabsContent value="body">
          <BodyEditor />
        </TabsContent>
      </Tabs>

      <SaveDialog open={saveOpen} onOpenChange={setSaveOpen} />
    </section>
  )
}

function CountBadge({ n }: { n: number }) {
  if (n === 0) return null
  return (
    <Badge variant="secondary" className="h-4 min-w-4 px-1 text-[10px]">
      {n}
    </Badge>
  )
}
