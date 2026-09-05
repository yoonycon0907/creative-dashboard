# 프로젝트: 메타 광고 소재별 성과 대시보드

## 무엇을 만드나
docs/PRD.md 를 반드시 먼저 읽고 작업할 것. 읽기 전용 대시보드이며 광고 생성·수정 기능은 절대 만들지 않는다.

## 기술 스택 (변경 시 먼저 물어볼 것)
- Next.js(App Router) + TypeScript + Tailwind + shadcn/ui + Recharts
- DB: SQLite(better-sqlite3), 스키마는 순수 SQL
- Meta Marketing API v26.0 직접 호출 (SDK 없이 fetch)

## 절대 규칙
1. **데이터를 지어내지 않는다.** 목업/더미 데이터로 화면을 채우지 말 것. API가 실패하면 화면에 "조회 실패 + 사유"를 표시한다.
2. **ROAS는 % 표기** (구매전환값 ÷ 지출 × 100). API는 배수로 오므로 변환 필수.
3. **비율 지표는 평균의 평균 금지.** 합산된 분자/분모로 재계산한다.
4. 계정별 기여기간이 다르다(config/accounts.ts). 하드코딩 금지.
5. 토큰은 .env.local 에만. 커밋 금지, 로그 출력 금지.
6. 지표 계산 로직은 lib/metrics.ts 한 곳에만 둔다. 컴포넌트에서 계산 금지.

## 계정 설정
- CJDPM 755429019968813 / 자사몰 / actions:omni_purchase / attribution 1d_click / 동영상조회 목표 캠페인 제외
- 컬리 662564306201450 / 협력광고 / catalog_segment_* / 1d_view,1d_click
- 네이버 517752597868803 / 협력광고 / catalog_segment_* / 1d_view,1d_click

## 작업 방식
- 큰 기능은 먼저 계획을 말하고 승인받은 뒤 코드를 쓴다.
- 한 번에 한 마일스톤만. 완료되면 실행해서 스크린샷 대신 결과 수치를 보여준다.
