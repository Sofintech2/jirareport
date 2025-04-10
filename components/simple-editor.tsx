"use client"

import { useEffect, useRef } from "react"

interface SimpleEditorProps {
  value: string
  onChange: (value: string) => void
}

export default function SimpleEditor({ value, onChange }: SimpleEditorProps) {
  const editorRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    if (editorRef.current) {
      editorRef.current.innerHTML = value
    }
  }, [value])

  const handleInput = () => {
    if (editorRef.current) {
      onChange(editorRef.current.innerHTML)
    }
  }

  return (
    <div className="simple-editor-container">
      <div className="simple-editor-toolbar p-2 bg-gray-100 border-b flex flex-wrap gap-2">
        <button
          onClick={() => document.execCommand("bold")}
          className="px-2 py-1 bg-white border rounded hover:bg-gray-50"
          type="button"
        >
          Negrito
        </button>
        <button
          onClick={() => document.execCommand("italic")}
          className="px-2 py-1 bg-white border rounded hover:bg-gray-50"
          type="button"
        >
          Itálico
        </button>
        <button
          onClick={() => document.execCommand("underline")}
          className="px-2 py-1 bg-white border rounded hover:bg-gray-50"
          type="button"
        >
          Sublinhado
        </button>
        <button
          onClick={() => document.execCommand("insertUnorderedList")}
          className="px-2 py-1 bg-white border rounded hover:bg-gray-50"
          type="button"
        >
          Lista
        </button>
        <button
          onClick={() => document.execCommand("formatBlock", false, "h1")}
          className="px-2 py-1 bg-white border rounded hover:bg-gray-50"
          type="button"
        >
          H1
        </button>
        <button
          onClick={() => document.execCommand("formatBlock", false, "h2")}
          className="px-2 py-1 bg-white border rounded hover:bg-gray-50"
          type="button"
        >
          H2
        </button>
        <button
          onClick={() => document.execCommand("formatBlock", false, "h3")}
          className="px-2 py-1 bg-white border rounded hover:bg-gray-50"
          type="button"
        >
          H3
        </button>
      </div>
      <div
        ref={editorRef}
        contentEditable
        className="p-4 min-h-[70vh] focus:outline-none"
        onInput={handleInput}
        dangerouslySetInnerHTML={{ __html: value }}
      />
    </div>
  )
}

