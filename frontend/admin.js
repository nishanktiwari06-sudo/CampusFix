
/* ==========================================
   CAMPUSFIX ADMIN DASHBOARD
   COMPLETE UPGRADED JAVASCRIPT
========================================== */

const API_URL = "http://127.0.0.1:8080/api/complaints";
const IMAGE_BASE_URL = "http://127.0.0.1:8080";
const STUDENTS_API_URL = "http://127.0.0.1:8080/api/students/all";

let allComplaints = [];
let allStudents = [];


/* ==========================================
   INITIALIZE DASHBOARD
========================================== */

document.addEventListener("DOMContentLoaded", () => {

    loadComplaints();
    loadStudents();

    initializeAppearance();
    initializeNotifications();

    const searchInput = document.getElementById("searchInput");
    if (searchInput) {
        searchInput.addEventListener("input", applyFilters);
    }

    const statusFilter = document.getElementById("statusFilter");
    if (statusFilter) {
        statusFilter.addEventListener("change", applyFilters);
    }

    const priorityFilter = document.getElementById("priorityFilter");
    if (priorityFilter) {
        priorityFilter.addEventListener("change", applyFilters);
    }

    const studentSearch = document.getElementById("studentSearch");
    if (studentSearch) {
        studentSearch.addEventListener("input", applyStudentFilters);
    }

    const departmentFilter = document.getElementById("studentDepartmentFilter");
    if (departmentFilter) {
        departmentFilter.addEventListener("change", applyStudentFilters);
    }

    const refreshStudentsButton = document.getElementById("refreshStudents");
    if (refreshStudentsButton) {
        refreshStudentsButton.addEventListener("click", loadStudents);
    }

    const passwordForm = document.getElementById("changePasswordForm");
    if (passwordForm) {
        passwordForm.addEventListener("submit", handlePasswordForm);
    }

});


/* ==========================================
   HTML ESCAPE
========================================== */

function escapeHTML(value) {

    return String(value ?? "").replace(/[&<>"']/g, character => ({
        "&": "&amp;",
        "<": "&lt;",
        ">": "&gt;",
        '"': "&quot;",
        "'": "&#39;"
    })[character]);

}


/* ==========================================
   LOAD REGISTERED STUDENTS
========================================== */

async function loadStudents() {

    const table = document.getElementById("studentsTable");
    const message = document.getElementById("studentsMessage");
    const refreshButton = document.getElementById("refreshStudents");

    if (!table) return;

    table.innerHTML = `
        <tr>
            <td colspan="6">Loading registered students...</td>
        </tr>
    `;

    if (message) message.textContent = "";

    if (refreshButton) {
        refreshButton.disabled = true;
    }

    try {

        const response = await fetch(STUDENTS_API_URL, {
            method: "GET",
            credentials: "include",
            headers: {
                "Accept": "application/json"
            }
        });

        if (response.status === 401 || response.status === 403) {
            throw new Error(
                "Admin session expired or access denied. Please login again."
            );
        }

        if (!response.ok) {
            throw new Error(`Students API failed: ${response.status}`);
        }

        const data = await response.json();

        if (!Array.isArray(data)) {
            throw new Error("Invalid students response.");
        }

        allStudents = data;

        populateDepartmentFilter();
        applyStudentFilters();

        if (message) {
            message.textContent =
                `${allStudents.length} registered account(s) loaded.`;
        }

    } catch (error) {

        console.error("Error loading students:", error);

        table.innerHTML = `
            <tr>
                <td colspan="6">
                    ${escapeHTML(error.message)}
                </td>
            </tr>
        `;

        const totalElement = document.getElementById("totalStudents");

        if (totalElement) {
            totalElement.textContent = "0";
        }

        if (message) {
            message.textContent =
                "Check Admin login and backend connection.";
        }

    } finally {

        if (refreshButton) {
            refreshButton.disabled = false;
        }

    }

}


/* ==========================================
   POPULATE DEPARTMENT FILTER
========================================== */

