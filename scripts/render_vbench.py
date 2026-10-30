"""Render Table 1's original-prompt VBench scores; all prompts, not failure-only.

The dots encode scores on a labelled, shared 0.65–0.85 axis. No bar lengths or
unreported uncertainty estimates are used. Requires Matplotlib; no site build.
"""
from pathlib import Path
import matplotlib
matplotlib.use("Agg")
import matplotlib.pyplot as plt
from matplotlib.lines import Line2D

OUT = Path(__file__).resolve().parent.parent / "source/assets/images"
RESULTS = {
    "cogvideox": ("CogVideoX-5B", [0.778, 0.803, 0.680], [0.800, 0.816, 0.735]),
    "wan": ("Wan2.1-1.3B", [0.789, 0.811, 0.700], [0.805, 0.817, 0.756]),
}
plt.rcParams.update({
    "font.family": "DejaVu Sans", "font.size": 10,
    "text.color": "#363636", "axes.labelcolor": "#555555",
    "xtick.color": "#666666", "ytick.color": "#363636",
    "axes.edgecolor": "#b6b6b6", "svg.fonttype": "path",
})
for slug, (model, base, ours) in RESULTS.items():
    fig, ax = plt.subplots(figsize=(5.5, 3.7))
    fig.subplots_adjust(left=.21, right=.97, top=.73, bottom=.19)
    for i, (before, after) in enumerate(zip(base, ours)):
        y = 2 - i
        ax.plot([before, after], [y, y], color="#c9d7e2", lw=3, zorder=2)
        ax.scatter(before, y, s=40, color="#8d9297", zorder=3)
        ax.scatter(after, y, s=52, color="#2878b9", zorder=4)
        ax.annotate(f"{before:.3f}", (before, y), xytext=(0, -17),
                    textcoords="offset points", ha="center", color="#71767a", fontsize=10)
        ax.annotate(f"{after:.3f}", (after, y), xytext=(0, 10),
                    textcoords="offset points", ha="center", color="#2878b9", fontsize=10, weight="bold")
    ax.set_xlim(.645, .855)
    ax.set_ylim(-.55, 2.55)
    ax.set_yticks([2, 1, 0], ["Final", "Quality", "Semantic"])
    ax.set_xticks([.65, .70, .75, .80, .85], ["0.65", "0.70", "0.75", "0.80", "0.85"])
    ax.tick_params(axis="y", length=0, pad=10)
    ax.grid(axis="x", color="#eeeeee", zorder=0)
    for side in ["left", "top", "right"]:
        ax.spines[side].set_visible(False)
    ax.set_xlabel("VBench score (higher is better)", labelpad=9)
    fig.suptitle(model, x=.56, y=.96, fontsize=13, weight="medium")
    fig.legend(handles=[
        Line2D([], [], marker="o", ls="", color="#8d9297", label="No intervention"),
        Line2D([], [], marker="o", ls="", color="#2878b9", label="Ours"),
    ], loc="upper center", bbox_to_anchor=(.56, .88), ncol=2, frameon=False,
       fontsize=9, handletextpad=.3, columnspacing=1.5)
    for ext in ["svg", "png"]:
        fig.savefig(OUT / f"vbench-{slug}.{ext}", dpi=220, facecolor="white")
    plt.close(fig)
