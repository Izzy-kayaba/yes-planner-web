"use client";

import {
  Area,
  AreaChart,
  Bar,
  BarChart,
  CartesianGrid,
  Cell,
  Legend,
  Pie,
  PieChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";

const readiness = [
  { area: "Venue", score: 92 },
  { area: "Guests", score: 76 },
  { area: "Vendors", score: 73 },
  { area: "Style", score: 61 },
  { area: "Wedding day", score: 48 },
];

const progress = [
  { week: "12 Aug", readiness: 42 },
  { week: "19 Aug", readiness: 48 },
  { week: "26 Aug", readiness: 53 },
  { week: "2 Sep", readiness: 61 },
  { week: "9 Sep", readiness: 68 },
];

const responses = [
  { name: "Attending", value: 118, color: "var(--sage)" },
  { name: "Pending", value: 38, color: "var(--gold)" },
  { name: "Declined", value: 8, color: "var(--wine)" },
];

const tooltipStyle = {
  backgroundColor: "var(--surface)",
  border: "1px solid var(--line)",
  borderRadius: 12,
  boxShadow: "var(--shadow-soft)",
  color: "var(--ink)",
  fontSize: 12,
};

export function WeddingAnalytics() {
  return (
    <section className="grid gap-4 xl:grid-cols-[1.15fr_.85fr]">
      <article className="panel min-w-0">
        <div className="panel-header">
          <div>
            <p className="eyebrow">Readiness</p>
            <h3>Progress by planning area</h3>
          </div>
          <span className="text-xs font-semibold text-vow-muted">Live overview</span>
        </div>
        <div className="h-72 w-full" aria-label="Planning readiness by area">
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={readiness} layout="vertical" margin={{ left: 8, right: 18 }}>
              <CartesianGrid stroke="var(--line)" strokeDasharray="3 3" horizontal={false} />
              <XAxis
                type="number"
                domain={[0, 100]}
                tick={{ fill: "var(--muted)", fontSize: 10 }}
                axisLine={false}
                tickLine={false}
              />
              <YAxis
                dataKey="area"
                type="category"
                width={84}
                tick={{ fill: "var(--muted)", fontSize: 11 }}
                axisLine={false}
                tickLine={false}
              />
              <Tooltip
                contentStyle={tooltipStyle}
                cursor={{ fill: "var(--surface-soft)" }}
                formatter={(value) => [`${value}%`, "Ready"]}
              />
              <Bar dataKey="score" fill="var(--wine)" radius={[0, 8, 8, 0]} barSize={16} />
            </BarChart>
          </ResponsiveContainer>
        </div>
      </article>

      <article className="panel min-w-0">
        <div className="panel-header">
          <div>
            <p className="eyebrow">Guest responses</p>
            <h3>RSVP snapshot</h3>
          </div>
        </div>
        <div className="h-72 w-full" aria-label="Guest RSVP response breakdown">
          <ResponsiveContainer width="100%" height="100%">
            <PieChart>
              <Pie
                data={responses}
                dataKey="value"
                nameKey="name"
                innerRadius={58}
                outerRadius={88}
                paddingAngle={3}
              >
                {responses.map((entry) => (
                  <Cell key={entry.name} fill={entry.color} />
                ))}
              </Pie>
              <Tooltip contentStyle={tooltipStyle} />
              <Legend iconType="circle" wrapperStyle={{ color: "var(--muted)", fontSize: 11 }} />
            </PieChart>
          </ResponsiveContainer>
        </div>
      </article>

      <article className="panel min-w-0 xl:col-span-2">
        <div className="panel-header">
          <div>
            <p className="eyebrow">Five-week trend</p>
            <h3>Planning momentum</h3>
          </div>
          <strong className="text-sm text-vow-sage">+26%</strong>
        </div>
        <div className="h-64 w-full" aria-label="Planning progress over five weeks">
          <ResponsiveContainer width="100%" height="100%">
            <AreaChart data={progress} margin={{ left: -18, right: 10 }}>
              <defs>
                <linearGradient id="readinessFill" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="var(--wine)" stopOpacity={0.28} />
                  <stop offset="95%" stopColor="var(--wine)" stopOpacity={0} />
                </linearGradient>
              </defs>
              <CartesianGrid stroke="var(--line)" strokeDasharray="3 3" vertical={false} />
              <XAxis
                dataKey="week"
                tick={{ fill: "var(--muted)", fontSize: 10 }}
                axisLine={false}
                tickLine={false}
              />
              <YAxis
                domain={[0, 100]}
                tick={{ fill: "var(--muted)", fontSize: 10 }}
                axisLine={false}
                tickLine={false}
              />
              <Tooltip
                contentStyle={tooltipStyle}
                formatter={(value) => [`${value}%`, "Readiness"]}
              />
              <Area
                type="monotone"
                dataKey="readiness"
                stroke="var(--wine)"
                strokeWidth={3}
                fill="url(#readinessFill)"
              />
            </AreaChart>
          </ResponsiveContainer>
        </div>
      </article>
    </section>
  );
}
