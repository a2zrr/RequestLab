import { useState, type ReactNode } from 'react'
import CodeMirror from '@uiw/react-codemirror'
import { json } from '@codemirror/lang-json'
import { AlertTriangle, Check, Copy, Loader2, XCircle } from 'lucide-react'
import { TimingView } from '@/components/timing-view'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { formatBytes, prettyJson } from '@/core/request-engine.ts'
import { statusBadgeClass } from '@/lib/http-styles'
import { useIsDark } from '@/lib/use-is-dark'
import { cn } from '@/lib/utils'
import { useAppStore, type SendResult } from '@/store/app-store'

const jsonExtensions = [json()]

export function ResponsePanel() {
  const status = useAppStore((s) => s.responseStatus)
  const result = useAppStore((s) => s.result)

  return (
    <section aria-label="Response" aria-busy={status === 'loading'} className="flex h-full min-h-0 flex-col">
      {status === 'loading' ? (
        <Centered>
          <Loader2 className="size-5 animate-spin" /> Sending request…
        </Centered>
      ) : status === 'idle' || !result ? (
        <Centered>Send a request to see the response here.</Centered>
      ) : (
        <ResponseView result={result} />
      )}
    </section>
  )
}

function Centered({ children }: { children: ReactNode }) {
  return (
    <div className="flex flex-1 items-center justify-center gap-2 p-6 text-sm text-muted-foreground">
      {children}
    </div>
  )
}

function ResponseView({ result }: { result: SendResult }) {
  const headers = Object.entries(result.headers)

  return (
    <div className="flex min-h-0 flex-1 flex-col">
      <div className="flex flex-wrap items-center gap-x-3 gap-y-1 border-b px-3 py-2 text-xs">
        <Badge className={cn('font-mono', statusBadgeClass(result.status))}>
          {result.status === 0 ? 'Error' : `${result.status} ${result.statusText}`.trim()}
        </Badge>
        {!result.error && (
          <>
            <span>
              <span className="text-muted-foreground">Time</span> <span className="font-mono">{result.durationMs} ms</span>
            </span>
            <span>
              <span className="text-muted-foreground">Size</span>{' '}
              <span className="font-mono">{formatBytes(result.sizeBytes)}</span>
            </span>
          </>
        )}
        {result.truncated && <span className="text-amber-600 dark:text-amber-400">Body truncated</span>}
        {result.missingVariables.length > 0 && (
          <span role="status" className="flex items-center gap-1 text-amber-600 dark:text-amber-400">
            <AlertTriangle className="size-3.5" />
            Missing variables: {result.missingVariables.map((v) => `{{${v}}}`).join(', ')}
          </span>
        )}
      </div>

      {result.error ? (
        <div
          role="alert"
          className="m-3 flex items-start gap-2 rounded-lg border border-destructive/40 bg-destructive/10 p-3 text-sm text-destructive"
        >
          <XCircle className="mt-0.5 size-4 shrink-0" />
          <span>{result.error}</span>
        </div>
      ) : (
        <Tabs defaultValue="body" className="min-h-0 flex-1 p-3">
          <TabsList>
            <TabsTrigger value="body">Body</TabsTrigger>
            <TabsTrigger value="headers">Headers ({headers.length})</TabsTrigger>
            <TabsTrigger value="timing">Timing</TabsTrigger>
          </TabsList>
          <TabsContent value="body" className="min-h-0">
            <BodyView body={result.body} />
          </TabsContent>
          <TabsContent value="headers" className="min-h-0 overflow-auto">
            <table className="w-full text-left font-mono text-xs">
              <thead className="text-muted-foreground">
                <tr>
                  <th className="border-b px-2 py-1 font-medium">Name</th>
                  <th className="border-b px-2 py-1 font-medium">Value</th>
                </tr>
              </thead>
              <tbody>
                {headers.map(([k, v]) => (
                  <tr key={k} className="align-top">
                    <td className="border-b px-2 py-1 whitespace-nowrap">{k}</td>
                    <td className="border-b px-2 py-1 break-all">{v}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </TabsContent>
          <TabsContent value="timing" className="min-h-0 overflow-auto">
            <TimingView />
          </TabsContent>
        </Tabs>
      )}
    </div>
  )
}

function BodyView({ body }: { body: string }) {
  const pretty = prettyJson(body)
  const [mode, setMode] = useState<'pretty' | 'raw'>('pretty')
  const [copied, setCopied] = useState(false)
  const isDark = useIsDark()
  const showPretty = pretty !== null && mode === 'pretty'
  const text = showPretty ? pretty : body

  const copy = async () => {
    try {
      await navigator.clipboard.writeText(text)
      setCopied(true)
      setTimeout(() => setCopied(false), 1500)
    } catch {
      // Clipboard unavailable (e.g. insecure context); nothing useful to do.
    }
  }

  return (
    <div className="flex h-full min-h-0 flex-col gap-2">
      <div className="flex items-center gap-2">
        {pretty !== null && (
          <div role="group" aria-label="Body format" className="flex rounded-lg border p-0.5">
            {(['pretty', 'raw'] as const).map((m) => (
              <Button
                key={m}
                size="xs"
                variant={mode === m ? 'secondary' : 'ghost'}
                aria-pressed={mode === m}
                onClick={() => setMode(m)}
              >
                {m === 'pretty' ? 'Pretty' : 'Raw'}
              </Button>
            ))}
          </div>
        )}
        <Button variant="ghost" size="icon-sm" className="ml-auto" aria-label="Copy response body" onClick={copy}>
          {copied ? <Check /> : <Copy />}
        </Button>
      </div>
      <div className="min-h-0 flex-1 overflow-hidden rounded-lg border">
        <CodeMirror
          aria-label="Response body"
          value={text}
          readOnly
          editable={false}
          extensions={showPretty ? jsonExtensions : []}
          theme={isDark ? 'dark' : 'light'}
          height="100%"
          className="h-full"
          basicSetup={{ foldGutter: showPretty, highlightActiveLine: false }}
        />
      </div>
    </div>
  )
}
