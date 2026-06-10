import { BarChart, Bar, XAxis, YAxis, ResponsiveContainer, Cell, Tooltip } from 'recharts';

export default function ExecutiveConversionChart({ data }) {
  if (!data?.length) {
    return <p className="text-sm text-content-muted py-8 text-center">No conversion data yet</p>;
  }

  return (
    <div className="h-44">
      <ResponsiveContainer width="100%" height="100%">
        <BarChart data={data} layout="vertical" margin={{ left: 0, right: 8 }}>
          <XAxis type="number" hide />
          <YAxis type="category" dataKey="stage" width={72} tick={{ fontSize: 11 }} stroke="currentColor" className="text-content-muted" />
          <Tooltip />
          <Bar dataKey="count" radius={[0, 6, 6, 0]} barSize={18}>
            {data.map((entry, i) => (
              <Cell key={i} fill={entry.color} fillOpacity={0.9} />
            ))}
          </Bar>
        </BarChart>
      </ResponsiveContainer>
    </div>
  );
}
