import { useState } from 'react'
import { ChevronRight, FolderPlus, MoreHorizontal, Plus } from 'lucide-react'
import { MethodBadge } from '@/components/method-badge'
import { NameDialog } from '@/components/name-dialog'
import { Button } from '@/components/ui/button'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
import { ScrollArea } from '@/components/ui/scroll-area'
import { cn } from '@/lib/utils'
import { useAppStore } from '@/store/app-store'
import type { Collection } from '@/shared/types.ts'

type NamePrompt = { mode: 'create' } | { mode: 'rename'; id: string; name: string } | null

export function Sidebar() {
  const collections = useAppStore((s) => s.collections)
  const createCollection = useAppStore((s) => s.createCollection)
  const renameCollection = useAppStore((s) => s.renameCollection)
  const newRequest = useAppStore((s) => s.newRequest)
  const [prompt, setPrompt] = useState<NamePrompt>(null)

  return (
    <nav aria-label="Collections" className="flex h-full flex-col">
      <div className="flex gap-2 border-b p-2">
        <Button variant="outline" size="sm" className="flex-1" onClick={() => setPrompt({ mode: 'create' })}>
          <FolderPlus /> New collection
        </Button>
        <Button variant="ghost" size="icon-sm" aria-label="New request" onClick={newRequest}>
          <Plus />
        </Button>
      </div>
      <ScrollArea className="min-h-0 flex-1">
        {collections.length === 0 ? (
          <div className="flex flex-col items-center gap-3 p-6 text-center text-sm text-muted-foreground">
            <p>No collections yet. Group and save your requests in collections.</p>
            <Button size="sm" onClick={() => setPrompt({ mode: 'create' })}>
              Create a collection
            </Button>
          </div>
        ) : (
          <ul className="flex flex-col gap-0.5 p-2">
            {collections.map((col) => (
              <CollectionGroup
                key={col.id}
                collection={col}
                onRename={() => setPrompt({ mode: 'rename', id: col.id, name: col.name })}
              />
            ))}
          </ul>
        )}
      </ScrollArea>
      <NameDialog
        open={prompt !== null}
        onOpenChange={(o) => !o && setPrompt(null)}
        title={prompt?.mode === 'rename' ? 'Rename collection' : 'New collection'}
        label="Name"
        initialValue={prompt?.mode === 'rename' ? prompt.name : ''}
        submitLabel={prompt?.mode === 'rename' ? 'Rename' : 'Create'}
        onSubmit={(name) =>
          prompt?.mode === 'rename' ? renameCollection(prompt.id, name) : createCollection(name)
        }
      />
    </nav>
  )
}

function CollectionGroup({ collection, onRename }: { collection: Collection; onRename: () => void }) {
  const activeRequestId = useAppStore((s) => (s.draftCollectionId === collection.id ? s.draft.id : null))
  const openRequest = useAppStore((s) => s.openRequest)
  const deleteCollection = useAppStore((s) => s.deleteCollection)
  const duplicateRequest = useAppStore((s) => s.duplicateRequest)
  const deleteRequest = useAppStore((s) => s.deleteRequest)
  const [expanded, setExpanded] = useState(true)

  return (
    <li>
      <div className="flex items-center gap-1">
        <button
          type="button"
          aria-expanded={expanded}
          onClick={() => setExpanded((e) => !e)}
          className="flex min-w-0 flex-1 items-center gap-1 rounded-md px-1 py-1 text-left text-sm font-medium outline-none hover:bg-muted focus-visible:ring-3 focus-visible:ring-ring/50"
        >
          <ChevronRight className={cn('size-4 shrink-0 transition-transform', expanded && 'rotate-90')} />
          <span className="truncate">{collection.name}</span>
          <span className="ml-auto pr-1 text-xs text-muted-foreground">{collection.requests.length}</span>
        </button>
        <DropdownMenu>
          <DropdownMenuTrigger
            render={<Button variant="ghost" size="icon-xs" aria-label={`${collection.name} actions`} />}
          >
            <MoreHorizontal />
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end">
            <DropdownMenuItem onClick={onRename}>Rename</DropdownMenuItem>
            <DropdownMenuItem
              variant="destructive"
              onClick={() => {
                if (window.confirm(`Delete collection "${collection.name}" and its requests?`)) {
                  deleteCollection(collection.id)
                }
              }}
            >
              Delete
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </div>
      {expanded && (
        <ul className="ml-3 flex flex-col gap-0.5 border-l pl-2">
          {collection.requests.length === 0 && (
            <li className="px-2 py-1 text-xs text-muted-foreground">No requests</li>
          )}
          {collection.requests.map((req) => (
            <li key={req.id} className="flex items-center gap-1">
              <button
                type="button"
                aria-current={req.id === activeRequestId}
                onClick={() => openRequest(collection.id, req.id)}
                className={cn(
                  'flex min-w-0 flex-1 items-center gap-1 rounded-md px-2 py-1 text-left text-sm outline-none hover:bg-muted focus-visible:ring-3 focus-visible:ring-ring/50',
                  req.id === activeRequestId && 'bg-muted font-medium',
                )}
              >
                <MethodBadge method={req.method} />
                <span className="truncate">{req.name}</span>
              </button>
              <DropdownMenu>
                <DropdownMenuTrigger
                  render={<Button variant="ghost" size="icon-xs" aria-label={`${req.name} actions`} />}
                >
                  <MoreHorizontal />
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end">
                  <DropdownMenuItem onClick={() => duplicateRequest(collection.id, req.id)}>
                    Duplicate
                  </DropdownMenuItem>
                  <DropdownMenuItem variant="destructive" onClick={() => deleteRequest(collection.id, req.id)}>
                    Delete
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
            </li>
          ))}
        </ul>
      )}
    </li>
  )
}
