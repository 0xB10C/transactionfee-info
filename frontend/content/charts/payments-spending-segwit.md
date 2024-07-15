---
title: "SegWit spending Payments"
draft: false
author: "0xb10c"
aliases: 
    - /charts/payments/segwit
categories: Payments
position: 0
tags: [SegWit]
thumbnail: payments-spending-segwit.png
chartJS: payments-spending-segwit.js
images:
  - /img/chart-thumbnails/payments-spending-segwit.png
---

Shows the percentage of payments spending SegWit per day.
<!--more-->

A Bitcoin transaction can have multiple outputs and can thus transfer funds to multiple recipients.
This practice is called payment batching.
Since an input can only be spent in its entirety, one transaction output is usually (but not always) a so-called change output.
It transfers the change back to the payer.

The payments metric counts the number of outputs a transaction has and subtracts one to exclude the change output.
If a transaction has only one output, then it's counted as one payment.
The purpose of this metric is to provide a more accurate representation of real economic activity on the Bitcoin network.

A transaction that spends one or more SegWit outputs is considered a SegWit-spending-transaction.
Payments from from SegWit-spending-transactions are aggregated per day and divided by the total payments per day resulting in the percentage of SegWit-spending payments.
The intent is to provide a more thorough metric for SegWit adoption with ongoing payment batching.
The [SegWit-spending-Transactions](/charts/transactions-spending-segwit/) metric is differs from the Payments-spending-SegWit metric.

**Note:**
This metric and chart previously included OP_RETURN outputs.
These are not accounted for anymore.
