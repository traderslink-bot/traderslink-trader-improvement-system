# V3 Journal Preview Workflow

## Approved Design

- The Day Session execution-entry card design is approved. Preserve the
  Buy/Sell entry flow, removable execution rows, and full-width `Add execution`
  action unless the user requests a design change.

## Single-Source Test-Site Rule

- There must be only one server location for the V3 test website. Do not
  create, deploy to, or maintain a second test-site project, alternate server
  copy, or parallel preview version.
- This computer's main V3 version is the sole source that may update the server
  test site. Codex builds pages and features locally, and the user approves
  them before they go to that one final test site.
- After approval, a change may remain on the final test site or return to the
  computer for revision. Do not treat a server-side copy as an independent
  development source.
