import { useState } from 'react'
import { Button } from '@/components/ui/button'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import { Input } from '@/components/ui/input'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { useAppStore } from '@/store/app-store'

const NEW = '__new__'

interface SaveDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
}

export function SaveDialog({ open, onOpenChange }: SaveDialogProps) {
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>{open && <SaveForm onDone={() => onOpenChange(false)} />}</DialogContent>
    </Dialog>
  )
}

function SaveForm({ onDone }: { onDone: () => void }) {
  const collections = useAppStore((s) => s.collections)
  const saveDraft = useAppStore((s) => s.saveDraft)
  const saveToNew = useAppStore((s) => s.saveDraftToNewCollection)
  const [target, setTarget] = useState<string>(collections[0]?.id ?? NEW)
  const [newName, setNewName] = useState('')

  const items = [
    ...collections.map((c) => ({ value: c.id, label: c.name })),
    { value: NEW, label: '+ New collection…' },
  ]
  const canSave = target !== NEW || newName.trim() !== ''

  return (
    <form
      className="grid gap-4"
      onSubmit={(e) => {
        e.preventDefault()
        if (!canSave) return
        if (target === NEW) saveToNew(newName.trim())
        else saveDraft(target)
        onDone()
      }}
    >
      <DialogHeader>
        <DialogTitle>Save request</DialogTitle>
        <DialogDescription>Choose a collection for this request.</DialogDescription>
      </DialogHeader>
      <div className="grid gap-1.5 text-sm">
        <span className="text-muted-foreground" id="save-collection-label">
          Collection
        </span>
        <Select items={items} value={target} onValueChange={(v) => v !== null && setTarget(v)}>
          <SelectTrigger aria-labelledby="save-collection-label" className="w-full">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            {items.map((item) => (
              <SelectItem key={item.value} value={item.value}>
                {item.label}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>
      {target === NEW && (
        <label className="grid gap-1.5 text-sm">
          <span className="text-muted-foreground">New collection name</span>
          <Input autoFocus value={newName} onChange={(e) => setNewName(e.target.value)} />
        </label>
      )}
      <DialogFooter>
        <Button type="button" variant="outline" onClick={onDone}>
          Cancel
        </Button>
        <Button type="submit" disabled={!canSave}>
          Save
        </Button>
      </DialogFooter>
    </form>
  )
}