function populateDepartmentFilter() {

    const filter = document.getElementById("studentDepartmentFilter");

    if (!filter) return;

    const selectedValue = filter.value || "all";

    const departments = [
        ...new Set(
            allStudents
                .map(student => (student.department || "").trim())
                .filter(Boolean)
        )
    ].sort((a, b) => a.localeCompare(b));

    filter.replaceChildren();

    const allOption = document.createElement("option");

    allOption.value = "all";
    allOption.textContent = "All Departments";

    filter.appendChild(allOption);

    departments.forEach(department => {

        const option = document.createElement("option");

        option.value = department;
        option.textContent = department;

        filter.appendChild(option);

    });

    filter.value = departments.includes(selectedValue)
        ? selectedValue
        : "all";

}


/* ==========================================
   RENDER STUDENTS TABLE
========================================== */

function renderStudents(students) {

    const table = document.getElementById("studentsTable");
    const totalElement = document.getElementById("totalStudents");

    if (!table) return;

    if (totalElement) {
        totalElement.textContent = allStudents.length;
    }

    table.replaceChildren();

    if (!students || students.length === 0) {

        table.innerHTML = `
            <tr>
                <td colspan="6">No students found.</td>
            </tr>
        `;

        return;
    }

    students.forEach(student => {

        const row = document.createElement("tr");

        const role = (student.role || "STUDENT").toUpperCase();

        const values = [
            student.id ?? "—",
            student.fullName || "Not available",
            student.rollNo || "Not available",
            student.email || "Not available",
            student.department || "Not specified"
        ];

        values.forEach((value, index) => {

            const cell = document.createElement("td");

            if (index === 0) {

                const strong = document.createElement("strong");
                strong.textContent = String(value);

                cell.appendChild(strong);

            } else {

                cell.textContent = String(value);

            }

            row.appendChild(cell);

        });

        const roleCell = document.createElement("td");
        const roleBadge = document.createElement("span");

        roleBadge.className = role === "ADMIN"
            ? "student-role-badge admin-role"
            : "student-role-badge";

        roleBadge.textContent = role;

        roleCell.appendChild(roleBadge);
        row.appendChild(roleCell);

        table.appendChild(row);

    });

}


/* ==========================================
   FILTER STUDENTS
========================================== */

function applyStudentFilters() {

    const searchInput = document.getElementById("studentSearch");

    const departmentFilter =
        document.getElementById("studentDepartmentFilter");

    const searchValue = searchInput
        ? searchInput.value.trim().toLowerCase()
        : "";

    const selectedDepartment = departmentFilter
        ? departmentFilter.value
        : "all";

    const filteredStudents = allStudents.filter(student => {

        const searchableText = [

            student.id,
            student.fullName,
            student.rollNo,
            student.email,
            student.department,
            student.role

        ].join(" ").toLowerCase();

        const matchesSearch =
            searchableText.includes(searchValue);

        const matchesDepartment =
            selectedDepartment === "all" ||
            (student.department || "").trim() === selectedDepartment;

        return matchesSearch && matchesDepartment;

    });

    renderStudents(filteredStudents);

}


/* ==========================================
   LOAD ALL COMPLAINTS
========================================== */

async function loadComplaints() {

    const table = document.getElementById("complaintsTable");

    if (!table) return;

    table.innerHTML = `
        <tr>
            <td colspan="8">Loading complaints...</td>
        </tr>
    `;

    try {

        const response = await fetch(API_URL);

        if (!response.ok) {
            throw new Error("Failed to load complaints");
        }

        allComplaints = await response.json();

        if (!Array.isArray(allComplaints)) {
            throw new Error("Invalid complaints response");
        }

        renderComplaints(allComplaints);
        updateStatistics();

    } catch (error) {

        console.error("Error loading complaints:", error);

        table.innerHTML = `
            <tr>
                <td colspan="8">
                    Unable to load complaints. Please check backend server.
                </td>
            </tr>
        `;

    }

}


