import { useState, type FormEvent } from 'react'
import { Button } from './Button'
import { Card } from './Card'
import { Input } from './Input'

interface Props {
  onUnlock: (password: string) => void
}

export function UnlockScreen({ onUnlock }: Props) {
  const [password, setPasswordValue] = useState('')

  const handleSubmit = (e: FormEvent) => {
    e.preventDefault()
    if (password) onUnlock(password)
  }

  return (
    <div className="flex min-h-screen items-center justify-center px-6">
      <Card className="w-full max-w-sm">
        <div className="mb-6 text-center">
          <p className="font-cjk text-4xl">汉字</p>
          <p className="mt-2 text-sm text-[var(--color-text-secondary)]">Podaj hasło, aby otworzyć fiszki</p>
        </div>
        <form onSubmit={handleSubmit} className="flex flex-col gap-4">
          <Input
            type="password"
            label="Hasło"
            value={password}
            onChange={(e) => setPasswordValue(e.target.value)}
            autoFocus
            required
          />
          <Button type="submit">Odblokuj</Button>
        </form>
      </Card>
    </div>
  )
}
