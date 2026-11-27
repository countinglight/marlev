# Website images

These assets are already included and referenced by the HTML pages:

- `Practice_Banner1.gif`: shared header banner
- `LeraWeb5.JPG`: practitioner portrait (used by the site)
- `LeraWeb5.jpeg`: additional copy of the portrait
- `bottles2.jpg`: homeopathy vials
- `Iceberg.jpg`: illustration on the about page
- `Library.jpg`: resources illustration
- `flu.gif`: acute conditions illustration

Preserve exact filename capitalization: production hosting is case-sensitive.
For replacements, use an appropriate image size, retain meaningful alt text,
and check every affected page at desktop and mobile widths. Remove an old asset
only after checking it has no remaining references. Run
`python3 scripts/check_site.py` from the repository root after editing references.