/* ==========================================
   RENDER COMPLAINTS
========================================== */

function renderComplaints(complaints) {

    const table = document.getElementById("complaintsTable");

    if (!table) return;

    table.replaceChildren();

    if (!complaints || complaints.length === 0) {

        table.innerHTML = `
            <tr>
                <td colspan="8">No complaints found.</td>
            </tr>
        `;

        updateStatistics();
        return;

    }

    complaints.forEach(complaint => {

        const row = document.createElement("tr");

        row.dataset.complaintId = String(complaint.id);

        const status = complaint.status || "Pending";
        const priority = complaint.priority || "Medium";

        let statusClass = "";

        if (status === "Pending") {
            statusClass = "pending-status";
        } else if (status === "In Progress") {
            statusClass = "progress-status";
        } else if (status === "Resolved") {
            statusClass = "resolved-status";
        }

        const date = complaint.createdAt
            ? new Date(complaint.createdAt).toLocaleDateString()
            : "Not available";

        const studentEmail =
            complaint.studentEmail || "Unknown Student";

        row.innerHTML = `

            <td>
                <strong>CF-${escapeHTML(complaint.id)}</strong>
            </td>

            <td>
                <div class="student-cell">
                    <div class="student-avatar">
                        ${escapeHTML(studentEmail.charAt(0).toUpperCase())}
                    </div>
                    <div>
                        <strong>${escapeHTML(studentEmail)}</strong>
                    </div>
                </div>
            </td>

            <td>${escapeHTML(complaint.title)}</td>

            <td>${escapeHTML(complaint.category)}</td>

            <td>${escapeHTML(date)}</td>

            <td>
                <select class="priority-select ${escapeHTML(priority.toLowerCase())}"
                        aria-label="Complaint priority">

                    <option value="High" ${priority === "High" ? "selected" : ""}>
                        High
                    </option>

                    <option value="Medium" ${priority === "Medium" ? "selected" : ""}>
                        Medium
                    </option>

                    <option value="Low" ${priority === "Low" ? "selected" : ""}>
                        Low
                    </option>

                </select>
            </td>

            <td>
                <select class="status-select ${statusClass}"
                        aria-label="Complaint status">

                    <option value="Pending" ${status === "Pending" ? "selected" : ""}>
                        Pending
                    </option>

                    <option value="In Progress" ${status === "In Progress" ? "selected" : ""}>
                        In Progress
                    </option>

                    <option value="Resolved" ${status === "Resolved" ? "selected" : ""}>
                        Resolved
                    </option>

                </select>
            </td>

            <td class="action-buttons">

                <button class="view-btn" type="button">
                    <i class="fa-solid fa-eye"></i>
                    View
                </button>

                <button class="delete-btn" type="button">
                    <i class="fa-solid fa-trash"></i>
                    Delete
                </button>

            </td>

        `;

        const statusSelect = row.querySelector(".status-select");

        statusSelect.addEventListener("change", () => {
            changeStatus(statusSelect, complaint.id);
        });

        const prioritySelect = row.querySelector(".priority-select");

        prioritySelect.addEventListener("change", () => {
            changePriority(prioritySelect, complaint.id);
        });

        row.querySelector(".view-btn").addEventListener("click", () => {
            viewComplaint(complaint.id);
        });

        row.querySelector(".delete-btn").addEventListener("click", () => {
            deleteComplaint(complaint.id);
        });

        table.appendChild(row);

    });

    applyFilters();
    updateStatistics();

}


/* ==========================================
   SEARCH AND FILTERS
========================================== */

