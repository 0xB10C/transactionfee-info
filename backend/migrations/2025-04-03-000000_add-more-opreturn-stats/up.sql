ALTER TABLE output_stats
  ADD COLUMN outputs_opreturn_omnilayer INTEGER NOT NULL DEFAULT (0);

ALTER TABLE output_stats
  ADD COLUMN outputs_opreturn_stacks_block_commit INTEGER NOT NULL DEFAULT (0);

ALTER TABLE output_stats
  ADD COLUMN outputs_opreturn_bip47_payment_code INTEGER NOT NULL DEFAULT (0);

ALTER TABLE output_stats
  ADD COLUMN outputs_opreturn_coinbase_rsk INTEGER NOT NULL DEFAULT (0);

ALTER TABLE output_stats
  ADD COLUMN outputs_opreturn_coinbase_coredao INTEGER NOT NULL DEFAULT (0);

ALTER TABLE output_stats
  ADD COLUMN outputs_opreturn_coinbase_exsat INTEGER NOT NULL DEFAULT (0);

ALTER TABLE output_stats
  ADD COLUMN outputs_opreturn_coinbase_hathor INTEGER NOT NULL DEFAULT (0);

ALTER TABLE output_stats
  ADD COLUMN outputs_opreturn_coinbase_witness_commitment INTEGER NOT NULL DEFAULT (0);

ALTER TABLE output_stats
  ADD COLUMN outputs_opreturn_runestone INTEGER NOT NULL DEFAULT (0);
