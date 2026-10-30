"use strict";

// Recorded previews illustrate the paper's timings; this does not run model inference.
(() => {
  const demo = document.querySelector("#decoder-demo");
  const replay = document.querySelector("#decoder-replay");
  const play = document.querySelector("#decoder-play");
  const status = document.querySelector("#decoder-status");
  const selectedStepLabel = document.querySelector("#decoder-selected-step");
  const stepButtons = [...document.querySelectorAll("[data-decoder-step]")];
  const results = [
    { name: "l2r", delay: 19.7, card: document.querySelector("#decoder-l2r-result"), video: document.querySelector("#decoder-l2r-video"), cover: document.querySelector("#decoder-l2r-cover") },
    { name: "original", delay: 3990, card: document.querySelector("#decoder-original-result"), video: document.querySelector("#decoder-original-video"), cover: document.querySelector("#decoder-original-cover") }
  ].map(result => ({ ...result, label: result.cover.querySelector(".decoder-cover-label"), clock: result.cover.querySelector(".decoder-clock"), progress: result.cover.querySelector(".decoder-progress"), bar: result.cover.querySelector(".decoder-progress > span") }));
  const reducedMotion = window.matchMedia("(prefers-reduced-motion: reduce)");
  let selectedStep = 10;
  let preparedStep = null;
  let objectURLs = [];
  let generation = 0;
  let pendingController = null;
  let revealTimers = [];
  let clockFrame = 0;
  let inView = false;
  let wantsPlayback = !reducedMotion.matches;

  function updatePlayback() {
    for (const result of results) {
      if (wantsPlayback && inView && !document.hidden && result.card.dataset.state === "ready") {
        result.video.play().catch(() => {
          if (result.card.dataset.state === "ready" && inView && !document.hidden && result.video.paused) {
            wantsPlayback = false;
            updatePlayback();
          }
        });
      } else {
        result.video.pause();
      }
    }
    play.textContent = wantsPlayback ? "Pause previews" : "Play previews";
  }

  function stopClock() {
    revealTimers.forEach(window.clearTimeout);
    revealTimers = [];
    window.cancelAnimationFrame(clockFrame);
  }

  function releaseMedia() {
    for (const { video } of results) {
      video.pause();
      video.removeAttribute("src");
      video.load();
    }
    objectURLs.forEach(url => URL.revokeObjectURL(url));
    objectURLs = [];
    preparedStep = null;
  }

  function prepareVideo(video, url, signal) {
    return new Promise((resolve, reject) => {
      function cleanup() {
        video.removeEventListener("loadeddata", ready);
        video.removeEventListener("error", failed);
        signal.removeEventListener("abort", aborted);
      }
      function ready() { cleanup(); resolve(); }
      function failed() { cleanup(); reject(new Error("Video could not be decoded.")); }
      function aborted() { cleanup(); reject(new DOMException("Cancelled", "AbortError")); }
      if (signal.aborted) { aborted(); return; }
      video.addEventListener("loadeddata", ready, { once: true });
      video.addEventListener("error", failed, { once: true });
      signal.addEventListener("abort", aborted, { once: true });
      video.preload = "auto";
      video.src = url;
      video.load();
    });
  }

  function startClock(run) {
    const started = performance.now();
    demo.dataset.phase = "running";
    status.textContent = "Decoding the same latent through both paths…";
    for (const result of results) {
      result.card.dataset.state = "decoding";
      result.label.textContent = "Decoding…";
      result.clock.hidden = false;
      result.progress.hidden = false;
      revealTimers.push(window.setTimeout(() => {
        if (run !== generation) return;
        result.card.dataset.state = "ready";
        result.video.removeAttribute("aria-hidden");
        result.cover.hidden = true;
        play.hidden = false;
        updatePlayback();
        if (result.name === "l2r") {
          status.textContent = "L2R is ready; waiting for the original decoder.";
        } else {
          demo.dataset.phase = "complete";
          status.textContent = "Both previews are ready. Choose another step or replay.";
          window.cancelAnimationFrame(clockFrame);
        }
      }, result.delay));
    }
    function drawClock() {
      if (run !== generation || demo.dataset.phase !== "running") return;
      const elapsed = performance.now() - started;
      for (const result of results) {
        const progress = Math.min(1, elapsed / result.delay);
        result.clock.textContent = `${(Math.min(elapsed, result.delay) / 1000).toFixed(3)} s`;
        result.bar.style.transform = `scaleX(${progress})`;
      }
      clockFrame = window.requestAnimationFrame(drawClock);
    }
    drawClock();
  }

  async function compareStep(step) {
    const run = ++generation;
    selectedStep = step;
    stopClock();
    pendingController?.abort();
    const controller = new AbortController();
    pendingController = controller;
    const loadingTimeout = window.setTimeout(() => controller.abort(), 20000);
    demo.dataset.phase = "loading";
    status.textContent = "Loading the selected previews before starting the timing comparison…";
    selectedStepLabel.textContent = `Step ${step} / 50`;
    replay.textContent = "Replay comparison";
    replay.disabled = true;
    play.hidden = true;
    wantsPlayback = !reducedMotion.matches;
    for (const button of stepButtons) {
      const selected = Number(button.dataset.decoderStep) === step;
      button.classList.toggle("selected", selected);
      button.setAttribute("aria-pressed", String(selected));
    }
    // Schematic colours change with the selected step; these are not measured latent values.
    const palette = ["#9ab8d7", "#7599c4", "#b9c5df", "#d4bdd8", "#d9b3b1", "#e9d7b7", "#b4cddc"];
    document.querySelectorAll(".latent-cell").forEach((cell, index) => {
      cell.setAttribute("fill", palette[(index * 11 + step * 3 + Math.floor(index / 7)) % palette.length]);
    });
    for (const result of results) {
      result.video.pause();
      result.video.setAttribute("aria-hidden", "true");
      result.card.dataset.state = "waiting";
      result.cover.hidden = false;
      result.label.textContent = "Loading preview…";
      result.clock.hidden = true;
      result.clock.textContent = "0.000 s";
      result.progress.hidden = true;
      result.bar.style.transform = "scaleX(0)";
      result.video.setAttribute("aria-label", `${result.name === "l2r" ? "L2R" : "Original CogVideoX decoder"} preview at denoising step ${step}: Iron Man flying in the sky`);
    }
    try {
      if (preparedStep !== step) {
        releaseMedia();
        // Fetch only this pair. Waiting for both files prevents network buffering from
        // being presented as model latency; replay reuses the current pair in memory.
        const blobs = await Promise.all(results.map(async result => {
          const response = await fetch(`assets/videos/decoder-step-${String(step).padStart(2, "0")}-${result.name}.mp4`, { signal: controller.signal });
          if (!response.ok) throw new Error(`Preview request failed: ${response.status}`);
          return response.blob();
        }));
        if (run !== generation) return;
        objectURLs = blobs.map(blob => URL.createObjectURL(blob));
      }
      await Promise.all(results.map((result, index) => prepareVideo(result.video, objectURLs[index], controller.signal)));
      if (run !== generation) return;
      preparedStep = step;
      replay.disabled = false;
      startClock(run);
    } catch {
      if (run !== generation) return;
      controller.abort();
      releaseMedia();
      demo.dataset.phase = "error";
      status.textContent = "The selected previews could not be loaded. Please try again.";
      results.forEach(result => { result.label.textContent = "Preview unavailable"; });
      replay.textContent = "Try again";
      replay.disabled = false;
    } finally {
      window.clearTimeout(loadingTimeout);
      if (pendingController === controller) pendingController = null;
    }
  }

  stepButtons.forEach(button => button.addEventListener("click", () => compareStep(Number(button.dataset.decoderStep))));
  replay.addEventListener("click", () => compareStep(selectedStep));
  play.addEventListener("click", () => { wantsPlayback = !wantsPlayback; updatePlayback(); });
  if ("IntersectionObserver" in window) {
    new IntersectionObserver(([entry]) => {
      inView = entry.isIntersecting;
      updatePlayback();
    }, { threshold: 0.1 }).observe(demo.querySelector(".decoder-pair"));
  } else {
    inView = true;
  }
  document.addEventListener("visibilitychange", updatePlayback);
})();
