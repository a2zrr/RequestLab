import { useState } from 'react'
import { Button } from '@/components/ui/button'
import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import { Input } from '@/components/ui/input'

interface NameDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  title: string
  label: string
  initialValue?: string
  submitLabel?: string
  onSubmit: (name: string) => void
}

export function NameDialog({ open, onOpenChange, ...rest }: NameDialogProps) {
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        {/* Remount the form on each open so it starts from initialValue. */}
        {open && <NameForm {...rest} onDone={() => onOpenChange(false)} />}
      </DialogContent>
    </Dialog>
  )
}

function NameForm({
  title,
  label,
  initialValue = '',
  submitLabel = 'Save',
  onSubmit,
  onDone,
}: Omit<NameDialogProps, 'open' | 'onOpenChange'> & { onDone: () => void }) {
  const [name, setName] = useState(initialValue)
  const trimmed = name.trim()

  return (
    <form
      className="grid gap-4"
      onSubmit={(e) => {
        e.preventDefault()
        if (!trimmed) return
        onSubmit(trimmed)
        onDone()
      }}
    >
      <DialogHeader>
        <DialogTitle>{title}</DialogTitle>
      </DialogHeader>
      <label className="grid gap-1.5 text-sm">
        <span className="text-muted-foreground">{label}</span>
        <Input autoFocus value={name} onChange={(e) => setName(e.target.value)} />
      </label>
      <DialogFooter>
        <Button type="button" variant="outline" onClick={onDone}>
          Cancel
        </Button>
        <Button type="submit" disabled={!trimmed}>
          {submitLabel}
        </Button>
      </DialogFooter>
    </form>
  )
}
