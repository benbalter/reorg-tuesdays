# Reorg Tuesday

*Ever feel like your org gets restructured every other Tuesday? This treats your
history of reorgs and manager changes as a [survival-analysis](https://en.wikipedia.org/wiki/Survival_analysis)
problem — Kaplan-Meier curves, Weibull MLE, Monte Carlo forecasts, a composite
risk score, and more — then renders it all as the charts below. Mostly for fun.
See [Reorgs happen](https://ben.balter.com/2026/06/07/reorgs-happen/) for the story
behind it.*

> **The data in [`managers.csv`](managers.csv) is synthetic sample data.** Swap in
> your own and regenerate: `npm install && npm start`. See [below](#about) for details.

Time at Acme: 9 years, 10 months, 3 weeks, and 6 days (2015-01-05 – 2024-12-02)

> *Final snapshot. Tenure ended 2024-12-02; analysis frozen as of that date and preserved for posterity.*

> **Reorg Risk: 🟠 51/100 (elevated)** | **Manager Risk: 🟠 47/100 (elevated)**

---

## Reorgs

```
 *   *  *  *   *  *  *  *    * * *   *   *   *   *  *   * *   *   *   *   *  *  *  *  *  *
|------------------------------------------------------------------------------------------|
 2015    2016    2017    2018    2019    2020    2021    2022     2023    2024  

```

### Descriptive statistics

| Metric | Value |
|--------|-------|
| Count | 25 |
| Min | 2 months, and 2 days |
| Max | 6 months, and 1 week |
| Mean | 4 months, and 2 weeks |
| Median | 4 months, 4 weeks, and 1 day |
| Q1 (25th percentile) | 4 months, and 1 day |
| Q3 (75th percentile) | 5 months, and 1 day |
| Std deviation | 4 weeks, and 2 days |
| Skewness | -0.61 (left-skewed) |
| Coefficient of variation | 22% (low variability) |
| Rate | 2.6/year (last 3 years: 2.7/year) |

### Current status

* Last reorg: 3 months ago ✅ — longer than 14% of historical tenures
* Longest ever gap: 6 months, and 1 week
* Per-cycle trend: Stable (R²=0.004)
* Calendar trend: Stable
* Weighted recent average: 4 months, 1 week, and 6 days

### Reorg probability

| Window | Probability |
|--------|------------|
| Next 30 days | 32% |
| Next 60 days | 69% |
| Next 90 days | 89% |
| Next 180 days | 100% |

### Frequency by quarter

```mermaid
pie title Reorg Frequency by Quarter
    "Q1" : 7
    "Q2" : 8
    "Q3" : 6
    "Q4" : 5
```

### Most popular 

* Day: 1 (16)
* Month: Jun (4)
* Year: 2016 (3)
* Day of week: Monday (13)

### Duration histogram

```mermaid
xychart-beta
    title "Reorg Duration Distribution (days)"
    x-axis ["62-78", "78-94", "94-110", "110-126", "126-142", "142-158", "158-174", "174-190"]
    y-axis "Count" 0 --> 13
    bar [1, 3, 0, 7, 0, 12, 0, 2]
```

### Reorg timeline

```mermaid
gantt
    title Org Structure Timeline
    dateFormat YYYY-MM-DD
    axisFormat %Y
    Reorg 1 :2015-01-05, 2015-06-01
    Reorg 2 :2015-06-01, 2015-11-02
    Reorg 3 :2015-11-02, 2016-03-01
    Reorg 4 :2016-03-01, 2016-07-01
    Reorg 5 :2016-07-01, 2016-12-01
    Reorg 6 :2016-12-01, 2017-04-03
    Reorg 7 :2017-04-03, 2017-08-01
    Reorg 8 :2017-08-01, 2018-02-01
    Reorg 9 :2018-02-01, 2018-05-01
    Reorg 10 :2018-05-01, 2018-07-02
    Reorg 11 :2018-07-02, 2019-01-07
    Reorg 12 :2019-01-07, 2019-06-03
    Reorg 13 :2019-06-03, 2019-11-01
    Reorg 14 :2019-11-01, 2020-04-01
    Reorg 15 :2020-04-01, 2020-09-01
    Reorg 16 :2020-09-01, 2021-02-01
    Reorg 17 :2021-02-01, 2021-05-03
    Reorg 18 :2021-05-03, 2021-10-01
    Reorg 19 :2021-10-01, 2022-03-01
    Reorg 20 :2022-03-01, 2022-08-01
    Reorg 21 :2022-08-01, 2023-01-02
    Reorg 22 :2023-01-02, 2023-06-01
    Reorg 23 :2023-06-01, 2023-10-02
    Reorg 24 :2023-10-02, 2024-02-01
    Reorg 25 :2024-02-01, 2024-06-03
    Reorg 26 :2024-06-03, 2024-09-02
    Reorg 27 :2024-09-02, 2024-12-02
```

### Kaplan-Meier survival curve

```mermaid
xychart-beta
    title "Reorg Survival Probability"
    x-axis "Days" [0, 62, 89, 91, 120, 122, 123, 147, 150, 151, 152, 153, 154, 184, 189]
    y-axis "Survival %" 0 --> 100
    line [100, 96, 92, 84, 76, 68, 56, 52, 48, 36, 32, 16, 8, 4, 0]
```

### Hazard function

```mermaid
xychart-beta
    title "Reorg Hazard Rate h(t)"
    x-axis "Days" [1, 4, 7, 10, 13, 16, 19, 22, 25, 28, 31, 34, 37, 40, 43, 46, 49, 52, 55, 58, 61, 64, 67, 70, 73, 76, 79, 82, 85, 88, 91, 94, 97, 100, 103, 106, 109, 112, 115, 118, 121, 124, 127, 130, 133, 136, 139, 142, 145, 148, 151, 154, 157, 160, 163, 166, 169, 172, 175, 178, 181, 184, 187, 190]
    y-axis "Hazard"
    line [0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0.0001, 0.0001, 0.0001, 0.0002, 0.0003, 0.0003, 0.0004, 0.0006, 0.0007, 0.0009, 0.0011, 0.0013, 0.0016, 0.0019, 0.0023, 0.0027, 0.0032, 0.0037, 0.0043, 0.005, 0.0058, 0.0067, 0.0076, 0.0087, 0.0098, 0.0111, 0.0126, 0.0141, 0.0158, 0.0177, 0.0197, 0.0219, 0.0244, 0.027, 0.0298, 0.0328, 0.0361, 0.0396, 0.0434, 0.0474, 0.0518, 0.0564, 0.0614, 0.0667, 0.0724, 0.0784, 0.0848, 0.0917, 0.0989, 0.1066, 0.1147, 0.1233]
```

### Distribution fitting

| Model | Parameters | AIC | Selected |
|-------|-----------|-----|----------|
| Lognormal | μ=4.88, σ=0.25 | 249 |  |
| Weibull | k=5.55, λ=146.6 | 242.2 | ✅ |

### Bootstrap confidence intervals (10,000 resamples)

| Statistic | Estimate | 80% CI | 95% CI | SE |
|-----------|----------|--------|--------|-----|
| Mean | 4 months, and 2 weeks | 4 months, and 1 week – 4 months, 3 weeks, and 1 day | 4 months, and 2 days – 4 months, 3 weeks, and 5 days | 6 days |
| Median | 4 months, and 3 weeks | 4 months, and 2 days – 4 months, 4 weeks, and 2 days | 4 months, and 1 day – 5 months, and 1 day | 1 week, and 5 days |

### Monte Carlo simulation (10,000 iterations)

* **Median prediction**: 2025-01-17 (1 month, 2 weeks, and 1 day from now)
* **80% CI**: 2024-12-08 to 2025-02-19
* **95% CI**: 2024-11-16 to 2025-03-06
* Predicted duration: 4 months, and 2 weeks ± 4 weeks

### Forecast ensemble (7 models)

| Model | Prediction | Weight | Description |
|-------|-----------|--------|-------------|
| Historical Mean | 2025-01-15 | 9% | Average of 25 past durations |
| Historical Median | 2025-01-30 | 14% | Robust central tendency |
| Exponential Weighted | 2025-01-14 | 18% | Recency-weighted average with exponential decay |
| Linear Trend | 2025-01-11 | 9% | Linear regression extrapolation of duration trend |
| Lognormal MLE | 2025-01-12 | 9% | Lognormal(μ=4.88, σ=0.25) |
| Weibull MLE | 2025-01-17 | 18% | Weibull(k=5.55, λ=146.6) |
| Monte Carlo | 2025-01-17 | 23% | 10,000 simulations |

* **🎯 Ensemble prediction**: 2025-01-17 (1 month, 2 weeks, and 1 day from now)
* Model agreement: 94% (spread: 19 days)

### Next reorg predictions (classic)

* Min: 2024-11-03 (4 weeks, and 1 day ago)
* Max: 2025-03-10 (3 months, and 1 week from now)
* Mean: 2025-01-15 (1 month, 1 week, and 6 days from now)
* Median: 2025-01-30 (1 month, and 4 weeks from now)
* Q1: 2025-01-02 (1 month from now)
* Q3: 2025-02-02 (2 months, and 2 days from now)
* **80% Parametric CI**: 2025-01-03 to 2025-01-20

### Risk score decomposition

| Component | Score | Weight |
|-----------|-------|--------|
| Kaplan-Meier survival | 16/100 | 25% |
| Lognormal model | 89/100 | 20% |
| Weibull model | 96/100 | 20% |
| Trend analysis | 51/100 | 10% |
| Recency | 30/100 | 10% |
| Percentile rank | 16/100 | 15% |
| **Composite** | **🟠 51/100** | |

### Information theory

* Shannon entropy: 2.179 bits
* Normalized entropy: 0.656 (moderate disorder)
* Gini impurity: 0.733
* Effective number of states: 4.53

### Serial correlation

* Lag-1 autocorrelation: -0.088
* Lag-2 autocorrelation: -0.276
* Lag-3 autocorrelation: 0.237
* Ljung-Box test: Q=4.163, p=0.2444 → Durations are independent ✅

### Poisson process test

* Observed rate: 0.0069 events/day
* Dispersion index: 6.56 (overdispersed — clustered events)
* χ² statistic: 0.4, p=0.9825
* Verdict: Not a homogeneous Poisson process ⚠️


---

## Managers

```
 *   *  *         *  *  *            *   *   *          *     *   *       *     *     *   
|------------------------------------------------------------------------------------------|
 2015    2016    2017    2018    2019    2020    2021    2022     2023    2024  

```

### Descriptive statistics

| Metric | Value |
|--------|-------|
| Count | 14 |
| Min | 3 months, 4 weeks, and 1 day |
| Max | 1 year, 5 months, and 1 week |
| Mean | 8 months, and 2 days |
| Median | 6 months, 2 weeks, and 2 days |
| Q1 (25th percentile) | 4 months, 3 weeks, and 6 days |
| Q3 (75th percentile) | 9 months, 3 weeks, and 4 days |
| Std deviation | 4 months, 1 week, and 4 days |
| Skewness | 1.04 (right-skewed) |
| Coefficient of variation | 54% (high variability) |
| Churn rate | 1.3/year (last 3 years: 1.3/year) |

### Current status

* Last manager change: 6 months ago ✅ — longer than 50% of historical tenures
* Longest ever gap: 1 year, 5 months, and 1 week
* Per-cycle trend: Getting less frequent (5.3 more days per cycle) (R²=0.028)
* Calendar trend: Stable
* Weighted recent average: 8 months, 1 week, and 1 day

### Manager change probability

| Window | Probability |
|--------|------------|
| Next 30 days | 19% |
| Next 60 days | 35% |
| Next 90 days | 49% |
| Next 180 days | 76% |

### Managers by tenure


| Manager | Tenure |
|---------|--------|
| @katherine | 1 year, 5 months, and 1 week |
| @guido | 1 year, 3 months, and 2 days |
| @linus | 1 year, 4 weeks, and 1 day |
| @ada | 1 year, 3 weeks, and 5 days |
| @grace | 11 months, and 1 day |
| @edsger | 10 months, and 2 days |
| @hedy | 8 months, 4 weeks, and 1 day |
| @dennis | 7 months, 4 weeks, and 1 day |
| @tim | 4 months, 4 weeks, and 2 days |
| @barbara | 4 months, 4 weeks, and 2 days |
| @donald | 4 months, 3 weeks, and 5 days |
| @margaret | 4 months, and 2 days |
| @ken | 3 months, 4 weeks, and 1 day |

### Duration histogram

```mermaid
xychart-beta
    title "Manager Stint Duration Distribution (days)"
    x-axis ["120-171", "171-222", "222-273", "273-324", "324-375", "375-426", "426-477", "477-528"]
    y-axis "Count" 0 --> 8
    bar [7, 0, 2, 2, 0, 1, 1, 1]
```

### Manager timeline

```mermaid
gantt
    title Manager Timeline
    dateFormat YYYY-MM-DD
    axisFormat %Y
    @ada :2015-01-05, 2015-06-01
    @grace :2015-06-01, 2015-11-02
    @linus :2015-11-02, 2016-12-01
    @margaret :2016-12-01, 2017-04-03
    @ken :2017-04-03, 2017-08-01
    @katherine :2017-08-01, 2019-01-07
    @donald :2019-01-07, 2019-06-03
    @tim :2019-06-03, 2019-11-01
    @guido :2019-11-01, 2021-02-01
    @dennis :2021-02-01, 2021-10-01
    @barbara :2021-10-01, 2022-03-01
    @edsger :2022-03-01, 2023-01-02
    @hedy :2023-01-02, 2023-10-02
    @ada :2023-10-02, 2024-06-03
    @grace :2024-06-03, 2024-12-02
```

### Kaplan-Meier survival curve

```mermaid
xychart-beta
    title "Manager Survival Probability"
    x-axis "Days" [0, 120, 123, 147, 151, 154, 242, 245, 273, 307, 395, 458, 524]
    y-axis "Survival %" 0 --> 100
    line [100, 93, 86, 71, 57, 50, 43, 36, 29, 21, 14, 7, 0]
```

### Hazard function

```mermaid
xychart-beta
    title "Manager Hazard Rate h(t)"
    x-axis "Days" [1, 11, 21, 31, 41, 51, 61, 71, 81, 91, 101, 111, 121, 131, 141, 151, 161, 171, 181, 191, 201, 211, 221, 231, 241, 251, 261, 271, 281, 291, 301, 311, 321, 331, 341, 351, 361, 371, 381, 391, 401, 411, 421, 431, 441, 451, 461, 471, 481, 491, 501, 511, 521, 531]
    y-axis "Hazard"
    line [0, 0.0002, 0.0004, 0.0007, 0.0009, 0.0012, 0.0014, 0.0017, 0.0019, 0.0022, 0.0025, 0.0027, 0.003, 0.0033, 0.0036, 0.0038, 0.0041, 0.0044, 0.0047, 0.005, 0.0052, 0.0055, 0.0058, 0.0061, 0.0064, 0.0067, 0.007, 0.0072, 0.0075, 0.0078, 0.0081, 0.0084, 0.0087, 0.009, 0.0093, 0.0096, 0.0099, 0.0102, 0.0105, 0.0108, 0.0111, 0.0114, 0.0117, 0.012, 0.0123, 0.0126, 0.0129, 0.0132, 0.0135, 0.0138, 0.0141, 0.0145, 0.0148, 0.0151]
```

### Distribution fitting

| Model | Parameters | AIC | Selected |
|-------|-----------|-----|----------|
| Lognormal | μ=5.38, σ=0.5 | 174 | ✅ |
| Weibull | k=2.09, λ=279.2 | 176.7 |  |

### Bootstrap confidence intervals (10,000 resamples)

| Statistic | Estimate | 80% CI | 95% CI | SE |
|-----------|----------|--------|--------|-----|
| Mean | 8 months, and 1 day | 6 months, 2 weeks, and 6 days – 9 months, 2 weeks, and 2 days | 6 months, and 2 days – 10 months, 1 week, and 4 days | 1 month, and 3 days |
| Median | 6 months, and 3 weeks | 4 months, 4 weeks, and 2 days – 8 months, 4 weeks, and 1 day | 4 months, 3 weeks, and 5 days – 10 months, and 2 days | 1 month, 2 weeks, and 6 days |

### Monte Carlo simulation (10,000 iterations)

* **Median prediction**: 2025-01-08 (1 month, and 6 days from now)
* **80% CI**: 2024-09-26 to 2025-07-24
* **95% CI**: 2024-08-23 to 2025-12-29

### Forecast ensemble (7 models)

| Model | Prediction | Weight | Description |
|-------|-----------|--------|-------------|
| Historical Mean | 2025-02-04 | 9% | Average of 14 past durations |
| Historical Median | 2024-12-18 | 14% | Robust central tendency |
| Exponential Weighted | 2025-02-10 | 18% | Recency-weighted average with exponential decay |
| Linear Trend | 2025-03-15 | 9% | Linear regression extrapolation of duration trend |
| Lognormal MLE | 2025-01-06 | 18% | Lognormal(μ=5.38, σ=0.50) |
| Weibull MLE | 2025-01-23 | 9% | Weibull(k=2.09, λ=279.2) |
| Monte Carlo | 2025-01-08 | 23% | 10,000 simulations |

* **🎯 Ensemble prediction**: 2025-01-20 (1 month, 2 weeks, and 4 days from now)
* Model agreement: 72% (spread: 87 days)

### Most popular 

* Day: 1 (7)
* Month: Jan (3)
* Year: 2015 (3)
* Day of week: Monday (10)

### Risk score decomposition

| Component | Score | Weight |
|-----------|-------|--------|
| Kaplan-Meier survival | 50/100 | 25% |
| Lognormal model | 49/100 | 20% |
| Weibull model | 42/100 | 20% |
| Trend analysis | 39/100 | 10% |
| Recency | 46/100 | 10% |
| Percentile rank | 50/100 | 15% |
| **Composite** | **🟠 47/100** | |

### Information theory

* Shannon entropy: 2.064 bits
* Normalized entropy: 0.621
* Gini impurity: 0.684
* Effective states: 4.18

### Serial correlation

* Lag-1 autocorrelation: -0.377 ⚠️ significant
* Ljung-Box: Q=18.794, p=0.0003 → Dependent ⚠️

### Poisson process test

* Dispersion index: 70.82
* χ² test: p=0.9311 → Not Poisson ⚠️


---

## About

Everything above is generated from [`managers.csv`](managers.csv), a tiny CSV where
each row is a reorg (a change to your reporting line or org structure). The bundled
data is **synthetic sample data** — invented names, dates, and events — so the whole
thing runs and renders out of the box.

### Run it on your own data

```bash
npm install
# edit managers.csv with your own reorg history
npm start        # regenerates this README.md
```

Each row of `managers.csv` has: `date` (YYYY-MM-DD of the reorg), `manager`
(your manager's handle), `stepmanager` (their manager), `duration` (a human-readable
label — cosmetic), `rung` (how many levels to the top), and `notes` (freeform).
Consecutive rows with the same `manager` are collapsed into a single stint. By
default the analysis is frozen to a fixed end date (`END_DATE` in
[`src/context.ts`](src/context.ts)); set it to `null` to compute against today.

### Development

```bash
npm test              # run the test suite
npm run lint          # eslint
npm run format:check  # prettier
```

---

*Generated with 10,000 Monte Carlo simulations, bootstrap resampling, Weibull MLE, Kaplan-Meier survival analysis, CUSUM changepoint detection, Shannon entropy, Ljung-Box serial correlation testing, Poisson process goodness-of-fit, and a 6-model forecast ensemble. Because why not.*