function applyFilters() {

    const searchInput = document.getElementById("searchInput");
    const statusFilter = document.getElementById("statusFilter");
    const priorityFilter = document.getElementById("priorityFilter");

    const searchValue = searchInput
        ? searchInput.value.toLowerCase().trim()
        : "";

    const selectedStatus = statusFilter
        ? statusFilter.value
        : "all";

    const selectedPriority = priorityFilter
        ? priorityFilter.value
        : "all";

    const filteredComplaints = allComplaints.filter(complaint => {

        const searchableText = [

            complaint.id,
            complaint.studentEmail,
            complaint.title,
            complaint.category,
            complaint.location,
            complaint.description

        ].join(" ").toLowerCase();

        const matchesSearch =
            searchableText.includes(searchValue);

        const matchesStatus =
            selectedStatus === "all" ||
            complaint.status === selectedStatus;

        const matchesPriority =
            selectedPriority === "all" ||
            (complaint.priority || "Medium") === selectedPriority;

        return matchesSearch && matchesStatus && matchesPriority;

    });

    renderFilteredRows(filteredComplaints);

}


/* ==========================================
   RENDER FILTERED ROWS
========================================== */

function renderFilteredRows(complaints) {

    const rows = document.querySelectorAll("#complaintsTable tr");

    const ids = new Set(
        complaints.map(item => String(item.id))
    );

    rows.forEach(row => {

        const id = row.dataset.complaintId;

        if (!id) {
            row.style.display = "";
            return;
        }

        row.style.display = ids.has(id) ? "" : "none";

    });

}


/* ==========================================
   UPDATE STATISTICS
========================================== */

function updateStatistics() {

    const total = allComplaints.length;

    let pending = 0;
    let progress = 0;
    let resolved = 0;

    allComplaints.forEach(complaint => {

        if (complaint.status === "Pending") {
            pending++;
        } else if (complaint.status === "In Progress") {
            progress++;
        } else if (complaint.status === "Resolved") {
            resolved++;
        }

    });

    const totalElement = document.getElementById("totalComplaints");
    const pendingElement = document.getElementById("pendingComplaints");
    const progressElement = document.getElementById("progressComplaints");
    const resolvedElement = document.getElementById("resolvedComplaints");

    if (totalElement) totalElement.textContent = total;
    if (pendingElement) pendingElement.textContent = pending;
    if (progressElement) progressElement.textContent = progress;
    if (resolvedElement) resolvedElement.textContent = resolved;

}


/* ==========================================
   CHANGE STATUS
========================================== */

async function changeStatus(select, complaintId) {

    const newStatus = select.value;

    const complaint = allComplaints.find(
        item => String(item.id) === String(complaintId)
    );

    const oldStatus = complaint?.status || "Pending";

    select.disabled = true;

    try {

        const response = await fetch(
            `${API_URL}/${encodeURIComponent(complaintId)}/status?status=${encodeURIComponent(newStatus)}`,
            {
                method: "PUT"
            }
        );

        if (!response.ok) {
            throw new Error("Status update failed");
        }

        if (complaint) {
            complaint.status = newStatus;
        }

        select.className = "status-select";

        if (newStatus === "Pending") {
            select.classList.add("pending-status");
        } else if (newStatus === "In Progress") {
            select.classList.add("progress-status");
        } else if (newStatus === "Resolved") {
            select.classList.add("resolved-status");
        }

        updateStatistics();
        applyFilters();

        alert(`Complaint CF-${complaintId} status changed to ${newStatus}`);

    } catch (error) {

        console.error("Status update error:", error);

        select.value = oldStatus;

        alert("Status database mein update nahi ho paaya.");

    } finally {

        select.disabled = false;

    }

}


/* ==========================================
   CHANGE PRIORITY
========================================== */

async function changePriority(select, complaintId) {

    const newPriority = select.value;

    const complaint = allComplaints.find(
        item => String(item.id) === String(complaintId)
    );

    const oldPriority = complaint?.priority || "Medium";

    select.disabled = true;

    try {

        const response = await fetch(
            `${API_URL}/${encodeURIComponent(complaintId)}/priority?priority=${encodeURIComponent(newPriority)}`,
            {
                method: "PUT"
            }
        );

        if (!response.ok) {
            throw new Error("Priority update failed");
        }

        if (complaint) {
            complaint.priority = newPriority;
        }

        select.className = "priority-select " + newPriority.toLowerCase();

        applyFilters();

        alert(`Complaint CF-${complaintId} priority changed to ${newPriority}`);

    } catch (error) {

        console.error("Priority update error:", error);

        select.value = oldPriority;

        alert("Priority database mein update nahi ho paayi.");

    } finally {

        select.disabled = false;

    }

}


