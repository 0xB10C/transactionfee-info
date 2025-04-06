---
title: "log2(work) per block"
draft: false
author: "0xb10c"
categories: "Mining"
categories_weight: 0
tags: ["mining", "hashrate", "work"]
thumbnail: mining-log2-work.png
chartJS: mining-log2-work.js
images:
  - /img/chart-thumbnails/mining-log2-work.png
---

Shows the log2(work) required to mine a block.

<!--more-->

log2(work) is the 2-logarithm of the expected number of block header hash
attempts (work) that were necessary the build a block. For example, on
2023-01-01 the log2(work) required for a block was about 77. This means
that 2⁷⁷ = 1.5111 x 10²³ block hash attempts (each roughly a double-SHA256
operation) would need to be done to mine a block then.

Note that this metric shouldn't be confused with the `log2_work` output of Bitcoin Core,
which is cumulative work required to build the chain up to a certain block.
See also: [What does `log2_work` in Bitcoin Core's output mean?](https://bitcoin.stackexchange.com/questions/116485/what-does-log2-work-in-bitcoin-cores-output-mean).
