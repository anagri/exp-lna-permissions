import { useState, type FormEvent } from 'react'
import { Card } from '@/components/ui/Card'
import { Input } from '@/components/ui/Input'
import { Button } from '@/components/ui/Button'
import { Send, Trash2 } from 'lucide-react'

interface RequestFormProps {
  onSubmit: (url: string, targetAddressSpace: 'local' | 'private') => void
  onClear: () => void
  isLoading: boolean
  hasResponse: boolean
}

export function RequestForm({ onSubmit, onClear, isLoading, hasResponse }: RequestFormProps) {
  const [url, setUrl] = useState('')
  const [addressSpace, setAddressSpace] = useState<'local' | 'private'>('local')

  const handleSubmit = (e: FormEvent) => {
    e.preventDefault()
    if (url.trim()) {
      onSubmit(url.trim(), addressSpace)
    }
  }

  return (
    <Card data-testid="request-form">
      <h2 className="text-xl font-semibold mb-4">Make Local Network Request</h2>

      <form onSubmit={handleSubmit} className="space-y-4">
        <div>
          <label htmlFor="url-input" className="block text-sm font-medium mb-2">
            Server URL
          </label>
          <Input
            id="url-input"
            type="text"
            placeholder="http://192.168.1.100:8080/api/data"
            value={url}
            onChange={(e) => setUrl(e.target.value)}
            disabled={isLoading}
            data-testid="url-input"
          />
        </div>

        <div>
          <label className="block text-sm font-medium mb-2">Target Address Space</label>
          <div className="flex gap-4">
            <label className="flex items-center">
              <input
                type="radio"
                name="addressSpace"
                value="local"
                checked={addressSpace === 'local'}
                onChange={() => setAddressSpace('local')}
                disabled={isLoading}
                data-testid="address-space-local"
                className="mr-2"
              />
              Local
            </label>
            <label className="flex items-center">
              <input
                type="radio"
                name="addressSpace"
                value="private"
                checked={addressSpace === 'private'}
                onChange={() => setAddressSpace('private')}
                disabled={isLoading}
                data-testid="address-space-private"
                className="mr-2"
              />
              Private
            </label>
          </div>
          <p className="text-xs text-gray-500 mt-1">
            Local: localhost/127.0.0.1 • Private: 10.x, 172.16.x, 192.168.x
          </p>
        </div>

        <div className="flex gap-3">
          <Button
            type="submit"
            disabled={isLoading || !url.trim()}
            data-testid="send-button"
            className="flex items-center gap-2"
          >
            <Send className="w-4 h-4" />
            Send Request
          </Button>

          {hasResponse && (
            <Button
              type="button"
              variant="secondary"
              onClick={onClear}
              disabled={isLoading}
              data-testid="clear-button"
              className="flex items-center gap-2"
            >
              <Trash2 className="w-4 h-4" />
              Clear Response
            </Button>
          )}
        </div>
      </form>
    </Card>
  )
}
