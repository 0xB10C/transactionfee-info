---
title: "Transactions with unenforced locktimes"
draft: false
author: "0xb10c"
categories: Transactions
categories_weight: 0
tags: [Locktime]
thumbnail: transactions-not-enforced-locktime.png
chartJS: transactions-not-enforced-locktime.js
images:
  - /img/chart-thumbnails/transactions-not-enforced-locktime.png
---

Shows transactions with unenforced locktimes.
<!--more-->

A transaction-level time lock to a specific height or timestamp requires that at
least one transaction input has a `sequence` with a value below `0xFFFFFFFF`.
To learn more about this metric read
[The stair-pattern in time-locked Bitcoin transactions: The off-by-one-error that covered another off-by-one-error up](https://b10c.me/mempool-observations/1-locktime-stairs/).