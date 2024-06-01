## Setup

First off, you may want to see [why would I use worktree](https://stackoverflow.com/questions/31935776/what-would-i-use-git-worktree-for).

There are many ways to setup. The following lines is mostly based on "How I use Git Worktrees in my developer workflow" by Nick Nissi (link to [blog](https://nicknisi.com/posts/git-worktrees/)).

```bash
git init --bare .bare
echo "gitdir: ./.bare" > .git
```

Notes:

- By default vscode doesn't show `.git` file. According to [this SO](https://stackoverflow.com/questions/40818354/visual-studio-code-git-folder-file-hidden), you must add `"files.exclude"` to user or workspace settings. See `.vscode` folder.

- If you are setting up a git server you may want to add `--shared=group`. Read more on [Git on the Server](https://git-scm.com/book/en/v2/Git-on-the-Server-Getting-Git-on-a-Server), this [SO about pushing from one machine to bare repo](https://stackoverflow.com/questions/7632454/how-do-you-use-git-bare-init-repository) and this [SO about shared team repo](https://stackoverflow.com/questions/315911/git-for-beginners-the-definitive-practical-guide/2964397#2964397).

Anyway, let's move on...

```bash
git worktree list
# prints: /home/.../play-git/.bare  (bare)
```

So there are no worktrees at the moment. See [torek's answer](https://stackoverflow.com/a/54408181) for a comprehensive explanation on worktrees. It explains why sometimes --bare goes wrong. Basically for **cloning** a repo it suggests to to do these steps (which is similar to what we have done):

```bash
git clone --bare ssh://git@git.example.com/project/repo repo.git
cd repo.git
git config remote.origin.fetch '+refs/heads/*:refs/remotes/origin/*'
git fetch
git for-each-ref --format='%(refname:short)' refs/heads | xargs git branch -d
```

</br>

## First commit

```bash
git worktree add master
cd master
git branch -m main
# now that we have renamed the branch from master to main, let's
# rename the folder too.
cd ..
mv master main

# Finally, we can now create a file and commit to our repository.
cd main
echo "file 1 ver 1" > f1.txt
git status

git add .
git commit -m "add f1"

echo "ignored-file.txt" > .gitignore
git add .
git commit -m "add gitignore"
```

## New Branch and Commit

Now let's create a new branch from current HEAD. Note, we assume you are still in `main` folder (directory).

```bash
git branch feature/f2
git worktree add ../f2 feature/f2
cd ..
cd f2

ls
# lists: f1.txt and .gitignore

# append to the end of f1
echo "file 1 from feature/f2" >> f1.txt

git add .
git commit -m "update f1 from feature/f2"
```

## Back to `main` and Merge

Let's go back to main and merge (fast-forward).

```bash
cd ..
cd main
git merge feature/f2
```

But imagine we don't want fast-forward. So let's get rid of this merge and merge again with no fast-forward.

```bash
git reset --soft HEAD~1
# this fails
git merge feature/f2 --no-ff
# error: Your local changes to the following files would be overwritten by merge
```

So let's get back to merged state again and do hard reset.

```bash
git reflog
# instead of HEAD@{2} write the one that denotes the merged state
git checkout HEAD@{2}

# We're now in detached HEAD.

# Let's make sure we've checked out the correct commit.
git log

git reset --hard HEAD~1
# NOTE: we're still in detached HEAD.

git merge feature/f2 --no-ff

# main is behind this current HEAD, so let's bring main to here
git checkout main
# command above gives warning as well commit hash

git merge c654a37 --ff-only
```

So now everything should be fine.

### New Branch based on `origin/main`

BTW you can also create branch directly using `worktree add`. Assuming you are in **root** folder (**not** inside any worktree folder), you can run:

```bash
git worktree add -b ag/new-feature new-feature origin/main
cd new-feature
```

For removing:

```bash
# Read note below
git worktree remove new-feature

# Corresponding branch is NOT automatically deleted.
# If you want to remove local branch:
git branch -d ag/new-feature
```

Note: According to [git worktree example](https://git-scm.com/docs/git-worktree#_examples) you should specify `<path>` instead of name

### Throwaway Branch

On the other hand, if you just plan to make some experimental changes or do testing without disturbing existing development, it is often convenient to create a throwaway worktree not associated with any branch. For instance, `git worktree add -d <path>` creates a new worktree with a detached HEAD at **the same commit** as the **current branch**. (Based on git worktree official docs)  

</br>

</br>

## Accidentally Adding to `main` and Story Begins

We assume you are in main folder.

```bash
echo "file 1 ver 2" > f1.txt
echo "file 2" > f2.txt

git add .
git commit -m "accidentally on main: add f2, change f1"
```

Now let's recover from these situation using `cherry-pick`:

```bash
cd ..
cd f2

# 🚨 WARNING: See Note 1 below.
git cherry-pick $(git rev-parse main)
```

BTW, you could simply write `main` instead of using rev-parse (according to [git cherry-pick examples](https://git-scm.com/docs/git-cherry-pick#_examples)).

**Note 1:** Differences in files does **not** produce conflicts and overrides if commits for that file is in your branch prior your changes. Conflicts appear for the commits that are for the same place but in different branches that are being merged (based on [this reddit answer](https://www.reddit.com/r/learnprogramming/comments/v33evr/comment/iaw0bc1/?utm_source=share&utm_medium=web3x&utm_name=web3xcss&utm_term=1&utm_content=share_button)). So `cherry-pick` above will overwrite contents of f1.txt **without** any warnings.

We realize that we have overwritten contents of `f1.txt`. But we have previous contents. What we want is to have both at the same time and choose which one to commit. We can do the following:

```bash
git reset --hard HEAD~1
git cherry-pick --no-commit main
# Now, changes are staged but not committed.
# Let's unstage them. Be careful. This
git restore --staged .

git diff

# Adding and committing (we are in feature/f2)
...
git commit -m "add f2, change f1"
```

There's still something we need to do: removing the last commit from main. So:

```bash
cd ..
cd main
git reset --hard HEAD~1
```

</br>
