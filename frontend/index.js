
/* =========================================================
   CAMPUSFIX - ADVANCED MAIN JAVASCRIPT
   Database Powered Homepage
   Updated Report Issue Navigation
========================================================= */

document.addEventListener("DOMContentLoaded", () => {

    /* =====================================================
       CONFIGURATION
    ===================================================== */

    const API_URL = "http://localhost:8080/api/home/statistics";
    const LOGIN_PAGE = "login.html";


    /* =====================================================
       HELPER FUNCTIONS
    ===================================================== */

    function setText(id, value) {
        const element = document.getElementById(id);

        if (element) {
            element.textContent = value ?? 0;
        }
    }


    /* =====================================================
       REPORT ISSUE BUTTONS
       Always redirect to Login Page
    ===================================================== */

    function protectReportButtons() {

        const reportButtons = document.querySelectorAll(
            "#reportIssueBtn, #reportIssueCtaBtn"
        );

        reportButtons.forEach(button => {

            button.addEventListener("click", event => {

                event.preventDefault();

                window.location.href = LOGIN_PAGE;

            });

        });

    }


    /* =====================================================
       LOAD HOMEPAGE STATISTICS
    ===================================================== */

    async function loadHomepageData() {

        const container = document.getElementById("latestComplaints");

        try {

            const response = await fetch(API_URL, {
                method: "GET",
                headers: {
                    "Accept": "application/json"
                },
                cache: "no-store"
            });

            if (!response.ok) {
                throw new Error("API Error: " + response.status);
            }

            const data = await response.json();

            console.log("CampusFix API Data:", data);

            updateStatistics(data);

            renderLatestComplaints(
                Array.isArray(data.latestComplaints)
                    ? data.latestComplaints
                    : [],
                container
            );

        } catch (error) {

            console.error("Homepage API Error:", error);

            showStatisticsError();

            if (container) {

                container.replaceChildren();

                const message = document.createElement("p");

                message.className = "homepage-error";

                message.textContent =
                    "Unable to load latest complaints. Please try again later.";

                container.appendChild(message);

            }

        }

    }


    /* =====================================================
       UPDATE STATISTICS
    ===================================================== */

    function updateStatistics(data) {

        const students = Number(data.totalStudents) || 0;
        const total = Number(data.totalComplaints) || 0;
        const resolved = Number(data.resolvedComplaints) || 0;
        const pending = Number(data.pendingComplaints) || 0;

        const resolutionRate = total > 0
            ? Math.round((resolved / total) * 100)
            : 0;

        // Main Statistics

        setText("totalStudentsStat", students);
        setText("totalComplaintsStat", total);
        setText("resolvedComplaintsStat", resolved);

        // Hero Statistics

        setText("heroTotalComplaints", total);
        setText("heroPendingComplaints", pending);
        setText("heroResolutionRate", resolutionRate + "%");

    }


    /* =====================================================
       STATISTICS ERROR HANDLING
    ===================================================== */

    function showStatisticsError() {

        const ids = [
            "totalStudentsStat",
            "totalComplaintsStat",
            "resolvedComplaintsStat",
            "heroTotalComplaints",
            "heroPendingComplaints",
            "heroResolutionRate"
        ];

        ids.forEach(id => setText(id, "—"));

    }


    /* =====================================================
       RENDER LATEST COMPLAINTS
    ===================================================== */

    function renderLatestComplaints(complaints, container) {

        if (!container) return;

        container.replaceChildren();

        if (complaints.length === 0) {

            const empty = document.createElement("div");

            empty.className = "issue-card";

            const message = document.createElement("p");

            message.textContent = "No complaints reported yet.";

            empty.appendChild(message);

            container.appendChild(empty);

            return;
        }

        complaints.slice(0, 3).forEach(complaint => {

            const card = document.createElement("div");

            card.className = "issue-card";


            // Category Icon

            const iconBox = document.createElement("div");

            iconBox.className =
                "issue-icon " + getCategoryClass(complaint.category);

            const icon = document.createElement("i");

            icon.className = getCategoryIcon(complaint.category);

            iconBox.appendChild(icon);


            // Complaint Details

            const details = document.createElement("div");

            details.className = "issue-details";

            const title = document.createElement("h4");

            title.textContent =
                complaint.title ||
                complaint.category ||
                "Campus Issue";

            const location = document.createElement("p");

            location.textContent = [
                complaint.category,
                complaint.location
            ].filter(Boolean).join(" • ") ||
                "Campus location not specified";

            details.append(title, location);


            // Complaint Status

            const status = document.createElement("span");

            const statusText =
                String(complaint.status || "Pending").trim();

            const normalizedStatus = statusText.toLowerCase();

            if (
                normalizedStatus === "resolved" ||
                normalizedStatus === "fixed"
            ) {

                status.className = "resolved";

                status.textContent = "Resolved";

            } else if (normalizedStatus === "in progress") {

                status.className = "progress";

                status.textContent = "In Progress";

            } else {

                status.className = "pending";

                status.textContent = statusText;

            }

            card.append(iconBox, details, status);

            container.appendChild(card);

        });

    }


    /* =====================================================
       CATEGORY ICON CLASS
    ===================================================== */

    function getCategoryClass(category = "") {

        const value = String(category).toLowerCase();

        if (value.includes("electric")) return "electrical";

        if (value.includes("water")) return "water";

        return "maintenance";

    }


    /* =====================================================
       CATEGORY ICONS
    ===================================================== */

    function getCategoryIcon(category = "") {

        const value = String(category).toLowerCase();

        if (value.includes("electric")) {
            return "fa-solid fa-lightbulb";
        }

        if (value.includes("water")) {
            return "fa-solid fa-droplet";
        }

        if (value.includes("internet") || value.includes("wifi")) {
            return "fa-solid fa-wifi";
        }

        if (value.includes("clean")) {
            return "fa-solid fa-broom";
        }

        if (value.includes("security")) {
            return "fa-solid fa-shield-halved";
        }

        if (value.includes("furniture")) {
            return "fa-solid fa-chair";
        }

        return "fa-solid fa-wrench";

    }


    /* =====================================================
       NAVBAR ACTIVE LINK
    ===================================================== */

    const navLinks = document.querySelectorAll(".navbar nav a");

    navLinks.forEach(link => {

        link.addEventListener("click", function () {

            navLinks.forEach(item => {
                item.classList.remove("active");
            });

            this.classList.add("active");

        });

    });


    /* =====================================================
       SCROLL ACTIVE NAVIGATION
    ===================================================== */

    const sections = document.querySelectorAll("section[id]");

    window.addEventListener("scroll", () => {

        let currentSection = "";

        sections.forEach(section => {

            const sectionTop = section.offsetTop - 150;

            const sectionHeight = section.offsetHeight;

            if (
                window.scrollY >= sectionTop &&
                window.scrollY < sectionTop + sectionHeight
            ) {

                currentSection = section.getAttribute("id");

            }

        });

        navLinks.forEach(link => {

            link.classList.remove("active");

            if (
                link.getAttribute("href") === "#" + currentSection
            ) {

                link.classList.add("active");

            }

        });

    });


    /* =====================================================
       SMOOTH SCROLL
    ===================================================== */

    document.querySelectorAll('a[href^="#"]').forEach(anchor => {

        anchor.addEventListener("click", function (event) {

            const targetId = this.getAttribute("href");

            if (
                this.id === "reportIssueBtn" ||
                this.id === "reportIssueCtaBtn"
            ) {
                return;
            }

            if (targetId === "#") return;

            const target = document.querySelector(targetId);

            if (target) {

                event.preventDefault();

                target.scrollIntoView({
                    behavior: "smooth",
                    block: "start"
                });

            }

        });

    });


    /* =====================================================
       SCROLL REVEAL ANIMATION
    ===================================================== */

    const revealElements = document.querySelectorAll(
        ".about-card, .feature-card, .step, .stat-box, .hero-card"
    );

    if ("IntersectionObserver" in window) {

        const revealObserver = new IntersectionObserver(
            (entries, observer) => {

                entries.forEach(entry => {

                    if (entry.isIntersecting) {

                        entry.target.classList.add("show");

                        observer.unobserve(entry.target);

                    }

                });

            },
            {
                threshold: 0.15
            }
        );

        revealElements.forEach(element => {

            element.classList.add("reveal");

            revealObserver.observe(element);

        });

    } else {

        revealElements.forEach(element => {
            element.classList.add("show");
        });

    }


    /* =====================================================
       BUTTON CLICK EFFECT
    ===================================================== */

    const buttons = document.querySelectorAll(
        ".primary-btn, .secondary-btn, .register-btn, .login-btn, .cta-button"
    );

    buttons.forEach(button => {

        button.addEventListener("click", function () {

            this.style.transform = "scale(0.97)";

            setTimeout(() => {
                this.style.transform = "";
            }, 120);

        });

    });


    /* =====================================================
       INITIALIZE HOMEPAGE
    ===================================================== */

    protectReportButtons();

    loadHomepageData();

    console.log("CampusFix - Advanced JavaScript Connected");

});
