import React, { useState, useEffect } from "react";
import axios from "axios";
import { useNavigate, useParams } from "react-router-dom";
import logo from "../images/logo.png";
import mainlogo from "../images/mainlogo.jpeg";

function Dashboard() {
  const { projectId } = useParams();
  const role = localStorage.getItem("role")?.toLowerCase();
  console.log("current role:", role);
  const username = localStorage.getItem("username");
  const token = localStorage.getItem("token");
  const navigate = useNavigate();

  const [entries, setEntries] = useState([]);
  const [projectInfo, setProjectInfo] = useState(null);
  const [form, setForm] = useState({
    product: "",
    quantity: "",
    description: "",
    due_date: "",
  });
  const [entryInputs, setEntryInputs] = useState({});
  const [editingId, setEditingId] = useState(null);
  const [adminEditForm, setAdminEditForm] = useState({});
  const [showAddForm, setShowAddForm] = useState({});

  useEffect(() => {
    const fetchData = async () => {
      try {
        //fetch project info
        const projectRes = await axios.get(
          `${process.env.REACT_APP_API_URL}/projects/info/${projectId}`,
          {
            headers: { Authorization: `Bearer ${token}` },
          },
        );
        setProjectInfo(projectRes.data);

        //fetch entries for this project
        const entriesRes = await axios.get(
          `${process.env.REACT_APP_API_URL}/entries/${projectId}`,
          {
            headers: { Authorization: `Bearer ${token}` },
          },
        );
        setEntries(entriesRes.data);

        //initialize entryInputs
        const map = entriesRes.data.reduce((acc, entry) => {
          acc[entry.id] = {
            order_form_no: entry.order_form_no || "",
            notes: entry.notes || "",
            po_no: entry.po_no || "",
            invoice_no: entry.invoice_no || "",
            purchase_date: entry.purchase_date
              ? entry.purchase_date.split("T")[0]
              : "",
            drivers_name: entry.drivers_name || "",
            vehicle_no: entry.vehicle_no || "",
            received: entry.received || "",
            driver_description: entry.driver_description || "",
          };
          return acc;
        }, {});
        setEntryInputs(map);
      } catch (err) {
        console.error("Failed fetching data:", err);
        if (err.response?.status === 404) {
          alert("Project not found");
          navigate("/partners");
        }
      }
    };

    if (projectId) {
      fetchData();
    }
  }, [projectId, token, navigate]);

  const logout = () => {
    localStorage.clear();
    navigate("/login");
  };

  const goBack = () => {
    if (projectInfo?.partner_id) {
      navigate(`/partners/${projectInfo.partner_id}/projects`);
    } else {
      navigate("/partners");
    }
  };

  // Add new entry (User only) - now with project id
  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      await axios.post(
        `${process.env.REACT_APP_API_URL}/entries`,
        { ...form, project_id: projectId },
        {
          headers: { Authorization: `Bearer ${token}` },
        },
      );
      alert("Entry Added!");
      window.location.reload();
    } catch (err) {
      alert(err.response?.data?.error || "Failed to add entry");
    }
  };

  // Update entry (office or admin)
  const handleUpdate = async (id, { url, data }) => {
    try {
      const res = await axios.put(
        `${process.env.REACT_APP_API_URL}/entries/${id}/${url}`,
        data,
        {
          headers: { Authorization: `Bearer ${token}` },
        },
      );

      // Update the entry in state immediately
      setEntries((prev) =>
        prev.map((entry) => (entry.id === id ? res.data : entry)),
      );

      if (
        url === "orderform" ||
        url === "po" ||
        url === "invoice" ||
        url === "driver" ||
        url === "stores-driver"
      ) {
        setEntryInputs((prev) => ({
          ...prev,
          [id]: {
            ...prev[id],
            order_form_no: "",
            notes: "",
            po_no: "",
            invoice_no: "",
            drivers_name: "",
            vehicle_no: "",
            received: "",
            driver_description: "",
            // [url === "po" ? "po_no" : url === "invoice" ? "invoice_no" : ""]:
            //   "",
            // [url === "orderform"
            //   ? "order_form_no"
            //   : url === "po"
            //   ? "po_no"
            //   : "invoice_no"]: "",
          },
        }));
      }

      alert("Saved Successfully!");
    } catch (err) {
      console.error(err);
      alert(err.response?.data?.error || "Failed to update");
    }
  };

  // Admin edit mode setup
  const startAdminEdit = (entry) => {
    setEditingId(entry.id);
    setAdminEditForm({
      user_name: entry.user_name || "",
      product: entry.product || "",
      quantity: entry.quantity || "",
      description: entry.description || "",
      due_date: entry.due_date ? entry.due_date.split("T")[0] : "",
      user_datetime: entry.user_datetime
        ? new Date(entry.user_datetime).toISOString()
        : null,
      delivery_date: entry.delivery_date
        ? new Date(entry.delivery_date).toISOString()
        : null,
      order_form_no: entry.order_form_no || "",
      notes: entry.notes || "",
      po_no: entry.po_no || "",
      invoice_no: entry.invoice_no || "",
      approved: entry.approved || false,
      purchase_date: entry.purchase_date
        ? entry.purchase_date.split("T")[0]
        : "",
      drivers_name: entry.drivers_name || "",
      vehicle_no: entry.vehicle_no || "",
      received: entry.received || "",
      driver_description: entry.driver_description || "",
    });
  };

  const cancelAdminEdit = () => {
    setEditingId(null);
    setAdminEditForm({});
  };

  const saveAdminEdit = async (id) => {
    try {
      const res = await axios.put(
        `${process.env.REACT_APP_API_URL}/entries/${id}/admin`,
        adminEditForm,
        { headers: { Authorization: `Bearer ${token}` } },
      );

      const updated = res.data.entry ? res.data.entry : res.data;
      setEntries((prev) => prev.map((e) => (e.id === id ? updated : e)));
      setEditingId(null);
      setAdminEditForm({});
      alert("Admin changes saved");
    } catch (err) {
      console.error(err);
      alert(err.response?.data?.error || "Failed to save changes");
    }
  };

  const handleDeleteEntry = async (entryId, productName) => {
    const confirmed = window.confirm(
      `Are you sure you want to delete the entry "${productName}"?\n\nThis action cannot be undone.`,
    );

    if (!confirmed) return;

    try {
      await axios.delete(
        `${process.env.REACT_APP_API_URL}/entries/${entryId}`,
        {
          headers: { Authorization: `Bearer ${token}` },
        },
      );

      // Remove the entry from state
      setEntries((prev) => prev.filter((entry) => entry.id !== entryId));

      alert("Entry deleted successfully!");
    } catch (err) {
      console.error("Error deleting entry:", err);
      alert(err.response?.data?.error || "Failed to delete entry");
    }
  };

  //   const isUserAdded = (entry) => {
  //     if (entry.added_by) return String(entry.added_by).toLowerCase() === "user";
  //     if (entry.user_id && entry.office_user_1 == null) return true;
  //     if (entry.user_name && !entry.office_user_1) return true;
  //     return false;
  //   };

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-purple-50">
      {/* Header */}
      <div className="bg-white shadow-md">
        <div className=" mx-auto px-4 sm:px-6 lg:px-8 py-4">
          <div className="flex flex-col md:flex-row justify-between items-center gap-4">
            <div className="flex items-center space-x-5">
              <div className=" rounded-lg flex items-baseline justify-center">
                <img src={mainlogo} width={50} height={50} alt="mainlogo" />
                <img src={logo} alt="Logo" />
              </div>
              <div className="">
                <div className="flex flex-row items-center justify-center gap-5">
                  <div>
                    <h2 className="text-3xl font-bold text-gray-800">
                      Welcome,{" "}
                      <span className="bg-gradient-to-r from-blue-600 to-indigo-600 bg-clip-text text-transparent">
                        {username}
                      </span>
                    </h2>
                  </div>
                  <div>
                    <h4 className="text-gray-700 b-1 text-3xl font-semibold rounded-full ">
                      - {role.toLowerCase()}
                    </h4>
                  </div>
                </div>

                <div className=" flex flex-row gap-7 item-center">
                  {projectInfo && (
                    <p className="text-md text-gray-500 font-medium flex items-center gap-2">
                      <svg
                        className="w-6 h-6"
                        fill="currentColor"
                        viewBox="0 0 20 20"
                      >
                        <path d="M10.394 2.08a1 1 0 00-.788 0l-7 3a1 1 0 000 1.84L5.25 8.051a.999.999 0 01.356-.257l4-1.714a1 1 0 11.788 1.838L7.667 9.088l1.94.831a1 1 0 00.787 0l7-3a1 1 0 000-1.838l-7-3zM3.31 9.397L5 10.12v4.102a8.969 8.969 0 00-1.05-.174 1 1 0 01-.89-.89 11.115 11.115 0 01.25-3.762zM9.3 16.573A9.026 9.026 0 007 14.935v-3.957l1.818.78a3 3 0 002.364 0l5.508-2.361a11.026 11.026 0 01.25 3.762 1 1 0 01-.89.89 8.968 8.968 0 00-5.35 2.524 1 1 0 01-1.4 0zM6 18a1 1 0 001-1v-2.065a8.935 8.935 0 00-2-.712V17a1 1 0 001 1z" />
                      </svg>
                      <span className="text-gray-700 font-semibold">
                        {projectInfo.partner_name}
                      </span>
                      <span className="text-gray-400">•</span>
                      <span>{projectInfo.name}</span>
                    </p>
                  )}
                </div>
              </div>
            </div>

            <div className="flex gap-2">
              <button
                onClick={goBack}
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
                <span>Back to Projects</span>
              </button>

              {/* logout button */}
              <button
                onClick={logout}
                className="bg-red-500 hover:bg-red-600 text-white px-4 py-2 rounded-lg transition-colors duration-200 flex items-center space-x-2"
              >
                <svg
                  xmlns="http://www.w3.org/2000/svg"
                  className="h-5 w-5"
                  viewBox="0 0 20 20"
                  fill="currentColor"
                >
                  <path
                    fillRule="evenodd"
                    d="M3 3a1 1 0 00-1 1v12a1 1 0 102 0V4a1 1 0 00-1-1zm10.293 9.293a1 1 0 001.414 1.414l3-3a1 1 0 000-1.414l-3-3a1 1 0 10-1.414 1.414L14.586 9H7a1 1 0 100 2h7.586l-1.293 1.293z"
                    clipRule="evenodd"
                  />
                </svg>
                <span>Logout</span>
              </button>
            </div>
          </div>
        </div>
      </div>

      <div className="m mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Title Section */}
        <div className="text-center mb-8">
          <h1 className="text-4xl font-bold text-gray-900 mb-2">
            Project Dashboard
          </h1>
          <div className="mt-3 flex justify-center">
            <div className="h-1 w-24 bg-gradient-to-r from-blue-500 to-purple-500 rounded-full"></div>
          </div>
        </div>

        {/* Create entry form (user only) */}
        {/* {role === "user" && (
          <div className="mb-6 p-4 bg-white shadow rounded">
            <h3 className="text-xl font-semibold mb-4">Create Entry</h3>
            <form
              onSubmit={handleSubmit}
              className="grid grid-cols-1 md:grid-cols-4 gap-4"
            >
              <input
                className="border rounded px-3 py-2 w-full"
                name="product"
                placeholder="Product"
                onChange={(e) => setForm({ ...form, product: e.target.value })}
                required
              />
              <input
                className="border rounded px-3 py-2 w-full"
                name="quantity"
                placeholder="Quantity"
                onChange={(e) => setForm({ ...form, quantity: e.target.value })}
                required
              />
              <input
                className="border rounded px-3 py-2 w-full"
                name="description"
                placeholder="Description"
                onChange={(e) =>
                  setForm({ ...form, description: e.target.value })
                }
              />
              <input
                className="border rounded px-3 py-2 w-full"
                type="date"
                name="duedate"
                placeholder="Due Date"
                onChange={(e) => setForm({ ...form, due_date: e.target.value })}
                required
              />
              <button
                type="submit"
                className="bg-blue-500 hover:bg-blue-600 text-white px-4 py-2 rounded md:col-span-4"
              >
                Add Entry
              </button>
            </form>
          </div>
        )} */}
        {/* Add Entry Button (User only) */}
        {role === "user" && !showAddForm && (
          <div className="flex justify-center mb-8">
            <button
              onClick={() => setShowAddForm(true)}
              className="bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 text-white px-8 py-4 rounded-xl font-semibold shadow-lg hover:shadow-xl transition-all duration-200 flex items-center space-x-2"
            >
              <svg
                xmlns="http://www.w3.org/2000/svg"
                className="h-6 w-6"
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M12 4v16m8-8H4"
                />
              </svg>
              <span>Create New Entry</span>
            </button>
          </div>
        )}

        {/* Add Entry Form (User only) */}
        {role === "user" && showAddForm && (
          <div className="mx-auto mb-8 bg-white rounded-2xl shadow-xl p-8 border border-gray-100">
            <h2 className="text-2xl font-bold text-gray-800 mb-6 text-center">
              Create New Entry
            </h2>
            <form onSubmit={handleSubmit} className="space-y-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Product *
                  </label>
                  <input
                    type="text"
                    value={form.product}
                    onChange={(e) =>
                      setForm({ ...form, product: e.target.value })
                    }
                    className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all"
                    placeholder="Enter product name"
                    required
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Quantity *
                  </label>
                  <input
                    type="text"
                    value={form.quantity}
                    onChange={(e) =>
                      setForm({ ...form, quantity: e.target.value })
                    }
                    className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all"
                    placeholder="Enter quantity"
                    required
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Due Date *
                  </label>
                  <input
                    type="date"
                    value={form.due_date}
                    onChange={(e) =>
                      setForm({ ...form, due_date: e.target.value })
                    }
                    className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all"
                    required
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Description
                  </label>
                  <input
                    type="text"
                    value={form.description}
                    onChange={(e) =>
                      setForm({ ...form, description: e.target.value })
                    }
                    className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all"
                    placeholder="Enter description"
                  />
                </div>
              </div>

              <div className="flex space-x-3 pt-4">
                <button
                  type="submit"
                  className="flex-1 bg-gradient-to-r from-green-500 to-green-600 hover:from-green-600 hover:to-green-700 text-white py-3 rounded-lg font-semibold shadow-md hover:shadow-lg transition-all duration-200"
                >
                  Add Entry
                </button>
                <button
                  type="button"
                  onClick={() => {
                    setShowAddForm(false);
                    setForm({
                      product: "",
                      quantity: "",
                      description: "",
                      due_date: "",
                    });
                  }}
                  className="px-6 bg-gray-200 hover:bg-gray-300 text-gray-700 py-3 rounded-lg font-semibold transition-colors duration-200"
                >
                  Cancel
                </button>
              </div>
            </form>
          </div>
        )}

        {/* Entries Table */}
        <div className="bg-white rounded-2xl shadow-xl overflow-hidden border border-gray-100">
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gradient-to-r from-gray-50 to-gray-100">
                <tr>
                  <th className="px-4 py-3 text-left text-md text-center font-semibold text-gray-700 uppercase tracking-wider border-r border-gray-200">
                    ID
                  </th>
                  <th className="px-4 py-3 text-left text-md text-center font-semibold text-gray-700 uppercase tracking-wider border-r border-gray-200 bg-blue-50">
                    Requested By
                  </th>
                  <th className="px-4 py-3 text-left text-md text-center font-semibold text-gray-700 uppercase tracking-wider border-r border-gray-200 bg-blue-50">
                    Item Name
                  </th>
                  <th className="px-4 py-3 text-left text-md text-center font-semibold text-gray-700 uppercase tracking-wider border-r border-gray-200 bg-blue-50">
                    Quantity
                  </th>
                  <th className="px-4 py-3 text-left text-md text-center font-semibold text-gray-700 uppercase tracking-wider border-r border-gray-200 bg-blue-50">
                    Requested Date & Time
                  </th>
                  <th className="px-4 py-3 text-left text-md text-center font-semibold text-gray-700 uppercase tracking-wider border-r border-gray-200 bg-blue-50">
                    Due Date
                  </th>
                  <th className="px-4 py-3 text-left text-md text-center font-semibold text-gray-700 uppercase tracking-wider border-r border-gray-200 bg-blue-50">
                    Notes
                  </th>
                  <th className="px-4 py-3 text-left text-md text-center font-semibold text-gray-700 uppercase tracking-wider border-r border-gray-200 bg-pink-50">
                    Assigned Officer
                  </th>
                  <th className="px-4 py-3 text-left text-md text-center font-semibold text-gray-700 uppercase tracking-wider border-r border-gray-200 bg-pink-50">
                    Order Form No
                  </th>
                  <th className="px-4 py-3 text-left text-md text-center font-semibold text-gray-700 uppercase tracking-wider border-r border-gray-200 bg-pink-50">
                    Notes
                  </th>
                  <th className="px-4 py-3 text-left text-md text-center font-semibold text-gray-700 uppercase tracking-wider border-r border-gray-200 bg-pink-50">
                    Office Date & Time
                  </th>

                  {/* <th className="px-4 py-3 text-left text-md text-center font-semibold text-gray-700 uppercase tracking-wider border-r border-gray-200 bg-yellow-50">
                    Approve Status
                  </th> */}
                  <th className="px-4 py-3 text-left text-md text-center font-semibold text-gray-700 uppercase tracking-wider border-r border-gray-200 bg-yellow-50">
                    Current Status
                  </th>

                  <th className="px-4 py-3 text-left text-md text-center font-semibold text-gray-700 uppercase tracking-wider border-r border-gray-200 bg-green-50">
                    Office User
                  </th>
                  <th className="px-4 py-3 text-left text-md text-center font-semibold text-gray-700 uppercase tracking-wider border-r border-gray-200 bg-green-50">
                    PO No
                  </th>
                  <th className="px-4 py-3 text-left text-md text-center font-semibold text-gray-700 uppercase tracking-wider border-r border-gray-200 bg-green-50">
                    Office Date & Time
                  </th>

                  <th className="px-4 py-3 text-left text-md text-center font-semibold text-gray-700 uppercase tracking-wider border-r border-gray-200 bg-orange-50">
                    Office User
                  </th>
                  <th className="px-4 py-3 text-left text-md text-center font-semibold text-gray-700 uppercase tracking-wider border-r border-gray-200 bg-orange-50">
                    Invoice No
                  </th>
                  <th className="px-4 py-3 text-left text-md text-center font-semibold text-gray-700 uppercase tracking-wider border-r border-gray-200 bg-orange-50">
                    Office Date & Time
                  </th>
                  <th className="px-4 py-3 text-left text-md text-center font-semibold text-gray-700 uppercase tracking-wider border-r border-gray-200 bg-purple-50">
                    Purchase Date
                  </th>
                  <th className="px-4 py-3 text-left text-md text-center font-semibold text-gray-700 uppercase tracking-wider border-r border-gray-200 bg-purple-50">
                    Driver's Name
                  </th>
                  <th className="px-4 py-3 text-left text-md text-center font-semibold text-gray-700 uppercase tracking-wider border-r border-gray-200 bg-purple-50">
                    Vehicle No
                  </th>
                  <th className="px-4 py-3 text-left text-md text-center font-semibold text-gray-700 uppercase tracking-wider border-r border-gray-200 bg-purple-50">
                    Stores
                  </th>
                  <th className="px-4 py-3 text-left text-md text-center font-semibold text-gray-700 uppercase tracking-wider border-r border-gray-200 bg-purple-50">
                    Notes
                  </th>

                  {role === "admin" && (
                    <th className="px-4 py-3 text-left text-md text-center font-semibold text-gray-700 uppercase tracking-wider">
                      Actions
                    </th>
                  )}
                </tr>
              </thead>

              <tbody className="bg-white divide-y divide-gray-200">
                {entries.map((entry) => {
                  const editableByAdmin = role === "admin"; // Admin can edit everything
                  const isEditing = editingId === entry.id;

                  return (
                    <tr
                      key={entry.id}
                      className="hover:bg-gray-50 transition-colors"
                    >
                      <td className="px-4 py-3 whitespace-nowrap text-md font-medium text-gray-900 border-r border-gray-200">
                        {entry.id}
                      </td>

                      {/* Editable cells for admin */}
                      <td className="px-4 py-3 whitespace-nowrap text-md text-gray-700 border-r border-gray-200 bg-blue-50">
                        {editingId === entry.id && role === "admin" ? (
                          <input
                            value={adminEditForm.user_name || ""}
                            className="w-full px-2 py-1 border border-gray-300 rounded text-md"
                            onChange={(e) =>
                              setAdminEditForm((prev) => ({
                                ...prev,
                                user_name: e.target.value,
                              }))
                            }
                          />
                        ) : (
                          entry.user_name
                        )}
                      </td>

                      <td className="px-4 py-3 text-md text-gray-700 border-r border-gray-200 bg-blue-50">
                        {editingId === entry.id && role === "admin" ? (
                          <input
                            value={adminEditForm.product || ""}
                            className="w-full px-2 py-1 border border-gray-300 rounded text-md"
                            onChange={(e) =>
                              setAdminEditForm((prev) => ({
                                ...prev,
                                product: e.target.value,
                              }))
                            }
                          />
                        ) : (
                          entry.product
                        )}
                      </td>

                      <td className="px-4 py-3 whitespace-nowrap text-md text-gray-700 border-r border-gray-200 bg-blue-50">
                        {editingId === entry.id && role === "admin" ? (
                          <input
                            value={adminEditForm.quantity || ""}
                            className="w-full px-2 py-1 border border-gray-300 rounded text-md"
                            onChange={(e) =>
                              setAdminEditForm((prev) => ({
                                ...prev,
                                quantity: e.target.value,
                              }))
                            }
                          />
                        ) : (
                          entry.quantity
                        )}
                      </td>

                      <td className="px-4 py-3 whitespace-nowrap text-md text-gray-700 border-r border-gray-200 bg-blue-50">
                        {entry.user_datetime
                          ? new Date(entry.user_datetime).toLocaleString()
                          : "-"}
                      </td>

                      <td className="px-4 py-3 whitespace-nowrap text-md text-gray-700 border-r border-gray-200 bg-blue-50">
                        {editingId === entry.id && role === "admin" ? (
                          <input
                            type="date"
                            value={
                              adminEditForm.due_date
                                ? adminEditForm.due_date.split("T")[0]
                                : ""
                            }
                            className="w-full px-2 py-1 border border-gray-300 rounded text-md"
                            onChange={(e) =>
                              setAdminEditForm((prev) => ({
                                ...prev,
                                due_date: e.target.value,
                              }))
                            }
                          />
                        ) : entry.due_date ? (
                          new Date(entry.due_date).toLocaleDateString("en-GB")
                        ) : (
                          "-"
                        )}
                        {/* {entry.due_date
                          ? new Date(entry.due_date).toLocaleDateString("en-GB")
                          : "-"} */}
                      </td>

                      <td className="px-4 py-3 text-md text-gray-700 border-r border-gray-200 bg-blue-50 min-w-[200px]">
                        {editingId === entry.id && role === "admin" ? (
                          <input
                            value={adminEditForm.description || ""}
                            className="w-full px-2 py-1 border border-gray-300 rounded text-md"
                            onChange={(e) =>
                              setAdminEditForm((prev) => ({
                                ...prev,
                                description: e.target.value,
                              }))
                            }
                          />
                        ) : (
                          entry.description
                        )}
                      </td>

                      {/* Office 1 */}
                      <td className="px-4 py-3 whitespace-nowrap text-md text-gray-700 border-r border-gray-200 bg-pink-50">
                        {entry.office_user_1 || "-"}
                      </td>

                      {/* order form no column */}
                      <td className="px-4 py-3 text-md text-gray-700 border-r border-gray-200 bg-pink-50 min-w-[200px]">
                        {editingId === entry.id && role === "admin" ? (
                          // Admin can edit directly
                          <input
                            type="text"
                            value={adminEditForm.order_form_no || ""}
                            className="w-full px-2 py-1 border border-gray-300 rounded text-md"
                            onChange={(e) =>
                              setAdminEditForm((prev) => ({
                                ...prev,
                                order_form_no: e.target.value,
                              }))
                            }
                          />
                        ) : entry.order_form_no ? (
                          entry.order_form_no
                        ) : (
                          // Office user edit
                          (role === "office" || role === "office_admin") && (
                            <div className="flex gap-2">
                              <input
                                type="text"
                                placeholder="Order Form No"
                                value={
                                  entryInputs[entry.id]?.order_form_no || ""
                                }
                                className="w-full px-2 py-1 border border-gray-300 rounded text-md"
                                onChange={(e) =>
                                  setEntryInputs((prev) => ({
                                    ...prev,
                                    [entry.id]: {
                                      ...prev[entry.id],
                                      order_form_no: e.target.value,
                                    },
                                  }))
                                }
                              />
                            </div>
                          )
                        )}
                      </td>

                      {/* Notes Column */}
                      <td className="px-4 py-3 text-md text-gray-700 border-r border-gray-200 bg-pink-50 min-w-[250px] ">
                        {editingId === entry.id && role === "admin" ? (
                          <textarea
                            value={adminEditForm.notes || ""}
                            className="border rounded px-2 py-1 w-full"
                            rows={2}
                            onChange={(e) =>
                              setAdminEditForm((prev) => ({
                                ...prev,
                                notes: e.target.value,
                              }))
                            }
                          />
                        ) : entry.notes ? (
                          <div
                            style={{
                              minWidth: "250px",
                              whiteSpace: "pre-wrap",
                              wordBreak: "break-word",
                            }}
                          >
                            {entry.notes}
                          </div>
                        ) : (
                          (role === "office" || role === "office_admin") &&
                          !entry.order_form_no && (
                            <div className="flex gap-2">
                              <textarea
                                placeholder="Add Notes"
                                value={entryInputs[entry.id]?.notes || ""}
                                className="border rounded px-2 py-1 w-full"
                                style={{ minWidth: "250px" }}
                                rows={2}
                                onChange={(e) =>
                                  setEntryInputs((prev) => ({
                                    ...prev,
                                    [entry.id]: {
                                      ...prev[entry.id],
                                      notes: e.target.value,
                                    },
                                  }))
                                }
                              />
                            </div>
                          )
                        )}
                        {(role === "office" || role === "office_admin") &&
                          !entry.order_form_no && (
                            <button
                              onClick={() =>
                                handleUpdate(entry.id, {
                                  url: "orderform",
                                  data: {
                                    order_form_no:
                                      entryInputs[entry.id]?.order_form_no,
                                    notes: entryInputs[entry.id]?.notes,
                                  },
                                })
                              }
                              className="bg-green-400 hover:bg-green-500 text-white px-2 py-1 rounded-md mt-1 w-full"
                            >
                              Save
                            </button>
                          )}
                      </td>

                      <td className="px-4 py-3 whitespace-nowrap text-md text-gray-700 border-r border-gray-200 bg-pink-50">
                        {entry.office_datetime_1
                          ? new Date(entry.office_datetime_1).toLocaleString()
                          : "-"}
                      </td>

                      {/* Approval */}

                      <td className="px-4 py-3 whitespace-nowrap text-md border-r border-gray-200 bg-yellow-50">
                        {entry.approved ? (
                          <button
                            disabled
                            className="px-3 py-1 bg-gray-300 text-gray-600 rounded-lg text-md font-semibold"
                          >
                            {entry.approved_by
                              ? `Approved by ${entry.approved_by}`
                              : "Approved"}
                          </button>
                        ) : (
                          (role === "admin" || role === "office_admin") && (
                            <button
                              onClick={() =>
                                handleUpdate(entry.id, {
                                  url: "approve",
                                  data: { approved: true },
                                })
                              }
                              className="px-3 py-1 bg-blue-500 hover:bg-blue-600 text-white rounded-lg text-xs font-semibold transition-colors"
                            >
                              Pending
                            </button>
                          )
                        )}
                      </td>

                      {/* PO Section*/}
                      <td className="px-4 py-3 whitespace-nowrap text-md text-gray-700 border-r border-gray-200 bg-green-50">
                        {entry.office_user_2 || "-"}
                      </td>
                      <td className="px-4 py-3 text-md text-gray-700 border-r border-gray-200 bg-green-50 min-w-[200px]">
                        {editingId === entry.id && role === "admin" ? (
                          // Admin can edit directly
                          <input
                            type="text"
                            value={adminEditForm.po_no || ""}
                            className="w-full px-2 py-1 border border-gray-300 rounded text-md"
                            onChange={(e) =>
                              setAdminEditForm((prev) => ({
                                ...prev,
                                po_no: e.target.value,
                              }))
                            }
                          />
                        ) : entry.po_no ? (
                          entry.po_no
                        ) : (
                          // Office user edit
                          (role === "office" || role === "office_admin") &&
                          entry.approved && (
                            <div>
                              <input
                                placeholder="PO No"
                                value={entryInputs[entry.id]?.po_no || ""}
                                className="w-full px-2 py-1 border border-gray-300 rounded text-md"
                                onChange={(e) =>
                                  setEntryInputs((prev) => ({
                                    ...prev,
                                    [entry.id]: {
                                      ...prev[entry.id],
                                      po_no: e.target.value,
                                    },
                                  }))
                                }
                              />
                              <button
                                className="bg-green-400 hover:bg-green-600 text-white px-2 py-1 rounded"
                                onClick={() =>
                                  handleUpdate(entry.id, {
                                    url: "po",
                                    data: {
                                      po_no: entryInputs[entry.id]?.po_no,
                                    },
                                  })
                                }
                              >
                                Save
                              </button>
                            </div>
                          )
                        )}
                      </td>

                      <td className="px-4 py-3 whitespace-nowrap text-md text-gray-700 border-r border-gray-200 bg-green-50">
                        {entry.office_datetime_2
                          ? new Date(entry.office_datetime_2).toLocaleString()
                          : "-"}
                      </td>

                      {/* Invoice */}
                      <td className="px-4 py-3 whitespace-nowrap text-md text-gray-700 border-r border-gray-200 bg-orange-50">
                        {entry.office_user_3 || "-"}
                      </td>
                      <td className="px-4 py-3 text-md text-gray-700 border-r border-gray-200 bg-orange-50">
                        {editingId === entry.id && role === "admin" ? (
                          // Admin can edit directly
                          <input
                            type="text"
                            value={adminEditForm.invoice_no || ""}
                            className="w-full px-2 py-1 border border-gray-300 rounded text-md"
                            onChange={(e) =>
                              setAdminEditForm((prev) => ({
                                ...prev,
                                invoice_no: e.target.value,
                              }))
                            }
                          />
                        ) : entry.invoice_no ? (
                          entry.invoice_no
                        ) : (
                          // Office user edit
                          (role === "office" || role === "office_admin") &&
                          entry.po_no && (
                            <div>
                              <input
                                placeholder="Invoice No"
                                value={entryInputs[entry.id]?.invoice_no || ""}
                                className="w-full px-2 py-1 border border-gray-300 rounded-md text-md"
                                onChange={(e) =>
                                  setEntryInputs((prev) => ({
                                    ...prev,
                                    [entry.id]: {
                                      ...prev[entry.id],
                                      invoice_no: e.target.value,
                                    },
                                  }))
                                }
                              />
                              <button
                                onClick={() =>
                                  handleUpdate(entry.id, {
                                    url: "invoice",
                                    data: {
                                      invoice_no:
                                        entryInputs[entry.id]?.invoice_no,
                                    },
                                  })
                                }
                                className="bg-green-400 hover:bg-green-600 text-white px-2 py-1 rounded-md"
                              >
                                Save
                              </button>
                            </div>
                          )
                        )}
                      </td>

                      <td className="px-4 py-3 whitespace-nowrap text-md text-gray-700 border-r border-gray-200 bg-orange-50">
                        {entry.office_datetime_3
                          ? new Date(entry.office_datetime_3).toLocaleString()
                          : "-"}
                      </td>

                      {/* Driver Details */}
                      <td className="px-4 py-3 whitespace-nowrap text-md text-gray-700 border-r border-gray-200 bg-purple-50 min-w-[200px]">
                        {editingId && role === "admin" ? (
                          // Admin can edit directly
                          <input
                            type="date"
                            value={adminEditForm.purchase_date || ""}
                            className="w-full px-2 py-1 border border-gray-300 rounded text-md"
                            onChange={(e) =>
                              setAdminEditForm((prev) => ({
                                ...prev,
                                purchase_date: e.target.value,
                              }))
                            }
                          />
                        ) : entry.purchase_date ? (
                          // Display existing date
                          entry.purchase_date.split("T")[0]
                        ) : (
                          // Office user edit — show date input when no date yet
                          (((role === "office" || role === "office_admin") &&
                            entry.invoice_no) ||
                            (role === "stores" && entry.invoice_no)) && (
                            <div>
                              <input
                                type="date"
                                value={
                                  entryInputs[entry.id]?.purchase_date || ""
                                }
                                className="border rounded px-2 py-1 w-full mb-1"
                                onChange={(e) =>
                                  setEntryInputs((prev) => ({
                                    ...prev,
                                    [entry.id]: {
                                      ...prev[entry.id],
                                      purchase_date: e.target.value,
                                    },
                                  }))
                                }
                              />
                            </div>
                          )
                        )}
                      </td>

                      <td className="px-4 py-3 whitespace-nowrap text-md text-gray-700 border-r border-gray-200 bg-purple-50">
                        {isEditing && role === "admin" ? (
                          <input
                            type="text"
                            value={adminEditForm.drivers_name || ""}
                            onChange={(e) =>
                              setAdminEditForm({
                                ...adminEditForm,
                                drivers_name: e.target.value,
                              })
                            }
                            className="w-full px-2 py-1 border border-gray-300 rounded text-md"
                          />
                        ) : entry.drivers_name ? (
                          entry.drivers_name
                        ) : (
                          (((role === "office" || role === "office_admin") &&
                            entry.invoice_no) ||
                            (role === "stores" && entry.invoice_no)) && (
                            <input
                              type="text"
                              placeholder="Driver Name"
                              value={entryInputs[entry.id]?.drivers_name || ""}
                              className="border rounded px-2 py-1 w-full"
                              onChange={(e) =>
                                setEntryInputs((prev) => ({
                                  ...prev,
                                  [entry.id]: {
                                    ...prev[entry.id],
                                    drivers_name: e.target.value,
                                  },
                                }))
                              }
                            />
                          )
                        )}
                      </td>

                      <td className="px-4 py-3 whitespace-nowrap text-md text-gray-700 border-r border-gray-200 bg-purple-50">
                        {isEditing && role === "admin" ? (
                          <input
                            type="text"
                            value={adminEditForm.vehicle_no || ""}
                            onChange={(e) =>
                              setAdminEditForm({
                                ...adminEditForm,
                                vehicle_no: e.target.value,
                              })
                            }
                            className="w-full px-2 py-1 border border-gray-300 rounded text-md"
                          />
                        ) : entry.vehicle_no ? (
                          entry.vehicle_no
                        ) : (
                          (((role === "office" || role === "office_admin") &&
                            entry.invoice_no) ||
                            (role === "stores" && entry.invoice_no)) && (
                            <input
                              type="text"
                              placeholder="Vehicle No"
                              value={entryInputs[entry.id]?.vehicle_no || ""}
                              className="border rounded px-2 py-1 w-full"
                              onChange={(e) =>
                                setEntryInputs((prev) => ({
                                  ...prev,
                                  [entry.id]: {
                                    ...prev[entry.id],
                                    vehicle_no: e.target.value,
                                  },
                                }))
                              }
                            />
                          )
                        )}
                      </td>

                      <td className="px-4 py-3 whitespace-nowrap text-md text-gray-700 border-r border-gray-200 bg-purple-50">
                        {isEditing && role === "admin" ? (
                          <input
                            type="text"
                            value={adminEditForm.received || ""}
                            onChange={(e) =>
                              setAdminEditForm({
                                ...adminEditForm,
                                received: e.target.value,
                              })
                            }
                            className="w-full px-2 py-1 border border-gray-300 rounded text-md"
                          />
                        ) : entry.received ? (
                          entry.received
                        ) : (
                          (((role === "office" || role === "office_admin") &&
                            entry.invoice_no) ||
                            (role === "stores" && entry.invoice_no)) && (
                            <input
                              type="text"
                              placeholder="Stores"
                              value={entryInputs[entry.id]?.received || ""}
                              className="border rounded px-2 py-1 w-full"
                              onChange={(e) =>
                                setEntryInputs((prev) => ({
                                  ...prev,
                                  [entry.id]: {
                                    ...prev[entry.id],
                                    received: e.target.value,
                                  },
                                }))
                              }
                            />
                          )
                        )}
                      </td>

                      <td className="px-4 py-3 text-md text-gray-700 border-r border-gray-200 bg-purple-50 min-w-[200px]">
                        {isEditing && role === "admin" ? (
                          <textarea
                            value={adminEditForm.driver_description || ""}
                            onChange={(e) =>
                              setAdminEditForm({
                                ...adminEditForm,
                                driver_description: e.target.value,
                              })
                            }
                            className="w-full px-2 py-1 border border-gray-300 rounded text-md"
                            rows={2}
                          />
                        ) : entry.driver_description ? (
                          <div className="whitespace-pre-wrap break-words">
                            {entry.driver_description}
                          </div>
                        ) : (
                          (((role === "office" || role === "office_admin") &&
                            entry.invoice_no) ||
                            (role === "stores" && entry.invoice_no)) && (
                            <div>
                              <textarea
                                placeholder="Description"
                                value={
                                  entryInputs[entry.id]?.driver_description ||
                                  ""
                                }
                                className="border rounded px-2 py-1 w-full mb-1"
                                rows={2}
                                onChange={(e) =>
                                  setEntryInputs((prev) => ({
                                    ...prev,
                                    [entry.id]: {
                                      ...prev[entry.id],
                                      driver_description: e.target.value,
                                    },
                                  }))
                                }
                              />
                              <button
                                onClick={() =>
                                  handleUpdate(entry.id, {
                                    url:
                                      role === "office" ||
                                      role === "office_admin"
                                        ? "driver"
                                        : "stores-driver",
                                    data: {
                                      purchase_date:
                                        entryInputs[entry.id]?.purchase_date,
                                      drivers_name:
                                        entryInputs[entry.id]?.drivers_name,
                                      vehicle_no:
                                        entryInputs[entry.id]?.vehicle_no,
                                      received: entryInputs[entry.id]?.received,
                                      driver_description:
                                        entryInputs[entry.id]
                                          ?.driver_description,
                                    },
                                  })
                                }
                                className="bg-green-500 hover:bg-green-600 text-white px-3 py-1 rounded-lg text-md font-semibold transition-colors w-full"
                              >
                                Save
                              </button>
                            </div>
                          )
                        )}
                      </td>

                      {/* ACTIONS */}
                      <td>
                        {role === "admin" && editableByAdmin && (
                          <>
                            {isEditing ? (
                              <>
                                <button
                                  onClick={() => saveAdminEdit(entry.id)}
                                  className="bg-green-500 hover:bg-green-600 text-white px-2 py-1 rounded"
                                >
                                  Save
                                </button>
                                <button onClick={cancelAdminEdit}>
                                  Cancel
                                </button>
                              </>
                            ) : (
                              <>
                                <button
                                  onClick={() => startAdminEdit(entry)}
                                  className="bg-yellow-500 hover:bg-yellow-600 text-white px-2 py-1 rounded"
                                >
                                  Edit
                                </button>

                                <button
                                  onClick={() =>
                                    handleDeleteEntry(entry.id, entry.product)
                                  }
                                  className="bg-red-500 hover:bg-red-600 text-white px-3 py-1 rounded transition-colors"
                                >
                                  Delete
                                </button>
                              </>
                            )}
                          </>
                        )}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>

        {/* {role === "office" && <p>You can manage office entries.</p>}
      {role === "admin" && <p>You have full access to all entries.</p>} */}
      </div>
    </div>
  );
}

export default Dashboard;
