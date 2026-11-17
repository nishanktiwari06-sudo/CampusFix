
// ============================================
// CAMPUSFIX STUDENT DASHBOARD
// COMPLETE UPGRADED JAVASCRIPT
// ============================================

"use strict";

const API_BASE_URL = "http://127.0.0.1:8080";


// ============================================
// INITIALIZE DASHBOARD
// ============================================

document.addEventListener("DOMContentLoaded", () => {

    loadStudentDetails();

    loadDashboardData();

    initializeMobileSidebar();

    initializeNavigation();

    initializeLogout();

});


// ============================================
// STUDENT DETAILS
// ============================================

function loadStudentDetails() {

    const studentName =
        localStorage.getItem("studentName") || "Student";

    const nameElement =
        document.getElementById("studentName");

    const profileName =
        document.querySelector(".user-info strong");

    const avatar =
        document.querySelector(".user-avatar");

    if (nameElement) {
        nameElement.textContent = studentName;
    }

    if (profileName) {
        profileName.textContent = studentName;
    }

    if (avatar) {
        avatar.textContent = getInitials(studentName);
    }

}


// ============================================
// GET STUDENT INITIALS
// ============================================

function getInitials(name) {

    return String(name || "Student")
        .trim()
        .split(/\s+/)
        .filter(Boolean)
        .map(word => word.charAt(0))
        .join("")
        .substring(0, 2)
        .toUpperCase();

}


// ============================================
// NAVIGATION
// ============================================

function initializeNavigation() {

    const sidebar = document.getElementById("sidebar");

    const menuBtn = document.getElementById("menuBtn");

    // Normal anchor navigation is preserved.
    // Do not preventDefault() for page links.

    document.querySelectorAll(
        "#sidebar a.sidebar-link, .quick-link, .view-all, .banner-btn, .user-profile"
    ).forEach(link => {

        link.addEventListener("click", function () {

            const target = this.getAttribute("href");

            if (!target || target === "#") {
                return;
            }

            // Close mobile sidebar before leaving page.
            if (sidebar) {
                sidebar.classList.remove("open");
            }

            if (menuBtn) {
                menuBtn.setAttribute("aria-expanded", "false");
            }

        });

    });

}


// ============================================
// LOAD DASHBOARD DATA
// ============================================

async function loadDashboardData() {

    const studentEmail =
        localStorage.getItem("studentEmail");

    if (!studentEmail) {

        showDashboardError(
            "Student login details not found."
        );

        return;
    }

    try {

        const response = await fetch(
            `${API_BASE_URL}/api/complaints/student/${encodeURIComponent(studentEmail)}`
        );

        if (!response.ok) {
            throw new Error("Unable to fetch complaints.");
        }

        const complaints = await response.json();

        if (!Array.isArray(complaints)) {
            throw new Error("Invalid complaints data received.");
        }

        updateDashboardStatistics(complaints);

        loadRecentComplaints(complaints);

    }

    catch (error) {

        console.error("Dashboard loading error:", error);

        showDashboardError(
            "Unable to load dashboard data. Please refresh the page."
        );

    }

}


// ============================================
// UPDATE DASHBOARD STATISTICS
// ============================================

function updateDashboardStatistics(complaints) {

    let total = complaints.length;

    let pending = 0;

    let progress = 0;

    let resolved = 0;

    complaints.forEach(complaint => {

        const status = normalizeStatus(complaint.status);

        if (status === "pending") {

            pending++;

        }

        else if (status === "in progress") {

            progress++;

        }

        else if (status === "resolved") {

            resolved++;

        }

    });

    updateCounter("totalComplaints", total);

    updateCounter("pendingComplaints", pending);

    updateCounter("progressComplaints", progress);

    updateCounter("resolvedComplaints", resolved);

}


// ============================================
// UPDATE COUNTER
// ============================================

function updateCounter(elementId, value) {

    const element = document.getElementById(elementId);

    if (element) {

        element.textContent = value;

    }

}


// ============================================
// NORMALIZE STATUS
// ============================================

function normalizeStatus(status) {

    return String(status || "Pending")
        .trim()
        .toLowerCase()
        .replace(/[-_]/g, " ");

}


// ============================================
// FORMAT COMPLAINT DATE
// ============================================

function formatComplaintDate(dateValue) {

    if (!dateValue) {

        return "Date not available";

    }

    const date = new Date(dateValue);

    if (isNaN(date.getTime())) {

        return "Date not available";

    }

    return date.toLocaleDateString("en-IN", {

        day: "2-digit",

        month: "short",

        year: "numeric"

    });

}


// ============================================
// GET STATUS CLASS
// ============================================

function getStatusClass(status) {

    const normalizedStatus = normalizeStatus(status);

    if (normalizedStatus === "resolved") {

        return "resolved-status";

    }

    if (normalizedStatus === "in progress") {

        return "progress-status";

    }

    return "pending-status";

}


// ============================================
// GET DISPLAY STATUS
// ============================================

function getDisplayStatus(status) {

    const normalizedStatus = normalizeStatus(status);

    if (normalizedStatus === "in progress") {

        return "In Progress";

    }

    if (normalizedStatus === "resolved") {

        return "Resolved";

    }

    return "Pending";

}


// ============================================
// LOAD RECENT COMPLAINTS
// ============================================

