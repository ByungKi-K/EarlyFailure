"use strict";

// All public resources resolve relative to this page, including on /repository/.
const examples = {
  corgi: { prompt: "A corgi is playing drum kit.", model: "Wan2.1-1.3B", before: "Original generation: a human plays drums instead of a corgi", after: "With our intervention: a corgi plays drums" },
  astronaut: { prompt: "An astronaut flying in space, in cyberpunk style", model: "CogVideoX-5B", before: "Original generation: an astronaut in space", after: "With our intervention: a flying astronaut with neon cyberpunk details" },
  ironman: { prompt: "Iron Man flying in the sky", model: "CogVideoX-5B", before: "Original generation: a distant red armored figure in the sky", after: "With our intervention: Iron Man flying against a blue sky, with clearly visible armor details" },
  panda: { prompt: "A confused panda in calculus class", model: "CogVideoX-5B", before: "Original generation: a child holding a tablet", after: "With our intervention: an illustrated panda at a desk in calculus class" },
  nebula: { prompt: "A corgi's head depicted as an explosion of a nebula", model: "Wan2.1-1.3B", before: "Original generation: an animal head with limited nebula detail", after: "With our intervention: a corgi head surrounded by a colorful nebula" }
};


const videoBefore = document.querySelector("#video-before");
const videoAfter = document.querySelector("#video-after");
const comparisonVideos = [videoBefore, videoAfter];
const playButton = document.querySelector("#play-comparison");
let wantsPlayback = !window.matchMedia("(prefers-reduced-motion: reduce)").matches;
let inView = false;
let playbackVersion = 0;

function showPlayback(playing) {
  document.querySelector("#play-label").textContent = playing ? "Pause" : "Play";
  document.querySelector("#play-icon").textContent = playing ? "Ⅱ" : "▶";
  playButton.setAttribute("aria-label", `${playing ? "Pause" : "Play"} comparison videos`);
}

async function updatePlayback() {
  const version = ++playbackVersion;
  if (!wantsPlayback || !inView || document.hidden) {
    comparisonVideos.forEach(video => video.pause());
    showPlayback(false);
    return;
  }
  const outcomes = await Promise.allSettled(comparisonVideos.map(video => video.play()));
  if (version !== playbackVersion) return;
  if (outcomes.some(outcome => outcome.status === "rejected")) {
    comparisonVideos.forEach(video => video.pause());
    showPlayback(false);
    return;
  }
  showPlayback(true);
}

playButton.addEventListener("click", () => {
  wantsPlayback = comparisonVideos.some(video => video.paused);
  inView = true;
  updatePlayback();
});

document.querySelectorAll("[data-example]").forEach(button => {
  button.addEventListener("click", () => {
    const id = button.dataset.example;
    const example = examples[id];
    playbackVersion++;
    comparisonVideos.forEach((video, index) => {
      video.pause();
      const side = index === 0 ? "before" : "after";
      video.poster = `assets/images/${id}-${side}.webp`;
      video.querySelector("source").src = `assets/videos/${id}-${side}.mp4`;
      video.setAttribute("aria-label", example[side]);
      video.load();
    });
    document.querySelector("#example-prompt").textContent = `“${example.prompt}”`;
    document.querySelector("#example-model").textContent = example.model;
    document.querySelectorAll("[data-example]").forEach(tab => {
      const selected = tab === button;
      tab.classList.toggle("active", selected);
      tab.setAttribute("aria-pressed", String(selected));
    });
    document.querySelector("#example-announcement").textContent = `${example.prompt}. ${example.model}.`;
    updatePlayback();
  });
});

// Reconcile minor drift without continually seeking during playback.
videoBefore.addEventListener("timeupdate", () => {
  if (!videoBefore.paused && !videoAfter.paused && videoAfter.readyState >= 2 && Math.abs(videoBefore.currentTime - videoAfter.currentTime) > 0.3) {
    videoAfter.currentTime = Math.min(videoBefore.currentTime, videoAfter.duration || 0);
  }
});
comparisonVideos.forEach(video => video.addEventListener("error", () => {
  wantsPlayback = false;
  updatePlayback();
  document.querySelector("#example-announcement").textContent = "The comparison video could not be loaded. Try another example.";
}));

if ("IntersectionObserver" in window) {
  new IntersectionObserver(([entry]) => {
    inView = entry.isIntersecting;
    updatePlayback();
  }, { threshold: 0.2 }).observe(document.querySelector(".video-pair"));
} else {
  inView = true;
  updatePlayback();
}
document.addEventListener("visibilitychange", updatePlayback);

const previewVideo = document.querySelector("#step-video");
const previewPlayButton = document.querySelector("#play-preview");
let previewWantsPlayback = !window.matchMedia("(prefers-reduced-motion: reduce)").matches;
let previewInView = false;
let previewPlaybackVersion = 0;

