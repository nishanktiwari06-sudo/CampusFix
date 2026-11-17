
const API_URL = "http://127.0.0.1:8080/api/complaints";

let allComplaints = [];
let currentFilter = "all";

document.addEventListener("DOMContentLoaded", () => {
    const studentEmail = localStorage.getItem("studentEmail");

    if (!studentEmail) {
        window.location.href = "login.html";
        return;
    }

    loadStudentDetails();
    loadMyComplaints(studentEmail);
    setupFilters();
    setupModal();
    setupMobileMenu();
});

// STUDENT DETAILS
function loadStudentDetails() {
    const name = localStorage.getItem("studentName") || "Student";

    const nameElement = document.getElementById("loggedInStudentName");
    const avatarElement = document.getElementById("loggedInStudentAvatar");

    if (nameElement) nameElement.textContent = name;

    if (avatarElement) {
        avatarElement.textContent = name
            .split(" ")
            .filter(Boolean)
            .map(word => word[0])
            .join("")
            .substring(0, 2)
            .toUpperCase();
    }
}

// LOAD STUDENT COMPLAINTS
async function loadMyComplaints(email) {
    const list = document.getElementById("complaintsList");

    list.innerHTML = "<p class='loading-message'>Loading complaints...</p>";

    try {
        const response = await fetch(
            `${API_URL}/student/${encodeURIComponent(email)}`,
            { credentials: "include" }
        );

        if (!response.ok) {
            throw new Error(`Server error: ${response.status}`);
        }

        const data = await response.json();

        if (!Array.isArray(data)) {
            throw new Error("Invalid complaints response");
        }

        allComplaints = data;

        updateSummary();
        renderComplaints();

    } catch (error) {
        console.error("Complaint loading error:", error);
        list.innerHTML = `
            <p class="error-message">
                Unable to load complaints. Please refresh the page.
            </p>
        `;
        document.getElementById("noResults").style.display = "none";
    }
}

// NORMALIZE STATUS
function normalizeStatus(status) {
    const value = String(status || "Pending").trim().toLowerCase();

    if (value === "resolved") return "resolved";

    if (value === "in progress" || value === "in process") {
        return "progress";
    }

    return "pending";
}

// SUMMARY CARDS
function updateSummary() {
    document.getElementById("myTotalComplaints").textContent =
        allComplaints.length;

    document.getElementById("myPendingComplaints").textContent =
        allComplaints.filter(c => normalizeStatus(c.status) === "pending").length;

    document.getElementById("myProgressComplaints").textContent =
        allComplaints.filter(c => normalizeStatus(c.status) === "progress").length;

    document.getElementById("myResolvedComplaints").textContent =
        allComplaints.filter(c => normalizeStatus(c.status) === "resolved").length;
}

// RENDER COMPLAINT CARDS
function renderComplaints() {
    const list = document.getElementById("complaintsList");
    const noResults = document.getElementById("noResults");
    const searchText = document.getElementById("searchInput").value
        .trim()
        .toLowerCase();

    const filtered = allComplaints.filter(complaint => {
        const searchableText = [
            complaint.title,
            complaint.category,
            complaint.location,
            complaint.description
        ].join(" ").toLowerCase();

        const matchesSearch = searchableText.includes(searchText);
        const status = normalizeStatus(complaint.status);

        const matchesFilter =
            currentFilter === "all" || currentFilter === status;

        return matchesSearch && matchesFilter;
    });

    list.innerHTML = "";

    if (filtered.length === 0) {
        noResults.style.display = "block";
        return;
    }

    noResults.style.display = "none";

    filtered.forEach(complaint => {
        const status = normalizeStatus(complaint.status);

        const statusLabels = {
            pending: "Pending",
            progress: "In Progress",
            resolved: "Resolved"
        };

        const statusClasses = {
            pending: "pending-status",
            progress: "in-progress-status",
            resolved: "resolved-status"
        };

        const card = document.createElement("article");
        card.className = "complaint-card";

        card.innerHTML = `
            <div class="complaint-card-header">
                <h3>${escapeHTML(complaint.title || "Untitled Complaint")}</h3>
                <span class="status ${statusClasses[status]}">
                    ${statusLabels[status]}
                </span>
            </div>

            <p><strong>Category:</strong> ${escapeHTML(complaint.category || "-")}</p>
            <p><strong>Location:</strong> ${escapeHTML(complaint.location || "-")}</p>
            <p><strong>Priority:</strong> ${escapeHTML(complaint.priority || "-")}</p>
            <p><strong>Submitted:</strong> ${formatDate(complaint.createdAt)}</p>

            <button class="view-details-btn" type="button">
                <i class="fa-solid fa-eye"></i> View Details
            </button>
        `;

        card.querySelector(".view-details-btn").addEventListener("click", () => {
            showComplaintDetails(complaint);
        });

        list.appendChild(card);
    });
}

