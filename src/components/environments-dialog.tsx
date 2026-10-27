import { useState } from 'react'
import { Pencil, Plus, Trash2 } from 'lucide-react'
import { KeyValueEditor } from '@/components/key-value-editor'
import { NameDialog } from '@/components/name-dialog'
import { Button } from '@/components/ui/button'
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from '@/components/ui/dialog'
import { ScrollArea } from '@/components/ui/scroll-area'
import { cn } from '@/lib/utils'
import { useAppStore } from '@/store/app-store'

interface EnvironmentsDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
}

type NamePrompt = { mode: 'create' } | { mode: 'rename'; id: string; name: string } | null

export function EnvironmentsDialog({ open, onOpenChange }: EnvironmentsDialogProps) {
  const environments = useAppStore((s) => s.environments)
  const createEnvironment = useAppStore((s) => s.createEnvironment)
  const renameEnvironment = useAppStore((s) => s.renameEnvironment)
  const deleteEnvironment = useAppStore((s) => s.deleteEnvironment)
  const setVariables = useAppStore((s) => s.setEnvironmentVariables)
  const [selectedId, setSelectedId] = useState<string | null>(null)
  const [prompt, setPrompt] = useState<NamePrompt>(null)

  const selected = environments.find((e) => e.id === selectedId) ?? environments[0] ?? null

  return (
    <>
      <Dialog open={open} onOpenChange={onOpenChange}>
        <DialogContent className="sm:max-w-3xl">
          <DialogHeader>
            <DialogTitle>Environments</DialogTitle>
            <DialogDescription>
              Use <code className="font-mono">{'{{variable}}'}</code> in the URL, params, headers and body.
            </DialogDescription>
          </DialogHeader>
          <div className="grid min-h-72 gap-4 sm:grid-cols-[200px_1fr]">
            <div className="flex flex-col gap-2 sm:border-r sm:pr-3">
              <Button variant="outline" size="sm" onClick={() => setPrompt({ mode: 'create' })}>
                <Plus /> New environment
              </Button>
              <ul className="flex flex-col gap-0.5" aria-label="Environments">
                {environments.map((env) => (
                  <li key={env.id} className="group flex items-center gap-1">
                    <button
                      type="button"
                      aria-current={env.id === selected?.id}
                      onClick={() => setSelectedId(env.id)}
                      className={cn(
                        'flex-1 truncate rounded-md px-2 py-1 text-left text-sm outline-none hover:bg-muted focus-visible:ring-3 focus-visible:ring-ring/50',
                        env.id === selected?.id && 'bg-muted font-medium',
                      )}
                    >
                      {env.name}
                    </button>
                    <Button
                      variant="ghost"
                      size="icon-xs"
                      aria-label={`Rename ${env.name}`}
                      onClick={() => setPrompt({ mode: 'rename', id: env.id, name: env.name })}
                    >
                      <Pencil />
                    </Button>
                    <Button
                      variant="ghost"
                      size="icon-xs"
                      aria-label={`Delete ${env.name}`}
                      onClick={() => {
                        if (window.confirm(`Delete environment "${env.name}"?`)) deleteEnvironment(env.id)
                      }}
                    >
                      <Trash2 />
                    </Button>
                  </li>
                ))}
              </ul>
              {environments.length === 0 && (
                <p className="text-sm text-muted-foreground">No environments yet.</p>
              )}
            </div>
            <ScrollArea className="max-h-[55vh]">
              {selected ? (
                <div className="flex flex-col gap-2 pr-3">
                  <h3 className="text-sm font-medium">{selected.name} variables</h3>
                  <KeyValueEditor
                    key={selected.id}
                    label={`${selected.name} variables`}
                    keyPlaceholder="Variable"
                    rows={selected.variables}
                    onChange={(rows) => setVariables(selected.id, rows)}
                  />
                </div>
              ) : (
                <p className="text-sm text-muted-foreground">Create an environment to add variables.</p>
              )}
            </ScrollArea>
          </div>
        </DialogContent>
      </Dialog>
      <NameDialog
        open={prompt !== null}
        onOpenChange={(o) => !o && setPrompt(null)}
        title={prompt?.mode === 'rename' ? 'Rename environment' : 'New environment'}
        label="Name"
        initialValue={prompt?.mode === 'rename' ? prompt.name : ''}
        submitLabel={prompt?.mode === 'rename' ? 'Rename' : 'Create'}
        onSubmit={(name) => {
          if (prompt?.mode === 'rename') renameEnvironment(prompt.id, name)
          else setSelectedId(createEnvironment(name).id)
        }}
      />
    </>
  )
}
