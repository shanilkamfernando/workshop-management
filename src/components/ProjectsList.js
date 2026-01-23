import React, { useState, useEffect, useCallback } from "react";
import axios from "axios";
import { useNavigate, useParams } from "react-router-dom";
import logo from "../images/logo.png";
import mainlogo from "../images/mainlogo.jpeg";

function ProjectsList() {
  const { partnerId } = useParams();
  const [projects, setProjects] = useState([]);
  const [newProject, setNewProject] = useState("");
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const navigate = useNavigate();
  const token = localStorage.getItem("token");
  const role = localStorage.getItem("role");
  const username = localStorage.getItem("username");

  const fetchProjects = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);

      let endpoint = `${process.env.REACT_APP_API_URL}/projects/${partnerId}`;

      //admin sees projects with status/notifications
      if (role === "admin" || role === "office_admin") {
        endpoint = `${process.env.REACT_APP_API_URL}/projects/${partnerId}/status`;
      } else if (role === "office" || role === "stores") {
        endpoint = `${process.env.REACT_APP_API_URL}/projects/${partnerId}/status/office`;
      }

      console.log("Fetching projects for partner:", partnerId);

      const res = await axios.get(endpoint, {
        headers: { Authorization: `Bearer ${token}` },
      });

      console.log("Projects fetched:", res.data);
      setProjects(res.data);
    } catch (err) {
      console.error("Error fetching projects:", err);

      // Fallback to regular endpoint if status endpoint fails
      if (
        role === "admin" ||
        role === "office" ||
        role === "office_admin" ||
        role === "stores"
      ) {
        try {
          const fallbackRes = await axios.get(
            `${process.env.REACT_APP_API_URL}/projects/${partnerId}`,
            {
              headers: { Authorization: `Bearer ${token}` },
            },
          );
          setProjects(fallbackRes.data || []);
          setError(null);
        } catch (fallbackErr) {
          setError(
            fallbackErr.response?.data?.error || "Failed to fetch projects",
          );
        }
      } else {
        setError(err.response?.data?.error || "Failed to fetch projects");
      }
    } finally {
      setLoading(false);
    }
  }, [partnerId, role, token]);

  useEffect(() => {
    if (partnerId) {
      fetchProjects();
    }
  }, [partnerId, fetchProjects]);

  // Refresh projects every 5 seconds for admin (to update notification dots)
  // useEffect(() => {
  //   if (
  //     role !== "admin" &&
  //     role !== "office" &&
  //     role !== "office_admin" &&
  //     role !== "stores"
  //   )
  //     return;

  //   const interval = setInterval(() => {
  //     if (partnerId) {
  //       fetchProjects();
  //     }
  //   }, 5000);

  //   return () => clearInterval(interval);
  // }, [partnerId, role]);

  const createProject = async () => {
    if (!newProject.trim()) {
      alert("Please enter a project name");
      return;
    }

    try {
      const res = await axios.post(
        `${process.env.REACT_APP_API_URL}/projects`,
        {
          name: newProject,
          partnerId: parseInt(partnerId),
        },
        {
          headers: { Authorization: `Bearer ${token}` },
        },
      );

      setProjects([...projects, res.data]);
      setNewProject("");
      alert("Project created successfully!");

      fetchProjects();
    } catch (err) {
      console.error("Error creating project:", err);
      alert(err.response?.data?.error || "Failed to create project");
    }
  };

  // Delete project - admin only
  const deleteProject = async (projectId, projectName) => {
    const confirmed = window.confirm(
      `Are you sure you want to delete "${projectName}"? This action cannot be undone.`,
    );

    if (!confirmed) return;

    try {
      await axios.delete(
        `${process.env.REACT_APP_API_URL}/projects/${projectId}`,
        {
          headers: { Authorization: `Bearer ${token}` },
        },
      );

      setProjects(projects.filter((p) => p.id !== projectId));
      alert("Project deleted successfully!");
    } catch (err) {
      alert(err.response?.data?.error || "Failed to delete project");
    }
  };

  // const getNotificationColor = (color) => {
  //   const colorMap = {
  //     red: "bg-red-500",
  //     yellow: "bg-yellow-500",
  //     green: "bg-green-500",
  //     orange: "bg-orange-500",
  //     gray: "bg-gray-500",
  //   };
  //   return colorMap[color] || "";
  // };

  // const getNotificationLabel = (color) => {
  //   const labelMap = {
  //     red: "New Entries",
  //     yellow: "Pending Approval", //only admin see this
  //     green: "Approved - PO Pending",
  //     orange: "Invoice Pending",
  //     gray: "Driver Details Pending",
  //   };
  //   return labelMap[color] || "";
  // };

  if (loading) {
    return (
      <div className="p-6 text-center text-gray-500">Loading projects...</div>
    );
  }

  if (error) {
    return (
      <div className="p-6 text-center">
        <p className="text-red-500">Error: {error}</p>
        <button
          onClick={() => navigate("/partners")}
          className="mt-4 bg-blue-500 text-white px-4 py-2 rounded-lg hover:bg-blue-600 transition"
        >
          Back to Partners
        </button>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-purple-50">
      {/* Header */}
      <div className="bg-white shadow-md">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4 flex justify-between items-center">
          <div className="flex items-center justify-center space-x-10">
            {/* <div className="w-10 h-10 bg-blue-600 rounded-lg flex items-center justify-center">
              <span className="text-white font-bold text-3xl">C</span>
            </div> */}
            <div className=" rounded-lg flex items-baseline justify-center">
              <img src={mainlogo} width={50} height={50} alt="mainlogo" />
              <img src={logo} alt="Logo" />
            </div>
            <span className="text-gray-600 text-3xl">
              Welcome, <strong>{username}</strong>
            </span>
          </div>

          <div className="flex items-center space-x-3">
            <button
              onClick={() => navigate("/partners")}
              className="bg-gray-500 hover:bg-gray-600 text-white px-4 py-2 rounded-lg transition-colors duration-200 flex items-center space-x-2"
            >
              <svg
                xmlns="http://www.w3.org/2000/svg"
                className="h-5 w-5"
                viewBox="0 0 20 20"
                fill="currentColor"
              >
                <path
                  fillRule="evenodd"
                  d="M9.707 16.707a1 1 0 01-1.414 0l-6-6a1 1 0 010-1.414l6-6a1 1 0 011.414 1.414L5.414 9H17a1 1 0 110 2H5.414l4.293 4.293a1 1 0 010 1.414z"
                  clipRule="evenodd"
                />
              </svg>
              <span>Back to Partners</span>
            </button>

            <button
              onClick={() => {
                localStorage.clear();
                navigate("/login");
              }}
              className="bg-red-500 hover:bg-red-600 text-white px-4 py-2 rounded-lg flex items-center space-x-2 transition"
            >
              <span>Logout</span>
            </button>
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        <div className="text-center mb-12">
          <h1 className="text-5xl font-bold text-gray-900 mb-3">Projects</h1>
          <div className="mt-4 flex justify-center">
            <div className="h-1 w-24 bg-gradient-to-r from-blue-500 to-purple-500 rounded-full"></div>
          </div>
        </div>

        {/* Add Project Form */}
        {role === "admin" && (
          <div className="max-w-2xl mx-auto mb-12 bg-white rounded-2xl shadow-xl p-8 border border-gray-100">
            <h2 className="text-2xl font-bold text-gray-800 mb-6 text-center">
              Add New Project
            </h2>
            <div className="flex gap-3">
              <input
                type="text"
                value={newProject}
                onChange={(e) => setNewProject(e.target.value)}
                placeholder="Project name"
                className="flex-1 px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all"
                onKeyPress={(e) => {
                  if (e.key === "Enter") createProject();
                }}
              />
              <button
                onClick={createProject}
                className="bg-gradient-to-r from-green-500 to-green-600 hover:from-green-600 hover:to-green-700 text-white px-6 py-3 rounded-lg font-semibold shadow-md hover:shadow-lg transition-all"
              >
                Add
              </button>
            </div>
          </div>
        )}

        {/* Projects Grid */}
        {projects.length === 0 ? (
          <div className="text-center py-20 text-gray-500">
            No projects yet. {role === "admin" && "Create one above!"}
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
            {projects.map((p) => (
              <div
                key={p.id}
                className="group relative bg-white rounded-2xl shadow-md hover:shadow-2xl transition-all duration-300 border border-gray-100 hover:border-blue-200 overflow-hidden"
              >
                {role === "admin" && (
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      deleteProject(p.id, p.name);
                    }}
                    className="absolute top-3 right-3 bg-red-500 hover:bg-red-600 text-white p-2 rounded-lg opacity-0 group-hover:opacity-100 transition-all duration-200 shadow-lg z-10"
                    title="Delete project"
                  >
                    <svg
                      xmlns="http://www.w3.org/2000/svg"
                      className="h-5 w-5"
                      viewBox="0 0 20 20"
                      fill="currentColor"
                    >
                      <path
                        fillRule="evenodd"
                        d="M9 2a1 1 0 00-.894.553L7.382 4H4a1 1 0 000 2v10a2 2 0 002 2h8a2 2 0 002-2V6a1 1 0 100-2h-3.382l-.724-1.447A1 1 0 0011 2H9zM7 8a1 1 0 012 0v6a1 1 0 11-2 0V8zm5-1a1 1 0 00-1 1v6a1 1 0 102 0V8a1 1 0 00-1-1z"
                        clipRule="evenodd"
                      />
                    </svg>
                  </button>
                )}
                <button
                  onClick={() => navigate(`/dashboard/${p.id}`)}
                  className="w-full p-6 text-left hover:bg-gray-50 transition-colors duration-200"
                >
                  <h3 className="text-xl font-bold text-gray-800 mb-1 group-hover:text-blue-600 transition-colors">
                    {p.name}
                  </h3>
                  <div className="flex items-center text-sm text-gray-500 mt-2">
                    <svg
                      xmlns="http://www.w3.org/2000/svg"
                      className="h-4 w-4 mr-1"
                      fill="none"
                      viewBox="0 0 24 24"
                      stroke="currentColor"
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={2}
                        d="M9 5l7 7-7 7"
                      />
                    </svg>
                    <span>View Project</span>
                  </div>

                  {/* Admin Only: Pending Count */}
                  {(role === "admin" ||
                    role === "office" ||
                    role === "office_admin" ||
                    role === "stores") &&
                    p.totalPending > 0 && (
                      <div className="mt-4 pt-4 border-t border-gray-200 space-y-1">
                        <p className="text-xs font-semibold text-gray-700">
                          Pending Updates:
                        </p>
                        {p.counts.newEntries > 0 && (
                          <p className="text-xs text-red-600">
                            • {p.counts.newEntries} new entries
                          </p>
                        )}
                        {(role === "admin" || role === "office_admin") &&
                          p.counts.pendingApproval > 0 && (
                            <p className="text-xs text-yellow-600">
                              • {p.counts.pendingApproval} awaiting approval
                            </p>
                          )}
                        {p.counts.approvedPendingPo > 0 && (
                          <p className="text-xs text-green-600">
                            • {p.counts.approvedPendingPo} waiting for PO
                          </p>
                        )}
                        {p.counts.pendingInvoice > 0 && (
                          <p className="text-xs text-orange-600">
                            • {p.counts.pendingInvoice} waiting for invoice
                          </p>
                        )}
                        {p.counts.pendingDriver > 0 && (
                          <p className="text-xs text-gray-600">
                            • {p.counts.pendingDriver} waiting for driver
                            details
                          </p>
                        )}
                      </div>
                    )}
                </button>

                {/* {role === "admin" && (
                  <div className="absolute bottom-3 right-3">
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        deleteProject(p.id, p.name);
                      }}
                      className="bg-red-500 hover:bg-red-600 text-white px-3 py-2 rounded-lg shadow-md hover:shadow-lg transition-all duration-200 flex items-center space-x-1"
                      title={`Delete ${p.name}`}
                    >
                      <svg
                        xmlns="http://www.w3.org/2000/svg"
                        className="h-4 w-4"
                        viewBox="0 0 20 20"
                        fill="currentColor"
                      >
                        <path
                          fillRule="evenodd"
                          d="M9 2a1 1 0 00-.894.553L7.382 4H4a1 1 0 000 2v10a2 2 0 002 2h8a2 2 0 002-2V6a1 1 0 100-2h-3.382l-.724-1.447A1 1 0 0011 2H9zM7 8a1 1 0 012 0v6a1 1 0 11-2 0V8zm5-1a1 1 0 00-1 1v6a1 1 0 102 0V8a1 1 0 00-1-1z"
                          clipRule="evenodd"
                        />
                      </svg>
                      <span className="text-xs font-semibold">Delete</span>
                    </button>
                  </div>
                )} */}
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

export default ProjectsList;