/* ==========================================
   VIEW COMPLAINT DETAILS AND PHOTO
========================================== */

async function viewComplaint(id) {

    try {

        let complaint = allComplaints.find(
            item => String(item.id) === String(id)
        );

        if (!complaint) {

            await loadComplaints();

            complaint = allComplaints.find(
                item => String(item.id) === String(id)
            );

        }

        if (!complaint) {
            alert("Complaint details not found.");
            return;
        }

        const modal = document.getElementById("complaintModal");
        const details = document.getElementById("complaintDetails");

        if (!modal || !details) return;

        const imagePath = complaint.imagePath || "";

        const validImagePath =
            /^\/uploads\/[A-Za-z0-9._-]+$/.test(imagePath);

        const imageHTML = validImagePath
            ? `
                <div class="complaint-image-section">

                    <h3>
                        <i class="fa-solid fa-image"></i>
                        Complaint Evidence Photo
                    </h3>

                    <a href="${IMAGE_BASE_URL}${encodeURI(imagePath)}"
                       target="_blank"
                       rel="noopener noreferrer">

                        <img
                            src="${IMAGE_BASE_URL}${encodeURI(imagePath)}"
                            alt="Complaint evidence"
                            class="complaint-evidence-image">

                    </a>

                    <p>Click image to view full size.</p>

                </div>
            `
            : `
                <div class="complaint-image-section">
                    <h3>Complaint Evidence Photo</h3>
                    <p class="no-complaint-image">
                        No image attached to this complaint.
                    </p>
                </div>
            `;

        details.innerHTML = `

            <div class="detail-row">
                <span>Complaint ID</span>
                <strong>CF-${escapeHTML(complaint.id)}</strong>
            </div>

            <div class="detail-row">
                <span>Student Email</span>
                <strong>${escapeHTML(complaint.studentEmail)}</strong>
            </div>

            <div class="detail-row">
                <span>Issue</span>
                <strong>${escapeHTML(complaint.title)}</strong>
            </div>

            <div class="detail-row">
                <span>Category</span>
                <strong>${escapeHTML(complaint.category)}</strong>
            </div>

            <div class="detail-row">
                <span>Location</span>
                <strong>${escapeHTML(complaint.location)}</strong>
            </div>

            <div class="detail-row">
                <span>Status</span>
                <strong>${escapeHTML(complaint.status)}</strong>
            </div>

            <div class="detail-row">
                <span>Priority</span>
                <strong>${escapeHTML(complaint.priority || "Medium")}</strong>
            </div>

            <div class="detail-row">
                <span>Description</span>
                <strong>${escapeHTML(complaint.description)}</strong>
            </div>

            <div class="detail-row">
                <span>Date</span>
                <strong>
                    ${complaint.createdAt
                        ? escapeHTML(new Date(complaint.createdAt).toLocaleString())
                        : "Not available"}
                </strong>
            </div>

            ${imageHTML}

        `;

        modal.style.display = "flex";

    } catch (error) {

        console.error("Error viewing complaint:", error);

        alert("Complaint details load nahi ho pa rahi.");

    }

}


/* ==========================================
   CLOSE MODAL
========================================== */

function closeModal() {

    const modal = document.getElementById("complaintModal");

    if (modal) {
        modal.style.display = "none";
    }

}


window.addEventListener("click", event => {

    const modal = document.getElementById("complaintModal");

    if (modal && event.target === modal) {
        closeModal();
    }

});


document.addEventListener("keydown", event => {

    if (event.key === "Escape") {
        closeModal();
    }

});


