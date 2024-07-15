---
title: "Payments per Day"
draft: false
author: "0xb10c"
aliases:
    - /charts/payments/perDay
categories: Payments
position: 2
tags: ["Per-Day"]
thumbnail: payments-per-day.png
chartJS: payments-per-day.js
images:
  - /img/chart-thumbnails/payments-per-day.png
---

Shows the number of payments per day.
<!--more-->

A Bitcoin transaction can have multiple outputs and can thus transfer funds to multiple recipients.
This practice is called payment batching.
Since an input can only be spent in its entirety, one transaction output is usually (but not always) a so-called change output.
It transfers the change back to the payer.

The payments metric counts the number of outputs a transaction has and subtracts one to exclude the change output.
If a transaction has only one output, then it's counted as one payment.
The purpose of this metric is to provide a more accurate representation of real economic activity on the Bitcoin network.
