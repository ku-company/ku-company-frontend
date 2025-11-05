# Page snapshot

```yaml
- generic [active] [ref=e1]:
  - banner [ref=e2]:
    - generic [ref=e3]:
      - link "KU-COMPANY" [ref=e4] [cursor=pointer]:
        - /url: /
      - textbox "SEARCH" [ref=e6]
      - navigation [ref=e7]:
        - link "HOME" [ref=e8] [cursor=pointer]:
          - /url: /
        - link "FIND JOB" [ref=e9] [cursor=pointer]:
          - /url: /find-job
        - link "ANNOUNCEMENT" [ref=e10] [cursor=pointer]:
          - /url: /professor-annoucement
      - generic [ref=e11]:
        - generic [ref=e12]: Professor
        - button "prof1 avatar" [ref=e13] [cursor=pointer]:
          - img "prof1 avatar" [ref=e14]
  - button "Open Next.js Dev Tools" [ref=e20] [cursor=pointer]:
    - img [ref=e21]
  - alert [ref=e24]
  - main [ref=e25]:
    - main [ref=e26]:
      - heading "Professor Announcements" [level=1] [ref=e27]
      - generic [ref=e28]:
        - textbox "Share an announcement…" [ref=e29]
        - button "Post" [disabled] [ref=e31]
      - paragraph [ref=e33]: No announcements yet.
```