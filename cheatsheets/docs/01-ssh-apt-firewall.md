# VPS (Hardening)

(_Most of the content is based on 'Nginx Perfect Server'._)

First make sure `~/.ssh` folder exists on your **home computer**.
```sh
cd ~

# creates .ssh folder if it does not exist.
mkdir .ssh 
```

## SSH (Part 1)

Now let's **login to the VPS** using root. You should find IP and root username & password of your VPS on dashboard of your Hosting provider.

```sh
ssh <user>@<ip>

ssh root@95.179.129.251
# will ask: Are you sure you want to continue connection?
# type 'yes'
# type the password.

# logout of the server
exit
```

**BTW 1**: If you see _'System restart required'_ or _'Pending kernel upgrade'_ on your first login; it is ok. As part of server creation process, the hosting provider usually runs an `apt update` command. Simply run `sudo reboot`. Give the server a little while to reboot & then login (ssh) again.

Now, the server's fingerprint should be stored in `~/.ssh/known_hosts` on your home computer.  

In case you want to **remove server's fingerprint** run below. Actually, the only time you need is when you've destroyed the server or you want to reinstall the server distribution.

```sh
ssh-keygen -R 95.179.129.251
```

</br>

## Non-root (Part 2)

Let's change the root user password.

```sh
passwd 
# type the password
 
```

