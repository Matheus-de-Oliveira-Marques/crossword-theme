import { useEffect, useMemo, useState } from 'react'
import { ArrowLeft, Check, ChevronRight, Eraser, Lightbulb, Menu, RotateCcw, Sparkles, Trophy, X } from 'lucide-react'
import './App.css'

const API_URL = 'https://bff-inglish-learning-crossword.vercel.app'
const GRID_SIZE = 12

const fallbackPuzzle = {
  level: 1,
  title: 'First Words',
  topic: 'everyday objects',
  entries: [
    { id: 1, answer: 'PENCIL', clue: 'You use this to write or draw.', row: 5, column: 1, direction: 'across' },
    { id: 2, answer: 'PEN', clue: 'A tool that writes with ink.', row: 5, column: 1, direction: 'down' },
    { id: 3, answer: 'EEL', clue: 'A long fish with a snake-like body.', row: 4, column: 2, direction: 'down' },
    { id: 4, answer: 'NINE', clue: 'The number after eight.', row: 3, column: 3, direction: 'down' },
    { id: 5, answer: 'CUP', clue: 'A small container for drinking.', row: 5, column: 5, direction: 'down' },
    { id: 6, answer: 'ICE', clue: 'Frozen water.', row: 5, column: 6, direction: 'down' },
  ],
}

function getCellKey(row, column) {
  return `${row}-${column}`
}

function buildGrid(entries) {
  const cells = new Map()
  entries.forEach((entry) => {
    [...entry.answer].forEach((letter, offset) => {
      const row = entry.row + (entry.direction === 'down' ? offset : 0)
      const column = entry.column + (entry.direction === 'across' ? offset : 0)
      const key = getCellKey(row, column)
      const cell = cells.get(key) || { row, column, letter, entryIds: [] }
      cell.entryIds = [...new Set([...cell.entryIds, entry.id])]
      cells.set(key, cell)
    })
  })
  return cells
}

