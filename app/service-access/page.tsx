"use client";

import { useWidgetProps, useMaxHeight, useDisplayMode } from "../hooks";
import type { ServiceAccessInfo } from "@/lib/types";
import { useState } from "react";

export default function ServiceAccessPage() {
  const toolOutput = useWidgetProps<{
    result?: {
      structuredContent?: ServiceAccessInfo;
    };
  }>();
  const maxHeight = useMaxHeight() ?? undefined;
  const displayMode = useDisplayMode();

  const data = toolOutput?.result?.structuredContent;
  const [filterStatus, setFilterStatus] = useState<string>("all");

  if (!data) {
    return (
      <div className="p-6">
        <p>Loading service access data...</p>
      </div>
    );
  }

  const filteredUsers =
    filterStatus === "all"
      ? data.users
      : data.users.filter((u) => u.status === filterStatus);

  const getStatusBadge = (status: string) => {
    const colors = {
      Activated: "bg-green-100 text-green-800 border-green-300",
      Invited: "bg-yellow-100 text-yellow-800 border-yellow-300",
      Deactivated: "bg-gray-100 text-gray-800 border-gray-300",
      Deleted: "bg-red-100 text-red-800 border-red-300",
      Disabled: "bg-orange-100 text-orange-800 border-orange-300",
    };
    return colors[status as keyof typeof colors] || "bg-gray-100 text-gray-800 border-gray-300";
  };

  return (
    <div
      className="p-6"
      style={{
        maxHeight,
        height: displayMode === "fullscreen" ? maxHeight : undefined,
        overflow: "auto",
      }}
    >
      <div className="mb-6">
        <h1 className="text-2xl font-bold mb-2">{data.serviceName}</h1>
        <p className="text-sm text-gray-600 mb-4">Service Access Report</p>

        <div className="grid grid-cols-4 gap-4 mb-6">
          <div className="border rounded-lg p-4" style={{ borderColor: "var(--color-border)" }}>
            <div className="text-2xl font-bold text-green-600">{data.activeCount}</div>
            <div className="text-sm text-gray-600">Active</div>
          </div>
          <div className="border rounded-lg p-4" style={{ borderColor: "var(--color-border)" }}>
            <div className="text-2xl font-bold text-yellow-600">{data.invitedCount}</div>
            <div className="text-sm text-gray-600">Invited</div>
          </div>
          <div className="border rounded-lg p-4" style={{ borderColor: "var(--color-border)" }}>
            <div className="text-2xl font-bold text-gray-600">{data.deactivatedCount}</div>
            <div className="text-sm text-gray-600">Deactivated</div>
          </div>
          <div className="border rounded-lg p-4" style={{ borderColor: "var(--color-border)" }}>
            <div className="text-2xl font-bold text-blue-600">{data.totalCount}</div>
            <div className="text-sm text-gray-600">Total</div>
          </div>
        </div>

        <div className="flex gap-2 mb-4">
          <button
            onClick={() => setFilterStatus("all")}
            className={`px-3 py-1 text-sm rounded ${
              filterStatus === "all"
                ? "bg-blue-600 text-white"
                : "bg-gray-200 text-gray-700"
            }`}
          >
            All ({data.users.length})
          </button>
          <button
            onClick={() => setFilterStatus("Activated")}
            className={`px-3 py-1 text-sm rounded ${
              filterStatus === "Activated"
                ? "bg-green-600 text-white"
                : "bg-gray-200 text-gray-700"
            }`}
          >
            Active ({data.activeCount})
          </button>
          <button
            onClick={() => setFilterStatus("Invited")}
            className={`px-3 py-1 text-sm rounded ${
              filterStatus === "Invited"
                ? "bg-yellow-600 text-white"
                : "bg-gray-200 text-gray-700"
            }`}
          >
            Invited ({data.invitedCount})
          </button>
          <button
            onClick={() => setFilterStatus("Deactivated")}
            className={`px-3 py-1 text-sm rounded ${
              filterStatus === "Deactivated"
                ? "bg-gray-600 text-white"
                : "bg-gray-200 text-gray-700"
            }`}
          >
            Deactivated ({data.deactivatedCount})
          </button>
        </div>
      </div>

      <div className="space-y-2">
        {filteredUsers.map((user, idx) => (
          <div
            key={idx}
            className="border rounded p-3 flex justify-between items-center hover:shadow-sm transition-shadow"
            style={{
              backgroundColor: "var(--color-background-primary)",
              borderColor: "var(--color-border)",
            }}
          >
            <div>
              <div className="font-semibold">{user.name}</div>
              <div className="text-sm text-gray-600">{user.email}</div>
              <div className="text-xs text-gray-500 font-mono">{user.userId}</div>
            </div>
            <span className={`px-2 py-1 text-xs rounded border ${getStatusBadge(user.status)}`}>
              {user.status}
            </span>
          </div>
        ))}
      </div>
    </div>
  );
}

