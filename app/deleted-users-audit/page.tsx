"use client";

import { useWidgetProps, useMaxHeight, useDisplayMode } from "../hooks";
import type { DeletedUserAudit } from "@/lib/types";

export default function DeletedUsersAuditPage() {
  const toolOutput = useWidgetProps<{
    result?: {
      structuredContent?: {
        audits: DeletedUserAudit[];
      };
    };
  }>();
  const maxHeight = useMaxHeight() ?? undefined;
  const displayMode = useDisplayMode();

  const audits = toolOutput?.result?.structuredContent?.audits || [];

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
        <h1 className="text-2xl font-bold mb-2">Offboarding Audit</h1>
        <p className="text-sm text-gray-600 mb-4">
          Deleted users with active or invited service access
        </p>

        {audits.length > 0 ? (
          <div
            className="p-4 rounded-lg border-l-4 border-red-500"
            style={{
              backgroundColor: "var(--color-background-secondary)",
              borderRightColor: "var(--color-border)",
              borderTopColor: "var(--color-border)",
              borderBottomColor: "var(--color-border)",
            }}
          >
            <div className="flex items-center gap-2">
              <svg
                className="w-5 h-5 text-red-500"
                fill="currentColor"
                viewBox="0 0 20 20"
              >
                <path
                  fillRule="evenodd"
                  d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7 4a1 1 0 11-2 0 1 1 0 012 0zm-1-9a1 1 0 00-1 1v4a1 1 0 102 0V6a1 1 0 00-1-1z"
                  clipRule="evenodd"
                />
              </svg>
              <div>
                <div className="font-semibold text-red-700">
                  {audits.length} Security Issue{audits.length !== 1 ? "s" : ""} Found
                </div>
                <div className="text-sm text-gray-600">
                  These users are marked as deleted but still have active service access
                </div>
              </div>
            </div>
          </div>
        ) : (
          <div
            className="p-4 rounded-lg border-l-4 border-green-500"
            style={{
              backgroundColor: "var(--color-background-secondary)",
              borderRightColor: "var(--color-border)",
              borderTopColor: "var(--color-border)",
              borderBottomColor: "var(--color-border)",
            }}
          >
            <div className="flex items-center gap-2">
              <svg
                className="w-5 h-5 text-green-500"
                fill="currentColor"
                viewBox="0 0 20 20"
              >
                <path
                  fillRule="evenodd"
                  d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z"
                  clipRule="evenodd"
                />
              </svg>
              <div>
                <div className="font-semibold text-green-700">All Clear</div>
                <div className="text-sm text-gray-600">
                  No deleted users with active service access
                </div>
              </div>
            </div>
          </div>
        )}
      </div>

      {audits.length > 0 && (
        <div className="space-y-4">
          {audits.map((audit) => (
            <div
              key={audit.userId}
              className="border rounded-lg p-4 border-l-4 border-l-red-500"
              style={{
                backgroundColor: "var(--color-background-primary)",
                borderRightColor: "var(--color-border)",
                borderTopColor: "var(--color-border)",
                borderBottomColor: "var(--color-border)",
              }}
            >
              <div className="flex justify-between items-start mb-3">
                <div>
                  <h3 className="text-lg font-semibold">{audit.name}</h3>
                  <p className="text-sm text-gray-600">{audit.email}</p>
                  <p className="text-xs text-gray-500 font-mono">{audit.userId}</p>
                </div>
                <span className="px-3 py-1 bg-red-100 text-red-800 text-sm rounded border border-red-300 font-semibold">
                  {audit.issueCount} Issue{audit.issueCount !== 1 ? "s" : ""}
                </span>
              </div>

              {audit.activeServices.length > 0 && (
                <div className="mb-3">
                  <h4 className="text-sm font-semibold text-gray-700 mb-2">
                    Active Services ({audit.activeServices.length}):
                  </h4>
                  <div className="flex flex-wrap gap-2">
                    {audit.activeServices.map((service, idx) => (
                      <span
                        key={idx}
                        className="px-2 py-1 bg-green-100 text-green-800 text-xs rounded border border-green-300"
                      >
                        {service}
                      </span>
                    ))}
                  </div>
                </div>
              )}

              {audit.invitedServices.length > 0 && (
                <div>
                  <h4 className="text-sm font-semibold text-gray-700 mb-2">
                    Invited Services ({audit.invitedServices.length}):
                  </h4>
                  <div className="flex flex-wrap gap-2">
                    {audit.invitedServices.map((service, idx) => (
                      <span
                        key={idx}
                        className="px-2 py-1 bg-yellow-100 text-yellow-800 text-xs rounded border border-yellow-300"
                      >
                        {service}
                      </span>
                    ))}
                  </div>
                </div>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