function showPreviewPlayback() {
  const playing = !previewVideo.paused;
  document.querySelector("#preview-play-label").textContent = playing ? "Pause" : "Play";
  document.querySelector("#preview-play-icon").textContent = playing ? "Ⅱ" : "▶";
  previewPlayButton.setAttribute("aria-label", `${playing ? "Pause" : "Play"} L2R preview`);
}

async function updatePreviewPlayback() {
  const version = ++previewPlaybackVersion;
  if (!previewWantsPlayback || !previewInView || document.hidden) {
    previewVideo.pause();
    showPreviewPlayback();
    return;
  }
  try {
    await previewVideo.play();
  } catch {
    // Switching steps aborts the previous play request; only update the current one.
    if (version === previewPlaybackVersion) previewVideo.pause();
  }
  if (version === previewPlaybackVersion) showPreviewPlayback();
}

previewPlayButton.addEventListener("click", () => {
  previewWantsPlayback = previewVideo.paused;
  previewInView = true;
  updatePreviewPlayback();
});
previewVideo.addEventListener("play", showPreviewPlayback);
previewVideo.addEventListener("pause", showPreviewPlayback);
previewVideo.addEventListener("error", () => {
  previewWantsPlayback = false;
  updatePreviewPlayback();
  document.querySelector("#early-reading").textContent = "The L2R preview could not be loaded. Try another denoising step.";
});
// Native controls remain available when JavaScript is disabled.
previewVideo.controls = false;
previewPlayButton.hidden = false;
if ("IntersectionObserver" in window) {
  new IntersectionObserver(([entry]) => {
    previewInView = entry.isIntersecting;
    updatePreviewPlayback();
  }, { threshold: 0.2 }).observe(previewVideo);
} else {
  previewInView = true;
}
document.addEventListener("visibilitychange", updatePreviewPlayback);

const steps = [1, 3, 5, 7, 10, 12, 14];
const slider = document.querySelector("#step-slider");
function setStep(index) {
  const step = steps[index];
  slider.value = String(index);
  slider.setAttribute("aria-valuetext", `Step ${step} of 50`);
  const source = `assets/videos/l2r-step-${String(step).padStart(2, "0")}.mp4`;
  if (previewVideo.getAttribute("src") !== source) {
    previewPlaybackVersion++;
    previewVideo.pause();
    previewVideo.poster = `assets/frames/failure-${String(step).padStart(2, "0")}.webp`;
    previewVideo.src = source;
    previewVideo.load();
  }
  previewVideo.setAttribute("aria-label", `Latent-to-RGB (L2R) preview at denoising step ${step} for the prompt: A corgi is playing drum kit.`);
  document.querySelector("#step-output").textContent = `${step} / 50`;
  // Fig. 7's Wan panel spans steps 1–50, at x = 135–945 in the 990 px crop.
  // The guide indicates sampling time only; no sample-specific score is inferred.
  const markerX = 135 + ((step - 1) / 49) * 810;
  document.querySelector("#metric-step-marker").setAttribute("transform", `translate(${markerX} 0)`);
  document.querySelector("#early-reading").textContent = step >= 10
    ? `By step ${step}, the preview depicts a human drummer rather than the requested corgi.`
    : step === 1 ? "Only coarse structure is visible in the first preview."
    : "The early preview gradually resolves into a human drummer.";
  document.querySelectorAll("[data-step]").forEach(button => {
    const selected = Number(button.dataset.step) === index;
    button.classList.toggle("selected", selected);
    button.setAttribute("aria-pressed", String(selected));
  });
  updatePreviewPlayback();
}
slider.addEventListener("input", event => setStep(Number(event.target.value)));
document.querySelectorAll("[data-step]").forEach(button => button.addEventListener("click", () => setStep(Number(button.dataset.step))));
setStep(4);

document.querySelector("#copy-citation").addEventListener("click", async () => {
  const citation = document.querySelector("#bibtex").textContent;
  const label = document.querySelector("#copy-citation span");
  try {
    await navigator.clipboard.writeText(citation);
    label.textContent = "Copied!";
    document.querySelector("#copy-status").textContent = "BibTeX copied to clipboard.";
    window.setTimeout(() => { label.textContent = "Copy"; }, 2200);
  } catch {
    const range = document.createRange();
    range.selectNodeContents(document.querySelector("#bibtex"));
    const selection = window.getSelection();
    selection.removeAllRanges();
    selection.addRange(range);
    label.textContent = "Selected — copy manually";
    document.querySelector("#copy-status").textContent = "Automatic copy is unavailable. The citation is selected; press Command+C or Control+C to copy.";
  }
});

