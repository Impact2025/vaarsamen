// ─── BPR UPLOAD COMPONENT ──────────────────────────────────────────────────────
// Video upload (max 2 min, MP4/WEBM)

import { useRef, useState } from 'react'

interface Props {
  lesId: string
  bootType: string
  onSuccess?: () => void
}

export default function BprUpload({ lesId, bootType, onSuccess }: Props) {
  const [uploading, setUploading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const fileRef = useRef<HTMLInputElement>(null)

  const handleUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return

    // Validate size (200MB max for 2min video)
    if (file.size > 200 * 1024 * 1024) {
      setError('Video > 200MB')
      return
    }

    setUploading(true)
    setError(null)

    const formData = new FormData()
    formData.append('video', file)
    formData.append('lesId', lesId)
    formData.append('bootType', bootType)

    try {
      const res = await fetch('/api/school/[schoolId]/bpr', {
        method: 'POST',
        body: formData,
      })

      if (!res.ok) throw new Error('Upload mislukt')
      onSuccess?.()
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Upload error')
    } finally {
      setUploading(false)
    }
  }

  return (
    <div className="bpr-upload">
      <input
        ref={fileRef}
        type="file"
        accept="video/*"
        onChange={handleUpload}
        disabled={uploading}
        className="hidden"
      />
      <button
        onClick={() => fileRef.current?.click()}
        disabled={uploading}
        className="border-2 border-dashed rounded p-4 text-center w-full"
      >
        {uploading ? 'Uploaden...' : 'BPR video uploaden (max 2 min)'}
      </button>
      {error && <p className="text-red-500 text-sm mt-2">{error}</p>}
    </div>
  )
}