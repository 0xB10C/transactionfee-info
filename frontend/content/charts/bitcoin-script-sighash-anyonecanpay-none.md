---
title: "SigHash NONE | ACP"
draft: false
author: "0xb10c"
categories: "Bitcoin Script"
categories_weight: 10
tags: [SigHash, SigHash-NONE, SigHash-ANYONECANPAY]
thumbnail: bitcoin-script-sighash-anyonecanpay-none.png
chartJS: bitcoin-script-sighash-anyonecanpay-none.js
images:
  - /img/chart-thumbnails/bitcoin-script-sighash-anyonecanpay-none.png
---

Shows the number of signatures with the `NONE | ANYONECANPAY` SigHash per day.
<!--more-->

The SigHash `NONE | ANYONECANPAY` `(0x82)` signs only the input the signature is included in.
Everybody can use this input and spend it to a output of their choice.
Read more about SigHashes in [Bitcoin's Signature Types - SIGHASH (2018)](https://raghavsood.com/blog/2018/06/10/bitcoin-signature-types-sighash).
