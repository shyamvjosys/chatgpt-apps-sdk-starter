"use client";

import { useWidgetProps, useMaxHeight, useDisplayMode } from "../hooks";
import type { ProvisioningStatus } from "@/lib/types";
import { useState } from "react";

export default function ProvisioningStatusPage() {
  const toolOutput = useWidgetProps<{
    result?: {
      structuredContent?: ProvisioningStatus;
    };
  }>();
  const maxHeight = useMaxHeight() ?? undefined;
  const displayMode = useDisplayMode();

  const data = toolOutput?.result?.structuredContent;
  const [filter, setFilter] = useState<string>("all");

  if (!data) {
    return (
      <div className="p-6">
        <p>Loading provisioning status...</p>
      </div>
    );
  }

  const filteredServices =
    filter === "all"
      ? data.services
      : data.services.filter((s) => s.status === filter);

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

  const getRoleBadge = (role: string) => {
    if (role.includes("IT Admin")) {
      return "bg-purple-100 text-purple-800 border-purple-300";
    }
    return "bg-blue-100 text-blue-800 border-blue-300";
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
        <h1 className="text-2xl font-bold mb-4">Provisioning Status</h1>

        <div
          className="border rounded-lg p-4 mb-6"
          style={{
            backgroundColor: "var(--color-background-secondary)",
            borderColor: "var(--color-border)",
          }}
        >
          <div className="grid grid-cols-2 gap-4">
            <div>
              <h3 className="text-lg font-semibold mb-2">{data.employee.name}</h3>
              <div className="space-y-1 text-sm">
                <div>
                  <span className="text-gray-500">Email:</span>{" "}
                  <span className="font-mono">{data.employee.email}</span>
                </div>
                <div>
                  <span className="text-gray-500">User ID:</span>{" "}
                  <span className="font-mono">{data.employee.userId}</span>
                </div>
                <div>
                  <span className="text-gray-500">Location:</span>{" "}
                  <span>{data.employee.workLocation || "N/A"}</span>
                </div>
              </div>
            </div>
            <div className="flex flex-col justify-center items-end gap-2">
              <span
                className={`px-3 py-1 text-sm rounded border ${
                  data.employee.status === "Active"
                    ? "bg-green-100 text-green-800 border-green-300"
                    : "bg-red-100 text-red-800 border-red-300"
                }`}
              >
                {data.employee.status}
              </span>
              {data.employee.role && (
                <span className={`px-3 py-1 text-sm rounded border ${getRoleBadge(data.employee.role)}`}>
                  {data.employee.role}
                </span>
              )}
            </div>
          </div>
        </div>

        <div className="grid grid-cols-5 gap-3 mb-6">
          <div className="border rounded p-3 text-center" style={{ borderColor: "var(--color-border)" }}>
            <div className="text-xl font-bold">{data.servicesSummary.total}</div>
            <div className="text-xs text-gray-600">Total</div>
          </div>
          <div className="border rounded p-3 text-center" style={{ borderColor: "var(--color-border)" }}>
            <div className="text-xl font-bold text-green-600">{data.servicesSummary.activated}</div>
            <div className="text-xs text-gray-600">Activated</div>
          </div>
          <div className="border rounded p-3 text-center" style={{ borderColor: "var(--color-border)" }}>
            <div className="text-xl font-bold text-yellow-600">{data.servicesSummary.invited}</div>
            <div className="text-xs text-gray-600">Invited</div>
          </div>
          <div className="border rounded p-3 text-center" style={{ borderColor: "var(--color-border)" }}>
            <div className="text-xl font-bold text-gray-600">{data.servicesSummary.deactivated}</div>
            <div className="text-xs text-gray-600">Deactivated</div>
          </div>
          <div className="border rounded p-3 text-center" style={{ borderColor: "var(--color-border)" }}>
            <div className="text-xl font-bold text-red-600">{data.servicesSummary.deleted}</div>
            <div className="text-xs text-gray-600">Deleted</div>
          </div>
        </div>

        <div className="flex gap-2 mb-4">
          <button
            onClick={() => setFilter("all")}
            className={`px-3 py-1 text-sm rounded ${
              filter === "all" ? "bg-blue-600 text-white" : "bg-gray-200 text-gray-700"
            }`}
          >
            All
          </button>
          <button
            onClick={() => setFilter("Activated")}
            className={`px-3 py-1 text-sm rounded ${
              filter === "Activated" ? "bg-green-600 text-white" : "bg-gray-200 text-gray-700"
            }`}
          >
            Activated
          </button>
          <button
            onClick={() => setFilter("Invited")}
            className={`px-3 py-1 text-sm rounded ${
              filter === "Invited" ? "bg-yellow-600 text-white" : "bg-gray-200 text-gray-700"
            }`}
          >
            Invited
          </button>
          <button
            onClick={() => setFilter("Deactivated")}
            className={`px-3 py-1 text-sm rounded ${
              filter === "Deactivated" ? "bg-gray-600 text-white" : "bg-gray-200 text-gray-700"
            }`}
          >
            Deactivated
          </button>
        </div>
      </div>

      <div className="grid grid-cols-2 gap-2">
        {filteredServices.map((service, idx) => (
          <div
            key={idx}
            className="border rounded p-2 flex justify-between items-center"
            style={{
              backgroundColor: "var(--color-background-primary)",
              borderColor: "var(--color-border)",
            }}
          >
            <span className="text-sm truncate" title={service.name}>
              {service.name}
            </span>
            <span className={`px-2 py-0.5 text-xs rounded border ml-2 ${getStatusBadge(service.status)}`}>
              {service.status}
            </span>
          </div>
        ))}
      </div>
    </div>
  );
}

