import { Badge, getStatusVariant } from "./Badge";
import { EmptyState } from "./EmptyState";
import type { ApiObject, TableColumn } from "../types/api";
import { formatDate, formatMoney, formatShortId, formatValue } from "../utils/formatters";

export function DataTable(props: { columns: TableColumn[]; rows: ApiObject[] }) {
  if (props.rows.length === 0) {
    return <EmptyState />;
  }

  return (
    <div className="tableWrapper">
      <table>
        <thead>
          <tr>
            {props.columns.map((column) => (
              <th key={column.key}>{column.label}</th>
            ))}
          </tr>
        </thead>
        <tbody>
          {props.rows.map((row, index) => (
            <tr key={String(row.id ?? index)}>
              {props.columns.map((column) => (
                <td key={column.key}>{renderCell(row, column)}</td>
              ))}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

function renderCell(row: ApiObject, column: TableColumn) {
  const value = Object.prototype.hasOwnProperty.call(row, column.key)
    ? row[column.key]
    : undefined;

  if (column.type === "status") {
    const text = formatValue(value);

    return text ? <Badge variant={getStatusVariant(text)}>{text}</Badge> : "";
  }

  if (column.type === "boolean") {
    const text = formatValue(value);

    return text ? <Badge variant={getStatusVariant(text)}>{text}</Badge> : "";
  }

  if (column.type === "shortId") {
    const text = formatShortId(value);

    return text ? <span className="shortId">{text}</span> : "";
  }

  if (column.type === "date") {
    return formatDate(value);
  }

  if (column.type === "money") {
    return formatMoney(value);
  }

  return formatValue(value);
}
