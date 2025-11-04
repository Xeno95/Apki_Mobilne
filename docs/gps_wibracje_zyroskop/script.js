document.addEventListener("DOMContentLoaded", () => {
    // ——————————————————————————————————————————————————————————
    // INFO o bezpiecznym kontekście (HTTPS to must-have na Androidzie)
    // ——————————————————————————————————————————————————————————
    const secureInfo = document.getElementById("secure-info");
    const isSecure = window.isSecureContext || location.hostname === "localhost";
    if (!isSecure) {
        secureInfo.textContent = "Uwaga: bez HTTPS czujniki i geolokalizacja mogą nie działać.";
    } else {
        secureInfo.textContent = "";
    }

    // ——————————————————————————————————————————————————————————
    // GEOLOKALIZACJA — prosto: jednorazowy odczyt
    // ——————————————————————————————————————————————————————————
    const geoOut = document.getElementById("geo");
    if (!("geolocation" in navigator)) {
        geoOut.textContent = "Błąd: przeglądarka nie obsługuje geolokalizacji.";
    } else {
        navigator.geolocation.getCurrentPosition(
            (p) => {
                const { latitude, longitude, accuracy } = p.coords;
                geoOut.textContent =
                    `Szerokość: ${latitude.toFixed(6)}°, ` +
                    `Dł.: ${longitude.toFixed(6)}° ` +
                    `(±${Math.round(accuracy)} m)`;
            },
            (e) => {
                geoOut.textContent = `Błąd geolokalizacji: ${e.message}`;
            },
            { enableHighAccuracy: true, timeout: 10000, maximumAge: 0 }
        );
    }

    // ——————————————————————————————————————————————————————————
    // ŻYROSKOP / ORIENTACJA URZĄDZENIA
    // ——————————————————————————————————————————————————————————
    const btnGyro    = document.getElementById("enable-gyro");
    const gyroStatus = document.getElementById("gyro-status");
    const readouts   = document.getElementById("gyro-readouts");
    const alphaEl    = document.getElementById("alpha");
    const betaEl     = document.getElementById("beta");
    const gammaEl    = document.getElementById("gamma");

    function onOrient(ev) {
        // α: 0–360; β: -180–180; γ: -90–90
        if (ev.alpha == null && ev.beta == null && ev.gamma == null) {
            gyroStatus.textContent = "Brak danych z czujników.";
            return;
        }
        alphaEl.textContent = Number(ev.alpha).toFixed(1);
        betaEl.textContent  = Number(ev.beta ).toFixed(1);
        gammaEl.textContent = Number(ev.gamma).toFixed(1);
    }

    function startOrientation() {
        try {
            window.addEventListener("deviceorientation", onOrient, { passive: true });
            gyroStatus.textContent = "Działa.";
            readouts.style.display = "block";
            btnGyro.hidden = true;
        } catch (e) {
            gyroStatus.textContent = "Błąd startu żyroskopu: " + e;
        }
    }

    if (typeof DeviceOrientationEvent === "undefined") {
        gyroStatus.textContent = "Brak wsparcia DeviceOrientation.";
    } else {
        // iOS 13+ wymaga jawnej zgody; Android zwykle nie.
        if (typeof DeviceOrientationEvent.requestPermission === "function") {
            btnGyro.hidden = false;
            gyroStatus.textContent = "Kliknij „Włącz żyroskop”, by przyznać uprawnienie.";
            btnGyro.addEventListener("click", async () => {
                try {
                    const res = await DeviceOrientationEvent.requestPermission();
                    if (res === "granted") startOrientation();
                    else gyroStatus.textContent = "Odmówiono uprawnień do żyroskopu.";
                } catch (err) {
                    gyroStatus.textContent = "Błąd uprawnień: " + err;
                }
            });
        } else {
            // Android / desktop — zwykle bez dodatkowych pozwoleń (HTTPS wymagany)
            startOrientation();
        }
    }

    // Pauzowanie/odwieszanie nasłuchu (oszczędzanie baterii)
    document.addEventListener("visibilitychange", () => {
        if (document.hidden) {
            window.removeEventListener("deviceorientation", onOrient, { passive: true });
            gyroStatus.textContent = "Wstrzymane (karta w tle).";
        } else {
            startOrientation();
        }
    });

    // ——————————————————————————————————————————————————————————
    // WIBRACJA — najprostszy test oraz wzór
    // ——————————————————————————————————————————————————————————
    const vibrateStatus = document.getElementById("vibrate-status");
    const btnVibrate = document.getElementById("vibrate");
    const btnVibratePattern = document.getElementById("vibrate-pattern");

    function vibrateSupported() {
        return typeof navigator.vibrate === "function";
    }

    if (!vibrateSupported()) {
        vibrateStatus.textContent = "Brak wsparcia wibracji w tej przeglądarce.";
        btnVibrate.disabled = true;
        btnVibratePattern.disabled = true;
    } else {
        vibrateStatus.textContent = "Gotowe. Kliknij, by uruchomić wibrację.";
        btnVibrate.addEventListener("click", () => {
            const ok = navigator.vibrate(200); // 200 ms
            vibrateStatus.textContent = ok ? "Wibracja 200 ms." : "Wibracja odrzucona.";
        });
        btnVibratePattern.addEventListener("click", () => {
            // wzór: wibruj 100ms, przerwa 50ms, wibruj 150ms, przerwa 50ms, wibruj 200ms
            const ok = navigator.vibrate([100, 50, 150, 50, 200]);
            vibrateStatus.textContent = ok ? "Wibracja (wzór)." : "Wibracja odrzucona.";
        });
    }
});
