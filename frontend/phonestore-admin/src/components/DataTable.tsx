import { Badge, getStatusVariant } from "./Badge";
import { EmptyState } from "./EmptyState";
import type { ApiObject, TableColumn } from "../types/api";
import { formatDate, formatMoney, formatShortId, formatValue } from "../utils/formatters";

export function DataTable(props: {
  columns: TableColumn[];
  rows: ApiObject[];
  selectedRowId?: string;
  onSelectRow?: (row: ApiObject) => void;
  rowActions?: Array<{
    key: string;
    label: string;
    tone?: "primary" | "secondary" | "danger";
  }>;
  onRowAction?: (row: ApiObject, actionKey: string) => void;
}) {
  if (props.rows.length === 0) {
    return <EmptyState />;
  }

  return (
    <>
      <div className="tableWrapper">
        <table>
          <colgroup>
            {props.columns.map((column, index) => (
              <col
                key={column.key}
                style={{
                  width: getColumnWidth(column, index, props.columns.length)
                }}
              />
            ))}
          </colgroup>
          <thead>
            <tr>
              {props.columns.map((column) => (
                <th
                  key={column.key}
                  className={column.tone === "numeric" ? "numericCell" : ""}
                >
                  {column.label}
                </th>
              ))}
              {props.rowActions?.length ? <th className="rowActionsHeader">Acciones</th> : null}
            </tr>
          </thead>
          <tbody>
            {props.rows.map((row, index) => (
              <tr
                key={String(row.id ?? index)}
                className={String(row.id ?? index) === props.selectedRowId ? "tableRowSelected" : ""}
                onClick={() => props.onSelectRow?.(row)}
                onKeyDown={(event) => {
                  if (!props.onSelectRow) return;
                  if (event.key === "Enter" || event.key === " ") {
                    event.preventDefault();
                    props.onSelectRow(row);
                  }
                }}
                tabIndex={props.onSelectRow ? 0 : undefined}
                role={props.onSelectRow ? "button" : undefined}
              >
                {props.columns.map((column) => (
                  <td
                    key={column.key}
                    className={[
                      column.tone === "primary" ? "primaryCell" : "",
                      column.tone === "numeric" ? "numericCell" : "",
                      column.tone === "muted" ? "mutedCell" : ""
                    ].filter(Boolean).join(" ")}
                  >
                    {renderCell(row, column)}
                  </td>
                ))}
                {props.rowActions?.length ? (
                  <td className="rowActionsCell">
                    <div className="rowActionGroup">
                      {props.rowActions.map((action) => (
                        <button
                          key={action.key}
                          type="button"
                          className={
                            action.tone === "primary"
                              ? "primaryButton tinyButton"
                              : action.tone === "danger"
                                ? "dangerButton tinyButton"
                                : "secondaryButton tinyButton"
                          }
                          onClick={(event) => {
                            event.stopPropagation();
                            props.onRowAction?.(row, action.key);
                          }}
                        >
                          {action.label}
                        </button>
                      ))}
                    </div>
                  </td>
                ) : null}
              </tr>
            ))}
          </tbody>
        </table>
      </div>

    </>
  );
}

function getColumnWidth(column: TableColumn, index: number, total: number) {
  if (column.type === "shortId") return "10%";
  if (column.type === "date") return "14%";
  if (column.type === "money" || column.type === "number") return "12%";
  if (column.type === "status" || column.type === "boolean") return "11%";
  if (column.type === "list") return "16%";

  const flexibleColumns = Math.max(total - 3, 1);
  const base = index < 2 ? 20 : 100 / flexibleColumns;
  return `${Math.max(base, 14)}%`;
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

  if (column.type === "number") {
    return formatValue(value);
  }

  if (column.type === "list") {
    if (!Array.isArray(value) || value.length === 0) {
      return "";
    }

    return (
      <div className="chipList">
        {value.map((item, index) => (
          <span className="miniChip" key={`${String(item)}-${index}`}>
            {formatValue(item)}
          </span>
        ))}
      </div>
    );
  }

  return formatValue(value);
}
