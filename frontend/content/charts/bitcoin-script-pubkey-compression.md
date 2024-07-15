---
title: "Public Key Compression (ECDSA)"
draft: false
author: "0xb10c"
categories: "Bitcoin Script"
position: 2
tags: [PubKey, Compression, ECDSA]
thumbnail: bitcoin-script-pubkey-compression.png
chartJS: bitcoin-script-pubkey-compression.js
images:
  - /img/chart-thumbnails/bitcoin-script-pubkey-compression.png
---

Shows the distribution between uncompressed and compressed ECDSA public keys.
<!--more-->

ECDSA public keys appear in inputs (e.g. P2PKH, P2WPKH, P2WSH with multisig...) and outputs (P2PK and P2MS).
The public keys can be encoded in 65 bytes or in 33 bytes by leaving out redundant information.
65 byte public keys are called uncompressed and 33 byte public keys are called compressed public keys.
The transition from uncompressed to compressed public keys started in early 2012 with the release of [Bitcoin QT v0.6.0](https://bitcoin.org/en/release/v0.6.0).

The chart shows percentage of public keys for both compressed and uncompressed public keys in inputs and outputs.
Denominator is the sum of all public keys on a given day.

**Note**: A earlier version of this chart reported only public keys in inputs. This was changed mid March 2020.

Schnoor public keys are encoded in 32 bytes. They are not counted here.