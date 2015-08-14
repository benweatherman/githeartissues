
### A peek behind the kimono
![hai](https://cloud.githubusercontent.com/assets/272675/6013743/64db402a-ab1e-11e4-9dff-1f5c26b8aeb5.png)

#### Demo

Check it out for yourself https://benweatherman.github.io/githeartissues/

### Hai

I love github issues. I love the trello UI. But all the ways of making them play together really suck. So I made git♥issues to combine the awesomeness of github issues with the awesomeness of drag and drop.

There are a few benefits to using git♥issues:

1. __Drag/drop UI__ Your issue and milestone data is loaded directly from the github API. You can use our drag/drop interface to change issue prioritization within a milestone or drag an issue to a completely new milestone.
2. __Prioritization__ It saves your issues in order so you can prioritize them for your team.
3. __Batch modification__ Make a bunch of changes to priorities, milestones, assignees, etc and then save them all at once. This also creates a nicely diffable file that can be used to track how priorities change over time and who's changing them.
4. __Serverless__ It's all loaded directly from the github API so there's no infrastructure to maintain (except for what the awesome github folks already do obvi). It also shows I'm not leaving your c0dez on a bunch of insecure servers. Even the prioritization info is saved as file in github!


#### Building

```bash
./bootstrap.sh
gulp build watch
open dist/html/app.html
```