function loadRecentComplaints(complaints) {

    const tableBody =
        document.getElementById("recentComplaintsTable");

    if (!tableBody) {
        return;
    }

    tableBody.replaceChildren();

    if (!complaints || complaints.length === 0) {

        showTableMessage("No complaints found yet.");

        return;
    }

    // Sort latest complaints first.
    const recentComplaints = [...complaints]

        .sort((a, b) => {

            const dateA =
                new Date(a.createdAt || 0).getTime();

            const dateB =
                new Date(b.createdAt || 0).getTime();

            return dateB - dateA;

        })

        .slice(0, 3);


    recentComplaints.forEach(complaint => {

        const row = document.createElement("tr");


        // COMPLAINT TITLE AND LOCATION

        const complaintCell = document.createElement("td");

        const complaintName = document.createElement("div");

        complaintName.className = "complaint-name";

        const complaintDetails = document.createElement("div");

        const title = document.createElement("strong");

        title.textContent =
            complaint.title || "Untitled Complaint";

        const location = document.createElement("small");

        location.textContent =
            complaint.location || "Location not provided";

        complaintDetails.append(title, location);

        complaintName.appendChild(complaintDetails);

        complaintCell.appendChild(complaintName);


        // CATEGORY

        const categoryCell = document.createElement("td");

        categoryCell.textContent =
            complaint.category || "Other";


        // DATE

        const dateCell = document.createElement("td");

        dateCell.textContent =
            formatComplaintDate(complaint.createdAt);


        // STATUS

        const statusCell = document.createElement("td");

        const statusBadge = document.createElement("span");

        statusBadge.className =
            `status ${getStatusClass(complaint.status)}`;

        statusBadge.textContent =
            getDisplayStatus(complaint.status);

        statusCell.appendChild(statusBadge);


        // ACTION

        const actionCell = document.createElement("td");

        const viewLink = document.createElement("a");

        viewLink.href = "./my-complaints.html";

        viewLink.className = "view-btn";

        viewLink.setAttribute(
            "aria-label",
            "View complaints"
        );

        viewLink.title = "View My Complaints";

        const eyeIcon = document.createElement("i");

        eyeIcon.className = "fa-solid fa-eye";

        viewLink.appendChild(eyeIcon);

        actionCell.appendChild(viewLink);


        // ADD ALL CELLS

        row.append(

            complaintCell,

            categoryCell,

            dateCell,

            statusCell,

            actionCell

        );

        tableBody.appendChild(row);

    });

}


// ============================================
// TABLE MESSAGE
// ============================================

function showTableMessage(message) {

    const tableBody =
        document.getElementById("recentComplaintsTable");

    if (!tableBody) {
        return;
    }

    const row = document.createElement("tr");

    const cell = document.createElement("td");

    cell.colSpan = 5;

    cell.className = "loading-row";

    cell.textContent = message;

    row.appendChild(cell);

    tableBody.replaceChildren(row);

}


// ============================================
// DASHBOARD ERROR
// ============================================

function showDashboardError(message) {

    updateCounter("totalComplaints", 0);

    updateCounter("pendingComplaints", 0);

    updateCounter("progressComplaints", 0);

    updateCounter("resolvedComplaints", 0);

    showTableMessage(message);

}


// ============================================
// MOBILE SIDEBAR
// ============================================

function initializeMobileSidebar() {

    const menuBtn = document.getElementById("menuBtn");

    const sidebar = document.getElementById("sidebar");

    if (!menuBtn || !sidebar) {
        return;
    }

    menuBtn.setAttribute("aria-expanded", "false");


    // OPEN / CLOSE SIDEBAR

    menuBtn.addEventListener("click", event => {

        event.stopPropagation();

        sidebar.classList.toggle("open");

        const isOpen =
            sidebar.classList.contains("open");

        menuBtn.setAttribute(
            "aria-expanded",
            String(isOpen)
        );

    });


    // CLOSE ON OUTSIDE CLICK

    document.addEventListener("click", event => {

        const clickedInsideSidebar =
            sidebar.contains(event.target);

        const clickedMenuButton =
            menuBtn.contains(event.target);

        if (
            !clickedInsideSidebar &&
            !clickedMenuButton &&
            sidebar.classList.contains("open")
        ) {

            closeMobileSidebar();

        }

    });


    // CLOSE WITH ESCAPE KEY

    document.addEventListener("keydown", event => {

        if (event.key === "Escape") {

            closeMobileSidebar();

        }

    });

}


// ============================================
// CLOSE MOBILE SIDEBAR
// ============================================

function closeMobileSidebar() {

    const sidebar = document.getElementById("sidebar");

    const menuBtn = document.getElementById("menuBtn");

    if (sidebar) {

        sidebar.classList.remove("open");

    }

    if (menuBtn) {

        menuBtn.setAttribute("aria-expanded", "false");

    }

}


// ============================================
// LOGOUT
// ============================================

function initializeLogout() {

    const logoutBtn =
        document.getElementById("logoutBtn");

    if (!logoutBtn) {
        return;
    }

    logoutBtn.addEventListener("click", event => {

        event.preventDefault();

        localStorage.removeItem("studentId");

        localStorage.removeItem("studentName");

        localStorage.removeItem("studentEmail");

        window.location.href = "./login.html";

    });

}


// ============================================
// END OF DASHBOARD.JS
// ============================================
