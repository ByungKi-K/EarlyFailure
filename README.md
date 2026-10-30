# EarlyFailure — NeurIPS 2026 project page

논문 **Early Failure Detection and Intervention in Video Diffusion Models**의 정적 프로젝트 페이지입니다. HTML, CSS, JavaScript만 사용하며 패키지 설치나 빌드 과정이 필요하지 않습니다.

## 로컬 미리보기

이 폴더에서 실행합니다.

```sh
python3 -m http.server 4173 --bind 127.0.0.1 --directory source
```

브라우저에서 <http://127.0.0.1:4173>을 여세요. `source/index.html`을 직접 열어도 기본 콘텐츠를 볼 수 있지만, 영상과 클립보드는 HTTP 미리보기를 권장합니다.

## 공개 파일 구조

```text
source/                       ← 이 폴더만 웹사이트로 배포
  index.html                  # 본문, 저자, 링크, BibTeX
  styles.css                  # 반응형 디자인
  app.js                      # 영상 선택·재생, 단계 슬라이더, 인용 복사
  .nojekyll
  assets/
    documents/paper.pdf       # 루트 paper.pdf의 수정 없는 사본
    videos/                   # 비교 영상 8개 + L2R 영상 7개 + supplementary 전체/정성 클립
    images/                   # 영상 포스터 + 논문 figure + 기존 VBench plot
    frames/                   # L2R 영상의 포스터 프레임 7개
scripts/
  asset-provenance.json       # 공개 자료와 원본 파일의 대응 및 변환 내역
  validate_site.py            # 링크·리소스·배포 경계 검사
  render_latency.py           # 논문 측정값으로 latency figure 생성
  render_vbench.py            # Table 1의 VBench 결과 plot 생성
.github/workflows/pages.yml   # source/만 GitHub Pages에 배포
```

`ECCV26/`, `NeurIPS26/`, 루트 `paper.pdf`, `.work/`는 연구 원본/작업 자료로 `.gitignore`에 제외되어 있습니다. 웹사이트는 해당 경로를 직접 참조하지 않습니다. 원본 파일은 변경하지 않았습니다. 공개 폴더는 약 58 MiB이며, 동영상은 H.264와 `faststart`, 이미지 프리뷰는 WebP를 사용합니다. 본문은 루트 `paper.pdf`를 기준으로 작성했습니다.

## GitHub Pages 배포