function App() {
  const [level, setLevel] = useState(1)
  const [puzzle, setPuzzle] = useState(fallbackPuzzle)
  const [loading, setLoading] = useState(false)
  const [selectedEntryId, setSelectedEntryId] = useState(1)
  const [selectedCell, setSelectedCell] = useState({ row: 5, column: 1 })
  const [answers, setAnswers] = useState({})
  const [feedback, setFeedback] = useState(null)
  const [completedLevels, setCompletedLevels] = useState({})
  const [highestUnlockedLevel, setHighestUnlockedLevel] = useState(1)

  const grid = useMemo(() => buildGrid(puzzle.entries), [puzzle.entries])
  const selectedEntry = puzzle.entries.find((entry) => entry.id === selectedEntryId) || puzzle.entries[0]
  const filledCount = Object.values(answers).filter(Boolean).length
  const totalCells = puzzle.entries.reduce((total, entry) => total + entry.answer.length, 0)
  const progress = Math.round((filledCount / totalCells) * 100)

  async function loadLevel(nextLevel) {
    setLoading(true)
    setFeedback(null)
    setAnswers({})
    try {
      const response = await fetch(`${API_URL}/crosswords/levels/${nextLevel}`, { method: 'POST' })
      if (!response.ok) throw new Error('Unable to load level')
      const nextPuzzle = await response.json()
      setPuzzle(nextPuzzle)
      setSelectedEntryId(nextPuzzle.entries[0].id)
      setSelectedCell({ row: nextPuzzle.entries[0].row, column: nextPuzzle.entries[0].column })
    } catch {
      if (nextLevel === 1) {
        setPuzzle(fallbackPuzzle)
        setSelectedEntryId(fallbackPuzzle.entries[0].id)
      }
      setFeedback({ type: 'info', message: 'Demo puzzle loaded. Connect the BFF to load every level.' })
    } finally { setLoading(false) }
  }

  useEffect(() => { loadLevel(level) }, [level])

  function changeLevel(nextLevel) {
    if (nextLevel > highestUnlockedLevel) {
      setFeedback({ type: 'info', message: 'Complete the current level to unlock the next one.' })
      return
    }

    if (nextLevel === level + 1 && !completedLevels[level]) {
      setFeedback({ type: 'info', message: 'Complete the current level to unlock the next one.' })
      return
    }

    setLevel(nextLevel)
    setFeedback(null)
  }

  function selectCell(cell) {
    setSelectedCell({ row: cell.row, column: cell.column })
    setSelectedEntryId(cell.entryIds.includes(selectedEntryId) ? selectedEntryId : cell.entryIds[0])
  }

  function selectEntry(entry) {
    setSelectedEntryId(entry.id)
    setSelectedCell({ row: entry.row, column: entry.column })
  }

  function moveWithinEntry(direction) {
    const entry = puzzle.entries.find((item) => item.id === selectedEntryId)
    if (!entry) return
    const offset = entry.direction === 'across' ? selectedCell.column - entry.column : selectedCell.row - entry.row
    const nextOffset = Math.max(0, Math.min(entry.answer.length - 1, offset + direction))
    setSelectedCell({ row: entry.row + (entry.direction === 'down' ? nextOffset : 0), column: entry.column + (entry.direction === 'across' ? nextOffset : 0) })
  }

  function setLetter(letter) {
    const key = getCellKey(selectedCell.row, selectedCell.column)
    if (!grid.has(key)) return
    setAnswers((current) => ({ ...current, [key]: letter }))
    moveWithinEntry(1)
  }

  function handleKeyDown(event) {
    if (/^[a-zA-Z]$/.test(event.key)) { event.preventDefault(); setLetter(event.key.toUpperCase()) }
    if (event.key === 'Backspace') {
      event.preventDefault()
      const key = getCellKey(selectedCell.row, selectedCell.column)
      if (answers[key]) setAnswers((current) => ({ ...current, [key]: '' }))
      else moveWithinEntry(-1)
    }
    if (event.key === 'ArrowRight' || event.key === 'ArrowDown') moveWithinEntry(1)
    if (event.key === 'ArrowLeft' || event.key === 'ArrowUp') moveWithinEntry(-1)
  }

  async function checkAnswers() {
    const submittedAnswers = puzzle.entries.map((entry) => ({
      entryId: entry.id,
      answer: [...entry.answer].map((_, offset) => {
        const row = entry.row + (entry.direction === 'down' ? offset : 0)
        const column = entry.column + (entry.direction === 'across' ? offset : 0)
        return answers[getCellKey(row, column)] || ''
      }).join(''),
    }))
    try {
      const response = await fetch(`${API_URL}/crosswords/levels/${level}/validate`, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ answers: submittedAnswers }) })
      if (!response.ok) throw new Error('Unable to validate')
      const result = await response.json()

      if (result.completed) {
        setCompletedLevels((current) => ({ ...current, [level]: true }))
        setHighestUnlockedLevel((current) => Math.max(current, Math.min(10, level + 1)))
        setFeedback({ type: 'success', message: 'Excellent! Level complete.' })
        return
      }

      setCompletedLevels((current) => ({ ...current, [level]: false }))
      setFeedback({ type: 'error', message: 'Almost there. Check the highlighted clues.' })
    } catch { setFeedback({ type: 'info', message: 'Validation needs the BFF to be online.' }) }
  }

  return (
    <main className="min-h-screen bg-[#f4f1e9] text-[#26302d]" onKeyDown={handleKeyDown} tabIndex="0">
      <header className="border-b border-[#d7d3c8] bg-[#f8f6f0]/90 px-5 py-4 backdrop-blur md:px-10">
        <div className="mx-auto flex max-w-7xl items-center justify-between gap-4">
          <div className="flex items-center gap-3"><button className="icon-button" aria-label="Open menu"><Menu size={20} /></button><div><p className="font-display text-xl font-bold tracking-tight">DUO<span className="text-[#bb563b]">PLEX</span></p><p className="text-[10px] font-bold uppercase tracking-[0.25em] text-[#7b817a]">English crossword studio</p></div></div>
          <div className="hidden items-center gap-7 text-xs font-bold uppercase tracking-[0.18em] text-[#707871] md:flex"><span>Level {level} / 10</span><span className="h-1.5 w-28 overflow-hidden rounded-full bg-[#ddd9ce]"><span className="block h-full bg-[#bb563b] transition-all" style={{ width: `${Math.max(progress, 4)}%` }} /></span><span>{progress}% solved</span></div>
          <button className="icon-button" aria-label="Reset puzzle" onClick={() => setAnswers({})}><RotateCcw size={18} /></button>
        </div>
      </header>

      <section className="mx-auto max-w-7xl px-5 pb-14 pt-8 md:px-10 md:pt-12">
        <div className="mb-8 flex flex-col justify-between gap-5 md:flex-row md:items-end"><div><div className="mb-3 flex items-center gap-2 text-xs font-bold uppercase tracking-[0.22em] text-[#bb563b]"><Sparkles size={14} /> Duplex practice</div><h1 className="font-display max-w-2xl text-4xl font-bold leading-[0.95] tracking-[-0.04em] text-[#26302d] md:text-6xl">A clue on the left.<br /><span className="text-[#bb563b]">A word in your head.</span></h1><p className="mt-4 max-w-lg text-sm leading-6 text-[#707871]">Read the clues in American English and fill the crossing words. Every answer opens the next level.</p></div><div className="flex items-center gap-2 rounded-full border border-[#d7d3c8] bg-[#fbfaf6] p-1">{[1, 2, 3, 4, 5].map((item) => <button key={item} className={`level-pill ${level === item ? 'level-pill-active' : ''}`} onClick={() => changeLevel(item)} disabled={item > highestUnlockedLevel}>0{item}</button>)}<button className="level-pill" onClick={() => changeLevel(Math.min(10, level + 1))} disabled={level >= highestUnlockedLevel || !completedLevels[level]}><ChevronRight size={15} /></button></div></div>

        <div className="grid gap-8 lg:grid-cols-[minmax(250px,0.72fr)_minmax(480px,1.28fr)] lg:items-start lg:gap-14">
          <aside className="order-2 lg:order-1"><div className="mb-4 flex items-baseline justify-between border-b border-[#aaa99f] pb-3"><h2 className="font-display text-2xl font-bold">{puzzle.title}</h2><span className="text-xs uppercase tracking-[0.18em] text-[#888b82]">{puzzle.topic}</span></div><div className="grid gap-2 sm:grid-cols-2 lg:grid-cols-1">{puzzle.entries.map((entry) => <button key={entry.id} className={`clue-row ${selectedEntryId === entry.id ? 'clue-row-active' : ''}`} onClick={() => selectEntry(entry)}><span className="clue-number">{entry.id}</span><span className="text-left text-sm leading-5">{entry.clue}</span></button>)}</div><div className="mt-6 flex items-center gap-2 text-xs leading-5 text-[#858a81]"><Lightbulb size={16} className="text-[#bb563b]" /> Select a clue to highlight its word.</div></aside>

          <div className="order-1 rounded-[2px] border border-[#c2c0b6] bg-[#fbfaf6] p-4 shadow-[10px_10px_0_#dedbd0] sm:p-7 lg:order-2"><div className="mb-5 flex items-center justify-between border-b border-[#d8d4c9] pb-4"><div><p className="text-[10px] font-bold uppercase tracking-[0.24em] text-[#858a81]">Crossword {String(level).padStart(2, '0')}</p><p className="font-display text-lg font-bold">{loading ? 'Loading puzzle...' : 'Fill the intersections'}</p></div><span className="rounded-sm bg-[#26302d] px-2 py-1 text-[10px] font-bold uppercase tracking-widest text-[#f8f6f0]">US English</span></div><div className="mx-auto grid aspect-square w-full max-w-[570px] grid-cols-12 border-l border-t border-[#26302d] bg-[#26302d]">{Array.from({ length: GRID_SIZE * GRID_SIZE }, (_, index) => { const row = Math.floor(index / GRID_SIZE); const column = index % GRID_SIZE; const cell = grid.get(getCellKey(row, column)); const isSelected = cell && selectedCell.row === row && selectedCell.column === column; const isInEntry = cell?.entryIds.includes(selectedEntryId); return <button key={`${row}-${column}`} aria-label={cell ? `Row ${row + 1}, column ${column + 1}` : 'Empty cell'} disabled={!cell} className={`grid-cell ${cell ? '' : 'grid-cell-empty'} ${isInEntry ? 'grid-cell-word' : ''} ${isSelected ? 'grid-cell-selected' : ''}`} onClick={() => cell && selectCell(cell)}>{cell && <span className="grid-letter">{answers[getCellKey(row, column)] || ''}</span>}{cell?.entryIds.includes(selectedEntryId) && cell.row === selectedEntry.row && cell.column === selectedEntry.column && <span className="grid-start">{selectedEntry.id}</span>}</button> })}</div><div className="mt-5 flex flex-wrap items-center justify-between gap-3"><div className="flex items-center gap-3 text-xs font-bold uppercase tracking-widest text-[#858a81]"><span className="inline-block h-3 w-3 bg-[#bb563b]" /> Current word <span className="inline-block h-3 w-3 border border-[#26302d] bg-[#fbfaf6]" /> Open cell</div><button className="text-button" onClick={() => { setAnswers({}); setFeedback(null) }}><Eraser size={15} /> Clear</button></div></div>
        </div>

        {feedback && <div className={`mt-8 flex items-center justify-between border-l-4 px-4 py-3 text-sm ${feedback.type === 'success' ? 'border-[#4f8060] bg-[#e6f0e7] text-[#31583d]' : feedback.type === 'error' ? 'border-[#bb563b] bg-[#f5e4de] text-[#7d3425]' : 'border-[#a5863c] bg-[#f8efd4] text-[#6d5826]'}`}><span>{feedback.message}</span><button onClick={() => setFeedback(null)} aria-label="Dismiss message"><X size={16} /></button></div>}
        <div className="mt-8 flex flex-col items-center justify-between gap-4 border-t border-[#d7d3c8] pt-6 sm:flex-row"><button className="text-button" onClick={() => setLevel(Math.max(1, level - 1))}><ArrowLeft size={16} /> Previous level</button><button className="primary-button" onClick={checkAnswers}><Check size={17} /> Check answers</button><button className="text-button" onClick={() => changeLevel(Math.min(10, level + 1))} disabled={level >= highestUnlockedLevel || !completedLevels[level]}>Next level <ChevronRight size={16} /></button></div><div className="mt-10 flex items-center justify-center gap-2 text-xs text-[#858a81]"><Trophy size={14} className="text-[#bb563b]" /> Complete all six entries to unlock the next level.</div>
      </section>
    </main>
  )
}

export default App
