import type { TableRow } from "@/types/db.types";

export type NotificationRow = TableRow<"notifications">;

export type NotificationType = NotificationRow["type"];
