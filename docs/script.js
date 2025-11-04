(async () => {
    const video = document.getElementById("video");
    const btnToggle = document.getElementById("toggleCam");
    const chkFlip = document.getElementById("flip");
    const errBox = document.getElementById("error");

    // bieżący tryb: "user" (przednia) lub "environment" (tylna)
    let facing = "user";
    let currentStream = null;

    // proste helpery
    const showError = (msg) => {
        errBox.hidden = false;
        errBox.textContent = msg;
    };
    const hideError = () => { errBox.hidden = true; errBox.textContent = ""; };

    // sprawdź kontekst bezpieczeństwa
    if (!window.isSecureContext && location.hostname !== "localhost") {
        showError("Ta strona nie działa bez HTTPS (wymóg przeglądarki dla kamery).");
        btnToggle.disabled = true;
        return;
    }

    if (!navigator.mediaDevices?.getUserMedia) {
        showError("Twoja przeglądarka nie obsługuje getUserMedia.");
        btnToggle.disabled = true;
        return;
    }

    // uruchomienie kamery
    async function startCamera() {
        try {
            hideError();
            // zatrzymaj poprzedni stream (jeśli był)
            if (currentStream) {
                currentStream.getTracks().forEach(t => t.stop());
                currentStream = null;
            }

            const constraints = {
                video: {
                    facingMode: { ideal: facing },    // "user" | "environment"
                    width: { ideal: 1280 },
                    height: { ideal: 720 }
                },
                audio: false
            };

            const stream = await navigator.mediaDevices.getUserMedia(constraints);
            currentStream = stream;
            video.srcObject = stream;
            await video.play();
        } catch (e) {
            // fallback: jeśli wybrana kamera niedostępna, spróbuj bez facingMode
            if (facing === "environment") {
                try {
                    const stream = await navigator.mediaDevices.getUserMedia({ video: true, audio: false });
                    currentStream = stream;
                    video.srcObject = stream;
                    await video.play();
                    showError("Nie udało się włączyć tylnej kamery — używam domyślnej.");
                } catch (e2) {
                    showError("Błąd kamery: " + (e2.message || e2));
                }
            } else {
                showError("Błąd kamery: " + (e.message || e));
            }
        }
    }

    // przełączanie kamer
    btnToggle.addEventListener("click", async () => {
        facing = (facing === "user") ? "environment" : "user";
        btnToggle.disabled = true;
        await startCamera();
        btnToggle.disabled = false;
    });

    // przełączanie odbicia lustrzanego
    chkFlip.addEventListener("change", () => {
        video.style.transform = chkFlip.checked ? "scaleX(-1)" : "none";
    });

    // auto-pauza przy ukryciu karty (oszczędza baterię)
    document.addEventListener("visibilitychange", () => {
        if (!currentStream) return;
        const tracks = currentStream.getVideoTracks();
        if (document.hidden) tracks.forEach(t => (t.enabled = false));
        else tracks.forEach(t => (t.enabled = true));
    });

    // iOS: od iOS 16.4 web autoplay video wymaga playsinline + muted (ustawione w HTML)
    // start
    await startCamera();

    // (opcjonalnie) reaguj na podpinanie/odpinanie urządzeń
    navigator.mediaDevices?.addEventListener?.("devicechange", async () => {
        // nic nie robimy automatycznie; możesz dodać odświeżanie listy kamer
    });
})();
