import { useState } from 'react'
import { m } from 'framer-motion'
import { CartesianGrid, Line, LineChart, ResponsiveContainer, Tooltip, XAxis, YAxis } from 'recharts'
import { Trophy, TrendingUp, LineChart as LineIcon, Table2, Medal } from 'lucide-react'
import { AnimatedCounter, GlassCard, Page, PageHeader, fadeUp, stagger } from '../components/ui.jsx'
import { useTheme } from '../context/ThemeContext.jsx'
import { lifts, personalRecords, progressSummary, strengthHistory } from '../data/mock.js'

// Categorical series colors, validated per theme (lightness band, chroma, CVD separation, contrast).
const SERIES = {
  dark: { bench: '#65A30D', squat: '#0AA5C2', deadlift: '#F43F5E' },
  light: { bench: '#4D7C0F', squat: '#0891B2', deadlift: '#E11D48' },
}

const tierStyle = {
  gold: { label: 'Gold', cls: 'from-amber-300 to-amber-500 text-amber-950' },
  silver: { label: 'Silver', cls: 'from-slate-200 to-slate-400 text-slate-900' },
  bronze: { label: 'Bronze', cls: 'from-orange-300 to-orange-600 text-orange-950' },
}

function ChartTooltip({ active, payload, label }) {
  if (!active || !payload?.length) return null
  return (
    <div className="glass min-w-[10rem] !rounded-xl px-3 py-2 text-sm shadow-soft">
      <p className="mb-1 font-semibold">Week {label.slice(1)}</p>
      {payload.map((p) => (
        <p key={p.dataKey} className="flex items-center justify-between gap-4">
          <span className="flex items-center gap-2 text-muted">
            <span className="h-2 w-2 rounded-full" style={{ background: p.color }} />
            {lifts.find((l) => l.key === p.dataKey)?.label}
          </span>
          <span className="font-semibold tabular-nums">{p.value} kg</span>
        </p>
      ))}
    </div>
  )
}

function EndLabel({ x, y, index, value, last, color }) {
  if (index !== last) return null
  return (
    <g>
      <circle cx={x} cy={y} r={5} fill={color} stroke="rgb(var(--surface))" strokeWidth={2} />
      <text x={x - 10} y={y - 12} textAnchor="end" className="fill-fg text-[12px] font-semibold">
        {value} kg
      </text>
    </g>
  )
}

