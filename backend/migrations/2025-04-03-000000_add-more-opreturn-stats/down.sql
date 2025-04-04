ALTER TABLE output_stats
  DROP COLUMN outputs_opreturn_omnilayer;

ALTER TABLE output_stats
  DROP COLUMN outputs_opreturn_stacks_block_commit;

ALTER TABLE output_stats
  DROP COLUMN outputs_opreturn_bip47_payment_code;

ALTER TABLE output_stats
  DROP COLUMN outputs_opreturn_coinbase_rsk;

ALTER TABLE output_stats
  DROP COLUMN outputs_opreturn_coinbase_coredao;

ALTER TABLE output_stats
  DROP COLUMN outputs_opreturn_coinbase_exsat;

ALTER TABLE output_stats
  DROP COLUMN outputs_opreturn_coinbase_hathor;

ALTER TABLE output_stats
  DROP COLUMN outputs_opreturn_coinbase_witness_commitment;

ALTER TABLE output_stats
  DROP COLUMN outputs_opreturn_runestone;
