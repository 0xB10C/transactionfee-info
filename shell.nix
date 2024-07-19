{ pkgs ? import <nixpkgs> {} }:

pkgs.mkShell {
    nativeBuildInputs = [
      # backend
      pkgs.cargo
      pkgs.rustc
      pkgs.rustfmt
      pkgs.sqlite

      # frontend
      pkgs.optipng
    ];
}