Note: see also [changing password](#changing-password-of-a-user) below.

> <span style="color: brown;">**WARNING**</span>  
> If you lose the root password, there is NO WAY to recover that.

Now, let's add a non-root user.

```sh
adduser andrew 
# type the password for the user

cd /home

ls -lash
# 'andrew' directory should be listed.
```

By default, the Hosting provider may have some extra default users. (btw, How did we find out? result of `ls -lash` in home directory above).

If you don't need them, you can delete them:
```sh
deluser linuxuser123 --remove-home
```
The second parameter means **remove user's home directory** as well.

#### Changing password of a user
```sh
passwd andrew
```

#### Non-root User

Now, let's make the user non-root. First we need to ensure nano is **set as default editor**.

```sh
update-alternatives --config editor
```

Now:
```sh
visudo
# opens etc/sudoers.tmp
```

> <span style="color: brown;">**WARNING**</span>  
> Never open the sudoers via ~~`nano /etc/sudoers.tmp`~~. That may corrupt the file.

Now inside the file, find section _# User privilege specification_. Insert the following line below `root   ALL...`
```sh
andrew[tab] ALL=(ALL:ALL) ALL
```

The first `ALL` means the rule will apply to all hosts.  
The fourth `ALL` means there is **NO restriction** on which command andrew user can run with `sudo`.

Now save & exit.

BTW, _dreams of code "Setting up a production-ready VPS"_ uses `usermod` instead. There is no difference though (based on [this SO](https://unix.stackexchange.com/questions/476416/adding-a-user-to-sudo-group-vs-creating-a-sudoers-file)).

```sh
usermod -aG sudo andrew
```

</br>

#### Prevent root login

You need to edit `sshd_config` file. 

> <span style="color: dodgerblue;">**NOTE**</span>  
> Whenever you edit a configuration file, you need to restart the service associated with the config.

```sh
cd /etc
cd ssh
# you may create a backup first: sudo cp /etc/ssh/sshd_config /etc/ssh/sshd_config.bak`
nano sshd_config
```

Note: There must be **no directive above the `Include ...` directive**. So if you see a line `PermitRootLogin yes`, you **MUST** first move it **below** the `Include ...` directive.

Now save & exit. This was the initial editing we had to make.  
Now, let's take a look at override files.

```sh
cd sshd_config.d
nano <filename>
```

If there is no file, simply create one: 50-cloud-init.conf.  
Any directives in this file, will **override** the sshd_config file.  
(are you sure? see [this SO](https://superuser.com/a/1142813) and [early include files](https://serverfault.com/a/1094096))

Add `PermitRootLogin no` at the **end** of override file. If the file has such directive with value `yes`, simply change the value to `no`.

Although you might have `PermitRootLogin yes` in your `sshd_config` **file**; that rule will be override by the override file.

Now let's restart ssh service:
```sh
systemctl restart ssh

exit
```

Let's re-login to check if new configuration is working.
```sh
ssh root@95.179.129.251
# should see: Permission denied.

# Now:
ssh andrew@95.179.129.251
# should be able to login as non-root user.
```

#### clear sudo password cache
```sh
sudo -k
```

### SSH change port

Note, since sshd now uses socket-based activation Ubuntu 22.10 or later, running `sudo systemctl restart sshd` after changing `sshd_config` is **NOT enough**.
However, first answer of [here](https://askubuntu.com/a/1439482) is ~~not needed~~; i.e. you _don't have to_ touch socket settings.. [The other answer](https://askubuntu.com/a/1534466) works fine for Ubuntu 24.04. Just run all of these in order:
```sh
sudo systemctl daemon-reload
sudo systemctl restart ssh.socket
sudo systemctl restart ssh.service
```

BTW, **DON'T** use ~~222~~ or ~~2222~~; they are also well-known ports for scanners.


### Theory (OpenSSH vs ssh)

Let's ask the package manager. So, what is the difference? aptitude install openssh-server will install only, and only `openssh-server`. aptitude install `ssh` will **both install** `openssh-server` and `openssh-client`, but unless you have a very strange configuration, you almost certainly already have openssh-client. ([here](https://askubuntu.com/a/814737))

</br>

## SSH Key

### Why use ssh-key (instead of password authentication)?

using Keys is like having a long 2000 character password (well technically its even more strength) as compared to what you can key in manually in a terminal.  

Also, using ssh keys do have one unique feature compared to password login: you can specify the allowed commands. This can be done by modifying ~/.ssh/authorized_keys file at the server. ([here](https://serverfault.com/a/334483))

You can get the best of both worlds by allowing password authentication **only from within your network**. ([here](https://serverfault.com/a/334482))

The real vulnerability with password authentication is: When you log in with a password you transmit your password to the server. This means when you connect to the wrong server because of a typo, you've sent your password to them. With public key authentication, they cannot obtain your private key as only your public key every goes to the server. (same source)

### Generate ssh key pair

Generating key pairs is done locally on home computer.

```sh
# on your home computer (NOT the server)

cd ~
ssh-keygen -t rsa -b 4096 
# Enter file in which ... (type the following)
[...]   .ssh/server200_keys
# Enter passphrase (P.S.1)
```

P.S.1 (theoretical): Passphrase encrypt your private key. You will **only** be able to login to the server when you decrypt the private key using this passphrase.

\[P.S.2\]: Here we've used RSA. but you can optionally use ed25519. 

#### Ed25519

_(based on [this blog](https://www.brandonchecketts.com/archives/ssh-ed25519-key-best-practices-for-2025) and yt comments)_

It is advisable to use ed22519. Though it is incompatible with systems that are older than 2015 or so.

The main factor that caused the author of Practical Cryptography WIth Go to declare that ED25519 is more secure than RSA is that ED25519 is more robust against PRNG (Pseudo-Random Number Generator) failures. (based on [SO](https://security.stackexchange.com/a/238255))

```sh
ssh-keygen -t ed25519 -f ~/.ssh/your-key-filename -C "your-key-comment"
```

You may see also [github ssh instructions](https://docs.github.com/en/authentication/connecting-to-github-with-ssh/generating-a-new-ssh-key-and-adding-it-to-the-ssh-agent).

</br>

Now, we need to copy the public key to the server:

> <span style="color: brown;">**WARNING**</span>  
> If you forget `-i` flag, it will copy **all your keys** found in ~/.ssh folder.

```sh
# still on your home computer (NOT the server)

ssh-copy-id -i .ssh/server200_keys.pub andrew@95.179.129.251
# type the password of 'andrew' user (P.S.2)

# now ssh into server using the PRIVATE key:
ssh -i .ssh/server200_keys andrew@95.179.129.251
# type the passphrase
```

P.S.2: The password that you gave, when creating the user (or when changing via `passwd`); NOT ~~the ssh key-pair passphrase~~.

Now that we can login using ssh key, let's **turn off password authentication** (but why? see [this SO](https://serverfault.com/a/334483)).

```sh
cd /etc/ssh
cd sshd_config.d
sudo nano 50-cloud-init.conf
```

Add (or modify) the following rule. btw, according to Jay (linuxTV) this tweak gives the most additional security. Also, it is highly recommended to also set `UsePAM no` (dreams of code & [this SO](https://unix.stackexchange.com/a/673581)):


```sh
PasswordAuthentication no

# maybe?
UsePAM no
```

Don't forget to **restart the ssh service**.

Now let's check password authentication is disabled:
```sh
exit

ssh -o  PreferredAuthentication=password  -o PubkeyAuthentication=no andrew@95.179.129.251
```

> <span style="color: brown;">**WARNING**</span>  
> Now, if you lose your ssh key files, you will lose access to the server. so make sure to backup those files on a USB, etc.

</br>

## SSH Config File

Trying to remember ip addresses & usernames is not good. Instead we use config file with aliases. The config file is created **locally** on home computer.

```sh
cd ~
nano .ssh/config
# 🔷 it might be located in /etc/ssh/config
```

\[BTW\]: Here, we modified ssh **client** config, not sshd **daemon**. see [this SO](https://serverfault.com/a/343534).

Now add the following lines. `Host` is the alias. `User` is the non-root user. `ServerAliveInterval` (and etc) will prevent getting disconnected after a short period of time.

```js
Host server200
Hostname 95.179.129.251
User andrew
IdentityFile ~/.ssh/server200_keys
ServerAliveInterval 60 
ServerAliveCountMax 120
```

Save & close.  
Now you can ssh into the server using: `ssh server200`

btw, You can add **another** server in the same `config` file. Simply add a blank line in between, then write those 6 variables for the new server.

### (More) SSH Hardening

_(btw, 'Firewall' and 'fail2ban' are also related)_


Add the following in `sshd` config (or an override file). Note, we are not locking the root account; we're disabling root login via ssh. btw, make sure you have another user account **already setup before** disabling `PermitRootLogin`. Otherwise, you'll be **locked out of your server**.

```sh
PermitRootLogin no
```



</br>

## Packages

_(read 'apt' section as well)_

Note 1, `sudo apt update` does NOT install the packages; it just updates the list of available packages.

**Note 2**: When the upgrades are being installed by `apt` you might be prompted to override an existing configuration file. The best action is to type `no`. (otherwise you will lose all of your modifications).

in summary:

```sh
# ssh into the server, then:
sudo apt update
sudo apt upgrade

# to remove unnecessary packages:
sudo apt autoremove

# P.S.3
sudo reboot
```

P.S.3: The first time you do update & upgrade, it is highly recommended you reboot the server. Also when you upgrade to a new kernel, too.

> <span style="color: dodgerblue;">**NOTE**</span>  
> Run update, upgrade & autoremove at least three times a **week**.

</br>


## apt

#### `apt upgrade` VS `apt-get upgrade` 

_Problem:_ (Ubuntu 18.04) I changed to to use apt instead of apt-get. What was weird for me is that `sudo apt dist-upgrade` has no effect anymore(??).  I do the update and upgrade using sudo apt update and sudo apt upgrade.

_[Answer](https://askubuntu.com/a/1112567):_  

- `apt-get upgrade` only upgrades the apps, tools, and utilities. It **does not install new Linux kernel** of the OS. This is the essential point. `apt-get upgrade` (not ~~`apt`~~) **will not remove or add** packages. If a fix to a package requires a new package, the update will be **held back**, which you revised to be less accurate, is better and I'd advise readers to go to that one. ([this comment](https://askubuntu.com/a/99157))

- `apt upgrade` upgrades the apps, tools, and utilities and **installs new Linux kernel** of the OS. However, it **never removes** old packages. 

</br>

#### `apt full-upgrade` vs `dist-upgrade`:

- `apt full-upgrade` upgrades the apps, tools, and utilities and installs new Linux kernel of the OS. It **also removes** old packages if needed for the upgrade. `sudo apt-get dist-upgrade` is preferred.  

- The word `dist-upgrade` is misleading and confusing. For example, this **does NOT** upgrade from Ubuntu 16.04 to Ubuntu 18.04. It only upgrade the kernel, and other stuff, within Ubuntu 16.04.

- _(From a comment)_ **Careful!!** They are NOT the same command. I just ran sudo apt-get full-upgrade and it automatically **removed some crucial** packages in order to upgrade some trivial ones. I'm now spending the last hour of my work day fixing the mess. I routinely run `sudo apt-get dist-upgrade` and it performs the correct upgrades. This is the **preferable command**. ([this SO](https://askubuntu.com/a/770140))


BTW, _comment_: Is there anything about apt that is not confusing?! Why are there 3 variations of apt? ... Why does purge uninstall a package instead of purging it from the cache?

---

### `sources.list` on Ubuntu 24.04

In Ubuntu 24.04 and later Ubuntu software sources have been moved to `/etc/apt/sources.list.d/ubuntu.sources`. 

Ubuntu 24.04 uses **a new format** for managing sources. Sources are stored in separate files within the /etc/apt/sources.list.d/ directory, each named with a `.list` or `.sources` extension (example: ondrej-ubuntu-php-noble.sources).  
When you add a PPA source, it usually creates a new file within this directory specific to that PPA. The PPA information goes into this new file, **NOT the existing** ubuntu.sources file.

(based on [SO](https://askubuntu.com/a/443075))

### PPA and keyserver(s)

`apt-key` is a utility used to manage the keys that APT uses to authenticate packages. It’s closely related to the `add-apt-repository` utility, which adds external repositories using keyservers to an APT installation’s list of trusted sources. However, keys added using apt-key and add-apt-repository are trusted globally by apt. These keys are **not limited** to authorizing the single repository they were intended for. Any key added in this manner can be used to authorize the addition of any other external repository, presenting an important security concern.

The current best practice is to use `gpg` in place of apt-key and add-apt-repository, and in future versions of Ubuntu it **will be the only option**.

Read more in [digital ocean article](https://www.digitalocean.com/community/tutorials/how-to-handle-apt-key-and-add-apt-repository-deprecation-using-gpg-to-add-external-repositories-on-ubuntu-22-04). Also, [this SO](https://unix.stackexchange.com/questions/717434/apt-key-is-deprecated-what-do-i-do-instead-of-add-apt-repository) about add-apt-repository warning states the same.




</br>

## Firewall

First off, Cloud firewall works in conjugation with OS Firewall. Some hosting providers do _not_ have Cloud firewall feature.

`uwf` (uncomplicated firewall) default policy: deny all incoming, allow all outgoing.  
First check the status of uwf. Then we will add port 80 (http) and 443 (https tcp & udp). Be careful, that if you miss adding http and https, all programs and services using the Internet (e.g. `apt`) will fail.

```sh
sudo ufw status verbose 
# if prints 'inactive' it means ufw is disabled.

# --- (only if inactive) ---
# we need to define default policy
sudo ufw default deny incoming
sudo ufw default allow outgoing
# -------

sudo ufw allow http
sudo ufw allow https/tcp
sudo ufw allow https/udp

# 🔶 don't forget to add ssh port (otherwise you'll be locked out)
sudo ufw allow in 12193

# to see the list when ufw is still inactive:
ufw show added

# --- (only if inactive) ---
sudo ufw enable
# -------

# we need to reload the service
sudo ufw reload
# (highly recommended)
sudo reboot


# after reboot, login again
ssh server200
# check ufw status
sudo ufw status verbose
```

In order to configure Cloud firewall, your hosting provider should have a section in its dashboard. It is recommended to restrict ssh to your IP address only.

#### ufw is `active (exited)`

If you run `sudo systemctl status ufw` you'll probably see `active (exited)`. it is completely normal. see comment below [this](https://unix.stackexchange.com/a/631560).

### Docker and ufw

when you expose container ports using Docker, these ports **bypass** your firewall rules. Docker routes container traffic in the `nat` table, which means that packets are diverted before it reaches the INPUT and OUTPUT chains that ufw uses. Packets are routed before the firewall rules can be applied, effectively **ignoring your firewall configuration**. ([docker](https://docs.docker.com/engine/network/packet-filtering-firewalls/#docker-and-ufw))

</br>

## fail2ban

Note, 24.04.0 has an issue when installing `fail2ban` via apt. So you need to download `.deb` package from its github repo. Go to 'Releases' section. Copy the **url** for fail2ban_1.1.0-1.upstream1_all.deb. Head to your server.

```sh
wget -O fail2ban.deb <copied-url>

# verify it is downloaded
ls -lash

sudo dpkg -i fail2ban.deb

# install failed/missing dependencies that fail2ban relies on
sudo apt -f install

sudo systemctl status fail2ban
```

Note: if a **newer version of fail2ban** is released, you can update via `apt` (i.e. update, upgrade, autoremove).

### Configuration

The main configuration file is `jail.conf`. But, like ssh, we try not to modify this file directly. We make use of overwrite file (conventionally named `jail.local`).

Fail2ban explicitly says in beginning of `jail.conf`: you should NOT modify this file. It will probably be overwritten or improved in a distribution update. If you `less jail.conf` you can find a bunch of useful info.


```sh
cd /etc/fail2ban
# copy jail.conf
sudo cp jail.conf jail.local

# use 'sudo' because we are going to working with a configuration file
sudo nano jail.nano
```

Find `bantime` directive (BTW, jail.local may not exist at all, so you may have to create it, and of course it'll be empty). The default is 10 minutes which is **far too short**. Specify seven days `7d`.  Change `findtime` to `3h` (three hours). Change `maxretry` to `3`.  
The current config means if you hit 3 failed attempts in 3 hours, on the 3rd attempt, your host (source ip) will be banned for 7 days.

Find `ignoreip` directive (probably commented out by default). If you have a **static** ip, append your ip at the **end**:
```sh
ignoreip = 127.0.0.1/8 ::1 12.13.14.15
                           ^^^^^^
```

Find `[sshd]`. Under this section, change `mode` from `normal` to `aggressive`. It will catch more attacks. Then **after** `backend ...`, add `enabled = true`.

Now restart fail2ban service. `sudo systemctl restart fail2ban`

fail2ban stores its logs in `/var/log/fail2ban.log` file.

BTW, in order for fail2ban to work for `sshd`, it may be **required** to also add `sshd_backend = systemd` and `port` under `[sshd]` section ([SO](https://serverfault.com/a/1053650)). The following is a minimal `jail.local` config (mostly based on [this](https://serverfault.com/q/1032942)):

```ini
[DEFAULT]
bantime = 2m
ignoreip = 127.0.0.1/8
maxretry = 3
findtime = 1m

[sshd]
enabled = true
port    = ssh,20198
```

### Unban

You may get locked out of your server. Most of the time rebooting your **router** will allocate a new ip to your home computer.  
If that did not work, first google 'what is my IP' and make a note of your home ip address. Then use web hosting 'Console' (or 'Terminal') access (somewhere in the dashboard).  
Login as the `root` user. Enter password.
```sh
cd /var/log

cat fail2ban.log
# you should see your ip address in the log file.

fail2ban-client set sshd unbanip <your-ip>

cat fail2ban.log
# make sure unban log is there
```

If you want to see the status & list of banned ip addresses for ssh:
```sh
sudo fail2ban-client status sshd
```
