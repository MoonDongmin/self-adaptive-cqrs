# 층3 자동 채점 요약

생성: 2026-09-11T04-45-16-338Z

```
  A1-payload-drift/rep-1 [A ] T1:✓  T2:✓(1/1)  T3:✓(2/2, 0행)  T4:✓(3/3)
  A1-payload-drift/rep-1 [B1] T1:✓  T2:✗(1/1, v1자산 ALTER read_grip_result)  T3:✗(0/1, -행)  T4:✓(3/3)
  A6-depth-jump/rep-1 [A ] T1:✓  T2:✓(1/1)  T3:✗(0/0, -행)  T4:✓(3/3)
  A6-depth-jump/rep-1 [B1] T1:✓  T2:✓(1/1)  T3:✓(1/1, 0행)  T4:✓(3/3)
  B1-projection-map-failed/rep-1 [A ] T1:✓  T2:✓(1/1)  T3:✗(1/2, -행)  T4:✓(3/3)
  B1-projection-map-failed/rep-1 [B1] T1:✓  T2:✗(1/2)  T3:✗(0/1, -행)  T4:✓(3/3)
  E2-new-aggregate-query/rep-1 [A ] T1:✓  T2:✗(0/1)  T3:✗(0/1, -행)  T4:✓(3/3)
  E2-new-aggregate-query/rep-1 [B1] T1:✓  T2:✓(3/3)  T3:✓(1/1, 1행)  T4:✓(3/3)
  E4-time-series-query/rep-1 [A ] T1:✓  T2:✓(1/1)  T3:✓(1/2, 0행)  T4:✓(3/3)
  E4-time-series-query/rep-1 [B1] T1:✓  T2:✓(3/3)  T3:✓(2/2, 1행)  T4:✓(3/3)

  [A] T1 5/5  T2 4/5  T3 2/5  T4 5/5  (단위 5, 평균 입력 40958 tok/단위)
  [B1] T1 5/5  T2 3/5  T3 3/5  T4 5/5  (단위 5, 평균 입력 18239 tok/단위)
```
