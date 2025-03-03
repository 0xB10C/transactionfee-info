{ pkgs ? import <nixpkgs> {} }:

pkgs.mkShell {
    nativeBuildInputs = [
      # backend
      pkgs.cargo
      pkgs.rustc
      pkgs.rustfmt
      pkgs.sqlite
      pkgs.diesel-cli

      # frontend
      pkgs.hugo
      pkgs.optipng
    ];
}
