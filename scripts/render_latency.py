"""Render latency measurements reported in paper.pdf Table 5 and Section 3.1."""
from pathlib import Path
import matplotlib
matplotlib.use('Agg')
import matplotlib.pyplot as plt
from matplotlib.ticker import ScalarFormatter

OUT = Path(__file__).resolve().parent.parent / 'source/assets/images'
plt.rcParams.update({'font.family': 'DejaVu Sans', 'font.size': 10, 'axes.titlesize': 11,
                     'axes.labelsize': 10, 'axes.spines.top': False, 'axes.spines.right': False,
                     'axes.edgecolor': '#777777', 'text.color': '#333333', 'axes.labelcolor': '#444444',
                     'xtick.color': '#555555', 'ytick.color': '#444444', 'svg.fonttype': 'path'})
fig, (left, right) = plt.subplots(1, 2, figsize=(10.5, 3.0), gridspec_kw={'width_ratios':[1.2,1]})
fig.subplots_adjust(left=.16, right=.97, bottom=.25, top=.75, wspace=.42)
colors = {'vae':'#777777', 'l2r':'#3475ad', 'scorer':'#9ec0d9'}
for y, native in [(1,3990),(0,1702)]:
    left.plot([19.7,native],[y,y], color='#c5c5c5', lw=1.5, zorder=1)
    left.scatter([19.7],[y], color=colors['l2r'], marker='o', s=52, zorder=3)
    left.scatter([native],[y], color=colors['vae'], marker='s', s=45, zorder=3)
    left.annotate('19.7 ms', (19.7,y), xytext=(0,12), textcoords='offset points', ha='center', fontsize=9, color=colors['l2r'])
    left.annotate(f'{native:,} ms', (native,y), xytext=(0,12), textcoords='offset points', ha='center', fontsize=9)
left.set_xscale('log'); left.set_xlim(10,7000); left.set_ylim(-.5,1.55)
left.set_yticks([0,1], ['Wan2.1-1.3B','CogVideoX-5B'])
left.set_xticks([10,100,1000], ['10','100','1,000'])
left.tick_params(axis='y', length=0, pad=9)
left.tick_params(axis='x', which='minor', length=0)
left.spines['left'].set_visible(False)
left.grid(axis='x', which='major', color='#ededed', zorder=0)
left.set_xlabel('Decoding latency (ms, log scale)', labelpad=8)
left.set_title('(a) Native VAE vs. L2R', loc='left', pad=34)
from matplotlib.lines import Line2D
left.legend(handles=[Line2D([],[],color=colors['vae'],marker='s',ls='',label='Native VAE'),
                     Line2D([],[],color=colors['l2r'],marker='o',ls='',label='L2R (ours)')],
            frameon=False, fontsize=9, ncol=2, loc='upper left', bbox_to_anchor=(-.03,1.24), handletextpad=.4, columnspacing=1.3)
right.barh(0,19.7,height=.4,color=colors['l2r'],label='L2R')
right.barh(0,19.5,left=19.7,height=.4,color=colors['scorer'],label='Alignment scorer')
right.text(9.85,0,'19.7',ha='center',va='center',color='white',fontsize=10)
right.text(29.45,0,'19.5',ha='center',va='center',color='#243f52',fontsize=10)
right.text(39.2,.32,'39.2 ms total',ha='right',va='bottom',fontsize=10)
right.set_xlim(0,45);right.set_ylim(-.65,.9);right.set_yticks([])
right.set_xticks([0,10,20,30,40]);right.set_xlabel('Inspection latency (ms)',labelpad=8)
right.spines['left'].set_visible(False)
right.set_title('(b) Real-time Inspection module',loc='left',pad=34)
right.legend(frameon=False,fontsize=9,ncol=2,loc='upper left',bbox_to_anchor=(-.03,1.24),columnspacing=1)
for ext in ['svg','png']:
    fig.savefig(OUT/f'latency-comparison.{ext}',dpi=200,facecolor='white')
plt.close(fig)