/* ==========================================
   NOTIFICATION PREFERENCES
========================================== */

function initializeNotifications() {

    const checkbox = document.getElementById("adminNotifications");

    if (!checkbox) return;

    const savedPreference = localStorage.getItem(
        "campusfixNotifications"
    );

    checkbox.checked = savedPreference !== "false";

    checkbox.addEventListener("change", () => {

        localStorage.setItem(
            "campusfixNotifications",
            String(checkbox.checked)
        );

        alert(
            checkbox.checked
                ? "Admin notifications enabled."
                : "Admin notifications disabled."
        );

    });

}


/* ==========================================
   SHOW NOTIFICATIONS
========================================== */

function showNotifications() {

    const notificationsEnabled =
        localStorage.getItem("campusfixNotifications") !== "false";

    if (!notificationsEnabled) {
        alert("Admin notifications are currently disabled.");
        return;
    }

    const pending = allComplaints.filter(
        complaint => complaint.status === "Pending"
    ).length;

    alert(
        `You have ${pending} pending complaints that need attention.`
    );

}


/* ==========================================
   EXPORT COMPLAINTS TO CSV
========================================== */

function exportComplaints() {

    const visibleRows = document.querySelectorAll(
        "#complaintsTable tr[data-complaint-id]"
    );

    const visibleIds = new Set();

    visibleRows.forEach(row => {

        if (row.style.display !== "none") {
            visibleIds.add(row.dataset.complaintId);
        }

    });

    const filteredComplaints = allComplaints.filter(
        complaint => visibleIds.has(String(complaint.id))
    );

    if (filteredComplaints.length === 0) {
        alert("Export karne ke liye koi complaint available nahi hai.");
        return;
    }

    let csvContent =
        "Complaint ID,Student Email,Issue,Category,Location,Priority,Status,Date,Image Path\n";

    filteredComplaints.forEach(complaint => {

        const values = [

            `CF-${complaint.id}`,
            complaint.studentEmail,
            complaint.title,
            complaint.category,
            complaint.location,
            complaint.priority,
            complaint.status,
            complaint.createdAt,
            complaint.imagePath

        ];

        const csvRow = values.map(value =>
            `"${String(value ?? "").replace(/"/g, '""')}"`
        );

        csvContent += csvRow.join(",") + "\n";

    });

    const blob = new Blob(
        [csvContent],
        { type: "text/csv;charset=utf-8;" }
    );

    const url = URL.createObjectURL(blob);

    const link = document.createElement("a");

    link.href = url;
    link.download = "campusfix-complaints.csv";

    document.body.appendChild(link);

    link.click();

    document.body.removeChild(link);

    URL.revokeObjectURL(url);

}


/* ==========================================
   DELETE COMPLAINT
========================================== */

async function deleteComplaint(complaintId) {

    const confirmDelete = confirm(
        "Kya aap is complaint ko permanently delete karna chahte hain?"
    );

    if (!confirmDelete) return;

    try {

        const response = await fetch(
            `${API_URL}/${encodeURIComponent(complaintId)}`,
            {
                method: "DELETE"
            }
        );

        if (!response.ok) {
            throw new Error("Complaint delete failed");
        }

        alert("Complaint successfully delete ho gayi.");

        await loadComplaints();

    } catch (error) {

        console.error("Delete complaint error:", error);

        alert("Complaint delete nahi ho paayi.");

    }

}


/* ==========================================
   APPEARANCE SETTINGS
========================================== */

