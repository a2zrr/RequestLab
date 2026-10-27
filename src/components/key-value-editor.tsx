import { useState } from 'react'
import { Trash2 } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Checkbox } from '@/components/ui/checkbox'
import { Input } from '@/components/ui/input'
import type { KeyValue } from '@/shared/types.ts'

interface KeyValueEditorProps {
  rows: KeyValue[]
  onChange: (rows: KeyValue[]) => void
  keyPlaceholder?: string
  valuePlaceholder?: string
  keySuggestionsId?: string
  label: string
}

const newRow = (): KeyValue => ({ id: crypto.randomUUID(), key: '', value: '', enabled: true })

export function KeyValueEditor({
  rows,
  onChange,
  keyPlaceholder = 'Key',
  valuePlaceholder = 'Value',
  keySuggestionsId,
  label,
}: KeyValueEditorProps) {
  // Trailing placeholder row; becomes a real row as soon as the user types in it.
  const [blank, setBlank] = useState(newRow)
  const display = [...rows, blank]

  const update = (id: string, patch: Partial<KeyValue>) => {
    if (id === blank.id) {
      onChange([...rows, { ...blank, ...patch }])
      setBlank(newRow())
      return
    }
    onChange(rows.map((r) => (r.id === id ? { ...r, ...patch } : r)))
  }

  return (
    <div role="table" aria-label={label} className="flex flex-col gap-1.5">
      {display.map((row, i) => {
        const isBlank = row.id === blank.id
        return (
          <div role="row" key={row.id} className="flex items-center gap-2">
            <Checkbox
              aria-label={`Enable row ${i + 1}`}
              checked={row.enabled}
              disabled={isBlank}
              onCheckedChange={(checked) => update(row.id, { enabled: checked })}
            />
            <Input
              aria-label={`${keyPlaceholder} ${i + 1}`}
              placeholder={keyPlaceholder}
              value={row.key}
              list={keySuggestionsId}
              onChange={(e) => update(row.id, { key: e.target.value })}
              className="h-8 flex-1 font-mono text-xs"
            />
            <Input
              aria-label={`${valuePlaceholder} ${i + 1}`}
              placeholder={valuePlaceholder}
              value={row.value}
              onChange={(e) => update(row.id, { value: e.target.value })}
              className="h-8 flex-1 font-mono text-xs"
            />
            <Button
              variant="ghost"
              size="icon-sm"
              aria-label={`Delete row ${i + 1}`}
              disabled={isBlank}
              onClick={() => onChange(rows.filter((r) => r.id !== row.id))}
            >
              <Trash2 />
            </Button>
          </div>
        )
      })}
    </div>
  )
}
