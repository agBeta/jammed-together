# Ubuntu

## logging

```sh
car /etc/os-release
ls /var/log

# kernel logs (very good for hardware troubleshooting)
cat /var/log/dmesg

journalctl -u ssh
journalctl -u docker
```

### logrotate

See: 
- [How to View and Configure Linux System Logs (betterstack)](https://betterstack.com/community/guides/logging/how-to-view-and-configure-linux-logs-on-ubuntu-20-04/): This article explains what are `rsyslogd` and `logrorate` daemon and some other fundamental concepts.

- [A Complete Guide to Managing Log Files with Logrotate (betterstack 2025)](https://betterstack.com/community/guides/logging/how-to-manage-log-files-with-logrotate-on-ubuntu-20-04/): This article assumes you already know the previous article.



</br>

## apt

### `sources.list` on Ubuntu 24.04

In Ubuntu 24.04 and later Ubuntu software sources have been moved to `/etc/apt/sources.list.d/ubuntu.sources`. 

Ubuntu 24.04 uses **a new format** for managing sources. Sources are stored in separate files within the /etc/apt/sources.list.d/ directory, each named with a `.list` or `.sources` extension (example: ondrej-ubuntu-php-noble.sources).  
When you add a PPA source, it usually creates a new file within this directory specific to that PPA. The PPA information goes into this new file, **NOT the existing** ubuntu.sources file.

(based on [SO](https://askubuntu.com/a/443075))

---

### `dist-upgrade`? `full-upgrade`?

You may see [this SO](https://askubuntu.com/a/1426570), BUT note that all of explained commands in that answer are for `apt-get` (not ~~`apt`~~). From the link:

`apt-get update`:

- The update command updates the package list with the latest available versions
- It won't upgrade the installed packages just update the package list with a new version
- To upgrade need to run the upgrade command

`apt-get upgrade`:

- To update the already installed packages to the latest available version
- It will upgrade only the installed packages that already available to the latest version version
- If the dependencies are missed the current version will be kept **without any upgrade**

- Besides what Eliah mentioned, the essential point is that `apt-get upgrade` **will not remove or add packages**. If a fix to a package requires a new package, the update will be **held back**, which you revised to be less accurate, is better and I'd advise readers to go to that one. ([this comment](https://askubuntu.com/a/99157))


#### `apt full-upgrade` (Ubuntu 18.04)

(_based on [another SO](https://askubuntu.com/a/1112567)_)

_OP:_ ... I changed to to use `apt` instead of `apt-get`. What was weird for me is that `sudo apt dist-upgrade` has no effect anymore (??).  I do the update and upgrade using `sudo apt update` and `sudo apt upgrade`.

_Answer:_  

 `apt-get upgrade` only upgrades the apps, tools, and utilities. It **does not install new Linux kernel** of the OS.

`apt upgrade` upgrades the apps, tools, and utilities and **installs new Linux kernel** of the OS. However, it **never removes** old packages.

`apt full-upgrade` upgrades the apps, tools, and utilities and installs new Linux kernel of the OS. It **also removes** old packages if needed for the upgrade.

==> **BUT** Apparently, `apt full-upgrade` and `apt-get dist-upgrade` commands are <span style="color:red;">**NOT the same**</span>. see [this section](#is-full-upgrade-same-as-dist-upgrade).

I think the dist-upgrade was a **bit confusing**. For example, this **does NOT** upgrade from Ubuntu 16.04 to Ubuntu 18.04. It only upgrade the kernel, and other stuff, within Ubuntu 16.04.

BTW, _comment_:  
Is there anything about apt that is not confusing?! Why are there 3 variations of apt? ... Why does purge uninstall a package instead of purging it from the cache?

#### Is `full-upgrade` same as `dist-upgrade`?

According to [this SO](https://askubuntu.com/a/770140): **No**.

"full-upgrade" is about removing installed packages when necessary, while "dist-upgrade" is about "intelligently handling changing dependencies with new versions of packages".  
(based on [manpages](https://manpages.ubuntu.com/manpages/jammy/en/man8/apt-get.8.html))

_(From a comment)_  
**Careful!!** They are NOT the same command. I just ran sudo apt-get full-upgrade and it automatically **removed some crucial** packages in order to upgrade some trivial ones. I'm now spending the last hour of my work day fixing the mess. I routinely run sudo apt-get dist-upgrade and it performs the correct upgrades. This is the preferable command.

---

### PPA and keyserver(s)

`apt-key` is a utility used to manage the keys that APT uses to authenticate packages. It’s closely related to the `add-apt-repository` utility, which adds external repositories using keyservers to an APT installation’s list of trusted sources. However, keys added using apt-key and add-apt-repository are trusted globally by apt. These keys are **not limited** to authorizing the single repository they were intended for. Any key added in this manner can be used to authorize the addition of any other external repository, presenting an important security concern.

The current best practice is to use `gpg` in place of apt-key and add-apt-repository, and in future versions of Ubuntu it **will be the only option**.

Read more in [digital ocean article](https://www.digitalocean.com/community/tutorials/how-to-handle-apt-key-and-add-apt-repository-deprecation-using-gpg-to-add-external-repositories-on-ubuntu-22-04). Also, [this SO](https://unix.stackexchange.com/questions/717434/apt-key-is-deprecated-what-do-i-do-instead-of-add-apt-repository) about add-apt-repository warning states the same.


</br>

## OpenSSH

open ssh config file `/etc/ssh/sshd_config`. First make a backup: `sudo cp /etc/ssh/sshd_config /etc/ssh/sshd_config.bak`.

Now in the config file consider these tweaks.

### Change default port 22

See [this SO](https://security.stackexchange.com/questions/32308/should-i-change-the-default-ssh-port-on-linux-servers) for pros and cons of changing default port. But the general consensus **recommends** changing the default port. 

Also Modern Linuxes often ship with an kernel layer MAC and/or RBAC systems. Depending on how this system is configured it may, by default, forbid `sshd` from binding to a non-standard port. If your kernel has these layers, you need some extra steps.  
Anyway, **never disable** these kernel layers (if they exist), because they give lots of security benefits. The tutor (Jay) in the video says the same (_minute 09:20_).

putting SSH on a port other than 22 will make more unlikely to be hit with a random automated scan. In general it is worth-doing.

Do **not** use ~~222~~ or ~~2222~~; they are also well-known ports for scanner. The tutor also warns about this (_minute 08:20_).

```sh
Port 10293
```

Save. restart ssh: `sudo systemctl restart sshd`

### Disable ssh as root

You need to have another user account. 

(_this user part is based on dreams of code "Setting up a production ready VPS"_)

```sh
adduser elliott

# ensure you can elevate user's access with sudo
usermod -aG sudo elliott
# alternatively you could edit sudoers file. see VPS self-docs.

# testing
su - elliott
sudo ls /
```

Also based on dreams of code, make sure the new user (elliott) _on the VPS_ has the copy of ssh public key (here, the same ssh key we used for the first ssh as root), so that you can ssh as elliott. Here is how you do it for a custom port (based on [this SO](https://askubuntu.com/a/265646)).

> <span style="color: brown;">**WARNING**</span>  
> If you omit write the `-i` flag, it will copy **all your keys** found in ~/.ssh folder.

```sh
ssh-copy-id -i <path-to-public-key> "<username>@<ip or hostname> -p<ssh-port>"
```

Now, in sshd config file, add the following.

Note, we are not locking the root account. We're just disabling root login via ssh.

```sh
# change this ONLY AFTER you created another user account for ssh
PermitRootLogin no
```

Save & restart ssh.


#### Password Authentication

The problem with password authentication is that if you can get a password prompt, then other people can also get this password prompt (and brute force). So we disable it.  
**BUT** before disabling, you must have you ssh keys already setup. Otherwise, you will be locked out of your server.

This tweak gives the most additional security.

```sh
PasswordAuthentication no
```

According to dreams of code & [this SO](https://unix.stackexchange.com/a/673581), it is highly recommended to also set:

```sh
UsePAM no
```

> <span style="color: brown;">**WARNING**</span>  
> There might some override files in `/etc/ssh/sshd_config.d/` (such as conventional `50-cloud-init.conf` file) that may override `PasswordAuthentication` or other settings. Make sure you also take a look those files.

_see also VPS: 01-ssh-apt-firewall.md self-docs._

Now, restart sshd and test:

```sh
# on VPS
sudo systemctl restart sshd

# you might get logged-out of your ssh session.

# on laptop
ssh root@3.123.232.3
# alternatively, if you have setup DNS records (and they are already propagated), you could run instead: ssh root@example.com

# should print: Permission denied, due to 'PermitRootLogin no'.
```

#### Firewall

Add firewall rules to allow ssh login only from specific ip addresses. This tweak is most effective if you have static ip address. (Maybe you can limit ip addresses to a region or subnet.)

#### Ed25519

_(based on [this blog](https://www.brandonchecketts.com/archives/ssh-ed25519-key-best-practices-for-2025) and yt comments)_

It is advisable to use ed22519. Though it is incompatible with systems that are older than 2015 or so.

The main factor that caused the author of Practical Cryptography WIth Go to declare that ED25519 is more secure than RSA is that ED25519 is more robust against PRNG (Pseudo-Random Number Generator) failures. (based on [SO](https://security.stackexchange.com/a/238255))

```sh
ssh-keygen -t ed25519 -f ~/.ssh/your-key-filename -C "your-key-comment"
```

You may see also [github ssh instructions](https://docs.github.com/en/authentication/connecting-to-github-with-ssh/generating-a-new-ssh-key-and-adding-it-to-the-ssh-agent).


</br>

### Bash History

```sh
history
```

in `.bashrc`, you may add `HISTCONTROL=ignoreboth` to prevent history for commands that start with a space.


### Docker

You may need to run these commands after installing docker:

```sh
# if docker not enabled
sudo systemctl enable docker
sudo systemctl status docker

# add user to docker group (so that the user doesn't need to use 'sudo' for docker)
sudo usermod -aG docker elliott
```

</br>

### Docker stack

```sh
docker context create example-vps --docker "host=root@example.com"
# alternatively: "host=root@129.234.6.23"

docker context ls

docker context inspect example-vps

docker context use example-vps
# You can also set the current context using the DOCKER_CONTEXT environment variable
```

The new context is stored in a meta.json file below `~/.docker/contexts/`. Each new context you create gets its own `meta.json` stored in a dedicated sub-directory of `~/.docker/contexts/`. _(based on [docker context](https://docs.docker.com/engine/manage-resources/contexts/#create-a-new-context))_

Back to docker stack...  
Now you need to enable swarm mode.

> <span style="color: brown;">**WARNING**</span>  
> Enabling swarm mode may create a new set of challenges. One of them: losing client's ip address when load balancing.  
(_see [load balancing](#load-balancing) section_)

```sh
# after setting example-vps as the active context (via 'docker context use ...')

docker swarm init
```

What does this command do? Initializes a swarm. The Docker Engine targeted by this command becomes **a manager** in the _newly_ created **single-node** swarm. (based on [docker docs](https://docs.docker.com/reference/cli/docker/swarm/init/))

Now, deploy the application using:

```sh
docker stack deploy -c ./compose.yml example-stack
```

This will deploy the application.

Note, if were to use `docker compose` we had problems managing secrets. Because if you use relative path for secrets file, it will resolve in local machine. If you use absolute path, then you should have the same on the local machine (i.e. laptop) in order for docker compose to work locally.

We can use `docker secret`.

--- 

\[BTW\] some people say docker swarm might be an overkill. For managing secrets, you can use another approach (based on [this reddit](https://www.reddit.com/r/selfhosted/comments/1g0eaaj/is_docker_swarm_overkill/?chainedPosts=t3_dtgdi2)):  

you could use `pass`? And then in your start up script do `docker run -e ENV=$(pass secret)`? If you are using compose, you can interpolate the variables in the compose files `ENV=$(pass secret) docker compose up -d`. If you need automated deployment, you can chmod 700 env file. `docker run --env-file .env ....` .

---

back to `docker secret` ...

```sh
docker secret create db_password -
# enter the password. dash means read from stdin.

# alternatively from a file:
docker secret create db_password ./password.txt

# or
printf "secret_pass123" | docker secret create db_password -
```

Now to verify the secret is created, run the following. As you can, we can never retrieve the actual value of this `db_password` secret via docker. This is exactly what we want. **BUT** make sure you store the actual secrets somewhere else so that you won't lose them if the VPS goes down or gets deleted.

```sh
docker secret ls

docker secret inspect <ID>
# the result does not include actual value for the secret
```

Now, you just need to specify the secrets in `compose.yml` file:

```yml
services:
  ...

  db:
    ...
    secrets:
      - db_password
    environment:
      ...
      - POSTGRES_PASSWORD_FILE=/run/secrets/db_password

...

secrets:
  db_password:
    external: true
```

**Note**: why `..._FILE`?  

If you develop a container that can be deployed as a service and requires sensitive data, such as a credential, as an environment variable, consider adapting your image to take advantage of Docker secrets. One way to do this is to ensure that each parameter you pass to the image when creating the container **can also be read from a file**.

The WordPress image has been updated so that the environment variables which contain important data for WordPress, such as `WORDPRESS_DB_PASSWORD`, **ALSO** have variants which can read their values from a file (`WORDPRESS_DB_PASSWORD_FILE`). This strategy ensures that backward compatibility is preserved, while allowing your container to read the information from a Docker-managed secret instead of being passed directly.

_(based on [secret docs](https://docs.docker.com/engine/swarm/secrets/#build-support-for-docker-secrets-into-your-images))_


#### Blue/Green deployment

In compose file add the following for, say, `web` (nodejs) service:

```yml
    ...
    deploy:
      mode: replicated
      replicas: 2
      ... # and other deploy settings
      # ⬇️
      update_config:
        order: start-first
        parallelism: 1
```

read more about [`update_config` setting](https://docs.docker.com/reference/compose-file/deploy/#update_config).

**Note**, `update_config` setting **does NOT work** when using ~~`docker compose`~~. You MUST use `docker stack`.  

The reason is that the specification for both docker stack and docker compose is the same. There are other parts of the compose-file specification which are **ignored** by docker-compose or the stack commands. (based on [blog](https://vsupalov.com/difference-docker-compose-and-docker-stack/))

</br>

#### Load balancing

Docker stack has load-balancing built in (**UNLike** docker compose).

```sh
docker service scale example-stack_web=3

# if you curl the endpoint, you will the load balancing in action
# follow the logs:
docker service logs example-stack_web -f
```

If **we were to** use `docker compose scale ...` command, we would have encountered an error. Because we could only bind a single instance to a port. This is **why a compose file usually contains a reverse-proxy** (such as Traefik or Nginx).

**However** we should still use Traefik or Nginx. Because they also take care of TLS, and many other things.

<span style="color: red;">**BUT then a problem arises...**</span>. When using Traefik or Nginx in docker **swarm mode**, you will lose the client's real ip address.  
You can see there is no way to achieve this yet, based on [this open issue](https://github.com/moby/moby/issues/25526) and [docker-ingress-routing-daemon](https://github.com/newsnowlabs/docker-ingress-routing-daemon) project, and [this SO](https://serverfault.com/a/1128917). 

</br> 

#### Rollback

**Only** when you have swarm mode enabled (based on [docs](https://docs.docker.com/reference/cli/docker/service/rollback/)), you can run:

```sh
docker service rollback example-stack_web
```

---

### No Docker

_based on dreams of code "I tried deploying to a VPS without Docker"_

See also [`deploy.sh`](https://github.com/dreamsofcode-io/zenbin/blob/main/deploy/deploy.sh).

---

### Tips for Hardening 

- Patch your server

- Do Not make anything public to the internet unless you have no choice. Manually test from your phone to make sure that service is not accessible.

- Having fully tested backups

- Having continuity plans: What if tomorrow all your servers get hacked or get down or all your data gets wiped?

---

### Traefik

see [ChristianLempa boilerplate](https://github.com/ChristianLempa/boilerplates/tree/main/docker-compose/traefik).

```sh
docker network create frontend
```
