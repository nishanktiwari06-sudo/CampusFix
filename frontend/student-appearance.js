
(function () {
    function applyStudentAppearance() {
        let settings = {};

        try {
            settings = JSON.parse(
                localStorage.getItem("campusfixAppearance")
            ) || {};
        } catch (error) {
            settings = {};
        }

        const mode = settings.mode || "light";
        const layout = settings.layout || "comfortable";
        const color = settings.color || "blue";

        document.body.classList.toggle(
            "dark-mode",
            mode === "dark"
        );

        document.body.classList.toggle(
            "compact-layout",
            layout === "compact"
        );

        document.body.dataset.color = color;

        document.documentElement.dataset.theme = mode;
        document.documentElement.dataset.layout = layout;
        document.documentElement.dataset.color = color;
    }

    if (document.readyState === "loading") {
        document.addEventListener(
            "DOMContentLoaded",
            applyStudentAppearance
        );
    } else {
        applyStudentAppearance();
    }
})();
