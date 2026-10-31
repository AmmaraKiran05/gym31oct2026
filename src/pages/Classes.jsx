import { useMemo, useState } from 'react'
import { AnimatePresence, m } from 'framer-motion'
import { Clock, Users, Check, Flower2, Zap, Bike, Swords, CalendarX, BellRing, Flame } from 'lucide-react'
import { EmptyState, Page, PageHeader, fadeUp } from '../components/ui.jsx'
import { useToast } from '../context/ToastContext.jsx'
import { classes as initialClasses, classTypes, weekDays } from '../data/mock.js'

const typeIcon = { Yoga: Flower2, HIIT: Zap, Spin: Bike, Boxing: Swords }

function todayKey() {
  return weekDays[(new Date().getDay() + 6) % 7]
}

function Intensity({ level }) {
  return (
    <span className="inline-flex items-center gap-0.5" role="img" aria-label={`Intensity ${level} of 3`}>
      {[1, 2, 3].map((i) => (
        <Flame key={i} className={`h-3.5 w-3.5 ${i <= level ? 'text-orange-400' : 'text-fg/15'}`} />
      ))}
    </span>
  )
}

function ClassCard({ c, booked, onBook, onCancel, onWaitlist }) {
  const { color } = classTypes[c.type]
  const Icon = typeIcon[c.type]
  const full = c.spots === 0
  const low = !full && c.spots <= 3
  const taken = c.capacity - c.spots

  return (
    <m.article
      layout
      initial={{ opacity: 0, y: 14 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0 }}
      whileHover={{ y: -4 }}
      className="glass relative overflow-hidden p-5 transition-shadow hover:shadow-soft"
    >
      <span className="absolute inset-y-0 left-0 w-1" style={{ background: color }} />
      <div className="flex items-start gap-4">
        <div className="w-14 shrink-0 text-center">
          <p className="font-display text-xl font-bold tabular-nums">{c.time}</p>
          <p className="text-xs text-muted">{c.duration} min</p>
        </div>
        <div className="min-w-0 flex-1">
          <div className="flex flex-wrap items-center gap-2">
            <span
              className="inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-xs font-semibold text-fg"
              style={{ background: `${color}26` }}
            >
              <Icon className="h-3.5 w-3.5" style={{ color }} /> {c.type}
            </span>
            <Intensity level={c.intensity} />
          </div>
          <h3 className="mt-2 truncate font-display text-lg font-bold">{c.name}</h3>
          <p className="text-sm text-muted">with {c.coach}</p>
        </div>
      </div>

      <div className="mt-4">
        <div className="flex items-center justify-between text-xs">
          <span className="inline-flex items-center gap-1 text-muted">
            <Users className="h-3.5 w-3.5" /> {taken}/{c.capacity} booked
          </span>
          <span className={`font-semibold ${full ? 'text-rose-400' : low ? 'text-orange-400' : 'text-accent'}`}>
            {full ? 'Full' : `${c.spots} spot${c.spots === 1 ? '' : 's'} left`}
          </span>
        </div>
        <div className="mt-1.5 h-1.5 overflow-hidden rounded-full bg-fg/[0.07]">
          <m.div
            className="h-full rounded-full"
            style={{ background: color }}
            initial={{ width: 0 }}
            animate={{ width: `${(taken / c.capacity) * 100}%` }}
            transition={{ duration: 0.8, ease: 'easeOut' }}
          />
        </div>
      </div>

      <div className="mt-4">
        {booked ? (
          <div className="flex gap-2">
            <span className="btn flex-1 bg-accent/15 text-accent">
              <Check className="h-4 w-4" /> Booked
            </span>
            <button className="btn-ghost" onClick={onCancel}>
              Cancel
            </button>
          </div>
        ) : full ? (
          <button className="btn-ghost w-full" onClick={onWaitlist}>
            <BellRing className="h-4 w-4" /> Join waitlist
          </button>
        ) : (
          <button className="btn-primary w-full" onClick={onBook}>
            Book spot
          </button>
        )}
      </div>
    </m.article>
  )
}

