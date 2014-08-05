
### Motivation
At ordoro, we file all issues in a single repo. Our milestones are just our teams. When we figure out the next issues to work on, we assign said issues to the team's milestone. This is perfect, except it's hard to tell what the top priority is when we've got a few issues ready to work on.

With this Chrome extension, we'll load all the milestones in a nice kanban-ish card layout. You can then re-order them, assign them to other teams, and (eventually) changed the assignee.♥ github

We've always loved using github issues. Now we ♥ using it.

#### Demo

Check out http://benweatherman.github.io/githeartissues/ (make sure you follow the configuring section)


#### Configuring

You'll need to set some params before anything will load
```js
localStorage.setItem('git♥issues:token', '<Github API Key>');  // Generate one at https://github.com/settings/tokens/new
localStorage.setItem('git♥issues:repo', '<Github Repo>');  // e.g. ordoro/ordoro
localStorage.setItem('git♥issues:parseAppID', '<Parse App ID>');
localStorage.setItem('git♥issues:parseKey', '<Parse Key>');
```


#### Building

Build everything
```bash
./bootstrap.sh
gulp build watch
```

open up `dist/html/app.html`