// SEARCH AND FILTERS
function setupFilters() {
    document.getElementById("searchInput").addEventListener("input", renderComplaints);

    document.querySelectorAll(".filter-btn").forEach(button => {
        button.addEventListener("click", () => {
            document.querySelectorAll(".filter-btn").forEach(btn => {
                btn.classList.remove("active");
            });

            button.classList.add("active");
            currentFilter = button.dataset.filter;

            renderComplaints();
        });
    });
}

// SHOW COMPLAINT DETAILS
function showComplaintDetails(complaint) {
    document.getElementById("modalTitle").textContent =
        complaint.title || "Complaint Details";

    document.getElementById("modalId").textContent =
        "Complaint ID: #" + (complaint.id ?? "-");

    document.getElementById("modalCategory").textContent =
        complaint.category || "-";

    document.getElementById("modalLocation").textContent =
        complaint.location || "-";

    document.getElementById("modalPriority").textContent =
        complaint.priority || "-";

    document.getElementById("modalDescription").textContent =
        complaint.description || "-";

    const status = normalizeStatus(complaint.status);

    const stageIndex = {
        pending: 0,
        progress: 1,
        resolved: 2
    }[status];

    // STATUS BADGE
    const statusElement = document.getElementById("modalStatus");

    const labels = ["Pending", "In Process", "Resolved"];
    const classes = [
        "pending-status",
        "in-progress-status",
        "resolved-status"
    ];

    statusElement.textContent = labels[stageIndex];
    statusElement.className = "status " + classes[stageIndex];

    // SUBMISSION DATE
    document.getElementById("modalDate").textContent =
        "Submitted: " + formatDate(complaint.createdAt);

    // TIMELINE STAGES
    const stages = [
        document.getElementById("stagePending"),
        document.getElementById("stageProgress"),
        document.getElementById("stageResolved")
    ];

    const lines = [
        document.getElementById("linePending"),
        document.getElementById("lineProgress")
    ];

    stages.forEach((stage, index) => {
        stage.classList.remove("active", "completed");

        const icon = stage.querySelector(".timeline-dot i");

        if (index < stageIndex) {
            stage.classList.add("completed");
            icon.className = "fa-solid fa-check";
        } else if (index === stageIndex) {
            stage.classList.add("active");
        } else {
            const icons = [
                "fa-solid fa-clock",
                "fa-solid fa-spinner",
                "fa-solid fa-circle-check"
            ];
            icon.className = icons[index];
        }
    });

    lines.forEach((line, index) => {
        line.classList.toggle("completed", index < stageIndex);
    });

    document.getElementById("detailsModal").classList.add("active");
}

// MODAL CLOSE
function setupModal() {
    const modal = document.getElementById("detailsModal");
    const closeButton = document.getElementById("modalClose");

    closeButton.addEventListener("click", () => {
        modal.classList.remove("active");
    });

    modal.addEventListener("click", event => {
        if (event.target === modal) {
            modal.classList.remove("active");
        }
    });

    document.addEventListener("keydown", event => {
        if (event.key === "Escape") {
            modal.classList.remove("active");
        }
    });
}

// MOBILE MENU
function setupMobileMenu() {
    const menuBtn = document.getElementById("menuBtn");
    const sidebar = document.getElementById("sidebar");

    if (!menuBtn || !sidebar) return;

    menuBtn.addEventListener("click", () => {
        const isOpen = sidebar.classList.toggle("open");
        menuBtn.setAttribute("aria-expanded", String(isOpen));
    });

    document.addEventListener("click", event => {
        if (
            sidebar.classList.contains("open") &&
            !sidebar.contains(event.target) &&
            !menuBtn.contains(event.target)
        ) {
            sidebar.classList.remove("open");
            menuBtn.setAttribute("aria-expanded", "false");
        }
    });

    sidebar.querySelectorAll(".sidebar-link").forEach(link => {
        link.addEventListener("click", () => {
            sidebar.classList.remove("open");
            menuBtn.setAttribute("aria-expanded", "false");
        });
    });
}

// DATE FORMAT
function formatDate(value) {
    if (!value) return "-";

    const date = new Date(value);

    if (Number.isNaN(date.getTime())) return "-";

    return date.toLocaleDateString("en-IN", {
        day: "2-digit",
        month: "short",
        year: "numeric"
    });
}

// SAFE HTML TEXT
function escapeHTML(value) {
    return String(value).replace(/[&<>"']/g, char => ({
        "&": "&amp;",
        "<": "&lt;",
        ">": "&gt;",
        '"': "&quot;",
        "'": "&#39;"
    })[char]);
}