export default function Classes() {
  const toast = useToast()
  const [day, setDay] = useState(todayKey)
  const [type, setType] = useState('All')
  const [list, setList] = useState(initialClasses)
  const [booked, setBooked] = useState(() => new Set())
  const [waitlist, setWaitlist] = useState(() => new Set())

  const visible = useMemo(
    () => list.filter((c) => c.day === day && (type === 'All' || c.type === type)),
    [list, day, type],
  )

  const book = (c) => {
    const fresh = list.find((x) => x.id === c.id)
    if (!fresh || fresh.spots === 0) {
      toast({ type: 'error', title: 'So close!', message: 'Someone grabbed the last spot. Try the waitlist.' })
      return
    }
    setList((l) => l.map((x) => (x.id === c.id ? { ...x, spots: x.spots - 1 } : x)))
    setBooked((b) => new Set(b).add(c.id))
    toast({ title: 'You’re booked! 🎉', message: `${c.name} · ${c.day} ${c.time}. See you there.` })
  }

  const cancel = (c) => {
    setList((l) => l.map((x) => (x.id === c.id ? { ...x, spots: x.spots + 1 } : x)))
    setBooked((b) => {
      const n = new Set(b)
      n.delete(c.id)
      return n
    })
    toast({ type: 'info', title: 'Booking cancelled', message: `Your spot in ${c.name} was released.` })
  }

  const joinWaitlist = (c) => {
    if (waitlist.has(c.id)) {
      toast({ type: 'info', title: 'Already on the waitlist', message: 'We’ll ping you the moment a spot opens.' })
      return
    }
    setWaitlist((w) => new Set(w).add(c.id))
    toast({ type: 'info', title: 'On the waitlist', message: `We’ll notify you if a spot opens in ${c.name}.` })
  }

  const countFor = (d) => list.filter((c) => c.day === d).length

  return (
    <Page>
      <PageHeader
        eyebrow="Class booking"
        title="This week’s classes"
        subtitle="Yoga, HIIT, Spin and Boxing with PulseFit coaches. Book in one tap."
        action={
          booked.size > 0 && (
            <span className="inline-flex items-center gap-2 rounded-2xl bg-accent/15 px-4 py-2 text-sm font-semibold text-accent">
              <Check className="h-4 w-4" /> {booked.size} booked this week
            </span>
          )
        }
      />

      <m.div variants={fadeUp} className="no-scrollbar -mx-4 mb-4 flex gap-2 overflow-x-auto px-4 sm:mx-0 sm:px-0" role="tablist" aria-label="Day">
        {weekDays.map((d) => {
          const active = d === day
          return (
            <button
              key={d}
              role="tab"
              aria-selected={active}
              onClick={() => setDay(d)}
              className={`relative flex min-w-[4.25rem] flex-col items-center rounded-2xl border px-3 py-3 transition ${
                active ? 'border-transparent text-ink-950' : 'border-line/10 bg-fg/[0.03] text-muted hover:text-fg'
              }`}
            >
              {active && <m.span layoutId="day-pill" className="absolute inset-0 rounded-2xl bg-pulse" transition={{ type: 'spring', stiffness: 400, damping: 32 }} />}
              <span className="relative text-xs font-semibold uppercase tracking-wider">{d}</span>
              <span className="relative mt-1 font-display text-lg font-bold">{countFor(d)}</span>
              {d === todayKey() && <span className={`relative text-[10px] ${active ? '' : 'text-accent'}`}>today</span>}
            </button>
          )
        })}
      </m.div>

      <m.div variants={fadeUp} className="no-scrollbar -mx-4 mb-6 flex gap-2 overflow-x-auto px-4 sm:mx-0 sm:px-0">
        {['All', ...Object.keys(classTypes)].map((t) => {
          const Icon = typeIcon[t]
          return (
            <button key={t} onClick={() => setType(t)} className={`chip ${type === t ? 'chip-active' : ''}`} aria-pressed={type === t}>
              {Icon && <Icon className="h-4 w-4" />} {t}
            </button>
          )
        })}
      </m.div>

      {visible.length === 0 ? (
        <EmptyState
          icon={CalendarX}
          title={countFor(day) === 0 ? `${day} is a rest day` : `No ${type} classes on ${day}`}
          message={
            countFor(day) === 0
              ? 'No classes scheduled — the studio is recharging. Pick another day or log a solo session.'
              : 'Try another class type or check a different day.'
          }
          action={
            type !== 'All' && (
              <button className="btn-ghost" onClick={() => setType('All')}>
                Show all classes
              </button>
            )
          }
        />
      ) : (
        <m.div layout className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
          <AnimatePresence>
            {visible.map((c) => (
              <ClassCard
                key={c.id}
                c={c}
                booked={booked.has(c.id)}
                onBook={() => book(c)}
                onCancel={() => cancel(c)}
                onWaitlist={() => joinWaitlist(c)}
              />
            ))}
          </AnimatePresence>
        </m.div>
      )}
    </Page>
  )
}
