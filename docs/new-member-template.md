+++
# HOW TO ADD A LAB MEMBER
# 1. Copy this file to content/members/<lastname>.md  (e.g. smith.md).
# 2. Put a square-ish photo at static/img/people/<lastname>.jpg.
# 3. Fill in the fields below and write a short bio underneath.
title = "Jane Smith"
weight = 20            # not used on the People page, which sorts by last_name
[extra]
first_name = "Jane"
last_name = "Smith"
position = "Ph.D. student, Biology"
category = "grad"      # pi | postdoc | grad | undergrad | staff | alumni (not shown on the People page)
image = "img/people/smith.jpg"
image_thumbnail = "img/people/smith.jpg"
# Optional `icon` per link: see the list of icons in config.toml.
links = [ { name = "jane_smith@baylor.edu", url = "mailto:jane_smith@baylor.edu", icon = "email" } ]
# For alumni, optionally link to their current page instead of a bio page:
# url = "https://example.org"
+++

Jane is interested in ...

## Publications

{{<list_publications member="smith" />}}
