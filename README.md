# Footron experiences

This repository is responsible for keeping track of current configurations for experiences.
Videos and Dockerfiles are not included. Files for web experiences are usually included where a build step is not required.

## How experiences get built

The `build-experiences` workflow runs on every push and pull request:

1. `clone_remote_experiences.py` clones each entry in `experiences.toml` at its pinned
   commit, then appends every directory already present under `experiences/`. Vendored
   experiences therefore need no `experiences.toml` entry — being on disk is enough.
2. `build_experiences.py` builds each one. `config.json` (or `config.toml`) is required.
   Unless the config sets `unlisted`, both `wide.jpg` and `thumb.jpg` are required and a
   missing one fails the build. A `web/` directory is copied to `static/`; if it contains
   a `package.json`, `npm install && npm run build` runs first and the output is taken
   from `directories.footronStatic`, defaulting to `web/build`.
3. `generate_experience_hashes.py` writes `build/hashes.json`, and `build/` is uploaded
   as the `experiences` artifact.

An experience only reaches the wall once a build has run on the branch it was merged
into. Landing files on a branch is not on its own enough — if the push that merged them
produced no workflow run, the most recent artifact still predates the experience, and it
will not appear. Check that a run exists for the merge commit.

Listing an experience in the launcher is separate from building it: add its `id` to the
relevant list in `tags.toml`.
