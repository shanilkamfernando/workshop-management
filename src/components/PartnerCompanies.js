import React, { useState, useEffect, useCallback } from "react";
import axios from "axios";
import { useNavigate } from "react-router-dom";
import logo from "../images/logo.png";

function PartnerCompanies() {
  const [partners, setPartners] = useState([]);
  const [newPartner, setNewPartner] = useState({
    name: "",
    image: null,
    imagePreview: null,
  });
  const [showAddForm, setShowAddForm] = useState(false);
  const navigate = useNavigate();

  const token = localStorage.getItem("token");
  const role = localStorage.getItem("role");
  const username = localStorage.getItem("username");

  // Load partners from backend
  const fetchPartners = useCallback(async () => {
    try {
      let endpoint = `${process.env.REACT_APP_API_URL}/partner`;

      // Admin sees partners with notification status
      if (role === "admin" || role === "office_admin") {
        endpoint = `${process.env.REACT_APP_API_URL}/partners/status/all`;
      } else if (role === "office" || role === "stores") {
        endpoint = `${process.env.REACT_APP_API_URL}/partners/status/office`;
      }

      console.log("Fetching partners from:", endpoint);

      const res = await axios.get(endpoint, {
        headers: { Authorization: `Bearer ${token}` },
      });
      console.log("Partners fetched:", res.data);

      setPartners(res.data);
    } catch (err) {
      console.error("Error fetching partners:", err);

      // Fallback to regular endpoint if status endpoint fails

      if (
        role === "admin" ||
        role === "office" ||
        role === "office_admin" ||
        role === "stores"
      ) {
        try {
          console.log("Trying fallback endpoint...");

          const fallbackRes = await axios.get(
            `${process.env.REACT_APP_API_URL}/partners`,
            {
              headers: {
                Authorization: `Bearer ${token}`,
              },
            },
          );
          console.log("Fallback successful:", fallbackRes.data);

          setPartners(fallbackRes.data || []);
        } catch (fallbackErr) {
          console.error("Fallback also failed:", fallbackErr);

          setPartners([]);
        }
      } else {
        setPartners([]);
      }
    }
  }, [role, token]);

  useEffect(() => {
    fetchPartners();
  }, [fetchPartners]);

  // Refresh partners every 5 seconds for admin (to update notification dots)
  useEffect(() => {
    if (
      role !== "admin" &&
      role !== "office" &&
      role !== "office_admin" &&
      role !== "stores"
    )
      return;

    const interval = setInterval(() => {
      fetchPartners();
    }, 5000);

    return () => clearInterval(interval);
  }, [role, fetchPartners]);

  // Handle image selection
  const handleImageChange = (e) => {
    const file = e.target.files[0];
    if (file) {
      // Validate file size (max 2MB)
      if (file.size > 2 * 1024 * 1024) {
        alert("Image size should be less than 2MB");
        return;
      }

      // Validate file type
      if (!file.type.startsWith("image/")) {
        alert("Please select an image file");
        return;
      }

      const reader = new FileReader();
      reader.onloadend = () => {
        setNewPartner({
          ...newPartner,
          image: file,
          imagePreview: reader.result,
        });
      };
      reader.readAsDataURL(file);
    }
  };

  // Create a new partner - admin only
  const createPartner = async () => {
    if (!newPartner.name.trim()) {
      alert("Please enter a partner name");
      return;
    }

    try {
      const formData = new FormData();
      formData.append("name", newPartner.name);
      if (newPartner.image) {
        formData.append("image", newPartner.image);
      }

      const res = await axios.post(
        `${process.env.REACT_APP_API_URL}/partners`,
        formData,
        {
          headers: {
            Authorization: `Bearer ${token}`,
            "Content-Type": "multipart/form-data",
          },
        },
      );

      setPartners([...partners, res.data]);
      setNewPartner({ name: "", image: null, imagePreview: null });
      setShowAddForm(false);
      alert("Partner created successfully!");
    } catch (err) {
      alert(err.response?.data?.error || "Failed to create partner");
    }
  };

  // Delete partner - admin only
  const deletePartner = async (partnerId, partnerName) => {
    const confirmed = window.confirm(
      `Are you sure you want to delete "${partnerName}"? This action cannot be undone.`,
    );

    if (!confirmed) return;

    try {
      await axios.delete(
        `${process.env.REACT_APP_API_URL}/partners/${partnerId}`,
        {
          headers: { Authorization: `Bearer ${token}` },
        },
      );

      setPartners(partners.filter((p) => p.id !== partnerId));
      alert("Partner deleted successfully!");
    } catch (err) {
      alert(err.response?.data?.error || "Failed to delete partner");
    }
  };

  const logout = () => {
    localStorage.clear();
    navigate("/login");
  };

  // Default placeholder image
  const getPartnerImage = (partner) => {
    return (
      partner.image_url ||
      `https://ui-avatars.com/api/?name=${encodeURIComponent(
        partner.name,
      )}&size=200&background=4F46E5&color=fff&bold=true`
    );
  };

  const getNotificationColor = (color) => {
    const colorMap = {
      red: "bg-red-500",
      yellow: "bg-yellow-500",
      green: "bg-green-500",
      orange: "bg-orange-500",
      gray: "bg-gray-500",
    };
    return colorMap[color] || "";
  };

  const getNotificationLabel = (color) => {
    const labelMap = {
      red: "New Entries",
      yellow: "Pending Approval",
      green: "Approved - PO Pending",
      orange: "Invoice Pending",
      gray: "Driver Details Pending",
    };
    return labelMap[color] || "";
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-purple-50">
      {/* Header */}
      <div className="bg-white shadow-md">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
          <div className="flex justify-between items-center">
            <div className="flex items-center justify-center space-x-10">
              {/* <div className="w-10 h-10 bg-blue-600 rounded-lg flex items-center justify-center">
                <span className="text-white font-bold text-xl">C</span>
              </div> */}
              <div className=" rounded-lg flex items-center justify-center">
                <img src={logo} alt="Logo" />
              </div>
              <span className="text-gray-600 text-4xl">
                Welcome, <strong>{username}</strong>
              </span>
            </div>
            <div className="flex gap-5">
              {/* Create User Button - Admin Only */}
              {role === "admin" && (
                <button
                  onClick={() => navigate("/signup")}
                  className="bg-green-500 hover:bg-green-600 text-white px-4 py-2 rounded-lg transition-colors duration-200 flex items-center space-x-2"
                >
                  <svg
                    xmlns="http://www.w3.org/2000/svg"
                    className="h-5 w-5"
                    viewBox="0 0 20 20"
                    fill="currentColor"
                  >
                    <path d="M8 9a3 3 0 100-6 3 3 0 000 6zM8 11a6 6 0 016 6H2a6 6 0 016-6zM16 7a1 1 0 10-2 0v1h-1a1 1 0 100 2h1v1a1 1 0 102 0v-1h1a1 1 0 100-2h-1V7z" />
                  </svg>
                  <span>Create User</span>
                </button>
              )}
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

      {/* Main Content */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        {/* Title */}
        <div className="text-center mb-12">
          <h1 className="text-5xl font-bold text-gray-900 mb-3">
            COOLMan Refrigeration (Pvt) Ltd
          </h1>
          <div className="mt-4 flex justify-center">
            <div className="h-1 w-24 bg-gradient-to-r from-blue-500 to-purple-500 rounded-full"></div>
          </div>
        </div>

        {/* Add Partner Button (Admin only) */}
        {role === "admin" && !showAddForm && (
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
              <span>Add New Partner</span>
            </button>
          </div>
        )}

        {/* Add Partner Form (Admin only) */}
        {role === "admin" && showAddForm && (
          <div className="max-w-2xl mx-auto mb-12 bg-white rounded-2xl shadow-xl p-8 border border-gray-100">
            <h2 className="text-2xl font-bold text-gray-800 mb-6 text-center">
              Add New Partner
            </h2>

            <div className="space-y-6">
              {/* Partner Name Input */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Partner Name *
                </label>
                <input
                  type="text"
                  value={newPartner.name}
                  onChange={(e) =>
                    setNewPartner({ ...newPartner, name: e.target.value })
                  }
                  className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all"
                  placeholder="Enter partner name"
                  onKeyPress={(e) => {
                    if (e.key === "Enter") createPartner();
                  }}
                />
              </div>

              {/* Image Upload */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Partner Logo (Optional)
                </label>
                <div className="flex items-center space-x-4">
                  {/* Image Preview */}
                  <div className="w-32 h-32 border-2 border-dashed border-gray-300 rounded-lg flex items-center justify-center overflow-hidden bg-gray-50">
                    {newPartner.imagePreview ? (
                      <img
                        src={newPartner.imagePreview}
                        alt="Preview"
                        className="w-full h-full object-cover"
                      />
                    ) : (
                      <div className="text-center">
                        <svg
                          xmlns="http://www.w3.org/2000/svg"
                          className="h-12 w-12 text-gray-400 mx-auto"
                          fill="none"
                          viewBox="0 0 24 24"
                          stroke="currentColor"
                        >
                          <path
                            strokeLinecap="round"
                            strokeLinejoin="round"
                            strokeWidth={2}
                            d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z"
                          />
                        </svg>
                        <p className="text-xs text-gray-500 mt-1">No image</p>
                      </div>
                    )}
                  </div>

                  {/* Upload Button */}
                  <div className="flex-1">
                    <label className="cursor-pointer bg-gray-100 hover:bg-gray-200 text-gray-700 px-4 py-3 rounded-lg inline-flex items-center space-x-2 transition-colors duration-200">
                      <svg
                        xmlns="http://www.w3.org/2000/svg"
                        className="h-5 w-5"
                        fill="none"
                        viewBox="0 0 24 24"
                        stroke="currentColor"
                      >
                        <path
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          strokeWidth={2}
                          d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12"
                        />
                      </svg>
                      <span>Choose Image</span>
                      <input
                        type="file"
                        accept="image/*"
                        onChange={handleImageChange}
                        className="hidden"
                      />
                    </label>
                    <p className="text-xs text-gray-500 mt-2">
                      Max 2MB. JPG, PNG, or GIF
                    </p>
                  </div>
                </div>
              </div>

              {/* Action Buttons */}
              <div className="flex space-x-3 pt-4">
                <button
                  onClick={createPartner}
                  className="flex-1 bg-gradient-to-r from-green-500 to-green-600 hover:from-green-600 hover:to-green-700 text-white py-3 rounded-lg font-semibold shadow-md hover:shadow-lg transition-all duration-200"
                >
                  Create Partner
                </button>
                <button
                  onClick={() => {
                    setShowAddForm(false);
                    setNewPartner({
                      name: "",
                      image: null,
                      imagePreview: null,
                    });
                  }}
                  className="px-6 bg-gray-200 hover:bg-gray-300 text-gray-700 py-3 rounded-lg font-semibold transition-colors duration-200"
                >
                  Cancel
                </button>
              </div>
            </div>
          </div>
        )}

        {/* Partners Grid */}
        {partners.length === 0 ? (
          <div className="text-center py-20">
            <div className="inline-block p-6 bg-gray-100 rounded-full mb-4">
              <svg
                xmlns="http://www.w3.org/2000/svg"
                className="h-16 w-16 text-gray-400"
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4"
                />
              </svg>
            </div>
            <h3 className="text-2xl font-semibold text-gray-700 mb-2">
              No Partners Yet
            </h3>
            <p className="text-gray-500">
              {role === "admin"
                ? "Click the button above to add your first partner!"
                : "No partners have been added yet."}
            </p>
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
            {partners.map((p) => (
              <div
                key={p.id}
                className="group relative bg-white rounded-2xl shadow-md hover:shadow-2xl transition-all duration-300 overflow-hidden border border-gray-100 hover:border-blue-200"
              >
                {/* Admin Only: Notification Dot */}
                {(role === "admin" ||
                  role === "office" ||
                  role === "office_admin" ||
                  role === "stores") &&
                  p.notificationColor && (
                    <div className="absolute top-4 left-1 flex items-center gap-2 z-10">
                      <div
                        className={`w-4 h-4 rounded-full ${getNotificationColor(
                          p.notificationColor,
                        )} animate-pulse shadow-lg`}
                        title={getNotificationLabel(p.notificationColor)}
                      ></div>
                      <span className="text-xs font-semibold text-gray-700 bg-white px-2 py-1 rounded-full shadow-sm opacity-0 group-hover:opacity-100 transition-opacity duration-200 whitespace-nowrap">
                        {p.totalPending} pending
                      </span>
                    </div>
                  )}

                <div className="relative">
                  {/* Partner Image */}
                  <div className="h-48 bg-gradient-to-br from-blue-100 to-purple-100 flex items-center justify-center overflow-hidden">
                    <img
                      src={getPartnerImage(p)}
                      alt={p.name}
                      className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-300"
                    />
                  </div>

                  {/* Delete Button - Admin Only */}
                  {role === "admin" && (
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        deletePartner(p.id, p.name);
                      }}
                      className="absolute top-3 right-3 bg-red-500 hover:bg-red-600 text-white p-2 rounded-lg opacity-0 group-hover:opacity-100 transition-all duration-200 shadow-lg"
                      title="Delete partner"
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
                </div>

                {/* Partner Info */}
                <button
                  onClick={() => navigate(`/partners/${p.id}/projects`)}
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
                    <span>View Projects</span>
                  </div>

                  {/* Admin Only: Detailed Breakdown */}
                  {(role === "admin" ||
                    role === "office" ||
                    role === "office_admin" ||
                    role === "stores") &&
                    p.totalPending > 0 && (
                      <div className="mt-4 pt-4 border-t border-gray-200 space-y-1">
                        <p className="text-xs font-semibold text-gray-700">
                          Pending Items:
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
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

export default PartnerCompanies;
