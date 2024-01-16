## noninteractive
According to https://serverfault.com/a/797318, 
It should be actively discouraged to set the DEBIAN_FRONTEND to noninteractive via ENV. The reason is that the environment variable persists after the build, e.g. when you run docker exec -it ... bash. The setting would not make sense here.

There are two other possible ways:

Set it via ARG as this only is available during build:
```
ARG DEBIAN_FRONTEND=noninteractive
RUN apt-get -qq install {your-package}
```

Set it on-the-fly when required.

```
RUN apt-get update && \
    DEBIAN_FRONTEND=noninteractive apt-get -qq install {your-package}
```

#### but what is DEBIAN_FRONTEND?
according to https://askubuntu.com/a/972528:
noninteractive: This is the anti-frontend. It never interacts with you  at  all, and  makes  the  default  answers  be used for all questions. It might mail error messages to root, but that's it;  otherwise  it is  completely  silent  and  unobtrusive, a perfect frontend for automatic installs. If you are using this front-end, and require non-default  answers  to questions, you will need to preseed the debconf database; see the section below  on  Unattended  Package Installation for more details.


## software-properties-common
software-properties-common is a software package in Linux that provides an abstraction of the used apt repositories. It simplifies the process of adding and removing PPAs, making it easier to install software from these sources. Without software-properties-common, you would need to manually edit the /etc/apt/sources.list file to add or remove repositories. You can do this with the following command: sudo apt-get install software-properties-common

#### but what is ppa?
Based on https://help.launchpad.net/Packaging/PPA:  
Using a Personal Package Archive (PPA), you can distribute software and updates directly to Ubuntu users. Create your source package, upload it and Launchpad will build binaries and then host them in your own apt repository. That means Ubuntu users can install your packages in just the same way they install standard Ubuntu packages and they'll automatically receive updates as and when you make them. Every individual and team in Launchpad can have one or more PPAs, each with its own URL.  
Always remember that PPAs are provided by the community, you should be aware of the possible risks before just adding a PPA.

#### add-apt-repository
Based on https://askubuntu.com/a/20691:
add-apt-repository adds a PPA to your list of sources, (importing the GPG public key of the PPA automatically), so that Ubuntu knows to look for updates from that PPA as well as from the official Ubuntu sources. Usually this is used by developers to provide updates more quickly than in the official Ubuntu repositories.
apt-get update tells APT to update its database of what packages can be installed and where to install them from. In this case, apt-get will see your newly-added PPA


</br>

## sh
According to https://askubuntu.com/a/263530:
sh stands for "shell" and shell is the old, Unix like command line interpreter. An interpreter is an program that executes specific instructions written in a programming or scripting language. So basically you say "Execute that file for me".  
You must understand that Linux doesn't really look at the file extension in order to determine what the file (or program) is. So as long as the content of that file is written in a way that the sh interpreter understands, it will work. But just for the sake of readability, such files are normally given an .sh extension and I have no idea what the developer was thinking when he gave that file a .txt extension.


## Error six
See https://askubuntu.com/a/1240327. But ipython3 is very large (190MB to download and 900 installation!).
Quite a new bug in 2024:
Also https://www.mail-archive.com/touch-packages@lists.launchpad.net/msg363219.html.


## ansible
Make sure http://ppa.launchpad.net/ansible/ansible/ubuntu/dists/ contains the ubuntu image version you are using in your dockerfile. We used noble and it was missing and resulted in The repository 'https://ppa.launchpadcontent.net/ansible/ansible/ubuntu noble Release' does not have a Release file at 2024-01-16.

Similar happened for ubuntu 20, see https://github.com/ansible/ansible/issues/68645.