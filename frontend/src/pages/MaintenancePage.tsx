import { useState, useEffect } from "react";
import { getLabPMCReports, type PMCReport } from "../api/maintenance";

// Import workstation helper
import { getLabWorkstationsForReport } from "../api/workstationReports";
// Import auth to get assigned lab
import { getUserAssignedLab } from "../api/dailyReports";
// ✅ IMPORT useAuth to get user role and lab_id
import { useAuth } from "../context/AuthContext";

import MaintenanceForm from "../components/maintenance/MaintenanceForm";
import MaintenanceView from "../components/maintenance/MaintenanceView";
import { CheckCircle, XCircle, Monitor, Plus, FileText } from "lucide-react";

const MaintenancePage = () => {
  // ✅ Get the user from AuthContext
  const { user } = useAuth();

  const [view, setView] = useState<"list" | "view" | "create" | "edit">("list");

  // Data State
  const [reports, setReports] = useState<PMCReport[]>([]);
  const [labWorkstations, setLabWorkstations] = useState<any[]>([]);

  const [targetWorkstation, setTargetWorkstation] = useState<{
    id: number;
    name: string;
  } | null>(null);

  // Filter State
  const [selectedQuarter, setSelectedQuarter] = useState<string>("1st");
  const [userLabId, setUserLabId] = useState<number | null>(null);
  const [assignedLabName, setAssignedLabName] = useState<string>("");

  // UI-only state for toggles
  const [activeTab, setActiveTab] = useState<"all" | "pending">("all");

  // List of Quarters for the new UI Tabs
  const quartersList = [
    { id: "1st", num: "Q1", label: "1st Quarter" },
    { id: "2nd", num: "Q2", label: "2nd Quarter" },
    { id: "3rd", num: "Q3", label: "3rd Quarter" },
    { id: "4th", num: "Q4", label: "4th Quarter" },
  ];

  useEffect(() => {
    fetchData();
  }, [selectedQuarter]);

  const fetchData = async () => {
    try {
      const userData = await getUserAssignedLab();
      if (!userData?.assigned_lab) return;

      const labId = userData.assigned_lab.lab_id;
      setUserLabId(labId);
      setAssignedLabName(userData.assigned_lab.lab_name);

      const wsData = await getLabWorkstationsForReport(labId);
      setLabWorkstations(wsData);

      const reportsData = await getLabPMCReports(labId, selectedQuarter);
      setReports(reportsData);
    } catch (error) {
      console.error("Failed to load maintenance data", error);
    }
  };

  const findReportForWorkstation = (workstationId: number) => {
    return reports.find((r) => r.workstation_id === workstationId);
  };

  const getStatusColor = (statusName?: string) => {
    switch (statusName) {
      case "Functional":
      case "Working":
      case "Operational":
        return "bg-green-100 text-green-800";
      case "For Repair":
        return "bg-yellow-100 text-yellow-800";
      case "For Replacement":
      case "Defective":
      case "Condemned":
        return "bg-red-100 text-red-800";
      case "For Upgrade":
        return "bg-blue-100 text-blue-800";
      default:
        return "bg-gray-100 text-gray-800";
    }
  };

  const handleWorkstationClick = (ws: any) => {
    setTargetWorkstation({ id: ws.workstation_id, name: ws.workstation_name });
    setView("view");
  };

  const handleServiceClick = () => {
    setView("create");
  };

  const sortedWorkstations = [...labWorkstations].sort((a, b) =>
    a.workstation_name.localeCompare(b.workstation_name, undefined, {
      numeric: true,
      sensitivity: "base",
    }),
  );

  return (
    <div className="space-y-6 p-6 bg-slate-50 min-h-screen">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-bold text-gray-900">
          Maintenance & Services
        </h1>
        <p className="text-gray-600">
          Quarterly Preventive Maintenance Checklist (QPMC)
        </p>

        {/* ✅ Lab Assigned Indicator for Custodians */}
        {user?.role === "Custodian" && user?.lab_id && (
          <div className="mt-2 inline-flex items-center px-3 py-1 rounded-full text-sm font-medium bg-blue-100 text-blue-800">
            📍 Assigned Lab: {assignedLabName || "Loading..."}
          </div>
        )}
      </div>

      {view === "list" && (
        <div className="space-y-4">
          {/* Top Filter Toggle & Controls */}
          <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-4">
            <div className="flex items-center justify-between flex-wrap gap-4">
              {/* Left Side: Toggles */}
              <div className="flex items-center space-x-3 bg-gray-50 p-1 rounded-lg border border-gray-200">
                <button
                  onClick={() => setActiveTab("all")}
                  className={`px-4 py-2 rounded-md font-medium text-sm transition-colors ${
                    activeTab === "all"
                      ? "bg-white text-blue-600 shadow-sm border border-gray-200"
                      : "text-gray-600 hover:text-gray-900"
                  }`}
                >
                  All Workstations
                </button>
                <button
                  onClick={() => setActiveTab("pending")}
                  className={`px-4 py-2 rounded-md font-medium text-sm transition-colors ${
                    activeTab === "pending"
                      ? "bg-white text-blue-600 shadow-sm border border-gray-200"
                      : "text-gray-600 hover:text-gray-900"
                  }`}
                >
                  Other Assets
                </button>
              </div>

              {/* Right Side: Action Controls */}
              <div className="flex items-center space-x-3">
                <button className="h-10 px-4 bg-white border border-gray-300 text-gray-700 text-sm rounded-lg hover:bg-gray-50 flex items-center font-medium shadow-sm transition-colors">
                  <Plus className="w-4 h-4 mr-2 text-blue-600" /> Add Schedule
                </button>
                <button className="h-10 px-4 bg-blue-600 text-white text-sm rounded-lg hover:bg-blue-700 flex items-center font-medium shadow-sm transition-colors">
                  <FileText className="w-4 h-4 mr-2" /> View Report
                </button>
              </div>
            </div>
          </div>

          {/* Attached Tabs and Table Wrapper */}
          <div>
            {/* Quarter Tabs matching the attached design */}
            <div className="flex gap-2 items-end h-21.25">
              {quartersList.map((q) => {
                const isActive = selectedQuarter === q.id;
                return (
                  <button
                    key={q.id}
                    onClick={() => setSelectedQuarter(q.id)}
                    className={`relative flex flex-col items-start justify-center w-36 transition-all ${
                      isActive
                        ? "bg-white text-blue-600 rounded-t-2xl z-10 border-t border-x border-gray-100 px-6 py-4 -mb-px shadow-[0_-4px_10px_rgba(0,0,0,0.02)]"
                        : "bg-blue-500 text-white hover:bg-blue-600 rounded-xl px-5 py-3 mb-2 shadow-sm"
                    }`}
                  >
                    {/* The vertical left blue line for the active tab */}
                    {isActive && (
                      <div className="absolute left-0 top-4 bottom-4 w-1 bg-blue-600 rounded-r-md"></div>
                    )}
                    <div className={isActive ? "pl-1" : ""}>
                      <span className="text-2xl font-bold leading-none block text-left mb-1">
                        {q.num}
                      </span>
                      <span
                        className={`text-xs font-medium tracking-wide block text-left ${
                          isActive ? "text-gray-500" : "text-blue-100"
                        }`}
                      >
                        {q.label}
                      </span>
                    </div>
                  </button>
                );
              })}
            </div>

            {/* Main Table Content */}
            <div className="bg-white shadow-sm rounded-xl rounded-tl-none overflow-hidden border border-gray-100 relative z-0">
              <div className="p-5 border-b border-gray-100 bg-white flex items-center justify-between">
                <div className="flex items-center">
                  <div className="w-8 h-8 rounded-full bg-blue-50 flex items-center justify-center mr-3">
                    <Monitor className="w-4 h-4 text-blue-600" />
                  </div>
                  <h3 className="font-semibold text-gray-900">
                    {assignedLabName
                      ? `${assignedLabName} Workstations`
                      : "Workstation Status"}
                  </h3>
                </div>
              </div>

              <table className="min-w-full divide-y divide-gray-100">
                <thead className="bg-gray-50/50">
                  <tr>
                    <th className="px-6 py-4 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider">
                      Workstation Name
                    </th>
                    <th className="px-6 py-4 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider">
                      Current Status
                    </th>
                    <th className="px-6 py-4 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider">
                      {selectedQuarter} Quarter Status
                    </th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-50">
                  {sortedWorkstations.length === 0 ? (
                    <tr>
                      <td
                        colSpan={3}
                        className="px-6 py-12 text-center text-gray-500"
                      >
                        {userLabId
                          ? "No workstations found in your laboratory."
                          : "Loading laboratory data..."}
                      </td>
                    </tr>
                  ) : (
                    sortedWorkstations.map((ws) => {
                      const isServiced = !!findReportForWorkstation(
                        ws.workstation_id,
                      );

                      return (
                        <tr
                          key={ws.workstation_id}
                          onClick={() => handleWorkstationClick(ws)}
                          className="hover:bg-blue-50/50 transition-colors cursor-pointer group"
                        >
                          <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-700 group-hover:text-blue-700">
                            {ws.workstation_name}
                          </td>

                          <td className="px-6 py-4 whitespace-nowrap text-sm">
                            <span
                              className={`px-2.5 py-1 text-xs font-medium rounded-md ${getStatusColor(
                                ws.current_status?.status_name,
                              )}`}
                            >
                              {ws.current_status?.status_name || "Unknown"}
                            </span>
                          </td>

                          <td className="px-6 py-4 whitespace-nowrap text-sm">
                            {isServiced ? (
                              <span className="inline-flex items-center px-2.5 py-1 rounded-md text-xs font-medium bg-green-50 text-green-700 border border-green-100">
                                <CheckCircle className="w-3.5 h-3.5 mr-1.5" />
                                Serviced
                              </span>
                            ) : (
                              <span className="inline-flex items-center px-2.5 py-1 rounded-md text-xs font-medium bg-red-50 text-red-700 border border-red-100">
                                <XCircle className="w-3.5 h-3.5 mr-1.5" />
                                Pending
                              </span>
                            )}
                          </td>
                        </tr>
                      );
                    })
                  )}
                </tbody>
              </table>
              <div className="bg-white px-6 py-4 border-t border-gray-100 text-xs text-gray-400">
                Showing status for{" "}
                <span className="font-medium text-gray-600">
                  {sortedWorkstations.length}
                </span>{" "}
                workstations in {selectedQuarter} Quarter
              </div>
            </div>
          </div>
        </div>
      )}

      {/* VIEW MODE */}
      {view === "view" && targetWorkstation && (
        <MaintenanceView
          workstation={{
            id: targetWorkstation.id,
            name: targetWorkstation.name,
            lab_name: assignedLabName,
          }}
          quarter={selectedQuarter}
          onService={handleServiceClick}
          onBack={() => setView("list")}
        />
      )}

      {/* CREATE/EDIT FORM */}
      {(view === "create" || view === "edit") && (
        <MaintenanceForm
          targetWorkstation={targetWorkstation}
          onSuccess={() => {
            setView("list");
            fetchData();
          }}
          onCancel={() => setView("list")}
        />
      )}
    </div>
  );
};

export default MaintenancePage;