export default function Progress() {
  const { isDark } = useTheme()
  const colors = SERIES[isDark ? 'dark' : 'light']
  const [visible, setVisible] = useState(() => new Set(lifts.map((l) => l.key)))
  const [view, setView] = useState('chart')

  const toggle = (key) =>
    setVisible((v) => {
      const next = new Set(v)
      if (next.has(key) && next.size > 1) next.delete(key)
      else next.add(key)
      return next
    })

  const first = strengthHistory[0]
  const last = strengthHistory[strengthHistory.length - 1]
  const lastIdx = strengthHistory.length - 1

  return (
    <Page>
      <PageHeader eyebrow="Progress" title="Look how far you’ve come" subtitle="12 weeks of estimated one-rep maxes, PRs and training volume." />

      <m.div variants={stagger} className="mb-4 grid gap-4 sm:grid-cols-3">
        {progressSummary.map((s) => (
          <GlassCard key={s.label} hover>
            <p className="label">{s.label}</p>
            <p className="mt-3 font-display text-4xl font-bold">
              <AnimatedCounter value={s.value} decimals={s.decimals ?? 0} />
              <span className="ml-1 text-lg font-medium text-muted">{s.suffix}</span>
            </p>
            <p className="mt-1 inline-flex items-center gap-1 text-sm text-muted">
              <TrendingUp className="h-4 w-4 text-accent" /> {s.delta} in 12 weeks
            </p>
          </GlassCard>
        ))}
      </m.div>

      <GlassCard>
        <div className="flex flex-wrap items-start justify-between gap-4">
          <div>
            <p className="label">Strength gains · est. 1RM</p>
            <p className="mt-2 font-display text-2xl font-bold">
              +{last.deadlift - first.deadlift} kg <span className="text-base font-medium text-muted">on your deadlift since W1</span>
            </p>
          </div>
          <div className="inline-flex rounded-2xl border border-line/10 bg-fg/[0.04] p-1" role="tablist" aria-label="View">
            {[
              { key: 'chart', icon: LineIcon, label: 'Chart' },
              { key: 'table', icon: Table2, label: 'Table' },
            ].map(({ key, icon: Icon, label }) => (
              <button
                key={key}
                role="tab"
                aria-selected={view === key}
                onClick={() => setView(key)}
                className={`inline-flex items-center gap-1.5 rounded-xl px-3 py-1.5 text-sm font-medium transition ${
                  view === key ? 'bg-fg/10 text-fg' : 'text-muted hover:text-fg'
                }`}
              >
                <Icon className="h-4 w-4" /> {label}
              </button>
            ))}
          </div>
        </div>

        {/* Legend doubles as series filter */}
        <div className="mt-5 flex flex-wrap gap-2" aria-label="Lifts shown">
          {lifts.map((l) => {
            const on = visible.has(l.key)
            return (
              <button
                key={l.key}
                onClick={() => toggle(l.key)}
                aria-pressed={on}
                className={`chip ${on ? '!text-fg' : 'opacity-50'}`}
              >
                <span className="h-2.5 w-2.5 rounded-full" style={{ background: on ? colors[l.key] : 'transparent', border: `2px solid ${colors[l.key]}` }} />
                {l.label}
              </button>
            )
          })}
        </div>

        {view === 'chart' ? (
          <div className="mt-4 h-72 sm:h-80">
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={strengthHistory} margin={{ top: 24, right: 16, left: -16, bottom: 0 }}>
                <CartesianGrid vertical={false} />
                <XAxis dataKey="week" axisLine={false} tickLine={false} interval="preserveStartEnd" minTickGap={16} />
                <YAxis axisLine={false} tickLine={false} domain={[60, 180]} ticks={[60, 90, 120, 150, 180]} unit=" kg" width={64} />
                <Tooltip content={<ChartTooltip />} cursor={{ stroke: 'rgb(var(--muted) / 0.5)', strokeDasharray: '4 4' }} />
                {lifts
                  .filter((l) => visible.has(l.key))
                  .map((l) => (
                    <Line
                      key={l.key}
                      type="monotone"
                      dataKey={l.key}
                      stroke={colors[l.key]}
                      strokeWidth={2.5}
                      dot={false}
                      activeDot={{ r: 6, strokeWidth: 2, stroke: 'rgb(var(--surface))' }}
                      animationDuration={1400}
                      label={<EndLabel last={lastIdx} color={colors[l.key]} />}
                    />
                  ))}
              </LineChart>
            </ResponsiveContainer>
          </div>
        ) : (
          <div className="mt-4 overflow-x-auto">
            <table className="w-full min-w-[22rem] text-left text-sm">
              <thead className="text-muted">
                <tr className="border-b border-line/10">
                  <th className="py-2 pr-4 font-medium">Week</th>
                  {lifts.map((l) => (
                    <th key={l.key} className="py-2 pr-4 text-right font-medium">
                      {l.label}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody className="tabular-nums">
                {strengthHistory.map((row) => (
                  <tr key={row.week} className="border-b border-line/[0.05]">
                    <td className="py-2 pr-4">{row.week}</td>
                    {lifts.map((l) => (
                      <td key={l.key} className="py-2 pr-4 text-right">
                        {row[l.key]} kg
                      </td>
                    ))}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </GlassCard>

      <m.section variants={fadeUp} className="mt-8">
        <div className="mb-4 flex items-center gap-2">
          <Trophy className="h-5 w-5 text-amber-400" />
          <h2 className="text-2xl font-bold">Personal records</h2>
        </div>
        <m.div
          className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3"
          initial="hidden"
          whileInView="show"
          viewport={{ once: true }}
          variants={stagger}
        >
          {personalRecords.map((pr) => {
            const tier = tierStyle[pr.tier]
            return (
              <GlassCard key={pr.id} hover className="flex items-center gap-4">
                <m.div
                  whileHover={{ rotate: [0, -10, 10, 0] }}
                  className={`relative grid h-16 w-16 shrink-0 place-items-center rounded-2xl bg-gradient-to-br shadow-soft ${tier.cls}`}
                >
                  {pr.tier === 'gold' ? <Trophy className="h-8 w-8" /> : <Medal className="h-8 w-8" />}
                </m.div>
                <div className="min-w-0 flex-1">
                  <p className="text-sm text-muted">{pr.lift}</p>
                  <p className="font-display text-2xl font-bold">{pr.value}</p>
                  <p className="text-xs text-muted">
                    {tier.label} · {pr.date} · <span className="font-semibold text-fg">{pr.delta}</span>
                  </p>
                </div>
              </GlassCard>
            )
          })}
        </m.div>
      </m.section>
    </Page>
  )
}