function initializeAppearance() {

    const themeMode = document.getElementById("themeMode");
    const layoutMode = document.getElementById("layoutMode");

    const colorButtons = document.querySelectorAll(".theme-color");

    const resetButton = document.getElementById("resetAppearance");

    const message = document.getElementById("appearanceMessage");

    if (!themeMode || !layoutMode) return;

    const defaultSettings = {
        mode: "light",
        layout: "comfortable",
        color: "blue"
    };

    function getSettings() {

        try {

            const saved = JSON.parse(
                localStorage.getItem("campusfixAppearance")
            );

            return {

                mode: ["light", "dark"].includes(saved?.mode)
                    ? saved.mode
                    : defaultSettings.mode,

                layout: ["compact", "comfortable"].includes(saved?.layout)
                    ? saved.layout
                    : defaultSettings.layout,

                color: ["blue", "purple", "green", "orange"].includes(saved?.color)
                    ? saved.color
                    : defaultSettings.color

            };

        } catch (error) {

            return { ...defaultSettings };

        }

    }

    function saveSettings(settings) {

        localStorage.setItem(
            "campusfixAppearance",
            JSON.stringify(settings)
        );

    }

    function applySettings(settings) {

        document.body.classList.toggle(
            "dark-mode",
            settings.mode === "dark"
        );

        document.body.classList.toggle(
            "compact-layout",
            settings.layout === "compact"
        );

        document.body.dataset.color = settings.color;

        themeMode.value = settings.mode;
        layoutMode.value = settings.layout;

        colorButtons.forEach(button => {

            const active = button.dataset.color === settings.color;

            button.classList.toggle("active", active);

            button.setAttribute(
                "aria-pressed",
                String(active)
            );

        });

    }

    function updateSettings() {

        const currentSettings = getSettings();

        const settings = {

            mode: themeMode.value,
            layout: layoutMode.value,
            color: currentSettings.color

        };

        applySettings(settings);
        saveSettings(settings);

        if (message) {
            message.textContent = "Preferences saved successfully.";
        }

    }

    const savedSettings = getSettings();

    applySettings(savedSettings);

    themeMode.addEventListener("change", updateSettings);
    layoutMode.addEventListener("change", updateSettings);

    colorButtons.forEach(button => {

        button.addEventListener("click", () => {

            const settings = getSettings();

            const selectedColor = button.dataset.color;

            if (!["blue", "purple", "green", "orange"].includes(selectedColor)) {
                return;
            }

            settings.color = selectedColor;

            applySettings(settings);
            saveSettings(settings);

            if (message) {
                message.textContent =
                    selectedColor.toUpperCase() +
                    " theme applied successfully.";
            }

        });

    });

    if (resetButton) {

        resetButton.addEventListener("click", () => {

            const settings = { ...defaultSettings };

            applySettings(settings);
            saveSettings(settings);

            if (message) {
                message.textContent = "Appearance reset to default.";
            }

        });

    }

}


/* ==========================================
   CHANGE PASSWORD FORM
========================================== */

function handlePasswordForm(event) {

    event.preventDefault();

    const currentPassword =
        document.getElementById("currentPassword")?.value || "";

    const newPassword =
        document.getElementById("newPassword")?.value || "";

    const confirmPassword =
        document.getElementById("confirmPassword")?.value || "";

    if (!currentPassword || !newPassword || !confirmPassword) {
        alert("Please fill all password fields.");
        return;
    }

    if (newPassword.length < 8) {
        alert("New password must contain at least 8 characters.");
        return;
    }

    if (newPassword !== confirmPassword) {
        alert("New password and confirm password do not match.");
        return;
    }

    if (currentPassword === newPassword) {
        alert("New password must be different from current password.");
        return;
    }

    alert(
        "Password change API abhi backend se connect nahi hui hai. Password update nahi hua."
    );

}


/* ==========================================
   ADMIN LOGOUT
========================================== */

async function adminLogout() {

    const confirmLogout = confirm(
        "Are you sure you want to logout?"
    );

    if (!confirmLogout) return;

    try {

        await fetch(
            "http://127.0.0.1:8080/api/students/logout",
            {
                method: "POST",
                credentials: "include"
            }
        );

    } catch (error) {

        console.error("Logout request error:", error);

    }

    localStorage.removeItem("studentId");
    localStorage.removeItem("studentName");
    localStorage.removeItem("studentEmail");

    window.location.href = "login.html";

}
