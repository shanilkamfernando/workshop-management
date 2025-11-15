import React, { useState, useEffect } from "react";
import axios from "axios";
import { useNavigate, useParams } from "react-router-dom";
import logo from "../images/logo.png";

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

  const fetchProjects = async () => {
    try {
      setLoading(true);
      setError(null);

      console.log("Fetching projects for partner:", partnerId);

      const res = await axios.get(
        `http://localhost:3001/projects/${partnerId}`,
        {
          headers: { Authorization: `Bearer ${token}` },
        }
      );

      console.log("Projects fetched:", res.data);
      setProjects(res.data);
    } catch (err) {
      console.error("Error fetching projects:", err);
      setError(err.response?.data?.error || "Failed to fetch projects");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (partnerId) {
      fetchProjects();
    }
  }, [partnerId]);

  const createProject = async () => {
    if (!newProject.trim()) {
      alert("Please enter a project name");
      return;
    }

    try {
      const res = await axios.post(
        "http://localhost:3001/projects",
        {
          name: newProject,
          partnerId: parseInt(partnerId),
        },
        {
          headers: { Authorization: `Bearer ${token}` },
        }
      );

      setProjects([...projects, res.data]);
      setNewProject("");
      alert("Project created successfully!");
    } catch (err) {
      console.error("Error creating project:", err);
      alert(err.response?.data?.error || "Failed to create project");
    }
  };

  // Delete project - admin only
  const deleteProject = async (projectId, projectName) => {
    const confirmed = window.confirm(
      `Are you sure you want to delete "${projectName}"? This action cannot be undone.`
    );

    if (!confirmed) return;

    try {
      await axios.delete(`http://localhost:3001/projects/${projectId}`, {
        headers: { Authorization: `Bearer ${token}` },
      });

      setProjects(projects.filter((p) => p.id !== projectId));
      alert("Project deleted successfully!");
    } catch (err) {
      alert(err.response?.data?.error || "Failed to delete project");
    }
  };

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
    // <div className="p-6">
    //   <div className="flex justify-between items-center mb-4">
    //     <h1 className="text-xl font-bold">Projects</h1>
    //     <button
    //       onClick={() => navigate("/partners")}
    //       className="mt-4 bg-blue-500 text-white px-4 py-2 rounded-lg hover:bg-blue-600 transition"
    //     >
    //       Back to Partners
    //     </button>
    //   </div>

    //   {role === "admin" && (
    //     <div className="mb-6 p-4 border bg-gray-100 rounded-lg">
    //       <h2 className="text-lg font-semibold">Add New Project</h2>
    //       <div className="flex gap-2 mt-2">
    //         <input
    //           value={newProject}
    //           onChange={(e) => setNewProject(e.target.value)}
    //           placeholder="Project name"
    //           className="border p-2 rounded w-full"
    //           onKeyPress={(e) => {
    //             if (e.key === "Enter") createProject();
    //           }}
    //         />
    //         <button
    //           className="bg-green-500 text-white px-4 py-2 rounded hover:bg-green-600"
    //           onClick={createProject}
    //         >
    //           Add
    //         </button>
    //       </div>
    //     </div>
    //   )}

    //   {projects.length === 0 ? (
    //     <p className="text-gray-500 text-center py-8">
    //       No projects yet. {role === "admin" && "Create one above!"}
    //     </p>
    //   ) : (
    //     <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
    //       {projects.map((p) => (
    //         <div
    //           key={p.id}
    //           className="bg-blue-500 text-white p-4 rounded-lg shadow hover:bg-blue-600 transition relative group"
    //         >
    //           <button
    //             onClick={() => navigate(`/dashboard/${p.id}`)}
    //             className="w-full text-left"
    //           >
    //             <h3 className="font-semibold">{p.name}</h3>
    //           </button>

    //           {/* Delete button - admin only */}
    //           {role === "admin" && (
    //             <button
    //               onClick={(e) => {
    //                 e.stopPropagation();
    //                 deleteProject(p.id, p.name);
    //               }}
    //               className="absolute top-2 right-2 bg-red-600 text-white px-2 py-1 rounded text-sm hover:bg-red-700 opacity-0 group-hover:opacity-100 transition-opacity"
    //               title="Delete project"
    //             >
    //               ×
    //             </button>
    //           )}
    //         </div>
    //       ))}
    //     </div>
    //   )}
    // </div>

    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-purple-50">
      {/* Header */}
      <div className="bg-white shadow-md">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4 flex justify-between items-center">
          <div className="flex items-center justify-center space-x-10">
            {/* <div className="w-10 h-10 bg-blue-600 rounded-lg flex items-center justify-center">
              <span className="text-white font-bold text-3xl">C</span>
            </div> */}
            <div className=" rounded-lg flex items-center justify-center">
              <img src={logo} alt="Logo" />
            </div>
            <span className="text-gray-600 text-3xl">
              Welcome, <strong>{username}</strong>
            </span>
          </div>
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
                className="group bg-white rounded-2xl shadow-md hover:shadow-2xl transition-all duration-300 border border-gray-100 hover:border-blue-200 overflow-hidden"
              >
                <button
                  onClick={() => navigate(`/dashboard/${p.id}`)}
                  className="w-full p-6 text-left hover:bg-gray-50 transition-colors duration-200"
                >
                  <h3 className="text-xl font-bold text-gray-800 mb-1 group-hover:text-blue-600 transition-colors">
                    {p.name}
                  </h3>
                  <div className="flex items-center text-sm text-gray-500 mt-2">
                    <span>View Project</span>
                  </div>
                </button>

                {role === "admin" && (
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      deleteProject(p.id, p.name);
                    }}
                    className="absolute top-3 right-3 bg-red-500 hover:bg-red-600 text-white p-2 rounded-lg opacity-0 group-hover:opacity-100 transition-all duration-200 shadow-lg"
                    title="Delete project"
                  >
                    ×
                  </button>
                )}
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

export default ProjectsList;
