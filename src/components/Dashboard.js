import React, { useState, useEffect } from "react";
import axios from "axios";
import { useNavigate } from "react-router-dom";

function Dashboard() {
  const role = localStorage.getItem("role")?.toLowerCase();
  const username = localStorage.getItem("username");
  const token = localStorage.getItem("token");
  const navigate = useNavigate();

  const [entries, setEntries] = useState([]);
  const [form, setForm] = useState({
    product: "",
    quantity: "",
    description: "",
    due_date: "",
  });
  const [entryInputs, setEntryInputs] = useState({});
  const [editingId, setEditingId] = useState(null);
  const [adminEditForm, setAdminEditForm] = useState({});

  useEffect(() => {
    const fetchEntries = async () => {
      try {
        const res = await axios.get("http://localhost:3001/entries", {
          headers: { Authorization: `Bearer ${token}` },
        });
        setEntries(res.data);

        // initialize entryInputs (office editing fields)
        const map = res.data.reduce((acc, entry) => {
          acc[entry.id] = {
            order_form_no: entry.order_form_no || "",
            po_no: entry.po_no || "",
            invoice_no: entry.invoice_no || "",
          };
          return acc;
        }, {});
        setEntryInputs(map);
      } catch (err) {
        console.error("Failed fetching entries:", err);
      }
    };
    fetchEntries();
  }, [token]);

  const logout = () => {
    localStorage.clear();
    navigate("/login");
  };

  // Add new entry (User only)
  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      await axios.post("http://localhost:3001/entries", form, {
        headers: { Authorization: `Bearer ${token}` },
      });
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
        `http://localhost:3001/entries/${id}/${url}`,
        data,
        { headers: { Authorization: `Bearer ${token}` } }
      );
      const updated = res.data.entry ? res.data.entry : res.data;
      setEntries((prev) =>
        prev.map((entry) =>
          entry.id === id ? { ...entry, ...res.data } : entry
        )
      );

      if (url === "orderform" || url === "po" || url === "invoice") {
        setEntryInputs((prev) => ({
          ...prev,
          [id]: {
            ...prev[id],
            [url === "orderform"
              ? "order_form_no"
              : url === "po"
              ? "po_no"
              : "invoice_no"]: "",
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
      user_datetime: entry.user_datetime
        ? new Date(entry.user_datetime).toISOString()
        : null,
      delivery_date: entry.delivery_date
        ? new Date(entry.delivery_date).toISOString()
        : null,
      order_form_no: entry.order_form_no || "",
      po_no: entry.po_no || "",
      invoice_no: entry.invoice_no || "",
      approved: entry.approved || false,
    });
  };

  const cancelAdminEdit = () => {
    setEditingId(null);
    setAdminEditForm({});
  };

  const saveAdminEdit = async (id) => {
    try {
      const res = await axios.put(
        `http://localhost:3001/entries/${id}/admin`,
        adminEditForm,
        { headers: { Authorization: `Bearer ${token}` } }
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

  //   const isUserAdded = (entry) => {
  //     if (entry.added_by) return String(entry.added_by).toLowerCase() === "user";
  //     if (entry.user_id && entry.office_user_1 == null) return true;
  //     if (entry.user_name && !entry.office_user_1) return true;
  //     return false;
  //   };

  return (
    <div className="p-4 md:p-8">
      <div className="flex flex-col md:flex-row justify-between items-center mb-6">
        <h2 className="text-2xl font-bold mb-3 md:mb-0">
          Welcome, {username} ({role})
        </h2>
        <button
          onClick={logout}
          className="bg-red-500 hover:bg-red-600 text-white px-4 py-2 rounded"
        >
          Logout
        </button>
      </div>

      {/* Create entry form (user only) */}
      {role === "user" && (
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
      )}

      {/* Entries Table */}
      <div className="overflow-x-auto">
        <table
          border={1}
          cellPadding={8}
          className="min-w-full border border-gray-300 bg-white rounded"
        >
          <thead className="bg-gray-100 sticky top-0 border border-gray-300 ">
            <tr>
              <th className="border px-3 py-2 text-left text-sm md:text-base whitespace-nowrap">
                ID
              </th>
              <th className="border px-3 py-2 text-left text-sm md:text-base whitespace-nowrap">
                User
              </th>
              <th className="border px-3 py-2 text-left text-sm md:text-base whitespace-nowrap">
                Item
              </th>
              <th className="border px-3 py-2 text-left text-sm md:text-base whitespace-nowrap">
                Quantity
              </th>
              <th className="border px-3 py-2 text-left text-sm md:text-base whitespace-nowrap">
                Requested Date & Time
              </th>
              <th className="border px-3 py-2 text-left text-sm md:text-base whitespace-nowrap">
                Due Date
              </th>
              <th className="border px-3 py-2 text-left text-sm md:text-base whitespace-nowrap">
                Description
              </th>

              <th className="border px-3 py-2 text-left text-sm md:text-base whitespace-nowrap">
                Office User
              </th>
              <th className="border px-3 py-2 text-left text-sm md:text-base whitespace-nowrap">
                Order Form No
              </th>
              <th className="border px-3 py-2 text-left text-sm md:text-base whitespace-nowrap">
                Office Date & Time
              </th>

              <th className="border px-3 py-2 text-left text-sm md:text-base whitespace-nowrap">
                Approve Status
              </th>
              <th className="border px-3 py-2 text-left text-sm md:text-base whitespace-nowrap">
                Updated Status
              </th>

              <th className="border px-3 py-2 text-left text-sm md:text-base whitespace-nowrap">
                Office User
              </th>
              <th className="border px-3 py-2 text-left text-sm md:text-base whitespace-nowrap">
                PO No
              </th>
              <th className="border px-3 py-2 text-left text-sm md:text-base whitespace-nowrap">
                Office Date & Time
              </th>

              <th className="border px-3 py-2 text-left text-sm md:text-base whitespace-nowrap">
                Office User
              </th>
              <th className="border px-3 py-2 text-left text-sm md:text-base whitespace-nowrap">
                Invoice No
              </th>
              <th className="border px-3 py-2 text-left text-sm md:text-base whitespace-nowrap">
                Office Date & Time
              </th>
              <th className="border px-3 py-2 text-left text-sm md:text-base whitespace-nowrap">
                Purchase Date
              </th>
              <th className="border px-3 py-2 text-left text-sm md:text-base whitespace-nowrap">
                Driver's Name
              </th>
              <th className="border px-3 py-2 text-left text-sm md:text-base whitespace-nowrap">
                Vehicle No
              </th>
              <th className="border px-3 py-2 text-left text-sm md:text-base whitespace-nowrap">
                Description
              </th>

              {(role === "office" || role === "admin") && <th>Actions</th>}
            </tr>
          </thead>

          <tbody>
            {entries.map((entry) => {
              const editableByAdmin = role === "admin"; // Admin can edit everything
              const isEditing = editingId === entry.id;

              return (
                <tr key={entry.id} className="hover:bg-gray-50">
                  <td
                    style={{ background: "#8cc3e0" }}
                    className="border px-2 py-1"
                  >
                    {entry.id}
                  </td>

                  {/* Editable cells for admin */}
                  <td
                    style={{ background: "#8cc3e0" }}
                    className="border px-2 py-1"
                  >
                    {editingId === entry.id && role === "admin" ? (
                      <input
                        value={adminEditForm.user_name || ""}
                        className="border rounded px-2 py-1 w-full"
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

                  <td
                    style={{ background: "#8cc3e0" }}
                    className="border px-2 py-1"
                  >
                    {editingId === entry.id && role === "admin" ? (
                      <input
                        value={adminEditForm.product || ""}
                        className="border rounded px-2 py-1 w-full"
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

                  <td
                    style={{ background: "#8cc3e0" }}
                    className="border px-2 py-1"
                  >
                    {editingId === entry.id && role === "admin" ? (
                      <input
                        value={adminEditForm.quantity || ""}
                        className="border rounded px-2 py-1 w-full"
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

                  <td
                    style={{ background: "#8cc3e0" }}
                    className="border px-2 py-1"
                  >
                    {entry.user_datetime
                      ? new Date(entry.user_datetime).toLocaleString()
                      : "-"}
                  </td>

                  <td
                    style={{ background: "#8cc3e0" }}
                    className="border px-2 py-1"
                  >
                    {entry.due_date
                      ? new Date(entry.due_date).toLocaleDateString("en-GB")
                      : "-"}
                  </td>

                  <td
                    style={{ background: "#8cc3e0" }}
                    className="border px-2 py-1"
                  >
                    {editingId === entry.id && role === "admin" ? (
                      <input
                        value={adminEditForm.description || ""}
                        className="border rounded px-2 py-1 w-full"
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
                  <td
                    style={{ background: "#e08cb6" }}
                    className="border px-2 py-1"
                  >
                    {entry.office_user_1 || "-"}
                  </td>
                  <td
                    style={{ background: "#e08cb6" }}
                    className="border px-2 py-1"
                  >
                    {editingId === entry.id && role === "admin" ? (
                      // Admin can edit directly
                      <input
                        type="text"
                        value={adminEditForm.order_form_no || ""}
                        className="border rounded px-2 py-1 w-full"
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
                      role === "office" && (
                        <div className="flex gap-2">
                          <input
                            type="text"
                            placeholder="Order Form No"
                            value={entryInputs[entry.id]?.order_form_no || ""}
                            className="border rounded px-2 py-1 w-full"
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
                          <button
                            onClick={() =>
                              handleUpdate(entry.id, {
                                url: "orderform",
                                data: {
                                  order_form_no:
                                    entryInputs[entry.id]?.order_form_no,
                                },
                              })
                            }
                            className="bg-green-500 hover:bg-green-600 text-white px-2 py-1 rounded"
                          >
                            Save
                          </button>
                        </div>
                      )
                    )}
                  </td>

                  <td
                    style={{ background: "#e08cb6" }}
                    className="border px-2 py-1"
                  >
                    {entry.office_datetime_1
                      ? new Date(entry.office_datetime_1).toLocaleString()
                      : "-"}
                  </td>

                  {/* Approval */}
                  <td
                    style={{ background: "#e0da8c" }}
                    className="border px-2 py-1"
                  >
                    {entry.approved ? "Yes" : "No"}
                  </td>

                  <td
                    style={{ background: "#e0da8c" }}
                    className="border px-2 py-1"
                  >
                    {entry.approved ? (
                      <button
                        disabled
                        className="bg-gray-400 text-white px-2 py-1 rounded"
                      >
                        Approved
                      </button>
                    ) : (
                      role === "admin" && (
                        <button
                          onClick={() =>
                            handleUpdate(entry.id, {
                              url: "approve",
                              data: { approved: true },
                            })
                          }
                          className="bg-blue-500 hover:bg-blue-600 text-white px-2 py-1 rounded"
                        >
                          Approve
                        </button>
                      )
                    )}
                  </td>

                  {/* PO */}
                  <td
                    style={{ background: "#8ce0a8" }}
                    className="border px-2 py-1"
                  >
                    {entry.office_user_2 || "-"}
                  </td>
                  <td
                    style={{ background: "#8ce0a8" }}
                    className="border px-2 py-1"
                  >
                    {editingId === entry.id && role === "admin" ? (
                      // Admin can edit directly
                      <input
                        type="text"
                        value={adminEditForm.po_no || ""}
                        className="border rounded px-2 py-1 w-full"
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
                      role === "office" &&
                      entry.approved && (
                        <div>
                          <input
                            placeholder="PO No"
                            value={entryInputs[entry.id]?.po_no || ""}
                            className="border rounded px-2 py-1 w-full"
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
                            className="bg-green-500 hover:bg-green-600 text-white px-2 py-1 rounded"
                            onClick={() =>
                              handleUpdate(entry.id, {
                                url: "po",
                                data: { po_no: entryInputs[entry.id]?.po_no },
                              })
                            }
                          >
                            Save
                          </button>
                        </div>
                      )
                    )}
                  </td>

                  <td
                    style={{ background: "#8ce0a8" }}
                    className="border px-2 py-1"
                  >
                    {entry.office_datetime_2
                      ? new Date(entry.office_datetime_2).toLocaleString()
                      : "-"}
                  </td>

                  {/* Invoice */}
                  <td
                    style={{ background: "#e0b58c" }}
                    className="border px-2 py-1"
                  >
                    {entry.office_user_3 || "-"}
                  </td>
                  <td
                    style={{ background: "#e0b58c" }}
                    className="border px-2 py-1"
                  >
                    {editingId === entry.id && role === "admin" ? (
                      // Admin can edit directly
                      <input
                        type="text"
                        value={adminEditForm.invoice_no || ""}
                        className="border rounded px-2 py-1 w-full"
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
                      role === "office" &&
                      entry.po_no && (
                        <div>
                          <input
                            placeholder="Invoice No"
                            value={entryInputs[entry.id]?.invoice_no || ""}
                            className="border rounded px-2 py-1 w-full"
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
                                  invoice_no: entryInputs[entry.id]?.invoice_no,
                                },
                              })
                            }
                            className="bg-green-500 hover:bg-green-600 text-white px-2 py-1 rounded"
                          >
                            Save
                          </button>
                        </div>
                      )
                    )}
                  </td>

                  <td
                    style={{ background: "#e0b58c" }}
                    className="border px-2 py-1"
                  >
                    {entry.office_datetime_3
                      ? new Date(entry.office_datetime_3).toLocaleString()
                      : "-"}
                  </td>

                  {/* Driver Details */}
                  <td
                    style={{ background: "#cfa1faff" }}
                    className="border px-2 py-1"
                  >
                    {editingId === entry.id && role === "admin" ? (
                      // Admin can edit directly
                      <input
                        type="date"
                        value={
                          adminEditForm.purchase_date
                            ? adminEditForm.purchase_date.split("T")[0]
                            : ""
                        }
                        className="border rounded px-2 py-1 w-full"
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
                      role === "office" && (
                        <div>
                          <input
                            type="date"
                            value={entryInputs[entry.id]?.purchase_date || ""}
                            className="border rounded px-2 py-1 w-full"
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
                          <button
                            onClick={() =>
                              handleUpdate(entry.id, {
                                url: "driver",
                                data: {
                                  purchase_date:
                                    entryInputs[entry.id]?.purchase_date,
                                },
                              })
                            }
                            className="bg-green-500 hover:bg-green-600 text-white px-2 py-1 rounded mt-1"
                          >
                            Save
                          </button>
                        </div>
                      )
                    )}
                  </td>

                  <td
                    style={{ background: "#cfa1faff" }}
                    className="border px-2 py-1"
                  >
                    {entry.purchase_date
                      ? new Date(entry.purchase_date).toLocaleString()
                      : "-"}
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
                            <button onClick={cancelAdminEdit}>Cancel</button>
                          </>
                        ) : (
                          <button
                            onClick={() => startAdminEdit(entry)}
                            className="bg-yellow-500 hover:bg-yellow-600 text-white px-2 py-1 rounded"
                          >
                            Edit
                          </button>
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

      {/* {role === "office" && <p>You can manage office entries.</p>}
      {role === "admin" && <p>You have full access to all entries.</p>} */}
    </div>
  );
}

export default Dashboard;