공개 페이지: [EarlyFailure](https://byungki-k.github.io/EarlyFailure/)

저장소: [ByungKi-K/EarlyFailure](https://github.com/ByungKi-K/EarlyFailure)

`main` 브랜치의 웹사이트 변경 사항은 GitHub Actions를 통해 자동 배포됩니다. 이 로컬 저장소는 `origin/main`을 추적합니다. 아래 절차는 다른 저장소에 새로 배포할 때의 안내입니다.

1. 이 프로젝트를 **독립 Git 저장소**로 만들어 원하는 GitHub 저장소에 올립니다. 상위 폴더의 저장소를 사용하지 마세요. Git에 포함할 항목은 `source/`, `scripts/`, `.github/`, `.gitignore`, `README.md`입니다.
2. 기본 브랜치를 `main`으로 설정합니다. 다른 이름이면 `.github/workflows/pages.yml`의 `branches`를 수정합니다.
3. GitHub 저장소의 **Settings → Pages → Build and deployment → Source → GitHub Actions**를 선택합니다.
4. `main`에 push하거나 **Actions → Deploy research project page → Run workflow**를 실행합니다.
5. 배포 완료 후 Actions의 `github-pages` environment에서 주소를 확인합니다.

워크플로는 `source/`만 업로드합니다. 모든 로컬 리소스 URL은 상대 경로이므로 `https://<account>.github.io/<repository>/` 형태에서도 동작합니다. 저장소 루트를 정적 웹사이트로 배포하지 마세요.

공식 안내: [GitHub Pages custom workflows](https://docs.github.com/en/pages/getting-started-with-github-pages/using-custom-workflows-with-github-pages).

## 수정할 곳

- **자료 링크:** 상단에는 Paper와 Code만 표시하며 Code는 `Coming soon` 상태입니다. 인용 영역의 arXiv 링크는 `https://arxiv.org/abs/2603.14320`으로 연결됩니다.
- **논문:** `source/assets/documents/paper.pdf`를 교체하세요. 저자·소속·학회와 BibTeX는 `source/index.html`에 있습니다. BibTeX는 우선 arXiv의 `@misc` 형식으로 제공하며, `eprint=2603.14320`, `archivePrefix=arXiv`, `primaryClass=cs.CV`와 URL을 포함합니다. 공식 proceedings 항목이 나오면 갱신할 수 있습니다.
- **대표 비교 영상:** `source/app.js`의 `examples`와 `source/assets/videos/`·`images/`에서 관리합니다. 초기 화면의 HTML도 첫 예시와 일치시켜 주세요.
- **VBench 결과:** `source/index.html`의 `.vbench-table`에 Table 1의 Original prompt 수치를 표시합니다. Original model (No intervention) / + Regeneration / + Ours / w/ Qwen3.8-27B (VLM) 네 행에서 두 모델의 Final·Quality·Semantic 점수와 시간 오버헤드를 비교합니다. 전체 VBench 평가셋이며 실패 subset으로 표시하지 않습니다. VBench 점수의 Bold는 네 방법 중 최댓값입니다. Time overhead 열은 옅은 배경과 굵은 제목으로 구분하며 Ours·Qwen 변형의 오버헤드는 파란색 Bold로 강조합니다. GPT-5-mini를 기본 VLM으로 사용하며 Qwen3.8-27B도 대안으로 평가했다고 설명합니다. 제목 아래의 Original prompts · Full VBench evaluation 문구는 표시하지 않습니다. VBench + Panda70M의 1,800개 프롬프트 중 실패로 감지된 샘플(CogVideoX 872개, Wan 811개)의 분포는 펼쳐보는 Fig. 18에서 제공합니다. VideoScore2 표는 페이지에서 제거했습니다.
- **기존 Plot 재생성:** 현재 본문은 HTML 표를 사용합니다. 보존된 이전 plot은 Matplotlib이 설치된 Python에서 `python3 scripts/render_vbench.py`로 SVG·PNG를 다시 만들 수 있습니다. 기존 latency figure 생성기는 `scripts/render_latency.py`에 보존되어 있습니다. 정적 페이지 실행에는 Matplotlib이 필요하지 않습니다.
- **단계 프리뷰와 saturation:** 코기 프롬프트의 실제 1, 3, 5, 7, 10, 12, 14 step L2R 영상과 논문 Fig. 7의 Wan2.1 패널을 함께 보여줍니다. 영상 아래에 `Latent-to-RGB (L2R) preview`라고 표시합니다. 영상은 원본의 4fps·3.25초 전체 구간을 재인코딩 없이 복사했으며 프레임을 보간하지 않았습니다. 화면에 보이면 무음 반복 재생하고 Play/Pause 버튼으로 제어합니다. 한 슬라이더가 단계별 영상과 그래프의 세로 guide를 갱신하며, 사용자가 선택한 일시정지 상태는 유지합니다. 그래프는 1,800개 prompt의 평균이며 해당 프리뷰의 개별 점수가 아닙니다. 좌표는 추출된 패널의 x=135(1 step)~945(50 step), width=990을 기준으로 합니다. 웹페이지의 축 이름은 SVG로 `Error vs. final video`라고 표시하며 정규화 여부와 1,800개 prompt 평균이라는 정보는 그래프 아래 한 줄에 모읍니다. SVG viewBox는 원본의 제목 여백만 제외한 `0 55 990 576`이며 곡선 좌표는 그대로 사용합니다. 값은 논문 그대로 metric dynamic range로 정규화한 MAE이며, 원본 이미지와 곡선은 변경하지 않았습니다. 반복되는 패널 제목·One sample·step 표시를 제거하고, 현재 step은 슬라이더 옆에 한 번만 표시합니다. 프롬프트는 프리뷰 아래에 둡니다. Figure 제목은 `Video quality metrics saturate early`이며, 모델명은 그래프 내부 오른쪽 위에 작게 표시합니다. Legend는 14px 글자와 18px 색상 선을 사용합니다.
- **More qualitative results:** `overview-qualitative.mp4`는 원본 `NeurIPS26/supple.mp4`의 77초부터 끝까지 추출한 재생용 클립입니다. 정성 결과 제목부터 시작해 서버의 seek 지원 여부와 관계없이 바로 재생됩니다. 포스터는 첫 정성 예시가 보이는 원본 83초 프레임입니다. 전체 `overview.mp4`와 연구 원본은 유지합니다.
- **소셜 공유:** 실제 공개 URL이 정해지면 절대 URL을 사용하는 `og:url`, `og:image`, canonical 메타데이터를 추가할 수 있습니다.

## 검증

```sh
python3 scripts/validate_site.py
node --check source/app.js
```

데스크톱과 모바일 레이아웃, 비교 영상 변경·재생, 슬라이더, 인용 복사를 브라우저에서 확인할 수 있습니다. 자동 재생은 무음이며 보이지 않을 때 정지합니다. 시스템의 동작 줄이기 설정이 활성화되어 있으면 수동 재생으로 시작합니다.

## 논문의 핵심을 강조하는 구성

1. 제목 바로 아래에 L2R preview 영상과 논문 Fig. 7의 Wan 패널을 나란히 배치합니다. Step을 선택하면 프리뷰와 그래프 guide가 함께 바뀝니다. 모바일에서는 영상을 화면 너비에 맞춰 최대 440px로 배치하고 그래프를 바로 아래에 둡니다. 본문에는 Table 1·Fig. 7·Fig. 18 번호와 원문 참조 링크를 표시하지 않습니다. Legend는 위 3개·아래 2개로 중앙 정렬하며, 좁은 화면에서는 항목 텍스트만 줄바꿈됩니다.
2. Fig. 1 teaser와 짧은 목적 문단으로 불필요한 기다림·연산 낭비를 줄이려는 동기와 진단 기반 개입을 설명합니다.
3. Table 1의 VBench 점수와 시간 오버헤드를 네 방법 비교 표로 제공한 다음, 기존 정성적 비교 영상과 정성 결과부터 시작하는 supplementary video를 보여줍니다.
4. 논문 Section 5 Conclusion과 Limitations and future work에 맞춰 더 이른 세밀한 실패 감지, 효율적이고 효과적인 개입, 표현력과 효율성을 함께 갖춘 video evaluator를 향후 방향으로 제시합니다. 서비스 제공자의 생성 연산 낭비와 사용자가 만족스러운 결과를 얻기까지의 대기 시간을 줄이는 목표로 마무리합니다.
5. Abstract와 긴 figure caption은 다시 넣지 않았습니다. BibTeX는 접기 없이 항상 표시하며 arXiv 링크와 복사 버튼을 제공합니다. 기존 추가 figure들은 공개 assets에 보존하되 본문 흐름에서는 제외했습니다.

## 디자인 참고

- [JointDiT](https://byungki-k.github.io/JointDiT/): 논문 제목·저자·소속·자료 링크와 인터랙티브 결과 구성.
- [Nerfies](https://nerfies.github.io/): 미디어 중심 설명과 직접 조작하는 연구 데모.
- [DreamFusion](https://dreamfusion3d.github.io/): 예시 중심의 시각적 흐름과 연구 설명의 연결.

참고 사이트의 코드나 미디어를 복사하지 않고 새로 구현했습니다. 연구 영상·그림·논문에 임의의 공개 라이선스를 부여하지 않았습니다.
