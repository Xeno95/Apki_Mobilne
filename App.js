document.addEventListener("DOMContentLoaded", () => {
    const out = document.getElementById("geo");
    if (!("geolocation" in navigator)) {
        out.textContent = "Błąd: przeglądarka nie obsługuje geolokalizacji.";
        return;
    }

    navigator.geolocation.getCurrentPosition(
        (p) => {
            const { latitude, longitude, accuracy } = p.coords;
            out.textContent =
                `Szerokość: ${latitude.toFixed(6)}°, ` +
                `Dł.: ${longitude.toFixed(6)}° ` +
                `(±${Math.round(accuracy)} m)`;
        },
        (e) => {
            out.textContent = `Błąd: ${e.message}`;
        },
        { enableHighAccuracy: true, timeout: 10000, maximumAge: 0 }
    );
});
