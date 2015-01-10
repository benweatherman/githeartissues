
### Motivation
At ordoro, we file all issues in a single repo. Our milestones are just our teams. When we figure out the next issues to work on, we assign said issues to the team's milestone. This is perfect, except it's hard to tell what the top priority is when we've got a few issues ready to work on.

This page will load all the milestones in a nice kanban-ish card layout. You can then re-order them, assign them to other milestones, and change the assignee.

We've always loved using github issues. Now we ♥ using it.


#### Demo

Check out http://benweatherman.github.io/githeartissues/


#### Building

```bash
./bootstrap.sh
gulp build watch
open dist/html/app.html
```


#### Deploying

```bash
gulp bump
gulp deploy
```
