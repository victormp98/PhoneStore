export function MetricCard(props: { title: string; value: number }) {
  return (
    <article className="metricCard">
      <span>{props.title}</span>
      <strong>{props.value}</strong>
    </article>
  );
}
